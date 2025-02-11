import React, { useState, useEffect } from 'react'; // Import useState and useEffect
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import Login from './components/Login.tsx';
import Register from './components/Register.tsx';
import SwearJarList from './components/SwearJarList.tsx';
import CreateSwearJar from './components/CreateSwearJar.tsx';
import SwearJarDetails from './components/SwearJarDetails.tsx';
import './App.css';
import Logout from './components/Logout.tsx';

function App() {
    // State to manage user authentication
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    // Function to update authentication status
    const setAuth = (boolean: boolean) => {
        setIsAuthenticated(boolean);
    };

    useEffect(() => {
        // Check if user is already authenticated on app load
        const checkAuth = () => {
            try {
                const user = localStorage.getItem("user");
                if (user) {
                    setIsAuthenticated(true);
                } else {
                    setIsAuthenticated(false);
                }
            } catch (err) {
                console.error(err);
                setIsAuthenticated(false);
            }
        };
        checkAuth();  // Call the function on component mount
    }, []);

    return (
        <Router>
            <div className="App">
                <nav>
                    <ul>
                        <li>
                            <Link to="/">Home</Link>
                        </li>
                        {!isAuthenticated ? (
                            <>
                                <li>
                                    <Link to="/login">Login</Link>
                                </li>
                                <li>
                                    <Link to="/register">Register</Link>
                                </li>
                            </>
                        ) : (
                            <>
                                <li>
                                    <Link to="/jars">Swear Jars</Link>
                                </li>
                                <li>
                                    <Link to="/create-jar">Create Swear Jar</Link>
                                </li>
                                <li>
                                    <Link to="/logout">Logout</Link>
                                </li>
                            </>
                        )}
                    </ul>
                </nav>

                <Routes>
                    <Route path="/login" element={<Login setAuth={setAuth} />} />
                    <Route path="/register" element={<Register setAuth={setAuth} />} />
                    <Route path="/logout" element={<Logout setAuth={setAuth} />} />
                    <Route path="/jars" element={<SwearJarList />} />
                    <Route path="/create-jar" element={<CreateSwearJar />} />
                    <Route path="/jars/:id" element={<SwearJarDetails />} />
                    <Route path="/" element={
                            isAuthenticated ? (
                                <div>Welcome! View all Swear Jars <Link to="/jars">here</Link>.</div>
                            ) : (
                                <div>Please Login or Register to see existing Swear Jars</div>
                            )
                        }/>
                </Routes>
            </div>
        </Router>
    );
}

export default App;
