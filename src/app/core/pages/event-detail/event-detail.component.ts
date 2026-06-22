import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { Event, EventCategoryLabels } from '../../models/event.model';
import { AuthService } from '../../services/auth.service';
import { EventsService } from '../../services/events.service';
import { NotificationsService } from '../../services/notifications.service';
import { LoginRequiredModalComponent } from '../../components/login-required-modal/login-required-modal.component';

export interface EnrolledParticipant {
  registrationId: string;
  id: string;
  name: string;
  email: string;
  cpf: string;
  birthDate: string;
  phone: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER' | string;
  status?: string;
}

@Component({
  selector: 'app-event-detail',
  standalone: true,
  imports: [CommonModule, MatIconModule, LoginRequiredModalComponent],
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
  isProcessingEnrollment = signal(false);
  showLoginModal = signal(false);
  actionMessage = signal<string | null>(null);
  actionError = signal<string | null>(null);
  processingRegistrationId = signal<string | null>(null);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private eventsService: EventsService,
    private notificationsService: NotificationsService,
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

  /** Click handler for the single participate/cancel button. */
  onParticipateClick() {
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

  closeLoginModal() {
    this.showLoginModal.set(false);
  }

  private joinEvent() {
    const event = this.event();
    if (!event || this.isProcessingEnrollment() || this.isEnrolled()) return;

    this.isProcessingEnrollment.set(true);

    this.eventsService.enrollInEvent(event.id).subscribe({
      next: () => {
        this.isEnrolled.set(true);
        this.isProcessingEnrollment.set(false);
        this.event.set({
          ...event,
          enrolledCount: (event.enrolledCount ?? 0) + 1
        });
      },
      error: (err) => {
        console.error('Erro ao participar do evento:', err);
        this.isProcessingEnrollment.set(false);
      }
    });
  }

  private cancelEnrollment() {
    const event = this.event();
    if (!event || this.isProcessingEnrollment() || !this.isEnrolled()) return;

    this.isProcessingEnrollment.set(true);

    this.eventsService.cancelEnrollment(event.id).subscribe({
      next: () => {
        this.isEnrolled.set(false);
        this.isProcessingEnrollment.set(false);
        this.event.set({
          ...event,
          enrolledCount: Math.max(0, (event.enrolledCount ?? 1) - 1)
        });
      },
      error: (err) => {
        console.error('Erro ao cancelar inscrição:', err);
        this.isProcessingEnrollment.set(false);
      }
    });
  }

  notifyAbsence() {
    const event = this.event();
    if (!event || this.isProcessingEnrollment()) return;

    const justification = window.prompt('Informe o motivo da ausencia:');
    if (!justification || !justification.trim()) return;

    this.isProcessingEnrollment.set(true);
    this.actionError.set(null);
    this.actionMessage.set(null);

    this.eventsService.notifyAbsence(event.id, justification.trim()).subscribe({
      next: () => {
        this.isProcessingEnrollment.set(false);
        this.isEnrolled.set(false);
        this.actionMessage.set('Aviso de ausencia registrado.');
        this.notificationsService.add('Aviso de ausencia', 'Seu aviso de ausencia foi registrado no evento.', 'success');
      },
      error: (err) => {
        console.error('Erro ao avisar ausencia:', err);
        this.isProcessingEnrollment.set(false);
        this.actionError.set('Nao foi possivel registrar o aviso de ausencia.');
      }
    });
  }

  rejectParticipant(participant: EnrolledParticipant) {
    const justification = window.prompt('Informe o motivo da recusa:', 'Perfil nao aderente a acao');
    if (!justification || !justification.trim()) return;

    this.runParticipantAction(
      participant,
      () => this.eventsService.rejectRegistration(participant.registrationId, { justification: justification.trim() }),
      'Inscricao recusada.'
    );
  }

  dismissParticipant(participant: EnrolledParticipant) {
    const justification = window.prompt('Informe o motivo da dispensa:', 'Equipe completa');
    if (!justification || !justification.trim()) return;

    this.runParticipantAction(
      participant,
      () => this.eventsService.dismissRegistration(participant.registrationId, { justification: justification.trim() }),
      'Participante dispensado.'
    );
  }

  addFeedback(participant: EnrolledParticipant) {
    const ratingText = window.prompt('Nota do participante (1 a 5):', '5');
    if (!ratingText) return;

    const rating = Number(ratingText);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      this.actionError.set('A nota deve ser um numero entre 1 e 5.');
      return;
    }

    const comment = window.prompt('Comentario do organizador:', 'Participacao registrada no evento');
    this.runParticipantAction(
      participant,
      () => this.eventsService.addOrganizerFeedback(participant.registrationId, {
        rating,
        comment: comment?.trim() || null
      }),
      'Feedback registrado.',
      false
    );
  }

  private runParticipantAction(
    participant: EnrolledParticipant,
    requestFactory: () => any,
    successMessage: string,
    removeFromActiveList = true
  ) {
    if (this.processingRegistrationId()) return;

    this.processingRegistrationId.set(participant.registrationId);
    this.actionError.set(null);
    this.actionMessage.set(null);

    requestFactory().subscribe({
      next: () => {
        this.processingRegistrationId.set(null);
        this.actionMessage.set(successMessage);
        this.notificationsService.add('Acao concluida', successMessage, 'success');
        const event = this.event();
        if (event && removeFromActiveList) {
          this.loadEnrolledParticipants(event.id);
          this.event.set({
            ...event,
            enrolledCount: Math.max(0, (event.enrolledCount ?? 1) - 1)
          });
        }
      },
      error: (err: unknown) => {
        console.error('Erro ao gerenciar participante:', err);
        this.processingRegistrationId.set(null);
        this.actionError.set('Nao foi possivel concluir a acao.');
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

  statusLabel(status?: string): string {
    const map: Record<string, string> = {
      REGISTERED: 'Inscrito',
      PENDING: 'Pendente',
      CONFIRMED: 'Confirmado',
      PRESENT: 'Presente',
      JUSTIFIED: 'Justificado'
    };
    return status ? map[status] ?? status : 'Inscrito';
  }

  isEventEnded(): boolean {
    const event = this.event();
    return !!event?.endsAt && new Date(event.endsAt).getTime() < Date.now();
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
}
