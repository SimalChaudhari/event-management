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

  // WebSocket handlers
  const handleQuestionUpdate = useCallback((data) => {
    // Refresh data when question is updated
    fetchData(false);
  }, [fetchData]);

  const handleSessionUpdate = useCallback((data) => {
    // Refresh data when session is updated
    fetchData(false);
  }, [fetchData]);

  // Set up WebSocket connection
  useQnaWebSocket(shareToken, handleQuestionUpdate, handleSessionUpdate);

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
  };

  // Handle close popup
  const handleClosePopup = () => {
    setShowQuestionPopup(false);
    setSelectedQuestion(null);
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
        
        // Close popup
        setShowQuestionPopup(false);
        setSelectedQuestion(null);
        
        // Refresh data immediately to get latest state (without loading spinner)
        await fetchData(false);
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
                  <EventInfoSection event={event} track={track} session={session} />
                </div>
              </Card.Body>
            </Card>

            <QuestionsTable 
              questions={questions} 
              onQuestionClick={handleQuestionClick}
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
