import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AppStateService } from '../../../services/app-state.service';
import { DatasourceService } from '../../../services/datasource.service';
import { GeminiService } from '../../../services/gemini.service';
import { ReportViewTrackingService } from '../../../services/report-view-tracking.service';
import * as XLSX from 'xlsx';
import { ReportConfig, FormattingConfig } from '../../../models/report.model';
import { DataSource, ColumnType } from '../../../models/datasource.model';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { BadgeComponent } from '../../../shared/components/badge/badge.component';

@Component({
  selector: 'app-report-viewer',
  standalone: true,
  imports: [CommonModule, RouterModule, ButtonComponent, BadgeComponent],
  templateUrl: './report-viewer.component.html',
  styleUrl: './report-viewer.component.scss'
})
export class ReportViewerComponent implements OnInit {
  report: ReportConfig | null = null;
  dataSource: DataSource | null = null;
  loading: boolean = true;
  error: string | null = null;
  data: any[] = [];
  displayedColumns: { key: string; label: string; formatting?: FormattingConfig; type?: ColumnType }[] = [];
  lastRun: Date | null = null;
  dataOrigin: 'live' | 'ai' | null = null;
  recordsCount: number | null = null;
  executionMs: number | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private appState: AppStateService,
    private datasourceService: DatasourceService,
    private geminiService: GeminiService,
    private viewTracking: ReportViewTrackingService
  ) {}

  ngOnInit(): void {
    const reportId = this.route.snapshot.paramMap.get('id');
    if (!reportId) {
      this.error = 'No report ID provided';
      this.loading = false;
      return;
    }

    console.log('[ReportViewer] Looking for report ID:', reportId);

    // Load report from state - wait for data to be available
    this.appState.reports$.subscribe(reports => {
      console.log('[ReportViewer] Reports in state:', reports.length);
      
      if (reports.length === 0) {
        // Still loading, wait a bit
        console.log('[ReportViewer] No reports loaded yet, waiting...');
        return;
      }

      this.report = reports.find(r => r.id === reportId) || null;
      
      if (!this.report) {
        console.error('[ReportViewer] Report not found. Available IDs:', reports.map(r => r.id));
        this.error = `Report not found. ID searched: ${reportId}`;
        this.loading = false;
        return;
      }

      console.log('[ReportViewer] Report found:', this.report.name);

      // Load data source
      this.appState.dataSources$.subscribe(dataSources => {
        console.log('[ReportViewer] DataSources in state:', dataSources.length);
        
        if (dataSources.length === 0) {
          console.log('[ReportViewer] No data sources loaded yet, waiting...');
          return;
        }

        this.dataSource = dataSources.find(ds => ds.id === this.report!.dataSourceId) || null;
        this.loading = false;
        
        console.log('[ReportViewer] DataSource found:', this.dataSource?.name || 'None');
        
        // Track that this report was viewed (fire and forget)
        const currentUser = this.appState.getCurrentUser();
        if (currentUser && this.report) {
          this.viewTracking.trackReportView(this.report.id, currentUser.id).subscribe({
            next: () => console.log('[ReportViewer] View tracked successfully'),
            error: (err) => console.error('[ReportViewer] Failed to track view:', err)
          });
        }
        
        // In a full implementation, this would fetch the actual data
        // For now, we'll show a placeholder
        this.fetchReportData();
      });
    });
  }

  fetchReportData(): void {
    if (!this.report || !this.dataSource) {
      this.error = 'Report or data source not found.';
      this.loading = false;
      return;
    }

    this.error = null;
    this.loading = true;
    this.data = [];
    this.displayedColumns = [];
    this.dataOrigin = null;
    this.recordsCount = null;
    this.executionMs = null;
    const start = performance.now();

    const isAiDatasource = this.dataSource.type === 'custom';

    // Validate columns
    if (!this.report.selectedColumns || this.report.selectedColumns.length === 0) {
      this.error = 'No columns selected for this report.';
      this.loading = false;
      return;
    }

    // Resolve selected table/view
    const tableIds = Array.from(new Set(this.report.selectedColumns.map(c => c.tableId)));
    if (tableIds.length !== 1) {
      this.error = 'Live data fetch supports a single table or view per report.';
      this.loading = false;
      return;
    }

    const tableId = tableIds[0];
    let table = (this.dataSource.tables || []).find(t => t.id === tableId);
    let isView = false;
    if (!table) {
      table = (this.dataSource.views || []).find(v => v.id === tableId);
      isView = !!table;
    }

    if (!table) {
      this.error = 'Table/View not found in the selected data source.';
      this.loading = false;
      return;
    }

    // Resolve columns
    const colNameMap = this.report.selectedColumns.map(sc => {
      const col = table!.columns.find(c => c.id === sc.columnId || c.name === sc.columnId);
      return {
        key: col?.name || sc.columnId,
        label: col?.alias || col?.name || sc.columnId,
        formatting: sc.formatting,
        type: col?.type as ColumnType | undefined
      };
    });
    this.displayedColumns = colNameMap;

    if (isAiDatasource) {
      // AI generated data
      this.geminiService.generateReportData(this.dataSource, this.report, 100).subscribe({
        next: (rows) => {
          this.data = rows || [];
          this.dataOrigin = 'ai';
          this.recordsCount = this.data.length;
          this.executionMs = Math.round(performance.now() - start);
          this.lastRun = new Date();
          this.loading = false;
        },
        error: (err) => {
          console.error('[ReportViewer] AI data fetch failed', err);
          this.error = 'Failed to generate AI data.';
          this.loading = false;
        }
      });
      return;
    }

    // Live data fetch
    const columnsForQuery = colNameMap.map(c => c.key);
    const filters = this.report.filters || [];
    const sorts = this.report.sorts || [];

    console.log('[ReportViewer] Applying filters:', filters);
    console.log('[ReportViewer] Applying sorts:', sorts);
    console.log('[ReportViewer] Query columns:', columnsForQuery);
    console.log('[ReportViewer] Table:', table.name);

    // Pass the full datasource object so the backend can resolve columnIds in filters to column names
    this.datasourceService.fetchTableData(
      this.dataSource,
      table.name,
      columnsForQuery,
      1000000, // Large limit to get all matching records
      filters,
      sorts
    ).subscribe({
      next: (rows) => {
        this.data = rows || [];
        this.dataOrigin = 'live';
        this.recordsCount = this.data.length;
        this.executionMs = Math.round(performance.now() - start);
        this.lastRun = new Date();
        this.loading = false;
      },
      error: (err) => {
        console.error('[ReportViewer] Live data fetch failed', err);
        this.error = 'Failed to fetch live data.';
        this.loading = false;
      }
    });
  }

  onBack(): void {
    this.router.navigate(['/reports']);
  }

  onRefresh(): void {
    this.loading = true;
    setTimeout(() => {
      this.fetchReportData();
      this.loading = false;
    }, 500);
  }

  get selectedColumnNames(): string[] {
    if (!this.report || !this.dataSource) return [];
    
    return this.report.selectedColumns.map(col => {
      const table = this.dataSource!.tables.find(t => t.id === col.tableId);
      const column = table?.columns.find(c => c.id === col.columnId);
      return column?.alias || column?.name || col.columnId;
    });
  }

  exportToExcel(): void {
    if (!this.report) return;
    if (!this.data || this.data.length === 0) {
      alert('No data to export.');
      return;
    }

    // Build a flat array using displayed columns with formatted values and aliases
    const exportRows = this.data.map((row) => {
      const out: any = {};
      this.displayedColumns.forEach((col) => {
        // Use formatted value instead of raw value
        const formattedValue = this.formatValue(row, col);
        out[col.label] = formattedValue;
      });
      return out;
    });

    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Report');

    const safeName = this.report.name?.replace(/[^a-z0-9]+/gi, '_') || 'report';
    const filename = `${safeName}_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(workbook, filename);
  }

  formatValue(row: any, col: { key: string; label: string; formatting?: FormattingConfig; type?: ColumnType }): string {
    const raw = row ? row[col.key] : undefined;
    if (raw === undefined || raw === null) return '';

    const fmt = col.formatting;
    const type = col.type;

    if (!fmt) {
      return typeof raw === 'object' ? JSON.stringify(raw) : String(raw);
    }

    switch (fmt.type) {
      case 'date': {
        const date = new Date(raw);
        if (isNaN(date.getTime())) return String(raw);
        const format = (fmt.config as any)?.format || 'YYYY-MM-DD';
        // Simple mapping to toLocaleDateString
        if (format === 'MM/DD/YYYY') return date.toLocaleDateString('en-US');
        if (format === 'DD/MM/YYYY') return date.toLocaleDateString('en-GB');
        if (format === 'YYYY-MM-DD') return date.toISOString().slice(0, 10);
        // Fallback
        return date.toLocaleString();
      }
      case 'number': {
        const cfg = fmt.config as any;
        const num = Number(raw);
        if (isNaN(num)) return String(raw);
        const dec = cfg?.decimalPlaces ?? 0;
        const thousand = cfg?.thousandSeparator;
        const prefix = cfg?.prefix || '';
        const suffix = cfg?.suffix || '';
        let str = thousand ? num.toLocaleString(undefined, { minimumFractionDigits: dec, maximumFractionDigits: dec }) : num.toFixed(dec);
        return `${prefix}${str}${suffix}`;
      }
      case 'currency': {
        const cfg = fmt.config as any;
        const num = Number(raw);
        if (isNaN(num)) return String(raw);
        const dec = cfg?.decimalPlaces ?? 2;
        const thousand = cfg?.thousandSeparator;
        const symbol = cfg?.symbol || '$';
        const pos = cfg?.symbolPosition === 'after' ? 'after' : 'before';
        let str = thousand ? num.toLocaleString(undefined, { minimumFractionDigits: dec, maximumFractionDigits: dec }) : num.toFixed(dec);
        return pos === 'before' ? `${symbol}${str}` : `${str}${symbol}`;
      }
      case 'boolean': {
        const cfg = fmt.config as any;
        const style = cfg?.style || 'true/false';
        const val = !!raw;
        switch (style) {
          case 'yes/no': return val ? 'Yes' : 'No';
          case '1/0': return val ? '1' : '0';
          case '✓/✗': return val ? '✓' : '✗';
          default: return val ? 'true' : 'false';
        }
      }
      case 'string': {
        const cfg = fmt.config as any;
        const str = String(raw);
        switch (cfg?.case) {
          case 'uppercase': return str.toUpperCase();
          case 'lowercase': return str.toLowerCase();
          case 'capitalize': return str.charAt(0).toUpperCase() + str.slice(1);
          default: return str;
        }
      }
      default:
        return String(raw);
    }
  }
}
