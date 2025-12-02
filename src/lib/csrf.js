// CSRF Token Management
const CSRF_HEADER = 'X-CSRFToken';
const CSRF_COOKIE = 'csrftoken';

/**
 * Get CSRF token from cookies
 */
export const getCSRFToken = () => {
    if (typeof window === 'undefined') return null;
    
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${CSRF_COOKIE}=`);
    if (parts.length === 2) {
        return parts.pop().split(';').shift();
    }
    
    return null;
};

/**
 * Fetch CSRF token from backend
 */
export const fetchCSRFToken = async (backendUrl) => {
    try {
        const response = await fetch(`${backendUrl}/csrf-token/`, {
            method: 'GET',
            credentials: 'include'
        });
        
        if (!response.ok) {
            console.warn('Failed to fetch CSRF token from backend');
            return null;
        }
        
        const data = await response.json();
        return data.csrfToken || getCSRFToken();
    } catch (error) {
        console.warn('CSRF token fetch error:', error);
        return getCSRFToken();
    }
};

/**
 * Add CSRF token to fetch headers if available
 */
export const addCSRFHeader = (headers = {}) => {
    const csrfToken = getCSRFToken();
    if (csrfToken) {
        return {
            ...headers,
            [CSRF_HEADER]: csrfToken
        };
    }
    return headers;
};

/**
 * Validate CSRF token before state-changing requests
 */
export const validateCSRF = async (method, backendUrl) => {
    // Only validate for state-changing requests
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
        return true;
    }
    
    let csrfToken = getCSRFToken();
    
    // If no CSRF token, try to fetch it
    if (!csrfToken) {
        csrfToken = await fetchCSRFToken(backendUrl);
    }
    
    return !!csrfToken;
};

export default {
    getCSRFToken,
    fetchCSRFToken,
    addCSRFHeader,
    validateCSRF
};
