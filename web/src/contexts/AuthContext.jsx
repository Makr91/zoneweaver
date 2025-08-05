import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

/**
 * Authentication context for ZoneWeaver local user management
 */
const AuthContext = createContext();

/**
 * Custom hook to use authentication context
 * @returns {Object} Authentication context value
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

/**
 * Authentication provider component
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('authToken'));
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  /**
   * Initialize authentication state on component mount
   */
  useEffect(() => {
    initializeAuth();
  }, []);

  /**
   * Initialize authentication by checking stored token
   */
  const initializeAuth = async () => {
    const storedToken = localStorage.getItem('authToken');
    
    if (storedToken) {
      try {
        // Verify token with server
        const response = await axios.get('/api/auth/verify', {
          headers: {
            Authorization: `Bearer ${storedToken}`
          }
        });

        if (response.data.success && response.data.user) {
          const user = await fetchGravatarData(response.data.user);
          setUser(user);
          setToken(storedToken);
          setIsAuthenticated(true);
          
          // Set default authorization header for future requests
          axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
        } else {
          // Invalid token, clear it
          clearAuth();
        }
      } catch (error) {
        console.error('Token verification failed:', error);
        clearAuth();
        setLoading(false);
        return;
      }
    }
    
    setLoading(false);
  };

  /**
   * Login user with credentials
   * @param {string} identifier - Username or email
   * @param {string} password - Password
   * @returns {Promise<Object>} Login result
   */
  const login = async (identifier, password) => {
    try {
      const response = await axios.post('/api/auth/login', {
        identifier,
        password
      });

      if (response.data.success) {
        const { token: newToken, user: userData } = response.data;
        
        // Store token and user data
        localStorage.setItem('authToken', newToken);
        setToken(newToken);
        const user = await fetchGravatarData(userData);
        setUser(user);
        setIsAuthenticated(true);
        
        // Set default authorization header
        axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;

        return { success: true, message: response.data.message };
      } else {
        return { success: false, message: response.data.message };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Login failed' 
      };
    }
  };

  /**
   * Register new user
   * @param {Object} userData - User registration data
   * @param {string} userData.username - Username
   * @param {string} userData.email - Email
   * @param {string} userData.password - Password
   * @param {string} userData.confirmPassword - Password confirmation
   * @returns {Promise<Object>} Registration result
   */
  const register = async (userData) => {
    try {
      const response = await axios.post('/api/auth/register', userData);

      if (response.data.success) {
        return { success: true, message: response.data.message };
      } else {
        return { success: false, message: response.data.message };
      }
    } catch (error) {
      console.error('Registration error:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Registration failed' 
      };
    }
  };

  /**
   * Logout user and clear authentication state
   */
  const logout = async () => {
    try {
      await axios.post('/api/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      clearAuth();
    }
  };

  /**
   * Clear authentication state
   */
  const clearAuth = () => {
    localStorage.removeItem('authToken');
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    delete axios.defaults.headers.common['Authorization'];
  };

  /**
   * Change user password
   * @param {string} currentPassword - Current password
   * @param {string} newPassword - New password
   * @param {string} confirmPassword - Password confirmation
   * @returns {Promise<Object>} Change password result
   */
  const changePassword = async (currentPassword, newPassword, confirmPassword) => {
    try {
      const response = await axios.post('/api/auth/change-password', {
        currentPassword,
        newPassword,
        confirmPassword
      });

      return { 
        success: response.data.success, 
        message: response.data.message 
      };
    } catch (error) {
      console.error('Change password error:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Password change failed' 
      };
    }
  };

  /**
   * Get current user profile
   * @returns {Promise<Object>} Profile result
   */
  const getProfile = async () => {
    try {
      const response = await axios.get('/api/auth/profile');

      if (response.data.success) {
        setUser(response.data.user);
        return { success: true, user: response.data.user };
      } else {
        return { success: false, message: response.data.message };
      }
    } catch (error) {
      console.error('Get profile error:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Failed to get profile' 
      };
    }
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated,
    login,
    register,
    logout,
    changePassword,
    getProfile,
    clearAuth
  };

  const fetchGravatarData = async (user) => {
    if (!user || !user.email) return user;
    try {
      console.log('Fetching Gravatar data for:', user.email);
      const response = await axios.get(`/api/profile/${user.email}`);
      console.log('Gravatar data response:', response.data);
      return { ...user, gravatar: response.data };
    } catch (error) {
      console.error('Failed to fetch Gravatar data:', error);
      return user;
    }
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
