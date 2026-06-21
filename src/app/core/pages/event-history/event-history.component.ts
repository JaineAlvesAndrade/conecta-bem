import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { Event, EventCategoryLabels } from '../../models/event.model';
import { EventsService } from '../../services/events.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-event-history',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './event-history.component.html',
  styleUrls: ['./event-history.component.scss']
})
export class EventHistoryComponent implements OnInit {
  enrolledEvents = signal<Event[]>([]);
  isLoading = signal(true);
  error = signal<string | null>(null);

  now = new Date();

  upcomingEvents = computed(() =>
    this.enrolledEvents().filter(e => new Date(e.endsAt) >= this.now)
  );

  pastEvents = computed(() =>
    this.enrolledEvents().filter(e => new Date(e.endsAt) < this.now)
  );

  constructor(
    private eventsService: EventsService,
    public authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/auth']);
      return;
    }
    this.loadHistory();
  }

  private loadHistory() {
    this.isLoading.set(true);
    this.error.set(null);

    this.eventsService.getMyEnrolledEvents().subscribe({
      next: (events) => {
        this.enrolledEvents.set(events);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Erro ao carregar histórico:', err);
        this.error.set('Falha ao carregar seu histórico de eventos.');
        this.isLoading.set(false);
      }
    });
  }

  goToEvent(event: Event) {
    this.router.navigate(['/eventos', event.id]);
  }

  categoryLabel(event: Event): string {
    return EventCategoryLabels[event.category] ?? event.category;
  }

  formatDate(dateString: string): string {
    try {
      return new Intl.DateTimeFormat('pt-BR', {
        dateStyle: 'medium',
        timeStyle: 'short'
      }).format(new Date(dateString));
    } catch {
      return dateString;
    }
  }

  getImageSrc(event: Event): string {
    const raw = event.imageUrl || event.image;
    if (!raw) return '/assets/no_image.png';
    if (raw.startsWith('data:') || raw.startsWith('http')) return raw;
    return `data:image/*;base64,${raw}`;
  }

  retry() {
    this.loadHistory();
  }
}