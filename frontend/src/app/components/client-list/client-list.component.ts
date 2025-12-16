import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ClientService, Client } from '../../services/client.service';

@Component({
  selector: 'app-client-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-header">
      <h2>Clients</h2>
      <div class="header-actions">
        <button class="btn-secondary" (click)="loadClients()">↻ Refresh</button>
        <button class="btn-primary" (click)="toggleForm()">
            {{ showForm ? 'Cancel' : '+ Add Client' }}
        </button>
      </div>
    </div>

    <!-- Feedback Banner -->
    <div *ngIf="message" [class.error-banner]="isError" [class.success-banner]="!isError">
        {{ message }}
    </div>

    <!-- Add Client Form -->
    <div *ngIf="showForm" class="card form-card">
        <h3>Add New Client</h3>
        <form #clientForm="ngForm">
            <div class="form-group">
                <label>Name</label>
                <input [(ngModel)]="newClient.name" name="name" required placeholder="Client Name">
            </div>
            <div class="form-group">
                <label>Email</label>
                <input [(ngModel)]="newClient.email" name="email" required placeholder="email@example.com">
            </div>
            <div class="form-group">
                <label>Address</label>
                <input [(ngModel)]="newClient.address" name="address" required placeholder="Full Address">
            </div>
            <button type="button" 
                    class="btn-primary" 
                    [disabled]="!isValid()" 
                    (click)="save()">
                Save Client
            </button>
        </form>
    </div>

    <div class="card table-container">
      <table class="data-table" *ngIf="clients.length > 0; else emptyState">
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Email</th>
            <th>Address</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let client of clients">
            <td class="id-cell">#{{ client.id }}</td>
            <td class="font-weight-500">{{ client.name }}</td>
            <td>{{ client.email }}</td>
            <td class="text-muted">{{ client.address }}</td>
            <td>
              <button class="btn-icon danger" (click)="delete(client.id!)" title="Delete">🗑️</button>
            </td>
          </tr>
        </tbody>
      </table>

      <ng-template #emptyState>
        <div class="empty-state">
            <p>No clients found.</p>
        </div>
      </ng-template>
    </div>
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
    .header-actions { display: flex; gap: 1rem; }
    
    .form-card { padding: 1.5rem; margin-bottom: 2rem; border-left: 4px solid var(--primary); background: #f8fafc; }
    .form-group { margin-bottom: 1rem; }
    .form-group label { display: block; margin-bottom: 0.5rem; font-weight: 500; font-size: 0.9rem; }
    .form-group input { width: 100%; padding: 0.6rem; border: 1px solid #d1d5db; border-radius: 6px; }
    
    .error-banner { background: #fee2e2; color: #b91c1c; padding: 1rem; border-radius: 8px; margin-bottom: 1rem; border: 1px solid #fecaca; }
    .success-banner { background: #ecfdf5; color: #059669; padding: 1rem; border-radius: 8px; margin-bottom: 1rem; border: 1px solid #a7f3d0; }

    .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-secondary { background: white; border: 1px solid #d1d5db; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer; }

    .table-container { overflow-x: auto; padding: 0; }
    .data-table { width: 100%; border-collapse: collapse; }
    .data-table th, .data-table td { padding: 1rem; text-align: left; border-bottom: 1px solid var(--border-color); }
    .data-table th { background: #f8fafc; font-weight: 600; color: var(--text-muted); }
    .font-weight-500 { font-weight: 500; }
    
    .btn-icon { background: none; border: none; cursor: pointer; font-size: 1.1rem; }
    .btn-icon.danger:hover { background: #fee2e2; border-radius: 4px; }
    
    .empty-state { padding: 4rem; text-align: center; color: var(--text-muted); }
  `]
})
export class ClientListComponent implements OnInit {
  clientService = inject(ClientService);
  cdr = inject(ChangeDetectorRef);

  clients: Client[] = [];
  showForm = false;
  newClient: Client = { name: '', email: '', address: '' };

  message = '';
  isError = false;

  ngOnInit() {
    this.loadClients();
  }

  loadClients() {
    this.clientService.getAll().subscribe({
      next: (data) => {
        this.clients = data;
        this.cdr.detectChanges();
      },
      error: () => this.showError('Failed to load clients')
    });
  }

  toggleForm() {
    this.showForm = !this.showForm;
    this.message = '';
  }

  isValid(): boolean {
    return !!(this.newClient.name && this.newClient.email && this.newClient.address);
  }

  save() {
    if (!this.isValid()) return;

    this.clientService.create(this.newClient).subscribe({
      next: () => {
        this.loadClients();
        this.showForm = false;
        this.newClient = { name: '', email: '', address: '' };
        this.showSuccess('Client added successfully');
      },
      error: (err) => this.showError('Failed to add client. ' + (err.error?.message || 'Server error'))
    });
  }

  delete(id: number) {
    if (confirm('Delete this client?')) {
      this.clientService.delete(id).subscribe({
        next: () => {
          this.loadClients();
          this.showSuccess('Client deleted');
        },
        error: () => this.showError('Failed to delete client')
      });
    }
  }

  private showError(msg: string) {
    this.message = msg;
    this.isError = true;
    setTimeout(() => this.message = '', 5000);
    this.cdr.detectChanges();
  }

  private showSuccess(msg: string) {
    this.message = msg;
    this.isError = false;
    setTimeout(() => this.message = '', 3000);
    this.cdr.detectChanges();
  }
}
