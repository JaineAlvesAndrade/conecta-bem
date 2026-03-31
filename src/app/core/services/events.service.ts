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
    
    // Dados mockados como fallback (compatível com novo modelo)
    private events: Event[] = [
        {
            id: '1',
            title: 'Educação para Todos',
            description: 'Ajude crianças em situação de vulnerabilidade social com reforço escolar e atividades educativas.',
            addressId: 'addr-1',
            category: EventCategory.EDUCATION,
            startsAt: '2025-09-14T08:00:00Z',
            endsAt: '2025-09-14T12:00:00Z',
            capacity: 20,
            enrolledCount: 13,
            organization: 'Instituto Educação Transformadora',
            location: 'São Paulo, SP',
            imageUrl: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=400&h=250&fit=crop',
            points: 50
        },
        {
            id: '2',
            title: 'Cuidado com Idosos',
            description: 'Proporcione companhia e atividades para idosos em lares e centros de convivência.',
            addressId: 'addr-2',
            category: EventCategory.HEALTH,
            startsAt: '2025-09-09T14:00:00Z',
            endsAt: '2025-09-09T17:00:00Z',
            capacity: 12,
            enrolledCount: 8,
            organization: 'Casa de Repouso Vida Plena',
            location: 'Rio de Janeiro, RJ',
            imageUrl: 'https://images.unsplash.com/photo-1509099836639-18ba1795216d?w=400&h=250&fit=crop',
            points: 40,
            urgent: true
        },
        {
            id: '3',
            title: 'Proteção Ambiental',
            description: 'Participe de mutirões de limpeza e plantio de árvores para preservar o meio ambiente.',
            addressId: 'addr-3',
            category: EventCategory.ENVIRONMENT,
            startsAt: '2025-09-21T09:00:00Z',
            endsAt: '2025-09-21T11:00:00Z',
            capacity: 30,
            enrolledCount: 5,
            organization: 'EcoVoluntários BH',
            location: 'Belo Horizonte, MG',
            imageUrl: 'https://images.unsplash.com/photo-1542601906897-3e574aed8a6a?w=400&h=250&fit=crop',
            points: 35
        }
    ];

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

    // ========== MÉTODOS COM DADOS MOCKADOS (FALLBACK) ==========
    
    getAll(): Event[] {
        return this.events;
    }

    getById(id: string): Event | undefined {
        return this.events.find(e => e.id === id);
    }
}