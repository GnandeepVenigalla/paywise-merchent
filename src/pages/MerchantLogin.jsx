import React, { useState } from 'react';
import { Eye, EyeOff, Mail, Lock, ArrowRight, AlertCircle } from 'lucide-react';
import { useMerchantAuth } from '../context/MerchantAuthContext';
import { useNavigate, Link } from 'react-router-dom';
import GoogleSignInButton from '../components/GoogleSignInButton';

export default function MerchantLogin() {
    const { login } = useMerchantAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const data = await login(email, password);
            if (data.requireOtp) {
                setError('OTP login not yet supported here. Please use email/password.');
                setLoading(false);
                return;
            }
            // Will be redirected by App.jsx routing logic
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.msg || 'Invalid credentials. Check your email and password.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #1a0a00 0%, #3d1a00 50%, #1a0a00 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            fontFamily: "'Inter', sans-serif",
        }}>
            <div style={{ width: '100%', maxWidth: '420px' }}>
                {/* Logo */}
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <div style={{
                        maxWidth: '220px', height: 'auto',
                        margin: '0 auto',
                        filter: 'drop-shadow(0 15px 30px rgba(0,0,0,0.3))',
                    }}>
                        <img src="/Paywise.PNG" alt="Paywise" style={{ width: '100%', height: 'auto', display: 'block' }} />
                    </div>
                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', marginTop: '6px', fontWeight: 500 }}>
                        Sign in to your merchant dashboard
                    </p>
                </div>

                {/* Card */}
                <div style={{
                    background: 'rgba(255,255,255,0.05)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '28px',
                    padding: '36px',
                }}>
                    <form onSubmit={handleSubmit}>
                        {/* Email */}
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', color: 'rgba(255,255,255,0.7)', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>
                                Email Address
                            </label>
                            <div style={{ position: 'relative' }}>
                                <Mail size={18} color="rgba(255,255,255,0.3)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    required
                                    placeholder="your@email.com"
                                    style={{
                                        width: '100%', boxSizing: 'border-box',
                                        background: 'rgba(255,255,255,0.08)',
                                        border: '1.5px solid rgba(255,255,255,0.1)',
                                        borderRadius: '14px',
                                        padding: '14px 16px 14px 44px',
                                        color: 'white',
                                        fontSize: '15px',
                                        outline: 'none',
                                        transition: 'border-color 0.2s',
                                    }}
                                    onFocus={e => e.target.style.borderColor = '#f59e0b'}
                                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div style={{ marginBottom: '28px' }}>
                            <label style={{ display: 'block', color: 'rgba(255,255,255,0.7)', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>
                                Password
                            </label>
                            <div style={{ position: 'relative' }}>
                                <Lock size={18} color="rgba(255,255,255,0.3)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    required
                                    placeholder="Enter your password"
                                    style={{
                                        width: '100%', boxSizing: 'border-box',
                                        background: 'rgba(255,255,255,0.08)',
                                        border: '1.5px solid rgba(255,255,255,0.1)',
                                        borderRadius: '14px',
                                        padding: '14px 44px 14px 44px',
                                        color: 'white',
                                        fontSize: '15px',
                                        outline: 'none',
                                        transition: 'border-color 0.2s',
                                    }}
                                    onFocus={e => e.target.style.borderColor = '#f59e0b'}
                                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                                />
                                <button type="button" onClick={() => setShowPassword(!showPassword)}
                                    style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                                    {showPassword ? <EyeOff size={18} color="rgba(255,255,255,0.4)" /> : <Eye size={18} color="rgba(255,255,255,0.4)" />}
                                </button>
                            </div>
                        </div>

                        {error && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '12px', padding: '12px 16px', marginBottom: '20px' }}>
                                <AlertCircle size={16} color="#ef4444" />
                                <span style={{ color: '#fca5a5', fontSize: '13px', fontWeight: 500 }}>{error}</span>
                            </div>
                        )}

                        <button type="submit" disabled={loading} style={{
                            width: '100%',
                            background: loading ? 'rgba(245,158,11,0.5)' : 'linear-gradient(135deg, #f59e0b, #d97706)',
                            border: 'none',
                            borderRadius: '14px',
                            padding: '16px',
                            color: 'white',
                            fontSize: '15px',
                            fontWeight: 800,
                            cursor: loading ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            letterSpacing: '0.02em',
                            transition: 'all 0.2s',
                            boxShadow: '0 8px 24px rgba(245,158,11,0.3)',
                        }}>
                            {loading ? 'Signing in…' : <><span>Sign In to Dashboard</span><ArrowRight size={18} /></>}
                        </button>

                        <div style={{ display: 'flex', alignItems: 'center', margin: '24px 0', gap: '16px' }}>
                            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
                            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Or</span>
                            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
                        </div>

                        <GoogleSignInButton 
                            onError={setError} 
                            loading={loading}
                            onRequireOtp={(email, msg) => navigate('/verify', { state: { email, msg } })} 
                        />
                    </form>

                    <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '12px', marginTop: '20px', lineHeight: 1.6 }}>
                        Use your Paywise account credentials.<br />
                        <Link to="/register" style={{ color: '#f59e0b', textDecoration: 'none', fontWeight: 700 }}>Don't have an account?</Link> Sign up as a partner today.
                    </p>
                </div>
            </div>
        </div>
    );
}
