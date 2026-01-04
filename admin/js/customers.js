/**
 * Customers Management JavaScript
 */

let allCustomers = [];
let filteredCustomers = [];
let currentPage = 1;
const customersPerPage = 20;

document.addEventListener('DOMContentLoaded', () => {
    if (!AdminAuth.checkAuth()) return;
    updateAdminInfo();
    loadCustomers();
});

function updateAdminInfo() {
    const user = AdminAuth.getUser();
    if (user) {
        const adminName = document.getElementById('adminName');
        const adminAvatar = document.getElementById('adminAvatar');
        if (adminName) adminName.textContent = user.full_name || user.email || 'Admin';
        if (adminAvatar) adminAvatar.textContent = (user.full_name || user.email || 'A').charAt(0).toUpperCase();
    }
}

async function loadCustomers() {
    try {
        const data = await AdminAuth.get('/admin/customers');
        if (data) {
            allCustomers = data.customers || [];
            filteredCustomers = [...allCustomers];
            renderCustomers();
        }
    } catch (error) {
        console.error('Error loading customers:', error);
        showToast('Failed to load customers', 'error');
    }
}

function filterCustomers() {
    const typeFilter = document.getElementById('typeFilter').value;
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();

    filteredCustomers = allCustomers.filter(customer => {
        const matchesType = !typeFilter || customer.user_type === typeFilter;
        const matchesSearch = !searchTerm ||
            (customer.full_name && customer.full_name.toLowerCase().includes(searchTerm)) ||
            (customer.email && customer.email.toLowerCase().includes(searchTerm)) ||
            (customer.phone && customer.phone.includes(searchTerm)) ||
            (customer.business_name && customer.business_name.toLowerCase().includes(searchTerm));

        return matchesType && matchesSearch;
    });

    currentPage = 1;
    renderCustomers();
}

function renderCustomers() {
    const container = document.getElementById('customersTable');
    const startIndex = (currentPage - 1) * customersPerPage;
    const endIndex = startIndex + customersPerPage;
    const pageCustomers = filteredCustomers.slice(startIndex, endIndex);

    if (pageCustomers.length === 0) {
        container.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 3rem; color: var(--text-muted);">
                    No customers found
                </td>
            </tr>
        `;
        renderPagination();
        return;
    }

    container.innerHTML = pageCustomers.map(customer => `
        <tr>
            <td>
                <div style="display: flex; align-items: center; gap: 0.75rem;">
                    <div style="width: 40px; height: 40px; background: var(--gold); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 600; color: var(--bg-primary);">
                        ${(customer.full_name || customer.email || 'C').charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <div style="font-weight: 600;">${customer.full_name || 'N/A'}</div>
                        ${customer.business_name ? `<div style="font-size: 0.75rem; color: var(--text-muted);">${customer.business_name}</div>` : ''}
                    </div>
                </div>
            </td>
            <td>
                <div>${customer.email || 'N/A'}</div>
                <div style="font-size: 0.75rem; color: var(--text-muted);">${customer.phone || 'No phone'}</div>
            </td>
            <td>
                <span class="status-badge ${customer.user_type === 'business' ? 'status-confirmed' : 'status-placed'}">
                    ${customer.user_type || 'individual'}
                </span>
            </td>
            <td>${customer.order_count || 0}</td>
            <td><strong>${formatCurrency(customer.total_spent || 0)}</strong></td>
            <td>${formatDate(customer.created_at)}</td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn" onclick="viewCustomer('${customer.id}')" title="View Details">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                            <circle cx="12" cy="12" r="3"/>
                        </svg>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');

    renderPagination();
}

function renderPagination() {
    const container = document.getElementById('pagination');
    const totalPages = Math.ceil(filteredCustomers.length / customersPerPage);

    if (totalPages <= 1) {
        container.innerHTML = '';
        return;
    }

    let html = '';

    html += `<button ${currentPage === 1 ? 'disabled' : ''} onclick="goToPage(${currentPage - 1})">Prev</button>`;

    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
            html += `<button class="${i === currentPage ? 'active' : ''}" onclick="goToPage(${i})">${i}</button>`;
        } else if (i === currentPage - 3 || i === currentPage + 3) {
            html += `<button disabled>...</button>`;
        }
    }

    html += `<button ${currentPage === totalPages ? 'disabled' : ''} onclick="goToPage(${currentPage + 1})">Next</button>`;

    container.innerHTML = html;
}

function goToPage(page) {
    currentPage = page;
    renderCustomers();
    window.scrollTo(0, 0);
}

