import React, { useState, useEffect } from 'react';
import { 
    Sun, Moon, Monitor, Globe, Languages, 
    Calendar, Clock, Shield, Bell, Target, 
    Trash2, RefreshCw, Save, CheckCircle2,
    Lock, AlertTriangle, Key, Zap
} from 'lucide-react';

const LANGUAGES = ['English', 'Spanish', 'French', 'Hindi', 'Telugu'];
const THEMES = [
    { value: 'system', label: 'System', icon: Monitor },
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
];

export default function MerchantSettings({ user, merchant, api, onRefresh }) {
    const [settings, setSettings] = useState({
        theme: 'system',
        language: 'English',
        dateFormat: 'DD/MM/YYYY',
        // Merchant Specific
        monthlyTarget: 0,
        requireCustomerApproval: false,
        lockTransactionsAfterMinutes: 5,
        freezesOnDispute: true,
    });

    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        if (user?.appSettings) {
            setSettings(prev => ({
                ...prev,
                theme: user.appSettings.theme || 'system',
                language: user.appSettings.language || 'English',
                dateFormat: user.appSettings.dateFormat || 'DD/MM/YYYY',
            }));
        }
        if (merchant) {
            setSettings(prev => ({
                ...prev,
                monthlyTarget: merchant.monthlyTarget || 0,
                requireCustomerApproval: merchant.requireCustomerApproval || false,
                lockTransactionsAfterMinutes: merchant.lockTransactionsAfterMinutes || 5,
                freezesOnDispute: merchant.freezesOnDispute ?? true,
            }));
        }
    }, [user, merchant]);

    const handleSave = async () => {
        setSaving(true);
        try {
            // 1. Update User App Settings
            await api.put('/auth/app-settings', {
                theme: settings.theme,
                language: settings.language,
                dateFormat: settings.dateFormat,
            });

            // 2. Update Merchant Specific Settings
            await api.put('/merchant/profile', {
                monthlyTarget: settings.monthlyTarget,
                requireCustomerApproval: settings.requireCustomerApproval,
                lockTransactionsAfterMinutes: settings.lockTransactionsAfterMinutes,
                freezesOnDispute: settings.freezesOnDispute,
            });

            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
            if (onRefresh) onRefresh();
        } catch (err) {
            alert('Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    const SettingCard = ({ title, children }) => (
        <div style={{ background: 'white', borderRadius: '24px', padding: '24px', border: '1.5px solid #f0ebe0', marginBottom: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
            <h3 style={{ margin: '0 0 20px', fontSize: '15px', fontWeight: 900, color: '#1a1209', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{title}</h3>
            {children}
        </div>
    );

    const Row = ({ label, sub, children, last }) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0', borderBottom: last ? 'none' : '1px solid #f9f7f3' }}>
            <div style={{ flex: 1, paddingRight: '12px' }}>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#1a1209' }}>{label}</div>
                {sub && <div style={{ fontSize: '11px', color: '#92896a', marginTop: '2px', fontWeight: 500 }}>{sub}</div>}
            </div>
            {children}
        </div>
    );

    const Toggle = ({ value, onChange }) => (
        <button onClick={() => onChange(!value)} style={{
            width: '44px', height: '24px', borderRadius: '12px', background: value ? '#92400e' : '#e5dfcf',
            position: 'relative', border: 'none', cursor: 'pointer', transition: 'all 0.2s'
        }}>
            <div style={{
                width: '18px', height: '18px', background: 'white', borderRadius: '50%',
                position: 'absolute', top: '3px', left: value ? '23px' : '3px', transition: 'all 0.2s',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }} />
        </button>
    );

    return (
        <div style={{ paddingBottom: '100px' }}>
            {/* App Appearance */}
            <SettingCard title="App Appearance">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '20px' }}>
                    {THEMES.map(t => {
                        const Icon = t.icon;
                        const active = settings.theme === t.value;
                        return (
                            <button key={t.value} onClick={() => setSettings(s => ({ ...s, theme: t.value }))} style={{
                                padding: '12px', borderRadius: '16px', border: '2px solid', 
                                borderColor: active ? '#92400e' : '#f0ebe0',
                                background: active ? '#fdf6e3' : 'white',
                                cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', transition: 'all 0.2s'
                            }}>
                                <Icon size={20} color={active ? '#92400e' : '#b5a97a'} />
                                <span style={{ fontSize: '12px', fontWeight: 800, color: active ? '#92400e' : '#92896a' }}>{t.label}</span>
                            </button>
                        );
                    })}
                </div>
                
                <Row label="Language" sub="Display interface in your preferred language">
                    <select value={settings.language} onChange={e => setSettings(s => ({ ...s, language: e.target.value }))} style={{
                        background: '#f9f7f3', border: '1.5px solid #e5dfcf', borderRadius: '10px', padding: '8px 12px', fontSize: '13px', fontWeight: 700, color: '#1a1209', outline: 'none'
                    }}>
                        {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                </Row>
                
                <Row label="Date Format" sub="How transaction dates are shown" last>
                    <div style={{ display: 'flex', gap: '6px' }}>
                        {['DD/MM/YYYY', 'MM/DD/YYYY'].map(f => (
                            <button key={f} onClick={() => setSettings(s => ({ ...s, dateFormat: f }))} style={{
                                padding: '6px 12px', borderRadius: '8px', border: '1.5px solid',
                                borderColor: settings.dateFormat === f ? '#92400e' : '#e5dfcf',
                                background: settings.dateFormat === f ? '#92400e' : 'white',
                                color: settings.dateFormat === f ? 'white' : '#92896a',
                                fontSize: '11px', fontWeight: 800, cursor: 'pointer'
                            }}>{f}</button>
                        ))}
                    </div>
                </Row>
            </SettingCard>

            {/* Merchant Controls */}
            <SettingCard title="Merchant Controls">
                <Row label="Customer Approval" sub="Customers must verify entries before they are finalized">
                    <Toggle value={settings.requireCustomerApproval} onChange={v => setSettings(s => ({ ...s, requireCustomerApproval: v }))} />
                </Row>
                
                <Row label="Freeze on Dispute" sub="Lock account features if a customer raises a dispute">
                    <Toggle value={settings.freezesOnDispute} onChange={v => setSettings(s => ({ ...s, freezesOnDispute: v }))} />
                </Row>

                <Row label="Monthly Target" sub="Set a monthly sales or recovery goal">
                    <div style={{ display: 'flex', alignItems: 'center', background: '#f9f7f3', border: '1.5px solid #e5dfcf', borderRadius: '10px', padding: '4px 10px', width: '100px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 800, color: '#92896a' }}>₹</span>
                        <input type="number" value={settings.monthlyTarget} onChange={e => setSettings(s => ({ ...s, monthlyTarget: parseInt(e.target.value) || 0 }))} style={{
                            width: '100%', border: 'none', background: 'transparent', outline: 'none', padding: '4px', fontSize: '13px', fontWeight: 800, textAlign: 'right'
                        }} placeholder="0" />
                    </div>
                </Row>

                <Row label="Edit Window" sub="Minutes until a transaction is locked" last>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <select value={settings.lockTransactionsAfterMinutes} onChange={e => setSettings(s => ({ ...s, lockTransactionsAfterMinutes: parseInt(e.target.value) }))} style={{
                            background: '#f9f7f3', border: '1.5px solid #e5dfcf', borderRadius: '10px', padding: '6px 10px', fontSize: '13px', fontWeight: 800
                        }}>
                            {[5, 15, 30, 60, 1440].map(m => <option key={m} value={m}>{m === 1440 ? '24h' : `${m}m`}</option>)}
                        </select>
                    </div>
                </Row>
            </SettingCard>

            {/* Security & Data */}
            <SettingCard title="Security & Data">
                <Row label="Clear Local Cache" sub="Fixes sluggish performance by reloading local data">
                    <button style={{ background: 'none', border: 'none', color: '#92400e', fontWeight: 800, fontSize: '12px', cursor: 'pointer' }}>Clear Cache</button>
                </Row>
                <Row label="Session Lockdown" sub="Require PIN on every app entry (uses main Paywise PIN)" last>
                    <div style={{ fontSize: '11px', color: '#ea580c', fontWeight: 800, background: '#fff7ed', padding: '4px 8px', borderRadius: '6px' }}>SET IN MAIN APP</div>
                </Row>
            </SettingCard>

            {/* Save Button */}
            <div style={{ position: 'fixed', bottom: '24px', left: '24px', right: '24px', zIndex: 100 }}>
                <button onClick={handleSave} disabled={saving} style={{
                    width: '100%', padding: '16px', borderRadius: '18px', border: 'none',
                    background: saved ? '#16a34a' : 'linear-gradient(135deg, #92400e, #78350f)',
                    color: 'white', fontSize: '16px', fontWeight: 900, cursor: saving ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                    boxShadow: '0 8px 32px rgba(146,64,14,0.3)', transition: 'all 0.3s'
                }}>
                    {saving ? <RefreshCw size={20} className="pi-spin" /> : saved ? <CheckCircle2 size={20} /> : <Save size={20} />}
                    {saving ? 'Saving...' : saved ? 'Settings Saved!' : 'Save Settings'}
                </button>
            </div>
            
            <style>{`
                input[type=number]::-webkit-inner-spin-button, 
                input[type=number]::-webkit-outer-spin-button { 
                    -webkit-appearance: none; 
                    margin: 0; 
                }
                .pi-spin { animation: spin 1s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
}
