import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface UserProfile {
  fullName:   string;
  cpfOrCnpj: string;
  birthDate:  string;       // ISO date string, e.g. "1995-06-15"
  email:      string;
  gender:     string;
  phone:      string;
  instagram:  string;
  linkedin:   string;
}

export interface UpdatePasswordPayload {
  email:           string;
  currentPassword: string;
  newPassword:     string;
}

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly base = `${environment.baseApiUrl}/user`;

  constructor(private http: HttpClient) {}

  /** GET /user/profile */
  getProfile(): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.base}/profile`);
  }

  /**
   * POST /user/update
   * Sends only the editable fields (partial update).
   */
  updateProfile(payload: Partial<UserProfile>): Observable<any> {
    return this.http.post(`${this.base}/update`, payload);
  }

  /**
   * POST /user/update
   * Sends email + currentPassword + newPassword to change the password.
   */
  updatePassword(payload: UpdatePasswordPayload): Observable<any> {
    return this.http.post(`${this.base}/update`, payload);
  }
}