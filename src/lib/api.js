// API Client for Doncoin Backend
// Configure the backend base URL here
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000/api';

// Helper to get token from localStorage
const getToken = () => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('access_token');
};

// Helper to make authenticated requests
const authFetch = async (url, options = {}) => {
    const token = getToken();
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };
    
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(url, { ...options, headers });
    
    // Handle 401 - token expired
    if (response.status === 401 && token) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        if (typeof window !== 'undefined') {
            window.location.href = '/login';
        }
    }
    
    return response;
};

export const apiClient = {
    // ==================== AUTH ====================
    
    async register(userData) {
        try {
            const response = await fetch(`${BACKEND_URL}/auth/register/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: userData.email,
                    first_name: userData.firstName,
                    last_name: userData.lastName,
                    password: userData.password,
                    password_confirm: userData.password,
                    wallet_address: userData.walletId
                })
            });
            if (!response.ok) throw new Error('Registration failed');
            const data = await response.json();
            
            // Store tokens
            localStorage.setItem('access_token', data.access);
            localStorage.setItem('refresh_token', data.refresh);
            localStorage.setItem('user', JSON.stringify(data.user));
            
            return data;
        } catch (err) {
            console.error('register error:', err);
            throw err;
        }
    },

    async login(email, password) {
        try {
            const response = await fetch(`${BACKEND_URL}/auth/login/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            if (!response.ok) throw new Error('Login failed');
            const data = await response.json();
            
            // Store tokens
            localStorage.setItem('access_token', data.access);
            localStorage.setItem('refresh_token', data.refresh);
            localStorage.setItem('user', JSON.stringify(data.user));
            
            return data;
        } catch (err) {
            console.error('login error:', err);
            throw err;
        }
    },

    async getProfile() {
        try {
            const response = await authFetch(`${BACKEND_URL}/auth/profile/`);
            if (!response.ok) throw new Error('Failed to fetch profile');
            return await response.json();
        } catch (err) {
            console.error('getProfile error:', err);
            throw err;
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
            const response = await authFetch(`${BACKEND_URL}/wallets/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ address })
            });
            if (!response.ok) throw new Error('Failed to create wallet');
            return await response.json();
        } catch (err) {
            console.error('createWallet error:', err);
            throw err;
        }
    },

    async getWallet(address) {
        try {
            const response = await authFetch(`${BACKEND_URL}/wallets/?address=${address}`);
            if (!response.ok) throw new Error('Failed to fetch wallet');
            const data = await response.json();
            return data.results && data.results.length > 0 ? data.results[0] : null;
        } catch (err) {
            console.error('getWallet error:', err);
            throw err;
        }
    },

    // ==================== DONOR ====================
    
    async registerDonor(donorData) {
        try {
            const response = await authFetch(`${BACKEND_URL}/donors/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(donorData)
            });
            if (!response.ok) throw new Error('Failed to register donor');
            return await response.json();
        } catch (err) {
            console.error('registerDonor error:', err);
            throw err;
        }
    },

    async getDonor(username) {
        try {
            const response = await authFetch(`${BACKEND_URL}/donors/?username=${username}`);
            if (!response.ok) throw new Error('Failed to fetch donor');
            const data = await response.json();
            return data.results && data.results.length > 0 ? data.results[0] : null;
        } catch (err) {
            console.error('getDonor error:', err);
            throw err;
        }
    },

    async getTopDonors() {
        try {
            const response = await authFetch(`${BACKEND_URL}/donors/top_donors/`);
            if (!response.ok) throw new Error('Failed to fetch top donors');
            return await response.json();
        } catch (err) {
            console.error('getTopDonors error:', err);
            throw err;
        }
    },

    // ==================== PROPOSALS & DONATIONS ====================
    
    async getProposals() {
        try {
            const response = await authFetch(`${BACKEND_URL}/proposals/?limit=100`);
            if (!response.ok) throw new Error('Failed to fetch proposals');
            const data = await response.json();
            return data.results || data;
        } catch (err) {
            console.error('getProposals error:', err);
            throw err;
        }
    },

    async getRounds() {
        try {
            const response = await authFetch(`${BACKEND_URL}/rounds/?limit=100`);
            if (!response.ok) throw new Error('Failed to fetch rounds');
            const data = await response.json();
            return data.results || data;
        } catch (err) {
            console.error('getRounds error:', err);
            throw err;
        }
    },

    async createDonation(donationData) {
        try {
            const response = await authFetch(`${BACKEND_URL}/donations/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(donationData)
            });
            if (!response.ok) throw new Error('Failed to create donation');
            return await response.json();
        } catch (err) {
            console.error('createDonation error:', err);
            throw err;
        }
    }
};
