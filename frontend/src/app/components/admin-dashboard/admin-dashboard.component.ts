import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterOutlet, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
    selector: 'app-admin-dashboard',
    standalone: true,
    imports: [CommonModule, RouterLink, RouterOutlet, RouterLinkActive],
    template: `
    <div class="admin-layout">
      <aside class="sidebar">
        <div class="brand">
            <div class="brand-icon">⚡</div>
            <span>AdminPanel</span>
        </div>
        
        <nav class="nav-menu">
            <a routerLink="invoices" routerLinkActive="active" class="nav-item">
                <span class="icon">📄</span> Invoices
            </a>
            <a routerLink="products" routerLinkActive="active" class="nav-item">
                <span class="icon">📦</span> Products
            </a>
            <a routerLink="clients" routerLinkActive="active" class="nav-item">
                <span class="icon">👥</span> Clients
            </a>
        </nav>
        
        <div class="sidebar-footer">
            <div class="admin-profile">
                <div class="avatar">A</div>
                <div class="info">
                    <span class="name">Administrator</span>
                    <span class="role">Super User</span>
                </div>
            </div>
            <button (click)="logout()" class="btn-logout" title="Sign Out">➜</button>
        </div>
      </aside>
      
      <main class="main-content">
        <header class="top-bar">
            <h2>Dashboard Overview</h2>
        </header>
        
        <div class="content-area">
            <router-outlet></router-outlet>
        </div>
      </main>
    </div>
  `,
    styles: [`
    /* ... (previous styles) ... */
    /* REMOVED .actions and .icon-btn styles since they are deleted */
    
    /* ... (rest of styles) ... */
  /* Redefining styles to be complete since this is a partial replace but context is tricky with large files */
    .admin-layout { 
        display: flex; 
        height: 100vh; 
        overflow: hidden;
        background-color: #f3f4f6;
    }
    
    /* Sidebar */
    .sidebar { 
        width: 260px; 
        background: #1e293b; 
        color: white; 
        display: flex; 
        flex-direction: column; 
        border-right: 1px solid #334155;
    }
    
    .brand { 
        padding: 1.5rem; 
        display: flex;
        align-items: center;
        gap: 0.75rem;
        font-size: 1.25rem; 
        font-weight: 700; 
        color: white;
        border-bottom: 1px solid #334155;
    }
    
    .brand-icon {
        background: var(--primary);
        width: 32px;
        height: 32px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1rem;
    }
    
    .nav-menu { 
        flex: 1; 
        padding: 1.5rem 1rem; 
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }
    
    .nav-item { 
        display: flex; 
        align-items: center;
        gap: 0.75rem;
        padding: 0.75rem 1rem; 
        color: #94a3b8; 
        text-decoration: none; 
        border-radius: 0.5rem;
        transition: all 0.2s;
        font-weight: 500;
    }
    
    .nav-item:hover { 
        background: #334155; 
        color: white; 
    }
    
    .nav-item.active { 
        background: var(--primary); 
        color: white; 
    }
    
    .sidebar-footer { 
        padding: 1rem; 
        border-top: 1px solid #334155; 
        display: flex;
        align-items: center;
        justify-content: space-between;
        background: #0f172a;
    }
    
    .admin-profile {
        display: flex;
        align-items: center;
        gap: 0.75rem;
    }
    
    .avatar {
        width: 36px;
        height: 36px;
        background: #475569;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
    }
    
    .info {
        display: flex;
        flex-direction: column;
    }
    
    .name { font-size: 0.85rem; font-weight: 600; }
    .role { font-size: 0.7rem; color: #94a3b8; }
    
    .btn-logout {
        background: transparent;
        border: none;
        color: #94a3b8;
        cursor: pointer;
        padding: 0.5rem;
        border-radius: 4px;
    }
    
    .btn-logout:hover { color: #f87171; background: #334155; }
    
    /* Main Content */
    .main-content { 
        flex: 1; 
        display: flex;
        flex-direction: column;
        overflow: hidden;
    }
    
    .top-bar {
        background: white;
        padding: 1rem 2rem;
        border-bottom: 1px solid var(--border-color);
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    
    .content-area { 
        flex: 1; 
        padding: 2rem; 
        overflow-y: auto; 
    }
  `]
})
export class AdminDashboardComponent {
    authService = inject(AuthService);

    logout() {
        if (confirm('Are you sure you want to sign out?')) {
            this.authService.logout();
        }
    }
}
