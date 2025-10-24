import React, { useState, useEffect } from "react";
import { Container, Row, Col, Table, Form, Spinner, Alert } from "react-bootstrap";
import { useParams, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import { fetchModeratorLandingData, processModeratorResponseData, processSessionResponseData, updateQuestionStatus, updateQuestion, deleteQuestion } from "./APis/moderatorLandingApi";

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

  useEffect(() => {
    fetchData();
  }, [moderatorId, token, sessionId]);

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

  // Handle edit question
  const handleEditQuestion = async (questionId) => {
    try {
      // For now, just show a toast - you can implement edit modal later
      toast.info("Edit functionality - implement edit modal");
    } catch (error) {
      console.error('Error editing question:', error);
      toast.error('Failed to edit question');
    }
  };

  // Handle delete question
  const handleDeleteQuestion = async (questionId) => {
    try {
      const response = await deleteQuestion(questionId);
      
      if (response.success) {
        toast.success('Question deleted successfully');
        
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
        <div
          style={{
            backgroundColor: "#71C0BB",
            color: "black",
            padding: "20px",
            width: "100%",
          }}
        >
          <Container fluid className="px-3">
            <Row className="justify-content-center">
              <Col xl={10} lg={11} md={12}>
                <Row>
                  <Col md={8}>
                    <div style={{ 
                      fontFamily: "Arial",
                      fontWeight: "400",
                      fontStyle: "italic",
                      // fontSize: "12px",
                      lineHeight: "32px",
                      marginBottom: "10px"
                    }}>
                      This question is now being answered:
                    </div>
                    <div
                      style={{
                        fontFamily: "Arial",
                        fontWeight: "700",
                        fontStyle: "italic",
                        fontSize: "16px",
                        lineHeight: "20px",
                        letterSpacing: "2%",
                        color: "black",
                        wordBreak: "break-word"
                      }}
                    >
                      {answeringQuestion.question}
                    </div>
                  </Col>
                  <Col md={4} className="text-end">
                    <button
                      style={{
                        backgroundColor: "white",
                        color: "#000",
                        border: "1px solid #ccc",
                        marginRight: "10px",
                        borderRadius: "5px",
                        padding: "8px 16px",
                        cursor: "pointer",
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
                      }}
                      onClick={() => handleQuestionStatusUpdate('answer')}
                      disabled={submittingAnswer}
                    >
                      Mark as Answered
                    </button>
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
        {/* Event info - Exact match to image */}
        <Row>
          <Col md={6}>
            <p style={{ marginBottom: "8px" }}>
              <strong>Event Title:</strong> {event?.title || 'ISCA Conference 2025'}
            </p>
            <p style={{ marginBottom: "8px" }}>
              <strong>Track Title:</strong> {engagement?.trackTitle || 'CFO'}
            </p>
            <p style={{ marginBottom: "8px" }}>
              <strong>Session Title:</strong> {selectedSession?.title || 'Happy birthday to you'}
            </p>
          </Col>
          <Col md={6}>
            <p style={{ marginBottom: "8px" }}>
              <strong>Start Date:</strong> 10/15/2025
            </p>
            <p style={{ marginBottom: "8px" }}>
              <strong>End Date:</strong> 10/15/2025
            </p>
            <p style={{ marginBottom: "8px" }}>
              <strong>Time:</strong> 1:30 PM - 2:30 PM
            </p>
          </Col>
        </Row>


        {/* URL Field - Exact match to image */}
        <Row className="mb-3">
          <Col>
            <p style={{ marginBottom: "8px" }}>
              <strong>URL to display answering question:</strong>
            </p>
            <Form.Control
              readOnly
              value={selectedSession?.title ? `https://evential.org.sg/q&a/answering/session-title-${selectedSession.title.toLowerCase().replace(/\s+/g, '-')}` : `https://evential.org.sg/q&a/answering/session-title-happy-birthday-to-you`}
              style={{
                backgroundColor: "#D9D9D9",
                border: "1px solid #ccc",
                color: "#666",
              }}
            />
          </Col>
        </Row>


        {/* Legend - Exact match to image */}
        <Row className="mb-3">
          <Col>
            <div className="d-flex align-items-center">
              <div
                style={{
                  width: "20px",
                  height: "20px",
                  border: "1px solid #ccc",
                  marginRight: "8px",
                  backgroundColor: "white",
                }}
              ></div>
              <span style={{ marginRight: "24px" }}>Not Answered</span>
              <div
                style={{
                  width: "20px",
                  height: "20px",
                  backgroundColor: "#4E6688",
                  marginRight: "8px",
                }}
              ></div>
              <span style={{ marginRight: "24px" }}>Answered</span>
              <div
                style={{
                  width: "20px",
                  height: "20px",
                  backgroundColor: "#71C0BB",
                  marginRight: "8px",
                }}
              ></div>
              <span>Answering</span>
            </div>
          </Col>
        </Row>

        {/* Table - Fully responsive with all columns wrapping */}
        <div className="table-responsive" style={{ marginTop: "20px" }}>
          <Table bordered style={{ 
            borderCollapse: 'collapse', 
            width: '100%', 
            minWidth: '500px',
            border: "3px solid #D4D6DD"
          }}>
            <thead style={{ backgroundColor: "#000", color: "white" }}>
              <tr>
                <th style={{ 
                  border: "3px solid #D4D6DD", 
                  padding: "8px", 
                  backgroundColor: "#000", 
                  color: "white",
                  width: "45%",
                  minWidth: "150px",
                  fontSize: "14px",
                  textAlign: "center"
                }}>Questions</th>
                <th style={{ 
                  border: "3px solid #D4D6DD", 
                  padding: "8px", 
                  backgroundColor: "#000", 
                  color: "white",
                  width: "15%",
                  minWidth: "60px",
                  fontSize: "14px",
                  textAlign: "center"
                }}>Votes</th>
                <th style={{ 
                  border: "3px solid #D4D6DD", 
                  padding: "8px", 
                  backgroundColor: "#000", 
                  color: "white",
                  width: "20%",
                  minWidth: "80px",
                  fontSize: "14px",
                  textAlign: "center"
                }}>Status</th>
                <th style={{ 
                  border: "3px solid #D4D6DD", 
                  padding: "8px", 
                  backgroundColor: "#000", 
                  color: "white",
                  width: "20%",
                  minWidth: "100px",
                  fontSize: "14px",
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
                      border: q.status === "answered" ? "3px solid #4E6688" : q.status === "answering" ? "3px solid #71C0BB" : "3px solid #D4D6DD", 
                      padding: "8px",
                      // textAlign: "center",
                      wordBreak: "break-word",
                      wordWrap: "break-word",
                      whiteSpace: "normal",
                      lineHeight: "1.3",
                      verticalAlign: "middle",
                      fontSize: "13px"
                    }}>
                      {q.question}
                    </td>
                    <td style={{ 
                      backgroundColor: "#ffffff",
                      color: "black",
                      border: "3px solid #D4D6DD", 
                      padding: "8px", 
                      textAlign: "center",
                      verticalAlign: "middle",
                      fontSize: "13px"
                    }}>
                      {q.likesCount}
                    </td>
                    <td style={{ 
                      backgroundColor: "#ffffff",
                      color: "black",
                      border: "3px solid #D4D6DD", 
                      padding: "8px",
                      textAlign: "center",
                      verticalAlign: "middle",
                      wordBreak: "break-word",
                      wordWrap: "break-word",
                      whiteSpace: "normal",
                      fontSize: "13px"
                    }}>
                      {getStatusText(q.status)}
                    </td>
                    <td style={{ 
                      backgroundColor: "#ffffff",
                      color: "black",
                      border: "3px solid #D4D6DD", 
                      padding: "6px", 
                      textAlign: "center",
                      verticalAlign: "top"
                    }}>
                      <div className="d-flex gap-2 justify-content-center flex-wrap">
                        <button
                          className="btn btn-icon"
                          style={{
                            width: "48px",
                            height: "48px",
                            borderRadius: "50%",
                            border: "none",
                            backgroundColor: "transparent",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                            padding: 0,
                            color: q.status === "answering" ? "#71C0BB" : "#D4D6DD"
                          }}
                          onClick={() => setAnsweringQuestion(q)}
                          title="Answer Question"
                        >
                          <i className="feather icon-message-circle" style={{ fontSize: "24px" }}></i>
                        </button>
                        <button
                          className="btn btn-icon"
                          style={{
                            width: "48px",
                            height: "48px",
                            borderRadius: "50%",
                            border: "none",
                            backgroundColor: "transparent",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                            padding: 0,
                            color: "#71C0BB"
                          }}
                          title="Edit Question"
                          onClick={() => handleEditQuestion(q.id)}
                        >
                          <i className="feather icon-edit" style={{ fontSize: "24px" }}></i>
                        </button>
                        <button
                          className="btn btn-icon"
                          style={{
                            width: "48px",
                            height: "48px",
                            borderRadius: "50%",
                            border: "none",
                            backgroundColor: "transparent",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                            padding: 0,
                            color: "#71C0BB"
                          }}
                          onClick={() => handleDeleteQuestion(q.id)}
                          title="Delete Question"
                        >
                          <i className="feather icon-trash-2" style={{ fontSize: "24px" }}></i>
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
    </div>
  );
};

export default ModeratorLandingPage;
