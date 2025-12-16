import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Client {
    id?: number;
    name: string;
    email: string;
    address: string;
}

@Injectable({
    providedIn: 'root'
})
export class ClientService {
    private http = inject(HttpClient);
    private apiUrl = 'http://localhost:8082/api/clients';

    getAll(): Observable<Client[]> {
        return this.http.get<Client[]>(this.apiUrl);
    }

    create(client: Client): Observable<Client> {
        return this.http.post<Client>(this.apiUrl, client);
    }

    delete(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }
}
