import { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

export const MerchantAuthContext = createContext();

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? 'https://paywise-backend-lemon.vercel.app/api' : '/api');


export const MerchantAuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [merchant, setMerchant] = useState(null);
    const [loading, setLoading] = useState(true);

    const api = axios.create({ baseURL: API_URL });

    api.interceptors.request.use(config => {
        const token = localStorage.getItem('merchant_token');
        if (token) config.headers.Authorization = `Bearer ${token}`;
        return config;
    });

    const loadUser = async () => {
        try {
            const token = localStorage.getItem('merchant_token');
            if (!token) { setLoading(false); return; }
            const res = await api.get('/auth/me');
            setUser(res.data);
            // Try fetching merchant profile
            try {
                const mRes = await api.get('/merchant/profile');
                setMerchant(mRes.data);
            } catch (e) {
                // Not yet onboarded
                setMerchant(null);
            }
        } catch (err) {
            localStorage.removeItem('merchant_token');
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadUser(); }, []);

    const login = async (email, password) => {
        const res = await api.post('/auth/login', { email, password });
        localStorage.setItem('merchant_token', res.data.token);
        await loadUser();
        return res.data;
    };

    const onboard = async (data) => {
        const res = await api.post('/merchant/onboard', data);
        setMerchant(res.data);
        return res.data;
    };

    const register = async (username, email, phone, password) => {
        const res = await api.post('/auth/register', { username, email, phone, password });
        return res.data;
    };

    const verifyOtp = async (email, code) => {
        const res = await api.post('/auth/verify-otp', { email, otp: code });
        localStorage.setItem('merchant_token', res.data.token);
        await loadUser();
        return res.data;
    };

    const logout = () => {
        localStorage.removeItem('merchant_token');
        setUser(null);
        setMerchant(null);
    };

    const refreshMerchant = async () => {
        try {
            const mRes = await api.get('/merchant/profile');
            setMerchant(mRes.data);
        } catch {}
    };

    return (
        <MerchantAuthContext.Provider value={{ user, merchant, loading, api, login, logout, onboard, refreshMerchant, register, verifyOtp }}>
            {children}
        </MerchantAuthContext.Provider>
    );
};

export const useMerchantAuth = () => useContext(MerchantAuthContext);
