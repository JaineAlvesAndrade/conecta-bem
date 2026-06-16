import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { Event, EventCategoryLabels } from '../../models/event.model';
import { AuthService } from '../../services/auth.service';
import { EventsService } from '../../services/events.service';

export interface EnrolledParticipant {
  id: string;
  name: string;
  email: string;
  cpf: string;
  birthDate: string;
  phone: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER' | string;
}

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
  enrolledParticipants = signal<EnrolledParticipant[]>([]);
  isLoadingEnrolled = signal(false);
  isEnrolled = signal(false);
  isEnrolling = signal(false);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private eventsService: EventsService,
    public authService: AuthService
  ) {}

  getImageSrc(event: Event | null): string {
    if (!event) return '/assets/no_image.png';
    const rawImage = event.imageUrl || event.image;
    if (!rawImage) return '/assets/no_image.png';
    if (rawImage.startsWith('data:') || rawImage.startsWith('http')) return rawImage;
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

        this.checkEnrollmentStatus(event);
        if (this.canManageEvent()) {
          this.loadEnrolledParticipants(id);
        }
      },
      error: (err) => {
        console.error('Erro ao carregar evento:', err);
        this.error.set('Falha ao carregar o evento.');
        this.isLoading.set(false);
      }
    });
  }

  private checkEnrollmentStatus(event: Event) {
    if (!this.authService.isLoggedIn() || this.canManageEvent()) return;

    this.eventsService.isUserEnrolled(event.id).subscribe({
      next: (enrolled) => this.isEnrolled.set(enrolled),
      error: () => this.isEnrolled.set(false)
    });
  }

  private loadEnrolledParticipants(eventId: string) {
    this.isLoadingEnrolled.set(true);

    this.eventsService.getEnrolledParticipants(eventId).subscribe({
      next: (participants) => {
        this.enrolledParticipants.set(participants);
        this.isLoadingEnrolled.set(false);
      },
      error: (err) => {
        console.error('Erro ao carregar participantes:', err);
        this.isLoadingEnrolled.set(false);
      }
    });
  }

  joinEvent() {
    const event = this.event();
    if (!event || this.isEnrolling() || this.isEnrolled()) return;

    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/auth']);
      return;
    }

    this.isEnrolling.set(true);

    this.eventsService.enrollInEvent(event.id).subscribe({
      next: () => {
        this.isEnrolled.set(true);
        this.isEnrolling.set(false);
        this.event.set({
          ...event,
          enrolledCount: (event.enrolledCount ?? 0) + 1
        });
      },
      error: (err) => {
        console.error('Erro ao participar do evento:', err);
        this.isEnrolling.set(false);
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

  formatDate(dateString: string): string {
    try {
      return new Intl.DateTimeFormat('pt-BR').format(new Date(dateString));
    } catch {
      return dateString;
    }
  }

  genderLabel(gender: string): string {
    const map: Record<string, string> = {
      MALE: 'Masculino',
      FEMALE: 'Feminino',
      OTHER: 'Outro'
    };
    return map[gender] ?? gender;
  }

  canManageEvent(): boolean {
    const event = this.event();
    if (!event || !this.authService.isLoggedIn()) return false;
    const loggedUserId = this.authService.getUserId();
    return !!loggedUserId && !!event.ownerId && String(event.ownerId) === String(loggedUserId);
  }

  deleteImage() {
    if (!this.event() || this.isDeletingImage()) return;
    this.showDeleteImageConfirm.set(true);
  }

  cancelDeleteImage() {
    if (this.isDeletingImage()) return;
    this.showDeleteImageConfirm.set(false);
  }

  confirmDeleteImage() {
    const event = this.event();
    if (!event || this.isDeletingImage()) return;

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

cancelEnrollment() {
  const event = this.event();
  if (!event || !this.isEnrolled() || this.canManageEvent()) return;

  this.isEnrolling.set(true);
  this.eventsService.cancelEnrollment(event.id).subscribe({
    next: () => {
      this.isEnrolled.set(false);
      this.isEnrolling.set(false);
      this.event.set({
        ...event,
        enrolledCount: Math.max((event.enrolledCount ?? 0) - 1, 0)
      });
    },
    error: (err) => {
      console.error('Erro ao cancelar inscrição:', err);
      this.isEnrolling.set(false);
    }
  });
}
}