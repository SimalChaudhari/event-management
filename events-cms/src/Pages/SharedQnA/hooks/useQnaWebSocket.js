import { useEffect, useRef } from 'react';
import io from 'socket.io-client';
import { API_URL } from '../../../configs/env';

/**
 * Custom hook for Q&A WebSocket connection
 * @param {string} shareToken - The share token to join the room for
 * @param {Function} onQuestionUpdate - Callback when question is updated
 * @param {Function} onSessionUpdate - Callback when session is updated
 * @param {Function} onModalStateChange - Callback when modal state changes (open/close)
 */
export const useQnaWebSocket = (shareToken, onQuestionUpdate, onSessionUpdate, onModalStateChange) => {
  const socketRef = useRef(null);
  const isConnectedRef = useRef(false);
  const questionUpdateRef = useRef(onQuestionUpdate);
  const sessionUpdateRef = useRef(onSessionUpdate);
  const modalStateChangeRef = useRef(onModalStateChange);

  useEffect(() => {
    questionUpdateRef.current = onQuestionUpdate;
  }, [onQuestionUpdate]);

  useEffect(() => {
    sessionUpdateRef.current = onSessionUpdate;
  }, [onSessionUpdate]);

  useEffect(() => {
    modalStateChangeRef.current = onModalStateChange;
  }, [onModalStateChange]);

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
      const handler = questionUpdateRef.current;
      if (handler) {
        handler(data);
      }
    });

    // Session update handlers
    socket.on('session_update', (data) => {
      console.log('Session update received:', data);
      const handler = sessionUpdateRef.current;
      if (handler) {
        handler(data);
      }
    });

    // Modal state change handlers
    socket.on('modal_state_change', (data) => {
      console.log('Modal state change received:', data);
      const handler = modalStateChangeRef.current;
      if (handler) {
        handler(data);
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
  }, [shareToken]);

  // Function to emit modal state change
  const emitModalStateChange = (modalType, action, questionData = null) => {
    if (socketRef.current && isConnectedRef.current) {
      socketRef.current.emit('modal_state_change', {
        shareToken,
        modalType, // 'edit', 'delete', 'approve', etc.
        action, // 'open', 'close'
        questionData, // question object if opening
        timestamp: new Date().toISOString()
      });
    }
  };

  return {
    isConnected: isConnectedRef.current,
    socket: socketRef.current,
    emitModalStateChange,
  };
};

