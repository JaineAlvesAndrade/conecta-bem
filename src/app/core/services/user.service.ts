import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface UpdatePasswordPayload {
  email: string;
  currentPassword: string;
  newPassword: string;
}

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly base = `${environment.baseApiUrl}/user`;

  constructor(private http: HttpClient) {}

  updatePassword(payload: UpdatePasswordPayload): Observable<any> {
    return this.http.post(`${this.base}/update`, payload);
  }
}