import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavigationComponent } from './components/navigation/navigation.component';
import { AppStateService } from './services/app-state.service';
import { DatasourceService } from './services/datasource.service';
import { ReportService } from './services/report.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavigationComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  title = 'DataFlow Reporter';

  constructor(
    private appState: AppStateService,
    private datasourceService: DatasourceService,
    private reportService: ReportService
  ) {}

  ngOnInit(): void {
    // Load datasources on app init
    this.datasourceService.listDatasources().subscribe({
      next: (dataSources) => {
        this.appState.setDataSources(dataSources);
        console.debug('[App] loaded datasources from API', { count: dataSources.length });
      },
      error: (error) => {
        console.error('[App] failed to load datasources from API', error);
        alert('Failed to load datasources. Please ensure the server is running.');
      }
    });

    // Load reports on app init
    this.reportService.listReports().subscribe({
      next: (reports) => {
        this.appState.setReports(reports);
        console.debug('[App] loaded reports from API', { count: reports.length });
      },
      error: (error) => {
        console.error('[App] failed to load reports from API', error);
        alert('Failed to load reports. Please ensure the server is running.');
      }
    });
  }
}
