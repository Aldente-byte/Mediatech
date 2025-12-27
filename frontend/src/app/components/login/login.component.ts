import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink],
    templateUrl: './login.component.html',
    styleUrl: './login.component.css'
})
export class LoginComponent {
    authService = inject(AuthService);
    credentials = { username: '', password: '' };
    error = '';

    login() {
        this.authService.login(this.credentials).subscribe({
            error: (err: any) => this.error = 'Invalid credentials'
        });
    }
}
