import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
import { UpdatePasswordPayload, UserProfile } from '../models/profile.model';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly base = `${environment.baseApiUrl}/user`;

  constructor(private http: HttpClient, private authService: AuthService) { }

  private getAuthHeaders() {
    const token = this.authService.getToken();
    return {
      'Authorization': `Bearer ${token}`
    };
  }

  /** GET /user/profile */
  getProfile(): Observable<UserProfile> {
    return this.http.get<UserProfile>(
      `${this.base}/profile`,
      { headers: this.getAuthHeaders() }
    );
  }

  /**
   * POST /user/update
   * Sends only the editable fields (partial update).
   */
  updateProfile(payload: Partial<UserProfile>): Observable<any> {
    return this.http.post(
      `${this.base}/update`, 
      payload,
      { headers: this.getAuthHeaders() }
    );
  }

  /**
   * POST /user/update
   */
  updatePassword(payload: UpdatePasswordPayload): Observable<any> {
    return this.http.post(
      `${this.base}/change-password`, 
      payload,
     { headers: this.getAuthHeaders() }
    );
  }
}