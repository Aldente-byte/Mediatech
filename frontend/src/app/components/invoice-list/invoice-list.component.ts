import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InvoiceService, Invoice } from '../../services/invoice.service';

@Component({
  selector: 'app-invoice-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-header">
      <h2>Invoices</h2>
      <button class="btn-primary" (click)="loadInvoices()">↻ Refresh</button>
    </div>

    <!-- Feedback Banner -->
    <div *ngIf="message" [class.error-banner]="isError" [class.success-banner]="!isError">
        {{ message }}
    </div>

    <div class="card table-container">
      <table class="data-table" *ngIf="invoices.length > 0; else emptyState">
        <thead>
          <tr>
            <th>ID</th>
            <th>Client</th>
            <th>Amount</th>
            <th>Status</th>
            <th>Issued Date</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let invoice of invoices">
            <td class="id-cell">#{{ invoice.id }}</td>
            <td>
                <div class="client-info">
                   <div class="avatar-sm">{{ invoice.client?.name?.charAt(0) || '?' }}</div>
                   <span>{{ invoice.client?.name || 'Unknown' }}</span>
                </div>
            </td>
            <td class="amount">\${{ invoice.amount }}</td>
            <td>
              <span class="status-badge" [class.paid]="invoice.status === 'PAID'" [class.pending]="invoice.status === 'PENDING'">
                {{ invoice.status || 'PENDING' }}
              </span>
            </td>
            <td class="text-muted">2023-12-16</td> 
          </tr>
        </tbody>
      </table>

      <ng-template #emptyState>
        <div class="empty-state">
            <div class="icon">📭</div>
            <p>No invoices found</p>
        </div>
      </ng-template>
    </div>
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
    
    .error-banner { background: #fee2e2; color: #b91c1c; padding: 1rem; border-radius: 8px; margin-bottom: 1rem; border: 1px solid #fecaca; }
    .success-banner { background: #ecfdf5; color: #059669; padding: 1rem; border-radius: 8px; margin-bottom: 1rem; border: 1px solid #a7f3d0; }

    .table-container { overflow-x: auto; padding: 0; }
    .data-table { width: 100%; border-collapse: collapse; text-align: left; }
    .data-table th { padding: 1rem 1.5rem; background: #f8fafc; font-weight: 600; color: var(--text-muted); border-bottom: 1px solid var(--border-color); }
    .data-table td { padding: 1rem 1.5rem; border-bottom: 1px solid var(--border-color); color: var(--text-main); vertical-align: middle; }
    .data-table tr:hover td { background-color: #f9fafb; }
    
    .id-cell { font-family: monospace; color: var(--text-muted); }
    .client-info { display: flex; align-items: center; gap: 0.75rem; }
    .avatar-sm { width: 28px; height: 28px; background: #e0e7ff; color: var(--primary); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: 700; }
    .amount { font-weight: 600; }
    
    .status-badge { padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; background: #f3f4f6; color: #4b5563; }
    .status-badge.paid { background: #ecfdf5; color: #059669; }
    .status-badge.pending { background: #fffbeb; color: #d97706; }
    
    .btn-icon { background: transparent; border: none; cursor: pointer; padding: 0.5rem; border-radius: 4px; font-size: 1rem; }
    .btn-icon.danger:hover { background: #fee2e2; }
    
    .empty-state { padding: 4rem; text-align: center; }
    .empty-state .icon { font-size: 3rem; margin-bottom: 1rem; opacity: 0.5; }
    .empty-state p { color: var(--text-muted); }
  `]
})
export class InvoiceListComponent implements OnInit {
  invoiceService = inject(InvoiceService);
  cdr = inject(ChangeDetectorRef);
  invoices: Invoice[] = [];

  message = '';
  isError = false;

  ngOnInit() {
    this.loadInvoices();
  }

  loadInvoices() {
    this.invoiceService.getAll().subscribe({
      next: (data) => {
        this.invoices = data;
        this.cdr.detectChanges();
      },
      error: () => this.showError('Failed to load invoices')
    });
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
