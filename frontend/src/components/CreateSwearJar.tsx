import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import jarService from '../services/jarService.ts';

const CreateSwearJar: React.FC = () => {
    const [name, setName] = useState('');
    const [message, setMessage] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const response = await jarService.createJar({name});
            setMessage('Swear jar created successfully!');
            setTimeout(() => {
                navigate("/jars");
            }, 1000);
        } catch (error: any) {
            console.error('Create swear jar error:', error);
            setMessage(error.response?.data?.message || 'Failed to create swear jar.');
        }
    };

    return (
        <div>
            <h2>Create Swear Jar</h2>
            {message && <p>{message}</p>}
            <form onSubmit={handleSubmit}>
                <div>
                    <label htmlFor="name">Swear Jar Name:</label>
                    <input
                        type="text"
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                    />
                </div>
                <button type="submit">Create Swear Jar</button>
            </form>
        </div>
    );
};

export default CreateSwearJar;
