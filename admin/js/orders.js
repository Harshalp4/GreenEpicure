/**
 * Orders Management JavaScript
 */

let allOrders = [];
let filteredOrders = [];
let currentPage = 1;
const ordersPerPage = 20;

document.addEventListener('DOMContentLoaded', () => {
    if (!AdminAuth.checkAuth()) return;
    updateAdminInfo();
    loadOrders();
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

async function loadOrders() {
    try {
        const data = await AdminAuth.get('/admin/orders?limit=500');
        if (data) {
            allOrders = data.orders || [];
            filteredOrders = [...allOrders];
            renderOrders();
        }
    } catch (error) {
        console.error('Error loading orders:', error);
        showToast('Failed to load orders', 'error');
    }
}

function filterOrders() {
    const statusFilter = document.getElementById('statusFilter').value;
    const paymentFilter = document.getElementById('paymentFilter').value;
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();

    filteredOrders = allOrders.filter(order => {
        const matchesStatus = !statusFilter || order.order_status === statusFilter;
        const matchesPayment = !paymentFilter || order.payment_status === paymentFilter;
        const matchesSearch = !searchTerm ||
            (order.order_number && order.order_number.toLowerCase().includes(searchTerm)) ||
            (order.profiles?.full_name && order.profiles.full_name.toLowerCase().includes(searchTerm)) ||
            (order.profiles?.phone && order.profiles.phone.toLowerCase().includes(searchTerm)) ||
            (order.profiles?.business_name && order.profiles.business_name.toLowerCase().includes(searchTerm)) ||
            order.id.toLowerCase().includes(searchTerm);

        return matchesStatus && matchesPayment && matchesSearch;
    });

    currentPage = 1;
    renderOrders();
}

function renderOrders() {
    const container = document.getElementById('ordersTable');
    const startIndex = (currentPage - 1) * ordersPerPage;
    const endIndex = startIndex + ordersPerPage;
    const pageOrders = filteredOrders.slice(startIndex, endIndex);

    if (pageOrders.length === 0) {
        container.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; padding: 3rem; color: var(--text-muted);">
                    No orders found
                </td>
            </tr>
        `;
        renderPagination();
        return;
    }

    container.innerHTML = pageOrders.map(order => `
        <tr>
            <td>
                <strong>#${order.order_number || order.id.slice(0, 8)}</strong>
            </td>
            <td>
                <div>${order.profiles?.full_name || 'N/A'}</div>
                <div style="font-size: 0.75rem; color: var(--text-muted);">${order.profiles?.phone || ''}</div>
            </td>
            <td>${order.order_items?.length || 0} items</td>
            <td><strong>${formatCurrency(order.total)}</strong></td>
            <td>
                <span class="status-badge status-${order.order_status}">${order.order_status}</span>
            </td>
            <td>
                <span class="status-badge status-${order.payment_status}">${order.payment_status}</span>
            </td>
            <td>${formatDate(order.created_at)}</td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn" onclick="viewOrder('${order.id}')" title="View Details">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                            <circle cx="12" cy="12" r="3"/>
                        </svg>
                    </button>
                    <button class="action-btn" onclick="editOrderStatus('${order.id}')" title="Update Status">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
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
    const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);

    if (totalPages <= 1) {
        container.innerHTML = '';
        return;
    }

    let html = '';

    // Previous button
    html += `<button ${currentPage === 1 ? 'disabled' : ''} onclick="goToPage(${currentPage - 1})">Prev</button>`;

    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
            html += `<button class="${i === currentPage ? 'active' : ''}" onclick="goToPage(${i})">${i}</button>`;
        } else if (i === currentPage - 3 || i === currentPage + 3) {
            html += `<button disabled>...</button>`;
        }
    }

    // Next button
    html += `<button ${currentPage === totalPages ? 'disabled' : ''} onclick="goToPage(${currentPage + 1})">Next</button>`;

    container.innerHTML = html;
}

function goToPage(page) {
    currentPage = page;
    renderOrders();
    window.scrollTo(0, 0);
}

