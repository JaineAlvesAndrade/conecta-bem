import { HttpClient, HttpResponse } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface RegisterPayload {
  email: string;
  fullName: string;
  username: string;
  password: string;
  cpfCnpj: string;
  birthDate: string;
  gender: string; 
  instagram?: string; 
  linkedin?: string;
  phone: string;
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

  // Signal para rastrear estado de autenticação
  isLoggedIn = signal<boolean>(this.isUserLoggedIn());

  constructor(private http: HttpClient) {}

  private isUserLoggedIn(): boolean {
    return !!this.getToken();
  }

  register(payload: RegisterPayload): Observable<any> {
    return this.http.post(`${this.base}/register`, payload);
  }

  login(payload: LoginPayload): Observable<HttpResponse<any>> {
    // Observe the full response so callers can validate status codes
    return this.http.post<any>(`${this.base}/login`, payload, { observe: 'response' });
  }

  /**
   * Save token and expiry to localStorage
   */
  saveToken(token: string) {
    if (!token) {
      return;
    }
    localStorage.setItem(this.storageKey, token);
    const expiry = Date.now() + this.tokenLifetimeMs;
    localStorage.setItem(this.storageExpiryKey, expiry.toString());
    this.isLoggedIn.set(true);
  }

  getToken(): string | null {
    const token = localStorage.getItem(this.storageKey);
    const expiryStr = localStorage.getItem(this.storageExpiryKey);
    
    if (!token || !expiryStr) {
      return null;
    }
    
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
    this.isLoggedIn.set(false);
  }

  logout() {
    this.clearToken();
  }
}