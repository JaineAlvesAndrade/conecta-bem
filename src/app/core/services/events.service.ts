import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Event } from '../models/event.model';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';
import { EnrolledParticipant } from '../pages/event-detail/event-detail.component';

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

    constructor(private http: HttpClient, private authService: AuthService) { }

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

        const eventBlob = new Blob(
            [JSON.stringify(this.buildEventPayload(event, id))],
            { type: 'application/json' }
        );

        formData.append('event', eventBlob, 'event.json');

        if (event.image) {
            formData.append('image', event.image, event.image.name);
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

    // ── Novos métodos ────────────────────────────────────────────────────────

    /**
     * Verifica se o usuário logado está inscrito em um evento.
     * GET /events/:id/enrollment/status
     * Resposta esperada: { enrolled: boolean }
     */
    isUserEnrolled(eventId: string): Observable<boolean> {
        return this.http.get<{ enrolled: boolean }>(
            `${this.apiUrl}/events/${eventId}/enrollment/status`,
            { headers: this.getAuthHeaders() }
        ).pipe(
            map(response => response.enrolled)
        );
    }

    /**
     * Inscreve o usuário logado em um evento.
     * POST /events/:id/enroll
     */
    enrollInEvent(eventId: string): Observable<any> {
        return this.http.post(
            `${this.apiUrl}/events/${eventId}/enroll`,
            {},
            { headers: this.getAuthHeaders() }
        );
    }

    /**
     * Retorna a lista de participantes inscritos (acesso restrito ao dono do evento).
     * GET /events/:id/enrollments
     * Resposta esperada: EnrolledParticipant[]
     */
    getEnrolledParticipants(eventId: string): Observable<EnrolledParticipant[]> {
        return this.http.get<EnrolledParticipant[]>(
            `${this.apiUrl}/events/${eventId}/enrollments`,
            { headers: this.getAuthHeaders() }
        );
    }

    /**
     * Retorna os eventos em que o usuário logado está inscrito.
     * GET /user/events/enrolled
     * Resposta esperada: { events: Event[], total: number }
     */
    getMyEnrolledEvents(): Observable<Event[]> {
        return this.http.get<{ events: Event[], total: number }>(
            `${this.apiUrl}/user/events/enrolled`,
            { headers: this.getAuthHeaders() }
        ).pipe(
            map(response => (response.events || []).map(event => this.normalizeEvent(event)))
        );
    }
}