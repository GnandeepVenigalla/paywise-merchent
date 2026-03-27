import React, { useState } from 'react';
import { ShoppingCart, Store, Phone, MapPin, CreditCard, ChevronRight, Check, AlertCircle, Tag } from 'lucide-react';
import { useMerchantAuth } from '../context/MerchantAuthContext';
import { useNavigate } from 'react-router-dom';

const CATEGORIES = ['Grocery', 'Clothing', 'Restaurant & Food', 'Pharmacy', 'Electronics', 'Hardware', 'Services', 'General'];

const STEPS = [
    { id: 1, label: 'Store Info', icon: Store },
    { id: 2, label: 'Contact', icon: Phone },
    { id: 3, label: 'Payment', icon: CreditCard },
];

export default function MerchantOnboarding() {
    const { onboard, user } = useMerchantAuth();
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const [form, setForm] = useState({
        shopName: '',
        category: 'Grocery',
        storeAddress: '',
        whatsappNumber: '',
        upiId: '',
    });

    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

    const handleNext = () => {
        setError('');
        if (step === 1) {
            if (!form.shopName.trim()) { setError('Store name is required'); return; }
        }
        if (step === 2) {
            if (!form.whatsappNumber.trim()) { setError('WhatsApp number is required'); return; }
            if (!/^\d{10}$/.test(form.whatsappNumber.replace(/\s/g, ''))) { setError('Enter a valid 10-digit phone number'); return; }
        }
        if (step < 3) { setStep(s => s + 1); return; }
        handleSubmit();
    };

    const handleSubmit = async () => {
        setLoading(true);
        setError('');
        try {
            await onboard(form);
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.msg || 'Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const inputStyle = {
        width: '100%', boxSizing: 'border-box',
        background: '#f9f7f3',
        border: '2px solid #e5dfcf',
        borderRadius: '14px',
        padding: '14px 16px',
        fontSize: '15px',
        fontFamily: 'Inter, sans-serif',
        color: '#1a1209',
        outline: 'none',
        transition: 'border-color 0.2s, box-shadow 0.2s',
    };
    const labelStyle = {
        display: 'block', fontSize: '11px', fontWeight: 800,
        textTransform: 'uppercase', letterSpacing: '0.1em',
        color: '#92896a', marginBottom: '8px',
    };

    return (
        <div style={{ minHeight: '100vh', background: '#fdfaf4', fontFamily: "Inter, sans-serif", display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '36px' }}>
                <div style={{ width: '64px', height: '64px', background: '#92400e', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: '0 12px 32px rgba(146,64,14,0.25)' }}>
                    <ShoppingCart size={30} color="white" />
                </div>
                <h1 style={{ color: '#1a1209', fontSize: '26px', fontWeight: 900, letterSpacing: '-0.5px', margin: 0 }}>Set Up Your Store</h1>
                <p style={{ color: '#92896a', fontSize: '13px', marginTop: '6px' }}>
                    Hello {user?.username || 'there'}! Just a few details to get started.
                </p>
            </div>

            {/* Step Indicator */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0', marginBottom: '32px', width: '100%', maxWidth: '440px' }}>
                {STEPS.map((s, i) => {
                    const Icon = s.icon;
                    const done = step > s.id;
                    const active = step === s.id;
                    return (
                        <React.Fragment key={s.id}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                                <div style={{
                                    width: '44px', height: '44px', borderRadius: '50%',
                                    background: done ? '#92400e' : active ? '#92400e' : '#e5dfcf',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    boxShadow: active ? '0 4px 16px rgba(146,64,14,0.3)' : 'none',
                                    transition: 'all 0.3s',
                                }}>
                                    {done ? <Check size={20} color="white" /> : <Icon size={20} color={active ? 'white' : '#92896a'} />}
                                </div>
                                <span style={{ fontSize: '10px', fontWeight: 700, color: active ? '#92400e' : '#92896a', marginTop: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</span>
                            </div>
                            {i < STEPS.length - 1 && (
                                <div style={{ height: '2px', flex: 1, background: step > s.id ? '#92400e' : '#e5dfcf', transition: 'background 0.3s', marginBottom: '20px' }} />
                            )}
                        </React.Fragment>
                    );
                })}
            </div>

            {/* Form Card */}
            <div style={{ width: '100%', maxWidth: '440px', background: 'white', borderRadius: '28px', padding: '36px', boxShadow: '0 8px 40px rgba(0,0,0,0.08)', border: '1px solid #f0ebe0' }}>
                {step === 1 && (
                    <div>
                        <h2 style={{ fontSize: '20px', fontWeight: 900, color: '#1a1209', marginBottom: '24px', marginTop: 0 }}>🏪 Store Information</h2>
                        <div style={{ marginBottom: '20px' }}>
                            <label style={labelStyle}>Store Name *</label>
                            <div style={{ position: 'relative' }}>
                                <Store size={17} color="#b5a97a" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                                <input
                                    type="text" value={form.shopName} onChange={e => set('shopName', e.target.value)}
                                    placeholder="e.g., Ramesh General Store"
                                    style={{ ...inputStyle, paddingLeft: '40px' }}
                                    onFocus={e => { e.target.style.borderColor = '#92400e'; e.target.style.boxShadow = '0 0 0 4px rgba(146,64,14,0.08)'; }}
                                    onBlur={e => { e.target.style.borderColor = '#e5dfcf'; e.target.style.boxShadow = 'none'; }}
                                />
                            </div>
                        </div>
                        <div style={{ marginBottom: '20px' }}>
                            <label style={labelStyle}>Category *</label>
                            <div style={{ position: 'relative' }}>
                                <Tag size={17} color="#b5a97a" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', zIndex: 1 }} />
                                <select value={form.category} onChange={e => set('category', e.target.value)}
                                    style={{ ...inputStyle, paddingLeft: '40px', cursor: 'pointer', appearance: 'none', WebkitAppearance: 'none' }}
                                    onFocus={e => { e.target.style.borderColor = '#92400e'; }}
                                    onBlur={e => { e.target.style.borderColor = '#e5dfcf'; }}
                                >
                                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                                <ChevronRight size={17} color="#b5a97a" style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%) rotate(90deg)' }} />
                            </div>
                        </div>
                        <div>
                            <label style={labelStyle}>Store Address <span style={{ color: '#b5a97a', fontWeight: 500, textTransform: 'none', fontSize: '11px' }}>(optional)</span></label>
                            <div style={{ position: 'relative' }}>
                                <MapPin size={17} color="#b5a97a" style={{ position: 'absolute', left: '14px', top: '16px' }} />
                                <textarea value={form.storeAddress} onChange={e => set('storeAddress', e.target.value)}
                                    placeholder="Full store address..."
                                    rows={2}
                                    style={{ ...inputStyle, paddingLeft: '40px', resize: 'none' }}
                                    onFocus={e => { e.target.style.borderColor = '#92400e'; }}
                                    onBlur={e => { e.target.style.borderColor = '#e5dfcf'; }}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div>
                        <h2 style={{ fontSize: '20px', fontWeight: 900, color: '#1a1209', marginBottom: '8px', marginTop: 0 }}>📱 Contact Details</h2>
                        <p style={{ color: '#92896a', fontSize: '13px', marginBottom: '24px', lineHeight: 1.6 }}>
                            Your WhatsApp number is used to send payment reminders to customers.
                        </p>
                        <div style={{ marginBottom: '20px' }}>
                            <label style={labelStyle}>WhatsApp Number *</label>
                            <div style={{ position: 'relative' }}>
                                <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#92896a', fontSize: '14px', fontWeight: 700 }}>+91</span>
                                <input
                                    type="tel" value={form.whatsappNumber} onChange={e => set('whatsappNumber', e.target.value.replace(/\D/g, '').slice(0, 10))}
                                    placeholder="9876543210"
                                    style={{ ...inputStyle, paddingLeft: '52px' }}
                                    onFocus={e => { e.target.style.borderColor = '#92400e'; e.target.style.boxShadow = '0 0 0 4px rgba(146,64,14,0.08)'; }}
                                    onBlur={e => { e.target.style.borderColor = '#e5dfcf'; e.target.style.boxShadow = 'none'; }}
                                />
                            </div>
                            <p style={{ fontSize: '11px', color: '#b5a97a', marginTop: '6px' }}>This should be your active WhatsApp number</p>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div>
                        <h2 style={{ fontSize: '20px', fontWeight: 900, color: '#1a1209', marginBottom: '8px', marginTop: 0 }}>💳 Payment Setup</h2>
                        <p style={{ color: '#92896a', fontSize: '13px', marginBottom: '24px', lineHeight: 1.6 }}>
                            Your UPI ID lets customers pay you directly from the Katha book.
                        </p>
                        <div style={{ marginBottom: '20px' }}>
                            <label style={labelStyle}>UPI ID <span style={{ color: '#b5a97a', fontWeight: 500, textTransform: 'none', fontSize: '11px' }}>(optional but recommended)</span></label>
                            <div style={{ position: 'relative' }}>
                                <CreditCard size={17} color="#b5a97a" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                                <input
                                    type="text" value={form.upiId} onChange={e => set('upiId', e.target.value)}
                                    placeholder="yourname@upi"
                                    style={{ ...inputStyle, paddingLeft: '40px' }}
                                    onFocus={e => { e.target.style.borderColor = '#92400e'; e.target.style.boxShadow = '0 0 0 4px rgba(146,64,14,0.08)'; }}
                                    onBlur={e => { e.target.style.borderColor = '#e5dfcf'; e.target.style.boxShadow = 'none'; }}
                                />
                            </div>
                        </div>
                        {/* Summary */}
                        <div style={{ background: '#fdf6e3', border: '1.5px solid #e5dfcf', borderRadius: '16px', padding: '16px' }}>
                            <p style={{ fontSize: '11px', fontWeight: 800, color: '#92896a', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px', marginTop: 0 }}>Summary</p>
                            {[['Store', form.shopName], ['Category', form.category], ['Phone', form.whatsappNumber ? `+91 ${form.whatsappNumber}` : '—'], ['UPI', form.upiId || '—']].map(([k, v]) => (
                                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                    <span style={{ fontSize: '13px', color: '#92896a', fontWeight: 600 }}>{k}</span>
                                    <span style={{ fontSize: '13px', color: '#1a1209', fontWeight: 700 }}>{v}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {error && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#fff5f5', border: '1px solid #fecaca', borderRadius: '12px', padding: '12px 14px', marginTop: '16px' }}>
                        <AlertCircle size={15} color="#ef4444" />
                        <span style={{ color: '#dc2626', fontSize: '13px', fontWeight: 600 }}>{error}</span>
                    </div>
                )}

                <div style={{ display: 'flex', gap: '12px', marginTop: '28px' }}>
                    {step > 1 && (
                        <button onClick={() => { setStep(s => s - 1); setError(''); }} style={{ flex: 1, padding: '14px', borderRadius: '14px', border: '2px solid #e5dfcf', background: 'white', color: '#92896a', fontWeight: 800, fontSize: '14px', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
                            Back
                        </button>
                    )}
                    <button onClick={handleNext} disabled={loading} style={{
                        flex: 2, padding: '14px', borderRadius: '14px', border: 'none',
                        background: loading ? '#c4a574' : 'linear-gradient(135deg, #92400e, #78350f)',
                        color: 'white', fontWeight: 800, fontSize: '14px', cursor: loading ? 'not-allowed' : 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                        boxShadow: '0 6px 20px rgba(146,64,14,0.3)', fontFamily: 'Inter, sans-serif',
                    }}>
                        {loading ? 'Setting up…' : step === 3 ? <>🎉 Launch Store</> : <><span>Continue</span><ChevronRight size={16} /></>}
                    </button>
                </div>
            </div>
        </div>
    );
}
