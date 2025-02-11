import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService.ts';

interface Props {
    setAuth: (auth: boolean) => void;
}

const Logout: React.FC<Props> = ({ setAuth }) => {
    const navigate = useNavigate();

    useEffect(() => {
        const logoutUser = async () => {
            try {
                await authService.logout();
                setAuth(false);  // Update authentication state in App.tsx
                navigate("/login");  // Redirect to login immediately
            } catch (error) {
                console.error('Logout error:', error);
            }
        };

        logoutUser();
    }, [navigate, setAuth]);

    return null;  // No UI needed
};

export default Logout;
