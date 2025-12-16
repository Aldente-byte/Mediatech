import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Product {
    id?: number;
    name: string;
    category: string;
    price: number;
    stock: number;
}

@Injectable({
    providedIn: 'root'
})
export class ProductService {
    private http = inject(HttpClient);
    private apiUrl = 'http://localhost:8082/api/products';

    getAll(): Observable<Product[]> {
        return this.http.get<Product[]>(this.apiUrl);
    }

    create(product: Product): Observable<Product> {
        return this.http.post<Product>(this.apiUrl, product);
    }

    update(id: number, product: Product): Observable<Product> {
        return this.http.put<Product>(`${this.apiUrl}/${id}`, product);
    }

    delete(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }
}
