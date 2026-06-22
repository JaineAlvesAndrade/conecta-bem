import { CommonModule } from '@angular/common';
import { Component, OnInit, signal, computed } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { Event, EventCategoryLabels } from '../../models/event.model';
import { EventRegistrationResponse, RegistrationStatus } from '../../models/event-registration.model';
import { AuthService } from '../../services/auth.service';
import { EventsService } from '../../services/events.service';
import { EventRegistrationService } from '../../services/event-registration.service';
import { NotificationService } from '../../services/notification.service';
import { LoginRequiredModalComponent } from '../../components/login-required-modal/login-required-modal.component';
import { FeedbackModalComponent, FeedbackSubmitEvent } from '../../components/feedback-modal/feedback-modal.component';
import { RejectModalComponent } from '../../components/reject-modal/reject-modal.component';

export interface EnrolledParticipant {
  id: string;
  name: string;
  email: string;
  cpf: string;
  birthDate: string;
  phone: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER' | string;
}

interface ParticipantWithRegistration {
  participantId: string;
  name: string;
  email: string;
  cpf: string;
  birthDate: string;
  phone: string;
  gender: string;
  registrationId: string;
  status: RegistrationStatus;
  justification: string | null;
  organizerFeedback: string | null;
  feedbackRating: number | null;
  registeredAt: string;
}

