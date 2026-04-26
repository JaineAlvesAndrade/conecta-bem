import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Event } from '../../models/event.model';

@Component({
    selector: 'app-event-card',
    standalone: true,
    imports: [CommonModule, RouterLink],
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
                month: '2-digit',
                year: 'numeric'
            });
        } catch {
            return dateString;
        }
    }

        onEditClick() {
            this.edit.emit();
        }
}