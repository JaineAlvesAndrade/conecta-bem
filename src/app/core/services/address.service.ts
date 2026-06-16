import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Address, CreateAddressPayload } from '../models/address.model';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AddressService {
    private apiUrl = environment.baseApiUrl;

    constructor(private http: HttpClient, private authService: AuthService) { }

    private getAuthHeaders() {
        const token = this.authService.getToken();
        return {
            'Authorization': `Bearer ${token}`
        };
    }

    getAddresses(): Observable<Address[]> {
        return this.http.get<{ addresses: Address[], total: number }>(
            `${this.apiUrl}/addresses`,
            { headers: this.getAuthHeaders() }
        ).pipe(
            map(response => response.addresses)
        );
    }

    getAddressById(id: string): Observable<Address> {
        return this.http.get<Address>(
            `${this.apiUrl}/addresses/${id}`,
            { headers: this.getAuthHeaders() }
        );
    }

    createAddress(payload: CreateAddressPayload): Observable<Address> {
        return this.http.post<Address>(
            `${this.apiUrl}/addresses`,
            payload,
            { headers: this.getAuthHeaders() }
        );
    }
}
