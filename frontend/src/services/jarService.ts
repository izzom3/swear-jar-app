import tokenRerefreshService from './tokenRefreshService.ts';

const BACKEND_API_URL = process.env.REACT_APP_FRONTEND_API_URL + '/jars';

// Use axiosInstance from tokenRefreshService
const axiosInstance = tokenRerefreshService.axiosInstance;

const createJar = async (jarData: any) => {
    const response = await axiosInstance.post(`${BACKEND_API_URL}/create`, jarData);
    return response.data;
};

const getJars = async () => {
    const response = await axiosInstance.get(`${BACKEND_API_URL}`);
    return response.data;
};

const getJar = async (id: string) => {
    const response = await axiosInstance.get(`${BACKEND_API_URL}/${id}`);
    return response.data;
};

const addMember = async (id: string, data: any) => {
    const response = await axiosInstance.put(`${BACKEND_API_URL}/${id}/addMember`, data);
    return response.data;
};

const removeMember = async (id: string, data: any) => {
    const response = await axiosInstance.delete(`${BACKEND_API_URL}/${id}/removeMember`, { data });
    return response.data;
};

const getTransactions = async (id: string) => {
    try {
        const response = await axiosInstance.get(`${BACKEND_API_URL}/${id}/transactions`);
        return response.data;
    } catch (error) {
        console.error("Error fetching transactions:", error);
        throw error;
    }
};

//Add permission to a user
const addPermission = async (jarId: string, userIdToAdd: string) => {
    const response = await axiosInstance.post(`${BACKEND_API_URL}/addPermission`, { jarId, userIdToAdd });
    return response.data;
};

//Remove permission from a user
const removePermission = async (jarId: string, userIdToRemove: string) => {
    const response = await axiosInstance.post(`${BACKEND_API_URL}/removePermission`, { jarId, userIdToRemove });
    return response.data;
};

const getAllUsers = async () => {
    try {
        console.log("Calling getAllUsers...");
        const response = await axiosInstance.get(`${BACKEND_API_URL}/getAllUsers`);
        return response.data;
    } catch (error) {
        console.error("Error fetching users:", error);
        throw error;
    }
};

const jarService = {
    createJar,
    getJars,
    getJar,
    addMember,
    removeMember,
    getTransactions,
    addPermission,
    removePermission,
    getAllUsers,
};

export default jarService;