function viewOrder(orderId) {
    const order = allOrders.find(o => o.id === orderId);
    if (!order) return;

    const modal = document.getElementById('orderModal');
    const details = document.getElementById('orderDetails');

    details.innerHTML = `
        <div class="order-detail-grid">
            <div>
                <div class="order-info-section">
                    <h4>Order Information</h4>
                    <div class="order-info-row">
                        <span class="label">Order Number</span>
                        <span>#${order.order_number || order.id.slice(0, 8)}</span>
                    </div>
                    <div class="order-info-row">
                        <span class="label">Date</span>
                        <span>${formatDate(order.created_at)}</span>
                    </div>
                    <div class="order-info-row">
                        <span class="label">Order Status</span>
                        <span class="status-badge status-${order.order_status}">${order.order_status}</span>
                    </div>
                    <div class="order-info-row">
                        <span class="label">Payment Status</span>
                        <span class="status-badge status-${order.payment_status}">${order.payment_status}</span>
                    </div>
                    <div class="order-info-row">
                        <span class="label">Payment Method</span>
                        <span>${order.payment_method || 'N/A'}</span>
                    </div>
                </div>

                <div class="order-info-section">
                    <h4>Customer Details</h4>
                    <div class="order-info-row">
                        <span class="label">Name</span>
                        <span>${order.profiles?.full_name || 'N/A'}</span>
                    </div>
                    <div class="order-info-row">
                        <span class="label">Phone</span>
                        <span>${order.profiles?.phone || 'N/A'}</span>
                    </div>
                    <div class="order-info-row">
                        <span class="label">Type</span>
                        <span>${order.profiles?.user_type || 'N/A'}</span>
                    </div>
                    ${order.profiles?.business_name ? `
                    <div class="order-info-row">
                        <span class="label">Business</span>
                        <span>${order.profiles.business_name}</span>
                    </div>
                    ` : ''}
                </div>
            </div>

            <div>
                <div class="order-info-section">
                    <h4>Delivery Address</h4>
                    ${order.addresses ? `
                        <p style="color: var(--text-secondary); line-height: 1.6;">
                            ${order.addresses.address_line1 || ''}<br>
                            ${order.addresses.address_line2 ? order.addresses.address_line2 + '<br>' : ''}
                            ${order.addresses.city || ''}, ${order.addresses.state || ''}<br>
                            ${order.addresses.pincode || ''}
                        </p>
                    ` : '<p style="color: var(--text-muted);">No address available</p>'}
                </div>

                <div class="order-info-section">
                    <h4>Order Items</h4>
                    <div class="order-items-list">
                        ${order.order_items && order.order_items.length > 0 ? order.order_items.map(item => `
                            <div class="order-item">
                                <div>
                                    <div class="order-item-name">${item.product_name}</div>
                                    <div class="order-item-qty">Qty: ${item.quantity} x ${formatCurrency(item.unit_price)}</div>
                                </div>
                                <div class="order-item-price">${formatCurrency(item.total_price)}</div>
                            </div>
                        `).join('') : '<p style="color: var(--text-muted);">No items</p>'}
                    </div>
                </div>

                <div class="order-info-section" style="background: var(--bg-tertiary); padding: 1rem; border-radius: 8px;">
                    <div class="order-info-row" style="border: none;">
                        <span class="label">Subtotal</span>
                        <span>${formatCurrency(order.subtotal || order.total)}</span>
                    </div>
                    ${order.delivery_fee ? `
                    <div class="order-info-row" style="border: none;">
                        <span class="label">Delivery</span>
                        <span>${formatCurrency(order.delivery_fee)}</span>
                    </div>
                    ` : ''}
                    <div class="order-info-row" style="border: none; font-size: 1.25rem; font-weight: 700;">
                        <span>Total</span>
                        <span style="color: var(--gold);">${formatCurrency(order.total)}</span>
                    </div>
                </div>
            </div>
        </div>
    `;

    modal.classList.add('active');
}

function closeModal() {
    document.getElementById('orderModal').classList.remove('active');
}

function editOrderStatus(orderId) {
    const order = allOrders.find(o => o.id === orderId);
    if (!order) return;

    document.getElementById('updateOrderId').value = orderId;
    document.getElementById('updateOrderStatus').value = order.order_status;
    document.getElementById('updatePaymentStatus').value = order.payment_status;

    document.getElementById('statusModal').classList.add('active');
}

function closeStatusModal() {
    document.getElementById('statusModal').classList.remove('active');
}

async function saveOrderStatus() {
    const orderId = document.getElementById('updateOrderId').value;
    const orderStatus = document.getElementById('updateOrderStatus').value;
    const paymentStatus = document.getElementById('updatePaymentStatus').value;

    try {
        await AdminAuth.put('/admin/orders', {
            id: orderId,
            order_status: orderStatus,
            payment_status: paymentStatus
        });

        showToast('Order updated successfully', 'success');
        closeStatusModal();

        // Update local data
        const orderIndex = allOrders.findIndex(o => o.id === orderId);
        if (orderIndex !== -1) {
            allOrders[orderIndex].order_status = orderStatus;
            allOrders[orderIndex].payment_status = paymentStatus;
        }

        filterOrders();
    } catch (error) {
        console.error('Error updating order:', error);
        showToast('Failed to update order', 'error');
    }
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
