import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { EventDetailComponent } from './event-detail.component';
import { EventsService } from '../../services/events.service';
import { AuthService } from '../../services/auth.service';
import { Event, EventCategory } from '../../models/event.model';
import { Address } from '../../models/address.model';

const mockAddress: Address = {
  id: 'addr1',
  country: 'Brasil',
  city: 'Curitiba',
  state: 'PR',
  street: 'Av. Batel',
  number: '42',
  neighborhood: 'Batel',
  postalCode: '80420-090'
};

const mockEvent: Event = {
  id: '123',
  ownerId: '42',
  title: 'Evento Exemplo',
  description: 'Descrição do evento',
  category: EventCategory.HEALTH,
  startsAt: '2025-07-01T09:00:00',
  endsAt: '2025-07-01T17:00:00',
  capacity: 50,
  enrolledCount: 10,
  address: mockAddress
};

describe('EventDetailComponent', () => {
  let component: EventDetailComponent;
  let fixture: ComponentFixture<EventDetailComponent>;
  let eventsServiceSpy: jasmine.SpyObj<EventsService>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;

  const setup = async (eventId: string | null = '123') => {
    eventsServiceSpy = jasmine.createSpyObj('EventsService', [
      'getPublicEventById', 'isUserEnrolled', 'enrollInEvent',
      'cancelEnrollment', 'getEnrolledParticipants', 'deleteEventImage'
    ]);
    authServiceSpy = jasmine.createSpyObj('AuthService', ['isLoggedIn', 'getUserId']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    eventsServiceSpy.getPublicEventById.and.returnValue(of(mockEvent));
    eventsServiceSpy.isUserEnrolled.and.returnValue(of(false));
    eventsServiceSpy.getEnrolledParticipants.and.returnValue(of([]));
    authServiceSpy.isLoggedIn.and.returnValue(false);
    authServiceSpy.getUserId.and.returnValue(null);

    await TestBed.configureTestingModule({
      imports: [EventDetailComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        { provide: EventsService, useValue: eventsServiceSpy },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: () => eventId } } }
        }
      ]
    }).overrideComponent(EventDetailComponent, {
      set: { imports: [CommonModule], schemas: [NO_ERRORS_SCHEMA] }
    }).compileComponents();

    fixture = TestBed.createComponent(EventDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  };

  afterEach(() => TestBed.resetTestingModule());

  it('should create', async () => {
    await setup();
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should set error when eventId is null', async () => {
      await setup(null);
      expect(component.error()).toBe('Evento não encontrado.');
      expect(component.isLoading()).toBeFalse();
      expect(eventsServiceSpy.getPublicEventById).not.toHaveBeenCalled();
    });

    it('should load event when id is provided', async () => {
      await setup('123');
      expect(eventsServiceSpy.getPublicEventById).toHaveBeenCalledWith('123');
      expect(component.event()).toEqual(mockEvent);
      expect(component.isLoading()).toBeFalse();
    });

    it('should set error when loadEvent fails', async () => {
      eventsServiceSpy = jasmine.createSpyObj('EventsService', [
        'getPublicEventById', 'isUserEnrolled', 'getEnrolledParticipants'
      ]);
      eventsServiceSpy.getPublicEventById.and.returnValue(throwError(() => new Error('not found')));

      await TestBed.configureTestingModule({
        imports: [EventDetailComponent],
        schemas: [NO_ERRORS_SCHEMA],
        providers: [
          { provide: EventsService, useValue: eventsServiceSpy },
          { provide: AuthService, useValue: jasmine.createSpyObj('AuthService', ['isLoggedIn', 'getUserId']) },
          { provide: Router, useValue: jasmine.createSpyObj('Router', ['navigate']) },
          { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => '999' } } } }
        ]
      }).overrideComponent(EventDetailComponent, {
        set: { imports: [CommonModule], schemas: [NO_ERRORS_SCHEMA] }
      }).compileComponents();

      fixture = TestBed.createComponent(EventDetailComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();

      expect(component.error()).toBe('Falha ao carregar o evento.');
      expect(component.isLoading()).toBeFalse();
    });
  });

  describe('getImageSrc', () => {
    beforeEach(async () => setup());

    it('should return no_image for null event', () => {
      expect(component.getImageSrc(null)).toBe('/assets/no_image.png');
    });

    it('should return no_image when event has no image', () => {
      const event = { ...mockEvent, image: undefined, imageUrl: undefined };
      expect(component.getImageSrc(event)).toBe('/assets/no_image.png');
    });

    it('should return data URL as is', () => {
      const event = { ...mockEvent, imageUrl: 'data:image/png;base64,abc' };
      expect(component.getImageSrc(event)).toBe('data:image/png;base64,abc');
    });

    it('should return http URL as is', () => {
      const event = { ...mockEvent, imageUrl: 'https://example.com/img.png' };
      expect(component.getImageSrc(event)).toBe('https://example.com/img.png');
    });

    it('should wrap base64 string in data URL', () => {
      const event = { ...mockEvent, image: 'base64content', imageUrl: undefined };
      expect(component.getImageSrc(event)).toBe('data:image/*;base64,base64content');
    });
  });

  describe('categoryLabel', () => {
    beforeEach(async () => setup());

    it('should return category label from event', () => {
      component.event.set({ ...mockEvent, category: EventCategory.HEALTH });
      expect(component.categoryLabel).toBe('Saúde');
    });

    it('should return empty string when no event', () => {
      component.event.set(null);
      expect(component.categoryLabel).toBe('');
    });
  });

  describe('canManageEvent', () => {
    beforeEach(async () => setup());

    it('should return false when not logged in', () => {
      authServiceSpy.isLoggedIn.and.returnValue(false);
      component.event.set(mockEvent);
      expect(component.canManageEvent()).toBeFalse();
    });

    it('should return false when event is null', () => {
      authServiceSpy.isLoggedIn.and.returnValue(true);
      component.event.set(null);
      expect(component.canManageEvent()).toBeFalse();
    });

    it('should return false when userId does not match ownerId', () => {
      authServiceSpy.isLoggedIn.and.returnValue(true);
      authServiceSpy.getUserId.and.returnValue('99');
      component.event.set({ ...mockEvent, ownerId: '42' });
      expect(component.canManageEvent()).toBeFalse();
    });

    it('should return true when userId matches ownerId', () => {
      authServiceSpy.isLoggedIn.and.returnValue(true);
      authServiceSpy.getUserId.and.returnValue('42');
      component.event.set({ ...mockEvent, ownerId: '42' });
      expect(component.canManageEvent()).toBeTrue();
    });
  });

  describe('onParticipateClick', () => {
    beforeEach(async () => setup());

    it('should open login modal when not logged in', () => {
      authServiceSpy.isLoggedIn.and.returnValue(false);
      component.event.set(mockEvent);
      component.onParticipateClick();
      expect(component.showLoginModal()).toBeTrue();
    });

    it('should call enrollInEvent when not enrolled and logged in', () => {
      authServiceSpy.isLoggedIn.and.returnValue(true);
      authServiceSpy.getUserId.and.returnValue('99');
      eventsServiceSpy.enrollInEvent = jasmine.createSpy().and.returnValue(of({}));
      component.event.set({ ...mockEvent, ownerId: '42' });
      component.isEnrolled.set(false);
      component.onParticipateClick();
      expect(eventsServiceSpy.enrollInEvent).toHaveBeenCalledWith('123');
    });

    it('should call cancelEnrollment when already enrolled', () => {
      authServiceSpy.isLoggedIn.and.returnValue(true);
      authServiceSpy.getUserId.and.returnValue('99');
      eventsServiceSpy.cancelEnrollment = jasmine.createSpy().and.returnValue(of(undefined));
      component.event.set({ ...mockEvent, ownerId: '42' });
      component.isEnrolled.set(true);
      component.onParticipateClick();
      expect(eventsServiceSpy.cancelEnrollment).toHaveBeenCalledWith('123');
    });

    it('should not act when already processing enrollment', () => {
      authServiceSpy.isLoggedIn.and.returnValue(true);
      eventsServiceSpy.enrollInEvent = jasmine.createSpy();
      component.isProcessingEnrollment.set(true);
      component.onParticipateClick();
      expect(eventsServiceSpy.enrollInEvent).not.toHaveBeenCalled();
    });
  });

  describe('closeLoginModal', () => {
    beforeEach(async () => setup());

    it('should close the login modal', () => {
      component.showLoginModal.set(true);
      component.closeLoginModal();
      expect(component.showLoginModal()).toBeFalse();
    });
  });

  describe('formatDateTime', () => {
    beforeEach(async () => setup());

    it('should format a valid date string', () => {
      const result = component.formatDateTime('2025-07-01T09:00:00');
      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
    });

    it('should return original string for invalid date', () => {
      const result = component.formatDateTime('not-a-date');
      expect(result).toBeTruthy();
    });
  });

  describe('formatDate', () => {
    beforeEach(async () => setup());

    it('should format date in pt-BR locale', () => {
      const result = component.formatDate('2025-07-01');
      expect(result).toMatch(/\d{2}\/\d{2}\/\d{4}/);
    });
  });

  describe('genderLabel', () => {
    beforeEach(async () => setup());

    it('should return Masculino for MALE', () => {
      expect(component.genderLabel('MALE')).toBe('Masculino');
    });

    it('should return Feminino for FEMALE', () => {
      expect(component.genderLabel('FEMALE')).toBe('Feminino');
    });

    it('should return Outro for OTHER', () => {
      expect(component.genderLabel('OTHER')).toBe('Outro');
    });

    it('should return the original string for unknown gender', () => {
      expect(component.genderLabel('UNKNOWN')).toBe('UNKNOWN');
    });
  });

  describe('deleteImage / cancelDeleteImage / confirmDeleteImage', () => {
    beforeEach(async () => setup());

    it('deleteImage should show confirmation dialog', () => {
      component.event.set(mockEvent);
      component.deleteImage();
      expect(component.showDeleteImageConfirm()).toBeTrue();
    });

    it('deleteImage should do nothing if event is null', () => {
      component.event.set(null);
      component.deleteImage();
      expect(component.showDeleteImageConfirm()).toBeFalse();
    });

    it('cancelDeleteImage should hide confirmation dialog', () => {
      component.showDeleteImageConfirm.set(true);
      component.cancelDeleteImage();
      expect(component.showDeleteImageConfirm()).toBeFalse();
    });

    it('confirmDeleteImage should call deleteEventImage', () => {
      eventsServiceSpy.deleteEventImage.and.returnValue(of({ id: '123', image: null, imageUrl: null }));
      component.event.set(mockEvent);
      component.confirmDeleteImage();
      expect(eventsServiceSpy.deleteEventImage).toHaveBeenCalledWith('123');
    });
  });

  describe('goBack', () => {
    beforeEach(async () => setup());

    it('should navigate to /eventos', () => {
      component.goBack();
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/eventos']);
    });
  });
});
