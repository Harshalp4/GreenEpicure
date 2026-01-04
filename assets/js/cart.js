/**
 * Green Epicure Cart Module
 * Handles shopping cart functionality with guest cart support
 */

const Cart = {
  GUEST_CART_KEY: 'ge_guest_cart',
  items: [],
  subtotal: 0,
  itemCount: 0,
  isLoading: false,

  // Initialize cart
  async init() {
    if (Auth.isLoggedIn()) {
      await this.load();
    } else {
      this.loadGuestCart();
    }
    this.updateCartIcon();
    this.setupEventListeners();
  },

  // Get guest cart from localStorage
  getGuestCart() {
    const cart = localStorage.getItem(this.GUEST_CART_KEY);
    try {
      return cart ? JSON.parse(cart) : [];
    } catch {
      return [];
    }
  },

  // Save guest cart to localStorage
  saveGuestCart(items) {
    localStorage.setItem(this.GUEST_CART_KEY, JSON.stringify(items));
  },

  // Clear guest cart
  clearGuestCart() {
    localStorage.removeItem(this.GUEST_CART_KEY);
  },

  // Load guest cart into state
  loadGuestCart() {
    const guestItems = this.getGuestCart();
    this.items = guestItems;
    this.itemCount = guestItems.reduce((sum, item) => sum + item.quantity, 0);
    this.subtotal = guestItems.reduce((sum, item) => {
      const price = item.product?.price || 0;
      return sum + (price * item.quantity);
    }, 0);
    this.renderCart();
  },

  // Load cart from server
  async load() {
    if (!Auth.isLoggedIn()) {
      this.loadGuestCart();
      return;
    }

    try {
      this.isLoading = true;
      const response = await API.get('/cart');
      this.items = response.items || [];
      this.subtotal = response.subtotal || 0;
      this.itemCount = response.item_count || 0;
      this.updateCartIcon();
      this.renderCart();
    } catch (error) {
      console.error('Failed to load cart:', error);
    } finally {
      this.isLoading = false;
    }
  },

  // Add item to cart (works for both guest and logged-in users)
  async add(productId, quantity = 1) {
    console.log('Cart.add called:', { productId, quantity, isLoggedIn: Auth.isLoggedIn() });

    if (Auth.isLoggedIn()) {
      // Server-side cart for logged-in users
      try {
        this.showLoading();
        await API.post('/cart', { product_id: productId, quantity });
        await this.load();
        this.showNotification('Added to cart');
        return true;
      } catch (error) {
        this.showNotification(error.message, 'error');
        return false;
      } finally {
        this.hideLoading();
      }
    } else {
      // Guest cart - store in localStorage
      console.log('Guest cart mode');
      const guestCart = this.getGuestCart();
      const existingItem = guestCart.find(item => item.product_id === productId);

      if (existingItem) {
        existingItem.quantity += quantity;
      } else {
        // Try to get product from dynamic products (API) first, then fall back to static
        console.log('Looking for product:', productId);

        // Check window.PRODUCTS (populated by API fetch in main.js)
        let product = null;
        if (window.PRODUCTS && Array.isArray(window.PRODUCTS)) {
          product = window.PRODUCTS.find(p => p.id === productId);
        }

        // Fallback to static getProductById if not found
        if (!product && typeof getProductById === 'function') {
          product = getProductById(productId);
        }

        console.log('Product found:', product);

        if (!product) {
          // If still not found, try to fetch from API
          try {
            const response = await fetch('/api/products');
            const data = await response.json();
            if (data.products) {
              product = data.products.find(p => p.id === productId);
              if (product) {
                // Normalize the product format
                product = {
                  id: product.id,
                  name: product.name,
                  price: product.display_price || product.price,
                  unit: product.unit || 'kg',
                  moq: 1,
                  image: product.image_url
                };
              }
            }
          } catch (err) {
            console.error('Failed to fetch product:', err);
          }
        }

        if (!product) {
          this.showNotification('Product not found', 'error');
          return false;
        }

        guestCart.push({
          id: 'guest_' + Date.now(), // Temporary ID for guest items
          product_id: productId,
          quantity: quantity,
          product: {
            id: productId,
            name: product.name,
            price: product.price,
            display_price: product.price,
            unit: product.unit || 'kg',
            moq: 1,
            image_url: product.image_url || product.image
          }
        });
      }

      this.saveGuestCart(guestCart);
      this.loadGuestCart();
      this.updateCartIcon();
      this.showNotification('Added to cart');
      return true;
    }
  },

  // Update item quantity
  async update(itemId, quantity) {
    if (Auth.isLoggedIn()) {
      // Server-side update
      try {
        this.showLoading();
        await API.put(`/cart/${itemId}`, { quantity });
        await this.load();
      } catch (error) {
        this.showNotification(error.message, 'error');
      } finally {
        this.hideLoading();
      }
    } else {
      // Guest cart update
      const guestCart = this.getGuestCart();
      const itemIndex = guestCart.findIndex(item => item.id === itemId);

      if (itemIndex !== -1) {
        const item = guestCart[itemIndex];
        const minQty = item.product?.moq || 1;

        if (quantity < minQty) {
          // Remove item if below MOQ
          guestCart.splice(itemIndex, 1);
          this.showNotification('Removed from cart');
        } else {
          guestCart[itemIndex].quantity = quantity;
        }

        this.saveGuestCart(guestCart);
        this.loadGuestCart();
        this.updateCartIcon();
      }
    }
  },

  // Remove item from cart
  async remove(itemId) {
    if (Auth.isLoggedIn()) {
      // Server-side remove
      try {
        this.showLoading();
        await API.delete(`/cart/${itemId}`);
        await this.load();
        this.showNotification('Removed from cart');
      } catch (error) {
        this.showNotification(error.message, 'error');
      } finally {
        this.hideLoading();
      }
    } else {
      // Guest cart remove
      const guestCart = this.getGuestCart();
      const filteredCart = guestCart.filter(item => item.id !== itemId);
      this.saveGuestCart(filteredCart);
      this.loadGuestCart();
      this.updateCartIcon();
      this.showNotification('Removed from cart');
    }
  },

  // Migrate guest cart to server after login
  async migrateGuestCart() {
    const guestCart = this.getGuestCart();
    if (guestCart.length === 0) return;

    try {
      // Add each guest item to server cart (quantities will be added together)
      for (const item of guestCart) {
        try {
          await API.post('/cart', {
            product_id: item.product_id,
            quantity: item.quantity
          });
        } catch (err) {
          console.error('Failed to migrate item:', item.product_id, err);
        }
      }

      this.clearGuestCart();
      await this.load(); // Reload from server
    } catch (error) {
      console.error('Failed to migrate guest cart:', error);
    }
  },

  // Update cart icon count
  updateCartIcon() {
    const cartCount = document.querySelector('.cart-count');
    if (cartCount) {
      cartCount.textContent = this.itemCount;
      cartCount.style.display = this.itemCount > 0 ? 'flex' : 'none';
    }
  },

  // Render cart items (for cart page)
  renderCart() {
    const cartContainer = document.getElementById('cartItems');
    if (!cartContainer) return;

    if (this.items.length === 0) {
      cartContainer.innerHTML = `
        <div class="empty-cart">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z"/>
          </svg>
          <h3>Your cart is empty</h3>
          <p>Add some organic goodness to your cart</p>
          <a href="/products.html" class="btn btn-gold">Browse Products</a>
        </div>
      `;
      return;
    }

    const isGuest = !Auth.isLoggedIn();

    cartContainer.innerHTML = this.items.map(item => {
      const product = item.product || {};
      const price = product.display_price || product.price || 0;
      const unit = product.unit || 'unit';
      const moq = product.moq || 1;
      const itemTotal = isGuest ? (price * item.quantity) : (item.item_total || price * item.quantity);
      const imageUrl = product.image_url || product.image || '/assets/images/placeholder.jpg';

      return `
        <div class="cart-item" data-id="${item.id}">
          <div class="cart-item-image">
            <img src="${imageUrl}" alt="${product.name}">
          </div>
          <div class="cart-item-details">
            <h4 class="cart-item-name">${product.name}</h4>
            <p class="cart-item-meta">${unit} | MOQ: ${moq}</p>
            <p class="cart-item-price">₹${price.toLocaleString()}/${unit}</p>
          </div>
          <div class="cart-item-quantity">
            <button class="qty-btn minus" onclick="Cart.update('${item.id}', ${item.quantity - 1})" ${item.quantity <= moq ? 'disabled' : ''}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14"/></svg>
            </button>
            <span class="qty-value">${item.quantity}</span>
            <button class="qty-btn plus" onclick="Cart.update('${item.id}', ${item.quantity + 1})">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
            </button>
          </div>
          <div class="cart-item-total">
            <span>₹${itemTotal.toLocaleString()}</span>
          </div>
          <button class="cart-item-remove" onclick="Cart.remove('${item.id}')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
      `;
    }).join('');

    // Update summary
    this.renderSummary();
  },

  // Render cart summary
  renderSummary() {
    const summaryContainer = document.getElementById('cartSummary');
    if (!summaryContainer) return;

    const deliveryFee = this.subtotal >= 500 ? 0 : 50;
    const total = this.subtotal + deliveryFee;
    const isGuest = !Auth.isLoggedIn();

    summaryContainer.innerHTML = `
      <div class="summary-row">
        <span>Subtotal (${this.itemCount} items)</span>
        <span>₹${this.subtotal.toLocaleString()}</span>
      </div>
      <div class="summary-row">
        <span>Delivery</span>
        <span>${deliveryFee === 0 ? '<span class="free">FREE</span>' : `₹${deliveryFee}`}</span>
      </div>
      ${this.subtotal < 500 && this.subtotal > 0 ? `
        <div class="summary-note">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <span>Add ₹${500 - this.subtotal} more for free delivery</span>
        </div>
      ` : ''}
      <div class="summary-total">
        <span>Total</span>
        <span>₹${total.toLocaleString()}</span>
      </div>
      ${isGuest ? `
        <a href="/checkout.html" class="btn btn-gold btn-block">
          Login to Checkout
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </a>
        <p class="guest-note">You'll be able to login or create an account at checkout</p>
      ` : `
        <a href="/checkout.html" class="btn btn-gold btn-block">
          Proceed to Checkout
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </a>
      `}
    `;
  },

  // Setup event listeners
  setupEventListeners() {
    // Add to cart buttons on product cards
    document.addEventListener('click', (e) => {
      const addBtn = e.target.closest('.add-to-cart-btn');
      if (addBtn) {
        e.preventDefault();
        const productId = addBtn.dataset.productId;
        // Get quantity from the qty-selector
        const card = addBtn.closest('.product-card') || addBtn.closest('.product-cart-controls');
        const qtyValue = card?.querySelector('.qty-value');
        const quantity = qtyValue ? parseInt(qtyValue.textContent) : (parseInt(addBtn.dataset.moq) || 1);
        this.add(productId, quantity);
      }

      // Quantity selector buttons
      const qtyBtn = e.target.closest('.qty-btn-sm');
      if (qtyBtn) {
        e.preventDefault();
        const selector = qtyBtn.closest('.qty-selector');
        const qtyValue = selector.querySelector('.qty-value');
        const moq = parseInt(selector.dataset.moq) || 1;
        let currentQty = parseInt(qtyValue.textContent) || moq;

        if (qtyBtn.classList.contains('plus')) {
          currentQty++;
        } else if (qtyBtn.classList.contains('minus') && currentQty > moq) {
          currentQty--;
        }

        qtyValue.textContent = currentQty;

        // Update minus button disabled state
        const minusBtn = selector.querySelector('.minus');
        minusBtn.disabled = currentQty <= moq;
      }
    });
  },

  // Show loading state
  showLoading() {
    const overlay = document.querySelector('.cart-loading');
    if (overlay) overlay.style.display = 'flex';
  },

  // Hide loading state
  hideLoading() {
    const overlay = document.querySelector('.cart-loading');
    if (overlay) overlay.style.display = 'none';
  },

  // Show notification
  showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `cart-notification ${type}`;
    notification.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        ${type === 'success'
          ? '<path d="M5 13l4 4L19 7"/>'
          : '<path d="M6 18L18 6M6 6l12 12"/>'}
      </svg>
      <span>${message}</span>
    `;
    document.body.appendChild(notification);

    setTimeout(() => notification.classList.add('show'), 10);
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }
};

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => Cart.init());

// Make available globally
window.Cart = Cart;
