import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AppStateService } from '../../../services/app-state.service';
import { ReportService } from '../../../services/report.service';
import { 
  ReportConfig, 
  ReportColumn, 
  FilterCondition, 
  SortCondition, 
  FormattingConfig,
  VisualizationType 
} from '../../../models/report.model';
import { DataSource, TableDef, ColumnDef, ColumnType } from '../../../models/datasource.model';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { BadgeComponent } from '../../../shared/components/badge/badge.component';
import { combineLatest } from 'rxjs';

interface OperatorOption {
  value: string;
  label: string;
}

type ActiveTab = 'data' | 'filter' | 'visual';

@Component({
  selector: 'app-report-builder',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonComponent, BadgeComponent],
  templateUrl: './report-builder.component.html',
  styleUrl: './report-builder.component.scss'
})
export class ReportBuilderComponent implements OnInit {
  config: ReportConfig = {
    id: this.generateUUID(),
    dataSourceId: '',
    name: 'New Report',
    description: '',
    ownerId: '',
    visibility: 'private',
    selectedColumns: [],
    filters: [],
    sorts: [],
    visualization: 'table',
    schedule: { enabled: false, frequency: 'weekly', time: '09:00' },
    created_at: new Date().toISOString()
  };

  dataSources: DataSource[] = [];
  isEditMode: boolean = false;
  loading: boolean = false;
  activeTab: ActiveTab = 'data';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private appState: AppStateService,
    private reportService: ReportService
  ) {}

  ngOnInit(): void {
    const reportId = this.route.snapshot.paramMap.get('id');
    
    // Load data sources and reports
    combineLatest([
      this.appState.dataSources$,
      this.appState.reports$,
      this.appState.currentUser$
    ]).subscribe(([dataSources, reports, currentUser]) => {
      this.dataSources = dataSources;
      
      // Set initial data source if not set
      if (!this.config.dataSourceId && dataSources.length > 0) {
        this.config.dataSourceId = dataSources[0].id;
      }

      // If editing existing report
      if (reportId && !this.isEditMode) {
        this.isEditMode = true;
        const report = reports.find(r => r.id === reportId);
        if (report) {
          this.config = { ...report };
        } else {
          // Report not in state, fetch from API
          this.reportService.getReport(reportId).subscribe({
            next: (fetchedReport) => {
              this.config = { ...fetchedReport };
            },
            error: (err) => {
              console.error('[ReportBuilder] Failed to load report:', err);
              // If report doesn't exist, treat as new report
              this.isEditMode = false;
              this.config.id = this.generateUUID();
            }
          });
        }
      }

      // Set owner ID
      if (currentUser) {
        this.config.ownerId = currentUser.id;
      }
    });
  }

  get selectedDataSource(): DataSource | null {
    return this.dataSources.find(ds => ds.id === this.config.dataSourceId) || null;
  }

  get allTablesAndViews(): TableDef[] {
    if (!this.selectedDataSource) return [];
    return [
      ...(this.selectedDataSource.tables || []),
      ...(this.selectedDataSource.views || [])
    ];
  }

  get exposedTablesAndViews(): TableDef[] {
    return this.allTablesAndViews.filter(t => t.exposed);
  }

  // Data Source Change Handler
  onDataSourceChange(dsId: string): void {
    this.config = {
      ...this.config,
      dataSourceId: dsId,
      selectedColumns: [],
      filters: [],
      sorts: []
    };
  }

  // Column Selection
  toggleColumn(tableId: string, columnId: string): void {
    const exists = this.config.selectedColumns.find(
      c => c.tableId === tableId && c.columnId === columnId
    );
    
    if (exists) {
      this.config.selectedColumns = this.config.selectedColumns.filter(c => c !== exists);
    } else {
      // Add column without formatting - formatting is optional
      this.config.selectedColumns = [
        ...this.config.selectedColumns,
        { tableId, columnId }
      ];
    }
  }

  isColumnSelected(tableId: string, columnId: string): boolean {
    return this.config.selectedColumns.some(
      c => c.tableId === tableId && c.columnId === columnId
    );
  }

  isView(tableId: string): boolean {
    return this.selectedDataSource?.views?.some(v => v.id === tableId) || false;
  }

  // Column Formatting
  enableFormatting(tableId: string, columnId: string): void {
    const colType = this.getColumnType(tableId, columnId);
    const defaultFormatting = this.getDefaultFormatting(colType);
    this.updateColumnFormatting(tableId, columnId, defaultFormatting);
  }

  disableFormatting(tableId: string, columnId: string): void {
    this.config.selectedColumns = this.config.selectedColumns.map(col => {
      if (col.tableId === tableId && col.columnId === columnId) {
        const { formatting, ...rest } = col;
        return rest;
      }
      return col;
    });
  }

  updateColumnFormatting(tableId: string, columnId: string, formatting: FormattingConfig): void {
    this.config.selectedColumns = this.config.selectedColumns.map(col => {
      if (col.tableId === tableId && col.columnId === columnId) {
        return { ...col, formatting };
      }
      return col;
    });
  }

  updateColumnFormattingField(tableId: string, columnId: string, field: string, value: any): void {
    const col = this.config.selectedColumns.find(c => c.tableId === tableId && c.columnId === columnId);
    if (!col) return;
    
    const formatting = this.getColumnFormatting(col);
    if (formatting.type === 'none') return;
    
    const updatedConfig = { ...(formatting as any).config, [field]: value };
    const updatedFormatting: FormattingConfig = {
      ...formatting,
      config: updatedConfig
    } as FormattingConfig;
    this.updateColumnFormatting(tableId, columnId, updatedFormatting);
  }

  getDefaultFormatting(columnType: ColumnType): FormattingConfig {
    switch (columnType) {
      case 'date':
        return { type: 'date', config: { format: 'MM/DD/YYYY' } };
      case 'number':
        return { type: 'number', config: { decimalPlaces: 2, thousandSeparator: true } };
      case 'currency':
        return { 
          type: 'currency', 
          config: { symbol: '$', decimalPlaces: 2, thousandSeparator: true, symbolPosition: 'before' } 
        };
      case 'boolean':
        return { type: 'boolean', config: { style: 'true/false' } };
      case 'string':
      default:
        return { type: 'string', config: { case: 'none' } };
    }
  }

  getColumnFormatting(column: ReportColumn): FormattingConfig {
    return column.formatting || this.getDefaultFormatting(this.getColumnType(column.tableId, column.columnId));
  }

  getFormattingConfig(column: ReportColumn): any {
    const formatting = this.getColumnFormatting(column);
    return formatting.type === 'none' ? {} : (formatting as any).config;
  }

  getAllColumns(): Array<{ tableId: string; columnId: string; displayName: string }> {
    const columns: Array<{ tableId: string; columnId: string; displayName: string }> = [];
    this.exposedTablesAndViews.forEach(table => {
      table.columns.forEach(col => {
        columns.push({
          tableId: table.id,
          columnId: col.id,
          displayName: `${table.alias || table.name}.${col.alias || col.name}`
        });
      });
    });
    return columns;
  }

  // Filters
  addFilter(): void {
    if (!this.selectedDataSource) return;
    const firstTable = this.exposedTablesAndViews[0];
    if (!firstTable || firstTable.columns.length === 0) return;
    
    this.config.filters = [
      ...this.config.filters,
      {
        id: this.generateUUID(),
        tableId: firstTable.id,
        columnId: firstTable.columns[0].id,
        operator: 'equals',
        value: ''
      }
    ];
  }

  updateFilter(index: number, updates: Partial<FilterCondition>): void {
    this.config.filters = this.config.filters.map((filter, idx) => {
      if (idx !== index) return filter;
      
      const updated = { ...filter, ...updates };
      
      // If column changed, update tableId and reset operator/value
      if (updates.columnId && updates.columnId !== filter.columnId) {
        // Find which table this column belongs to
        const colInfo = this.getAllColumns().find(c => c.columnId === updates.columnId);
        if (colInfo) {
          updated.tableId = colInfo.tableId;
        }
        
        // Reset operator to default for the new column type
        const newColumnType = this.getColumnType(updated.tableId, updated.columnId);
        const defaultOperators = this.getOperatorsForType(newColumnType);
        if (defaultOperators.length > 0) {
          updated.operator = defaultOperators[0].value as any;
        }
        
        // Clear values when column changes
        updated.value = '';
        updated.value2 = undefined;
      }
      
      return updated;
    });
  }

  removeFilter(index: number): void {
    this.config.filters = this.config.filters.filter((_, idx) => idx !== index);
  }

  // Sorting
  addSort(): void {
    if (this.config.selectedColumns.length === 0) {
      alert('Please select columns first');
      return;
    }
    const firstCol = this.config.selectedColumns[0];
    this.config.sorts = [
      ...this.config.sorts,
      {
        tableId: firstCol.tableId,
        columnId: firstCol.columnId,
        direction: 'asc'
      }
    ];
  }

  updateSort(index: number, updates: Partial<SortCondition>): void {
    this.config.sorts = this.config.sorts.map((sort, idx) => 
      idx === index ? { ...sort, ...updates } : sort
    );
  }

  removeSort(index: number): void {
    this.config.sorts = this.config.sorts.filter((_, idx) => idx !== index);
  }

  // Helper methods
  getColumnName(tableId: string, columnId: string): string {
    // First check if we have data sources loaded
    if (this.dataSources.length === 0) {
      return 'Loading...';
    }
    
    const table = this.allTablesAndViews.find(t => t.id === tableId);
    
    if (!table) {
      console.warn(`[Report Builder] Table not found for ID: ${tableId}`);
      console.warn(`[Report Builder] DataSource ID: ${this.config.dataSourceId}`);
      console.warn(`[Report Builder] Available tables:`, this.allTablesAndViews.map(t => ({ id: t.id, name: t.name })));
      console.warn(`[Report Builder] All DataSources:`, this.dataSources.map(ds => ({ id: ds.id, name: ds.name, tableCount: ds.tables?.length || 0 })));
      return `[Table Not Found].[Column Not Found]`;
    }
    
    const column = table.columns.find(c => c.id === columnId);
    
    if (!column) {
      console.warn(`[Report Builder] Column not found for ID: ${columnId} in table ${table.name}`);
      console.warn(`[Report Builder] Available columns:`, table.columns.map(c => ({ id: c.id, name: c.name })));
      return `${table.alias || table.name}.[Column Not Found]`;
    }
    
    const tableLabel = table.alias || table.name || 'Unknown Table';
    const colLabel = column.alias || column.name || 'Unknown Column';
    return `${tableLabel}.${colLabel}`;
  }

  getColumnType(tableId: string, columnId: string): ColumnType {
    const table = this.allTablesAndViews.find(t => t.id === tableId);
    const column = table?.columns.find(c => c.id === columnId);
    return (column?.type as ColumnType) || 'string';
  }

  getOperatorsForType(columnType: string): OperatorOption[] {
    switch (columnType) {
      case 'string':
        return [
          { value: 'equals', label: 'Equals' },
          { value: 'not_equals', label: 'Not Equals' },
          { value: 'contains', label: 'Contains' },
          { value: 'not_contains', label: 'Does Not Contain' },
          { value: 'starts_with', label: 'Starts With' },
          { value: 'ends_with', label: 'Ends With' },
          { value: 'is_empty', label: 'Is Empty' },
          { value: 'is_not_empty', label: 'Is Not Empty' },
          { value: 'in', label: 'In List' }
        ];
      case 'number':
      case 'currency':
        return [
          { value: 'equals', label: 'Equals' },
          { value: 'not_equals', label: 'Not Equals' },
          { value: 'gt', label: 'Greater Than' },
          { value: 'gte', label: 'Greater Than or Equal' },
          { value: 'lt', label: 'Less Than' },
          { value: 'lte', label: 'Less Than or Equal' },
          { value: 'between', label: 'Between' },
          { value: 'is_null', label: 'Is Null' },
          { value: 'is_not_null', label: 'Is Not Null' }
        ];
      case 'date':
        return [
          { value: 'equals', label: 'On Date' },
          { value: 'not_equals', label: 'Not On Date' },
          { value: 'gt', label: 'After' },
          { value: 'gte', label: 'On or After' },
          { value: 'lt', label: 'Before' },
          { value: 'lte', label: 'On or Before' },
          { value: 'between', label: 'Between Dates' },
          { value: 'is_null', label: 'Is Null' },
          { value: 'is_not_null', label: 'Is Not Null' },
          { value: 'today', label: 'Is Today' },
          { value: 'this_week', label: 'This Week' },
          { value: 'this_month', label: 'This Month' },
          { value: 'this_year', label: 'This Year' }
        ];
      case 'boolean':
        return [
          { value: 'equals', label: 'Is' },
          { value: 'is_null', label: 'Is Null' },
          { value: 'is_not_null', label: 'Is Not Null' }
        ];
      default:
        return [
          { value: 'equals', label: 'Equals' },
          { value: 'not_equals', label: 'Not Equals' },
          { value: 'contains', label: 'Contains' },
          { value: 'is_null', label: 'Is Null' },
          { value: 'is_not_null', label: 'Is Not Null' }
        ];
    }
  }

  needsValueInput(operator: string): boolean {
    const noValueOps = ['is_null', 'is_not_null', 'is_empty', 'is_not_empty', 
                        'today', 'this_week', 'this_month', 'this_year'];
    return !noValueOps.includes(operator);
  }

  needsTwoValues(operator: string): boolean {
    return operator === 'between';
  }

  // Save and Cancel
  onSave(): void {
    this.loading = true;
    
    // Determine if we should create or update based on whether report exists
    const shouldUpdate = this.isEditMode && this.config.id;
    
    const saveOperation = shouldUpdate
      ? this.reportService.updateReport(this.config.id, this.config)
      : this.reportService.createReport(this.config);

    saveOperation.subscribe({
      next: (savedReport) => {
        console.log('[ReportBuilder] Report saved:', savedReport);
        // Update app state using the service methods
        if (shouldUpdate) {
          this.appState.updateReport(savedReport);
        } else {
          this.appState.addReport(savedReport);
        }
        this.router.navigate(['/reports']);
      },
      error: (err) => {
        console.error('[ReportBuilder] Error saving report:', err);
        // If update fails with 404, try creating instead
        if (shouldUpdate && err.status === 404) {
          console.log('[ReportBuilder] Report not found, creating new report instead');
          this.config.id = this.generateUUID();
          this.reportService.createReport(this.config).subscribe({
            next: (savedReport) => {
              this.appState.addReport(savedReport);
              this.router.navigate(['/reports']);
            },
            error: (createErr) => {
              console.error('[ReportBuilder] Error creating report:', createErr);
              alert('Error saving report: ' + (createErr.error?.message || createErr.message));
              this.loading = false;
            }
          });
        } else {
          alert('Error saving report: ' + (err.error?.message || err.message));
          this.loading = false;
        }
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/reports']);
  }

  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
}
