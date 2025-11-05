import { useEffect, useRef } from 'react';
import io from 'socket.io-client';
import { API_URL } from '../../../configs/env';

/**
 * Custom hook for Q&A WebSocket connection
 * @param {string} shareToken - The share token to join the room for
 * @param {Function} onQuestionUpdate - Callback when question is updated
 * @param {Function} onSessionUpdate - Callback when session is updated
 */
export const useQnaWebSocket = (shareToken, onQuestionUpdate, onSessionUpdate) => {
  const socketRef = useRef(null);
  const isConnectedRef = useRef(false);

  useEffect(() => {
    if (!shareToken) {
      return;
    }

    // Initialize socket connection
    const socket = io(`${API_URL}/qna`, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    // Connection handlers
    socket.on('connect', () => {
      console.log('Q&A WebSocket connected');
      isConnectedRef.current = true;
      
      // Join the share token room
      socket.emit('join_share_token', { shareToken });
    });

    socket.on('connected', (data) => {
      console.log('Q&A WebSocket connected:', data);
    });

    socket.on('joined', (data) => {
      console.log('Joined Q&A room:', data);
    });

    socket.on('disconnect', () => {
      console.log('Q&A WebSocket disconnected');
      isConnectedRef.current = false;
    });

    socket.on('error', (error) => {
      console.error('Q&A WebSocket error:', error);
    });

    // Question update handlers
    socket.on('question_update', (data) => {
      console.log('Question update received:', data);
      if (onQuestionUpdate) {
        onQuestionUpdate(data);
      }
    });

    // Session update handlers
    socket.on('session_update', (data) => {
      console.log('Session update received:', data);
      if (onSessionUpdate) {
        onSessionUpdate(data);
      }
    });

    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.emit('leave_share_token', { shareToken });
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [shareToken, onQuestionUpdate, onSessionUpdate]);

  return {
    isConnected: isConnectedRef.current,
    socket: socketRef.current,
  };
};

