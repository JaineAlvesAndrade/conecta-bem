import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { EventsComponent } from './events.component';
import { EventsService } from '../../services/events.service';
import { AuthService } from '../../services/auth.service';
import { Event, EventCategory } from '../../models/event.model';
import { Address } from '../../models/address.model';

const mockAddress: Address = {
  id: 'addr1',
  country: 'Brasil',
  city: 'São Paulo',
  state: 'SP',
  street: 'Rua Teste',
  number: '10',
  neighborhood: 'Centro',
  postalCode: '01001-000'
};

const makeEvent = (overrides: Partial<Event> = {}): Event => ({
  id: '1',
  title: 'Evento Teste',
  description: 'Descrição do evento',
  category: EventCategory.EDUCATION,
  startsAt: '2025-06-01T10:00:00',
  endsAt: '2025-06-01T12:00:00',
  capacity: 100,
  address: mockAddress,
  ...overrides
});

describe('EventsComponent', () => {
  let component: EventsComponent;
  let fixture: ComponentFixture<EventsComponent>;
  let eventsServiceSpy: jasmine.SpyObj<EventsService>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    eventsServiceSpy = jasmine.createSpyObj('EventsService', ['getPublicEvents']);
    authServiceSpy = jasmine.createSpyObj('AuthService', ['isLoggedIn', 'getUserId']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    eventsServiceSpy.getPublicEvents.and.returnValue(of([]));
    authServiceSpy.isLoggedIn.and.returnValue(false);

    await TestBed.configureTestingModule({
      imports: [EventsComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        { provide: EventsService, useValue: eventsServiceSpy },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    }).overrideComponent(EventsComponent, {
      set: { imports: [FormsModule, CommonModule], schemas: [NO_ERRORS_SCHEMA] }
    }).compileComponents();

    fixture = TestBed.createComponent(EventsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load public events on init', () => {
    expect(eventsServiceSpy.getPublicEvents).toHaveBeenCalledTimes(1);
  });

  it('should set isLoading to false after loading', () => {
    expect(component.isLoading()).toBeFalse();
  });

  it('should set error when loadPublicEvents fails', async () => {
    eventsServiceSpy.getPublicEvents.and.returnValue(throwError(() => new Error('network error')));
    TestBed.resetTestingModule();

    await TestBed.configureTestingModule({
      imports: [EventsComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        { provide: EventsService, useValue: eventsServiceSpy },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    }).overrideComponent(EventsComponent, {
      set: { imports: [FormsModule, CommonModule], schemas: [NO_ERRORS_SCHEMA] }
    }).compileComponents();

    fixture = TestBed.createComponent(EventsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.error()).toBe('Falha ao carregar eventos');
    expect(component.isLoading()).toBeFalse();
  });

  it('should have 4 categories', () => {
    expect(component.categories.length).toBe(4);
  });

  it('should have todos as default selected category', () => {
    expect(component.selectedCategory()).toBe('todos');
  });

  describe('setCategory', () => {
    it('should update selectedCategory', () => {
      component.setCategory('educacao');
      expect(component.selectedCategory()).toBe('educacao');
    });

    it('should reset to todos', () => {
      component.setCategory('saude');
      component.setCategory('todos');
      expect(component.selectedCategory()).toBe('todos');
    });
  });

  describe('filteredEvents', () => {
    beforeEach(() => {
      const events = [
        makeEvent({ id: '1', title: 'Aula de Matemática', category: EventCategory.EDUCATION }),
        makeEvent({ id: '2', title: 'Campanha de Saúde', category: EventCategory.HEALTH }),
        makeEvent({ id: '3', title: 'Plantio de Árvores', category: EventCategory.ENVIRONMENT })
      ];
      (component as any).allEvents.set(events);
    });

    it('should return all events when category is todos', () => {
      component.setCategory('todos');
      expect(component.filteredEvents().length).toBe(3);
    });

    it('should filter by education category', () => {
      component.setCategory('educacao');
      const filtered = component.filteredEvents();
      expect(filtered.length).toBe(1);
      expect(filtered[0].category).toBe(EventCategory.EDUCATION);
    });

    it('should filter by health category', () => {
      component.setCategory('saude');
      const filtered = component.filteredEvents();
      expect(filtered.length).toBe(1);
      expect(filtered[0].category).toBe(EventCategory.HEALTH);
    });

    it('should filter by search query on title', () => {
      component.searchQuery.set('campanha');
      const filtered = component.filteredEvents();
      expect(filtered.length).toBe(1);
      expect(filtered[0].id).toBe('2');
    });

    it('should filter by search query case insensitively', () => {
      component.searchQuery.set('MATEMÁTICA');
      const filtered = component.filteredEvents();
      expect(filtered.length).toBe(1);
      expect(filtered[0].id).toBe('1');
    });

    it('should return empty when no event matches query', () => {
      component.searchQuery.set('xyz não existe');
      expect(component.filteredEvents().length).toBe(0);
    });

    it('should combine category and search filters', () => {
      component.setCategory('educacao');
      component.searchQuery.set('matemática');
      expect(component.filteredEvents().length).toBe(1);
    });
  });

  describe('openCreateEventModal', () => {
    it('should navigate to /auth when user is not logged in', () => {
      authServiceSpy.isLoggedIn.and.returnValue(false);
      component.openCreateEventModal();
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/auth']);
      expect(component.showCreateModal()).toBeFalse();
    });

    it('should open modal when user is logged in', () => {
      authServiceSpy.isLoggedIn.and.returnValue(true);
      component.openCreateEventModal();
      expect(component.showCreateModal()).toBeTrue();
    });
  });

  describe('onModalClose', () => {
    it('should close modal and clear selectedEventToEdit', () => {
      component.showCreateModal.set(true);
      component.selectedEventToEdit.set(makeEvent());
      component.onModalClose();
      expect(component.showCreateModal()).toBeFalse();
      expect(component.selectedEventToEdit()).toBeNull();
    });
  });

  describe('onEventCreated', () => {
    it('should prepend new event to list and close modal', () => {
      const existing = makeEvent({ id: 'old' });
      (component as any).allEvents.set([existing]);
      component.showCreateModal.set(true);

      const newEvent = makeEvent({ id: 'new' });
      component.onEventCreated(newEvent);

      const events = (component as any).allEvents();
      expect(events[0].id).toBe('new');
      expect(events.length).toBe(2);
      expect(component.showCreateModal()).toBeFalse();
    });
  });

  describe('onEventUpdated', () => {
    it('should replace the updated event in list', () => {
      const original = makeEvent({ id: '1', title: 'Original' });
      (component as any).allEvents.set([original]);

      const updated = makeEvent({ id: '1', title: 'Atualizado' });
      component.onEventUpdated(updated);

      const events = (component as any).allEvents();
      expect(events[0].title).toBe('Atualizado');
      expect(component.showCreateModal()).toBeFalse();
    });
  });

  describe('openEditEventModal', () => {
    it('should open edit modal when user can edit the event', () => {
      authServiceSpy.isLoggedIn.and.returnValue(true);
      authServiceSpy.getUserId.and.returnValue('42');
      const event = makeEvent({ ownerId: '42' });
      component.openEditEventModal(event);
      expect(component.selectedEventToEdit()).toEqual(event);
      expect(component.showCreateModal()).toBeTrue();
    });

    it('should not open modal when user cannot edit the event', () => {
      authServiceSpy.isLoggedIn.and.returnValue(true);
      authServiceSpy.getUserId.and.returnValue('99');
      const event = makeEvent({ ownerId: '42' });
      component.openEditEventModal(event);
      expect(component.showCreateModal()).toBeFalse();
    });
  });

  describe('canEditEvent', () => {
    it('should return false when not logged in', () => {
      authServiceSpy.isLoggedIn.and.returnValue(false);
      expect(component.canEditEvent(makeEvent({ ownerId: '1' }))).toBeFalse();
    });

    it('should return false when userId is null', () => {
      authServiceSpy.isLoggedIn.and.returnValue(true);
      authServiceSpy.getUserId.and.returnValue(null);
      expect(component.canEditEvent(makeEvent({ ownerId: '1' }))).toBeFalse();
    });

    it('should return false when ownerId is undefined', () => {
      authServiceSpy.isLoggedIn.and.returnValue(true);
      authServiceSpy.getUserId.and.returnValue('1');
      expect(component.canEditEvent(makeEvent({ ownerId: undefined }))).toBeFalse();
    });

    it('should return true when userId matches ownerId', () => {
      authServiceSpy.isLoggedIn.and.returnValue(true);
      authServiceSpy.getUserId.and.returnValue('42');
      expect(component.canEditEvent(makeEvent({ ownerId: '42' }))).toBeTrue();
    });

    it('should compare ownerId as string', () => {
      authServiceSpy.isLoggedIn.and.returnValue(true);
      authServiceSpy.getUserId.and.returnValue('42');
      expect(component.canEditEvent(makeEvent({ ownerId: '42' }))).toBeTrue();
    });
  });
});
