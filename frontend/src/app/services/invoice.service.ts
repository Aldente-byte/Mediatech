import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Invoice {
    id?: number;
    client: any;
    lines: any[];
    amount?: number;
    issueDate?: string;
    status?: string;
}

@Injectable({
    providedIn: 'root'
})
export class InvoiceService {
    private http = inject(HttpClient);
    private apiUrl = 'http://localhost:8082/api/invoices';

    getAll(): Observable<Invoice[]> {
        return this.http.get<Invoice[]>(this.apiUrl);
    }

    getMyInvoices(): Observable<Invoice[]> {
        return this.http.get<Invoice[]>(`${this.apiUrl}/my-invoices`);
    }

    getById(id: number): Observable<Invoice> {
        return this.http.get<Invoice>(`${this.apiUrl}/${id}`);
    }

    create(invoice: any): Observable<Invoice> {
        return this.http.post<Invoice>(this.apiUrl, invoice);
    }

    delete(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }

    downloadPdf(id: number): Observable<Blob> {
        return this.http.get(`${this.apiUrl}/${id}/pdf`, { responseType: 'blob' });
    }
}
