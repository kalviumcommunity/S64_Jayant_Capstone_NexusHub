import { io } from 'socket.io-client';

let socket;

export const initializeSocket = (token) => {
  if (!token) return null;
  
  if (socket) {
    socket.disconnect();
  }
  
  const ENDPOINT = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  
  socket = io(ENDPOINT, {
    auth: {
      token
    }
  });
  
  socket.on('connect', () => {
    console.log('Socket connected');
  });
  
  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error);
  });
  
  return socket;
};

export const getSocket = () => {
  if (!socket) {
    console.warn('Socket not initialized. Call initializeSocket first.');
    return null;
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export default { initializeSocket, getSocket, disconnectSocket };