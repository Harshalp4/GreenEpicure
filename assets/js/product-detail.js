/**
 * Product Detail Page JavaScript
 */

document.addEventListener('DOMContentLoaded', () => {
    initProductDetail();
    initMobileMenu();
    initHeader();
});

function initHeader() {
    const header = document.getElementById('header');
    if (!header) return;

    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });
}

function initMobileMenu() {
    const menuToggle = document.getElementById('menuToggle');
    const nav = document.getElementById('nav');

    if (!menuToggle || !nav) return;

    menuToggle.addEventListener('click', () => {
        menuToggle.classList.toggle('active');
        nav.classList.toggle('active');
        document.body.style.overflow = nav.classList.contains('active') ? 'hidden' : '';
    });
}

async function initProductDetail() {
    // Get product ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');

    if (!productId) {
        showProductNotFound();
        return;
    }

    // Try to fetch product from API first
    let product = await fetchProductFromAPI(productId);

    // Fallback to static data if API fails
    if (!product) {
        product = getProductById(productId);
    }

    if (!product) {
        showProductNotFound();
        return;
    }

    // Render product
    renderProductDetail(product);
    renderRelatedProducts(product.category, productId);
    updateBreadcrumb(product.name);
}

async function fetchProductFromAPI(productId) {
    try {
        const response = await fetch('/api/products');
        const data = await response.json();
        if (data.products) {
            const dbProduct = data.products.find(p => p.id === productId);
            if (dbProduct) {
                // Map to expected format
                return {
                    id: dbProduct.id,
                    name: dbProduct.name,
                    category: dbProduct.category,
                    description: dbProduct.description,
                    certifications: Array.isArray(dbProduct.certifications)
                        ? dbProduct.certifications
                        : (dbProduct.certifications ? dbProduct.certifications.split(',').map(s => s.trim()) : ['Organic']),
                    image: dbProduct.image_url || 'assets/images/products/default.jpg',
                    featured: dbProduct.featured,
                    price: dbProduct.display_price || dbProduct.price,
                    unit: dbProduct.unit || 'kg',
                    minOrder: `${dbProduct.moq || 1} ${dbProduct.unit || 'kg'}`,
                    moq: dbProduct.moq || 1,
                    in_stock: dbProduct.in_stock
                };
            }
        }
    } catch (error) {
        console.error('Error fetching product:', error);
    }
    return null;
}

