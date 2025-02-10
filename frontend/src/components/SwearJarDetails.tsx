import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import jarService from '../services/jarService.ts';

interface Member {
    name: string;
    amount: number;
}

const SwearJarDetails: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [jar, setJar] = useState<any>(null);
    const [password, setPassword] = useState('');
    const [memberName, setMemberName] = useState('');
    const [amount, setAmount] = useState('');

    useEffect(() => {
        const fetchJar = async () => {
            if (id) {
                const data = await jarService.getJar(id);
                setJar(data);
            }
        };
        fetchJar();
    }, [id]);

    const handleAddMoney = async () => {
        if (!id || !password || !memberName || !amount) return;

        await jarService.addMember(id, { password, name: memberName, amount });
        const updatedJar = await jarService.getJar(id);
        setJar(updatedJar);
        setAmount('');
    };

    const handleRemoveMoney = async () => {
        if (!id || !password || !memberName|| !amount) return;

        await jarService.removeMember(id, { password, name: memberName, amount });
        const updatedJar = await jarService.getJar(id);
        setJar(updatedJar);
        setAmount('');
    };

    if (!jar) {
        return <div>Loading...</div>;
    }

    return (
        <div>
            <h2>{jar.name}</h2>
            <p>Swear Jar ID: {jar._id}</p>

            <h3>Members</h3>
            <ul>
                {jar.members.map((member: Member) => (
                    <li key={member.name}>
                        {member.name}: ${member.amount}
                    </li>
                ))}
            </ul>

            <div>
                <h3>Add/Remove Money</h3>
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
                <input
                    type="text"
                    placeholder="Member Name"
                    value={memberName}
                    onChange={(e) => setMemberName(e.target.value)}
                />
                <input
                    type="number"
                    placeholder="Amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                />
                <button onClick={handleAddMoney}>Add Money</button>
                <button onClick={handleRemoveMoney}>Remove Money</button>
            </div>
        </div>
    );
};

export default SwearJarDetails;
