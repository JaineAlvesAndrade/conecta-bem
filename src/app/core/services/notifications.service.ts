import { Injectable, computed, signal } from '@angular/core';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
  type: 'success' | 'info' | 'warning';
}

@Injectable({
  providedIn: 'root'
})
export class NotificationsService {
  private readonly storageKey = 'conectabem.notifications';
  private readonly notifications = signal<AppNotification[]>(this.loadNotifications());

  readonly items = computed(() => this.notifications());
  readonly unreadCount = computed(() => this.notifications().filter(item => !item.read).length);

  add(title: string, message: string, type: AppNotification['type'] = 'info') {
    const notification: AppNotification = {
      id: crypto.randomUUID(),
      title,
      message,
      createdAt: new Date().toISOString(),
      read: false,
      type
    };

    this.setNotifications([notification, ...this.notifications()].slice(0, 30));
  }

  markAllAsRead() {
    this.setNotifications(this.notifications().map(item => ({ ...item, read: true })));
  }

  remove(id: string) {
    this.setNotifications(this.notifications().filter(item => item.id !== id));
  }

  clear() {
    this.setNotifications([]);
  }

  private setNotifications(items: AppNotification[]) {
    this.notifications.set(items);
    localStorage.setItem(this.storageKey, JSON.stringify(items));
  }

  private loadNotifications(): AppNotification[] {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }
}
