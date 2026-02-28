import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import type { Socket } from 'socket.io-client';
import { connectSocket, disconnectSocket, getSocket } from '../services/socket';
import { useAuth } from './AuthContext';

interface SocketContextValue {
  socket: Socket | null;
  isConnected: boolean;
  joinOrder: (orderId: string) => void;
  leaveOrder: (orderId: string) => void;
}

const SocketContext = createContext<SocketContextValue>({
  socket: null,
  isConnected: false,
  joinOrder: () => {},
  leaveOrder: () => {},
});

export function useSocket(): SocketContextValue {
  return useContext(SocketContext);
}

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, accessToken } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const joinedRoomsRef = useRef<Set<string>>(new Set());

  // Connect when authenticated, disconnect when not
  useEffect(() => {
    if (isAuthenticated && accessToken) {
      const sock = connectSocket(accessToken);
      socketRef.current = sock;

      sock.on('connect', () => {
        setIsConnected(true);
        // Re-join rooms after reconnect
        for (const orderId of joinedRoomsRef.current) {
          sock.emit('join:order', { orderId });
        }
      });

      sock.on('disconnect', () => {
        setIsConnected(false);
      });

      // Handle token expiry — re-authenticate with current token
      sock.on('auth:expired', () => {
        if (accessToken) {
          sock.emit('auth:renew', { token: accessToken });
        }
      });

      return () => {
        disconnectSocket();
        socketRef.current = null;
        setIsConnected(false);
      };
    } else {
      disconnectSocket();
      socketRef.current = null;
      setIsConnected(false);
    }
  }, [isAuthenticated, accessToken]);

  const joinOrder = useCallback((orderId: string) => {
    joinedRoomsRef.current.add(orderId);
    const sock = getSocket();
    if (sock?.connected) {
      sock.emit('join:order', { orderId });
    }
  }, []);

  const leaveOrder = useCallback((orderId: string) => {
    joinedRoomsRef.current.delete(orderId);
    const sock = getSocket();
    if (sock?.connected) {
      sock.emit('leave:order', { orderId });
    }
  }, []);

  return (
    <SocketContext.Provider
      value={{
        socket: socketRef.current,
        isConnected,
        joinOrder,
        leaveOrder,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}
