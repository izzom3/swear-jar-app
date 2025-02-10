import axios from 'axios';

const API_URL = 'http://localhost:4000/api/jars'; // Adjust as needed

// Helper function to get the JWT token from local storage
const getAuthHeader = () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user?.token ? { 'Authorization': `Bearer ${user.token}` } : {};
};

const createJar = async (jarData: any) => {
    const response = await axios.post(`${API_URL}/create`, jarData, { headers: getAuthHeader() });
    return response.data;
};

const getJars = async () => {
    const response = await axios.get(API_URL);
    return response.data;
};

const getJar = async (id: string) => {
    const response = await axios.get(`${API_URL}/${id}`);
    return response.data;
};

const addMember = async (id: string, data: any) => {
    const response = await axios.put(`${API_URL}/${id}/addMember`, data);
    return response.data;
};

const removeMember = async (id: string, data: any) => {
    const response = await axios.delete(`${API_URL}/${id}/removeMember`, { data });
    return response.data;
};

const jarService = {
    createJar,
    getJars,
    getJar,
    addMember,
    removeMember,
};

export default jarService;
