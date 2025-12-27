import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Router } from '@angular/router';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private http = inject(HttpClient);
    private router = inject(Router);
    private apiUrl = 'http://localhost:8082/api/auth';
    private currentUserSubject = new BehaviorSubject<string | null>(localStorage.getItem('token'));
    private currentRoleSubject = new BehaviorSubject<string | null>(localStorage.getItem('role'));

    public currentUser$ = this.currentUserSubject.asObservable();
    public currentRole$ = this.currentRoleSubject.asObservable();

    login(credentials: any): Observable<any> {
        return this.http.post(`${this.apiUrl}/login`, credentials).pipe(
            tap((res: any) => {
                if (res.token) {
                    this.setToken(res.token);
                    this.setRole(res.role);

                    if (res.role === 'ROLE_ADMIN') {
                        this.router.navigate(['/admin']);
                    } else {
                        this.router.navigate(['/shop']);
                    }
                }
            })
        );
    }

    register(user: any): Observable<any> {
        return this.http.post(`${this.apiUrl}/register`, user);
    }

    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        this.currentUserSubject.next(null);
        this.currentRoleSubject.next(null);
        this.router.navigate(['/login']);
    }

    getToken(): string | null {
        return localStorage.getItem('token');
    }

    getRole(): string | null {
        return localStorage.getItem('role');
    }

    private setToken(token: string) {
        localStorage.setItem('token', token);
        this.currentUserSubject.next(token);
    }

    private setRole(role: string) {
        localStorage.setItem('role', role);
        this.currentRoleSubject.next(role);
    }

    isLoggedIn(): boolean {
        return !!this.getToken();
    }

    isAdmin(): boolean {
        return this.getRole() === 'ROLE_ADMIN';
    }

    getCurrentUser(): Observable<any> {
        return this.http.get(`${this.apiUrl}/me`);
    }
}
