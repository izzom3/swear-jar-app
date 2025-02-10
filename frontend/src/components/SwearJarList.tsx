import React, { useState, useEffect } from 'react';
import jarService from '../services/jarService.ts';
import { Link } from 'react-router-dom'; // Import Link

const SwearJarList: React.FC = () => {
    const [jars, setJars] = useState([]);

    useEffect(() => {
        const fetchJars = async () => {
            const data = await jarService.getJars();
            setJars(data);
        };
        fetchJars();
    }, []);

    return (
        <div>
            <h2>Swear Jars</h2>
            <ul>
                {jars.map((jar: any) => (
                    <li key={jar._id}>
                        <Link to={`/jars/${jar._id}`}>{jar.name}</Link>  {/* Use Link */}
                    </li>
                ))}
            </ul>
            <Link to ="/create-jar"> Create Swear Jar</Link>
        </div>
    );
};

    export default SwearJarList;
