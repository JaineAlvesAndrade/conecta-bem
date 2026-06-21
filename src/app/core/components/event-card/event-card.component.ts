import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { Event, EventCategory, EventCategoryLabels } from '../../models/event.model';
import { AuthService } from '../../services/auth.service';
import { EventsService } from '../../services/events.service';
import { LoginRequiredModalComponent } from '../login-required-modal/login-required-modal.component';

@Component({
    selector: 'app-event-card',
    standalone: true,
    imports: [CommonModule, RouterLink, MatIconModule, LoginRequiredModalComponent],
    templateUrl: './event-card.component.html',
    styleUrls: ['./event-card.component.scss']
})
export class EventCardComponent implements OnInit, OnChanges {
    @Input() event!: Event;
    @Input() canEdit = false;
    @Output() edit = new EventEmitter<void>();
    @Output() enrollmentChanged = new EventEmitter<void>();

    showLoginModal = false;
    isEnrolled = false;
    isCheckingEnrollment = false;
    isProcessingEnrollment = false;

    constructor(
        public authService: AuthService,
        private eventsService: EventsService
    ) {}

    ngOnInit() {
        this.refreshEnrollmentStatus();
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes['event'] && !changes['event'].firstChange) {
            this.refreshEnrollmentStatus();
        }
    }

    private refreshEnrollmentStatus() {
        if (!this.event || this.canEdit || !this.authService.isLoggedIn()) {
            this.isEnrolled = false;
            return;
        }

        this.isCheckingEnrollment = true;
        this.eventsService.isUserEnrolled(this.event.id).subscribe({
            next: (enrolled) => {
                this.isEnrolled = enrolled;
                this.isCheckingEnrollment = false;
            },
            error: () => {
                this.isCheckingEnrollment = false;
            }
        });
    }

    getImageSrc(event: Event): string {
        const rawImage = event.imageUrl || event.image;

        if (!rawImage) {
            return '/assets/no_image.png';
        }

        if (rawImage.startsWith('data:') || rawImage.startsWith('http')) {
            return rawImage;
        }

        return `data:image/*;base64,${rawImage}`;
    }

    formatDate(dateString: string): string {
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
            }).replace('.', '');
        } catch {
            return dateString;
        }
    }

    getCategoryLabel(category: EventCategory): string {
        return EventCategoryLabels[category] || category;
    }

    getLocationText(): string {
        if (!this.event.address) {
            return 'Local não definido';
        }
        
        const { city, state } = this.event.address;
        if (city && state) {
            return `${city}, ${state}`;
        } else if (city) {
            return city;
        } else if (state) {
            return state;
        }
        return 'Local não definido';
    }

    getEnrolledText(): string {
        const enrolled = this.event.enrolledCount || 0;
        const capacity = this.event.capacity;
        return `${enrolled}/${capacity} inscritos`;
    }

    getShortDescription(): string {
        if (!this.event.description) return '';
        const maxLength = 100;
        if (this.event.description.length <= maxLength) {
            return this.event.description;
        }
        return this.event.description.substring(0, maxLength) + '...';
    }

    getDurationText(): string {
        try {
            const start = new Date(this.event.startsAt);
            const end = new Date(this.event.endsAt);
            const durationMs = end.getTime() - start.getTime();
            const durationHours = durationMs / (1000 * 60 * 60);
            
            if (durationHours < 1) {
                const durationMinutes = Math.round(durationMs / (1000 * 60));
                return `${durationMinutes} min`;
            } else if (durationHours === 1) {
                return '1 hora';
            } else if (durationHours < 24) {
                return `${Math.round(durationHours)} horas`;
            } else {
                const days = Math.round(durationHours / 24);
                return `${days} ${days === 1 ? 'dia' : 'dias'}`;
            }
        } catch {
            return 'Duração não informada';
        }
    }

    isEventUrgent(): boolean {
        const today = new Date();
        const eventDate = new Date(this.event.startsAt);
        const daysUntilEvent = Math.ceil((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        return daysUntilEvent >= 0 && daysUntilEvent <= 7;
    }

    onEditClick() {
        this.edit.emit();
    }

    onParticipateClick() {
        if (this.isProcessingEnrollment) {
            return;
        }

        if (!this.authService.isLoggedIn()) {
            this.showLoginModal = true;
            return;
        }

        if (this.isEnrolled) {
            this.cancelEnrollment();
        } else {
            this.enroll();
        }
    }

    private enroll() {
        this.isProcessingEnrollment = true;

        this.eventsService.enrollInEvent(this.event.id).subscribe({
            next: () => {
                this.isEnrolled = true;
                this.isProcessingEnrollment = false;
                this.event = { ...this.event, enrolledCount: (this.event.enrolledCount ?? 0) + 1 };
                this.enrollmentChanged.emit();
            },
            error: (err) => {
                console.error('Erro ao participar do evento:', err);
                this.isProcessingEnrollment = false;
            }
        });
    }

    private cancelEnrollment() {
        this.isProcessingEnrollment = true;

        this.eventsService.cancelEnrollment(this.event.id).subscribe({
            next: () => {
                this.isEnrolled = false;
                this.isProcessingEnrollment = false;
                this.event = {
                    ...this.event,
                    enrolledCount: Math.max(0, (this.event.enrolledCount ?? 1) - 1)
                };
                this.enrollmentChanged.emit();
            },
            error: (err) => {
                console.error('Erro ao cancelar inscrição:', err);
                this.isProcessingEnrollment = false;
            }
        });
    }

    closeLoginModal() {
        this.showLoginModal = false;
    }
}