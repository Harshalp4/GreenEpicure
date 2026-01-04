/**
 * Dashboard JavaScript
 */

document.addEventListener('DOMContentLoaded', () => {
    // Check authentication
    if (!AdminAuth.checkAuth()) return;

    // Update admin info in sidebar
    updateAdminInfo();

    // Load dashboard data
    loadDashboardStats();
});

function updateAdminInfo() {
    const user = AdminAuth.getUser();
    if (user) {
        const adminName = document.getElementById('adminName');
        const adminAvatar = document.getElementById('adminAvatar');

        if (adminName) {
            adminName.textContent = user.full_name || user.email || 'Admin';
        }
        if (adminAvatar) {
            adminAvatar.textContent = (user.full_name || user.email || 'A').charAt(0).toUpperCase();
        }
    }
}

async function loadDashboardStats() {
    try {
        const data = await AdminAuth.get('/admin/stats');

        if (data) {
            // Update stat cards
            document.getElementById('totalRevenue').textContent = formatCurrency(data.stats.totalRevenue);
            document.getElementById('totalOrders').textContent = data.stats.totalOrders;
            document.getElementById('totalCustomers').textContent = data.stats.totalCustomers;
            document.getElementById('totalProducts').textContent = data.stats.totalProducts;

            // Render orders by status
            renderOrdersByStatus(data.ordersByStatus);

            // Render recent orders
            renderRecentOrders(data.recentOrders);
        }
    } catch (error) {
        console.error('Error loading dashboard stats:', error);
        showToast('Failed to load dashboard data', 'error');
    }
}

function renderOrdersByStatus(statusData) {
    const container = document.getElementById('ordersByStatus');

    const statuses = [
        { key: 'placed', label: 'Placed', class: 'status-placed' },
        { key: 'confirmed', label: 'Confirmed', class: 'status-confirmed' },
        { key: 'processing', label: 'Processing', class: 'status-processing' },
        { key: 'shipped', label: 'Shipped', class: 'status-shipped' },
        { key: 'delivered', label: 'Delivered', class: 'status-delivered' },
        { key: 'cancelled', label: 'Cancelled', class: 'status-cancelled' }
    ];

    let html = '<div style="display: flex; flex-direction: column; gap: 0.75rem;">';

    statuses.forEach(status => {
        const count = statusData[status.key] || 0;
        html += `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; background: var(--bg-tertiary); border-radius: 8px;">
                <span class="status-badge ${status.class}">${status.label}</span>
                <span style="font-weight: 600; font-size: 1.25rem;">${count}</span>
            </div>
        `;
    });

    html += '</div>';
    container.innerHTML = html;
}

function renderRecentOrders(orders) {
    const container = document.getElementById('recentOrders');

    if (!orders || orders.length === 0) {
        container.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; padding: 2rem; color: var(--text-muted);">
                    No orders yet
                </td>
            </tr>
        `;
        return;
    }

    container.innerHTML = orders.map(order => `
        <tr>
            <td>
                <strong>#${order.order_number || order.id.slice(0, 8)}</strong>
            </td>
            <td>${order.profiles?.full_name || 'N/A'}</td>
            <td>${formatCurrency(order.total)}</td>
            <td>
                <span class="status-badge status-${order.order_status}">${order.order_status}</span>
            </td>
            <td>${formatDate(order.created_at)}</td>
        </tr>
    `).join('');
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

// Make functions globally available
window.showToast = showToast;
window.formatCurrency = formatCurrency;
window.formatDate = formatDate;
