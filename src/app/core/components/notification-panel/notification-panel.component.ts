import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { AppNotification } from '../../models/event-registration.model';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-notification-panel',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './notification-panel.component.html',
  styleUrls: ['./notification-panel.component.scss']
})
export class NotificationPanelComponent {
  @Output() close = new EventEmitter<void>();

  constructor(
    public notificationService: NotificationService,
    private router: Router
  ) {}

  onNotificationClick(notification: AppNotification): void {
    this.notificationService.markRead(notification.id);
    this.close.emit();
    this.router.navigate(['/eventos', notification.eventId]);
  }

  onMarkAllRead(): void {
    this.notificationService.markAllRead();
  }

  formatTime(timestamp: string): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const minutes = Math.floor(diffMs / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'Agora';
    if (minutes < 60) return `${minutes}m atrás`;
    if (hours < 24) return `${hours}h atrás`;
    if (days === 1) return 'Ontem';
    return `${days}d atrás`;
  }

  typeIcon(type: AppNotification['type']): string {
    return type === 'pending_enrollment' ? 'person_add' : 'notifications_active';
  }
}
