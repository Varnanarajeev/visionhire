import axios from 'axios';

const API_URL = 'http://localhost:8000';

export interface User {
    email: string;
    full_name?: string;
}

export const auth = {
    async register(email: string, password: string, fullName: string, role: string = 'candidate') {
        const res = await axios.post(`${API_URL}/auth/register`, {
            email,
            password,
            full_name: fullName,
            role,
        });
        return res.data;
    },

    async login(email: string, password: string) {
        const formData = new FormData();
        formData.append('username', email); // OAuth2 expects 'username'
        formData.append('password', password);

        const res = await axios.post(`${API_URL}/auth/token`, formData);
        if (res.data.access_token) {
            localStorage.setItem('token', res.data.access_token);
            localStorage.setItem('user_email', email);
            if (res.data.role) localStorage.setItem('userRole', res.data.role);
        }
        return res.data;
    },

    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user_email');
        localStorage.removeItem('userRole');
        localStorage.removeItem('interviewId');
        window.location.href = '/login';
    },

    getToken() {
        return localStorage.getItem('token');
    },

    isAuthenticated() {
        return !!localStorage.getItem('token');
    },

    getUserEmail() {
        return localStorage.getItem('user_email');
    }
};
