import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface RegisterPayload {
  email: string;
  fullName: string;
  username: string;
  password: string;
}

export interface LoginPayload {
  username: string;
  password: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly base = `${environment.baseApiUrl}/auth`;
  private readonly storageKey = 'jwtToken';
  private readonly storageExpiryKey = 'jwtTokenExpiry';
  private readonly tokenLifetimeMs = 12 * 60 * 60 * 1000; // 12 hours

  constructor(private http: HttpClient) {}

  register(payload: RegisterPayload): Observable<any> {
    return this.http.post(`${this.base}/register`, payload);
  }

  login(payload: LoginPayload): Observable<any> {
    return this.http.post(`${this.base}/login`, payload);
  }

  /**
   * Save token and expiry to localStorage
   */
  saveToken(token: string) {
    localStorage.setItem(this.storageKey, token);
    const expiry = Date.now() + this.tokenLifetimeMs;
    localStorage.setItem(this.storageExpiryKey, expiry.toString());
  }

  getToken(): string | null {
    const token = localStorage.getItem(this.storageKey);
    const expiryStr = localStorage.getItem(this.storageExpiryKey);
    if (!token || !expiryStr) return null;
    const expiry = parseInt(expiryStr, 10);
    if (Date.now() > expiry) {
      this.clearToken();
      return null;
    }
    return token;
  }

  clearToken() {
    localStorage.removeItem(this.storageKey);
    localStorage.removeItem(this.storageExpiryKey);
  }
}