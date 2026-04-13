import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Event, EventCategory } from '../models/event.model';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class EventsService {
    private apiUrl = environment.baseApiUrl;

    constructor(private http: HttpClient, private authService: AuthService) {}

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
            map(response => response.events || [])
        );
    }

    /**
     * Cria um novo evento (requer autenticação)
     * POST /events
     */
    createEvent(event: {
      title: string;
      description: string;
      addressId: string;
      category: string;
      startsAt: string;
      endsAt: string;
      capacity: number;
    }): Observable<Event> {
        return this.http.post<Event>(
            `${this.apiUrl}/events`, 
            event,
            { headers: this.getAuthHeaders() }
        );
    }

    /**
     * Busca evento por ID (sem autenticação)
     * GET /user/events/:id
     */
    getPublicEventById(id: string): Observable<Event> {
        return this.http.get<Event>(`${this.apiUrl}/user/events/${id}`);
    }
}