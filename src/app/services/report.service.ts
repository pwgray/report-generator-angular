import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ReportConfig } from '../models/report.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ReportService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /**
   * List all reports
   */
  listReports(): Observable<ReportConfig[]> {
    return this.http.get<ReportConfig[]>(`${this.apiUrl}/api/reports`);
  }

  /**
   * Get a single report by ID
   */
  getReport(id: string): Observable<ReportConfig> {
    return this.http.get<ReportConfig>(`${this.apiUrl}/api/reports/${id}`);
  }

  /**
   * Create a new report
   */
  createReport(report: ReportConfig): Observable<ReportConfig> {
    return this.http.post<ReportConfig>(`${this.apiUrl}/api/reports`, report);
  }

  /**
   * Update an existing report
   */
  updateReport(id: string, report: ReportConfig): Observable<ReportConfig> {
    return this.http.put<ReportConfig>(`${this.apiUrl}/api/reports/${id}`, report);
  }

  /**
   * Delete a report
   */
  deleteReport(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/api/reports/${id}`);
  }
}

