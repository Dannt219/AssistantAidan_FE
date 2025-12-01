import axios from 'axios'
import { useAuthStore } from '../state/auth'

const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'
})

api.interceptors.request.use((config) => {
    const token = useAuthStore.getState().accessToken;
    // Always set Authorization header if token exists (even if empty, backend will handle)
    config.headers = config.headers || {};
    if (token) {
        (config.headers as any).Authorization = `Bearer ${token}`;
    }
    return config;
});

// Handle 401 errors - redirect to login
api.interceptors.response.use(
    (response) => response, 
    (error) => {
        if (error.response?.status === 401) {
            // Clear auth state
            const authStore = useAuthStore.getState();
            authStore.logout();

            // Redirect to login if not already there
            if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
                // Use replace to avoid adding to history
                window.location.replace('/login');
            }
        }
        return Promise.reject(error);
    }
);

export default api;