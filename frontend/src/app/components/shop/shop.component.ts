import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { InvoiceService } from '../../services/invoice.service';

interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  stock: number;
}

@Component({
  selector: 'app-shop',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="shop-wrapper">
      <div class="toast-container" *ngIf="toastMessage">
        <div class="toast" [class.error]="isError">
            {{ toastMessage }}
        </div>
      </div>

      <header class="shop-header">
        <div class="brand-section">
            <h1>Product Catalog</h1>
            <span class="badge">Commercial Access</span>
        </div>
        <div class="user-actions">
            <span class="welcome-text">Welcome, User</span>
            <button (click)="logout()" class="btn-logout">Sign Out</button>
        </div>
      </header>

      <div class="shop-content">
        <div class="product-grid" *ngIf="products.length > 0; else emptyShop">
          <div *ngFor="let product of products" class="product-card">
            <div class="card-media">
                <div class="placeholder-icon">📦</div>
                <div class="category-tag">{{ product.category }}</div>
            </div>
            
            <div class="card-body">
                <h3 class="product-title">{{ product.name }}</h3>
                <div class="product-meta">
                    <span class="stock-status" [class.low]="product.stock < 10">
                        {{ product.stock }} in stock
                    </span>
                    <span class="price">\${{ product.price }}</span>
                </div>
                
                <button (click)="initiateBuy(product)" class="btn-primary btn-buy" [disabled]="loading">
                    Purchase
                </button>
            </div>
          </div>
        </div>
        
        <ng-template #emptyShop>
            <div class="empty-state-shop">
                <div class="icon">🛒</div>
                <h2>Catalog is Empty</h2>
                <p>No products are currently available.</p>
                <button class="btn-outline" (click)="loadProducts()">Try Refreshing</button>
            </div>
        </ng-template>

        <!-- Confirmation Modal -->
        <div class="modal-backdrop" *ngIf="productToBuy">
            <div class="modal-content">
                <h3>Confirm Purchase</h3>
                <p>Are you sure you want to purchase <strong>{{ productToBuy.name }}</strong> for <strong>\${{ productToBuy.price }}</strong>?</p>
                
                <div class="modal-actions">
                    <button class="btn-text" (click)="cancelBuy()">Cancel</button>
                    <button class="btn-primary" (click)="confirmBuy()">Yes, Purchase</button>
                </div>
            </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .shop-wrapper { min-height: 100vh; background-color: var(--bg-body); position: relative; }
    
    /* Toast */
    .toast-container { position: fixed; top: 1rem; left: 50%; transform: translateX(-50%); z-index: 100; pointer-events: none; }
    .toast { background: #333; color: white; padding: 0.75rem 1.5rem; border-radius: 9999px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); font-weight: 500; animation: slideDown 0.3s ease; }
    .toast.error { background: #fee2e2; color: #b91c1c; }
    @keyframes slideDown { from { transform: translateY(-100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

    /* Modal */
    .modal-backdrop { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 50; animation: fadeIn 0.2s; }
    .modal-content { background: white; padding: 2rem; border-radius: var(--radius-lg); width: 100%; max-width: 400px; box-shadow: var(--shadow-xl); animation: scaleIn 0.2s; }
    .modal-content h3 { margin-bottom: 1rem; font-size: 1.25rem; }
    .modal-content p { color: var(--text-muted); margin-bottom: 1.5rem; line-height: 1.5; }
    .modal-actions { display: flex; justify-content: flex-end; gap: 1rem; }
    
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes scaleIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }

    .btn-text { background: none; border: none; padding: 0.5rem 1rem; cursor: pointer; color: var(--text-muted); font-weight: 500; }
    .btn-text:hover { color: var(--text-main); background: #f3f4f6; border-radius: 6px; }

    /* Shop Components */
    .shop-header { background: white; padding: 1rem 2rem; display: flex; justify-content: space-between; align-items: center; box-shadow: var(--shadow-sm); position: sticky; top: 0; z-index: 10; border-bottom: 1px solid var(--border-color); }
    .brand-section { display: flex; align-items: center; gap: 1rem; }
    .brand-section h1 { font-size: 1.25rem; color: var(--text-main); }
    .badge { background: #ecfdf5; color: #059669; font-size: 0.75rem; padding: 0.25rem 0.75rem; border-radius: 9999px; font-weight: 600; }
    
    .user-actions { display: flex; align-items: center; gap: 1.5rem; }
    .welcome-text { color: var(--text-muted); font-size: 0.9rem; }
    .btn-logout { padding: 0.5rem 1rem; color: var(--text-muted); background: transparent; border: 1px solid var(--border-color); border-radius: var(--radius-md); cursor: pointer; }
    .btn-logout:hover { background: #fef2f2; color: #dc2626; border-color: #fee2e2; }

    .shop-content { padding: 2rem; max-width: 1400px; margin: 0 auto; }
    .product-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 2rem; }
    .product-card { background: white; border-radius: var(--radius-lg); overflow: hidden; border: 1px solid var(--border-color); transition: all 0.3s ease; display: flex; flex-direction: column; }
    .product-card:hover { transform: translateY(-4px); box-shadow: var(--shadow-lg); border-color: var(--primary); }
    
    .card-media { height: 160px; background: #f8fafc; display: flex; align-items: center; justify-content: center; position: relative; }
    .placeholder-icon { font-size: 4rem; opacity: 0.5; }
    .category-tag { position: absolute; top: 1rem; right: 1rem; background: rgba(255, 255, 255, 0.9); padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; color: var(--text-muted); box-shadow: var(--shadow-sm); }
    
    .card-body { padding: 1.5rem; flex: 1; display: flex; flex-direction: column; }
    .product-title { font-size: 1.1rem; margin-bottom: 0.5rem; line-height: 1.4; }
    .product-meta { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
    .stock-status { font-size: 0.875rem; color: #10b981; }
    .stock-status.low { color: #f59e0b; }
    .price { font-size: 1.25rem; font-weight: 700; color: var(--primary); }
    
    .btn-buy { margin-top: auto; width: 100%; justify-content: center; }
    .btn-buy:disabled { opacity: 0.7; cursor: wait; }

    .empty-state-shop { text-align: center; padding: 4rem 2rem; background: white; border-radius: var(--radius-lg); box-shadow: var(--shadow-sm); margin-top: 2rem; }
    .empty-state-shop .icon { font-size: 4rem; margin-bottom: 1rem; opacity: 0.5; }
    .empty-state-shop h2 { margin-bottom: 0.5rem; color: var(--text-main); }
    .empty-state-shop p { color: var(--text-muted); margin-bottom: 1.5rem; }
    .btn-outline { padding: 0.5rem 1.5rem; border: 1px solid var(--primary); color: var(--primary); background: white; border-radius: 6px; cursor: pointer; font-weight: 600; }
    .btn-outline:hover { background: #f0f9ff; }
  `]
})
export class ShopComponent implements OnInit {
  http = inject(HttpClient);
  authService = inject(AuthService);
  cdr = inject(ChangeDetectorRef);

  products: Product[] = [];
  toastMessage = '';
  isError = false;
  loading = false;

  productToBuy: Product | null = null;

  ngOnInit() {
    this.loadProducts();
  }

  loadProducts() {
    this.http.get<Product[]>('http://localhost:8082/api/products').subscribe({
      next: (data) => {
        this.products = data;
        this.cdr.detectChanges();
      },
      error: (err) => this.showToast('Failed to load products', true)
    });
  }

  initiateBuy(product: Product) {
    this.productToBuy = product;
    this.cdr.detectChanges();
  }

  cancelBuy() {
    this.productToBuy = null;
    this.cdr.detectChanges();
  }

  confirmBuy() {
    if (!this.productToBuy) return;

    this.loading = true;
    const product = this.productToBuy; // Capture for closure

    const invoiceRequest = {
      clientId: 1,
      lines: [
        { productId: product.id, quantity: 1 }
      ]
    };

    this.http.post('http://localhost:8082/api/invoices', invoiceRequest).subscribe({
      next: () => {
        this.showToast(`Purchased ${product.name}!`);
        this.loading = false;
        this.productToBuy = null;
        this.loadProducts(); // Refresh stock
      },
      error: () => {
        this.showToast('Purchase failed', true);
        this.loading = false;
        this.productToBuy = null;
      }
    });
  }

  showToast(msg: string, isError = false) {
    this.toastMessage = msg;
    this.isError = isError;
    this.cdr.detectChanges();
    setTimeout(() => {
      this.toastMessage = '';
      this.cdr.detectChanges();
    }, 3000);
  }

  logout() {
    this.authService.logout();
  }
}
