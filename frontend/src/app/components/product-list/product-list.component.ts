import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductService, Product } from '../../services/product.service';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-header">
      <h2>Products</h2>
      <div class="header-actions">
        <button class="btn-secondary" (click)="loadProducts()">↻ Refresh</button>
        <button class="btn-primary" (click)="toggleForm()">
            {{ showForm ? 'Cancel' : '+ Add Product' }}
        </button>
      </div>
    </div>

    <!-- Error/Success Banner -->
    <div *ngIf="message" [class.error-banner]="isError" [class.success-banner]="!isError">
        {{ message }}
    </div>

    <!-- Add Product Form -->
    <div *ngIf="showForm" class="card form-card">
        <h3>Add New Product</h3>
        <form #productForm="ngForm">
            <div class="grid-2">
                <div class="form-group">
                    <label>Name</label>
                    <input [(ngModel)]="newProduct.name" name="inputName" required placeholder="Product Name">
                </div>
                <div class="form-group">
                    <label>Category</label>
                    <select [(ngModel)]="newProduct.category" name="inputCategory" required class="form-select">
                        <option value="" disabled>Select Category</option>
                        <option *ngFor="let cat of categories" [value]="cat">{{ cat }}</option>
                    </select>
                </div>
            </div>
            <div class="grid-2">
                <div class="form-group">
                    <label>Price ($)</label>
                    <input type="number" [(ngModel)]="newProduct.price" name="inputPrice" required min="0">
                </div>
                <div class="form-group">
                    <label>Stock (Qty)</label>
                    <input type="number" [(ngModel)]="newProduct.stock" name="inputStock" required min="0">
                </div>
            </div>
            
            <button type="button" 
                    class="btn-primary" 
                    [disabled]="!isValid()" 
                    (click)="save()">
                Save Product
            </button>
        </form>
    </div>

    <div class="card table-container">
      <table class="data-table" *ngIf="products.length > 0; else emptyState">
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Category</th>
            <th>Price</th>
            <th>Stock</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let product of products">
            <td class="id-cell">#{{ product.id }}</td>
            <td class="font-weight-500">{{ product.name }}</td>
            <td><span class="badge">{{ product.category }}</span></td>
            <td class="font-bold">\${{ product.price }}</td>
            <td>
                <span [class.text-danger]="product.stock < 10">{{ product.stock }}</span>
            </td>
            <td>
              <button class="btn-icon danger" (click)="delete(product.id!)" title="Delete">🗑️</button>
            </td>
          </tr>
        </tbody>
      </table>
      
      <ng-template #emptyState>
        <div class="empty-state">
            <p>No products found. Add one above!</p>
        </div>
      </ng-template>
    </div>
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
    .header-actions { display: flex; gap: 1rem; }
    
    .error-banner { background: #fee2e2; color: #b91c1c; padding: 1rem; border-radius: 8px; margin-bottom: 1rem; border: 1px solid #fecaca; }
    .success-banner { background: #ecfdf5; color: #059669; padding: 1rem; border-radius: 8px; margin-bottom: 1rem; border: 1px solid #a7f3d0; }
    
    .form-card { padding: 1.5rem; margin-bottom: 2rem; border-left: 4px solid var(--primary); background: #f8fafc; }
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .form-group { margin-bottom: 1rem; }
    .form-group label { display: block; margin-bottom: 0.5rem; font-weight: 500; font-size: 0.9rem; }
    .form-group input, .form-select { width: 100%; padding: 0.6rem; border: 1px solid #d1d5db; border-radius: 6px; font-size: 1rem; }
    .form-select { background-color: white; }
    
    .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-secondary { background: white; border: 1px solid #d1d5db; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer; }
    
    .table-container { overflow-x: auto; padding: 0; }
    .data-table { width: 100%; border-collapse: collapse; }
    .data-table th, .data-table td { padding: 1rem; text-align: left; border-bottom: 1px solid var(--border-color); }
    .data-table th { background: #f8fafc; font-weight: 600; color: var(--text-muted); }
    
    .badge { background: #e0e7ff; color: #4338ca; padding: 4px 8px; border-radius: 4px; font-size: 0.8rem; font-weight: 500; }
    .font-bold { font-weight: 600; }
    .text-danger { color: #dc2626; font-weight: bold; }
    
    .btn-icon { background: none; border: none; cursor: pointer; font-size: 1.1rem; }
    .btn-icon.danger:hover { background: #fee2e2; border-radius: 4px; }
    
    .empty-state { padding: 4rem; text-align: center; color: var(--text-muted); }
  `]
})
export class ProductListComponent implements OnInit {
  productService = inject(ProductService);
  cdr = inject(ChangeDetectorRef);

  products: Product[] = [];
  categories = ['Industriel', 'Composant', 'Domestique', 'Logiciel', 'Accessoire'];

  showForm = false;
  newProduct: Product = { name: '', category: '', price: 0, stock: 0 };

  message = '';
  isError = false;

  ngOnInit() {
    this.loadProducts();
  }

  toggleForm() {
    this.showForm = !this.showForm;
    this.message = '';
  }

  loadProducts() {
    this.productService.getAll().subscribe({
      next: (data) => {
        this.products = data;
        this.cdr.detectChanges(); // Force update
      },
      error: (err) => this.showError('Failed to load products')
    });
  }

  isValid(): boolean {
    return !!(this.newProduct.name && this.newProduct.category && this.newProduct.price >= 0 && this.newProduct.stock >= 0);
  }

  save() {
    if (!this.isValid()) return;

    this.productService.create(this.newProduct).subscribe({
      next: () => {
        this.loadProducts();
        this.showForm = false; // Close form on success
        this.newProduct = { name: '', category: '', price: 0, stock: 0 }; // Reset
        this.showSuccess('Product added successfully!');
      },
      error: (err) => {
        console.error(err);
        this.showError('Failed to save product. ' + (err.error?.message || 'Server error'));
      }
    });
  }

  delete(id: number) {
    if (confirm('Delete this product?')) {
      this.productService.delete(id).subscribe({
        next: () => {
          this.loadProducts();
          this.showSuccess('Product deleted.');
        },
        error: () => this.showError('Failed to delete product.')
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
