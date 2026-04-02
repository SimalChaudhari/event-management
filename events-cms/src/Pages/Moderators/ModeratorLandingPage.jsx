import React, { useState, useEffect } from "react";
import { Container, Row, Col, Table, Form, Spinner, Alert, Button, Modal } from "react-bootstrap";
import { useParams, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import { fetchModeratorLandingData, processModeratorResponseData, processSessionResponseData, updateQuestionStatus, updateQuestion, deleteQuestion } from "./APis/moderatorLandingApi";
import { BASE_URL } from "../../configs/env";

const ModeratorLandingPage = () => {
  const { moderatorId, sessionId: urlSessionId } = useParams();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const sessionId = searchParams.get('sessionId') || urlSessionId; // Extract sessionId from URL params or query string
  
  const [moderator, setModerator] = useState(null);
  const [event, setEvent] = useState(null);
  const [engagement, setEngagement] = useState(null);
  const [selectedSession, setSelectedSession] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answeringQuestions, setAnsweringQuestions] = useState([]);
  const [currentAnsweringIndex, setCurrentAnsweringIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [answeringQuestion, setAnsweringQuestion] = useState(null);
  const [submittingAnswer, setSubmittingAnswer] = useState(false);
  const [showAnswerModal, setShowAnswerModal] = useState(false);
  const [selectedQuestionForAnswer, setSelectedQuestionForAnswer] = useState(null);
  const [answerText, setAnswerText] = useState('');
  const [submittingAnswerText, setSubmittingAnswerText] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedQuestionForEdit, setSelectedQuestionForEdit] = useState(null);
  const [editQuestionText, setEditQuestionText] = useState('');
  const [editQuestionStatus, setEditQuestionStatus] = useState('');
  const [submittingEdit, setSubmittingEdit] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    fetchData();
  }, [moderatorId, token, sessionId]);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 425);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Check if token is available
      if (!token) {
        toast.error('Access token is required');
        setLoading(false);
        return;
      }

      const response = await fetchModeratorLandingData(moderatorId, sessionId, token);
      
      if (response.success && response.data) {
        const responseData = response.data;
        
        // Handle session-specific response format
        if (sessionId && !moderatorId && responseData.sessionDetails) {
          const processedData = processSessionResponseData(responseData);
          
          setModerator(processedData.moderator);
          setEvent(processedData.event);
          setEngagement(processedData.engagement);
          setSelectedSession(processedData.selectedSession);
          setQuestions(processedData.questions);
          
          // Set answering questions
          setAnsweringQuestions(processedData.answeringQuestions);
          setCurrentAnsweringIndex(0);
          if (processedData.answeringQuestions.length > 0) {
            setAnsweringQuestion(processedData.answeringQuestions[0]);
          }
        } else {
          // Handle moderator-specific response format
          const processedData = processModeratorResponseData(responseData, moderatorId, sessionId);
          
          setModerator(processedData.moderator);
          setEvent(processedData.event);
          setEngagement(processedData.engagement);
          setSelectedSession(processedData.selectedSession);
          setQuestions(processedData.questions);
          
          // Set answering questions
          setAnsweringQuestions(processedData.answeringQuestions);
          setCurrentAnsweringIndex(0);
          if (processedData.answeringQuestions.length > 0) {
            setAnsweringQuestion(processedData.answeringQuestions[0]);
          }
        }
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      toast.error("Failed to fetch moderator data");
    } finally {
      setLoading(false);
    }
  };


  // Handle answer question modal
  const handleAnswerQuestion = (question) => {
    setSelectedQuestionForAnswer(question);
    // Show existing answer if available, otherwise empty
    setAnswerText(question.answer || '');
    setShowAnswerModal(true);
  };

  // Handle answer submission
  const handleSubmitAnswer = async () => {
    if (!answerText.trim()) {
      toast.error('Please enter an answer');
      return;
    }

    setSubmittingAnswerText(true);
    try {
      const response = await updateQuestionStatus(selectedQuestionForAnswer.id, 'answer', answerText.trim());
      
      if (response.success) {
        toast.success(selectedQuestionForAnswer?.answer ? 'Answer updated successfully' : 'Answer submitted successfully');
        
        // Close modal
        setShowAnswerModal(false);
        setAnswerText('');
        setSelectedQuestionForAnswer(null);
        
        // Update question status in the list
        const updatedQuestions = questions.map(q => 
          q.id === selectedQuestionForAnswer.id 
            ? { ...q, status: 'answered', answer: answerText.trim() }
            : q
        );
        setQuestions(updatedQuestions);
        
        // Remove from answering questions if it was there
        const updatedAnsweringQuestions = answeringQuestions.filter(q => q.id !== selectedQuestionForAnswer.id);
        setAnsweringQuestions(updatedAnsweringQuestions);
        
        // If the answered question was the current answering question, clear it
        if (answeringQuestion && answeringQuestion.id === selectedQuestionForAnswer.id) {
          setAnsweringQuestion(null);
          setCurrentAnsweringIndex(0);
        }
      } else {
        toast.error(response.message || 'Failed to submit answer');
      }
    } catch (error) {
      console.error('Error submitting answer:', error);
      toast.error('Failed to submit answer');
    } finally {
      setSubmittingAnswerText(false);
    }
  };

  // Handle modal close
  const handleCloseAnswerModal = () => {
    setShowAnswerModal(false);
    setAnswerText('');
    setSelectedQuestionForAnswer(null);
  };

  // Handle edit question modal
  const handleEditQuestion = (question) => {
    setSelectedQuestionForEdit(question);
    setEditQuestionText(question.question);
    setEditQuestionStatus(question.status);
    setShowEditModal(true);
  };

  // Handle edit question submission
  const handleSubmitEdit = async () => {
    if (!editQuestionText.trim()) {
      toast.error('Please enter question text');
      return;
    }

    setSubmittingEdit(true);
    try {
      const response = await updateQuestion(selectedQuestionForEdit.id, {
        question: editQuestionText.trim(),
        status: editQuestionStatus
      });
      
      if (response.success) {
        toast.success('Question updated successfully');
        
        // Close modal
        setShowEditModal(false);
        setEditQuestionText('');
        setEditQuestionStatus('');
        setSelectedQuestionForEdit(null);
        
        // Update question in the list
        const updatedQuestions = questions.map(q => 
          q.id === selectedQuestionForEdit.id 
            ? { 
                ...q, 
                question: editQuestionText.trim(),
                status: editQuestionStatus
              }
            : q
        );
        setQuestions(updatedQuestions);
        
        // Update answering questions if status changed
        if (editQuestionStatus === 'answering') {
          const updatedAnsweringQuestions = [...answeringQuestions];
          if (!updatedAnsweringQuestions.find(q => q.id === selectedQuestionForEdit.id)) {
            updatedAnsweringQuestions.push({ ...selectedQuestionForEdit, question: editQuestionText.trim(), status: editQuestionStatus });
          }
          setAnsweringQuestions(updatedAnsweringQuestions);
          
          // Set as current answering question if none is currently being answered
          if (!answeringQuestion) {
            setAnsweringQuestion({ ...selectedQuestionForEdit, question: editQuestionText.trim(), status: editQuestionStatus });
            setCurrentAnsweringIndex(0);
          }
        } else {
          const updatedAnsweringQuestions = answeringQuestions.filter(q => q.id !== selectedQuestionForEdit.id);
          setAnsweringQuestions(updatedAnsweringQuestions);
          
          // Clear current answering question if it was the one being edited
          if (answeringQuestion && answeringQuestion.id === selectedQuestionForEdit.id) {
            setAnsweringQuestion(null);
            setCurrentAnsweringIndex(0);
          }
        }
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

  // Handle edit modal close
  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditQuestionText('');
    setEditQuestionStatus('');
    setSelectedQuestionForEdit(null);
  };

  // Handle answer now action
  const handleAnswerNow = (question) => {
    if (question.status === 'answering') {
      toast.warning('This question is already being answered');
      return;
    }
    handleAnswerQuestion(question);
  };

  // Handle copy URL to clipboard
  const handleCopyUrl = () => {
    // Copy the full URL with token even though display shows short URL
    const fullUrl = selectedSession?.id ? `${BASE_URL}/moderator/session/${selectedSession.id}?token=${token}` : window.location.href;
    navigator.clipboard.writeText(fullUrl).then(() => {
      toast.success('URL copied to clipboard!');
    }).catch(() => {
      toast.error('Failed to copy URL');
    });
  };

  // Handle question status update
  const handleQuestionStatusUpdate = async (action) => {
    if (!answeringQuestion) return;

    setSubmittingAnswer(true);
    try {
      const response = await updateQuestionStatus(answeringQuestion.id, action);

      if (response.success) {
        toast.success(`Question ${action === 'cancel' ? 'cancelled' : 'answered'} successfully`);
        
        // Remove current question from answering list
        const updatedAnsweringQuestions = answeringQuestions.filter(q => q.id !== answeringQuestion.id);
        setAnsweringQuestions(updatedAnsweringQuestions);
        
        // Move to next question or clear if none left
        if (updatedAnsweringQuestions.length > 0) {
          const nextIndex = currentAnsweringIndex < updatedAnsweringQuestions.length ? currentAnsweringIndex : 0;
          setCurrentAnsweringIndex(nextIndex);
          setAnsweringQuestion(updatedAnsweringQuestions[nextIndex]);
        } else {
          setAnsweringQuestion(null);
          setCurrentAnsweringIndex(0);
        }
        
        // Update questions list
        const updatedQuestions = questions.map(q => 
          q.id === answeringQuestion.id 
            ? { ...q, status: action === 'cancel' ? 'not_answered' : 'answered' }
            : q
        );
        setQuestions(updatedQuestions);
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





  const getStatusColor = (status) => {
    switch (status) {
      case "answering":
        return "#71C0BB"; // Green for answering
      case "answered":
        return "#4E6688"; // Blue for answered
      default:
        return "#ffffff"; // White for not answered
    }
  };

  const getStatusText = (status) => {
    if (status === "answered") return "Answered";
    if (status === "answering") return "Answering";
    return "Not Answered";
  };

  if (loading) {
    return (
      <Container className="text-center mt-5">
        <Spinner animation="border" />
        <p className="mt-3">Loading moderator data...</p>
      </Container>
    );
  }

  if (!moderator) {
    return (
      <Container className="mt-5">
        <Alert variant="danger">
          <h5>Access Denied</h5>
          Invalid moderator access.
        </Alert>
      </Container>
    );
  }


  // Handle delete question
  const handleDeleteQuestion = async (questionId) => {
    try {
      const response = await deleteQuestion(questionId);
      
      if (response.success) {
        toast.success('Question deleted successfully');
        
        // Close any open modals
        setShowAnswerModal(false);
        setShowEditModal(false);
        setAnswerText('');
        setEditQuestionText('');
        setEditQuestionStatus('');
        setSelectedQuestionForAnswer(null);
        setSelectedQuestionForEdit(null);
        
        // Remove question from the list
        const updatedQuestions = questions.filter(q => q.id !== questionId);
        setQuestions(updatedQuestions);
        
        // Also remove from answering questions if it was there
        const updatedAnsweringQuestions = answeringQuestions.filter(q => q.id !== questionId);
        setAnsweringQuestions(updatedAnsweringQuestions);
        
        // If the deleted question was the current answering question, clear it
        if (answeringQuestion && answeringQuestion.id === questionId) {
          setAnsweringQuestion(null);
          setCurrentAnsweringIndex(0);
        }
      } else {
        toast.error(response.message || 'Failed to delete question');
      }
    } catch (error) {
      console.error('Error deleting question:', error);
      toast.error('Failed to delete question');
    }
  };

  return (
    <div style={{ backgroundColor: "#f8f9fa", minHeight: "100vh" }}>
      {/* Top banner when answering - Only show if there are questions with answering status */}
      {answeringQuestions.length > 0 && answeringQuestion && answeringQuestions.find(q => q.id === answeringQuestion.id) && (
        <div className="py-4"
          style={{
            backgroundColor: "#71C0BB",
            color: "black",

            // padding: "20px",
            width: "100%",
          }}
        >
          <Container fluid className="px-3">
            <Row className="justify-content-center">
              <Col xl={10} lg={11} md={12}>
                <Row className="align-items-center">
                  <Col xs={12} md={8}>
                    <div style={{ 
                      fontFamily: "Arial",
                      fontWeight: "400",
                      fontStyle: "italic",
                      fontSize: "12px",
                      lineHeight: "18px",
                      marginBottom: "8px"
                    }}>
                      This question is now being answered:
                    </div>
                    <div
                      style={{
                        fontFamily: "Arial",
                        fontWeight: "700",
                        fontStyle: "italic",
                        fontSize: "14px",
                        lineHeight: "18px",
                        letterSpacing: "0.5px",
                        color: "black",
                        wordBreak: "break-word"
                      }}
                    >
                      {answeringQuestion.question}
                    </div>
                  </Col>
                  <Col xs={12} md={4} className="text-md-end mt-3 mt-md-0">
                    <div className="d-flex flex-row justify-content-center justify-content-md-end" style={{ gap: isMobile ? "16px" : "70px" }}>
                      <button
                        style={{
                          backgroundColor: "white",
                          color: "#000",
                          border: "1px solid #ccc",
                          borderRadius: "5px",
                          padding: "8px 16px",
                          cursor: "pointer",
                          whiteSpace: "nowrap",
                          fontSize: "14px",
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
                          fontSize: "14px",
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
        {/* Event info - 3 items on left, 3 items on right */}
        <div className="mb-3">
          <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", justifyContent: "space-between" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", flex: "1", minWidth: "200px" }}>
              <p style={{ margin: 0, fontSize: "14px" }}>
                <strong>Event Title:</strong> {event?.title || 'ISCA Conference 2025'}
              </p>
              <p style={{ margin: 0, fontSize: "14px" }}>
                <strong>Track Title:</strong> {engagement?.trackTitle || 'CFO'}
              </p>
              <p style={{ margin: 0, fontSize: "14px" }}>
                <strong>Session Title:</strong> {selectedSession?.title || 'Happy birthday to you'}
              </p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", flex: "1", minWidth: "200px" }}>
              <p style={{ margin: 0, fontSize: "14px" }}>
                <strong>Start Date:</strong> {event?.startDate ? (() => {
                  try {
                    const date = new Date(event.startDate);
                    const day = date.getDate();
                    const month = date.toLocaleString('en-US', { month: 'short' });
                    const year = date.getFullYear();
                    return `${day} ${month} ${year}`;
                  } catch {
                    return event.startDate;
                  }
                })() : 'Not set'}
              </p>
              <p style={{ margin: 0, fontSize: "14px" }}>
                <strong>End Date:</strong> {event?.endDate ? (() => {
                  try {
                    const date = new Date(event.endDate);
                    const day = date.getDate();
                    const month = date.toLocaleString('en-US', { month: 'short' });
                    const year = date.getFullYear();
                    return `${day} ${month} ${year}`;
                  } catch {
                    return event.endDate;
                  }
                })() : 'Not set'}
              </p>
              <p style={{ margin: 0, fontSize: "14px" }}>
                <strong>Time:</strong> {selectedSession?.startTime ? (() => {
                  try {
                    const time = new Date(`2000-01-01T${selectedSession.startTime}`);
                    return time.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
                  } catch {
                    return selectedSession.startTime;
                  }
                })() : 'Not set'} - {selectedSession?.endTime ? (() => {
                  try {
                    const time = new Date(`2000-01-01T${selectedSession.endTime}`);
                    return time.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
                  } catch {
                    return selectedSession.endTime;
                  }
                })() : 'Not set'}
              </p>
            </div>
          </div>
        </div>


        {/* URL Field and Legend */}
        <Container fluid>
        <div className="mb-3">
          <p style={{ marginBottom: "8px", fontSize: "14px" }}>
            <strong>URL to display answering question:</strong>
          </p>
          <Form.Control
            readOnly
            onClick={handleCopyUrl}
            value={selectedSession?.id ? `${BASE_URL}/moderator/session/${selectedSession.id}` : 'Display URL'}
            style={{
              backgroundColor: "#D9D9D9",
              border: "1px solid #ccc",
              color: "#FFFFF",
              cursor: "pointer",
              fontSize: "12px",
              fontWeight: "600",
              overflow: "hidden",
              textOverflow: "ellipsis",
              padding: "0px",
              paddingLeft: "4px",
              borderRadius: "2px",
              height: "20px",
              lineHeight: "20px"
            }}
          />
          
          {/* Legend */}
          <div className="d-flex align-items-center flex-wrap" style={{ gap: "16px", marginTop: "32px" }}>
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
              <span style={{ fontSize: "14px", whiteSpace: "nowrap" }}>Not Answered</span>
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
              <span style={{ fontSize: "14px", whiteSpace: "nowrap" }}>Answered</span>
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
              <span style={{ fontSize: "14px", whiteSpace: "nowrap" }}>Answering</span>
            </div>
          </div>
        </div>
        </Container>
        {/* Table - Fully responsive with all columns wrapping */}
        <div className="table-responsive" style={{ marginTop: "20px", overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
          <Table bordered style={{ 
            borderCollapse: 'separate', 
            borderSpacing: '0',
            width: '100%', 
            minWidth: '320px',
            border: "1px solid #D4D6DD",
            fontSize: "clamp(10px, 2vw, 14px)"
          }}>
            <thead style={{ backgroundColor: "#000", color: "white" }}>
              <tr>
                <th style={{ 
                  borderRight: "1px solid #D4D6DD",
                  borderTop: "none",
                  borderBottom: "1px solid #D4D6DD",
                  borderLeft: "none",
                  padding: "8px 4px", 
                  backgroundColor: "#000", 
                  color: "white",
                  width: "52%",
                  minWidth: "100px",
                  fontSize: "clamp(11px, 2vw, 14px)",
                  textAlign: "center"
                }}>Questions</th>
                <th style={{ 
                  borderRight: "1px solid #D4D6DD",
                  borderTop: "none",
                  borderBottom: "1px solid #D4D6DD",
                  borderLeft: "1px solid #D4D6DD",
                  padding: "4px 2px", 
                  backgroundColor: "#000", 
                  color: "white",
                  width: "8%",
                  minWidth: "35px",
                  maxWidth: "50px",
                  fontSize: "clamp(10px, 2vw, 14px)",
                  textAlign: "center"
                }}>Votes</th>
                <th style={{ 
                  borderRight: "1px solid #D4D6DD",
                  borderTop: "none",
                  borderBottom: "1px solid #D4D6DD",
                  borderLeft: "1px solid #D4D6DD",
                  padding: "4px 2px", 
                  backgroundColor: "#000", 
                  color: "white",
                  width: "15%",
                  minWidth: "55px",
                  maxWidth: "80px",
                  fontSize: "clamp(10px, 2vw, 14px)",
                  textAlign: "center"
                }}>Status</th>
                <th style={{ 
                  borderRight: "none",
                  borderTop: "none",
                  borderBottom: "1px solid #D4D6DD",
                  borderLeft: "1px solid #D4D6DD",
                  padding: "4px 1px", 
                  backgroundColor: "#000", 
                  color: "white",
                  width: "18%",
                  minWidth: "70px",
                  maxWidth: "110px",
                  fontSize: "clamp(10px, 2vw, 14px)",
                  textAlign: "center"
                }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {questions.length > 0 ? (
                questions.map((q) => (
                  <tr
                    key={q.id}
                  >
                    <td style={{ 
                      backgroundColor: getStatusColor(q.status),
                      color: "black",
                      fontWeight: "bold",
                      fontStyle: "italic",
                      borderRight: "1px solid #D4D6DD",
                      borderTop: "1px solid #D4D6DD",
                      borderBottom: "1px solid #D4D6DD",
                      borderLeft: "none",
                      padding: "6px 12px",
                      wordBreak: "break-word",
                      wordWrap: "break-word",
                      whiteSpace: "normal",
                      lineHeight: "1.2",
                      verticalAlign: "middle",
                      fontSize: "clamp(10px, 2vw, 13px)",
                      textAlign: "start"
                    }}>
                      {q.question}
                    </td>
                    <td style={{ 
                      backgroundColor: "#ffffff",
                      color: "black",
                      borderRight: "1px solid #D4D6DD",
                      borderTop: "1px solid #D4D6DD",
                      borderBottom: "1px solid #D4D6DD",
                      borderLeft: "1px solid #D4D6DD",
                      padding: "4px 1px", 
                      textAlign: "center",
                      verticalAlign: "middle",
                      fontSize: "clamp(10px, 2vw, 13px)",
                      whiteSpace: "nowrap"
                    }}>
                      {q.likesCount}
                    </td>
                    <td style={{ 
                      backgroundColor: "#ffffff",
                      color: "black",
                      borderRight: "1px solid #D4D6DD",
                      borderTop: "1px solid #D4D6DD",
                      borderBottom: "1px solid #D4D6DD",
                      borderLeft: "1px solid #D4D6DD",
                      padding: "4px 1px",
                      textAlign: "center",
                      verticalAlign: "middle",
                      wordBreak: "break-word",
                      wordWrap: "break-word",
                      whiteSpace: "normal",
                      fontSize: "clamp(10px, 2vw, 13px)"
                    }}>
                      {getStatusText(q.status)}
                    </td>
                    <td style={{ 
                      backgroundColor: "#ffffff",
                      color: "black",
                      borderRight: "none",
                      borderTop: "1px solid #D4D6DD",
                      borderBottom: "1px solid #D4D6DD",
                      borderLeft: "1px solid #D4D6DD",
                      padding: "4px 1px", 
                      textAlign: "center",
                      verticalAlign: "middle"
                    }}>
                      <div style={{ display: "flex", justifyContent: "center", gap: "0" }}>
                        {/* Answer Now Button */}
                        <button
                          className="btn btn-icon"
                          style={{
                            width: "38px",
                            height: "38px",
                            borderRadius: "50%",
                            border: "none",
                            backgroundColor: "transparent",
                            cursor: q.status === "answering" ? "not-allowed" : "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                            padding: 0,
                            margin: "0 -2px",
                            color: q.status === "answering" ? "#D4D6DD" : q.answer ? "#28a745" : "#71C0BB",
                            opacity: q.status === "answering" ? 0.5 : 1
                          }}
                          onClick={() => handleAnswerNow(q)}
                          disabled={q.status === "answering"}
                          title={q.status === "answering" ? "Currently Being Answered" : q.answer ? "Edit Answer" : "Answer Now"}
                        >
                          <i className="feather icon-message-circle" style={{ fontSize: "20px" }}></i>
                        </button>
                        
                        {/* Edit Question Button */}
                        <button
                          className="btn btn-icon"
                          style={{
                            width: "38px",
                            height: "38px",
                            borderRadius: "50%",
                            border: "none",
                            backgroundColor: "transparent",
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                            padding: 0,
                            margin: "0 -2px",
                            color: "#71C0BB"
                          }}
                          title="Edit Question"
                          onClick={() => handleEditQuestion(q)}
                        >
                          <i className="feather icon-edit" style={{ fontSize: "20px" }}></i>
                        </button>
                        
                        {/* Delete Question Button */}
                        <button
                          className="btn btn-icon"
                          style={{
                            width: "38px",
                            height: "38px",
                            borderRadius: "50%",
                            border: "none",
                            backgroundColor: "transparent",
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                            padding: 0,
                            margin: "0 -2px",
                            color: "#71C0BB"
                          }}
                          onClick={() => handleDeleteQuestion(q.id)}
                          title="Delete Question"
                        >
                          <i className="feather icon-trash-2" style={{ fontSize: "20px" }}></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="text-center text-muted py-4">
                    <i className="fas fa-inbox fa-2x mb-2"></i>
                    <br />
                    No data available
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </div>
       
          </Col>
        </Row>
      </Container>

      {/* Answer Submission Modal */}
      <Modal show={showAnswerModal} onHide={handleCloseAnswerModal} size="lg" centered>
        <Modal.Header  style={{ borderBottom: '1px solid #e0e0e0', padding: '20px', position: 'relative' }}>
          <Modal.Title style={{ color: '#333', fontWeight: '600', fontSize: '18px' }}>
            <i className="feather icon-message-circle mr-2" style={{ color: '#71C0BB' }}></i>
            {selectedQuestionForAnswer?.answer ? 'Edit Answer' : 'Answer Question'}
          </Modal.Title>
          <button
            type="button"
            className="btn-close"
            onClick={handleCloseAnswerModal}
            style={{
              position: 'absolute',
              top: '15px',
              right: '15px',
              width: '30px',
              height: '30px',
              backgroundColor: 'transparent',
              border: 'none',
              fontSize: '18px',
              color: '#666',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#f5f5f5';
              e.target.style.color = '#333';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'transparent';
              e.target.style.color = '#666';
            }}
          >
            <i className="feather icon-x" style={{ fontSize: '16px' }}></i>
          </button>
        </Modal.Header>
        <Modal.Body style={{ padding: '20px' }}>
          {selectedQuestionForAnswer && (
            <div>
              <div className="mb-3">
                <h6 style={{ color: '#333', fontWeight: '600' }}>Question:</h6>
                <div 
                  style={{ 
                    backgroundColor: '#f8f9fa', 
                    padding: '15px', 
                    borderRadius: '8px',
                    border: '1px solid #e9ecef',
                    fontStyle: 'italic',
                    color: '#495057'
                  }}
                >
                  {selectedQuestionForAnswer.question}
                </div>
              </div>
              
              {/* Show existing answer if available */}
              {selectedQuestionForAnswer.answer && (
                <div className="mb-3">
                  <h6 style={{ color: '#333', fontWeight: '600' }}>
                    <i className="feather icon-check-circle mr-2" style={{ color: '#28a745' }}></i>
                    Previous Answer:
                  </h6>
                  <div 
                    style={{ 
                      backgroundColor: '#d4edda', 
                      padding: '15px', 
                      borderRadius: '8px',
                      border: '1px solid #c3e6cb',
                      color: '#155724',
                      fontSize: '14px',
                      lineHeight: '1.5'
                    }}
                  >
                    {selectedQuestionForAnswer.answer}
                  </div>
                  <small className="text-muted">
                    <i className="feather icon-edit mr-1"></i>
                    You can edit this answer below
                  </small>
                </div>
              )}
              
              <div className="mb-3">
                <h6 style={{ color: '#333', fontWeight: '600' }}>Your Answer:</h6>
                <Form.Control
                  as="textarea"
                  rows={6}
                  value={answerText}
                  onChange={(e) => setAnswerText(e.target.value)}
                  placeholder={selectedQuestionForAnswer?.answer ? "Edit your answer here..." : "Enter your answer here..."}
                  style={{
                    border: '1px solid #ced4da',
                    borderRadius: '8px',
                    fontSize: '14px',
                    lineHeight: '1.5'
                  }}
                />
                <small className="text-muted">
                  Character count: {answerText.length}
                </small>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer style={{ borderTop: '1px solid #e0e0e0', padding: '20px', justifyContent: 'flex-end', gap: '12px' }}>
          <Button 
            variant="secondary" 
            onClick={handleCloseAnswerModal}
            disabled={submittingAnswerText}
            style={{ 
              borderRadius: '6px',
              padding: '8px 16px',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleSubmitAnswer}
            disabled={submittingAnswerText || !answerText.trim()}
            style={{ 
              backgroundColor: '#71C0BB', 
              borderColor: '#71C0BB',
              borderRadius: '6px',
              padding: '8px 16px',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            {submittingAnswerText ? (
              <>
                <Spinner size="sm" className="mr-2" />
                Submitting...
              </>
            ) : (
              <>
                <i className="feather icon-check mr-2"></i>
                {selectedQuestionForAnswer?.answer ? 'Update Answer' : 'Submit Answer'}
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Edit Question Modal */}
      <Modal show={showEditModal} onHide={handleCloseEditModal} size="lg" centered>
        <Modal.Header  style={{ borderBottom: '1px solid #e0e0e0', padding: '20px', position: 'relative' }}>
          <Modal.Title style={{ color: '#333', fontWeight: '600', fontSize: '18px' }}>
            <i className="feather icon-edit mr-2" style={{ color: '#71C0BB' }}></i>
            Edit Question
          </Modal.Title>
          <button
            type="button"
            className="btn-close"
            onClick={handleCloseEditModal}
            style={{
              position: 'absolute',
              top: '15px',
              right: '15px',
              width: '30px',
              height: '30px',
              backgroundColor: 'transparent',
              border: 'none',
              fontSize: '18px',
              color: '#666',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#f5f5f5';
              e.target.style.color = '#333';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'transparent';
              e.target.style.color = '#666';
            }}
          >
            <i className="feather icon-x" style={{ fontSize: '16px' }}></i>
          </button>
        </Modal.Header>
        <Modal.Body style={{ padding: '20px' }}>
          {selectedQuestionForEdit && (
            <div>
              <div className="mb-3">
                <h6 style={{ color: '#333', fontWeight: '600', marginBottom: '8px' }}>Question Text:</h6>
                <Form.Control
                  as="textarea"
                  rows={4}
                  value={editQuestionText}
                  onChange={(e) => setEditQuestionText(e.target.value)}
                  placeholder="Enter question text..."
                  style={{
                    border: '1px solid #e0e0e0',
                    borderRadius: '6px',
                    fontSize: '14px',
                    lineHeight: '1.5',
                    padding: '12px',
                    backgroundColor: '#fff',
                    color: '#333',
                    boxShadow: 'none',
                    resize: 'vertical'
                  }}
                />
                <small className="text-muted" style={{ fontSize: '12px', color: '#666' }}>
                  Character count: {editQuestionText.length}
                </small>
              </div>
              
              <div className="mb-3">
                <h6 style={{ color: '#333', fontWeight: '600', marginBottom: '8px' }}>Question Status:</h6>
                <Form.Select
                  value={editQuestionStatus}
                  onChange={(e) => setEditQuestionStatus(e.target.value)}
                  style={{
                    border: '1px solid #e0e0e0',
                    borderRadius: '6px',
                    fontSize: '14px',
                    padding: '8px 12px',
                    backgroundColor: '#fff',
                    color: '#333',
                    minWidth: '200px',
                    boxShadow: 'none'
                  }}
                >
                  <option value="not_answered">Not Answered</option>
                  <option value="answering">Answering</option>
                  <option value="answered">Answered</option>
                </Form.Select>
                <small className="text-muted" style={{ fontSize: '12px', color: '#666', display: 'block', marginTop: '4px' }}>
                  Change the status of this question
                </small>
              </div>

              <div className="mb-3">
                <h6 style={{ color: '#333', fontWeight: '600', marginBottom: '8px' }}>Votes:</h6>
                <div 
                  style={{ 
                    backgroundColor: '#f8f9fa', 
                    padding: '12px', 
                    borderRadius: '6px',
                    border: '1px solid #e0e0e0',
                    color: '#666',
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <i className="feather icon-thumbs-up mr-2" style={{ color: '#71C0BB' }}></i>
                    <span>{selectedQuestionForEdit.likesCount || 0} votes</span>
                  </div>
                  <small className="text-muted" style={{ fontSize: '12px' }}>
                    (Cannot be changed)
                  </small>
                </div>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer style={{ borderTop: '1px solid #e0e0e0', padding: '20px', justifyContent: 'space-between' }}>
          <Button 
            variant="secondary" 
            onClick={handleCloseEditModal}
            disabled={submittingEdit}
            style={{ 
              borderRadius: '6px',
              padding: '8px 16px',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            Cancel
          </Button>
          <div style={{ display: 'flex', gap: '12px' }}>
            <Button 
              variant="danger" 
              onClick={() => handleDeleteQuestion(selectedQuestionForEdit?.id)}
              disabled={submittingEdit}
              style={{ 
                borderRadius: '6px',
                padding: '8px 16px',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              <i className="feather icon-trash-2 mr-2"></i>
              Delete Question
            </Button>
            <Button 
              variant="primary" 
              onClick={handleSubmitEdit}
              disabled={submittingEdit || !editQuestionText.trim()}
              style={{ 
                backgroundColor: '#71C0BB', 
                borderColor: '#71C0BB',
                borderRadius: '6px',
                padding: '8px 16px',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              {submittingEdit ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <i className="feather icon-save mr-2"></i>
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default ModeratorLandingPage;
