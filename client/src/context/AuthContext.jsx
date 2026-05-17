import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if user is logged in on app start
  useEffect(() => {
    console.log('AuthContext: Checking for token...');
    const token = localStorage.getItem('token');
    if (token) {
      console.log('AuthContext: Token found, fetching profile...');
      // Set default authorization header
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      // Get user profile
      axios.get('/api/auth/profile')
        .then(response => {
          console.log('AuthContext: Profile fetched:', response.data);
          setUser(response.data);
          setLoading(false);
        })
        .catch(err => {
          console.error('AuthContext: Error fetching profile:', err);
          localStorage.removeItem('token');
          delete axios.defaults.headers.common['Authorization'];
          setLoading(false);
        });
    } else {
      console.log('AuthContext: No token, setting loading to false');
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    try {
      setError(null);
      const response = await axios.post('/api/auth/login', { email, password });

      const { token, ...userData } = response.data;

      // Store token in localStorage
      localStorage.setItem('token', token);

      // Set default authorization header
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      // Set user data
      setUser(userData);

      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Login failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const register = async (username, email, password) => {
    try {
      setError(null);
      const response = await axios.post('/api/auth/signup', { username, email, password });

      const { token, ...userData } = response.data;

      // Store token in localStorage
      localStorage.setItem('token', token);

      // Set default authorization header
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      // Set user data
      setUser(userData);

      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Registration failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const logout = () => {
    // Remove token from localStorage
    localStorage.removeItem('token');

    // Remove default authorization header
    delete axios.defaults.headers.common['Authorization'];

    // Clear user data
    setUser(null);
  };

  const updateDisplayName = async (displayName) => {
    try {
      setError(null);
      const response = await axios.put('/api/auth/displayname', { displayName });

      const { token, ...userData } = response.data;

      // Update token in localStorage
      localStorage.setItem('token', token);

      // Update user data
      setUser(userData);

      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to update display name';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    updateDisplayName
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};