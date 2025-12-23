import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AppStateService } from '../../services/app-state.service';
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

  constructor(private appState: AppStateService) {}

  ngOnInit(): void {
    this.appState.currentUser$.subscribe(user => {
      this.currentUser = user;
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
    return this.reports
      .filter(r => r.visibility === 'public' || r.ownerId === this.currentUser!.id)
      .slice(0, 3);
  }
}
