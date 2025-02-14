import axios, { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';

// Axios Instance
const axiosInstance: AxiosInstance = axios.create({
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json'
    }
});


// Function to decode JWT, without verifying the signature (Don't use in backend)
const decodeJwt = (token: string) => {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));

        return JSON.parse(jsonPayload);
    } catch (error) {
        console.error("Error decoding JWT:", error);
        return null;
    }
};

// Function to check if token is expired
const isTokenExpired = (): boolean => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const token = user?.token;

    if (!token) return true; // If no token, treat as expired

    const decodedToken = decodeJwt(token);

    if (!decodedToken || !decodedToken.exp) return true;  // If decoding fails or no exp, treat as expired

    const expiryTimeMs = decodedToken.exp * 1000; // Expiry is in seconds, convert to ms
    const nowMs = Date.now();

    return nowMs >= expiryTimeMs;
};


// Function to refresh the token
const refreshToken = async () => {
    try {
        // Get refresh token, from localStorage or cookies
        const refreshToken = localStorage.getItem('refreshToken');

        if (!refreshToken) {
            // No token, re-login.
            localStorage.removeItem('user');
            localStorage.removeItem('refreshToken');
            window.location.href = '/login'; // Redirect to login **CHANGE THIS**
            return null;
        }

        const response = await axios.post('/auth/refresh', { refreshToken }); // Replace with your actual endpoint
        const { token, refreshToken: newRefreshToken } = response.data;

        // Update localStorage
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        localStorage.setItem('user', JSON.stringify({ ...user, token }));  // persist existing userdata
        localStorage.setItem('refreshToken', newRefreshToken); // update refresh token

        return token;

    } catch (error) {
        console.error("Token refresh failed:", error);

        // Clear local storage and redirect
        localStorage.removeItem('user');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login'; // Redirect to login **CHANGE THIS**
        return null;
    }
};

// Request interceptor
axiosInstance.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        let token = user?.token;
        const refreshTokenPresent = localStorage.getItem('refreshToken');

        if (!token && !refreshTokenPresent) return config; // No auth needed

        // Check token expiry
        if (isTokenExpired()) {
            if (refreshTokenPresent) {
                token = await refreshToken(); // Try to refresh
                if (token) {
                    console.log("Token Refreshed Successfully");
                }
            } else {
                // re-route, token & refresh not present.
                window.location.href = '/login'; // Redirect to login **CHANGE THIS**
                // If refreshing fails, redirect to login
            }

        }

        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error: any) => {
        return Promise.reject(error);
    }
);

// Response interceptor
axiosInstance.interceptors.response.use(
    (response: AxiosResponse) => {
        return response;
    },
    async (error: any) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true; // prevent multiple retries

            const token = await refreshToken();  // refresh code is complex, don't in-line

            if (token) {
                // Retry the original request with new token
                originalRequest.headers['Authorization'] = `Bearer ${token}`;
                return axiosInstance(originalRequest);
            } else {
                // If refreshing fails, redirect to login
                localStorage.removeItem('user');
                localStorage.removeItem('refreshToken');
                window.location.href = '/login'; // Redirect to login **CHANGE THIS**
            }
        }
        return Promise.reject(error);
    }
);

const tokenRerefreshService = {
    axiosInstance
};

export default tokenRerefreshService;