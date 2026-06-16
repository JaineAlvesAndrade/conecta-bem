import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { Event, EventCategory, EventCategoryLabels } from '../../models/event.model';
import { AuthService } from '../../services/auth.service';
import { EventsService } from '../../services/events.service';


@Component({
    selector: 'app-event-card',
    standalone: true,
    imports: [CommonModule, RouterLink, MatIconModule],
    templateUrl: './event-card.component.html',
    styleUrls: ['./event-card.component.scss']
})
export class EventCardComponent {
    @Input() event!: Event;
    @Input() canEdit = false;
    @Input() isEnrolled = false;
    @Output() edit = new EventEmitter<void>();
    @Output() enrolledChange = new EventEmitter<{ eventId: string; enrolled: boolean; newCount?: number }>();

    enrollLoading = false;

    public authService = inject(AuthService);
    private router = inject(Router);
    private eventsService = inject(EventsService);

    getImageSrc(event: Event): string {
        const rawImage = event.imageUrl || event.image;
        if (!rawImage) return '/assets/no_image.png';
        if (rawImage.startsWith('data:') || rawImage.startsWith('http')) return rawImage;
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
        if (!this.event.address) return 'Local não definido';
        const { city, state } = this.event.address;
        if (city && state) return `${city}, ${state}`;
        if (city) return city;
        if (state) return state;
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
        if (this.event.description.length <= maxLength) return this.event.description;
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

    canEnroll(): boolean {
        if (!this.authService.isLoggedIn()) return false;
        const loggedUserId = this.authService.getUserId();
        return !!loggedUserId && String(this.event.ownerId) !== String(loggedUserId);
    }

    handleEnroll() {
        if (!this.authService.isLoggedIn()) {
            this.router.navigate(['/auth']);
            return;
        }

        if (!this.canEnroll() || this.isEnrolled || this.enrollLoading) return;

        this.enrollLoading = true;
        this.eventsService.enrollInEvent(this.event.id).subscribe({
            next: () => {
                this.enrollLoading = false;
                const newCount = (this.event.enrolledCount || 0) + 1;
                this.enrolledChange.emit({
                    eventId: this.event.id,
                    enrolled: true,
                    newCount
                });
            },
            error: (err) => {
                console.error('Erro ao se inscrever:', err);
                this.enrollLoading = false;
                if (err.status === 409 || err.error?.message?.includes('já inscrito')) {
                    this.enrolledChange.emit({
                        eventId: this.event.id,
                        enrolled: true,
                        newCount: this.event.enrolledCount
                    });
                }
            }
        });
    }
}