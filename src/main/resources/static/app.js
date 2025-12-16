const INVOICE_API_URL = '/api/invoices';
const PRODUCT_API_URL = '/api/products';
const CLIENT_API_URL = '/api/clients';
const AUTH_API_URL = '/api/auth';

let currentInvoiceLines = [];
let productsCache = [];
let authToken = null;
let isLoginMode = true;

document.addEventListener('DOMContentLoaded', () => {
    // Check if user is logged in
    authToken = localStorage.getItem('authToken');
    if (authToken) {
        showApp();
    } else {
        showLoginModal();
    }

    // Auth handlers
    document.getElementById('authForm').addEventListener('submit', handleAuth);
    document.getElementById('toggleAuthMode').addEventListener('click', toggleAuthMode);
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);

    // Tabs
    document.getElementById('showInvoicesBtn').addEventListener('click', () => switchTab('invoices'));
    document.getElementById('showClientsBtn').addEventListener('click', () => switchTab('clients'));
    document.getElementById('showProductsBtn').addEventListener('click', () => switchTab('products'));

    // Invoices
    document.getElementById('invoiceForm').addEventListener('submit', handleInvoiceSubmit);
    document.getElementById('refreshBtn').addEventListener('click', loadInvoices);
    document.getElementById('addLineBtn').addEventListener('click', handleAddLine);

    // Clients
    document.getElementById('clientForm').addEventListener('submit', handleClientSubmit);
    document.getElementById('refreshClientsBtn').addEventListener('click', loadClients);

    // Products
    document.getElementById('productForm').addEventListener('submit', handleProductSubmit);
    document.getElementById('refreshProductsBtn').addEventListener('click', loadProducts);
});

// --- Authentication Logic ---
function showLoginModal() {
    document.getElementById('loginModal').style.display = 'flex';
    document.getElementById('appContainer').style.display = 'none';
}

function showApp() {
    document.getElementById('loginModal').style.display = 'none';
    document.getElementById('appContainer').style.display = 'block';
    
    const username = localStorage.getItem('username');
    document.getElementById('currentUser').textContent = `Bonjour, ${username}`;
    
    // Load initial data
    loadInvoices();
    loadClientsForSelect();
    loadProductsForSelect();
    loadClients();
    loadProducts();
}

function toggleAuthMode(e) {
    e.preventDefault();
    isLoginMode = !isLoginMode;
    
    if (isLoginMode) {
        document.getElementById('modalTitle').textContent = 'Connexion';
        document.getElementById('authSubmitBtn').textContent = 'Se connecter';
        document.getElementById('toggleText').textContent = 'Pas encore de compte ?';
        document.getElementById('toggleAuthMode').textContent = 'S\'inscrire';
    } else {
        document.getElementById('modalTitle').textContent = 'Inscription';
        document.getElementById('authSubmitBtn').textContent = 'S\'inscrire';
        document.getElementById('toggleText').textContent = 'Déjà un compte ?';
        document.getElementById('toggleAuthMode').textContent = 'Se connecter';
    }
    
    document.getElementById('authError').textContent = '';
}

async function handleAuth(e) {
    e.preventDefault();
    const username = document.getElementById('authUsername').value;
    const password = document.getElementById('authPassword').value;
    const errorDiv = document.getElementById('authError');
    
    const endpoint = isLoginMode ? `${AUTH_API_URL}/login` : `${AUTH_API_URL}/register`;
    
    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            errorDiv.textContent = data.error || 'Une erreur est survenue';
            return;
        }
        
        if (isLoginMode) {
            // Login successful
            authToken = data.token;
            localStorage.setItem('authToken', data.token);
            localStorage.setItem('username', data.username);
            showApp();
            e.target.reset();
        } else {
            // Registration successful, switch to login
            errorDiv.textContent = '';
            alert('Inscription réussie ! Veuillez vous connecter.');
            toggleAuthMode(e);
            e.target.reset();
        }
    } catch (error) {
        console.error(error);
        errorDiv.textContent = 'Erreur de connexion au serveur';
    }
}

function handleLogout() {
    authToken = null;
    localStorage.removeItem('authToken');
    localStorage.removeItem('username');
    showLoginModal();
}

