import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
import { EventRegistrationResponse } from '../models/event-registration.model';

@Injectable({ providedIn: 'root' })
export class EventRegistrationService {
  private apiUrl = environment.baseApiUrl;

  constructor(private http: HttpClient, private authService: AuthService) {}

  private getAuthHeaders() {
    const token = this.authService.getToken();
    return { 'Authorization': `Bearer ${token}` };
  }

  getRegistrationsByEvent(eventId: string): Observable<EventRegistrationResponse[]> {
    return this.http.get<EventRegistrationResponse[]>(
      `${this.apiUrl}/event-registrations/events/${eventId}`,
      { headers: this.getAuthHeaders() }
    );
  }

  confirmRegistration(registrationId: string): Observable<EventRegistrationResponse> {
    return this.http.patch<EventRegistrationResponse>(
      `${this.apiUrl}/event-registrations/${registrationId}/confirm`,
      {},
      { headers: this.getAuthHeaders() }
    );
  }

  rejectRegistration(registrationId: string, justification?: string): Observable<EventRegistrationResponse> {
    return this.http.patch<EventRegistrationResponse>(
      `${this.apiUrl}/event-registrations/${registrationId}/reject`,
      justification ? { justification } : {},
      { headers: this.getAuthHeaders() }
    );
  }

  dismissRegistration(registrationId: string, justification?: string): Observable<EventRegistrationResponse> {
    return this.http.patch<EventRegistrationResponse>(
      `${this.apiUrl}/event-registrations/${registrationId}/dismiss`,
      justification ? { justification } : {},
      { headers: this.getAuthHeaders() }
    );
  }

  addOrganizerFeedback(registrationId: string, rating: number, comment: string): Observable<EventRegistrationResponse> {
    return this.http.post<EventRegistrationResponse>(
      `${this.apiUrl}/event-registrations/${registrationId}/organizer-feedback`,
      { rating, comment },
      { headers: this.getAuthHeaders() }
    );
  }
}
