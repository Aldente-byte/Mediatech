import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { InvoiceListComponent } from './components/invoice-list/invoice-list.component';
import { ProductListComponent } from './components/product-list/product-list.component';
import { ClientListComponent } from './components/client-list/client-list.component';
import { ShopComponent } from './components/shop/shop.component';
import { AdminDashboardComponent } from './components/admin-dashboard/admin-dashboard.component';
import { authGuard } from './guards/auth.guard';
import { roleGuard } from './guards/role.guard';

export const routes: Routes = [
    { path: 'login', component: LoginComponent },
    {
        path: 'shop',
        component: ShopComponent,
        canActivate: [authGuard]
    },
    {
        path: 'admin',
        component: AdminDashboardComponent,
        canActivate: [roleGuard],
        children: [
            { path: 'invoices', component: InvoiceListComponent },
            { path: 'products', component: ProductListComponent },
            { path: 'clients', component: ClientListComponent },
            { path: '', redirectTo: 'invoices', pathMatch: 'full' }
        ]
    },
    { path: '', redirectTo: 'login', pathMatch: 'full' }
];