@Component({
  selector: 'app-event-detail',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    LoginRequiredModalComponent,
    FeedbackModalComponent,
    RejectModalComponent
  ],
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
  registrations = signal<EventRegistrationResponse[]>([]);
  isLoadingEnrolled = signal(false);
  isEnrolled = signal(false);
  isProcessingEnrollment = signal(false);
  showLoginModal = signal(false);

  activeFeedbackParticipant = signal<ParticipantWithRegistration | null>(null);
  activeRejectParticipant = signal<ParticipantWithRegistration | null>(null);
  processingRegistrationId = signal<string | null>(null);

  participantsWithRegistrations = computed<ParticipantWithRegistration[]>(() => {
    const participants = this.enrolledParticipants();
    const regs = this.registrations();

    const regsByVolunteerId = new Map(regs.map(r => [r.volunteerId, r]));

    const fromParticipants: ParticipantWithRegistration[] = participants
      .map(p => {
        const reg = regsByVolunteerId.get(p.id);
        if (!reg) return null;
        return {
          participantId: p.id,
          name: p.name,
          email: p.email,
          cpf: p.cpf,
          birthDate: p.birthDate,
          phone: p.phone,
          gender: p.gender,
          registrationId: reg.id,
          status: reg.status,
          justification: reg.justification,
          organizerFeedback: reg.organizerFeedback,
          feedbackRating: reg.feedbackRating,
          registeredAt: reg.registeredAt
        } satisfies ParticipantWithRegistration;
      })
      .filter((p): p is ParticipantWithRegistration => p !== null);

    const participantIds = new Set(participants.map(p => p.id));
    const fromRegsOnly: ParticipantWithRegistration[] = regs
      .filter(r => !participantIds.has(r.volunteerId))
      .map(r => ({
        participantId: r.volunteerId,
        name: 'Voluntário',
        email: '',
        cpf: '',
        birthDate: '',
        phone: '',
        gender: '',
        registrationId: r.id,
        status: r.status,
        justification: r.justification,
        organizerFeedback: r.organizerFeedback,
        feedbackRating: r.feedbackRating,
        registeredAt: r.registeredAt
      }));

    return [...fromParticipants, ...fromRegsOnly];
  });

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private eventsService: EventsService,
    private registrationService: EventRegistrationService,
    private notificationService: NotificationService,
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

  private loadEvent(id: string): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.eventsService.getPublicEventById(id).subscribe({
      next: (event) => {
        this.event.set(event);
        this.isLoading.set(false);
        this.checkEnrollmentStatus(event);
        if (this.canManageEvent()) {
          this.loadEnrolledParticipants(id);
          this.loadRegistrations(id);
        }
      },
      error: () => {
        this.error.set('Falha ao carregar o evento.');
        this.isLoading.set(false);
      }
    });
  }

  private checkEnrollmentStatus(event: Event): void {
    if (!this.authService.isLoggedIn() || this.canManageEvent()) return;

    this.eventsService.isUserEnrolled(event.id).subscribe({
      next: (enrolled) => this.isEnrolled.set(enrolled),
      error: () => this.isEnrolled.set(false)
    });
  }

  private loadEnrolledParticipants(eventId: string): void {
    this.isLoadingEnrolled.set(true);

    this.eventsService.getEnrolledParticipants(eventId).subscribe({
      next: (participants) => {
        this.enrolledParticipants.set(participants);
        this.isLoadingEnrolled.set(false);
      },
      error: () => {
        this.isLoadingEnrolled.set(false);
      }
    });
  }

  private loadRegistrations(eventId: string): void {
    this.registrationService.getRegistrationsByEvent(eventId).subscribe({
      next: (regs) => this.registrations.set(regs),
      error: () => this.registrations.set([])
    });
  }

  onParticipateClick(): void {
    if (this.isProcessingEnrollment()) return;

    if (!this.authService.isLoggedIn()) {
      this.showLoginModal.set(true);
      return;
    }

    if (this.isEnrolled()) {
      this.cancelEnrollment();
    } else {
      this.joinEvent();
    }
  }

  closeLoginModal(): void {
    this.showLoginModal.set(false);
  }

  private joinEvent(): void {
    const event = this.event();
    if (!event || this.isProcessingEnrollment() || this.isEnrolled()) return;

    this.isProcessingEnrollment.set(true);

    this.eventsService.enrollInEvent(event.id).subscribe({
      next: () => {
        this.isEnrolled.set(true);
        this.isProcessingEnrollment.set(false);
        this.notificationService.trackEnrollment(event.id);
        this.event.set({
          ...event,
          enrolledCount: (event.enrolledCount ?? 0) + 1
        });
      },
      error: () => {
        this.isProcessingEnrollment.set(false);
      }
    });
  }

  private cancelEnrollment(): void {
    const event = this.event();
    if (!event || this.isProcessingEnrollment() || !this.isEnrolled()) return;

    this.isProcessingEnrollment.set(true);

    this.eventsService.cancelEnrollment(event.id).subscribe({
      next: () => {
        this.isEnrolled.set(false);
        this.isProcessingEnrollment.set(false);
        this.notificationService.untrackEnrollment(event.id);
        this.event.set({
          ...event,
          enrolledCount: Math.max(0, (event.enrolledCount ?? 1) - 1)
        });
      },
      error: () => {
        this.isProcessingEnrollment.set(false);
      }
    });
  }

  openFeedbackModal(participant: ParticipantWithRegistration): void {
    this.activeFeedbackParticipant.set(participant);
  }

  closeFeedbackModal(): void {
    this.activeFeedbackParticipant.set(null);
  }

  onFeedbackSubmit(event: FeedbackSubmitEvent): void {
    const participant = this.activeFeedbackParticipant();
    if (!participant) return;

    this.processingRegistrationId.set(participant.registrationId);

    this.registrationService.addOrganizerFeedback(
      participant.registrationId,
      event.rating,
      event.comment
    ).subscribe({
      next: (updated) => {
        this.registrations.update(regs =>
          regs.map(r => r.id === updated.id ? updated : r)
        );
        this.processingRegistrationId.set(null);
        this.closeFeedbackModal();
      },
      error: () => {
        this.processingRegistrationId.set(null);
      }
    });
  }

  openRejectModal(participant: ParticipantWithRegistration): void {
    this.activeRejectParticipant.set(participant);
  }

  closeRejectModal(): void {
    this.activeRejectParticipant.set(null);
  }

  onRejectConfirm(justification: string | undefined): void {
    const participant = this.activeRejectParticipant();
    if (!participant) return;

    this.processingRegistrationId.set(participant.registrationId);

    this.registrationService.rejectRegistration(participant.registrationId, justification).subscribe({
      next: (updated) => {
        this.registrations.update(regs =>
          regs.map(r => r.id === updated.id ? updated : r)
        );
        this.enrolledParticipants.update(ps =>
          ps.filter(p => p.id !== participant.participantId)
        );
        this.processingRegistrationId.set(null);
        this.closeRejectModal();
      },
      error: () => {
        this.processingRegistrationId.set(null);
      }
    });
  }

  confirmRegistration(participant: ParticipantWithRegistration): void {
    if (this.processingRegistrationId()) return;

    this.processingRegistrationId.set(participant.registrationId);

    this.registrationService.confirmRegistration(participant.registrationId).subscribe({
      next: (updated) => {
        this.registrations.update(regs =>
          regs.map(r => r.id === updated.id ? updated : r)
        );
        this.processingRegistrationId.set(null);
      },
      error: () => {
        this.processingRegistrationId.set(null);
      }
    });
  }

  isEventEnded(): boolean {
    const event = this.event();
    if (!event) return false;
    return new Date(event.endsAt) < new Date();
  }

  canGiveFeedback(participant: ParticipantWithRegistration): boolean {
    return participant.status === 'CONFIRMED' && this.isEventEnded() && !participant.organizerFeedback;
  }

  statusLabel(status: RegistrationStatus): string {
    const labels: Record<RegistrationStatus, string> = {
      PENDING: 'Pendente',
      CONFIRMED: 'Confirmado',
      REJECTED: 'Recusado',
      DISMISSED: 'Dispensado'
    };
    return labels[status] ?? status;
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

  deleteImage(): void {
    if (!this.event() || this.isDeletingImage()) return;
    this.showDeleteImageConfirm.set(true);
  }

  cancelDeleteImage(): void {
    if (this.isDeletingImage()) return;
    this.showDeleteImageConfirm.set(false);
  }

  confirmDeleteImage(): void {
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
      error: () => {
        this.error.set('Falha ao remover a imagem.');
        this.isDeletingImage.set(false);
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/eventos']);
  }
}
