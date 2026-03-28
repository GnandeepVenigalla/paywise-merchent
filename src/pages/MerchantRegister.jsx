import React, { useState } from 'react';
import { Mail, Lock, User, Wallet, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useMerchantAuth } from '../context/MerchantAuthContext';
import { useNavigate, Link } from 'react-router-dom';
import GoogleSignInButton from '../components/GoogleSignInButton';

export default function MerchantRegister() {
    const { register, verifyOtp } = useMerchantAuth();
    const navigate = useNavigate();

    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [otp, setOtp] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const [isOtpMode, setIsOtpMode] = useState(false);

    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await register(username, email, phone, password);
            if (res && res.requireOtp) {
                setIsOtpMode(true);
                setSuccess(res.msg || 'Verification code sent to your email!');
            } else {
                // Should not happen with current backend logic but for safety:
                navigate('/onboarding');
            }
        } catch (err) {
            setError(err.response?.data?.msg || 'Registration failed. Try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await verifyOtp(email, otp);
            navigate('/onboarding');
        } catch (err) {
            setError(err.response?.data?.msg || 'Invalid verification code.');
        } finally {
            setLoading(false);
        }
    };

    const cardStyle = {
        background: 'rgba(255,255,255,0.05)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '28px',
        padding: '36px',
        width: '100%',
        maxWidth: '420px',
    };

    const inputStyle = {
        width: '100%', boxSizing: 'border-box',
        background: 'rgba(255,255,255,0.08)',
        border: '1.5px solid rgba(255,255,255,0.1)',
        borderRadius: '14px',
        padding: '14px 16px 14px 44px',
        color: 'white',
        fontSize: '15px',
        outline: 'none',
        transition: 'border-color 0.2s',
    };

    const labelStyle = { display: 'block', color: 'rgba(255,255,255,0.7)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' };

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
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <div style={{
                        maxWidth: '220px', height: 'auto',
                        margin: '0 auto',
                        filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.3))',
                    }}>
                        <img src="/Paywise.PNG" alt="Paywise" style={{ width: '100%', height: 'auto', display: 'block' }} />
                    </div>
                    <p style={{ color: 'white', fontSize: '18px', fontWeight: 600, marginTop: '8px', opacity: 0.8 }}>
                        {isOtpMode ? 'Verify Your Account' : 'Partner with Paywise'}
                    </p>
                </div>

                <div style={cardStyle}>
                    {error && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '12px', padding: '12px 16px', marginBottom: '20px' }}>
                            <AlertCircle size={16} color="#ef4444" />
                            <span style={{ color: '#fca5a5', fontSize: '13px', fontWeight: 500 }}>{error}</span>
                        </div>
                    )}
                    {success && !error && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '12px', padding: '12px 16px', marginBottom: '20px' }}>
                            <CheckCircle2 size={16} color="#10b981" />
                            <span style={{ color: '#6ee7b7', fontSize: '13px', fontWeight: 500 }}>{success}</span>
                        </div>
                    )}

                    {!isOtpMode ? (
                        <form onSubmit={handleRegister}>
                            <div style={{ marginBottom: '16px' }}>
                                <label style={labelStyle}>Full Name</label>
                                <div style={{ position: 'relative' }}>
                                    <User size={18} color="rgba(255,255,255,0.3)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                                    <input value={username} onChange={e => setUsername(e.target.value)} required placeholder="e.g. Ramesh Kumar" style={inputStyle} />
                                </div>
                            </div>
                            <div style={{ marginBottom: '16px' }}>
                                <label style={labelStyle}>Email Address</label>
                                <div style={{ position: 'relative' }}>
                                    <Mail size={18} color="rgba(255,255,255,0.3)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="your@email.com" style={inputStyle} />
                                </div>
                            </div>
                            <div style={{ marginBottom: '16px' }}>
                                <label style={labelStyle}>Phone Number</label>
                                <div style={{ position: 'relative' }}>
                                    <Wallet size={18} color="rgba(255,255,255,0.3)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                                    <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} required placeholder="9876543210" style={inputStyle} />
                                </div>
                            </div>
                            <div style={{ marginBottom: '24px' }}>
                                <label style={labelStyle}>Password</label>
                                <div style={{ position: 'relative' }}>
                                    <Lock size={18} color="rgba(255,255,255,0.3)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                                    <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="Min 6 characters" minLength={6} style={inputStyle} />
                                </div>
                            </div>

                            <button type="submit" disabled={loading} style={{
                                width: '100%', background: 'linear-gradient(135deg, #f59e0b, #d97706)', border: 'none', borderRadius: '14px', padding: '16px', color: 'white', fontSize: '15px', fontWeight: 800, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 8px 24px rgba(245,158,11,0.3)',
                            }}>
                                {loading ? 'Creating Account…' : <><span>Create Merchant Account</span><ArrowRight size={18} /></>}
                            </button>

                            <div style={{ display: 'flex', alignItems: 'center', margin: '24px 0', gap: '16px' }}>
                                <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
                                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Or</span>
                                <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
                            </div>

                            <GoogleSignInButton 
                                onError={setError} 
                                loading={loading}
                                onRequireOtp={(email, msg) => {
                                    setEmail(email);
                                    setIsOtpMode(true);
                                    setSuccess(msg);
                                }} 
                            />
                        </form>
                    ) : (
                        <form onSubmit={handleVerify}>
                            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', textAlign: 'center', marginBottom: '24px' }}>Enter the 6-digit verification code sent to {email}</p>
                            <div style={{ marginBottom: '24px' }}>
                                <input value={otp} onChange={e => setOtp(e.target.value)} required placeholder="000000" maxLength={6} style={{ ...inputStyle, padding: '16px', textAlign: 'center', fontSize: '24px', fontWeight: 900, letterSpacing: '8px' }} />
                            </div>
                            <button type="submit" disabled={loading || otp.length < 6} style={{
                                width: '100%', background: 'linear-gradient(135deg, #f59e0b, #d97706)', border: 'none', borderRadius: '14px', padding: '16px', color: 'white', fontSize: '15px', fontWeight: 800, cursor: (loading || otp.length < 6) ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 8px 24px rgba(245,158,11,0.3)',
                            }}>
                                {loading ? 'Verifying…' : <span>Verify & Get Started</span>}
                            </button>
                        </form>
                    )}

                    <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '12px', marginTop: '20px', lineHeight: 1.6 }}>
                        Already have an account? <Link to="/login" style={{ color: '#f59e0b', textDecoration: 'none', fontWeight: 700 }}>Sign In</Link><br />
                        <a href="https://paywiseapp.com" style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'none', fontWeight: 600, display: 'inline-block', marginTop: '8px' }}>← Go to Paywise App</a>
                    </p>
                </div>
            </div>
        </div>
    );
}
