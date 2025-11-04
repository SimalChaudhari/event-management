import React, { useState, useEffect, useCallback, useRef } from "react";
import { flushSync } from "react-dom";
import { Container, Row, Col, Spinner, Alert, Modal, Button } from "react-bootstrap";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { API_URL, BASE_URL } from "../../configs/env";
import EventInfoSection from "./components/EventInfoSection";
import QuestionsTable from "./components/QuestionsTable";
import EditQuestionModal from "./components/EditQuestionModal";
import DeleteConfirmationModal from "./components/DeleteConfirmationModal";
import {
  updateQuestionViaShareLink,
  deleteQuestionViaShareLink,
  generateQuestionShareLink
} from "./components/QnAShareApi";
import { applyFiltersToQuestions } from "./utils/filterUtils";

const TrackQnAShareLinkPage = () => {
  const { shareToken } = useParams();
  
  const [event, setEvent] = useState(null);
  const [track, setTrack] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  
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
  }, [shareToken]);

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

      const response = await fetch(`${API_URL}/api/engagements/qna/track/${shareToken}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success && data.data) {
        setEvent(data.data.event);
        setTrack(data.data.track);
        setSessions(data.data.sessions || []);
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

            {/* Multiple Sessions - Each with its own table */}
            {sessions.map((session, index) => {
              const filterHandlers = getFilterHandlers(session.id);
              
              return (
                <div key={session.id} style={{ marginBottom: index < sessions.length - 1 ? "40px" : "20px" }}>
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
                      {session.title}
                    </h5>
                    {session.sessionDate && (
                      <p style={{ 
                        margin: "8px 0 0 0",
                        fontSize: "clamp(12px, 2vw, 14px)",
                        color: "#666"
                      }}>
                        {new Date(session.sessionDate).toLocaleDateString('en-US', { 
                          weekday: 'short', 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                        {session.startTime && session.endTime && (
                          <span> • {session.startTime} - {session.endTime}</span>
                        )}
                      </p>
                    )}
                    {session.statistics && (
                      <div style={{ 
                        marginTop: "8px",
                        display: "flex",
                        gap: "12px",
                        flexWrap: "wrap"
                      }}>
                        <span style={{ fontSize: "clamp(11px, 2vw, 13px)", color: "#666" }}>
                          Total: <strong>{session.statistics.total || 0}</strong>
                        </span>
                        <span style={{ fontSize: "clamp(11px, 2vw, 13px)", color: "#28a745" }}>
                          Answered: <strong>{session.statistics.answered || 0}</strong>
                        </span>
                        <span style={{ fontSize: "clamp(11px, 2vw, 13px)", color: "#ffc107" }}>
                          Unanswered: <strong>{session.statistics.unanswered || 0}</strong>
                        </span>
                        {session.statistics.answering > 0 && (
                          <span style={{ fontSize: "clamp(11px, 2vw, 13px)", color: "#71C0BB" }}>
                            Answering: <strong>{session.statistics.answering || 0}</strong>
                          </span>
                        )}
                        {session.statistics.approval > 0 && (
                          <span style={{ fontSize: "clamp(11px, 2vw, 13px)", color: "#71C0BB" }}>
                            Approval: <strong>{session.statistics.approval || 0}</strong>
                          </span>
                        )}
                      </div>
                    )}
                    
                    {/* Session Share URL Field */}
                    {session.shareLink && session.shareLink.shareUrl && (
                      <div style={{ marginTop: "16px" }}>
                        <p style={{ marginBottom: "8px", fontSize: "clamp(13px, 2vw, 16px)" }}>
                          <strong>Session Share URL:</strong>
                        </p>
                        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                          <input
                            readOnly
                            onClick={() => {
                              navigator.clipboard.writeText(session.shareLink.shareUrl);
                              toast.success('Session URL copied to clipboard!');
                            }}
                            onDoubleClick={() => {
                              navigator.clipboard.writeText(session.shareLink.shareUrl);
                              toast.success('Session URL copied to clipboard!');
                            }}
                            value={session.shareLink.shareUrl}
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
                              navigator.clipboard.writeText(session.shareLink.shareUrl);
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
      <Modal show={showApproveModal} onHide={handleCancelApprove} centered>
        <Modal.Header closeButton>
          <Modal.Title>Approve Question</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedQuestionForApprove && (
            <div>
              <p style={{ marginBottom: "16px", fontSize: "16px" }}>
                <strong>Question:</strong>
              </p>
              <p style={{ 
                marginBottom: "20px", 
                padding: "12px",
                backgroundColor: "#f8f9fa",
                borderRadius: "4px",
                fontSize: "14px",
                fontStyle: "italic"
              }}>
                {selectedQuestionForApprove.question}
              </p>
              <p style={{ fontSize: "14px", color: "#666" }}>
                Do you want to approve this question?
              </p>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCancelApprove} disabled={approving}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleApproveQuestion} 
            disabled={approving}
            style={{ backgroundColor: "#71C0BB", borderColor: "#71C0BB" }}
          >
            {approving ? 'Approving...' : 'Approve'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default TrackQnAShareLinkPage;
