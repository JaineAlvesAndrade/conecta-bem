import { Injectable } from '@angular/core';
import { Event } from '../models/event.model';

//mockado para teste até impl. do ralf ir pra prod
@Injectable({ providedIn: 'root' })
export class EventsService {
    private events: Event[] = [
        {
            id: 1,
            title: 'Educação para Todos',
            description: 'Ajude crianças em situação de vulnerabilidade social com reforço escolar e atividades educativas.',
            organization: 'Instituto Educação Transformadora',
            location: 'São Paulo, SP',
            date: '14 de set. de 2025',
            hoursPerWeek: '4 horas/semana',
            enrolledCount: 13,
            maxEnrolled: 20,
            tags: ['Educação', 'Criança'],
            imageUrl: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=400&h=250&fit=crop',
            points: 50,
            category: 'educacao'
        },
        {
            id: 2,
            title: 'Cuidado com Idosos',
            description: 'Proporcione companhia e atividades para idosos em lares e centros de convivência.',
            organization: 'Casa de Repouso Vida Plena',
            location: 'Rio de Janeiro, RJ',
            date: '09 de set. de 2025',
            hoursPerWeek: '3 horas/semana',
            enrolledCount: 8,
            maxEnrolled: 12,
            tags: ['Terceira Idade', 'Saúde'],
            imageUrl: 'https://images.unsplash.com/photo-1509099836639-18ba1795216d?w=400&h=250&fit=crop',
            points: 40,
            urgent: true,
            category: 'saude'
        },
        {
            id: 3,
            title: 'Proteção Ambiental',
            description: 'Participe de mutirões de limpeza e plantio de árvores para preservar o meio ambiente.',
            organization: 'EcoVoluntários BH',
            location: 'Belo Horizonte, MG',
            date: '21 de set. de 2025',
            hoursPerWeek: '2 horas/semana',
            enrolledCount: 5,
            maxEnrolled: 30,
            tags: ['Meio Ambiente', 'Sustentabilidade'],
            imageUrl: 'https://images.unsplash.com/photo-1542601906897-3e574aed8a6a?w=400&h=250&fit=crop',
            points: 35,
            category: 'ambiente'
        }
    ];

    getAll(): Event[] {
        return this.events;
    }

    getById(id: number): Event | undefined {
        return this.events.find(e => e.id === id);
    }
}