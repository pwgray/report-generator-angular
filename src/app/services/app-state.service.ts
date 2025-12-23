import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { User, MOCK_USERS } from '../models/user.model';
import { DataSource } from '../models/datasource.model';
import { ReportConfig } from '../models/report.model';

@Injectable({
  providedIn: 'root'
})
export class AppStateService {
  // Current user state
  private currentUserSubject = new BehaviorSubject<User>(MOCK_USERS[0]);
  public currentUser$: Observable<User> = this.currentUserSubject.asObservable();

  // Data sources state
  private dataSourcesSubject = new BehaviorSubject<DataSource[]>([]);
  public dataSources$: Observable<DataSource[]> = this.dataSourcesSubject.asObservable();

  // Reports state
  private reportsSubject = new BehaviorSubject<ReportConfig[]>([]);
  public reports$: Observable<ReportConfig[]> = this.reportsSubject.asObservable();

  constructor() {}

  // Current User methods
  getCurrentUser(): User {
    return this.currentUserSubject.value;
  }

  setCurrentUser(user: User): void {
    this.currentUserSubject.next(user);
  }

  // Data Sources methods
  getDataSources(): DataSource[] {
    return this.dataSourcesSubject.value;
  }

  setDataSources(dataSources: DataSource[]): void {
    this.dataSourcesSubject.next(dataSources);
  }

  addDataSource(dataSource: DataSource): void {
    const current = this.dataSourcesSubject.value;
    this.dataSourcesSubject.next([...current, dataSource]);
  }

  updateDataSource(dataSource: DataSource): void {
    const current = this.dataSourcesSubject.value;
    const updated = current.map(ds => ds.id === dataSource.id ? dataSource : ds);
    this.dataSourcesSubject.next(updated);
  }

  removeDataSource(id: string): void {
    const current = this.dataSourcesSubject.value;
    this.dataSourcesSubject.next(current.filter(ds => ds.id !== id));
  }

  // Reports methods
  getReports(): ReportConfig[] {
    return this.reportsSubject.value;
  }

  setReports(reports: ReportConfig[]): void {
    // Deduplicate reports by ID to prevent duplicates
    const uniqueReports = reports.reduce((acc, report) => {
      if (!acc.find(r => r.id === report.id)) {
        acc.push(report);
      }
      return acc;
    }, [] as ReportConfig[]);
    
    if (uniqueReports.length !== reports.length) {
      console.warn(`[AppState] Removed ${reports.length - uniqueReports.length} duplicate reports`);
    }
    
    this.reportsSubject.next(uniqueReports);
  }

  addReport(report: ReportConfig): void {
    const current = this.reportsSubject.value;
    // Check if report already exists to prevent duplicates
    if (current.some(r => r.id === report.id)) {
      console.warn('[AppState] Report already exists, updating instead:', report.id);
      this.updateReport(report);
      return;
    }
    this.reportsSubject.next([...current, report]);
  }

  updateReport(report: ReportConfig): void {
    const current = this.reportsSubject.value;
    // Remove any duplicates first, then update
    const withoutDuplicates = current.filter(r => r.id !== report.id);
    const updated = [...withoutDuplicates, report];
    this.reportsSubject.next(updated);
  }

  removeReport(id: string): void {
    const current = this.reportsSubject.value;
    this.reportsSubject.next(current.filter(r => r.id !== id));
  }
}