// Helper to add auth header to requests
function getAuthHeaders() {
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
    };
}

async function authFetch(url, options = {}) {
    const response = await fetch(url, {
        ...options,
        headers: {
            ...options.headers,
            'Authorization': `Bearer ${authToken}`
        }
    });
    
    if (response.status === 401) {
        // Token expired or invalid
        handleLogout();
        throw new Error('Session expirée');
    }
    
    return response;
}

function switchTab(tab) {
    const invoicesView = document.getElementById('invoicesView');
    const clientsView = document.getElementById('clientsView');
    const productsView = document.getElementById('productsView');
    
    const invoicesBtn = document.getElementById('showInvoicesBtn');
    const clientsBtn = document.getElementById('showClientsBtn');
    const productsBtn = document.getElementById('showProductsBtn');

    invoicesView.style.display = 'none';
    clientsView.style.display = 'none';
    productsView.style.display = 'none';
    
    invoicesBtn.classList.remove('active');
    clientsBtn.classList.remove('active');
    productsBtn.classList.remove('active');

    if (tab === 'invoices') {
        invoicesView.style.display = 'block';
        invoicesBtn.classList.add('active');
    } else if (tab === 'clients') {
        clientsView.style.display = 'block';
        clientsBtn.classList.add('active');
    } else {
        productsView.style.display = 'block';
        productsBtn.classList.add('active');
    }
}

// --- Invoices Logic ---
async function loadInvoices() {
    try {
        const response = await authFetch(INVOICE_API_URL);
        if (!response.ok) throw new Error('Erreur chargement factures');
        const invoices = await response.json();
        renderInvoices(invoices);
    } catch (error) {
        console.error(error);
    }
}

