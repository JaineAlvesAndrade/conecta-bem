import { Component, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { EventsService } from '../../services/events.service';
import { EventCardComponent } from '../../components/event-card/event-card.component';
import { Event } from '../../models/event.model';

@Component({
  selector: 'app-events',
  standalone: true,
  imports: [EventCardComponent, FormsModule],
  templateUrl: './events.component.html',
  styleUrls: ['./events.component.scss']
})
export class EventsComponent {
  private allEvents: Event[];

  searchQuery = signal('');
  selectedCategory = signal('todos');

  categories = [
    { value: 'todos', label: 'Todos' },
    { value: 'educacao', label: 'Educação' },
    { value: 'saude', label: 'Saúde' },
    { value: 'ambiente', label: 'Meio Ambiente' },
  ];

  filteredEvents = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const cat   = this.selectedCategory();

    return this.allEvents.filter(e => {
      const matchCat    = cat === 'todos' || e.category === cat;
      const matchSearch = !query ||
        e.title.toLowerCase().includes(query) ||
        e.description.toLowerCase().includes(query) ||
        e.location.toLowerCase().includes(query);
      return matchCat && matchSearch;
    });
  });

  constructor(private eventsService: EventsService) {
    this.allEvents = this.eventsService.getAll();
  }

  setCategory(cat: string) {
    this.selectedCategory.set(cat);
  }
}