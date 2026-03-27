import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MerchantAuthProvider, useMerchantAuth } from './context/MerchantAuthContext';
import Dashboard from './pages/Dashboard';
import MerchantLogin from './pages/MerchantLogin';
import MerchantRegister from './pages/MerchantRegister';
import MerchantOnboarding from './pages/MerchantOnboarding';

function AppRoutes() {
    const { user, merchant, loading } = useMerchantAuth();

    if (loading) {
        return (
            <div style={{
                minHeight: '100vh', background: 'linear-gradient(135deg, #1a0a00, #3d1a00)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif'
            }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ width: '56px', height: '56px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: '#f59e0b', borderRadius: '50%', margin: '0 auto 16px', animation: 'spin 0.8s linear infinite' }} />
                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', fontWeight: 600 }}>Loading…</p>
                </div>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    return (
        <Routes>
            <Route path="/login" element={!user ? <MerchantLogin /> : <Navigate to="/" />} />
            <Route path="/register" element={!user ? <MerchantRegister /> : <Navigate to="/" />} />
            <Route path="/onboarding" element={user && !merchant ? <MerchantOnboarding /> : <Navigate to={user ? '/' : '/login'} />} />
            <Route path="/" element={
                !user ? <Navigate to="/login" /> :
                !merchant ? <Navigate to="/onboarding" /> :
                <Dashboard />
            } />
            <Route path="*" element={<Navigate to="/" />} />
        </Routes>
    );
}

function App() {
    return (
        <BrowserRouter>
            <MerchantAuthProvider>
                <AppRoutes />
            </MerchantAuthProvider>
        </BrowserRouter>
    );
}

export default App;
