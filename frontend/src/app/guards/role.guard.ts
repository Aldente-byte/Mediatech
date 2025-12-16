import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const roleGuard: CanActivateFn = (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (authService.isLoggedIn() && authService.isAdmin()) {
        return true;
    }

    // If not admin, redirect to shop if logged in, or login if not
    if (authService.isLoggedIn()) {
        router.navigate(['/shop']);
    } else {
        router.navigate(['/login']);
    }
    return false;
};
