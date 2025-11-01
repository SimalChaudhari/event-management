import React, { useState, useEffect, useCallback, useRef } from "react";
import { flushSync } from "react-dom";
import { Container, Row, Col, Spinner, Alert } from "react-bootstrap";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { API_URL } from "../../configs/env";
import EventInfoSection from "./components/EventInfoSection";
import UrlFieldAndLegend from "./components/UrlFieldAndLegend";
import QuestionsTable from "./components/QuestionsTable";
import EditQuestionModal from "./components/EditQuestionModal";
import DeleteConfirmationModal from "./components/DeleteConfirmationModal";
import {
  updateQuestionViaShareLink,
  deleteQuestionViaShareLink,
  generateQuestionShareLink
} from "./components/QnAShareApi";
import { applyFiltersToQuestions } from "./utils/filterUtils";

const QnAShareLinkPage = () => {
  const { shareToken } = useParams();
  
  const [event, setEvent] = useState(null);
  const [track, setTrack] = useState(null);
  const [session, setSession] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  
  // Answering question header state
  const [answeringQuestion, setAnsweringQuestion] = useState(null);
  const [submittingAnswer, setSubmittingAnswer] = useState(false);
  
  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedQuestionForEdit, setSelectedQuestionForEdit] = useState(null);
  const [editQuestionText, setEditQuestionText] = useState('');
  const [editQuestionStatus, setEditQuestionStatus] = useState('');
  const [submittingEdit, setSubmittingEdit] = useState(false);
  
  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedQuestionForDelete, setSelectedQuestionForDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Question share link state (display in URL field)
  const [questionShareUrls, setQuestionShareUrls] = useState({}); // Store URLs by question ID
  const [generatingQuestionLinks, setGeneratingQuestionLinks] = useState({}); // Track loading by question ID
  const [selectedQuestionUrl, setSelectedQuestionUrl] = useState(null); // Currently selected question URL for display
  const [selectedQuestionText, setSelectedQuestionText] = useState(null); // Currently selected question text for display

  // Filter state - simplified
  const [voteFilter, setVoteFilter] = useState(null); // null = unsorted, 'asc' = ascending (0 to high), 'desc' = descending (high to 0)
  const [statusFilter, setStatusFilter] = useState(null); // null = all, 'answering' = answering only, 'answered' = answered only, 'not_answered' = not answered only
  const [allQuestions, setAllQuestions] = useState([]); // Store all questions for filtering

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

  // Apply filters to questions - show filtered first, then rest
  const applyFilters = useCallback(() => {
    const filteredQuestions = applyFiltersToQuestions(allQuestions, voteFilter, statusFilter);
    setQuestions(filteredQuestions);
  }, [voteFilter, statusFilter, allQuestions]);

  // Apply filters when filter states or allQuestions change
  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  // Handle generate question share link (when question clicked) - immediate update
  const handleGenerateQuestionLink = useCallback(async (question) => {
    // Use refs to access latest state (avoid stale closures)
    const existingUrl = questionShareUrlsRef.current[question.id];
    if (existingUrl) {
      // Force immediate synchronous update
      flushSync(() => {
        setSelectedQuestionUrl(existingUrl);
        setSelectedQuestionText(question.question); // Set question text for display
      });
      return;
    }

    // Check if already generating
    if (generatingQuestionLinksRef.current[question.id]) {
      return;
    }

    // Show loading state immediately
    setGeneratingQuestionLinks(prev => ({ ...prev, [question.id]: true }));
    
    try {
      const response = await generateQuestionShareLink(question.id);
      
      if (response.success && response.data?.shareUrl) {
        const shareUrl = response.data.shareUrl;
        // Force immediate synchronous update after API response
        flushSync(() => {
          setQuestionShareUrls(prev => ({ ...prev, [question.id]: shareUrl }));
          setSelectedQuestionUrl(shareUrl);
          setSelectedQuestionText(question.question); // Set question text for display
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
  }, []); // Empty deps - refs are stable

  // Auto-generate and display question link when answering question changes
  useEffect(() => {
    if (answeringQuestion && answeringQuestion.status === 'answering') {
      const questionId = answeringQuestion.id;
      // If URL exists, show it immediately
      if (questionShareUrlsRef.current[questionId]) {
        setSelectedQuestionUrl(questionShareUrlsRef.current[questionId]);
        setSelectedQuestionText(answeringQuestion.question); // Set question text
      } else if (!generatingQuestionLinksRef.current[questionId]) {
        // Generate if not exists
        handleGenerateQuestionLink(answeringQuestion);
      }
    }
    // Don't clear URL when no answering question - keep last selected URL
  }, [answeringQuestion, handleGenerateQuestionLink]);

  const fetchData = async () => {
    try {
      setLoading(true);

      if (!shareToken) {
        toast.error('Share token is required');
        setLoading(false);
        return;
      }

      // Fetch from public API endpoint without authentication
      const response = await fetch(`${API_URL}/api/engagements/qna/share/${shareToken}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success && data.data) {
        setEvent(data.data.event);
        setTrack(data.data.track);
        setSession(data.data.session);
        const fetchedQuestions = data.data.questions || [];
        
        // Store all questions for filtering
        setAllQuestions(fetchedQuestions);
        
        // If any question has status "answering", set it as answering question to show in header
        const answeringQuestion = fetchedQuestions.find(q => q.status === 'answering');
        if (answeringQuestion) {
          setAnsweringQuestion(answeringQuestion);
        } else {
          // Clear answering question if no question is in answering status
          setAnsweringQuestion(null);
        }
      } else {
        toast.error(data.message || 'Failed to fetch Q&A data');
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      toast.error("Failed to fetch Q&A data");
    } finally {
      setLoading(false);
    }
  };

  // Handle answer question click - set to answering and show header
  const handleAnswerQuestion = async (question) => {
    if (question.status === 'answering') {
      toast.warning('This question is already being answered');
      return;
    }

    setSubmittingAnswer(true);
    try {
      const response = await updateQuestionViaShareLink(shareToken, question.id, {
        status: 'answering'
      });
      
      if (response.success) {
        // Update question in allQuestions
        const updatedAllQuestions = allQuestions.map(q => 
          q.id === question.id 
            ? { ...q, status: 'answering' }
            : q
        );
        setAllQuestions(updatedAllQuestions);
        
        // Set as answering question to show header (first position)
        setAnsweringQuestion({ ...question, status: 'answering' });
        
        // Auto-generate link for this question
        handleGenerateQuestionLink({ ...question, status: 'answering' });
        
        // Refresh data
        fetchData();
      } else {
        toast.error(response.message || 'Failed to set question as answering');
      }
    } catch (error) {
      console.error('Error updating question status:', error);
      toast.error('Failed to set question as answering');
    } finally {
      setSubmittingAnswer(false);
    }
  };

  // Handle question status update (cancel or mark as answered)
  const handleQuestionStatusUpdate = async (action) => {
    if (!answeringQuestion) return;

    setSubmittingAnswer(true);
    try {
      const newStatus = action === 'cancel' ? 'not_answered' : 'answered';
      const response = await updateQuestionViaShareLink(shareToken, answeringQuestion.id, {
        status: newStatus
      });

      if (response.success) {
        toast.success(`Question ${action === 'cancel' ? 'cancelled' : 'marked as answered'} successfully`);
        
        // Update question in allQuestions
        const updatedAllQuestions = allQuestions.map(q => 
          q.id === answeringQuestion.id 
            ? { ...q, status: newStatus }
            : q
        );
        setAllQuestions(updatedAllQuestions);
        
        // Clear answering question or find next one with answering status
        if (newStatus !== 'answering') {
          // Find if any other question has answering status
          const nextAnsweringQuestion = updatedAllQuestions.find(q => q.status === 'answering');
          setAnsweringQuestion(nextAnsweringQuestion || null);
        } else {
          setAnsweringQuestion({ ...answeringQuestion, status: newStatus });
        }
        
        // Refresh data
        fetchData();
      } else {
        toast.error(response.message || 'Failed to update question status');
      }
    } catch (error) {
      console.error('Error updating question status:', error);
      toast.error('Failed to update question status');
    } finally {
      setSubmittingAnswer(false);
    }
  };

  // Handle edit question
  const handleEditQuestion = (question) => {
    setSelectedQuestionForEdit(question);
    setEditQuestionText(question.question);
    setEditQuestionStatus(question.status || 'not_answered');
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
        
        // Update question in allQuestions
        const updatedAllQuestions = allQuestions.map(q => 
          q.id === selectedQuestionForEdit.id 
            ? { ...q, question: editQuestionText.trim(), status: editQuestionStatus }
            : q
        );
        setAllQuestions(updatedAllQuestions);
        
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
  };

  // Handle delete question click
  const handleDeleteQuestionClick = (questionId) => {
    const question = questions.find(q => q.id === questionId);
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
        
        // Close all modals
        setShowEditModal(false);
        setShowDeleteModal(false);
        // Clear answering question if deleted
        if (answeringQuestion && answeringQuestion.id === selectedQuestionForDelete.id) {
          setAnsweringQuestion(null);
        }
        setSelectedQuestionForDelete(null);
        
        // Remove question from allQuestions
        const updatedAllQuestions = allQuestions.filter(q => q.id !== selectedQuestionForDelete.id);
        setAllQuestions(updatedAllQuestions);
        
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

  if (loading) {
    return (
      <Container className="text-center mt-5">
        <Spinner animation="border" />
        <p className="mt-3">Loading Q&A data...</p>
      </Container>
    );
  }

  if (!session) {
    return (
      <Container className="mt-5">
        <Alert variant="danger">
          <h5>Access Denied</h5>
          Invalid or expired share link.
        </Alert>
      </Container>
    );
  }

  return (
    <div style={{ backgroundColor: "#f8f9fa", minHeight: "100vh" }}>
      {/* Top banner when answering - Show first question with answering status */}
      {answeringQuestion && answeringQuestion.status === 'answering' && (
        <div className="py-4"
          style={{
            backgroundColor: "#71C0BB",
            color: "black",
            width: "100%",
          }}
        >
          <Container fluid className="px-3">
            <Row className="justify-content-center">
              <Col xl={10} lg={11} md={12}>
                <Row className="align-items-center">
                  <Col xs={12} lg={8}>
                    <div style={{ 
                      fontFamily: "Arial",
                      fontWeight: "400",
                      fontStyle: "italic",
                      fontSize: "clamp(12px, 2vw, 16px)",
                      lineHeight: "1.5",
                      marginBottom: "8px"
                    }}>
                      This question is now being answered:
                    </div>
                    <div
                      style={{
                        fontFamily: "Arial",
                        fontWeight: "700",
                        fontStyle: "italic",
                        fontSize: "clamp(14px, 2vw, 18px)",
                        lineHeight: "1.5",
                        letterSpacing: "0.5px",
                        color: "black",
                        wordBreak: "break-word"
                      }}
                    >
                      {answeringQuestion.question}
                    </div>
                  </Col>
                  <Col xs={12} lg={4} className="text-lg-end mt-3 mt-lg-0">
                    <div className="d-flex flex-row justify-content-center justify-content-lg-end" style={{ gap: "12px" }}>
                        <button
                          style={{
                            backgroundColor: "white",
                            color: "#000",
                            border: "1px solid #ccc",
                            borderRadius: "5px",
                            padding: "8px 16px",
                            cursor: "pointer",
                            whiteSpace: "nowrap",
                            fontSize: "clamp(13px, 2vw, 16px)",
                            fontWeight: "500"
                          }}
                          onClick={() => handleQuestionStatusUpdate('cancel')}
                          disabled={submittingAnswer}
                        >
                          Cancel Answering
                        </button>
                        <button
                          style={{
                            backgroundColor: "#505c8c",
                            color: "white",
                            border: "none",
                            borderRadius: "5px",
                            padding: "8px 16px",
                            cursor: "pointer",
                            whiteSpace: "nowrap",
                            fontSize: "clamp(13px, 2vw, 16px)",
                            fontWeight: "500"
                          }}
                          onClick={() => handleQuestionStatusUpdate('answer')}
                          disabled={submittingAnswer}
                        >
                          Mark as Answered
                        </button>
                      </div>
                  </Col>
                </Row>
              </Col>
            </Row>
          </Container>
        </div>
      )}

      <Container fluid className="py-4 px-3">
        <Row className="justify-content-center">
          <Col xl={10} lg={11} md={12}>
            <EventInfoSection event={event} track={track} session={session} />
            <UrlFieldAndLegend 
              shareToken={shareToken} 
              answeringQuestionUrl={selectedQuestionUrl}
              questionText={selectedQuestionText}
              actualUrl={selectedQuestionUrl}
            />

            <QuestionsTable 
              questions={questions} 
              onAnswer={handleAnswerQuestion}
              onEdit={handleEditQuestion}
              onDelete={handleDeleteQuestionClick}
              onGenerateLink={handleGenerateQuestionLink}
              voteFilterActive={voteFilter}
              statusFilterValue={statusFilter}
              onVoteFilterClick={() => {
                // If clicking on vote filter, reset status filter first
                if (statusFilter !== null) {
                  setStatusFilter(null);
                }
                // Cycle through: null (unsorted) -> 'desc' (high to low) -> 'asc' (low to high) -> repeat
                if (voteFilter === null) {
                  setVoteFilter('desc');
                } else if (voteFilter === 'desc') {
                  setVoteFilter('asc');
                } else {
                  setVoteFilter('desc'); // Loop back to desc instead of null
                }
              }}
              onStatusFilterClick={() => {
                // If clicking on status filter, reset vote filter first
                if (voteFilter !== null) {
                  setVoteFilter(null);
                }
                
                // Get available statuses from data
                const availableStatuses = [...new Set(allQuestions.map(q => q.status))];
                const statusOrder = ['answering', 'answered', 'not_answered'];
                
                // Filter to only available statuses
                const validStatuses = statusOrder.filter(status => availableStatuses.includes(status));
                
                // Cycle through available statuses only
                if (statusFilter === null) {
                  // Start with first available status
                  setStatusFilter(validStatuses[0] || null);
                } else {
                  // Find current index and move to next
                  const currentIndex = validStatuses.indexOf(statusFilter);
                  if (currentIndex !== -1 && currentIndex < validStatuses.length - 1) {
                    // Move to next available status
                    setStatusFilter(validStatuses[currentIndex + 1]);
                  } else {
                    // Loop back to first available status
                    setStatusFilter(validStatuses[0] || null);
                  }
                }
              }}
              onResetFilters={() => {
                setVoteFilter(null);
                setStatusFilter(null);
              }}
              onVoteFilterReset={() => {
                setVoteFilter(null);
              }}
              onStatusFilterReset={() => {
                setStatusFilter(null);
              }}
            />
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

    </div>
  );
};

export default QnAShareLinkPage;

