import { useGoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

// Google "G" SVG logo
function GoogleLogo() {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
    );
}

export default function GoogleSignInButton({ onError, onRequireOtp, loading }) {
    const navigate = useNavigate();

    const login = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            try {
                // 1. Get user info from Google
                const userInfo = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
                    headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
                }).then(r => r.data);

                // 2. Auth with our backend
                const res = await axios.post(`${API_URL}/auth/google-token`, {
                    googleId: userInfo.sub,
                    email: userInfo.email,
                    name: userInfo.name,
                    picture: userInfo.picture
                });

                if (res.data.requireOtp) {
                    if (onRequireOtp) onRequireOtp(res.data.email, res.data.msg);
                    return;
                }

                // Store token and redirect
                localStorage.setItem('merchant_token', res.data.token);
                // The App.jsx/AuthContext logic will handle the redirect if it sees the token
                window.location.href = '/'; 
            } catch (err) {
                console.error('Google Sign-In Error:', err);
                if (onError) onError(err.response?.data?.msg || 'Google sign-in failed. Please try again.');
            }
        },
        onError: (error) => {
            console.error('Login Failed:', error);
            if (onError) onError('Google sign-in was cancelled or failed.');
        }
    });

    return (
        <button
            type="button"
            onClick={() => !loading && login()}
            disabled={loading}
            style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                padding: '14px',
                background: 'rgba(255,255,255,1)',
                border: 'none',
                borderRadius: '14px',
                color: '#1a1209',
                fontSize: '15px',
                fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                marginTop: '16px',
                opacity: loading ? 0.6 : 1,
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
        >
            <GoogleLogo />
            <span>Continue with Google</span>
        </button>
    );
}
