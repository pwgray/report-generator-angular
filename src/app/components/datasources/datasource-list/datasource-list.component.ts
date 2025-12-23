import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AppStateService } from '../../../services/app-state.service';
import { DataSource } from '../../../models/datasource.model';
import { User } from '../../../models/user.model';
import { CardComponent } from '../../../shared/components/card/card.component';
import { ButtonComponent } from '../../../shared/components/button/button.component';

@Component({
  selector: 'app-datasource-list',
  standalone: true,
  imports: [CommonModule, CardComponent, ButtonComponent],
  templateUrl: './datasource-list.component.html',
  styleUrl: './datasource-list.component.scss'
})
export class DatasourceListComponent implements OnInit {
  dataSources: DataSource[] = [];
  currentUser: User | null = null;
  isReadOnly: boolean = false;

  constructor(
    private appState: AppStateService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.appState.currentUser$.subscribe(user => {
      this.currentUser = user;
      this.isReadOnly = user.role !== 'admin';
    });

    this.appState.dataSources$.subscribe(dataSources => {
      this.dataSources = dataSources;
    });
  }

  onAddDataSource(): void {
    // Navigate to data source editor
    this.router.navigate(['/datasources/editor']);
  }

  onEditDataSource(ds: DataSource): void {
    // Navigate to data source editor with ID
    console.log('[DatasourceList] Editing data source:', ds.id);
    this.router.navigate(['/datasources/editor', ds.id]);
  }

  onDeleteDataSource(ds: DataSource): void {
    if (confirm(`Delete data source "${ds.name}"?`)) {
      // TODO: Call service and update state
      alert('Delete functionality not yet implemented');
    }
  }
}
