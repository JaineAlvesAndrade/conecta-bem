import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { Event, EventCategory, EventCategoryLabels } from '../../models/event.model';

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
    @Output() edit = new EventEmitter<void>();

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
        
        // Evento é considerado urgente se faltar menos de 7 dias
        return daysUntilEvent >= 0 && daysUntilEvent <= 7;
    }

    onEditClick() {
        this.edit.emit();
    }
}