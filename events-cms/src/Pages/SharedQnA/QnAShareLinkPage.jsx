import React, { useState, useEffect, useCallback } from "react";
import { Container, Row, Col, Spinner, Alert, Card } from "react-bootstrap";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { API_URL } from "../../configs/env";
import EventInfoSection from "./components/EventInfoSection";
import QuestionsTable from "./components/QuestionsTable";
import FullScreenQuestionPopup from "./components/FullScreenQuestionPopup";
import { updateQuestionViaShareLink, getSessionQnaByShareLink } from "./components/QnAShareApi";
import { applyFiltersToQuestions } from "./utils/filterUtils";
import { useQnaWebSocket } from "./hooks/useQnaWebSocket";

const QnAShareLinkPage = () => {
  const { shareToken } = useParams();
  
  const [event, setEvent] = useState(null);
  const [track, setTrack] = useState(null);
  const [session, setSession] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Popup state
  const [showQuestionPopup, setShowQuestionPopup] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [markingAsAnswered, setMarkingAsAnswered] = useState(false);

  // Filter state - only vote filter (no status filter)
  const [voteFilter, setVoteFilter] = useState(null);
  const [allQuestions, setAllQuestions] = useState([]); // Store all questions for filtering
  const [isFullscreen, setIsFullscreen] = useState(false);

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

      const data = await getSessionQnaByShareLink(shareToken);

      if (data.success && data.data) {
        setEvent(data.data.event);
        setTrack(data.data.track);
        setSession(data.data.session);
        const fetchedQuestions = data.data.questions || [];
        
        // Store all questions for filtering
        setAllQuestions(fetchedQuestions);
      } else {
        if (isInitialLoad) {
          toast.error(data.message || 'Failed to fetch Q&A data');
        }
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      if (isInitialLoad) {
        toast.error("Failed to fetch Q&A data");
      }
    } finally {
      if (isInitialLoad) {
        setLoading(false);
      }
    }
  }, [shareToken]);

  // WebSocket handlers with direct state update (no API call needed)
  const handleQuestionUpdate = useCallback((data) => {
    console.log('Question update received in QnAShareLinkPage:', data);
    
    if (!data || !data.data || !data.type) {
      // Fallback to API call if data structure is unexpected
      fetchData(false);
      return;
    }

    const { type, data: eventData } = data;
    const question = eventData?.question;

    if (!question) {
      // If question data is missing, fallback to API call
      fetchData(false);
      return;
    }

    // Direct state update based on event type
    if (type === 'question_created') {
      // Add new question to state
      setAllQuestions(prev => {
        // Check if question already exists (avoid duplicates)
        const exists = prev.some(q => q.id === question.id);
        if (exists) {
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
        // Add new question at the beginning (newest first)
        return [formattedQuestion, ...prev];
      });
    } else if (type === 'question_updated') {
      // Update existing question in state
      setAllQuestions(prev => 
        prev.map(q => q.id === question.id ? { ...q, ...question } : q)
      );
      // Also update selectedQuestion if modal is open with this question
      setSelectedQuestion(prev => {
        if (prev && prev.id === question.id) {
          // If question status changed to 'answered', close the modal automatically
          if (question.status === 'answered' && prev.status !== 'answered') {
            setShowQuestionPopup(false);
            return null;
          }
          // Otherwise just update the question data
          return { ...prev, ...question };
        }
        return prev;
      });
    } else if (type === 'question_deleted') {
      // Remove question from state
      setAllQuestions(prev => prev.filter(q => q.id !== question.id));
      // Close modal if the deleted question is currently shown
      setSelectedQuestion(prev => {
        if (prev && prev.id === question.id) {
          setShowQuestionPopup(false);
          return null;
        }
        return prev;
      });
    } else if (type === 'question_answered') {
      // Update question status to answered
      setAllQuestions(prev => 
        prev.map(q => q.id === question.id ? { ...q, status: question.status || 'answered', ...question } : q)
      );
      // Also update selectedQuestion if modal is open with this question
      setSelectedQuestion(prev => {
        if (prev && prev.id === question.id) {
          // Close modal automatically when question is marked as answered
          setShowQuestionPopup(false);
          return null;
        }
        return prev;
      });
    } else {
      // Unknown event type, fallback to API call
      fetchData(false);
    }
  }, [fetchData]);

  const handleSessionUpdate = useCallback((data) => {
    console.log('Session update received in QnAShareLinkPage:', data);
    // Session updates usually happen after question updates
    // If question_update already handled the state update, we don't need to fetch
    // Only fetch if it's a pure session update (like statistics change without question change)
    // For now, skip API call to avoid unnecessary refresh after question creation
    // fetchData(false);
  }, []);

  // Handle modal state changes from other devices
  const handleModalStateChange = useCallback((data) => {
    if (!data || !data.modalType || !data.action) return;

    // Only handle fullscreen popup modal type
    if (data.modalType === 'fullscreen_popup') {
      if (data.action === 'open') {
        // Find the question in allQuestions (not just filtered questions)
        const question = data.questionData ? allQuestions.find(q => q.id === data.questionData.id) : null;
        if (question) {
          // Only open if not already open with the same question
          if (!showQuestionPopup || selectedQuestion?.id !== question.id) {
            setSelectedQuestion(question);
            setShowQuestionPopup(true);
          }
        }
      } else if (data.action === 'close') {
        // Close popup only if:
        // 1. Question IDs match (same question being closed)
        // 2. OR no questionData provided (general close command)
        // This prevents closing wrong popup if different questions are open on different devices
        if (showQuestionPopup) {
          const shouldClose = !data.questionData || 
                             !selectedQuestion || 
                             selectedQuestion.id === data.questionData?.id;
          
          if (shouldClose) {
            setShowQuestionPopup(false);
            setSelectedQuestion(null);
          }
        }
      }
    }
  }, [allQuestions, showQuestionPopup, selectedQuestion]);

  // Set up WebSocket connection
  const { emitModalStateChange } = useQnaWebSocket(shareToken, handleQuestionUpdate, handleSessionUpdate, handleModalStateChange);

  // Prevent browser scroll restoration on page load
  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
    
    return () => {
      if ('scrollRestoration' in window.history) {
        window.history.scrollRestoration = 'auto';
      }
    };
  }, []);

  useEffect(() => {
    // Initial load with loading spinner
    fetchData(true);
  }, [shareToken, fetchData]);

  // Apply filters to questions - only vote filter, filter by status (only approved)
  const applyFilters = useCallback(() => {
    // First filter by status: only show approved
    const statusFilteredQuestions = allQuestions.filter(q => 
      q.status === 'approved'
    );
    
    // Then apply vote filter
    const filteredQuestions = applyFiltersToQuestions(statusFilteredQuestions, voteFilter, null);
    setQuestions(filteredQuestions);
  }, [voteFilter, allQuestions]);

  // Apply filters when filter states or allQuestions change
  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  // Handle question click - show popup with question from state
  const handleQuestionClick = (question) => {
    setSelectedQuestion(question);
    setShowQuestionPopup(true);
    
    // Emit modal state change to other devices
    if (emitModalStateChange) {
      emitModalStateChange('fullscreen_popup', 'open', question);
    }
  };

  // Handle close popup
  const handleClosePopup = () => {
    const question = selectedQuestion;
    setShowQuestionPopup(false);
    setSelectedQuestion(null);
    
    // Emit modal state change to other devices
    if (emitModalStateChange && question) {
      emitModalStateChange('fullscreen_popup', 'close', question);
    }
  };

  // Handle mark as answered
  const handleMarkAsAnswered = async () => {
    if (!selectedQuestion) {
      return;
    }

    setMarkingAsAnswered(true);
    try {
      const response = await updateQuestionViaShareLink(shareToken, selectedQuestion.id, {
        status: 'answered'
      });
      
      if (response.success) {
        toast.success('Question marked as answered successfully');
        
        // Store question ID before closing
        const questionId = selectedQuestion.id;
        const questionForClose = { ...selectedQuestion, id: questionId };
        
        // Close popup
        setShowQuestionPopup(false);
        setSelectedQuestion(null);
        
        // Emit modal state change to other devices - include question ID for matching
        if (emitModalStateChange && questionForClose) {
          emitModalStateChange('fullscreen_popup', 'close', questionForClose);
        }
        
        // Update state directly (WebSocket will also update, but this ensures immediate UI update)
        setAllQuestions(prev => 
          prev.map(q => q.id === questionId ? { ...q, status: 'answered' } : q)
        );
      } else {
        toast.error(response.message || 'Failed to mark question as answered');
      }
    } catch (error) {
      console.error('Error marking question as answered:', error);
      toast.error('Failed to mark question as answered');
    } finally {
      setMarkingAsAnswered(false);
    }
  };

  // Get background image URL from event state
  const backgroundImageUrl = event?.backgroundImage 
    ? `${API_URL}/${event.backgroundImage.replace(/\\/g, '/')}`
    : null;

  // Fullscreen functionality
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch(err => {
        console.error('Error attempting to enable fullscreen:', err);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      }).catch(err => {
        console.error('Error attempting to exit fullscreen:', err);
      });
    }
  }, []);

  // Handle fullscreen change events
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  // Handle F11 key for fullscreen
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'F11') {
        e.preventDefault();
        toggleFullscreen();
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => {
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [toggleFullscreen]);

  // Auto-enter fullscreen on initial load (optional - can be removed if not desired)
  useEffect(() => {
    if (!loading && session && !document.fullscreenElement) {
      // Small delay to ensure page is rendered
      const timer = setTimeout(() => {
        if (document.documentElement.requestFullscreen) {
          document.documentElement.requestFullscreen().catch(err => {
            // Ignore errors (user might have blocked fullscreen or browser doesn't support it)
            console.log('Fullscreen not available:', err);
          });
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [loading, session]);

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
    <div style={{ 
      backgroundColor: "#f8f9fa", 
      minHeight: "100vh",
      height: "100vh",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      backgroundImage: backgroundImageUrl ? `url(${backgroundImageUrl})` : 'none',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      backgroundAttachment: 'fixed'
    }}>
      {/* Real-time indicator */}
      <div style={{
        position: "fixed",
        top: "10px",
        right: "10px",
        zIndex: 1000,
        backgroundColor: "rgba(0, 0, 0, 0.9)",
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

      {/* Fullscreen toggle button */}
      <button
        onClick={toggleFullscreen}
        style={{
          position: "fixed",
          top: "10px",
          left: "10px",
          zIndex: 1000,
          backgroundColor: "rgba(0, 0, 0, 0.9)",
          color: "white",
          border: "none",
          padding: "8px 16px",
          borderRadius: "20px",
          fontSize: "0.875rem",
          fontWeight: 500,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: "6px",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.2)",
          transition: "all 0.2s ease"
        }}
        onMouseEnter={(e) => {
          e.target.style.backgroundColor = "rgba(0, 0, 0, 1)";
        }}
        onMouseLeave={(e) => {
          e.target.style.backgroundColor = "rgba(0, 0, 0, 0.9)";
        }}
        title={isFullscreen ? "Exit Fullscreen (F11)" : "Enter Fullscreen (F11)"}
      >
        <i className={`feather icon-${isFullscreen ? 'minimize-2' : 'maximize-2'}`} style={{ fontSize: "1rem" }}></i>
        <span>{isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}</span>
      </button>
      <style>
        {`
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
      <Container fluid className="px-3" style={{ width: "100%", maxWidth: "100%", flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", maxHeight: "calc(100vh - 80px)", overflow: "hidden", minWidth: "300px", padding: "clamp(8px, 1.5vw, 16px)" }}>
        <Row className="justify-content-center" style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, width: "100%", margin: 0 }}>
          <Col xl={12} lg={12} md={12} style={{ display: "flex", flexDirection: "column", justifyContent: "center", flex: 1, minHeight: 0, height: "100%", width: "100%", padding: "clamp(0px, 1vw, 15px)" }}>
            {/* Event Info Section - Hidden */}
            {/* <Card className="mb-4 border-0 shadow-lg" style={{ 
              background: "linear-gradient(135deg, #71C0BB 0%, #5a9a96 100%)",
              borderRadius: "12px",
              overflow: "hidden"
            }}>
              <Card.Body style={{ padding: 0 }}>
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
                <div style={{ 
                  padding: "clamp(8px, 2vw, 12px) 16px clamp(8px, 2vw, 12px) 16px", 
                  backgroundColor: "#ffffff",
                  borderRadius: "0 0 12px 12px"
                }}>
                  <EventInfoSection event={event} track={track} session={session} />
                </div>
              </Card.Body>
            </Card> */}

            <QuestionsTable 
              questions={questions} 
              onQuestionClick={handleQuestionClick}
              isLoading={loading}
              voteFilterActive={voteFilter}
              onVoteFilterClick={() => {
                // Cycle through: null (unsorted) -> 'desc' (high to low) -> 'asc' (low to high) -> repeat
                if (voteFilter === null) {
                  setVoteFilter('desc');
                } else if (voteFilter === 'desc') {
                  setVoteFilter('asc');
                } else {
                  setVoteFilter('desc'); // Loop back to desc instead of null
                }
              }}
              onResetFilters={() => {
                setVoteFilter(null);
              }}
              onVoteFilterReset={() => {
                setVoteFilter(null);
              }}
            />
          </Col>
        </Row>
      </Container>

      {/* Full-screen Question Popup */}
      <FullScreenQuestionPopup
        show={showQuestionPopup}
        question={selectedQuestion}
        backgroundImageUrl={backgroundImageUrl}
        markingAsAnswered={markingAsAnswered}
        onClose={handleClosePopup}
        onMarkAsAnswered={handleMarkAsAnswered}
      />
    </div>
  );
};

export default QnAShareLinkPage;
