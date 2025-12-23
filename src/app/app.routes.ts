import { Routes } from '@angular/router';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { DatasourceListComponent } from './components/datasources/datasource-list/datasource-list.component';
import { DatasourceEditorComponent } from './components/datasources/datasource-editor/datasource-editor.component';
import { ReportListComponent } from './components/reports/report-list/report-list.component';
import { ReportViewerComponent } from './components/reports/report-viewer/report-viewer.component';
import { ReportBuilderComponent } from './components/reports/report-builder/report-builder.component';

export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'datasources', component: DatasourceListComponent },
  { path: 'datasources/editor', component: DatasourceEditorComponent },
  { path: 'datasources/editor/:id', component: DatasourceEditorComponent },
  { path: 'reports', component: ReportListComponent },
  { path: 'reports/viewer/:id', component: ReportViewerComponent },
  { path: 'reports/builder', component: ReportBuilderComponent },
  { path: 'reports/builder/:id', component: ReportBuilderComponent },
];
