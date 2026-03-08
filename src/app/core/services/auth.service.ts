import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
    private readonly API = 'http://localhost:8080/users';

    constructor(private http: HttpClient) { }

    login(dados: any): Observable<any> {
        return this.http.post(`${this.API}/login`, dados);
    }

    register(dados: any): Observable<any> {
        return this.http.post(`${this.API}/register`, dados);
    }
}