import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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

interface CartItem {
  product: Product;
  quantity: number;
}

@Component({
  selector: 'app-shop',
  standalone: true,
  imports: [CommonModule, FormsModule],
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
            <button (click)="toggleCart()" class="btn-cart" [class.has-items]="cartItems.length > 0" *ngIf="currentView === 'products'">
              <span>🛒</span>
              <span class="cart-badge" *ngIf="cartItems.length > 0">{{ cartItems.length }}</span>
              <span class="cart-label">Cart</span>
            </button>
            <button (click)="switchView('products')" class="btn-tab" [class.active]="currentView === 'products'">Products</button>
            <button (click)="switchView('invoices')" class="btn-tab" [class.active]="currentView === 'invoices'">My Invoices</button>
            <span class="welcome-text">Welcome, {{ currentUsername }}</span>
            <button (click)="logout()" class="btn-logout">Sign Out</button>
        </div>
      </header>

      <div class="shop-content">
        <!-- Products View -->
        <div *ngIf="currentView === 'products'">
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
                
                <div class="product-actions">
                  <div class="quantity-controls" *ngIf="getCartItem(product.id)">
                    <button (click)="decreaseQuantity(product)" class="btn-qty">-</button>
                    <span class="qty-display">{{ getCartItem(product.id)?.quantity || 0 }}</span>
                    <button (click)="increaseQuantity(product)" class="btn-qty" [disabled]="(getCartItem(product.id)?.quantity ?? 0) >= product.stock">+</button>
                  </div>
                  <button (click)="addToCart(product)" class="btn-primary btn-buy" [disabled]="loading || product.stock === 0">
                    {{ getCartItem(product.id) ? 'Update Cart' : 'Add to Cart' }}
                  </button>
                </div>
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
        </div>

        <!-- Invoices View -->
        <div *ngIf="currentView === 'invoices'" class="invoices-view">
          <div class="invoices-header">
            <h2>My Invoices</h2>
            <button (click)="loadInvoices()" class="btn-refresh">↻ Refresh</button>
          </div>
          
          <div class="invoices-list" *ngIf="invoices.length > 0; else emptyInvoices">
            <div *ngFor="let invoice of invoices" class="invoice-card">
              <div class="invoice-header">
                <div class="invoice-id">Invoice #{{ invoice.id }}</div>
                <span class="status-badge" [class.paid]="invoice.status === 'PAID'" [class.pending]="invoice.status === 'PENDING'">
                  {{ invoice.status || 'PENDING' }}
                </span>
              </div>
              <div class="invoice-details">
                <div class="invoice-info">
                  <div class="info-row">
                    <span class="label">Date:</span>
                    <span class="value">{{ invoice.issueDate | date:'mediumDate' }}</span>
                  </div>
                  <div class="info-row">
                    <span class="label">Total:</span>
                    <span class="value amount">\${{ invoice.amount }}</span>
                  </div>
                  <div class="info-row" *ngIf="invoice.lines && invoice.lines.length > 0">
                    <span class="label">Items:</span>
                    <span class="value">{{ invoice.lines.length }} product(s)</span>
                  </div>
                </div>
                <div class="invoice-actions">
                  <button (click)="downloadInvoicePdf(invoice.id!)" class="btn-download">📄 Download PDF</button>
                </div>
              </div>
            </div>
          </div>
          
          <ng-template #emptyInvoices>
            <div class="empty-state-invoices">
              <div class="icon">📭</div>
              <h2>No Invoices</h2>
              <p>You haven't made any purchases yet.</p>
            </div>
          </ng-template>
        </div>
      </div>

      <!-- Cart Sidebar -->
      <div class="cart-sidebar" [class.open]="cartOpen">
        <div class="cart-header">
          <h2>Shopping Cart</h2>
          <button (click)="toggleCart()" class="btn-close">✕</button>
        </div>
        
        <div class="cart-content" *ngIf="cartItems.length > 0; else emptyCart">
          <div class="cart-items">
            <div *ngFor="let item of cartItems" class="cart-item">
              <div class="cart-item-info">
                <h4>{{ item.product.name }}</h4>
                <p class="cart-item-meta">{{ item.product.category }} • \${{ item.product.price }} each</p>
              </div>
              <div class="cart-item-controls">
                <div class="quantity-controls-small">
                  <button (click)="decreaseQuantity(item.product)" class="btn-qty-small">-</button>
                  <span class="qty-display-small">{{ item.quantity }}</span>
                  <button (click)="increaseQuantity(item.product)" class="btn-qty-small" [disabled]="item.quantity >= item.product.stock">+</button>
                </div>
                <div class="cart-item-total">\${{ (item.product.price * item.quantity).toFixed(2) }}</div>
                <button (click)="removeFromCart(item.product.id)" class="btn-remove">Remove</button>
              </div>
            </div>
          </div>
          
          <div class="cart-footer">
            <div class="cart-total">
              <span class="total-label">Total:</span>
              <span class="total-amount">\${{ getCartTotal().toFixed(2) }}</span>
            </div>
            <button (click)="checkout()" class="btn-checkout" [disabled]="loading">
              {{ loading ? 'Processing...' : 'Complete Purchase' }}
            </button>
          </div>
        </div>
        
        <ng-template #emptyCart>
          <div class="empty-cart">
            <div class="empty-cart-icon">🛒</div>
            <p>Your cart is empty</p>
            <button (click)="toggleCart()" class="btn-outline">Continue Shopping</button>
          </div>
        </ng-template>
      </div>
      
      <div class="cart-overlay" *ngIf="cartOpen" (click)="toggleCart()"></div>
    </div>
  `,
  styles: [`
    .shop-wrapper { min-height: 100vh; background-color: var(--bg-body); position: relative; }
    
    /* Toast */
    .toast-container { position: fixed; top: 1rem; left: 50%; transform: translateX(-50%); z-index: 1000; pointer-events: none; }
    .toast { background: #333; color: white; padding: 0.75rem 1.5rem; border-radius: 9999px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); font-weight: 500; animation: slideDown 0.3s ease; }
    .toast.error { background: #fee2e2; color: #b91c1c; }
    @keyframes slideDown { from { transform: translateY(-100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

    /* Shop Components */
    .shop-header { background: white; padding: 1rem 2rem; display: flex; justify-content: space-between; align-items: center; box-shadow: var(--shadow-sm); position: sticky; top: 0; z-index: 100; border-bottom: 1px solid var(--border-color); }
    .brand-section { display: flex; align-items: center; gap: 1rem; }
    .brand-section h1 { font-size: 1.25rem; color: var(--text-main); }
    .badge { background: #ecfdf5; color: #059669; font-size: 0.75rem; padding: 0.25rem 0.75rem; border-radius: 9999px; font-weight: 600; }
    
    .user-actions { display: flex; align-items: center; gap: 1rem; }
    .welcome-text { color: var(--text-muted); font-size: 0.9rem; }
    
    .btn-cart { display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem 1rem; background: #f3f4f6; border: 1px solid var(--border-color); border-radius: var(--radius-md); cursor: pointer; position: relative; transition: all 0.2s; }
    .btn-cart:hover { background: #e5e7eb; }
    .btn-cart.has-items { background: #dbeafe; border-color: #3b82f6; }
    .btn-cart span:first-child { font-size: 1.2rem; }
    .cart-badge { position: absolute; top: -0.25rem; right: -0.25rem; background: #ef4444; color: white; border-radius: 50%; width: 1.25rem; height: 1.25rem; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: 600; }
    .cart-label { font-size: 0.875rem; font-weight: 500; }
    
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
    .product-meta { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
    .stock-status { font-size: 0.875rem; color: #10b981; }
    .stock-status.low { color: #f59e0b; }
    .price { font-size: 1.25rem; font-weight: 700; color: var(--primary); }
    
    .product-actions { display: flex; flex-direction: column; gap: 0.75rem; margin-top: auto; }
    .quantity-controls { display: flex; align-items: center; gap: 0.5rem; justify-content: center; }
    .btn-qty { width: 2rem; height: 2rem; border: 1px solid var(--border-color); background: white; border-radius: 0.375rem; cursor: pointer; font-weight: 600; }
    .btn-qty:hover { background: #f3f4f6; }
    .btn-qty:disabled { opacity: 0.5; cursor: not-allowed; }
    .qty-display { min-width: 2rem; text-align: center; font-weight: 600; }
    
    .btn-buy { width: 100%; justify-content: center; }
    .btn-buy:disabled { opacity: 0.7; cursor: not-allowed; }

    .empty-state-shop { text-align: center; padding: 4rem 2rem; background: white; border-radius: var(--radius-lg); box-shadow: var(--shadow-sm); margin-top: 2rem; }
    .empty-state-shop .icon { font-size: 4rem; margin-bottom: 1rem; opacity: 0.5; }
    .empty-state-shop h2 { margin-bottom: 0.5rem; color: var(--text-main); }
    .empty-state-shop p { color: var(--text-muted); margin-bottom: 1.5rem; }
    .btn-outline { padding: 0.5rem 1.5rem; border: 1px solid var(--primary); color: var(--primary); background: white; border-radius: 6px; cursor: pointer; font-weight: 600; }
    .btn-outline:hover { background: #f0f9ff; }

    .btn-tab { padding: 0.5rem 1rem; background: transparent; border: 1px solid var(--border-color); border-radius: var(--radius-md); cursor: pointer; color: var(--text-muted); font-weight: 500; transition: all 0.2s; }
    .btn-tab:hover { background: #f3f4f6; }
    .btn-tab.active { background: var(--primary); color: white; border-color: var(--primary); }

    /* Invoices View */
    .invoices-view { padding: 2rem; max-width: 1200px; margin: 0 auto; }
    .invoices-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
    .invoices-header h2 { font-size: 1.5rem; margin: 0; }
    .btn-refresh { padding: 0.5rem 1rem; background: #f3f4f6; border: 1px solid var(--border-color); border-radius: var(--radius-md); cursor: pointer; }
    .btn-refresh:hover { background: #e5e7eb; }
    
    .invoices-list { display: flex; flex-direction: column; gap: 1rem; }
    .invoice-card { background: white; border: 1px solid var(--border-color); border-radius: var(--radius-lg); padding: 1.5rem; }
    .invoice-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
    .invoice-id { font-family: monospace; font-weight: 600; color: var(--text-main); }
    .status-badge { padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; background: #f3f4f6; color: #4b5563; }
    .status-badge.paid { background: #ecfdf5; color: #059669; }
    .status-badge.pending { background: #fffbeb; color: #d97706; }
    
    .invoice-details { display: flex; justify-content: space-between; align-items: center; }
    .invoice-info { display: flex; flex-direction: column; gap: 0.5rem; }
    .info-row { display: flex; gap: 0.5rem; }
    .label { color: var(--text-muted); font-size: 0.875rem; }
    .value { font-weight: 500; }
    .value.amount { font-size: 1.25rem; font-weight: 700; color: var(--primary); }
    
    .invoice-actions { display: flex; gap: 0.5rem; }
    .btn-download { padding: 0.5rem 1rem; background: #dbeafe; color: #1e40af; border: none; border-radius: var(--radius-md); cursor: pointer; font-weight: 500; }
    .btn-download:hover { background: #bfdbfe; }
    
    .empty-state-invoices { text-align: center; padding: 4rem 2rem; background: white; border-radius: var(--radius-lg); box-shadow: var(--shadow-sm); }
    .empty-state-invoices .icon { font-size: 4rem; margin-bottom: 1rem; opacity: 0.5; }
    .empty-state-invoices h2 { margin-bottom: 0.5rem; color: var(--text-main); }
    .empty-state-invoices p { color: var(--text-muted); }

    /* Cart Sidebar */
    .cart-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.5); z-index: 200; animation: fadeIn 0.2s; }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    
    .cart-sidebar { position: fixed; top: 0; right: 0; width: 420px; height: 100vh; background: white; box-shadow: -2px 0 10px rgba(0,0,0,0.1); z-index: 300; transform: translateX(100%); transition: transform 0.3s ease; display: flex; flex-direction: column; }
    .cart-sidebar.open { transform: translateX(0); }
    
    .cart-header { padding: 1.5rem; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center; }
    .cart-header h2 { font-size: 1.25rem; margin: 0; }
    .btn-close { background: none; border: none; font-size: 1.5rem; cursor: pointer; color: var(--text-muted); padding: 0.25rem; }
    .btn-close:hover { color: var(--text-main); }
    
    .cart-content { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
    .cart-items { flex: 1; overflow-y: auto; padding: 1rem; }
    
    .cart-item { padding: 1rem; border-bottom: 1px solid #f3f4f6; }
    .cart-item-info h4 { margin: 0 0 0.25rem 0; font-size: 1rem; }
    .cart-item-meta { margin: 0; font-size: 0.875rem; color: var(--text-muted); }
    .cart-item-controls { margin-top: 0.75rem; display: flex; align-items: center; gap: 0.75rem; }
    .quantity-controls-small { display: flex; align-items: center; gap: 0.5rem; }
    .btn-qty-small { width: 1.75rem; height: 1.75rem; border: 1px solid var(--border-color); background: white; border-radius: 0.25rem; cursor: pointer; font-size: 0.875rem; }
    .btn-qty-small:hover { background: #f3f4f6; }
    .btn-qty-small:disabled { opacity: 0.5; cursor: not-allowed; }
    .qty-display-small { min-width: 1.5rem; text-align: center; font-size: 0.875rem; font-weight: 600; }
    .cart-item-total { flex: 1; text-align: right; font-weight: 600; color: var(--primary); }
    .btn-remove { padding: 0.25rem 0.5rem; background: #fee2e2; color: #991b1b; border: none; border-radius: 0.25rem; cursor: pointer; font-size: 0.75rem; }
    .btn-remove:hover { background: #fecaca; }
    
    .cart-footer { padding: 1.5rem; border-top: 1px solid var(--border-color); background: #f9fafb; }
    .cart-total { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
    .total-label { font-size: 1rem; font-weight: 600; }
    .total-amount { font-size: 1.5rem; font-weight: 700; color: var(--primary); }
    .btn-checkout { width: 100%; padding: 0.875rem; background: var(--primary); color: white; border: none; border-radius: 0.5rem; font-weight: 600; cursor: pointer; }
    .btn-checkout:hover { opacity: 0.9; }
    .btn-checkout:disabled { opacity: 0.7; cursor: not-allowed; }
    
    .empty-cart { padding: 3rem 1.5rem; text-align: center; }
    .empty-cart-icon { font-size: 4rem; opacity: 0.3; margin-bottom: 1rem; }
    .empty-cart p { color: var(--text-muted); margin-bottom: 1.5rem; }
  `]
})
export class ShopComponent implements OnInit {
  http = inject(HttpClient);
  authService = inject(AuthService);
  invoiceService = inject(InvoiceService);
  cdr = inject(ChangeDetectorRef);

  products: Product[] = [];
  cartItems: CartItem[] = [];
  cartOpen = false;
  toastMessage = '';
  isError = false;
  loading = false;
  currentUsername = 'User';
  currentClientId: number | null = null;
  currentView: 'products' | 'invoices' = 'products';
  invoices: any[] = [];

  ngOnInit() {
    this.loadUserInfo();
    this.loadProducts();
  }

  switchView(view: 'products' | 'invoices') {
    this.currentView = view;
    if (view === 'invoices') {
      this.loadInvoices();
    }
    this.cdr.detectChanges();
  }

  loadInvoices() {
    this.invoiceService.getMyInvoices().subscribe({
      next: (data) => {
        this.invoices = data;
        this.cdr.detectChanges();
      },
      error: () => {
        this.showToast('Failed to load invoices', true);
      }
    });
  }

  downloadInvoicePdf(invoiceId: number) {
    this.invoiceService.downloadPdf(invoiceId).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `invoice_${invoiceId}.pdf`;
        link.click();
        window.URL.revokeObjectURL(url);
        this.showToast('Invoice downloaded successfully');
      },
      error: () => {
        this.showToast('Failed to download invoice', true);
      }
    });
  }

  loadUserInfo() {
    this.authService.getCurrentUser().subscribe({
      next: (user: any) => {
        this.currentUsername = user.username || 'User';
        if (user.clientId) {
          this.currentClientId = user.clientId;
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.showToast('Failed to load user info', true);
      }
    });
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

  toggleCart() {
    this.cartOpen = !this.cartOpen;
    this.cdr.detectChanges();
  }

  getCartItem(productId: number): CartItem | undefined {
    return this.cartItems.find(item => item.product.id === productId);
  }

  addToCart(product: Product) {
    const existingItem = this.getCartItem(product.id);
    
    if (existingItem) {
      if (existingItem.quantity < product.stock) {
        existingItem.quantity++;
      } else {
        this.showToast('Cannot add more - stock limit reached', true);
        return;
      }
    } else {
      if (product.stock > 0) {
        this.cartItems.push({ product, quantity: 1 });
      } else {
        this.showToast('Product out of stock', true);
        return;
      }
    }
    
    this.cdr.detectChanges();
    this.showToast(`Added ${product.name} to cart`);
  }

  increaseQuantity(product: Product) {
    const item = this.getCartItem(product.id);
    if (item && item.quantity < product.stock) {
      item.quantity++;
      this.cdr.detectChanges();
    }
  }

  decreaseQuantity(product: Product) {
    const item = this.getCartItem(product.id);
    if (item) {
      if (item.quantity > 1) {
        item.quantity--;
      } else {
        this.removeFromCart(product.id);
      }
      this.cdr.detectChanges();
    }
  }

  removeFromCart(productId: number) {
    this.cartItems = this.cartItems.filter(item => item.product.id !== productId);
    this.cdr.detectChanges();
  }

  getCartTotal(): number {
    return this.cartItems.reduce((total, item) => total + (item.product.price * item.quantity), 0);
  }

  checkout() {
    if (this.cartItems.length === 0) {
      this.showToast('Cart is empty', true);
      return;
    }

    if (!this.currentClientId) {
      this.showToast('Client information not available', true);
      return;
    }

    this.loading = true;

    const invoiceRequest = {
      clientId: this.currentClientId,
      lines: this.cartItems.map(item => ({
        productId: item.product.id,
        quantity: item.quantity
      }))
    };

    this.http.post('http://localhost:8082/api/invoices', invoiceRequest).subscribe({
      next: () => {
        this.showToast('Purchase completed successfully!');
        this.cartItems = [];
        this.cartOpen = false;
        this.loading = false;
        this.loadProducts(); // Refresh stock
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.showToast(err.error?.message || 'Purchase failed', true);
        this.loading = false;
        this.cdr.detectChanges();
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
