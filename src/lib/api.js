// API Client for Doncoin Backend
// Configure the backend base URL here
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000/api';

// Request timeout configuration (milliseconds)
const REQUEST_TIMEOUT = 30000;

// Helper to get token from localStorage
const getToken = () => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('access_token');
};

// Helper to get refresh token from localStorage or cookies
const getRefreshToken = () => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('refresh_token') || getCookie('refresh_token');
};

// Helper to get cookie value
const getCookie = (name) => {
    if (typeof window === 'undefined') return null;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
};

// Token refresh function
const refreshAccessToken = async () => {
    try {
        const refreshToken = getRefreshToken();
        if (!refreshToken) {
            throw new Error('No refresh token available');
        }

        const response = await fetch(`${BACKEND_URL}/auth/refresh/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ refresh: refreshToken })
        });

        if (!response.ok) {
            throw new Error('Token refresh failed');
        }

        const data = await response.json();
        
        // Update tokens
        localStorage.setItem('access_token', data.access);
        if (data.refresh) {
            localStorage.setItem('refresh_token', data.refresh);
        }

        return data.access;
    } catch (error) {
        console.error('Token refresh error:', error);
        // Clear invalid tokens and redirect to login
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        if (typeof window !== 'undefined') {
            window.location.href = '/login';
        }
        throw error;
    }
};

// Helper to make authenticated requests with timeout and retry logic
const authFetch = async (url, options = {}, retryCount = 0) => {
    const maxRetries = 1;
    const token = getToken();
    const headers = {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        ...options.headers,
    };
    
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    try {
        // Add timeout to fetch request
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

        const response = await fetch(url, { 
            ...options, 
            headers,
            credentials: 'include',
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        // Handle token expiration with refresh attempt
        if (response.status === 401 && token && retryCount < maxRetries) {
            try {
                const newToken = await refreshAccessToken();
                // Retry request with new token
                headers['Authorization'] = `Bearer ${newToken}`;
                return authFetch(url, { ...options, headers }, retryCount + 1);
            } catch (refreshError) {
                return response;
            }
        }

        return response;
    } catch (error) {
        if (error.name === 'AbortError') {
            throw new Error('Request timeout - please check your connection and try again');
        }
        throw error;
    }
};

export const apiClient = {
    // ==================== AUTH ====================
    
    async register(userData) {
        try {
            // Input validation
            if (!userData.email || !userData.password || !userData.firstName || !userData.lastName) {
                throw new Error('Missing required fields');
            }
            
            const response = await fetch(`${BACKEND_URL}/auth/register/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    email: userData.email,
                    first_name: userData.firstName,
                    last_name: userData.lastName,
                    password: userData.password,
                    password_confirm: userData.password,
                    wallet_address: userData.walletId
                })
            });
            
            // Handle different error responses
            if (!response.ok) {
                const error = await this._handleErrorResponse(response);
                throw new Error(error);
            }
            
            const data = await response.json();
            
            // Validate response structure
            if (!data.access || !data.refresh || !data.user) {
                throw new Error('Invalid response format from server');
            }
            
            // Store tokens
            localStorage.setItem('access_token', data.access);
            localStorage.setItem('refresh_token', data.refresh);
            localStorage.setItem('user', JSON.stringify(data.user));
            
            return data;
        } catch (err) {
            console.error('register error:', err);
            throw new Error(err.message || 'Registration failed');
        }
    },

    async login(email, password) {
        try {
            // Input validation
            if (!email || !password) {
                throw new Error('Email and password are required');
            }
            
            const response = await fetch(`${BACKEND_URL}/auth/login/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ email, password })
            });
            
            // Handle rate limiting (429 Too Many Requests)
            if (response.status === 429) {
                throw new Error('Too many login attempts. Please try again later.');
            }
            
            if (!response.ok) {
                const error = await this._handleErrorResponse(response);
                throw new Error(error);
            }
            
            const data = await response.json();
            
            // Validate response structure
            if (!data.access || !data.refresh || !data.user) {
                throw new Error('Invalid response format from server');
            }
            
            // Store tokens
            localStorage.setItem('access_token', data.access);
            localStorage.setItem('refresh_token', data.refresh);
            localStorage.setItem('user', JSON.stringify(data.user));
            
            return data;
        } catch (err) {
            console.error('login error:', err);
            throw new Error(err.message || 'Login failed');
        }
    },

    async getProfile() {
        try {
            const response = await authFetch(`${BACKEND_URL}/auth/profile/`);
            if (!response.ok) {
                const error = await this._handleErrorResponse(response);
                throw new Error(error);
            }
            const data = await response.json();
            
            // Validate response
            if (!data.id) {
                throw new Error('Invalid profile data');
            }
            
            return data;
        } catch (err) {
            console.error('getProfile error:', err);
            throw new Error(err.message || 'Failed to fetch profile');
        }
    },

    logout() {
        if (typeof window !== 'undefined') {
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            localStorage.removeItem('user');
            localStorage.removeItem('userProfile');
            localStorage.removeItem('walletConnected');
            localStorage.removeItem('userAddress');
        }
    },

    // ==================== WALLET ====================
    
    async createWallet(address) {
        try {
            if (!address) {
                throw new Error('Wallet address is required');
            }
            
            const response = await authFetch(`${BACKEND_URL}/wallets/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ address })
            });
            
            if (!response.ok) {
                const error = await this._handleErrorResponse(response);
                throw new Error(error);
            }
            
            const data = await response.json();
            
            // Validate response
            if (!data.id) {
                throw new Error('Invalid wallet response');
            }
            
            return data;
        } catch (err) {
            console.error('createWallet error:', err);
            throw new Error(err.message || 'Failed to create wallet');
        }
    },

    async getWallet(address) {
        try {
            if (!address) {
                throw new Error('Wallet address is required');
            }
            
            const response = await authFetch(`${BACKEND_URL}/wallets/?address=${encodeURIComponent(address)}`);
            
            if (!response.ok) {
                const error = await this._handleErrorResponse(response);
                throw new Error(error);
            }
            
            const data = await response.json();
            
            // Validate response structure
            if (!data.results) {
                throw new Error('Invalid wallet response format');
            }
            
            return data.results && data.results.length > 0 ? data.results[0] : null;
        } catch (err) {
            console.error('getWallet error:', err);
            throw new Error(err.message || 'Failed to fetch wallet');
        }
    },

    // ==================== DONOR ====================
    
    async registerDonor(donorData) {
        try {
            if (!donorData || !donorData.username) {
                throw new Error('Donor username is required');
            }
            
            const response = await authFetch(`${BACKEND_URL}/donors/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(donorData)
            });
            
            if (!response.ok) {
                const error = await this._handleErrorResponse(response);
                throw new Error(error);
            }
            
            const data = await response.json();
            
            // Validate response
            if (!data.id) {
                throw new Error('Invalid donor response');
            }
            
            return data;
        } catch (err) {
            console.error('registerDonor error:', err);
            throw new Error(err.message || 'Failed to register donor');
        }
    },

    async getDonor(username) {
        try {
            if (!username) {
                throw new Error('Username is required');
            }
            
            const response = await authFetch(`${BACKEND_URL}/donors/?username=${encodeURIComponent(username)}`);
            
            if (!response.ok) {
                const error = await this._handleErrorResponse(response);
                throw new Error(error);
            }
            
            const data = await response.json();
            
            // Validate response structure
            if (!data.results) {
                throw new Error('Invalid donor response format');
            }
            
            return data.results && data.results.length > 0 ? data.results[0] : null;
        } catch (err) {
            console.error('getDonor error:', err);
            throw new Error(err.message || 'Failed to fetch donor');
        }
    },

    async getTopDonors() {
        try {
            const response = await authFetch(`${BACKEND_URL}/donors/top_donors/`);
            
            if (!response.ok) {
                const error = await this._handleErrorResponse(response);
                throw new Error(error);
            }
            
            const data = await response.json();
            
            // Validate response is array
            if (!Array.isArray(data) && !data.results) {
                throw new Error('Invalid top donors response format');
            }
            
            return data;
        } catch (err) {
            console.error('getTopDonors error:', err);
            throw new Error(err.message || 'Failed to fetch top donors');
        }
    },

    // ==================== PROPOSALS & DONATIONS ====================
    
    async getProposals() {
        try {
            const response = await authFetch(`${BACKEND_URL}/proposals/?limit=100`);
            
            if (!response.ok) {
                const error = await this._handleErrorResponse(response);
                throw new Error(error);
            }
            
            const data = await response.json();
            
            // Validate response structure
            if (!Array.isArray(data) && !data.results) {
                throw new Error('Invalid proposals response format');
            }
            
            return data.results || data;
        } catch (err) {
            console.error('getProposals error:', err);
            throw new Error(err.message || 'Failed to fetch proposals');
        }
    },

    async getRounds() {
        try {
            const response = await authFetch(`${BACKEND_URL}/rounds/?limit=100`);
            
            if (!response.ok) {
                const error = await this._handleErrorResponse(response);
                throw new Error(error);
            }
            
            const data = await response.json();
            
            // Validate response structure
            if (!Array.isArray(data) && !data.results) {
                throw new Error('Invalid rounds response format');
            }
            
            return data.results || data;
        } catch (err) {
            console.error('getRounds error:', err);
            throw new Error(err.message || 'Failed to fetch rounds');
        }
    },

    async createDonation(donationData) {
        try {
            if (!donationData || !donationData.proposal || !donationData.amount) {
                throw new Error('Proposal and amount are required');
            }
            
            const response = await authFetch(`${BACKEND_URL}/donations/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(donationData)
            });
            
            // Handle rate limiting
            if (response.status === 429) {
                throw new Error('Too many donation requests. Please wait before trying again.');
            }
            
            if (!response.ok) {
                const error = await this._handleErrorResponse(response);
                throw new Error(error);
            }
            
            const data = await response.json();
            
            // Validate response
            if (!data.id) {
                throw new Error('Invalid donation response');
            }
            
            return data;
        } catch (err) {
            console.error('createDonation error:', err);
            throw new Error(err.message || 'Failed to create donation');
        }
    },

    // ==================== ERROR HANDLING ====================
    
    async _handleErrorResponse(response) {
        try {
            const data = await response.json();
            
            // Handle various error formats
            if (data.detail) return data.detail;
            if (data.error) return data.error;
            if (data.message) return data.message;
            
            // Handle field errors
            if (typeof data === 'object') {
                const errors = Object.values(data).flat();
                if (errors.length > 0) {
                    return errors[0];
                }
            }
            
            return `Server error (${response.status})`;
        } catch {
            return `Server error (${response.status}): ${response.statusText}`;
        }
    }
};
