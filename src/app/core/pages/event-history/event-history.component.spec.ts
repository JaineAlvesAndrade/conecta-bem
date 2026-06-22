import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { EventHistoryComponent } from './event-history.component';
import { EventsService } from '../../services/events.service';
import { AuthService } from '../../services/auth.service';
import { Event, EventCategory } from '../../models/event.model';
import { Address } from '../../models/address.model';

const mockAddress: Address = {
  id: 'a1',
  country: 'Brasil',
  city: 'Porto Alegre',
  state: 'RS',
  street: 'Rua XV',
  number: '1',
  neighborhood: 'Centro',
  postalCode: '90000-000'
};

const makeEvent = (id: string, endsAt: string, overrides: Partial<Event> = {}): Event => ({
  id,
  title: `Evento ${id}`,
  description: 'Descrição',
  category: EventCategory.SOCIAL,
  startsAt: '2025-01-01T10:00:00',
  endsAt,
  capacity: 30,
  address: mockAddress,
  ...overrides
});

describe('EventHistoryComponent', () => {
  let component: EventHistoryComponent;
  let fixture: ComponentFixture<EventHistoryComponent>;
  let eventsServiceSpy: jasmine.SpyObj<EventsService>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;

  const setup = async (loggedIn = true, events: Event[] = []) => {
    eventsServiceSpy = jasmine.createSpyObj('EventsService', ['getMyEnrolledEvents']);
    authServiceSpy = jasmine.createSpyObj('AuthService', ['isLoggedIn']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    authServiceSpy.isLoggedIn.and.returnValue(loggedIn);
    eventsServiceSpy.getMyEnrolledEvents.and.returnValue(of(events));

    await TestBed.configureTestingModule({
      imports: [EventHistoryComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        { provide: EventsService, useValue: eventsServiceSpy },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    }).overrideComponent(EventHistoryComponent, {
      set: { imports: [CommonModule], schemas: [NO_ERRORS_SCHEMA] }
    }).compileComponents();

    fixture = TestBed.createComponent(EventHistoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  };

  afterEach(() => TestBed.resetTestingModule());

  it('should create', async () => {
    await setup();
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should redirect to /auth when not logged in', async () => {
      await setup(false);
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/auth']);
      expect(eventsServiceSpy.getMyEnrolledEvents).not.toHaveBeenCalled();
    });

    it('should load enrolled events when logged in', async () => {
      const events = [makeEvent('1', '2025-12-31T23:59:00')];
      await setup(true, events);
      expect(eventsServiceSpy.getMyEnrolledEvents).toHaveBeenCalledTimes(1);
      expect(component.enrolledEvents()).toEqual(events);
      expect(component.isLoading()).toBeFalse();
    });

    it('should set error when loadHistory fails', async () => {
      eventsServiceSpy = jasmine.createSpyObj('EventsService', ['getMyEnrolledEvents']);
      authServiceSpy = jasmine.createSpyObj('AuthService', ['isLoggedIn']);
      routerSpy = jasmine.createSpyObj('Router', ['navigate']);
      authServiceSpy.isLoggedIn.and.returnValue(true);
      eventsServiceSpy.getMyEnrolledEvents.and.returnValue(throwError(() => new Error('error')));

      await TestBed.configureTestingModule({
        imports: [EventHistoryComponent],
        schemas: [NO_ERRORS_SCHEMA],
        providers: [
          { provide: EventsService, useValue: eventsServiceSpy },
          { provide: AuthService, useValue: authServiceSpy },
          { provide: Router, useValue: routerSpy }
        ]
      }).overrideComponent(EventHistoryComponent, {
        set: { imports: [CommonModule], schemas: [NO_ERRORS_SCHEMA] }
      }).compileComponents();

      fixture = TestBed.createComponent(EventHistoryComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();

      expect(component.error()).toBe('Falha ao carregar seu histórico de eventos.');
      expect(component.isLoading()).toBeFalse();
    });
  });

  describe('upcomingEvents / pastEvents', () => {
    beforeEach(async () => {
      const farFuture = new Date();
      farFuture.setFullYear(farFuture.getFullYear() + 1);
      const pastDate = new Date('2020-01-01T10:00:00').toISOString();
      const futureDate = farFuture.toISOString();

      const events = [
        makeEvent('future', futureDate),
        makeEvent('past', pastDate)
      ];
      await setup(true, events);
    });

    it('upcomingEvents should include future events', () => {
      const upcoming = component.upcomingEvents();
      expect(upcoming.some(e => e.id === 'future')).toBeTrue();
    });

    it('pastEvents should include past events', () => {
      const past = component.pastEvents();
      expect(past.some(e => e.id === 'past')).toBeTrue();
    });

    it('should not mix upcoming and past events', () => {
      const upcomingIds = component.upcomingEvents().map(e => e.id);
      const pastIds = component.pastEvents().map(e => e.id);
      const intersection = upcomingIds.filter(id => pastIds.includes(id));
      expect(intersection.length).toBe(0);
    });
  });

  describe('goToEvent', () => {
    beforeEach(async () => setup());

    it('should navigate to event detail', () => {
      const event = makeEvent('42', '2025-12-31T00:00:00');
      component.goToEvent(event);
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/eventos', '42']);
    });
  });

  describe('categoryLabel', () => {
    beforeEach(async () => setup());

    it('should return the label for known category', () => {
      const event = makeEvent('1', '2025-01-01T00:00:00', { category: EventCategory.HEALTH });
      expect(component.categoryLabel(event)).toBe('Saúde');
    });

    it('should return the category itself for unknown categories', () => {
      const event = makeEvent('1', '2025-01-01T00:00:00', { category: 'UNKNOWN' as EventCategory });
      expect(component.categoryLabel(event)).toBe('UNKNOWN');
    });
  });

  describe('formatDate', () => {
    beforeEach(async () => setup());

    it('should format date string in pt-BR locale', () => {
      const result = component.formatDate('2025-07-01T10:00:00');
      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
    });

    it('should return original string for invalid date', () => {
      const result = component.formatDate('not-a-date');
      expect(result).toBeTruthy();
    });
  });

  describe('getImageSrc', () => {
    beforeEach(async () => setup());

    it('should return no_image placeholder when no image', () => {
      const event = makeEvent('1', '2025-01-01T00:00:00', { image: undefined, imageUrl: undefined });
      expect(component.getImageSrc(event)).toBe('/assets/no_image.png');
    });

    it('should return http URL as is', () => {
      const event = makeEvent('1', '2025-01-01T00:00:00', { imageUrl: 'https://cdn.example.com/img.jpg' });
      expect(component.getImageSrc(event)).toBe('https://cdn.example.com/img.jpg');
    });

    it('should return data URL as is', () => {
      const event = makeEvent('1', '2025-01-01T00:00:00', { imageUrl: 'data:image/png;base64,abc' });
      expect(component.getImageSrc(event)).toBe('data:image/png;base64,abc');
    });

    it('should wrap base64 string in data URL format', () => {
      const event = makeEvent('1', '2025-01-01T00:00:00', { image: 'base64string', imageUrl: undefined });
      expect(component.getImageSrc(event)).toBe('data:image/*;base64,base64string');
    });
  });

  describe('retry', () => {
    beforeEach(async () => setup());

    it('should reload enrolled events', () => {
      const callsBefore = eventsServiceSpy.getMyEnrolledEvents.calls.count();
      component.retry();
      expect(eventsServiceSpy.getMyEnrolledEvents.calls.count()).toBeGreaterThan(callsBefore);
    });
  });

  describe('goToEvents', () => {
    beforeEach(async () => setup());

    it('should navigate to /eventos', () => {
      component.goToEvents();
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/eventos']);
    });
  });
});
