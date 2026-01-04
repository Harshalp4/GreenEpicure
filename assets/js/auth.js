/**
 * Green Epicure Authentication Module
 * Handles user login, registration, and session management
 */

const Auth = {
  // Storage keys
  SESSION_KEY: 'ge_session',
  USER_KEY: 'ge_user',

  // Initialize auth state
  init() {
    this.updateUI();
    this.checkTokenExpiry();
  },

  // Check if user is logged in
  isLoggedIn() {
    return !!this.getSession();
  },

  // Get current session
  getSession() {
    const session = localStorage.getItem(this.SESSION_KEY);
    if (session) {
      try {
        return JSON.parse(session);
      } catch {
        return null;
      }
    }
    return null;
  },

  // Get current user
  getUser() {
    const user = localStorage.getItem(this.USER_KEY);
    if (user) {
      try {
        return JSON.parse(user);
      } catch {
        return null;
      }
    }
    return null;
  },

  // Save session and user data
  saveAuth(session, user) {
    localStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    this.updateUI();
  },

  // Clear auth data
  clearAuth() {
    localStorage.removeItem(this.SESSION_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.updateUI();
  },

  // Check token expiry
  checkTokenExpiry() {
    const session = this.getSession();
    if (session && session.expires_at) {
      const expiresAt = new Date(session.expires_at * 1000);
      if (expiresAt < new Date()) {
        this.clearAuth();
        return false;
      }
    }
    return true;
  },

  // Login
  async login(email, password) {
    try {
      const response = await API.post('/auth/login', { email, password });
      this.saveAuth(response.session, response.user);

      // Migrate guest cart to server after login
      if (typeof Cart !== 'undefined' && Cart.migrateGuestCart) {
        await Cart.migrateGuestCart();
      }

      return { success: true, user: response.user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Register
  async register(data) {
    try {
      const response = await API.post('/auth/register', data);
      if (response.session) {
        this.saveAuth(response.session, response.user);

        // Migrate guest cart to server after registration
        if (typeof Cart !== 'undefined' && Cart.migrateGuestCart) {
          await Cart.migrateGuestCart();
        }
      }
      return { success: true, user: response.user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Logout
  logout() {
    this.clearAuth();
    window.location.href = '/';
  },

  // Get user profile
  async getProfile() {
    try {
      const response = await API.get('/auth/me');
      localStorage.setItem(this.USER_KEY, JSON.stringify(response.user));
      return response.user;
    } catch (error) {
      console.error('Failed to get profile:', error);
      return null;
    }
  },

  // Update UI based on auth state
  updateUI() {
    const isLoggedIn = this.isLoggedIn();
    const user = this.getUser();

    // Update header auth links
    const authLinks = document.querySelector('.header-auth');
    if (authLinks) {
      if (isLoggedIn && user) {
        authLinks.innerHTML = `
          <a href="/orders.html" class="nav-link">My Orders</a>
          <div class="user-dropdown">
            <button class="user-btn">
              <span class="user-initial">${user.full_name ? user.full_name[0].toUpperCase() : 'U'}</span>
              <span class="user-name">${user.full_name || 'User'}</span>
            </button>
            <div class="user-menu">
              <a href="/orders.html">My Orders</a>
              <a href="/profile.html">Profile</a>
              <button onclick="Auth.logout()">Logout</button>
            </div>
          </div>
        `;
      } else {
        authLinks.innerHTML = `
          <a href="/login.html" class="btn btn-outline btn-sm">Login</a>
        `;
      }
    }

    // Cart icon is always visible (redirects to login if not logged in)
    const cartIcon = document.querySelector('.cart-icon');
    if (cartIcon) {
      cartIcon.style.display = 'flex';
    }
  },

  // Require auth - redirect to login if not authenticated
  requireAuth() {
    if (!this.isLoggedIn()) {
      const returnUrl = encodeURIComponent(window.location.pathname + window.location.search);
      window.location.href = `/login.html?redirect=${returnUrl}`;
      return false;
    }
    return true;
  }
};

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => Auth.init());

// Make available globally
window.Auth = Auth;