function renderProductDetail(product) {
    const container = document.getElementById('productDetail');
    const moq = product.moq || 1;
    const categoryNames = {
        'dairy': 'A2 Dairy',
        'grains': 'Grains & Staples',
        'oils': 'Oils & Sweeteners'
    };

    container.innerHTML = `
        <!-- Product Gallery -->
        <div class="product-gallery">
            <div class="product-main-image">
                <img src="${product.image}" alt="${product.name}" id="mainImage">
            </div>
        </div>

        <!-- Product Info -->
        <div class="product-info-detail">
            <span class="product-category-tag">${categoryNames[product.category] || product.category}</span>

            <h1 class="product-title">${product.name}</h1>

            <div class="product-rating">
                <div class="stars">
                    <svg viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                    <svg viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                    <svg viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                    <svg viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                    <svg viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                </div>
                <span class="rating-text">4.8 (124 reviews)</span>
            </div>

            <div class="product-price-detail">
                <span class="price-current">₹${product.price.toLocaleString()}</span>
                <span class="price-unit">per ${product.unit}</span>
            </div>

            <p class="product-description">${product.description}</p>

            <!-- Certifications -->
            <div class="product-certifications">
                ${product.certifications.map(cert => `
                    <span class="certification-badge">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                        ${cert}
                    </span>
                `).join('')}
            </div>

            <!-- Product Meta -->
            <div class="product-meta">
                <div class="meta-item">
                    <span class="meta-label">Unit</span>
                    <span class="meta-value">${product.unit}</span>
                </div>
                <div class="meta-item">
                    <span class="meta-label">Minimum Order</span>
                    <span class="meta-value">${product.minOrder}</span>
                </div>
                <div class="meta-item">
                    <span class="meta-label">Category</span>
                    <span class="meta-value">${categoryNames[product.category] || product.category}</span>
                </div>
                <div class="meta-item">
                    <span class="meta-label">Availability</span>
                    <span class="meta-value" style="color: #4ade80;">In Stock</span>
                </div>
            </div>

            <!-- Add to Cart -->
            <div class="add-to-cart-section">
                <div class="quantity-selector-detail">
                    <span class="quantity-label">Quantity:</span>
                    <div class="quantity-controls">
                        <button class="qty-btn-detail" id="qtyMinus" disabled>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M5 12h14"/>
                            </svg>
                        </button>
                        <input type="number" class="qty-input" id="qtyInput" value="${moq}" min="${moq}" data-moq="${moq}" data-price="${product.price}">
                        <button class="qty-btn-detail" id="qtyPlus">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M12 5v14M5 12h14"/>
                            </svg>
                        </button>
                    </div>
                    <span class="item-total" id="itemTotal">₹${(product.price * moq).toLocaleString()}</span>
                </div>
                <button class="add-to-cart-btn-detail" id="addToCartBtn" data-product-id="${product.id}">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z"/>
                    </svg>
                    Add to Cart
                </button>
            </div>

            <!-- Features -->
            <div class="product-features">
                <div class="feature-list">
                    <div class="feature-item">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M5 13l4 4L19 7"/>
                        </svg>
                        <span>100% Organic & Natural</span>
                    </div>
                    <div class="feature-item">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M5 13l4 4L19 7"/>
                        </svg>
                        <span>Farm Fresh Quality</span>
                    </div>
                    <div class="feature-item">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M5 13l4 4L19 7"/>
                        </svg>
                        <span>Free Delivery on Orders Above ₹500</span>
                    </div>
                    <div class="feature-item">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M5 13l4 4L19 7"/>
                        </svg>
                        <span>Secure Payment Options</span>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Setup quantity controls
    setupQuantityControls();

    // Setup add to cart
    setupAddToCart(product);
}

function setupQuantityControls() {
    const qtyInput = document.getElementById('qtyInput');
    const qtyMinus = document.getElementById('qtyMinus');
    const qtyPlus = document.getElementById('qtyPlus');
    const itemTotal = document.getElementById('itemTotal');

    const moq = parseInt(qtyInput.dataset.moq) || 1;
    const price = parseFloat(qtyInput.dataset.price) || 0;

    function updateTotal() {
        const qty = parseInt(qtyInput.value) || moq;
        const total = price * qty;
        itemTotal.textContent = `₹${total.toLocaleString()}`;
        qtyMinus.disabled = qty <= moq;
    }

    qtyMinus.addEventListener('click', () => {
        let qty = parseInt(qtyInput.value) || moq;
        if (qty > moq) {
            qtyInput.value = qty - 1;
            updateTotal();
        }
    });

    qtyPlus.addEventListener('click', () => {
        let qty = parseInt(qtyInput.value) || moq;
        qtyInput.value = qty + 1;
        updateTotal();
    });

    qtyInput.addEventListener('change', () => {
        let qty = parseInt(qtyInput.value) || moq;
        if (qty < moq) qty = moq;
        qtyInput.value = qty;
        updateTotal();
    });
}

function setupAddToCart(product) {
    const addBtn = document.getElementById('addToCartBtn');
    const qtyInput = document.getElementById('qtyInput');

    addBtn.addEventListener('click', async () => {
        const quantity = parseInt(qtyInput.value) || 1;

        addBtn.disabled = true;
        addBtn.innerHTML = `
            <svg class="spinner" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
            </svg>
            Adding...
        `;

        const success = await Cart.add(product.id, quantity);

        if (success) {
            addBtn.innerHTML = `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M5 13l4 4L19 7"/>
                </svg>
                Added to Cart!
            `;

            setTimeout(() => {
                addBtn.disabled = false;
                addBtn.innerHTML = `
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z"/>
                    </svg>
                    Add to Cart
                `;
            }, 2000);
        } else {
            addBtn.disabled = false;
            addBtn.innerHTML = `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z"/>
                </svg>
                Add to Cart
            `;
        }
    });
}

async function renderRelatedProducts(category, excludeId) {
    const container = document.getElementById('relatedProducts');

    // Fetch all products from API
    let allProducts = [];
    try {
        const response = await fetch('/api/products');
        const data = await response.json();
        if (data.products) {
            allProducts = data.products.map(p => ({
                id: p.id,
                name: p.name,
                category: p.category,
                description: p.description,
                certifications: Array.isArray(p.certifications)
                    ? p.certifications
                    : (p.certifications ? p.certifications.split(',').map(s => s.trim()) : ['Organic']),
                image: p.image_url || 'assets/images/products/default.jpg',
                price: p.display_price || p.price,
                unit: p.unit || 'kg',
                minOrder: `${p.moq || 1} ${p.unit || 'kg'}`,
                moq: p.moq || 1
            }));
        }
    } catch (error) {
        console.error('Error fetching related products:', error);
        allProducts = PRODUCTS; // Fallback to static
    }

    let related = allProducts.filter(p => p.category === category && p.id !== excludeId).slice(0, 4);

    if (related.length === 0) {
        // Get random products if no related ones
        const random = allProducts.filter(p => p.id !== excludeId).slice(0, 4);
        related = random;
    }

    container.innerHTML = related.map(product => createProductCard(product)).join('');

    // Animate in
    gsap.fromTo('.product-card',
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.5, stagger: 0.1, ease: 'power3.out' }
    );
}

function createProductCard(product) {
    const badges = product.certifications.slice(0, 2).map(cert =>
        `<span class="product-badge">${cert}</span>`
    ).join('');

    const price = product.price ? `₹${product.price.toLocaleString()}` : '';
    const unit = product.unit || 'unit';
    const moq = product.moq || 1;

    return `
        <a href="product-detail.html?id=${product.id}" class="product-card" data-category="${product.category}" data-product-id="${product.id}">
            <div class="product-image">
                <div class="product-image-inner">
                    <img src="${product.image}" alt="${product.name}" loading="lazy">
                </div>
                <div class="product-overlay"></div>
                <div class="product-badges">${badges}</div>
            </div>
            <div class="product-info">
                <h3 class="product-name">${product.name}</h3>
                <p class="product-desc">${product.description}</p>
                ${price ? `<p class="product-price">${price}<span class="product-unit">/${unit}</span></p>` : ''}
            </div>
            <div class="product-footer">
                <span class="product-min">MOQ: ${product.minOrder}</span>
                <span class="product-link">View Details</span>
            </div>
        </a>
    `;
}

function updateBreadcrumb(productName) {
    const breadcrumb = document.getElementById('breadcrumbProduct');
    if (breadcrumb) {
        breadcrumb.textContent = productName;
    }
    document.title = `${productName} - Green Epicure`;
}

function showProductNotFound() {
    const container = document.getElementById('productDetail');
    container.innerHTML = `
        <div class="product-not-found">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <h2>Product Not Found</h2>
            <p>The product you're looking for doesn't exist or has been removed.</p>
            <a href="products.html" class="btn btn-gold">Browse Products</a>
        </div>
    `;

    // Hide related products section
    const relatedSection = document.querySelector('.related-products-section');
    if (relatedSection) {
        relatedSection.style.display = 'none';
    }
}
