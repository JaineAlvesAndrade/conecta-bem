import { Component, Input } from '@angular/core';
import { BadgeComponent } from '../badge/badge.component';
import { Event } from '../../models/event.model';

@Component({
    selector: 'app-event-card',
    standalone: true,
    imports: [BadgeComponent],
    templateUrl: './event-card.component.html',
    styleUrls: ['./event-card.component.scss']
})
export class EventCardComponent {
    @Input() event!: Event;
}