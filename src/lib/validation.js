// Input validation utilities
import DOMPurify from 'isomorphic-dompurify';

/**
 * Validate and sanitize email
 */
export const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

/**
 * Validate password strength
 */
export const validatePasswordStrength = (password) => {
    const checks = {
        length: password.length >= 8,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        numbers: /\d/.test(password),
        special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
    };
    
    const strength = Object.values(checks).filter(Boolean).length;
    
    return {
        isValid: checks.length && checks.uppercase && checks.lowercase && checks.numbers,
        strength: strength, // 0-5
        checks
    };
};

/**
 * Get password strength label
 */
export const getPasswordStrengthLabel = (strength) => {
    switch (strength) {
        case 0:
        case 1:
            return 'Weak';
        case 2:
        case 3:
            return 'Fair';
        case 4:
            return 'Good';
        case 5:
            return 'Strong';
        default:
            return 'Unknown';
    }
};

/**
 * Sanitize text input to prevent XSS
 */
export const sanitizeInput = (input) => {
    if (typeof input !== 'string') return input;
    
    // Remove dangerous HTML tags but allow basic formatting
    return DOMPurify.sanitize(input, {
        ALLOWED_TAGS: [],
        ALLOWED_ATTR: [],
        KEEP_CONTENT: true
    });
};

/**
 * Sanitize HTML content safely
 */
export const sanitizeHTML = (html) => {
    if (typeof html !== 'string') return html;
    
    return DOMPurify.sanitize(html, {
        ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'a', 'ul', 'li', 'ol'],
        ALLOWED_ATTR: ['href', 'target', 'rel'],
        KEEP_CONTENT: true
    });
};

/**
 * Validate URL format
 */
export const validateURL = (url) => {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
};

/**
 * Validate wallet address format (Ethereum)
 */
export const validateEthereumAddress = (address) => {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
};

/**
 * Validate amount (positive number)
 */
export const validateAmount = (amount) => {
    const num = parseFloat(amount);
    return !isNaN(num) && num > 0;
};

/**
 * Sanitize and validate user input
 */
export const validateAndSanitize = (value, type = 'text') => {
    const sanitized = sanitizeInput(value);
    
    switch (type) {
        case 'email':
            return {
                value: sanitized,
                isValid: validateEmail(sanitized)
            };
        case 'password':
            return {
                value: sanitized,
                ...validatePasswordStrength(sanitized)
            };
        case 'url':
            return {
                value: sanitized,
                isValid: validateURL(sanitized)
            };
        case 'address':
            return {
                value: sanitized,
                isValid: validateEthereumAddress(sanitized)
            };
        case 'amount':
            return {
                value: sanitized,
                isValid: validateAmount(sanitized)
            };
        default:
            return {
                value: sanitized,
                isValid: !!sanitized
            };
    }
};

export default {
    validateEmail,
    validatePasswordStrength,
    getPasswordStrengthLabel,
    sanitizeInput,
    sanitizeHTML,
    validateURL,
    validateEthereumAddress,
    validateAmount,
    validateAndSanitize
};
