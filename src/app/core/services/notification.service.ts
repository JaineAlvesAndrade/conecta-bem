import { Injectable, signal, computed } from '@angular/core';
import { catchError, map, switchMap } from 'rxjs/operators';
import { forkJoin, of } from 'rxjs';
import { AppNotification, EventRegistrationResponse } from '../models/event-registration.model';
import { AuthService } from './auth.service';
import { EventsService } from './events.service';
import { EventRegistrationService } from './event-registration.service';
import { Event } from '../models/event.model';

interface VolunteerEnrollmentEntry {
  eventId: string;
  wasEnrolled: boolean;
  lastChecked: string;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly NOTIFICATIONS_KEY = 'cb_notifications';
  private readonly SEEN_REGS_KEY = 'cb_seen_regs';
  private readonly VOLUNTEER_ENROLLMENTS_KEY = 'cb_vol_enrollments';

  private _notifications = signal<AppNotification[]>([]);
  notifications = this._notifications.asReadonly();
  unreadCount = computed(() => this._notifications().filter(n => !n.read).length);

  constructor(
    private authService: AuthService,
    private eventsService: EventsService,
    private registrationService: EventRegistrationService
  ) {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.NOTIFICATIONS_KEY);
      if (stored) {
        this._notifications.set(JSON.parse(stored));
      }
    } catch {
      this._notifications.set([]);
    }
  }

  private saveToStorage(): void {
    const recent = this._notifications().slice(0, 50);
    localStorage.setItem(this.NOTIFICATIONS_KEY, JSON.stringify(recent));
  }

  private getSeenRegistrationIds(): Set<string> {
    try {
      const stored = localStorage.getItem(this.SEEN_REGS_KEY);
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  }

  private addSeenRegistrationIds(ids: string[]): void {
    const seen = this.getSeenRegistrationIds();
    ids.forEach(id => seen.add(id));
    localStorage.setItem(this.SEEN_REGS_KEY, JSON.stringify([...seen]));
  }

  refresh(): void {
    if (!this.authService.isLoggedIn()) return;
    this.refreshOrganizerNotifications();
    this.refreshVolunteerNotifications();
  }

  private refreshOrganizerNotifications(): void {
    const userId = this.authService.getUserId();
    if (!userId) return;

    this.eventsService.getPublicEvents().pipe(
      catchError(() => of([] as Event[])),
      map(events => events.filter(e => String(e.ownerId) === String(userId))),
      map(events => events.filter(e => {
        const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        return new Date(e.endsAt) > cutoff;
      }).slice(0, 10)),
      switchMap(events => {
        if (events.length === 0) {
          return of([] as Array<{ event: Event; registrations: EventRegistrationResponse[] }>);
        }
        return forkJoin(
          events.map(event =>
            this.registrationService.getRegistrationsByEvent(event.id).pipe(
              catchError(() => of([] as EventRegistrationResponse[])),
              map(registrations => ({ event, registrations }))
            )
          )
        );
      })
    ).subscribe(results => {
      const seen = this.getSeenRegistrationIds();
      const current = this._notifications();
      const currentIds = new Set(current.map(n => n.id));
      const newNotifications: AppNotification[] = [];
      const newSeenIds: string[] = [];

      results.forEach(({ event, registrations }) => {
        registrations
          .filter(r => r.status === 'PENDING' && !seen.has(r.id))
          .forEach(reg => {
            const notifId = `org_${reg.id}`;
            if (!currentIds.has(notifId)) {
              newNotifications.push({
                id: notifId,
                type: 'pending_enrollment',
                title: 'Nova inscrição',
                message: `Um voluntário se inscreveu no evento "${event.title}"`,
                eventId: event.id,
                timestamp: reg.registeredAt,
                read: false
              });
              newSeenIds.push(reg.id);
            }
          });
      });

      if (newNotifications.length > 0) {
        this._notifications.update(cur => [...newNotifications, ...cur]);
        this.addSeenRegistrationIds(newSeenIds);
        this.saveToStorage();
      }
    });
  }

  private refreshVolunteerNotifications(): void {
    try {
      const stored = localStorage.getItem(this.VOLUNTEER_ENROLLMENTS_KEY);
      if (!stored) return;

      const enrollments: VolunteerEnrollmentEntry[] = JSON.parse(stored);
      const updated = [...enrollments];

      enrollments.forEach((entry, index) => {
        this.eventsService.isUserEnrolled(entry.eventId).pipe(
          catchError(() => of(false))
        ).subscribe(enrolled => {
          if (entry.wasEnrolled && !enrolled) {
            const notifId = `vol_status_${entry.eventId}`;
            const exists = this._notifications().some(n => n.id === notifId);
            if (!exists) {
              this._notifications.update(cur => [{
                id: notifId,
                type: 'enrollment_changed' as const,
                title: 'Atualização na sua inscrição',
                message: 'O status de uma das suas inscrições foi atualizado. Confira o evento para mais detalhes.',
                eventId: entry.eventId,
                timestamp: new Date().toISOString(),
                read: false
              }, ...cur]);
              this.saveToStorage();
            }
          }
          updated[index] = { ...entry, wasEnrolled: enrolled, lastChecked: new Date().toISOString() };
          localStorage.setItem(this.VOLUNTEER_ENROLLMENTS_KEY, JSON.stringify(updated));
        });
      });
    } catch {
      // ignore storage errors
    }
  }

  trackEnrollment(eventId: string): void {
    try {
      const stored = localStorage.getItem(this.VOLUNTEER_ENROLLMENTS_KEY);
      const enrollments: VolunteerEnrollmentEntry[] = stored ? JSON.parse(stored) : [];
      const idx = enrollments.findIndex(e => e.eventId === eventId);
      const entry: VolunteerEnrollmentEntry = { eventId, wasEnrolled: true, lastChecked: new Date().toISOString() };
      if (idx === -1) {
        enrollments.push(entry);
      } else {
        enrollments[idx] = entry;
      }
      localStorage.setItem(this.VOLUNTEER_ENROLLMENTS_KEY, JSON.stringify(enrollments));
    } catch {
      // ignore
    }
  }

  untrackEnrollment(eventId: string): void {
    try {
      const stored = localStorage.getItem(this.VOLUNTEER_ENROLLMENTS_KEY);
      if (!stored) return;
      const enrollments = (JSON.parse(stored) as VolunteerEnrollmentEntry[]).filter(e => e.eventId !== eventId);
      localStorage.setItem(this.VOLUNTEER_ENROLLMENTS_KEY, JSON.stringify(enrollments));
      const notifId = `vol_status_${eventId}`;
      this._notifications.update(cur => cur.filter(n => n.id !== notifId));
      this.saveToStorage();
    } catch {
      // ignore
    }
  }

  markRead(id: string): void {
    this._notifications.update(notifs => notifs.map(n => n.id === id ? { ...n, read: true } : n));
    this.saveToStorage();
  }

  markAllRead(): void {
    this._notifications.update(notifs => notifs.map(n => ({ ...n, read: true })));
    this.saveToStorage();
  }

  clearUserNotifications(): void {
    this._notifications.set([]);
    localStorage.removeItem(this.NOTIFICATIONS_KEY);
    localStorage.removeItem(this.SEEN_REGS_KEY);
    localStorage.removeItem(this.VOLUNTEER_ENROLLMENTS_KEY);
  }
}
