/** @type {import('next').NextConfig} */
const nextConfig = {
  // Security Headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Security Headers
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()'
          },
          // HTTPS/HSTS (enable in production)
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload'
          },
          // Content Security Policy - Restrictive
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' cdn.jsdelivr.net cdnjs.cloudflare.com; style-src 'self' 'unsafe-inline' fonts.googleapis.com cdn.jsdelivr.net cdnjs.cloudflare.com; font-src 'self' fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' http://localhost:8000 https://api.example.com; frame-ancestors 'none'; form-action 'self';"
          }
        ]
      }
    ];
  },

  // Environment Variables
  env: {
    NEXT_PUBLIC_REQUEST_TIMEOUT: process.env.NEXT_PUBLIC_REQUEST_TIMEOUT || '30000',
  },

  // Security - Disable powered by header
  poweredByHeader: false,

  // CORS and API routes
  async rewrites() {
    return {
      beforeFiles: [
        // Add CSRF token endpoint proxy if needed
      ]
    };
  }
};

export default nextConfig;
