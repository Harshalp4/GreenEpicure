/**
 * Products Management JavaScript
 */

let allProducts = [];
let filteredProducts = [];

document.addEventListener('DOMContentLoaded', () => {
    if (!AdminAuth.checkAuth()) return;
    updateAdminInfo();
    loadProducts();
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

async function loadProducts() {
    try {
        const data = await AdminAuth.get('/admin/products');
        if (data) {
            allProducts = data.products || [];
            filteredProducts = [...allProducts];
            renderProducts();
        }
    } catch (error) {
        console.error('Error loading products:', error);
        showToast('Failed to load products', 'error');
    }
}

function filterProducts() {
    const categoryFilter = document.getElementById('categoryFilter').value;
    const stockFilter = document.getElementById('stockFilter').value;
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();

    filteredProducts = allProducts.filter(product => {
        const matchesCategory = !categoryFilter || product.category === categoryFilter;
        const matchesStock = stockFilter === '' || product.in_stock.toString() === stockFilter;
        const matchesSearch = !searchTerm ||
            product.name.toLowerCase().includes(searchTerm) ||
            (product.description && product.description.toLowerCase().includes(searchTerm));

        return matchesCategory && matchesStock && matchesSearch;
    });

    renderProducts();
}

function renderProducts() {
    const container = document.getElementById('productsGrid');

    if (filteredProducts.length === 0) {
        container.innerHTML = `
            <div class="empty-state" style="grid-column: 1/-1;">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/>
                    <line x1="7" y1="7" x2="7.01" y2="7"/>
                </svg>
                <h3>No products found</h3>
                <p>Try adjusting your filters or add a new product.</p>
                <button class="btn btn-primary" onclick="openAddModal()">Add Product</button>
            </div>
        `;
        return;
    }

    const categoryNames = {
        'dairy': 'A2 Dairy',
        'grains': 'Grains & Staples',
        'oils': 'Oils & Sweeteners'
    };

    container.innerHTML = filteredProducts.map(product => `
        <div class="product-card-admin">
            <div class="product-image">
                ${product.image_url
                    ? `<img src="${product.image_url}" alt="${product.name}">`
                    : `<div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: var(--text-muted);">No Image</div>`
                }
                <span class="stock-badge ${product.in_stock ? 'in-stock' : 'out-of-stock'}">
                    ${product.in_stock ? 'In Stock' : 'Out of Stock'}
                </span>
            </div>
            <div class="product-info">
                <div class="product-category">${categoryNames[product.category] || product.category}</div>
                <div class="product-name">${product.name}</div>
                <div class="product-price">
                    ₹${product.price.toLocaleString()}
                    <span>/${product.unit}</span>
                </div>
            </div>
            <div class="product-actions">
                <button class="btn btn-secondary btn-sm" onclick="editProduct('${product.id}')">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 14px; height: 14px;">
                        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                    Edit
                </button>
                <button class="btn btn-danger btn-sm" onclick="deleteProduct('${product.id}', '${product.name}')">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 14px; height: 14px;">
                        <polyline points="3 6 5 6 21 6"/>
                        <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                    </svg>
                    Delete
                </button>
            </div>
        </div>
    `).join('');
}

function openAddModal() {
    document.getElementById('modalTitle').textContent = 'Add Product';
    document.getElementById('productForm').reset();
    document.getElementById('productId').value = '';
    document.getElementById('imageUrl').value = '';
    document.getElementById('productInStock').checked = true;
    document.getElementById('productFeatured').checked = false;

    // Reset image upload
    const imageUpload = document.getElementById('imageUpload');
    imageUpload.classList.remove('has-image');
    imageUpload.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <polyline points="21 15 16 10 5 21"/>
        </svg>
        <p>Click to upload image</p>
    `;

    document.getElementById('productModal').classList.add('active');
}

function editProduct(productId) {
    const product = allProducts.find(p => p.id === productId);
    if (!product) return;

    document.getElementById('modalTitle').textContent = 'Edit Product';
    document.getElementById('productId').value = product.id;
    document.getElementById('productName').value = product.name;
    document.getElementById('productCategory').value = product.category;
    document.getElementById('productDescription').value = product.description || '';
    document.getElementById('productPrice').value = product.price;
    document.getElementById('productUnit').value = product.unit;
    document.getElementById('productMoq').value = product.moq || 1;
    document.getElementById('productB2bPrice').value = product.b2b_price || '';
    document.getElementById('productCertifications').value = (product.certifications || []).join(', ');
    document.getElementById('productInStock').checked = product.in_stock;
    document.getElementById('productFeatured').checked = product.featured;
    document.getElementById('imageUrl').value = product.image_url || '';

    // Update image preview
    const imageUpload = document.getElementById('imageUpload');
    if (product.image_url) {
        imageUpload.classList.add('has-image');
        imageUpload.innerHTML = `<img src="${product.image_url}" alt="${product.name}">`;
    } else {
        imageUpload.classList.remove('has-image');
        imageUpload.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21 15 16 10 5 21"/>
            </svg>
            <p>Click to upload image</p>
        `;
    }

    document.getElementById('productModal').classList.add('active');
}

function closeModal() {
    document.getElementById('productModal').classList.remove('active');
}

async function handleImageUpload(input) {
    const file = input.files[0];
    if (!file) return;

    // Show loading
    const imageUpload = document.getElementById('imageUpload');
    imageUpload.innerHTML = `<div class="spinner"></div><p>Uploading...</p>`;

    try {
        // Convert file to base64
        const base64 = await fileToBase64(file);

        // Upload to server
        const response = await AdminAuth.post('/admin/upload', {
            fileName: file.name,
            fileBase64: base64,
            contentType: file.type
        });

        // Update preview
        document.getElementById('imageUrl').value = response.url;
        imageUpload.classList.add('has-image');
        imageUpload.innerHTML = `<img src="${response.url}" alt="Product image">`;
        showToast('Image uploaded successfully', 'success');
    } catch (error) {
        console.error('Upload error:', error);
        showToast('Failed to upload image', 'error');
        imageUpload.classList.remove('has-image');
        imageUpload.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21 15 16 10 5 21"/>
            </svg>
            <p>Click to upload image</p>
        `;
    }
}

function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            // Remove data:image/...;base64, prefix
            const base64 = reader.result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = reject;
    });
}

