import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
    selector: 'app-register',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink],
    template: `
    <div class="login-container">
      <div class="login-card">
        <div class="logo">📝</div>
        <h2>Create Account</h2>
        <p class="subtitle">Join the invoice management system</p>
        
        <form (ngSubmit)="onRegister()">
          <div class="form-group">
            <label>Username</label>
            <input type="text" [(ngModel)]="username" name="username" required>
          </div>
          
          <div class="form-group">
            <label>Email</label>
            <input type="email" [(ngModel)]="email" name="email" required>
          </div>

          <div class="form-group">
            <label>Address</label>
            <input type="text" [(ngModel)]="address" name="address" placeholder="Optional">
          </div>

          <div class="form-group">
            <label>Password</label>
            <input type="password" [(ngModel)]="password" name="password" required>
          </div>

          <div class="error-msg" *ngIf="errorMessage">{{ errorMessage }}</div>

          <button type="submit" class="btn-login" [disabled]="loading">
            {{ loading ? 'Creating...' : 'Sign Up' }}
          </button>
          
          <div class="footer-links">
            Already have an account? <a routerLink="/login">Log in</a>
          </div>
        </form>
      </div>
    </div>
  `,
    styles: [`
    .login-container { height: 100vh; display: flex; align-items: center; justify-content: center; background: #f3f4f6; }
    .login-card { background: white; padding: 2.5rem; border-radius: 12px; width: 100%; max-width: 400px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
    .logo { font-size: 3rem; text-align: center; margin-bottom: 1rem; }
    h2 { text-align: center; color: #111827; margin-bottom: 0.5rem; }
    .subtitle { text-align: center; color: #6b7280; margin-bottom: 2rem; }
    
    .form-group { margin-bottom: 1.5rem; }
    label { display: block; margin-bottom: 0.5rem; color: #374151; font-weight: 500; font-size: 0.875rem; }
    input { width: 100%; padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 6px; font-size: 0.95rem; transition: border-color 0.15s; box-sizing: border-box; }
    input:focus { outline: none; border-color: #2563eb; ring: 2px solid #2563eb; }
    
    .btn-login { width: 100%; padding: 0.75rem; background: #2563eb; color: white; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; transition: background 0.15s; }
    .btn-login:hover { background: #1d4ed8; }
    .btn-login:disabled { opacity: 0.7; cursor: not-allowed; }
    
    .error-msg { background: #fee2e2; color: #991b1b; padding: 0.75rem; border-radius: 6px; margin-bottom: 1.5rem; text-align: center; font-size: 0.875rem; }
    .footer-links { margin-top: 1.5rem; text-align: center; font-size: 0.875rem; color: #6b7280; }
    a { color: #2563eb; text-decoration: none; font-weight: 500; }
    a:hover { text-decoration: underline; }
  `]
})
export class RegisterComponent {
    username = '';
    email = '';
    address = '';
    password = '';
    errorMessage = '';
    loading = false;

    http = inject(HttpClient);
    router = inject(Router);

    onRegister() {
        this.loading = true;
        this.errorMessage = '';

        this.http.post('http://localhost:8082/api/auth/register', {
            username: this.username,
            email: this.email,
            address: this.address || '',
            password: this.password
        }).subscribe({
            next: () => {
                this.router.navigate(['/login']);
            },
            error: (err) => {
                this.errorMessage = err.error?.error || 'Registration failed';
                this.loading = false;
            }
        });
    }
}
