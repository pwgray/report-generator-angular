import { Injectable } from '@angular/core';
import { Observable, from } from 'rxjs';
import { GoogleGenAI, Type } from '@google/genai';
import { DataSource, TableDef } from '../models/datasource.model';
import { ReportConfig } from '../models/report.model';
import { environment } from '../../environments/environment';

const GEMINI_MODEL = 'gemini-2.5-flash';

@Injectable({
  providedIn: 'root'
})
export class GeminiService {
  private getApiKey(): string {
    const key = environment.geminiApiKey;
    if (!key) {
      console.error('Gemini API key not found. Set geminiApiKey in environment configuration.');
    }
    return key;
  }

  /**
   * Generate mock report data using AI
   */
  generateReportData(
    dataSource: DataSource,
    reportConfig: ReportConfig,
    rowCount: number = 20
  ): Observable<any[]> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      return from(Promise.resolve([]));
    }

    const ai = new GoogleGenAI({ apiKey });

    // Construct a prompt that describes the schema and the query
    const schemaDescription = dataSource.tables
      .filter(t => t.exposed)
      .map(t => {
        const cols = t.columns.map(c => `${c.name} (${c.type})`).join(', ');
        return `Table: ${t.name}\nColumns: ${cols}`;
      })
      .join('\n\n');

    const queryDescription = `
      Generate ${rowCount} rows of realistic mock data for a report.
      
      Data Source Schema:
      ${schemaDescription}

      Report Requirements:
      - Columns needed: ${reportConfig.selectedColumns.map(c => {
        const table = dataSource.tables.find(t => t.id === c.tableId);
        const col = table?.columns.find(col => col.id === c.columnId);
        return `${table?.name}.${col?.name}`;
      }).join(', ')}
      - Filters to apply (simulated): ${JSON.stringify(reportConfig.filters)}
      - Sorting: ${JSON.stringify(reportConfig.sorts)}
      
      Return ONLY a JSON array of objects. Keys should match the requested columns.
      Make the data consistent and realistic.
    `;

    const promise = ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: queryDescription,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.2,
      }
    }).then((response: any) => {
      const text = response.text;
      if (!text) return [];
      return JSON.parse(text);
    }).catch((error: any) => {
      console.error('Failed to generate report data', error);
      return [];
    });

    return from(promise);
  }

  /**
   * Discover database schema from description using AI
   */
  discoverSchema(type: string, dbName: string, context: string = ''): Observable<TableDef[]> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      return from(Promise.resolve([]));
    }

    const ai = new GoogleGenAI({ apiKey });

    const prompt = `
      You are a database architect.
      Generate a schema for a '${type}' database named '${dbName}'.
      Context: ${context || 'General business database'}.

      Constraints:
      1. Generate EXACTLY 3 tables.
      2. Each table has MAX 5 columns.
      3. Descriptions must be concise (< 10 words).
      4. sampleValues must be short strings.
      5. Output valid JSON.
      
      For each table/column include: name, alias, description, sampleValue.
      Column types must be one of: "string", "number", "date", "boolean", "currency".
    `;

    const promise = ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        temperature: 0.1,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              alias: { type: Type.STRING },
              description: { type: Type.STRING },
              columns: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    type: { type: Type.STRING, enum: ['string', 'number', 'date', 'boolean', 'currency'] },
                    alias: { type: Type.STRING },
                    description: { type: Type.STRING },
                    sampleValue: { type: Type.STRING }
                  },
                  required: ['name', 'type']
                }
              }
            },
            required: ['name', 'columns']
          }
        }
      }
    }).then((response: any) => {
      const text = response.text;
      if (!text) return [];

      const rawTables = JSON.parse(text);

      // Hydrate with IDs
      return rawTables.map((t: any) => ({
        id: crypto.randomUUID(),
        name: t.name,
        alias: t.alias || t.name,
        description: t.description || '',
        exposed: true,
        columns: t.columns.map((c: any) => ({
          id: crypto.randomUUID(),
          name: c.name,
          type: c.type,
          alias: c.alias || c.name,
          description: c.description || '',
          sampleValue: c.sampleValue || ''
        }))
      }));
    }).catch((error: any) => {
      console.error('Failed to generate schema', error);
      return [];
    });

    return from(promise);
  }
}

