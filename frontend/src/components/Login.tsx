import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService.ts';

interface Props {
    setAuth: (boolean: boolean) => void;
}

const Login: React.FC<Props> = ({ setAuth }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
          const response = await authService.login({ username, password });
          if (response.token) {
              localStorage.setItem("token", response.token);
              localStorage.setItem("username", username);
              setAuth(true); 
              setMessage('Login successful. Redirecting...');
              setTimeout(() => {
                  navigate("/jars");
              }, 1000);
          } else {
              console.log("Login failed");
              setMessage('Login failed.  Please check your credentials.');
          }
      } catch (error) {
          console.error('Login error:', error);
          setMessage('Login failed. Please try again.');
      }
  };

  return (
      <div>
          <h2>Login</h2>
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
              <button type="submit">Login</button>
          </form>
      </div>
  );
};

export default Login;
