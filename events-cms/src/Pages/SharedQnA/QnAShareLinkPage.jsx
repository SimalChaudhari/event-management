import React, { useState, useEffect, useCallback } from "react";
import { Container, Row, Col, Spinner, Alert, Button } from "react-bootstrap";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { API_URL } from "../../configs/env";
import EventInfoSection from "./components/EventInfoSection";
import QuestionsTable from "./components/QuestionsTable";
import { updateQuestionViaShareLink } from "./components/QnAShareApi";
import { applyFiltersToQuestions } from "./utils/filterUtils";

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

  useEffect(() => {
    fetchData();
  }, [shareToken]);

  // Apply filters to questions - only vote filter, filter by status (only approval)
  const applyFilters = useCallback(() => {
    // First filter by status: only show approval
    const statusFilteredQuestions = allQuestions.filter(q => 
      q.status === 'approval'
    );
    
    // Then apply vote filter
    const filteredQuestions = applyFiltersToQuestions(statusFilteredQuestions, voteFilter, null);
    setQuestions(filteredQuestions);
  }, [voteFilter, allQuestions]);

  // Apply filters when filter states or allQuestions change
  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

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
        
        // Remove question from allQuestions (since it's now answered and should be filtered out)
        const updatedAllQuestions = allQuestions.filter(q => q.id !== selectedQuestion.id);
        setAllQuestions(updatedAllQuestions);
        
        // Close popup
        setShowQuestionPopup(false);
        setSelectedQuestion(null);
        
        // Refresh data
        fetchData();
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
      <Container fluid className="py-4 px-3">
        <Row className="justify-content-center">
          <Col xl={10} lg={11} md={12}>
            <EventInfoSection event={event} track={track} session={session} />

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
      {showQuestionPopup && selectedQuestion && (
        <div
          onClick={(e) => {
            // Close popup if clicking on background
            if (e.target === e.currentTarget) {
              handleClosePopup();
            }
          }}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden"
          }}
        >
          {/* Background Image */}
          {backgroundImageUrl && (
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundImage: `url(${backgroundImageUrl})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
                backgroundAttachment: "fixed",
                filter: "blur(2px)",
                zIndex: 0
              }}
            />
          )}
          
          {/* Light overlay for better text visibility */}
          <div style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(255, 255, 255, 0.3)",
            zIndex: 1
          }}></div>

          {/* Close Button (X) - Top Right */}
          <button
            onClick={handleClosePopup}
            disabled={markingAsAnswered}
            style={{
              position: "absolute",
              top: "20px",
              right: "20px",
              width: "40px",
              height: "40px",
              backgroundColor: "rgba(255, 255, 255, 0.9)",
              border: "none",
              borderRadius: "50%",
              cursor: markingAsAnswered ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "24px",
              fontWeight: "bold",
              color: "#333",
              zIndex: 10000,
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.3)",
              transition: "all 0.2s ease"
            }}
            onMouseEnter={(e) => {
              if (!markingAsAnswered) {
                e.target.style.backgroundColor = "rgba(255, 255, 255, 1)";
                e.target.style.transform = "scale(1.1)";
              }
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = "rgba(255, 255, 255, 0.9)";
              e.target.style.transform = "scale(1)";
            }}
          >
            ×
          </button>

          {/* Question Content */}
          <div
            style={{
              position: "relative",
              zIndex: 2,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "40px",
              width: "100%",
              maxWidth: "90%",
              padding: "20px"
            }}
          >
            {/* Question Text */}
            <h1
              style={{
                color: "#000000",
                fontWeight: "700",
                fontStyle: "italic",
                fontSize: "clamp(28px, 5vw, 48px)",
                lineHeight: "1.4",
                wordBreak: "break-word",
                marginBottom: "0",
                textAlign: "center",
                padding: "20px",
                fontFamily: "Arial, sans-serif",
                letterSpacing: "0.5px",
                textShadow: "2px 2px 8px rgba(255, 255, 255, 0.8), 0 0 16px rgba(255, 255, 255, 0.6), -2px -2px 8px rgba(255, 255, 255, 0.8)"
              }}
            >
              {selectedQuestion.question}
            </h1>

            {/* Mark as Answered Button */}
            <Button
              onClick={handleMarkAsAnswered}
              disabled={markingAsAnswered}
              style={{
                backgroundColor: markingAsAnswered ? "#6c757d" : "#71C0BB",
                borderColor: markingAsAnswered ? "#6c757d" : "#71C0BB",
                color: "white",
                padding: "12px 40px",
                fontSize: "clamp(16px, 3vw, 20px)",
                fontWeight: "600",
                borderRadius: "8px",
                border: "none",
                cursor: markingAsAnswered ? "not-allowed" : "pointer",
                transition: "all 0.2s ease",
                minWidth: "200px"
              }}
              onMouseEnter={(e) => {
                if (!markingAsAnswered) {
                  e.target.style.backgroundColor = "#5fa8a3";
                  e.target.style.transform = "scale(1.05)";
                }
              }}
              onMouseLeave={(e) => {
                if (!markingAsAnswered) {
                  e.target.style.backgroundColor = "#71C0BB";
                  e.target.style.transform = "scale(1)";
                }
              }}
            >
              {markingAsAnswered ? 'Marking...' : 'Mark as Answered'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default QnAShareLinkPage;
