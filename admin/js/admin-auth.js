/**
 * Admin Authentication Handler
 */

const AdminAuth = {
    SESSION_KEY: 'ge_admin_session',
    API_BASE: '/api',

    // Get stored session
    getSession() {
        const session = localStorage.getItem(this.SESSION_KEY);
        return session ? JSON.parse(session) : null;
    },

    // Save session
    saveSession(data) {
        localStorage.setItem(this.SESSION_KEY, JSON.stringify(data));
    },

    // Clear session
    clearSession() {
        localStorage.removeItem(this.SESSION_KEY);
    },

    // Get auth token
    getToken() {
        const session = this.getSession();
        return session?.access_token || null;
    },

    // Check if logged in
    isLoggedIn() {
        return !!this.getToken();
    },

    // Check if user is admin
    isAdmin() {
        const session = this.getSession();
        return session?.is_admin === true;
    },

    // Get user info
    getUser() {
        const session = this.getSession();
        return session?.user || null;
    },

    // Login
    async login(email, password) {
        try {
            const response = await fetch(`${this.API_BASE}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (!response.ok) {
                return { success: false, error: data.error || 'Login failed' };
            }

            // Check if user is admin
            const profileResponse = await fetch(`${this.API_BASE}/auth/me`, {
                headers: {
                    'Authorization': `Bearer ${data.session.access_token}`
                }
            });

            const profileData = await profileResponse.json();

            if (!profileResponse.ok) {
                return { success: false, error: 'Failed to verify admin status' };
            }

            if (!profileData.user?.is_admin) {
                return { success: false, error: 'Access denied. Admin privileges required.' };
            }

            // Save session with admin flag
            this.saveSession({
                access_token: data.session.access_token,
                refresh_token: data.session.refresh_token,
                user: profileData.user,
                is_admin: true
            });

            return { success: true };
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, error: 'Network error. Please try again.' };
        }
    },

    // Logout
    logout() {
        this.clearSession();
        window.location.href = 'login.html';
    },

    // Get headers for API requests
    getHeaders() {
        const headers = { 'Content-Type': 'application/json' };
        const token = this.getToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        return headers;
    },

    // API request helper
    async request(endpoint, options = {}) {
        const url = `${this.API_BASE}${endpoint}`;
        const config = {
            headers: this.getHeaders(),
            ...options
        };

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (response.status === 401 || response.status === 403) {
                this.logout();
                return null;
            }

            if (!response.ok) {
                throw new Error(data.error || 'Request failed');
            }

            return data;
        } catch (error) {
            console.error(`API Error [${endpoint}]:`, error);
            throw error;
        }
    },

    // GET request
    async get(endpoint) {
        return this.request(endpoint, { method: 'GET' });
    },

    // POST request
    async post(endpoint, data) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    // PUT request
    async put(endpoint, data) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },

    // DELETE request
    async delete(endpoint, data) {
        return this.request(endpoint, {
            method: 'DELETE',
            body: JSON.stringify(data)
        });
    },

    // Check auth on page load
    checkAuth() {
        if (!this.isLoggedIn() || !this.isAdmin()) {
            window.location.href = 'login.html';
            return false;
        }
        return true;
    }
};

// Make available globally
window.AdminAuth = AdminAuth;
