import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AppStateService } from '../../../services/app-state.service';
import { ReportService } from '../../../services/report.service';
import { ReportConfig } from '../../../models/report.model';
import { User, MOCK_USERS } from '../../../models/user.model';
import { DataSource } from '../../../models/datasource.model';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { BadgeComponent } from '../../../shared/components/badge/badge.component';

@Component({
  selector: 'app-report-list',
  standalone: true,
  imports: [CommonModule, RouterModule, ButtonComponent, BadgeComponent],
  templateUrl: './report-list.component.html',
  styleUrl: './report-list.component.scss'
})
export class ReportListComponent implements OnInit {
  reports: ReportConfig[] = [];
  dataSources: DataSource[] = [];
  currentUser: User | null = null;
  reportFilter: 'all' | 'mine' = 'all';
  mockUsers = MOCK_USERS;

  constructor(
    private appState: AppStateService,
    private reportService: ReportService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.appState.currentUser$.subscribe(user => {
      this.currentUser = user;
    });

    this.appState.reports$.subscribe(reports => {
      this.reports = reports;
    });

    this.appState.dataSources$.subscribe(dataSources => {
      this.dataSources = dataSources;
    });
  }

  get filteredReports(): ReportConfig[] {
    if (this.reportFilter === 'mine' && this.currentUser) {
      return this.reports.filter(r => r.ownerId === this.currentUser!.id);
    }
    // 'all' means all public + my private
    return this.reports.filter(r => 
      r.visibility === 'public' || (this.currentUser && r.ownerId === this.currentUser.id)
    );
  }

  canModifyReport(report: ReportConfig): boolean {
    if (!this.currentUser) return false;
    return report.ownerId === this.currentUser.id || this.currentUser.role === 'admin';
  }

  getDataSourceName(id: string): string {
    const ds = this.dataSources.find(d => d.id === id);
    return ds?.name || 'Unknown Source';
  }

  getOwnerName(id: string): string {
    if (this.currentUser && id === this.currentUser.id) return 'Me';
    const owner = this.mockUsers.find(u => u.id === id);
    return owner?.name || 'Unknown';
  }

  onCreateReport(): void {
    // Navigate to report builder
    this.router.navigate(['/reports/builder']);
  }

  onViewReport(id: string): void {
    // Navigate to report viewer using Angular Router
    console.log('[ReportList] Navigating to report:', id);
    this.router.navigate(['/reports/viewer', id]);
  }

  onEditReport(id: string): void {
    // Navigate to report builder with ID
    console.log('[ReportList] Editing report:', id);
    this.router.navigate(['/reports/builder', id]);
  }

  onDeleteReport(id: string): void {
    const report = this.reports.find(r => r.id === id);
    if (report && this.canModifyReport(report)) {
      if (confirm('Are you sure you want to delete this report?')) {
        this.reportService.deleteReport(id).subscribe({
          next: () => {
            const updated = this.reports.filter(r => r.id !== id);
            this.appState.setReports(updated);
          },
          error: (err) => {
            console.error('[ReportList] Failed to delete report', err);
            alert('Failed to delete report. Please try again.');
          }
        });
      }
    } else {
      alert('You do not have permission to delete this report.');
    }
  }
}
