'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';
import { getAuthToken, getUser, isAuthenticated } from '@/lib/auth';

export default function AccountSetupPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [status, setStatus] = useState('collecting'); // collecting | connecting | completed | error
    const [userAddress, setUserAddress] = useState('');
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        walletId: ''
    });
    const [message, setMessage] = useState('');

    useEffect(() => {
        // Check authentication first
        if (!isAuthenticated()) {
            router.push('/login');
            return;
        }

        // Load authenticated user data
        const authenticatedUser = getUser();
        setUser(authenticatedUser);
        
        if (authenticatedUser) {
            setProfile(prev => ({
                ...prev,
                firstName: authenticatedUser.first_name,
                lastName: authenticatedUser.last_name,
                email: authenticatedUser.email
            }));
        }

        setIsLoading(false);
    }, [router]);

    const handleConnectWallet = async () => {
        setStatus('connecting');
        setMessage('Connecting to wallet...');

        if (typeof window === 'undefined' || !window.ethereum) {
            setStatus('error');
            setMessage('No injected wallet detected. Please install MetaMask or use a compatible wallet.');
            return;
        }

        try {
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            if (!accounts || accounts.length === 0) {
                setStatus('error');
                setMessage('No accounts returned from wallet.');
                return;
            }

            const address = accounts[0];
            
            // Register wallet with backend
            try {
                const walletResult = await apiClient.createWallet(address);
                console.log('Wallet created/fetched:', walletResult);
            } catch (walletErr) {
                console.warn('Wallet registration warning:', walletErr.message);
                // Continue even if wallet registration fails
            }

            setUserAddress(address);
            setProfile(prev => ({ ...prev, walletId: address }));
            setStatus('completed');
            setMessage('Wallet connected successfully!');
        } catch (err) {
            setStatus('error');
            setMessage('Failed to connect to wallet.');
            console.error('connectWallet error', err);
        }
    };

    const saveProfileAndFinish = async () => {
        try {
            // Register donor with backend
            const donorData = {
                username: `${profile.firstName}_${profile.lastName}`.toLowerCase().replace(/\s+/g, '_'),
                wallet_id: userAddress
            };

            try {
                const donorResult = await apiClient.registerDonor(donorData);
                console.log('Donor registered:', donorResult);
            } catch (donorErr) {
                console.warn('Donor registration warning:', donorErr.message);
                // Continue even if donor registration fails
            }

            // Save to localStorage
            localStorage.setItem('walletConnected', 'true');
            localStorage.setItem('userAddress', userAddress);
            localStorage.setItem('userProfile', JSON.stringify(profile));
        } catch (e) {
            console.warn('Failed to save profile', e);
        }
        // redirect back to account page
        router.push('/account');
    };

    if (isLoading) {
        return (
            <section className="section" style={{ paddingTop: '120px', minHeight: '70vh' }}>
                <div className="container">
                    <div style={{ textAlign: 'center' }}>
                        <p style={{ color: 'var(--text-secondary)' }}>Loading...</p>
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section className="section" style={{ paddingTop: '120px', minHeight: '70vh' }}>
            <div className="container">
                <h1 className="section-title">Wallet Setup</h1>
                <p className="section-subtitle">Connect your wallet and provide a few details to set up your account.</p>

                <div className="card" style={{ maxWidth: '720px', margin: 'var(--spacing-lg) auto', padding: 'var(--spacing-lg)' }}>
                    {status === 'collecting' && (
                        <div style={{ display: 'grid', gap: 'var(--spacing-md)' }}>
                            <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--spacing-md)' }}>Please provide your personal information and then connect your wallet.</p>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>First Name</label>
                                <input type="text" placeholder="Your first name" value={profile.firstName} onChange={(e) => setProfile({ ...profile, firstName: e.target.value })} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)' }} />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Last Name</label>
                                <input type="text" placeholder="Your last name" value={profile.lastName} onChange={(e) => setProfile({ ...profile, lastName: e.target.value })} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)' }} />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Email</label>
                                <input type="email" placeholder="your.email@example.com" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)' }} />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Password</label>
                                <input type="password" placeholder="Create a strong password" value={profile.password} onChange={(e) => setProfile({ ...profile, password: e.target.value })} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)' }} />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Wallet ID (Optional)</label>
                                <input type="text" placeholder="e.g., 0x742d... or leave blank" value={profile.walletId} onChange={(e) => setProfile({ ...profile, walletId: e.target.value })} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)' }} />
                            </div>

                            <div style={{ display: 'flex', gap: 'var(--spacing-sm)', justifyContent: 'flex-end', marginTop: 'var(--spacing-md)' }}>
                                <button className="btn btn-secondary" onClick={() => router.push('/account')}>Cancel</button>
                                <button className="btn btn-primary" onClick={handleConnectWallet} disabled={!profile.firstName || !profile.lastName || !profile.email || !profile.password}>Connect Wallet</button>
                            </div>
                        </div>
                    )}

                    {status === 'connecting' && (
                        <div style={{ textAlign: 'center' }}>
                            <p>{message}</p>
                        </div>
                    )}

                    {status === 'completed' && (
                        <div style={{ display: 'grid', gap: 'var(--spacing-md)' }}>
                            <div style={{ padding: 'var(--spacing-md)', background: 'var(--glass-bg)', borderRadius: '8px', textAlign: 'center' }}>
                                <p style={{ marginBottom: '0.5rem', fontWeight: 600 }}>✓ {message}</p>
                            </div>

                            <div style={{ display: 'grid', gap: 'var(--spacing-md)' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>First Name</label>
                                    <div style={{ padding: '0.75rem', background: 'var(--glass-bg)', borderRadius: '8px' }}>{profile.firstName}</div>
                                </div>

                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Last Name</label>
                                    <div style={{ padding: '0.75rem', background: 'var(--glass-bg)', borderRadius: '8px' }}>{profile.lastName}</div>
                                </div>

                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Email</label>
                                    <div style={{ padding: '0.75rem', background: 'var(--glass-bg)', borderRadius: '8px' }}>{profile.email}</div>
                                </div>

                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Wallet ID</label>
                                    <div style={{ padding: '0.75rem', background: 'var(--glass-bg)', borderRadius: '8px', fontFamily: 'monospace', fontSize: 'var(--font-size-sm)' }}>{profile.walletId}</div>
                                </div>

                                <div style={{ display: 'flex', gap: 'var(--spacing-sm)', justifyContent: 'flex-end', marginTop: 'var(--spacing-md)' }}>
                                    <button className="btn btn-secondary" onClick={() => router.push('/account')}>Cancel</button>
                                    <button className="btn btn-primary" onClick={saveProfileAndFinish}>Confirm & Continue</button>
                                </div>
                            </div>
                        </div>
                    )}

                    {status === 'error' && (
                        <div>
                            <p style={{ color: 'var(--danger)' }}>{message}</p>
                            <div style={{ marginTop: 'var(--spacing-md)' }}>
                                <button className="btn btn-primary" onClick={handleConnectWallet}>Try again</button>
                                <button className="btn btn-secondary" style={{ marginLeft: 'var(--spacing-sm)' }} onClick={() => router.push('/account')}>Back</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}
