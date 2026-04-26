import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Event } from '../models/event.model';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

export interface EventInput {
    title: string;
    description: string;
    addressId: string;
    category: string;
    startsAt: string;
    endsAt: string;
    capacity: number;
    image?: File | null;
}

@Injectable({ providedIn: 'root' })
export class EventsService {
    private apiUrl = environment.baseApiUrl;

    constructor(private http: HttpClient, private authService: AuthService) {}

    private normalizeEvent(rawEvent: any): Event {
        const ownerId = rawEvent?.ownerId ?? rawEvent?.owner?.id;
        const rawImage = rawEvent?.image;
        const imageUrl = rawEvent?.imageUrl ?? rawEvent?.imageURL ?? (typeof rawImage === 'string' && rawImage ? `data:image/*;base64,${rawImage}` : undefined);
        return {
            ...rawEvent,
            image: typeof rawImage === 'string' ? rawImage : undefined,
            imageUrl,
            ownerId: ownerId ? String(ownerId) : undefined
        } as Event;
    }

    private buildEventPayload(event: EventInput, id?: string) {
        const payload: Record<string, unknown> = {
            title: event.title,
            description: event.description,
            addressId: event.addressId,
            category: event.category,
            startsAt: event.startsAt,
            endsAt: event.endsAt,
            capacity: event.capacity
        };

        if (id) {
            payload['id'] = id;
        }

        return payload;
    }

    private buildEventFormData(event: EventInput, id?: string): FormData {
        const formData = new FormData();

        formData.append(
            'event',
            new Blob([JSON.stringify(this.buildEventPayload(event, id))], { type: 'application/json' })
        );

        if (event.image) {
            formData.append('image', event.image);
        }

        return formData;
    }

    private getAuthHeaders() {
        const token = this.authService.getToken();
        return {
            'Authorization': `Bearer ${token}`
        };
    }

    /**
     * Busca eventos públicos (sem autenticação)
     * GET /user/events
     * Resposta esperada: { events: Event[], total: number }
     */
    getPublicEvents(): Observable<Event[]> {
        return this.http.get<{ events: Event[], total: number }>(
            `${this.apiUrl}/user/events`
        ).pipe(
            map(response => (response.events || []).map(event => this.normalizeEvent(event)))
        );
    }

    /**
     * Cria um novo evento (requer autenticação)
     * POST /events
     */
    createEvent(event: EventInput): Observable<Event> {
        return this.http.post<Event>(
            `${this.apiUrl}/events`, 
            this.buildEventFormData(event),
            { headers: this.getAuthHeaders() }
        ).pipe(
            map(savedEvent => this.normalizeEvent(savedEvent))
        );
    }

        /**
         * Atualiza um evento existente (requer autenticação)
         * PATCH /events com id no body
         */
    updateEvent(id: string, event: EventInput): Observable<Event> {
        return this.http.patch<Event>(
            `${this.apiUrl}/events`,
            this.buildEventFormData(event, id),
            { headers: this.getAuthHeaders() }
        ).pipe(
            map(updatedEvent => this.normalizeEvent(updatedEvent))
        );
    }

    /**
     * Busca evento por ID (sem autenticação)
     * GET /user/events/:id
     */
    getPublicEventById(id: string): Observable<Event> {
        return this.http.get<Event>(`${this.apiUrl}/user/events/${id}`).pipe(
            map(event => this.normalizeEvent(event))
        );
    }

    getEventById(id: string): Observable<Event> {
        return this.getPublicEventById(id);
    }

    deleteEventImage(id: string): Observable<any> {
        return this.http.delete(`${this.apiUrl}/events/${id}/image`, {
            headers: this.getAuthHeaders()
        });
    }
}