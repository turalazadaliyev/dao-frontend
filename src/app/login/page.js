'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '@/lib/api';

export default function LoginPage() {
    const router = useRouter();
    const [mode, setMode] = useState('login'); // login | register
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        confirmPassword: ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setError('');
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            if (!formData.email || !formData.password) {
                setError('Please fill in all fields');
                setLoading(false);
                return;
            }

            const result = await apiClient.login(formData.email, formData.password);
            router.push('/account');
        } catch (err) {
            setError(err.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            if (!formData.email || !formData.password || !formData.firstName || !formData.lastName) {
                setError('Please fill in all fields');
                setLoading(false);
                return;
            }

            if (formData.password !== formData.confirmPassword) {
                setError('Passwords do not match');
                setLoading(false);
                return;
            }

            if (formData.password.length < 8) {
                setError('Password must be at least 8 characters');
                setLoading(false);
                return;
            }

            const result = await apiClient.register({
                email: formData.email,
                firstName: formData.firstName,
                lastName: formData.lastName,
                password: formData.password,
                walletId: ''
            });

            router.push('/account/setup');
        } catch (err) {
            setError(err.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="section" style={{ paddingTop: '120px', minHeight: '100vh' }}>
            <div className="container">
                <div style={{ maxWidth: '500px', margin: '0 auto' }}>
                    <div className="card" style={{ padding: 'var(--spacing-xl)' }}>
                        <h1 className="section-title" style={{ marginBottom: 'var(--spacing-lg)' }}>
                            {mode === 'login' ? '🔐 Login' : '✍️ Register'}
                        </h1>

                        {error && (
                            <div style={{
                                padding: 'var(--spacing-md)',
                                background: 'rgba(239, 68, 68, 0.1)',
                                border: '1px solid #ef4444',
                                borderRadius: '8px',
                                color: '#dc2626',
                                marginBottom: 'var(--spacing-md)'
                            }}>
                                {error}
                            </div>
                        )}

                        <form onSubmit={mode === 'login' ? handleLogin : handleRegister} style={{ display: 'grid', gap: 'var(--spacing-md)' }}>
                            {mode === 'register' && (
                                <>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>First Name</label>
                                        <input
                                            type="text"
                                            name="firstName"
                                            placeholder="Your first name"
                                            value={formData.firstName}
                                            onChange={handleChange}
                                            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)' }}
                                        />
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Last Name</label>
                                        <input
                                            type="text"
                                            name="lastName"
                                            placeholder="Your last name"
                                            value={formData.lastName}
                                            onChange={handleChange}
                                            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)' }}
                                        />
                                    </div>
                                </>
                            )}

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Email</label>
                                <input
                                    type="email"
                                    name="email"
                                    placeholder="your.email@example.com"
                                    value={formData.email}
                                    onChange={handleChange}
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)' }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Password</label>
                                <input
                                    type="password"
                                    name="password"
                                    placeholder="Enter your password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)' }}
                                />
                                {mode === 'register' && (
                                    <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                                        At least 8 characters
                                    </p>
                                )}
                            </div>

                            {mode === 'register' && (
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Confirm Password</label>
                                    <input
                                        type="password"
                                        name="confirmPassword"
                                        placeholder="Confirm your password"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)' }}
                                    />
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="btn btn-primary"
                                style={{ padding: '0.75rem', marginTop: 'var(--spacing-md)', width: '100%' }}
                            >
                                {loading ? '⏳ Processing...' : (mode === 'login' ? '🔐 Login' : '✍️ Register')}
                            </button>
                        </form>

                        <div style={{ textAlign: 'center', marginTop: 'var(--spacing-lg)' }}>
                            {mode === 'login' ? (
                                <>
                                    <p style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                                        Don't have an account?
                                    </p>
                                    <button
                                        onClick={() => { setMode('register'); setError(''); }}
                                        style={{ background: 'none', border: 'none', color: 'var(--primary-purple)', cursor: 'pointer', textDecoration: 'underline' }}
                                    >
                                        Register here
                                    </button>
                                </>
                            ) : (
                                <>
                                    <p style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                                        Already have an account?
                                    </p>
                                    <button
                                        onClick={() => { setMode('login'); setError(''); }}
                                        style={{ background: 'none', border: 'none', color: 'var(--primary-purple)', cursor: 'pointer', textDecoration: 'underline' }}
                                    >
                                        Login here
                                    </button>
                                </>
                            )}
                        </div>

                        <div style={{ textAlign: 'center', marginTop: 'var(--spacing-lg)' }}>
                            <Link href="/" style={{ color: 'var(--primary-blue)', textDecoration: 'none' }}>
                                ← Back to home
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
