import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AppStateService } from '../../services/app-state.service';
import { User, MOCK_USERS } from '../../models/user.model';

@Component({
  selector: 'app-navigation',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navigation.component.html',
  styleUrl: './navigation.component.scss'
})
export class NavigationComponent implements OnInit {
  currentUser: User = MOCK_USERS[0];
  mockUsers = MOCK_USERS;

  constructor(private appState: AppStateService) {}

  ngOnInit(): void {
    this.appState.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  }

  onUserChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const user = this.mockUsers.find(u => u.id === select.value);
    if (user) {
      this.appState.setCurrentUser(user);
    }
  }

  getUserInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('');
  }
}