function renderInvoices(invoices) {
    const tbody = document.getElementById('invoiceList');
    tbody.innerHTML = '';
    invoices.forEach(invoice => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>#${invoice.id}</td>
            <td>${invoice.client ? invoice.client.name : 'Inconnu'}</td>
            <td>${formatDate(invoice.issueDate)}</td>
            <td>${formatCurrency(invoice.amount)}</td>
            <td><span class="status-badge status-${invoice.status.toLowerCase()}">${formatStatus(invoice.status)}</span></td>
            <td>
                <button class="btn-delete" onclick="deleteInvoice(${invoice.id})">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

async function loadClientsForSelect() {
    try {
        const response = await authFetch(CLIENT_API_URL);
        const clients = await response.json();
        const select = document.getElementById('clientSelect');
        select.innerHTML = '<option value="">Sélectionner un client</option>';
        clients.forEach(client => {
            const option = document.createElement('option');
            option.value = client.id;
            option.textContent = client.name;
            select.appendChild(option);
        });
    } catch (error) { console.error(error); }
}

async function loadProductsForSelect() {
    try {
        const response = await authFetch(PRODUCT_API_URL);
        productsCache = await response.json();
        const select = document.getElementById('productSelect');
        select.innerHTML = '<option value="">Choisir un produit</option>';
        productsCache.forEach(product => {
            const option = document.createElement('option');
            option.value = product.id;
            option.textContent = `${product.name} (${formatCurrency(product.price)})`;
            select.appendChild(option);
        });
    } catch (error) { console.error(error); }
}

function handleAddLine() {
    const productSelect = document.getElementById('productSelect');
    const quantityInput = document.getElementById('quantityInput');
    const productId = parseInt(productSelect.value);
    const quantity = parseInt(quantityInput.value);

    if (!productId || quantity < 1) return;

    const product = productsCache.find(p => p.id === productId);
    if (!product) return;

    currentInvoiceLines.push({
        productId: productId,
        productName: product.name,
        price: product.price,
        quantity: quantity
    });

    renderInvoiceLines();
    productSelect.value = '';
    quantityInput.value = 1;
}

function renderInvoiceLines() {
    const tbody = document.getElementById('linesList');
    const totalPreview = document.getElementById('totalPreview');
    tbody.innerHTML = '';
    let total = 0;

    currentInvoiceLines.forEach((line, index) => {
        const lineTotal = line.price * line.quantity;
        total += lineTotal;
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${line.productName}</td>
            <td>${line.quantity}</td>
            <td>${formatCurrency(line.price)}</td>
            <td>${formatCurrency(lineTotal)}</td>
            <td><button type="button" onclick="removeLine(${index})" style="color:red;background:none;border:none;cursor:pointer;">X</button></td>
        `;
        tbody.appendChild(tr);
    });

    totalPreview.textContent = formatCurrency(total);
}

function removeLine(index) {
    currentInvoiceLines.splice(index, 1);
    renderInvoiceLines();
}

async function handleInvoiceSubmit(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    const data = {
        clientId: parseInt(formData.get('clientId')),
        issueDate: formData.get('issueDate'),
        status: formData.get('status'),
        lines: currentInvoiceLines.map(l => ({
            productId: l.productId,
            quantity: l.quantity
        }))
    };

    if (data.lines.length === 0) {
        alert("Veuillez ajouter au moins une ligne à la facture.");
        return;
    }

    try {
        const response = await authFetch(INVOICE_API_URL, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error('Erreur création facture');
        
        e.target.reset();
        currentInvoiceLines = [];
        renderInvoiceLines();
        loadInvoices();
    } catch (error) {
        console.error(error);
        alert('Erreur lors de la création de la facture.');
    }
}

async function deleteInvoice(id) {
    if (!confirm('Supprimer cette facture ?')) return;
    try {
        await authFetch(`${INVOICE_API_URL}/${id}`, { method: 'DELETE' });
        loadInvoices();
    } catch (error) { console.error(error); }
}

// --- Clients Logic ---
async function loadClients() {
    try {
        const response = await authFetch(CLIENT_API_URL);
        const clients = await response.json();
        const tbody = document.getElementById('clientList');
        tbody.innerHTML = '';
        clients.forEach(client => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>#${client.id}</td>
                <td>${client.name}</td>
                <td>${client.email || '-'}</td>
                <td>${client.address || '-'}</td>
                <td>
                    <button class="btn-delete" onclick="deleteClient(${client.id})">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (error) { console.error(error); }
}

async function handleClientSubmit(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());

    try {
        const response = await authFetch(CLIENT_API_URL, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error('Erreur création client');
        e.target.reset();
        loadClients();
        loadClientsForSelect();
    } catch (error) { console.error(error); }
}

async function deleteClient(id) {
    if (!confirm('Supprimer ce client ?')) return;
    try {
        await authFetch(`${CLIENT_API_URL}/${id}`, { method: 'DELETE' });
        loadClients();
        loadClientsForSelect();
    } catch (error) { console.error(error); }
}

// --- Products Logic ---
async function loadProducts() {
    try {
        const response = await authFetch(PRODUCT_API_URL);
        const products = await response.json();
        const tbody = document.getElementById('productList');
        tbody.innerHTML = '';
        products.forEach(product => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>#${product.id}</td>
                <td>${product.name}</td>
                <td>${product.category}</td>
                <td>${formatCurrency(product.price)}</td>
                <td>${product.stock}</td>
                <td>
                    <button class="btn-delete" onclick="deleteProduct(${product.id})">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (error) { console.error(error); }
}

async function handleProductSubmit(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {
        name: formData.get('name'),
        category: formData.get('category'),
        price: parseFloat(formData.get('price')),
        stock: parseInt(formData.get('stock'))
    };

    try {
        const response = await authFetch(PRODUCT_API_URL, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error('Erreur création produit');
        e.target.reset();
        loadProducts();
        loadProductsForSelect();
    } catch (error) { console.error(error); }
}

async function deleteProduct(id) {
    if (!confirm('Supprimer ce produit ?')) return;
    try {
        await authFetch(`${PRODUCT_API_URL}/${id}`, { method: 'DELETE' });
        loadProducts();
        loadProductsForSelect();
    } catch (error) { console.error(error); }
}

// Helpers
function formatDate(dateString) {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('fr-FR');
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);
}

function formatStatus(status) {
    const map = { 'PENDING': 'En attente', 'PAID': 'Payée', 'CANCELLED': 'Annulée' };
    return map[status] || status;
}

// Expose global
window.deleteInvoice = deleteInvoice;
window.deleteClient = deleteClient;
window.deleteProduct = deleteProduct;
window.removeLine = removeLine;
