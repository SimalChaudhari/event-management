import React, { useState, useEffect, useCallback, useRef } from "react";
import { flushSync } from "react-dom";
import { 
  Container, 
  Row, 
  Col, 
  Spinner, 
  Alert, 
  Card, 
  Badge, 
  Button,
  FormControl
} from "react-bootstrap";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { API_URL, BASE_URL } from "../../configs/env";
import EventInfoSection from "./components/EventInfoSection";
import QuestionsTable from "./components/QuestionsTable";
import EditQuestionModal from "./components/EditQuestionModal";
import DeleteConfirmationModal from "./components/DeleteConfirmationModal";
import ApproveQuestionModal from "./components/ApproveQuestionModal";
import {
  updateQuestionViaShareLink,
  deleteQuestionViaShareLink,
  generateQuestionShareLink,
  getTrackQnaByShareLink
} from "./components/QnAShareApi";
import { applyFiltersToQuestions } from "./utils/filterUtils";
import { setCookie, getCookie } from "../../utils/cookieUtils";
import { useQnaWebSocket } from "./hooks/useQnaWebSocket";

const TrackQnAShareLinkPage = () => {
  const { shareToken } = useParams();
  
  const [event, setEvent] = useState(null);
  const [track, setTrack] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  
  // Pagination state - restore from cookies if available
  const [currentPage, setCurrentPage] = useState(() => {
    const savedPage = getCookie(`trackQnAPage_${shareToken}`);
    return savedPage ? parseInt(savedPage, 10) : 1;
  });
  const [paginationInfo, setPaginationInfo] = useState(null);
  
  // Question share link state
  const [questionShareUrls, setQuestionShareUrls] = useState({}); // Store URLs by question ID
  const [generatingQuestionLinks, setGeneratingQuestionLinks] = useState({}); // Track loading by question ID
  
  // Filter state per session - store filters for each session
  const [sessionFilters, setSessionFilters] = useState({}); // { sessionId: { voteFilter, statusFilter } }
  const [allQuestionsBySession, setAllQuestionsBySession] = useState({}); // { sessionId: [] }
  const isInitializingRef = useRef(false); // Track if we're initializing from API fetch
  
  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedQuestionForEdit, setSelectedQuestionForEdit] = useState(null);
  const [editQuestionText, setEditQuestionText] = useState('');
  const [editQuestionStatus, setEditQuestionStatus] = useState('');
  const [submittingEdit, setSubmittingEdit] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  
  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedQuestionForDelete, setSelectedQuestionForDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  
  // Approve/Cancel modal state
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [selectedQuestionForApprove, setSelectedQuestionForApprove] = useState(null);
  const [approving, setApproving] = useState(false);

  // Use refs to access latest state in callbacks
  const questionShareUrlsRef = useRef({});
  const generatingQuestionLinksRef = useRef({});
  
  // Keep refs in sync with state
  useEffect(() => {
    questionShareUrlsRef.current = questionShareUrls;
    generatingQuestionLinksRef.current = generatingQuestionLinks;
  }, [questionShareUrls, generatingQuestionLinks]);

  // Define fetchData before using it in useEffect
  const fetchData = useCallback(async (isInitialLoad = false) => {
    try {
      // Only show loading spinner on initial load
      if (isInitialLoad) {
        setLoading(true);
      }

      if (!shareToken) {
        if (isInitialLoad) {
          toast.error('Share token is required');
          setLoading(false);
        }
        return;
      }

      // Fetch all sessions at once
      const data = await getTrackQnaByShareLink(shareToken, 1, 1000);

      if (data.success && data.data) {
        setEvent(data.data.event);
        setTrack(data.data.track);
        setSessions(data.data.sessions || []);
        setPaginationInfo(data.data.pagination || null);
      } else {
        if (isInitialLoad) {
          toast.error(data.message || 'Failed to fetch track Q&A data');
        }
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      if (isInitialLoad) {
        toast.error("Failed to fetch track Q&A data");
      }
    } finally {
      if (isInitialLoad) {
        setLoading(false);
      }
    }
  }, [shareToken]);

  // WebSocket handlers with direct state update (no API call needed)
  const handleQuestionUpdate = useCallback((data) => {
    console.log('Question update received in TrackQnAShareLinkPage:', data);
    console.log('Data structure check:', {
      hasData: !!data,
      hasDataData: !!(data && data.data),
      hasType: !!(data && data.type),
      type: data?.type,
      eventData: data?.data
    });
    
    if (!data || !data.data || !data.type) {
      console.warn('Question update data structure is invalid, falling back to API call');
      // Fallback to API call if data structure is unexpected
      fetchData(false);
      return;
    }

    const { type, data: eventData } = data;
    const question = eventData?.question;
    const sessionId = eventData?.sessionId;

    console.log('Extracted from WebSocket:', { type, hasQuestion: !!question, sessionId });

    if (!question || !sessionId) {
      console.warn('Question or sessionId missing in WebSocket data, falling back to API call');
      // If question or sessionId is missing, fallback to API call
      fetchData(false);
      return;
    }

    console.log('Proceeding with direct state update for type:', type);

    // Direct state update based on event type
    // Note: Filter reapplication will happen automatically via useEffect when allQuestionsBySession changes
    if (type === 'question_created') {
      console.log('Processing question_created:', question);
      // Add new question to the correct session
      setAllQuestionsBySession(prev => {
        const sessionQuestions = prev[sessionId] || [];
        // Check if question already exists (avoid duplicates)
        const exists = sessionQuestions.some(q => q.id === question.id);
        if (exists) {
          console.log('Question already exists, skipping duplicate');
          return prev; // Question already exists
        }
        // Ensure question has all required fields with defaults
        const formattedQuestion = {
          ...question,
          status: question.status || 'not_answered',
          likesCount: question.likesCount || 0,
          isPinned: question.isPinned || false,
          isActive: question.isActive !== undefined ? question.isActive : true,
        };
        console.log('Adding new question to state (direct update, no API call):', formattedQuestion);
        // Add new question at the beginning (newest first)
        return {
          ...prev,
          [sessionId]: [formattedQuestion, ...sessionQuestions]
        };
      });
    } else if (type === 'question_updated') {
      // Update existing question in the correct session
      setAllQuestionsBySession(prev => {
        const sessionQuestions = prev[sessionId] || [];
        // Only update if question exists in this session
        if (sessionQuestions.some(q => q.id === question.id)) {
          const updated = sessionQuestions.map(q => 
            q.id === question.id ? { ...q, ...question } : q
          );
          return {
            ...prev,
            [sessionId]: updated
          };
        }
        return prev;
      });
    } else if (type === 'question_deleted') {
      // Remove question from the correct session
      setAllQuestionsBySession(prev => {
        const sessionQuestions = prev[sessionId] || [];
        return {
          ...prev,
          [sessionId]: sessionQuestions.filter(q => q.id !== question.id)
        };
      });
    } else if (type === 'question_answered') {
      // Update question status to answered
      setAllQuestionsBySession(prev => {
        const sessionQuestions = prev[sessionId] || [];
        return {
          ...prev,
          [sessionId]: sessionQuestions.map(q => 
            q.id === question.id ? { ...q, status: question.status || 'answered', ...question } : q
          )
        };
      });
    } else {
      // Unknown event type, fallback to API call
      fetchData(false);
    }
  }, [fetchData]);

  const handleSessionUpdate = useCallback((data) => {
    console.log('Session update received in TrackQnAShareLinkPage:', data);
    // Session updates usually happen after question updates
    // If question_update already handled the state update, we don't need to fetch
    // Only fetch if it's a pure session update (like statistics change without question change)
    // For now, skip API call to avoid unnecessary refresh after question creation
    // fetchData(false);
  }, []);

  // Set up WebSocket connection
  useQnaWebSocket(shareToken, handleQuestionUpdate, handleSessionUpdate);

  useEffect(() => {
    // Initial load with loading spinner
    fetchData(true);
  }, [shareToken, fetchData]);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 425);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Initialize filters for each session and store original questions
  useEffect(() => {
    if (sessions.length > 0) {
      const newFilters = {};
      const newAllQuestions = {};
      let hasChanges = false;
      
      sessions.forEach(session => {
        // Only initialize filter if it doesn't exist
        if (!sessionFilters[session.id]) {
          newFilters[session.id] = {
            voteFilter: null,
            statusFilter: null
          };
          hasChanges = true;
        }
        
        // Update allQuestionsBySession if the questions actually changed
        const currentQuestions = allQuestionsBySession[session.id] || [];
        const newQuestions = session.questions || [];
        
        // Create sets of question IDs for proper comparison (order-independent)
        const currentQuestionIds = new Set(currentQuestions.map(q => q.id));
        const newQuestionIds = new Set(newQuestions.map(q => q.id));
        
        // Check if questions changed (new questions, removed questions, or data changes)
        const questionsChanged = 
          currentQuestionIds.size !== newQuestionIds.size ||
          ![...currentQuestionIds].every(id => newQuestionIds.has(id)) ||
          ![...newQuestionIds].every(id => currentQuestionIds.has(id)) ||
          // Also check if any existing question data changed
          currentQuestions.some(currentQ => {
            const newQ = newQuestions.find(q => q.id === currentQ.id);
            if (!newQ) return true; // Question was removed
            // Compare important fields
            return currentQ.status !== newQ.status ||
                   currentQ.likesCount !== newQ.likesCount ||
                   currentQ.question !== newQ.question;
          });
        
        if (questionsChanged) {
          // Always update with fresh questions from API
          newAllQuestions[session.id] = [...newQuestions];
          hasChanges = true;
          console.log(`Questions updated for session ${session.id}:`, {
            oldCount: currentQuestions.length,
            newCount: newQuestions.length,
            oldIds: [...currentQuestionIds],
            newIds: [...newQuestionIds]
          });
        }
      });
      
      if (hasChanges) {
        if (Object.keys(newFilters).length > 0) {
          setSessionFilters(prev => ({ ...prev, ...newFilters }));
        }
        if (Object.keys(newAllQuestions).length > 0) {
          setAllQuestionsBySession(prev => ({ ...prev, ...newAllQuestions }));
        }
      }
    }
  }, [sessions]);

  // Apply filters to questions for each session
  const applyFiltersForSession = useCallback((sessionId, filters, allQuestions) => {
    const filteredQuestions = applyFiltersToQuestions(allQuestions, filters.voteFilter, filters.statusFilter);
    
    // Update session questions only if they're different
    setSessions(prevSessions => {
      const currentSession = prevSessions.find(s => s.id === sessionId);
      if (!currentSession) return prevSessions;
      
      // Check if questions are actually different
      const currentQuestions = currentSession.questions || [];
      const hasChanges =
        currentQuestions.length !== filteredQuestions.length ||
        currentQuestions.some((q, idx) => {
          const newQuestion = filteredQuestions[idx];
          if (!newQuestion) return true;
          
          return (
            q.id !== newQuestion.id ||
            q.likesCount !== newQuestion.likesCount ||
            q.status !== newQuestion.status ||
            q.question !== newQuestion.question ||
            q.isPinned !== newQuestion.isPinned ||
            q.isActive !== newQuestion.isActive
          );
        });
      
      if (!hasChanges) {
        return prevSessions; // No change detected
      }
      
      return prevSessions.map(s => 
        s.id === sessionId ? { ...s, questions: filteredQuestions } : s
      );
    });
  }, []);

  // Apply filters when they change
  useEffect(() => {
    Object.keys(sessionFilters).forEach(sessionId => {
      const filters = sessionFilters[sessionId] || { voteFilter: null, statusFilter: null };
      const allQuestions = allQuestionsBySession[sessionId] || [];
      if (allQuestions.length > 0 || Object.keys(sessionFilters).length > 0) {
        applyFiltersForSession(sessionId, filters, allQuestions);
      }
    });
  }, [sessionFilters, allQuestionsBySession, applyFiltersForSession]);

  // Save current page to cookies when it changes
  useEffect(() => {
    if (currentPage > 0) {
      setCookie(`trackQnAPage_${shareToken}`, currentPage.toString());
    }
  }, [currentPage, shareToken]);


  // Handle generate question share link
  const handleGenerateQuestionLink = useCallback(async (question) => {
    const existingUrl = questionShareUrlsRef.current[question.id];
    if (existingUrl) {
      return;
    }

    if (generatingQuestionLinksRef.current[question.id]) {
      return;
    }

    setGeneratingQuestionLinks(prev => ({ ...prev, [question.id]: true }));
    
    try {
      const response = await generateQuestionShareLink(question.id);
      
      if (response.success && response.data?.shareUrl) {
        const shareUrl = response.data.shareUrl;
        flushSync(() => {
          setQuestionShareUrls(prev => ({ ...prev, [question.id]: shareUrl }));
        });
      } else {
        toast.error(response.message || 'Failed to generate question link');
      }
    } catch (error) {
      console.error('Error generating question link:', error);
      toast.error('Failed to generate question link');
    } finally {
      setGeneratingQuestionLinks(prev => ({ ...prev, [question.id]: false }));
    }
  }, []);

  // Handle edit question
  const handleEditQuestion = (question, sessionId) => {
    setSelectedQuestionForEdit(question);
    setEditQuestionText(question.question);
    setEditQuestionStatus(question.status || 'not_answered');
    setCurrentSessionId(sessionId);
    setShowEditModal(true);
  };

  // Handle edit submission
  const handleSubmitEdit = async () => {
    // Validate question text if status is not_answered
    if (editQuestionStatus === 'not_answered' && !editQuestionText.trim()) {
      toast.error('Please enter question text');
      return;
    }

    setSubmittingEdit(true);
    try {
      const updateData = {
        status: editQuestionStatus
      };
      
      // Only include question text if status is not_answered (editable)
      if (editQuestionStatus === 'not_answered') {
        updateData.question = editQuestionText.trim();
      }
      
      const response = await updateQuestionViaShareLink(shareToken, selectedQuestionForEdit.id, updateData);
      
      if (response.success) {
        toast.success('Question updated successfully');
        
        setShowEditModal(false);
        setEditQuestionText('');
        setEditQuestionStatus('');
        setSelectedQuestionForEdit(null);
        setCurrentSessionId(null);
        
        // Refresh data immediately (without loading spinner)
        await fetchData(false);
      } else {
        toast.error(response.message || 'Failed to update question');
      }
    } catch (error) {
      console.error('Error updating question:', error);
      toast.error('Failed to update question');
    } finally {
      setSubmittingEdit(false);
    }
  };

  // Handle close edit modal
  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditQuestionText('');
    setEditQuestionStatus('');
    setSelectedQuestionForEdit(null);
    setCurrentSessionId(null);
  };

  // Handle delete question click
  const handleDeleteQuestionClick = (questionId) => {
    const allQuestions = sessions.flatMap(s => s.questions || []);
    const question = allQuestions.find(q => q.id === questionId);
    if (question) {
      setSelectedQuestionForDelete(question);
      setShowDeleteModal(true);
    }
  };

  // Handle delete confirmation
  const handleConfirmDelete = async () => {
    if (!selectedQuestionForDelete) {
      return;
    }

    setDeleting(true);
    try {
      const response = await deleteQuestionViaShareLink(shareToken, selectedQuestionForDelete.id);
      
      if (response.success) {
        toast.success('Question deleted successfully');
        
        setShowDeleteModal(false);
        setSelectedQuestionForDelete(null);
        
        // Refresh data immediately (without loading spinner)
        await fetchData(false);
      } else {
        toast.error(response.message || 'Failed to delete question');
      }
    } catch (error) {
      console.error('Error deleting question:', error);
      toast.error('Failed to delete question');
    } finally {
      setDeleting(false);
    }
  };

  // Handle close delete modal
  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false);
    setSelectedQuestionForDelete(null);
  };

  // Handle answer question click - show approve/cancel modal
  const handleAnswerQuestion = (question) => {
    // Only show modal if question is not_answered
    if (question.status === 'not_answered' || !question.status) {
      setSelectedQuestionForApprove(question);
      setShowApproveModal(true);
    } else {
      toast.info('Question is already answered or being answered');
    }
  };

  // Handle approve question
  const handleApproveQuestion = async () => {
    if (!selectedQuestionForApprove) {
      return;
    }

    setApproving(true);
    try {
      const response = await updateQuestionViaShareLink(shareToken, selectedQuestionForApprove.id, {
        status: 'approved'
      });
      
      if (response.success) {
        toast.success('Question approved successfully');
        
        setShowApproveModal(false);
        setSelectedQuestionForApprove(null);
        
        // Refresh data immediately (without loading spinner)
        await fetchData(false);
      } else {
        toast.error(response.message || 'Failed to approve question');
      }
    } catch (error) {
      console.error('Error approving question:', error);
      toast.error('Failed to approve question');
    } finally {
      setApproving(false);
    }
  };

  // Handle cancel approve
  const handleCancelApprove = () => {
    // Just close the modal, status remains not_answered
    setShowApproveModal(false);
    setSelectedQuestionForApprove(null);
  };

  // Get filter handlers for a specific session
  const getFilterHandlers = (sessionId) => {
    const filters = sessionFilters[sessionId] || { voteFilter: null, statusFilter: null };
    const allQuestions = allQuestionsBySession[sessionId] || [];

    return {
      voteFilter: filters.voteFilter,
      statusFilter: filters.statusFilter,
      onVoteFilterClick: () => {
        setSessionFilters(prev => ({
          ...prev,
          [sessionId]: {
            ...prev[sessionId],
            voteFilter: prev[sessionId]?.voteFilter === null 
              ? 'desc' 
              : prev[sessionId]?.voteFilter === 'desc' 
                ? 'asc' 
                : 'desc',
            statusFilter: null // Reset status filter when clicking vote filter
          }
        }));
      },
      onStatusFilterClick: () => {
        const availableStatuses = [...new Set(allQuestions.map(q => q.status))];
        const statusOrder = ['answered', 'approved', 'not_answered'];
        const validStatuses = statusOrder.filter(status => availableStatuses.includes(status));
        
        const currentStatus = filters.statusFilter;
        let nextStatus = null;
        
        if (currentStatus === null) {
          nextStatus = validStatuses[0] || null;
        } else {
          const currentIndex = validStatuses.indexOf(currentStatus);
          if (currentIndex !== -1 && currentIndex < validStatuses.length - 1) {
            nextStatus = validStatuses[currentIndex + 1];
          } else {
            nextStatus = validStatuses[0] || null;
          }
        }
        
        setSessionFilters(prev => ({
          ...prev,
          [sessionId]: {
            ...prev[sessionId],
            statusFilter: nextStatus,
            voteFilter: null // Reset vote filter when clicking status filter
          }
        }));
      },
      onResetFilters: () => {
        setSessionFilters(prev => ({
          ...prev,
          [sessionId]: {
            voteFilter: null,
            statusFilter: null
          }
        }));
      },
      onVoteFilterReset: () => {
        setSessionFilters(prev => ({
          ...prev,
          [sessionId]: {
            ...prev[sessionId],
            voteFilter: null
          }
        }));
      },
      onStatusFilterReset: () => {
        setSessionFilters(prev => ({
          ...prev,
          [sessionId]: {
            ...prev[sessionId],
            statusFilter: null
          }
        }));
      }
    };
  };

  if (loading) {
    return (
      <div style={{ 
        backgroundColor: "#f8f9fa", 
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      }}>
        <Container>
          <div className="text-center py-5">
            <Spinner 
              animation="border" 
              variant="primary" 
              style={{ width: "3rem", height: "3rem", borderWidth: "0.3rem" }}
            />
            <h5 className="mt-4 mb-2" style={{ color: "#495057", fontWeight: 500 }}>
              Loading Track Q&A Data
            </h5>
            <p className="text-muted mb-0" style={{ fontSize: "0.95rem" }}>
              Please wait while we fetch the information...
            </p>
          </div>
        </Container>
      </div>
    );
  }

  if (!track || !sessions.length) {
    return (
      <div style={{ backgroundColor: "#f8f9fa", minHeight: "100vh" }}>
        <Container className="py-5">
          <Row className="justify-content-center">
            <Col xs={12} sm={10} md={8} lg={6}>
              <Card className="border-0 shadow-sm">
                <Card.Body className="p-4 text-center">
                  <div className="mb-3">
                    <i 
                      className="feather icon-alert-circle" 
                      style={{ fontSize: "4rem", color: "#dc3545" }}
                    ></i>
                  </div>
                  <Alert variant="danger" className="mb-0">
                    <Alert.Heading className="h5 mb-2">Access Denied</Alert.Heading>
                    <p className="mb-0" style={{ fontSize: "0.95rem" }}>
                      Invalid or expired share link, or no sessions found.
                    </p>
                  </Alert>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>
    );
  }

  // Display all sessions

  // Create a dummy session object for EventInfoSection (it expects session prop)
  const dummySession = {
    title: `${sessions.length} Session${sessions.length > 1 ? 's' : ''}`,
    startTime: sessions[0]?.startTime,
    endTime: sessions[sessions.length - 1]?.endTime
  };

  return (
    <div style={{ backgroundColor: "#f8f9fa", minHeight: "100vh" }}>
      {/* Real-time indicator */}
      <div style={{
        position: "fixed",
        top: "10px",
        right: "10px",
        zIndex: 1000,
        backgroundColor: "rgba(113, 192, 187, 0.9)",
        color: "white",
        padding: "4px 12px",
        borderRadius: "20px",
        fontSize: "0.75rem",
        fontWeight: 500,
        display: "flex",
        alignItems: "center",
        gap: "6px",
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.2)"
      }}>
        <div style={{
          width: "8px",
          height: "8px",
          borderRadius: "50%",
          backgroundColor: "#4ade80",
          animation: "pulse 2s infinite"
        }}></div>
        <span>Live Updates</span>
      </div>
      <style>
        {`
          @media (max-width: 576px) {
            .card-body {
              padding: 1rem !important;
            }
            .badge {
              font-size: 0.75rem !important;
              padding: 0.375rem 0.75rem !important;
            }
            h4 {
              font-size: 1.25rem !important;
            }
          }
          .shadow-sm {
            box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075) !important;
          }
          .card {
            transition: box-shadow 0.15s ease-in-out, transform 0.2s ease;
          }
          .card:hover {
            box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15) !important;
            transform: translateY(-2px);
          }
          .gradient-bg-1 {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          }
          .gradient-bg-2 {
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
          }
          .gradient-bg-3 {
            background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
          }
          .gradient-bg-4 {
            background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
          }
          @keyframes pulse {
            0%, 100% {
              opacity: 1;
              transform: scale(1);
            }
            50% {
              opacity: 0.5;
              transform: scale(0.8);
            }
          }
        `}
      </style>
      <Container fluid className="py-4 px-3">
        <Row className="justify-content-center">
          <Col xl={10} lg={11} md={12}>
            {/* Event Info Section */}
            <Card className="mb-4 border-0 shadow-lg" style={{ 
              background: "linear-gradient(135deg, #71C0BB 0%, #5a9a96 100%)",
              borderRadius: "12px",
              overflow: "hidden"
            }}>
              <Card.Body style={{ padding: 0 }}>
                {/* Header */}
                <div style={{
                  padding: "clamp(8px, 2vw, 12px) clamp(12px, 2.5vw, 16px)"
                }}>
                  <div className="d-flex align-items-center">
                    <i className="feather icon-info mr-2" style={{ fontSize: "clamp(1.2rem, 2.5vw, 1.4rem)", color: "#ffffff" }}></i>
                    <h3 className="mb-0" style={{ fontWeight: 700, fontSize: "clamp(1.2rem, 2.5vw, 1.5rem)", color: "#ffffff" }}>
                      Event Information
                    </h3>
                  </div>
                </div>
                {/* Content section */}
                <div style={{ 
                  padding: "clamp(8px, 2vw, 12px) 16px clamp(8px, 2vw, 12px) 16px", 
                  backgroundColor: "#ffffff",
                  borderRadius: "0 0 12px 12px"
                }}>
                  <EventInfoSection event={event} track={track} session={dummySession} />
                </div>
              </Card.Body>
            </Card>
            {/* All Sessions - Display all sessions */}
            {sessions.map((session, index) => {
              const filterHandlers = getFilterHandlers(session.id);
              
              return (
                <div key={session.id} className="mb-5">
                  {/* Session Header Card */}
                  <Card className="mb-4 border-0 shadow-lg" style={{ 
                    background: "linear-gradient(135deg, #71C0BB 0%, #5a9a96 100%)",
                    borderRadius: "12px",
                    overflow: "hidden"
                  }}>
                    <Card.Body style={{ padding: 0 }}>
                      {/* Session Title */}
                      <div>
                        <div className="d-flex align-items-center" style={{
                          padding: "clamp(8px, 2vw, 12px) clamp(12px, 2.5vw, 16px) 0 clamp(12px, 2.5vw, 16px)"
                        }}>
                          <i className="feather icon-video mr-2" style={{ 
                            fontSize: "clamp(1.2rem, 2.5vw, 1.5rem)", 
                            color: "#ffffff" 
                          }}></i>
                          <h4 className="mb-0" style={{ 
                            fontSize: "clamp(1.2rem, 2.5vw, 1.5rem)",
                            fontWeight: 700,
                            color: "#ffffff",
                            lineHeight: 1.3
                          }}>
                            Session {index + 1}
                          </h4>
                        </div>
                        {/* Separator Line */}
                        <div style={{
                          height: "2px",
                          background: "rgba(255, 255, 255, 0.3)",
                          marginBottom: "clamp(8px, 1.5vw, 12px)",
                          marginTop: "clamp(8px, 2vw, 12px)",
                          marginLeft: "clamp(12px, 2.5vw, 16px)",
                          marginRight: "clamp(12px, 2.5vw, 16px)",
                          borderRadius: "1px"
                        }}></div>
                        {/* Session Title Below Divider */}
                        <div style={{
                          padding: "0 clamp(12px, 2.5vw, 16px) clamp(8px, 2vw, 12px) clamp(12px, 2.5vw, 16px)"
                        }}>
                          <h5 className="mb-2" style={{
                            fontSize: "clamp(0.95rem, 1.9vw, 1.15rem)",
                            fontWeight: 700,
                            color: "#ffffff",
                            lineHeight: 1.5
                          }}>
                            {session.title}
                          </h5>
                          {/* Session Time Below Title */}
                          {session.startTime && session.endTime && (
                            <div className="d-flex align-items-center" style={{
                              color: "#ffffff",
                              fontSize: "clamp(0.85rem, 1.7vw, 1rem)",
                              fontWeight: 600
                            }}>
                              <i className="feather icon-clock mr-2" style={{ 
                                fontSize: "clamp(0.85rem, 1.7vw, 1rem)",
                                color: "#ffffff"
                              }}></i>
                              <span>{session.startTime} - {session.endTime}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Statistics */}
                      {session.statistics && (
                        <div style={{ 
                          padding: "0 clamp(12px, 2.5vw, 16px) clamp(12px, 2vw, 16px) clamp(12px, 2.5vw, 16px)"
                        }}>
                          <div className="d-flex flex-wrap align-items-center" style={{ gap: "clamp(0.5rem, 2vw, 1rem)" }}>
                            <Badge 
                              style={{ 
                                fontSize: "clamp(0.75rem, 1.8vw, 0.95rem)", 
                                fontWeight: 600,
                                backgroundColor: "rgba(255, 255, 255, 0.25)",
                                color: "white",
                                border: "2px solid rgba(255, 255, 255, 0.4)",
                                borderRadius: "8px",
                                padding: "clamp(0.4rem, 1.5vw, 0.5rem) clamp(0.75rem, 2vw, 1rem)"
                              }}
                            >
                              <i className="feather icon-list mr-2" style={{ fontSize: "clamp(0.75rem, 1.8vw, 0.95rem)" }}></i>
                              Total: <strong>{session.statistics.total || 0}</strong>
                            </Badge>
                            <Badge 
                              style={{ 
                                fontSize: "clamp(0.75rem, 1.8vw, 0.95rem)", 
                                fontWeight: 600,
                                backgroundColor: "rgba(255, 255, 255, 0.25)",
                                color: "white",
                                border: "2px solid rgba(255, 255, 255, 0.4)",
                                borderRadius: "8px",
                                padding: "clamp(0.4rem, 1.5vw, 0.5rem) clamp(0.75rem, 2vw, 1rem)"
                              }}
                            >
                              <i className="feather icon-check-circle mr-2" style={{ fontSize: "clamp(0.75rem, 1.8vw, 0.95rem)" }}></i>
                              Answered: <strong>{session.statistics.answered || 0}</strong>
                            </Badge>
                            <Badge 
                              style={{ 
                                fontSize: "clamp(0.75rem, 1.8vw, 0.95rem)", 
                                fontWeight: 600,
                                backgroundColor: "rgba(255, 255, 255, 0.25)",
                                color: "white",
                                border: "2px solid rgba(255, 255, 255, 0.4)",
                                borderRadius: "8px",
                                padding: "clamp(0.4rem, 1.5vw, 0.5rem) clamp(0.75rem, 2vw, 1rem)"
                              }}
                            >
                              <i className="feather icon-alert-circle mr-2" style={{ fontSize: "clamp(0.75rem, 1.8vw, 0.95rem)" }}></i>
                              Unanswered: <strong>{session.statistics.unanswered || 0}</strong>
                            </Badge>
                            {session.statistics.approved > 0 && (
                              <Badge 
                                style={{ 
                                  fontSize: "clamp(0.75rem, 1.8vw, 0.95rem)",
                                  fontWeight: 600,
                                  backgroundColor: "rgba(255, 255, 255, 0.25)",
                                  color: "white",
                                  border: "2px solid rgba(255, 255, 255, 0.4)",
                                  borderRadius: "8px",
                                  padding: "clamp(0.4rem, 1.5vw, 0.5rem) clamp(0.75rem, 2vw, 1rem)"
                                }}
                              >
                                <i className="feather icon-check-circle mr-2" style={{ fontSize: "clamp(0.75rem, 1.8vw, 0.95rem)" }}></i>
                                Approved: <strong>{session.statistics.approved || 0}</strong>
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {/* Session Share URL Field */}
                      {session.shareLink && session.shareLink.shareUrl && (
                        <div style={{ 
                          borderTop: "2px solid rgba(255, 255, 255, 0.3)",
                          background: "linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%)",
                          margin: "clamp(8px, 2vw, 12px) clamp(12px, 2.5vw, 16px)",
                          borderRadius: "8px",
                          padding: "clamp(12px, 2vw, 16px)"
                        }}>
                          <div className="d-flex align-items-center mb-2">
                            <i className="feather icon-link mr-2" style={{ 
                              fontSize: "clamp(1.2rem, 2.5vw, 1.5rem)", 
                              color: "#666666" 
                            }}></i>
                            <label className="mb-0" style={{ 
                              fontSize: "clamp(1.2rem, 2.5vw, 1.5rem)", 
                              fontWeight: 700,
                              color: "#666666"
                            }}>
                              Session Share URL
                            </label>
                          </div>
                          <div className="d-flex">
                            <FormControl
                              readOnly
                              onClick={() => {
                                navigator.clipboard.writeText(session.shareLink.shareUrl);
                                toast.success('Session URL copied to clipboard!');
                              }}
                              value={session.shareLink.shareUrl}
                              style={{
                                backgroundColor: "#ffffff",
                                border: "2px solid #d0d0d0",
                                cursor: "pointer",
                                fontSize: "clamp(0.85rem, 1.8vw, 0.95rem)",
                                fontWeight: 500,
                                borderRight: "none",
                                borderTopRightRadius: 0,
                                borderBottomRightRadius: 0,
                                color: "#333333"
                              }}
                            />
                            <Button
                              variant="primary"
                              onClick={() => {
                                navigator.clipboard.writeText(session.shareLink.shareUrl);
                                toast.success('Session URL copied to clipboard!');
                              }}
                              style={{
                                background: "linear-gradient(135deg, #71C0BB 0%, #5a9a96 100%)",
                                border: "2px solid #d0d0d0",
                                borderLeft: "none",
                                fontWeight: 600,
                                borderTopLeftRadius: 0,
                                borderBottomLeftRadius: 0,
                                color: "white",
                                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
                                fontSize: "clamp(0.85rem, 1.8vw, 0.95rem)"
                              }}
                            >
                              <i className="feather icon-copy mr-2" style={{ fontSize: "clamp(0.85rem, 1.8vw, 0.95rem)" }}></i>
                              Copy
                            </Button>
                          </div>
                        </div>
                      )}
                    </Card.Body>
                  </Card>

                  {/* Questions Table Card */}
                  <Card className="mb-4 border-0 shadow-sm">
                    <Card.Body className="p-0">
                      <QuestionsTable 
                        questions={session.questions || []} 
                        onAnswer={handleAnswerQuestion}
                        onEdit={(q) => handleEditQuestion(q, session.id)}
                        onDelete={handleDeleteQuestionClick}
                        onGenerateLink={handleGenerateQuestionLink}
                        voteFilterActive={filterHandlers.voteFilter}
                        statusFilterValue={filterHandlers.statusFilter}
                        onVoteFilterClick={filterHandlers.onVoteFilterClick}
                        onStatusFilterClick={filterHandlers.onStatusFilterClick}
                        onResetFilters={filterHandlers.onResetFilters}
                        onVoteFilterReset={filterHandlers.onVoteFilterReset}
                        onStatusFilterReset={filterHandlers.onStatusFilterReset}
                      />
                    </Card.Body>
                  </Card>
                </div>
              );
            })}

          </Col>
        </Row>
      </Container>

      {/* Edit Modal */}
      <EditQuestionModal
        show={showEditModal}
        onHide={handleCloseEditModal}
        question={selectedQuestionForEdit}
        editQuestionText={editQuestionText}
        setEditQuestionText={setEditQuestionText}
        editQuestionStatus={editQuestionStatus}
        setEditQuestionStatus={setEditQuestionStatus}
        onSubmit={handleSubmitEdit}
        onDelete={handleDeleteQuestionClick}
        submitting={submittingEdit}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        show={showDeleteModal}
        onHide={handleCloseDeleteModal}
        question={selectedQuestionForDelete}
        onConfirm={handleConfirmDelete}
        deleting={deleting}
      />

      {/* Approve/Cancel Modal */}
      <ApproveQuestionModal
        show={showApproveModal}
        onHide={handleCancelApprove}
        question={selectedQuestionForApprove}
        onApprove={handleApproveQuestion}
        onCancel={handleCancelApprove}
        approving={approving}
      />
    </div>
  );
};

export default TrackQnAShareLinkPage;
