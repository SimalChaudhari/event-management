import React, { useState, useEffect, useCallback, useRef } from "react";
import { flushSync } from "react-dom";
import { Container, Row, Col, Spinner, Alert } from "react-bootstrap";
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

  useEffect(() => {
    fetchData();
  }, [shareToken, currentPage]);

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
        
        // Only update allQuestionsBySession if the questions actually changed
        const currentQuestions = allQuestionsBySession[session.id] || [];
        const newQuestions = session.questions || [];
        
        // Compare questions by ID and length to detect changes
        if (currentQuestions.length !== newQuestions.length ||
            !currentQuestions.every((q, idx) => q.id === newQuestions[idx]?.id)) {
          newAllQuestions[session.id] = newQuestions;
          hasChanges = true;
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
      if (currentQuestions.length === filteredQuestions.length &&
          currentQuestions.every((q, idx) => q.id === filteredQuestions[idx]?.id)) {
        return prevSessions; // No change, return previous state
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

  const fetchData = async () => {
    try {
      setLoading(true);

      if (!shareToken) {
        toast.error('Share token is required');
        setLoading(false);
        return;
      }

      // Use backend pagination - 1 session per page
      const data = await getTrackQnaByShareLink(shareToken, currentPage, 1);

      if (data.success && data.data) {
        setEvent(data.data.event);
        setTrack(data.data.track);
        setSessions(data.data.sessions || []);
        setPaginationInfo(data.data.pagination || null);
      } else {
        toast.error(data.message || 'Failed to fetch track Q&A data');
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      toast.error("Failed to fetch track Q&A data");
    } finally {
      setLoading(false);
    }
  };

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
    if (!editQuestionText.trim()) {
      toast.error('Please enter question text');
      return;
    }

    setSubmittingEdit(true);
    try {
      const response = await updateQuestionViaShareLink(shareToken, selectedQuestionForEdit.id, {
        question: editQuestionText.trim(),
        status: editQuestionStatus
      });
      
      if (response.success) {
        toast.success('Question updated successfully');
        
        setShowEditModal(false);
        setEditQuestionText('');
        setEditQuestionStatus('');
        setSelectedQuestionForEdit(null);
        setCurrentSessionId(null);
        
        // Refresh data
        fetchData();
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
        
        // Refresh data
        fetchData();
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
        status: 'approval'
      });
      
      if (response.success) {
        toast.success('Question approved successfully');
        
        setShowApproveModal(false);
        setSelectedQuestionForApprove(null);
        
        // Refresh data
        fetchData();
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
        const statusOrder = ['answering', 'answered', 'approval', 'not_answered'];
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
      <Container className="text-center mt-5">
        <Spinner animation="border" />
        <p className="mt-3">Loading track Q&A data...</p>
      </Container>
    );
  }

  if (!track || !sessions.length) {
    return (
      <Container className="mt-5">
        <Alert variant="danger">
          <h5>Access Denied</h5>
          Invalid or expired share link, or no sessions found.
        </Alert>
      </Container>
    );
  }

  // Get current session for pagination (backend returns only current page's sessions)
  const currentSession = sessions[0] || null;
  const totalPages = paginationInfo?.totalPages || 1;
  const hasPrevious = paginationInfo?.hasPreviousPage || false;
  const hasNext = paginationInfo?.hasNextPage || false;

  // Handle page navigation
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Handle previous page
  const handlePrevious = () => {
    if (hasPrevious && currentPage > 1) {
      handlePageChange(currentPage - 1);
    }
  };

  // Handle next page
  const handleNext = () => {
    if (hasNext && currentPage < totalPages) {
      handlePageChange(currentPage + 1);
    }
  };

  // Generate page numbers array with ellipsis
  const getPageNumbers = () => {
    const pages = [];
    const maxPages = totalPages;
    
    if (maxPages <= 7) {
      // Show all pages if 7 or fewer
      for (let i = 1; i <= maxPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);
      
      if (currentPage <= 3) {
        // Near the beginning: 1, 2, 3, 4, ..., last
        for (let i = 2; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('ellipsis');
        pages.push(maxPages);
      } else if (currentPage >= maxPages - 2) {
        // Near the end: 1, ..., last-3, last-2, last-1, last
        pages.push('ellipsis');
        for (let i = maxPages - 3; i <= maxPages; i++) {
          pages.push(i);
        }
      } else {
        // In the middle: 1, ..., current-1, current, current+1, ..., last
        pages.push('ellipsis');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('ellipsis');
        pages.push(maxPages);
      }
    }
    
    return pages;
  };

  // Create a dummy session object for EventInfoSection (it expects session prop)
  const dummySession = {
    title: `${sessions.length} Session${sessions.length > 1 ? 's' : ''}`,
    startTime: sessions[0]?.startTime,
    endTime: sessions[sessions.length - 1]?.endTime
  };

  return (
    <div style={{ backgroundColor: "#f8f9fa", minHeight: "100vh" }}>
      <Container fluid className="py-4 px-3">
        <Row className="justify-content-center">
          <Col xl={10} lg={11} md={12}>
            <EventInfoSection event={event} track={track} session={dummySession} />
            
            {/* Legend */}
            <div className="mb-4">
              <div className="d-flex align-items-center flex-wrap" style={{ gap: "16px" }}>
                <div className="d-flex align-items-center">
                  <div
                    style={{
                      width: "20px",
                      height: "20px",
                      border: "1px solid #ccc",
                      marginRight: "8px",
                      backgroundColor: "white",
                      flexShrink: 0
                    }}
                  ></div>
                  <span style={{ fontSize: "clamp(13px, 2vw, 16px)", whiteSpace: "nowrap" }}>Not Answered</span>
                </div>
                <div className="d-flex align-items-center">
                  <div
                    style={{
                      width: "20px",
                      height: "20px",
                      backgroundColor: "#4E6688",
                      marginRight: "8px",
                      flexShrink: 0
                    }}
                  ></div>
                  <span style={{ fontSize: "clamp(13px, 2vw, 16px)", whiteSpace: "nowrap" }}>Answered</span>
                </div>
                <div className="d-flex align-items-center">
                  <div
                    style={{
                      width: "20px",
                      height: "20px",
                      backgroundColor: "#71C0BB",
                      marginRight: "8px",
                      flexShrink: 0
                    }}
                  ></div>
                  <span style={{ fontSize: "clamp(13px, 2vw, 16px)", whiteSpace: "nowrap" }}>Approval</span>
                </div>
              </div>
            </div>

            {/* Current Session - Show only one session at a time */}
            {currentSession && (() => {
              const filterHandlers = getFilterHandlers(currentSession.id);
              
              return (
                <div>
                  {/* Session Header */}
                  <div style={{ 
                    marginBottom: "20px",
                    padding: "12px 16px",
                    backgroundColor: "#fff",
                    border: "1px solid #D4D6DD",
                    borderRadius: "4px"
                  }}>
                    <h5 style={{ 
                      margin: 0, 
                      fontSize: "clamp(16px, 2vw, 20px)",
                      fontWeight: "600",
                      color: "#000"
                    }}>
                      {currentSession.title}
                    </h5>
                    {currentSession.sessionDate && (
                      <p style={{ 
                        margin: "8px 0 0 0",
                        fontSize: "clamp(12px, 2vw, 14px)",
                        color: "#666"
                      }}>
                        {new Date(currentSession.sessionDate).toLocaleDateString('en-US', { 
                          weekday: 'short', 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                        {currentSession.startTime && currentSession.endTime && (
                          <span> • {currentSession.startTime} - {currentSession.endTime}</span>
                        )}
                      </p>
                    )}
                    {currentSession.statistics && (
                      <div style={{ 
                        marginTop: "8px",
                        display: "flex",
                        gap: "12px",
                        flexWrap: "wrap"
                      }}>
                        <span style={{ fontSize: "clamp(11px, 2vw, 13px)", color: "#666" }}>
                          Total: <strong>{currentSession.statistics.total || 0}</strong>
                        </span>
                        <span style={{ fontSize: "clamp(11px, 2vw, 13px)", color: "#28a745" }}>
                          Answered: <strong>{currentSession.statistics.answered || 0}</strong>
                        </span>
                        <span style={{ fontSize: "clamp(11px, 2vw, 13px)", color: "#ffc107" }}>
                          Unanswered: <strong>{currentSession.statistics.unanswered || 0}</strong>
                        </span>
                        {currentSession.statistics.answering > 0 && (
                          <span style={{ fontSize: "clamp(11px, 2vw, 13px)", color: "#71C0BB" }}>
                            Answering: <strong>{currentSession.statistics.answering || 0}</strong>
                          </span>
                        )}
                        {currentSession.statistics.approval > 0 && (
                          <span style={{ fontSize: "clamp(11px, 2vw, 13px)", color: "#71C0BB" }}>
                            Approval: <strong>{currentSession.statistics.approval || 0}</strong>
                          </span>
                        )}
                      </div>
                    )}
                    
                    {/* Session Share URL Field */}
                    {currentSession.shareLink && currentSession.shareLink.shareUrl && (
                      <div style={{ marginTop: "16px" }}>
                        <p style={{ marginBottom: "8px", fontSize: "clamp(13px, 2vw, 16px)" }}>
                          <strong>Session Share URL:</strong>
                        </p>
                        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                          <input
                            readOnly
                            onClick={() => {
                              navigator.clipboard.writeText(currentSession.shareLink.shareUrl);
                              toast.success('Session URL copied to clipboard!');
                            }}
                            onDoubleClick={() => {
                              navigator.clipboard.writeText(currentSession.shareLink.shareUrl);
                              toast.success('Session URL copied to clipboard!');
                            }}
                            value={currentSession.shareLink.shareUrl}
                            style={{
                              flex: 1,
                              backgroundColor: "#D9D9D9",
                              border: "1px solid #ccc",
                              color: "#000",
                              cursor: "pointer",
                              fontSize: "clamp(12px, 2vw, 14px)",
                              fontWeight: "600",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              padding: "4px 8px",
                              borderRadius: "2px",
                              height: "28px",
                              lineHeight: "20px",
                              userSelect: "none",
                              WebkitUserSelect: "none",
                              MozUserSelect: "none",
                              msUserSelect: "none"
                            }}
                          />
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(currentSession.shareLink.shareUrl);
                              toast.success('Session URL copied to clipboard!');
                            }}
                            style={{
                              backgroundColor: "#71C0BB",
                              color: "white",
                              border: "none",
                              borderRadius: "4px",
                              padding: "4px 12px",
                              cursor: "pointer",
                              fontSize: "clamp(12px, 2vw, 14px)",
                              fontWeight: "500",
                              whiteSpace: "nowrap"
                            }}
                          >
                            <i className="feather icon-copy" style={{ marginRight: "4px" }}></i>
                            Copy
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Questions Table for this session */}
                  <QuestionsTable 
                    questions={currentSession.questions || []} 
                    onAnswer={handleAnswerQuestion}
                    onEdit={(q) => handleEditQuestion(q, currentSession.id)}
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
                </div>
              );
            })()}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div style={{ 
                position: "sticky",
                bottom: "20px",
                display: "flex", 
                justifyContent: "flex-end", 
                alignItems: "center",
                gap: "clamp(4px, 1vw, 8px)",
                marginTop: "40px",
                padding: "12px clamp(8px, 2vw, 16px)",
                flexWrap: "wrap",
                width: "100%",
                maxWidth: "100%",
                boxSizing: "border-box",
                overflow: "hidden",
                zIndex: 100
              }}>
                {/* Previous Button */}
                <button
                  onClick={handlePrevious}
                  disabled={!hasPrevious}
                  style={{
                    backgroundColor: "transparent",
                    color: hasPrevious ? "#666" : "#ccc",
                    border: "none",
                    borderRadius: "6px",
                    padding: "clamp(6px, 1vw, 8px) clamp(8px, 1.5vw, 12px)",
                    fontSize: "clamp(14px, 1.5vw, 18px)",
                    fontWeight: "500",
                    cursor: hasPrevious ? "pointer" : "not-allowed",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all 0.2s ease",
                    minWidth: "clamp(32px, 4vw, 40px)",
                    height: "clamp(32px, 4vw, 40px)",
                    flexShrink: 0
                  }}
                  onMouseEnter={(e) => {
                    if (hasPrevious) {
                      e.target.style.backgroundColor = "#f5f5f5";
                      e.target.style.color = "#333";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (hasPrevious) {
                      e.target.style.backgroundColor = "transparent";
                      e.target.style.color = "#666";
                    }
                  }}
                >
                  <i className="feather icon-chevron-left"></i>
                </button>

                {/* Page Numbers */}
                {getPageNumbers().map((page, index) => {
                  if (page === 'ellipsis') {
                    return (
                      <span 
                        key={`ellipsis-${index}`}
                        style={{
                          padding: "clamp(6px, 1vw, 8px) clamp(2px, 0.5vw, 4px)",
                          color: "#999",
                          fontSize: "clamp(12px, 1.3vw, 16px)",
                          fontWeight: "500",
                          flexShrink: 0
                        }}
                      >
                        ...
                      </span>
                    );
                  }
                  
                  const isActive = page === currentPage;
                  
                  return (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      style={{
                        backgroundColor: isActive ? "#71C0BB" : "transparent",
                        color: isActive ? "white" : "#666",
                        border: "none",
                        borderRadius: "6px",
                        padding: "clamp(6px, 1vw, 8px) clamp(8px, 1.5vw, 12px)",
                        fontSize: "clamp(12px, 1.3vw, 16px)",
                        fontWeight: isActive ? "600" : "500",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: "all 0.2s ease",
                        minWidth: "clamp(32px, 4vw, 40px)",
                        height: "clamp(32px, 4vw, 40px)",
                        boxShadow: isActive ? "0 2px 4px rgba(113, 192, 187, 0.3)" : "none",
                        flexShrink: 0
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) {
                          e.target.style.backgroundColor = "#f5f5f5";
                          e.target.style.color = "#333";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) {
                          e.target.style.backgroundColor = "transparent";
                          e.target.style.color = "#666";
                        }
                      }}
                    >
                      {page}
                    </button>
                  );
                })}

                {/* Next Button */}
                <button
                  onClick={handleNext}
                  disabled={!hasNext}
                  style={{
                    backgroundColor: "transparent",
                    color: hasNext ? "#666" : "#ccc",
                    border: "none",
                    borderRadius: "6px",
                    padding: "clamp(6px, 1vw, 8px) clamp(8px, 1.5vw, 12px)",
                    fontSize: "clamp(14px, 1.5vw, 18px)",
                    fontWeight: "500",
                    cursor: hasNext ? "pointer" : "not-allowed",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all 0.2s ease",
                    minWidth: "clamp(32px, 4vw, 40px)",
                    height: "clamp(32px, 4vw, 40px)",
                    flexShrink: 0
                  }}
                  onMouseEnter={(e) => {
                    if (hasNext) {
                      e.target.style.backgroundColor = "#f5f5f5";
                      e.target.style.color = "#333";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (hasNext) {
                      e.target.style.backgroundColor = "transparent";
                      e.target.style.color = "#666";
                    }
                  }}
                >
                  <i className="feather icon-chevron-right"></i>
                </button>
              </div>
            )}
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
