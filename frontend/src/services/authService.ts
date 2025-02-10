import axios from 'axios';

const API_URL = 'http://localhost:4000/api/auth'; // Adjust as needed

const register = async (userData: any) => {
    const response = await axios.post(`${API_URL}/register`, userData);
    return response.data;
};

const login = async (userData: any) => {
    const response = await axios.post(`${API_URL}/login`, userData);
    if (response.data.token) {
        localStorage.setItem('user', JSON.stringify(response.data));
    }
    return response.data;
};

const logout = () => {
    localStorage.removeItem('user');
};

const authService = {
    register,
    login,
    logout,
};

export default authService;