async function saveProduct() {
    const productId = document.getElementById('productId').value;
    const name = document.getElementById('productName').value.trim();
    const category = document.getElementById('productCategory').value;
    const description = document.getElementById('productDescription').value.trim();
    const price = parseFloat(document.getElementById('productPrice').value);
    const unit = document.getElementById('productUnit').value;
    const moq = parseInt(document.getElementById('productMoq').value) || 1;
    const b2bPrice = document.getElementById('productB2bPrice').value ? parseFloat(document.getElementById('productB2bPrice').value) : null;
    const certificationsText = document.getElementById('productCertifications').value;
    const certifications = certificationsText ? certificationsText.split(',').map(c => c.trim()).filter(c => c) : [];
    const inStock = document.getElementById('productInStock').checked;
    const featured = document.getElementById('productFeatured').checked;
    const imageUrl = document.getElementById('imageUrl').value;

    if (!name || !category || !price) {
        showToast('Please fill in required fields', 'error');
        return;
    }

    const productData = {
        name,
        category,
        description,
        price,
        unit,
        moq,
        b2b_price: b2bPrice,
        certifications,
        in_stock: inStock,
        featured,
        image_url: imageUrl
    };

    try {
        if (productId) {
            // Update existing product
            productData.id = productId;
            await AdminAuth.put('/admin/products', productData);
            showToast('Product updated successfully', 'success');
        } else {
            // Create new product
            await AdminAuth.post('/admin/products', productData);
            showToast('Product created successfully', 'success');
        }

        closeModal();
        loadProducts();
    } catch (error) {
        console.error('Error saving product:', error);
        showToast('Failed to save product', 'error');
    }
}

function deleteProduct(productId, productName) {
    document.getElementById('deleteProductId').value = productId;
    document.getElementById('deleteProductName').textContent = productName;
    document.getElementById('deleteModal').classList.add('active');
}

function closeDeleteModal() {
    document.getElementById('deleteModal').classList.remove('active');
}

async function confirmDelete() {
    const productId = document.getElementById('deleteProductId').value;

    try {
        await AdminAuth.delete('/admin/products', { id: productId });
        showToast('Product deleted successfully', 'success');
        closeDeleteModal();
        loadProducts();
    } catch (error) {
        console.error('Error deleting product:', error);
        showToast('Failed to delete product', 'error');
    }
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
