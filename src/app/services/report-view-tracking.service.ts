import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface ReportView {
  reportId: string;
  userId: string;
  viewedAt: number; // timestamp
}

@Injectable({
  providedIn: 'root'
})
export class ReportViewTrackingService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /**
   * Track that a user viewed a report
   */
  trackReportView(reportId: string, userId: string): Observable<void> {
    return this.http.post<{ success: boolean }>(
      `${this.apiUrl}/api/reports/${reportId}/view`,
      { userId }
    ).pipe(
      map(() => undefined), // Convert to void
      catchError((error) => {
        console.error('[ReportViewTracking] Failed to track view:', error);
        // Return void observable on error - don't block the UI
        return of(undefined);
      })
    );
  }

  /**
   * Get the most recently viewed report IDs for a user (up to 10)
   */
  getRecentReportIds(userId: string): Observable<string[]> {
    const params = new HttpParams().set('userId', userId);
    
    return this.http.get<string[]>(`${this.apiUrl}/api/reports/recent`, { params }).pipe(
      catchError((error) => {
        console.error('[ReportViewTracking] Failed to fetch recent reports:', error);
        // Return empty array on error - don't block the UI
        return of([]);
      })
    );
  }

  /**
   * Get all views for a specific user (for compatibility, though we only store IDs now)
   * This is a convenience method that returns the report IDs as a simple array
   */
  getViewsForUser(userId: string): Observable<ReportView[]> {
    return this.getRecentReportIds(userId).pipe(
      map((reportIds) => {
        // Convert report IDs to ReportView objects with current timestamp
        // Note: We don't have the actual viewedAt timestamps from the API response
        // If needed, we could extend the API to return full view objects
        return reportIds.map((reportId, index) => ({
          reportId,
          userId,
          viewedAt: Date.now() - (index * 1000) // Approximate timestamps, most recent first
        }));
      })
    );
  }
}

