import axios from 'axios';

// Create an axios instance with default config
const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to include auth token in headers
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add a response interceptor to handle common errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle unauthorized errors (token expired, etc.)
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Optionally redirect to login page
      window.location.href = '/login';
    }
    
    // Log forbidden errors for debugging
    if (error.response && error.response.status === 403) {
      console.error('Access forbidden. You do not have permission to access this resource.');
      // You can handle this differently, e.g., show a notification to the user
    }
    
    return Promise.reject(error);
  }
);

export default api;