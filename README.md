# DataFlow Reporter - Angular 19

This is an Angular 19 conversion of the React DataFlow Reporter application.

## Setup Instructions

### Prerequisites
- Node.js v22+ and npm v10+
- Angular CLI v19
- Running backend server on port 3001

### Installation

```bash
cd web-angular
npm install
```

### Development Server

```bash
npm start
# Or
ng serve
```

Navigate to `http://localhost:4200/`. The application will automatically reload if you change any of the source files.

The API proxy is configured to forward `/api/*` requests to `http://localhost:3001`.

### Environment Configuration

Update `src/environments/environment.ts` to configure:
- `apiUrl`: Backend API URL (default: http://localhost:3001)
- `geminiApiKey`: Google Gemini API key for AI features

### Build

```bash
npm run build
# Or
ng build
```

The build artifacts will be stored in the `dist/` directory.

## Project Structure

```
src/
├── app/
│   ├── components/          # Feature components
│   │   ├── dashboard/       # Dashboard view
│   │   ├── navigation/      # Sidebar navigation
│   │   ├── datasources/     # Data source management
│   │   └── reports/         # Report management
│   ├── shared/
│   │   └── components/      # Reusable UI components
│   │       ├── button/
│   │       ├── input/
│   │       ├── select/
│   │       ├── card/
│   │       └── badge/
│   ├── services/            # Angular services
│   │   ├── datasource.service.ts
│   │   ├── report.service.ts
│   │   ├── gemini.service.ts
│   │   └── app-state.service.ts
│   ├── models/              # TypeScript interfaces
│   │   ├── datasource.model.ts
│   │   ├── report.model.ts
│   │   └── user.model.ts
│   ├── pipes/               # Custom pipes
│   ├── app.component.ts     # Root component
│   ├── app.routes.ts        # Route definitions
│   └── app.config.ts        # App configuration
├── environments/            # Environment configs
├── assets/                  # Static assets
└── styles.scss             # Global styles

```

## Conversion Status

### ✅ Completed

1. **Project Setup** - Angular 19 with standalone components
2. **Dependencies** - TailwindCSS, ngx-charts, ng-icons, HttpClient
3. **Models** - All TypeScript interfaces converted
4. **Services** - All services converted to Angular with RxJS
   - DatasourceService (HTTP operations)
   - ReportService (HTTP operations)
   - GeminiService (AI integration)
   - AppStateService (State management with BehaviorSubjects)
5. **Shared Components** - Button, Input, Select, Card, Badge
6. **Core App** - App component with routing
7. **Navigation** - Sidebar navigation with user switcher
8. **Dashboard** - Dashboard component with stats and recent reports
9. **Build Configuration** - Proxy, environment files, TailwindCSS

### 🚧 In Progress / Remaining

The following components need to be implemented:

#### 1. Report List Component
Location: `src/app/components/reports/report-list/`
- Display reports in a table
- Filter tabs (All / My Reports)
- Actions: View, Edit, Delete
- Create new report button

#### 2. DataSource List Component  
Location: `src/app/components/datasources/datasource-list/`
- Display data sources as cards
- Create/Edit/Delete data sources
- Connection testing
- Schema discovery (AI or live)
- Metadata enrichment

#### 3. Report Builder Component
Location: `src/app/components/reports/report-builder/`
- Complex form with tabs (Data, Filters, Visualize)
- Column selection
- Dynamic filter builder with type-aware operators
- Sorting configuration
- Column formatting per data type
- Visualization type selector
- **Implementation approach:**
  - Use Angular Reactive Forms
  - FormArray for dynamic filters/sorts
  - Child components for each tab

#### 4. Report Viewer Component
Location: `src/app/components/reports/report-viewer/`
- Data fetching (AI or live)
- Table display with formatting
- Chart rendering using ngx-charts
- Excel export
- Performance metrics
- **Chart mappings:**
  - Bar → `ngx-charts-bar-vertical`
  - Line → `ngx-charts-line-chart`
  - Pie → `ngx-charts-pie-chart`
  - Area → `ngx-charts-area-chart`

#### 5. Custom Pipes
Location: `src/app/pipes/`
- Date formatting pipe
- Number formatting pipe
- Currency formatting pipe
- Boolean formatting pipe
- String formatting pipe

#### 6. Testing
- Unit tests for services
- Component tests
- E2E tests

## Technology Stack

- **Framework**: Angular 19 (Standalone Components)
- **State Management**: RxJS with BehaviorSubjects
- **Styling**: TailwindCSS 3.x
- **Charts**: @swimlane/ngx-charts
- **Icons**: @ng-icons/lucide
- **HTTP**: Angular HttpClient
- **Forms**: Angular Reactive Forms
- **AI**: Google Gemini API (@google/genai)
- **Excel Export**: xlsx library

## Key Differences from React Version

1. **State Management**: BehaviorSubjects instead of useState hooks
2. **Side Effects**: ngOnInit/ngOnChanges instead of useEffect
3. **Templates**: HTML templates instead of JSX
4. **Forms**: Reactive Forms with ControlValueAccessor
5. **Routing**: Angular Router with routerLink
6. **Dependency Injection**: Services injected via constructor
7. **Observables**: RxJS throughout instead of Promises

## Development Notes

### Running with Backend

Ensure the backend server is running on port 3001:

```bash
cd ../server
npm run dev
```

The Angular dev server will proxy API calls to the backend.

### Mock Users

The app includes mock users for development:
- Alice Admin (admin)
- Bob Analyst (user)
- Charlie Viewer (user)

Switch between users using the dropdown in the navigation sidebar.

### AI Features

To enable AI features (schema discovery, data generation), set the Gemini API key in `src/environments/environment.ts`.

## Next Steps

1. Implement Report List Component
2. Implement DataSource List Component (convert DataSourceView)
3. Implement Report Builder Component
4. Implement Report Viewer Component
5. Create custom formatting pipes
6. Add unit tests
7. Add E2E tests
8. Production deployment configuration

## License

See main project LICENSE file.
