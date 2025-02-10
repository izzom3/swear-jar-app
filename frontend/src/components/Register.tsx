import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService.ts';

interface Props {
      setAuth: (boolean: boolean) => void;
}

const Register: React.FC<Props> = ({setAuth}) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const response = await authService.register({ username, password });
            if (response.message === "User registered successfully") {
                setMessage('User registered successfully. Redirecting to Login...');
                setTimeout(() => {
                    navigate("/login");
                }, 1500); // Redirect after 1.5 second
            } else {
                setMessage(response.message || 'Registration failed. Please try again.');
            }
        } catch (error: any) {
            console.error('Registration error:', error);
            setMessage(error.response?.data?.message || 'Registration failed. Please try again.');
        }
    };

    return (
        <div>
            <h2>Register</h2>
            {message && <p>{message}</p>}
            <form onSubmit={handleSubmit}>
                <div>
                    <label htmlFor="username">Username:</label>
                    <input
                        type="text"
                        id="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label htmlFor="password">Password:</label>
                    <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>
                <button type="submit">Register</button>
            </form>
        </div>
    );
};

export default Register;
