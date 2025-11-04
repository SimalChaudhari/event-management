import React, { useState, useEffect, useCallback } from "react";
import { Container, Row, Col, Spinner, Alert } from "react-bootstrap";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { API_URL } from "../../configs/env";
import EventInfoSection from "./components/EventInfoSection";
import QuestionsTable from "./components/QuestionsTable";
import FullScreenQuestionPopup from "./components/FullScreenQuestionPopup";
import { updateQuestionViaShareLink, getSessionQnaByShareLink } from "./components/QnAShareApi";
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

      const data = await getSessionQnaByShareLink(shareToken);

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
