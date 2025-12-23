export type Aggregation = 'none' | 'sum' | 'avg' | 'count' | 'min' | 'max';
export type SortDirection = 'asc' | 'desc';
export type VisualizationType = 'table' | 'bar' | 'line' | 'pie' | 'area';

// Formatting configurations by data type
export interface DateFormatting {
  format: 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD' | 'MMM DD, YYYY' | 'MMMM DD, YYYY' | 'relative' | 'iso';
}

export interface NumberFormatting {
  decimalPlaces: number;
  thousandSeparator: boolean;
  prefix?: string;
  suffix?: string;
}

export interface CurrencyFormatting {
  symbol: string;
  decimalPlaces: number;
  thousandSeparator: boolean;
  symbolPosition: 'before' | 'after';
}

export interface BooleanFormatting {
  style: 'true/false' | 'yes/no' | '1/0' | 'check/x' | 'enabled/disabled';
}

export interface StringFormatting {
  case?: 'uppercase' | 'lowercase' | 'capitalize' | 'none';
  truncate?: number;
}

export type FormattingConfig = 
  | { type: 'date'; config: DateFormatting }
  | { type: 'number'; config: NumberFormatting }
  | { type: 'currency'; config: CurrencyFormatting }
  | { type: 'boolean'; config: BooleanFormatting }
  | { type: 'string'; config: StringFormatting }
  | { type: 'none' };

export interface ReportColumn {
  tableId: string;
  columnId: string;
  alias?: string;
  aggregation?: Aggregation;
  formatting?: FormattingConfig;
}

export interface FilterCondition {
  id: string;
  tableId: string;
  columnId: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'starts_with' | 'ends_with' | 
            'gt' | 'gte' | 'lt' | 'lte' | 'between' | 
            'is_null' | 'is_not_null' | 'is_empty' | 'is_not_empty' | 
            'in' | 'today' | 'this_week' | 'this_month' | 'this_year';
  value: string;
  value2?: string; // For 'between' operator
}

export interface SortCondition {
  tableId: string;
  columnId: string;
  direction: SortDirection;
}

export interface ScheduleConfig {
  enabled: boolean;
  frequency: 'daily' | 'weekly' | 'monthly';
  time: string;
}

export interface ReportConfig {
  id: string;
  dataSourceId: string;
  ownerId: string;
  visibility: 'public' | 'private';
  name: string;
  description?: string;
  selectedColumns: ReportColumn[];
  filters: FilterCondition[];
  sorts: SortCondition[];
  groupBy?: ReportColumn[];
  visualization: VisualizationType;
  schedule: ScheduleConfig;
  created_at: string;
}

export interface ReportSnapshot {
  id: string;
  reportId: string;
  timestamp: string;
  data: any[];
}

