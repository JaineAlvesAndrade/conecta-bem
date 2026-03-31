import { Component, signal, computed, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { EventsService } from '../../services/events.service';
import { AuthService } from '../../services/auth.service';
import { EventCardComponent } from '../../components/event-card/event-card.component';
import { CreateEventModalComponent } from '../../components/create-event-modal/create-event-modal.component';
import { Event, EventCategory } from '../../models/event.model';

@Component({
  selector: 'app-events',
  standalone: true,
  imports: [EventCardComponent, CreateEventModalComponent, FormsModule, CommonModule],
  templateUrl: './events.component.html',
  styleUrls: ['./events.component.scss']
})
export class EventsComponent implements OnInit {
  private allEvents = signal<Event[]>([]);

  searchQuery = signal('');
  selectedCategory = signal('todos');
  isLoading = signal(true);
  error = signal<string | null>(null);
  showCreateModal = signal(false);

  // Mapeamento entre valores UI e EventCategory
  private categoryMap: Record<string, EventCategory | 'todos'> = {
    'todos': 'todos',
    'educacao': EventCategory.EDUCATION,
    'saude': EventCategory.HEALTH,
    'ambiente': EventCategory.ENVIRONMENT,
  };

  categories = [
    { value: 'todos',    label: 'Todos' },
    { value: 'educacao', label: 'Educação' },
    { value: 'saude',    label: 'Saúde' },
    { value: 'ambiente', label: 'Meio Ambiente' },
  ];

  filteredEvents = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const selectedCat   = this.selectedCategory();
    const mappedCat = this.categoryMap[selectedCat] as EventCategory | 'todos';

    return this.allEvents().filter(e => {
      const matchCat    = mappedCat === 'todos' || e.category === mappedCat;
      const matchSearch = !query ||
        e.title.toLowerCase().includes(query) ||
        e.description.toLowerCase().includes(query) ||
        (e.location?.toLowerCase().includes(query) ?? false);
      return matchCat && matchSearch;
    });
  });

  constructor(
    private eventsService: EventsService,
    public authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadPublicEvents();
  }

  openCreateEventModal() {
    // Verifica se usuário está logado
    if (!this.authService.isLoggedIn()) {
      // Se não estiver logado, redireciona para login
      this.router.navigate(['/auth']);
      return;
    }

    // Abre o modal
    this.showCreateModal.set(true);
  }

  onModalClose() {
    this.showCreateModal.set(false);
  }

  onEventCreated(newEvent: Event) {
    // Adiciona o novo evento à lista e fecha o modal
    this.allEvents.update(events => [newEvent, ...events]);
    this.showCreateModal.set(false);
  }

  private loadPublicEvents() {
    this.isLoading.set(true);
    this.error.set(null);
    
    this.eventsService.getPublicEvents().subscribe({
      next: (events) => {
        this.allEvents.set(events);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Erro ao carregar eventos:', err);
        this.error.set('Falha ao carregar eventos');
        this.isLoading.set(false);
        // Fallback para dados mockados
        this.allEvents.set(this.eventsService.getAll());
      }
    });
  }

  setCategory(cat: string) {
    this.selectedCategory.set(cat);
  }
}