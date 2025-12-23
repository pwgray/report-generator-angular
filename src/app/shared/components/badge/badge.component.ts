import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-badge',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './badge.component.html',
  styleUrl: './badge.component.scss'
})
export class BadgeComponent {
  @Input() color: 'blue' | 'green' | 'red' | 'yellow' | 'gray' | 'purple' = 'gray';
  @Input() className: string = '';

  get badgeClasses(): string {
    const baseStyles = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';
    
    const colors = {
      blue: 'bg-blue-100 text-blue-800',
      green: 'bg-green-100 text-green-800',
      red: 'bg-red-100 text-red-800',
      yellow: 'bg-yellow-100 text-yellow-800',
      gray: 'bg-gray-100 text-gray-800',
      purple: 'bg-purple-100 text-purple-800'
    };

    return `${baseStyles} ${colors[this.color]} ${this.className}`;
  }
}