async function viewCustomer(customerId) {
    const customer = allCustomers.find(c => c.id === customerId);
    if (!customer) return;

    const modal = document.getElementById('customerModal');
    const details = document.getElementById('customerDetails');

    // Show loading
    details.innerHTML = `<div class="loading"><div class="spinner"></div></div>`;
    modal.classList.add('active');

    try {
        // Fetch customer details with orders
        const data = await AdminAuth.get(`/admin/customers?id=${customerId}`);
        const customerData = data.customer || customer;
        const orders = data.orders || [];

        details.innerHTML = `
            <div class="order-detail-grid">
                <div>
                    <div class="order-info-section">
                        <h4>Customer Information</h4>
                        <div class="order-info-row">
                            <span class="label">Name</span>
                            <span>${customerData.full_name || 'N/A'}</span>
                        </div>
                        <div class="order-info-row">
                            <span class="label">Email</span>
                            <span>${customerData.email || 'N/A'}</span>
                        </div>
                        <div class="order-info-row">
                            <span class="label">Phone</span>
                            <span>${customerData.phone || 'N/A'}</span>
                        </div>
                        <div class="order-info-row">
                            <span class="label">Type</span>
                            <span class="status-badge ${customerData.user_type === 'business' ? 'status-confirmed' : 'status-placed'}">
                                ${customerData.user_type || 'individual'}
                            </span>
                        </div>
                        ${customerData.business_name ? `
                        <div class="order-info-row">
                            <span class="label">Business Name</span>
                            <span>${customerData.business_name}</span>
                        </div>
                        ` : ''}
                        ${customerData.gst_number ? `
                        <div class="order-info-row">
                            <span class="label">GST Number</span>
                            <span>${customerData.gst_number}</span>
                        </div>
                        ` : ''}
                        <div class="order-info-row">
                            <span class="label">Joined</span>
                            <span>${formatDate(customerData.created_at)}</span>
                        </div>
                    </div>

                    <div class="order-info-section" style="background: var(--bg-tertiary); padding: 1rem; border-radius: 8px; margin-top: 1rem;">
                        <div class="order-info-row" style="border: none;">
                            <span class="label">Total Orders</span>
                            <span style="font-weight: 600;">${customerData.order_count || orders.length || 0}</span>
                        </div>
                        <div class="order-info-row" style="border: none; font-size: 1.25rem;">
                            <span>Total Spent</span>
                            <span style="color: var(--gold); font-weight: 700;">${formatCurrency(customerData.total_spent || 0)}</span>
                        </div>
                    </div>
                </div>

                <div>
                    <div class="order-info-section">
                        <h4>Recent Orders</h4>
                        ${orders.length > 0 ? `
                            <div style="max-height: 400px; overflow-y: auto;">
                                ${orders.slice(0, 10).map(order => `
                                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; background: var(--bg-tertiary); border-radius: 8px; margin-bottom: 0.5rem;">
                                        <div>
                                            <div style="font-weight: 600;">#${order.order_number || order.id.slice(0, 8)}</div>
                                            <div style="font-size: 0.75rem; color: var(--text-muted);">${formatDate(order.created_at)}</div>
                                        </div>
                                        <div style="text-align: right;">
                                            <div style="font-weight: 600; color: var(--gold);">${formatCurrency(order.total)}</div>
                                            <span class="status-badge status-${order.order_status}" style="font-size: 0.625rem;">${order.order_status}</span>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        ` : '<p style="color: var(--text-muted); text-align: center; padding: 2rem;">No orders yet</p>'}
                    </div>
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Error loading customer details:', error);
        details.innerHTML = `
            <div class="order-detail-grid">
                <div>
                    <div class="order-info-section">
                        <h4>Customer Information</h4>
                        <div class="order-info-row">
                            <span class="label">Name</span>
                            <span>${customer.full_name || 'N/A'}</span>
                        </div>
                        <div class="order-info-row">
                            <span class="label">Email</span>
                            <span>${customer.email || 'N/A'}</span>
                        </div>
                        <div class="order-info-row">
                            <span class="label">Phone</span>
                            <span>${customer.phone || 'N/A'}</span>
                        </div>
                        <div class="order-info-row">
                            <span class="label">Type</span>
                            <span>${customer.user_type || 'individual'}</span>
                        </div>
                    </div>
                </div>
                <div>
                    <p style="color: var(--text-muted);">Unable to load order details.</p>
                </div>
            </div>
        `;
    }
}

function closeModal() {
    document.getElementById('customerModal').classList.remove('active');
}

function formatCurrency(amount) {
    return '₹' + (parseFloat(amount) || 0).toLocaleString('en-IN');
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });
}

function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const icon = type === 'success'
        ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>'
        : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>';

    toast.innerHTML = `${icon}<span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideIn 0.3s ease reverse';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}
