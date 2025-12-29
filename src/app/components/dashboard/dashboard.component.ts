import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AppStateService } from '../../services/app-state.service';
import { ReportViewTrackingService } from '../../services/report-view-tracking.service';
import { User } from '../../models/user.model';
import { DataSource } from '../../models/datasource.model';
import { ReportConfig } from '../../models/report.model';
import { CardComponent } from '../../shared/components/card/card.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  currentUser: User | null = null;
  dataSources: DataSource[] = [];
  reports: ReportConfig[] = [];
  recentReportIds: string[] = [];

  constructor(
    private appState: AppStateService,
    private viewTracking: ReportViewTrackingService
  ) {}

  ngOnInit(): void {
    this.appState.currentUser$.subscribe(user => {
      this.currentUser = user;
      // When user changes, fetch their recent reports
      if (user) {
        this.viewTracking.getRecentReportIds(user.id).subscribe(ids => {
          this.recentReportIds = ids;
        });
      } else {
        this.recentReportIds = [];
      }
    });

    this.appState.dataSources$.subscribe(dataSources => {
      this.dataSources = dataSources;
    });

    this.appState.reports$.subscribe(reports => {
      this.reports = reports;
    });
  }

  get myReports(): ReportConfig[] {
    if (!this.currentUser) return [];
    return this.reports.filter(r => r.ownerId === this.currentUser!.id);
  }

  get scheduledReports(): ReportConfig[] {
    return this.reports.filter(r => r.schedule.enabled);
  }

  get recentReports(): ReportConfig[] {
    if (!this.currentUser) return [];
    
    if (this.recentReportIds.length === 0) {
      // Fallback: show first 10 accessible reports if no views tracked
      return this.reports
        .filter(r => r.visibility === 'public' || r.ownerId === this.currentUser!.id)
        .slice(0, 10);
    }
    
    // Create a map of report IDs to their index in the recent list (for sorting)
    const reportOrderMap = new Map<string, number>();
    this.recentReportIds.forEach((id, index) => {
      reportOrderMap.set(id, index);
    });
    
    // Get reports that are in the recent list and are accessible to the user
    const accessibleRecentReports = this.reports
      .filter(r => 
        (r.visibility === 'public' || r.ownerId === this.currentUser!.id) &&
        this.recentReportIds.includes(r.id)
      )
      .sort((a, b) => {
        // Sort by the order they were viewed (most recent first)
        const orderA = reportOrderMap.get(a.id) ?? Infinity;
        const orderB = reportOrderMap.get(b.id) ?? Infinity;
        return orderA - orderB;
      })
      .slice(0, 10); // Limit to 10 most recent
    
    return accessibleRecentReports;
  }
}
