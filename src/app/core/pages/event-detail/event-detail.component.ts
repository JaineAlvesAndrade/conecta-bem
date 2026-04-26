import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { Event, EventCategoryLabels } from '../../models/event.model';
import { AuthService } from '../../services/auth.service';
import { EventsService } from '../../services/events.service';

@Component({
  selector: 'app-event-detail',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './event-detail.component.html',
  styleUrls: ['./event-detail.component.scss']
})
export class EventDetailComponent implements OnInit {
  event = signal<Event | null>(null);
  isLoading = signal(true);
  error = signal<string | null>(null);
  isDeletingImage = signal(false);
  showDeleteImageConfirm = signal(false);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private eventsService: EventsService,
    public authService: AuthService
  ) {}

  getImageSrc(event: Event | null): string {
    if (!event) {
      return '/assets/no_image.png';
    }

    const rawImage = event.imageUrl || event.image;

    if (!rawImage) {
      return '/assets/no_image.png';
    }

    if (rawImage.startsWith('data:') || rawImage.startsWith('http')) {
      return rawImage;
    }

    return `data:image/*;base64,${rawImage}`;
  }

  ngOnInit(): void {
    const eventId = this.route.snapshot.paramMap.get('id');

    if (!eventId) {
      this.error.set('Evento não encontrado.');
      this.isLoading.set(false);
      return;
    }

    this.loadEvent(eventId);
  }

  private loadEvent(id: string) {
    this.isLoading.set(true);
    this.error.set(null);

    this.eventsService.getPublicEventById(id).subscribe({
      next: (event) => {
        this.event.set(event);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Erro ao carregar evento:', err);
        this.error.set('Falha ao carregar o evento.');
        this.isLoading.set(false);
      }
    });
  }

  get categoryLabel(): string {
    const event = this.event();
    return event ? EventCategoryLabels[event.category] : '';
  }

  formatDateTime(dateString: string): string {
    try {
      return new Intl.DateTimeFormat('pt-BR', {
        dateStyle: 'full',
        timeStyle: 'short'
      }).format(new Date(dateString));
    } catch {
      return dateString;
    }
  }

  canManageEvent(): boolean {
    const event = this.event();
    if (!event || !this.authService.isLoggedIn()) {
      return false;
    }

    const loggedUserId = this.authService.getUserId();
    return !!loggedUserId && !!event.ownerId && String(event.ownerId) === String(loggedUserId);
  }

  deleteImage() {
    const event = this.event();
    if (!event || this.isDeletingImage()) {
      return;
    }

    this.showDeleteImageConfirm.set(true);
  }

  cancelDeleteImage() {
    if (this.isDeletingImage()) {
      return;
    }

    this.showDeleteImageConfirm.set(false);
  }

  confirmDeleteImage() {
    const event = this.event();
    if (!event || this.isDeletingImage()) {
      return;
    }

    this.isDeletingImage.set(true);
    this.showDeleteImageConfirm.set(false);

    this.eventsService.deleteEventImage(event.id).subscribe({
      next: (response) => {
        if (response && typeof response === 'object' && 'id' in response) {
          const updatedEvent = response as Event;
          this.event.set({
            ...event,
            ...updatedEvent,
            image: updatedEvent.image ?? undefined,
            imageUrl: updatedEvent.imageUrl ?? undefined
          });
        } else {
          this.event.set({ ...event, image: undefined, imageUrl: undefined });
        }
        this.isDeletingImage.set(false);
      },
      error: (err) => {
        console.error('Erro ao remover imagem:', err);
        this.error.set('Falha ao remover a imagem.');
        this.isDeletingImage.set(false);
      }
    });
  }

  goBack() {
    this.router.navigate(['/eventos']);
  }
}
