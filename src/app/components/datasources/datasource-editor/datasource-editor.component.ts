import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AppStateService } from '../../../services/app-state.service';
import { DatasourceService } from '../../../services/datasource.service';
import { GeminiService } from '../../../services/gemini.service';
import { DataSource, TableDef, ViewDef, ConnectionDetails, ColumnDef } from '../../../models/datasource.model';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { BadgeComponent } from '../../../shared/components/badge/badge.component';

type ActiveTab = 'connection' | 'schema';

@Component({
  selector: 'app-datasource-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonComponent, BadgeComponent],
  templateUrl: './datasource-editor.component.html',
  styleUrl: './datasource-editor.component.scss'
})
export class DatasourceEditorComponent implements OnInit {
  // Form State
  formData: Partial<DataSource> = {
    name: '',
    description: '',
    type: 'sql',
    tables: [],
    views: []
  };
  
  connectionDetails: ConnectionDetails = {
    host: 'localhost',
    port: '1433',
    database: 'Northwind',
    username: 'sa',
    password: ''
  };
  
  aiPrompt: string = '';
  
  // UI State
  isEditMode: boolean = false;
  editingId: string | null = null;
  loading: boolean = false;
  isDiscovering: boolean = false;
  activeTab: ActiveTab = 'connection';
  expandedTableId: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private appState: AppStateService,
    private datasourceService: DatasourceService,
    private geminiService: GeminiService
  ) {}

  ngOnInit(): void {
    const dataSourceId = this.route.snapshot.paramMap.get('id');
    
    // If editing existing data source
    if (dataSourceId) {
      this.isEditMode = true;
      this.editingId = dataSourceId;
      this.appState.dataSources$.subscribe(dataSources => {
        const ds = dataSources.find(d => d.id === dataSourceId);
        if (ds) {
          this.formData = { ...ds };
          this.connectionDetails = ds.connectionDetails || {
            host: '',
            port: '',
            database: '',
            username: '',
            password: ''
          };
          this.activeTab = 'schema'; // If editing, go straight to schema
        }
      });
    }
  }

  async handleSave(): Promise<void> {
    if (!this.formData.name) {
      alert('Please enter a name for the data source');
      return;
    }
    
    const ds: DataSource = {
      id: this.editingId || this.generateUUID(),
      name: this.formData.name,
      description: this.formData.description || '',
      type: this.formData.type || 'custom',
      connectionDetails: this.formData.type !== 'custom' ? this.connectionDetails : undefined,
      tables: this.formData.tables || [],
      views: this.formData.views || [],
      created_at: this.editingId 
        ? (this.formData.created_at || new Date().toISOString()) 
        : new Date().toISOString()
    };

    this.loading = true;
    try {
      if (this.editingId) {
        await this.datasourceService.updateDatasource(this.editingId, ds).toPromise();
        // Update app state
        this.appState.dataSources$.subscribe(dataSources => {
          const updated = dataSources.map(d => d.id === this.editingId ? ds : d);
          this.appState.setDataSources(updated);
        });
      } else {
        await this.datasourceService.createDatasource(ds).toPromise();
        // Update app state
        this.appState.dataSources$.subscribe(dataSources => {
          this.appState.setDataSources([...dataSources, ds]);
        });
      }
      this.router.navigate(['/datasources']);
    } catch (e) {
      console.error('Failed to save datasource', e);
      alert('Failed to save datasource to server');
    } finally {
      this.loading = false;
    }
  }

  async handleDiscoverSchema(): Promise<void> {
    const dbName = this.formData.type === 'custom' ? 'CustomDB' : this.connectionDetails.database;
    const context = this.formData.type === 'custom' ? this.aiPrompt : `Host: ${this.connectionDetails.host}`;
    
    if (!dbName && this.formData.type !== 'custom') {
      alert('Please enter a database name');
      return;
    }

    this.isDiscovering = true;
    try {
      if (this.formData.type === 'custom') {
        const newTables = await this.geminiService.discoverSchema('custom', dbName, context).toPromise();
        this.formData.tables = newTables;
        this.activeTab = 'schema';
      } else {
        // Call backend to test connection and fetch real schema
        try {
          const result = await this.datasourceService.testConnectionAndFetchSchema(
            this.formData.type || 'sql',
            this.connectionDetails
          ).toPromise();
          this.formData.tables = result?.tables || [];
          this.formData.views = result?.views || [];
          this.activeTab = 'schema';
        } catch (err) {
          console.error('Test connection failed', err);
          alert('Failed to connect and fetch schema. Confirm connection details and try again.');
        }
      }
    } catch (e) {
      console.error(e);
      alert('Failed to discover schema. Please try again.');
    } finally {
      this.isDiscovering = false;
    }
  }

  toggleTableExposure(tableId: string): void {
    this.formData.tables = this.formData.tables?.map(t => 
      t.id === tableId ? { ...t, exposed: !t.exposed } : t
    );
  }

  toggleViewExposure(viewId: string): void {
    this.formData.views = this.formData.views?.map(v => 
      v.id === viewId ? { ...v, exposed: !v.exposed } : v
    );
  }

  updateTableMetadata(id: string, field: 'alias' | 'description', value: string): void {
    this.formData.tables = this.formData.tables?.map(t => 
      t.id === id ? { ...t, [field]: value } : t
    );
  }

  updateColumnMetadata(tableId: string, colId: string, field: 'alias' | 'description' | 'sampleValue', value: string): void {
    this.formData.tables = this.formData.tables?.map(t => {
      if (t.id !== tableId) return t;
      return {
        ...t,
        columns: t.columns.map(c => c.id === colId ? { ...c, [field]: value } : c)
      };
    });
  }

  updateViewMetadata(id: string, field: 'alias' | 'description', value: string): void {
    this.formData.views = this.formData.views?.map(v => 
      v.id === id ? { ...v, [field]: value } : v
    );
  }

  updateViewColumnMetadata(viewId: string, colId: string, field: 'alias' | 'description' | 'sampleValue', value: string): void {
    this.formData.views = this.formData.views?.map(v => {
      if (v.id !== viewId) return v;
      return {
        ...v,
        columns: v.columns.map(c => c.id === colId ? { ...c, [field]: value } : c)
      };
    });
  }

  toggleTable(id: string): void {
    this.expandedTableId = this.expandedTableId === id ? null : id;
  }

  onCancel(): void {
    this.router.navigate(['/datasources']);
  }

  get allTables(): TableDef[] {
    return this.formData.tables || [];
  }

  get allViews(): ViewDef[] {
    return this.formData.views || [];
  }

  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16).toUpperCase();
    });
  }
}
