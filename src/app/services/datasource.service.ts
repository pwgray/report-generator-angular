import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DataSource, ConnectionDetails, TableDef, ViewDef } from '../models/datasource.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DatasourceService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /**
   * List all data sources
   */
  listDatasources(): Observable<DataSource[]> {
    return this.http.get<DataSource[]>(`${this.apiUrl}/api/datasources`);
  }

  /**
   * Create a new data source
   */
  createDatasource(dataSource: DataSource): Observable<DataSource> {
    return this.http.post<DataSource>(`${this.apiUrl}/api/datasources`, dataSource);
  }

  /**
   * Update an existing data source
   */
  updateDatasource(id: string, dataSource: DataSource): Observable<DataSource> {
    return this.http.put<DataSource>(`${this.apiUrl}/api/datasources/${id}`, dataSource);
  }

  /**
   * Delete a data source
   */
  deleteDatasource(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/api/datasources/${id}`);
  }

  /**
   * Test connection and fetch schema from database
   */
  testConnectionAndFetchSchema(
    type: string,
    connectionDetails: ConnectionDetails
  ): Observable<{ tables: TableDef[], views: ViewDef[] }> {
    return this.http.post<{ tables: TableDef[], views: ViewDef[] }>(
      `${this.apiUrl}/api/datasources/test-connection`,
      { type, connectionDetails }
    );
  }

  /**
   * Fetch table data with filters and sorts
   */
  fetchTableData(
    dataSourceOrId: string | DataSource,
    table: string,
    columns: string[],
    limit: number = 5000000,
    filters?: any[],
    sorts?: any[]
  ): Observable<any[]> {
    const bodyPayload: any = { table, columns, limit };
    
    if (filters && filters.length > 0) {
      bodyPayload.filters = filters;
    }
    
    if (sorts && sorts.length > 0) {
      bodyPayload.sorts = sorts;
    }
    
    if (typeof dataSourceOrId === 'string') {
      bodyPayload.dataSourceId = dataSourceOrId;
    } else {
      bodyPayload.dataSource = dataSourceOrId;
    }

    return this.http.post<any[]>(`${this.apiUrl}/api/datasources/query`, bodyPayload);
  }
}

