import React, { useState, useEffect } from "react";
import { Container, Row, Col, Button, Table, Form, Spinner, Alert } from "react-bootstrap";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";
import axios from "axios";

const ModeratorLandingPage = () => {
  const { moderatorId } = useParams();
  const [moderator, setModerator] = useState(null);
  const [event, setEvent] = useState(null);
  const [engagement, setEngagement] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [answeringQuestion, setAnsweringQuestion] = useState(null);

  useEffect(() => {
    fetchData();
  }, [moderatorId]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Dummy data (for preview)
      const dummyModerator = {
        id: moderatorId,
        name: "John Smith",
        email: "john.smith@example.com",
      };

      const dummyEvent = {
        id: "event-1",
        title: "ISCA Conference 2025",
        startDate: "2025-11-12",
        endDate: "2025-11-12",
      };

      const dummyEngagement = {
        id: "engagement-1",
        trackTitle: "CFO",
        title: "Happy birthday to you",
        startTime: "09:00:00",
        endTime: "13:00:00",
      };

      const dummyQuestions = [
        {
          id: "q1",
          question: "If ABC happened, how will it affects DEF?",
          likesCount: 12,
          status: "answering",
        },
        {
          id: "q2",
          question: "If ABC happened, how will it affects DEF?",
          likesCount: 10,
          status: "not_answered",
        },
        {
          id: "q3",
          question: "If ABC happened, how will it affects DEF?",
          likesCount: 8,
          status: "not_answered",
        },
        {
          id: "q4",
          question: "If ABC happened, how will it affects DEF?",
          likesCount: 14,
          status: "answered",
        },
      ];

      setModerator(dummyModerator);
      setEvent(dummyEvent);
      setEngagement(dummyEngagement);
      setQuestions(dummyQuestions);
    } catch (err) {
      toast.error("Error fetching data");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "answering":
        return "#17a2b8";
      case "answered":
        return "#007bff";
      default:
        return "#ffffff";
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
        <p className="mt-3">Loading...</p>
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

  const formatTime = (time) => {
    if (!time) return "";
    const d = new Date(`2000-01-01T${time}`);
    return d.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <div style={{ backgroundColor: "#f8f9fa", minHeight: "100vh" }}>
      {/* Top banner when answering */}
      {answeringQuestion && (
        <div
          style={{
            backgroundColor: "#17a2b8",
            color: "white",
            padding: "20px",
          }}
        >
          <Container>
            <Row>
              <Col md={8}>
                <div style={{ fontSize: "14px" }}>This question is now being answered:</div>
                <div
                  style={{
                    fontSize: "20px",
                    fontStyle: "italic",
                    fontWeight: "bold",
                    color: "white",
                  }}
                >
                  {answeringQuestion.question}
                </div>
              </Col>
              <Col md={4} className="text-end">
                <Button
                  variant="light"
                  style={{
                    color: "#000",
                    border: "1px solid #ccc",
                    marginRight: "10px",
                  }}
                  onClick={() => setAnsweringQuestion(null)}
                >
                  Cancel Answering
                </Button>
                <Button
                  style={{
                    backgroundColor: "#505c8c",
                    border: "none",
                  }}
                  onClick={() => {
                    toast.success("Marked as Answered");
                    setAnsweringQuestion(null);
                  }}
                >
                  Mark as Answered
                </Button>
              </Col>
            </Row>
          </Container>
        </div>
      )}

      <Container className="py-4">
        {/* Event info */}
        <Row>
          <Col md={6}>
            <p>
              <strong>Event Title:</strong> {event.title}
            </p>
            <p>
              <strong>Track Title:</strong> {engagement.trackTitle}
            </p>
            <p>
              <strong>Session Title:</strong> {engagement.title}
            </p>
          </Col>
          <Col md={6}>
            <p>
              <strong>Start Date:</strong>{" "}
              {new Date(event.startDate).toLocaleDateString()}
            </p>
            <p>
              <strong>End Date:</strong>{" "}
              {new Date(event.endDate).toLocaleDateString()}
            </p>
            <p>
              <strong>Time:</strong> {formatTime(engagement.startTime)} -{" "}
              {formatTime(engagement.endTime)}
            </p>
          </Col>
        </Row>

        {/* URL Field */}
        <Row className="mb-3">
          <Col>
            <p>
              <strong>URL to display answering question:</strong>
            </p>
            <Form.Control
              readOnly
              value="https://evential.org.sg/q&a/answering/session-title-happy-birthday-to-you"
              style={{
                backgroundColor: "#f8f9fa",
                border: "1px solid #ccc",
              }}
            />
          </Col>
        </Row>

        {/* Legend */}
        <Row className="mb-3">
          <Col>
            <div className="d-flex align-items-center">
              <div
                style={{
                  width: "20px",
                  height: "20px",
                  border: "1px solid #ccc",
                  marginRight: "5px",
                  backgroundColor: "white",
                }}
              ></div>
              <span className="me-4">Not Answered</span>
              <div
                style={{
                  width: "20px",
                  height: "20px",
                  backgroundColor: "#007bff",
                  marginRight: "5px",
                }}
              ></div>
              <span className="me-4">Answered</span>
              <div
                style={{
                  width: "20px",
                  height: "20px",
                  backgroundColor: "#17a2b8",
                  marginRight: "5px",
                }}
              ></div>
              <span>Answering</span>
            </div>
          </Col>
        </Row>

        {/* Table */}
        <Table bordered>
          <thead style={{ backgroundColor: "#000", color: "white" }}>
            <tr>
              <th>Questions</th>
              <th>Votes</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {questions.map((q) => (
              <tr
                key={q.id}
                style={{
                  backgroundColor: getStatusColor(q.status),
                  color:
                    q.status === "answering" || q.status === "answered"
                      ? "white"
                      : "black",
                  fontWeight: "bold",
                  fontStyle: "italic",
                }}
              >
                <td>{q.question}</td>
                <td className="text-center">{q.likesCount}</td>
                <td>{getStatusText(q.status)}</td>
                <td>
                  <div className="d-flex gap-2 justify-content-center">
                    <Button
                      size="sm"
                      variant="info"
                      style={{
                        borderRadius: "50%",
                        width: "32px",
                        height: "32px",
                      }}
                      onClick={() => setAnsweringQuestion(q)}
                    >
                      <i className="fas fa-comment-dots"></i>
                    </Button>
                    <Button
                      size="sm"
                      variant="info"
                      style={{
                        borderRadius: "50%",
                        width: "32px",
                        height: "32px",
                      }}
                    >
                      <i className="fas fa-thumbs-up"></i>
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      style={{
                        borderRadius: "50%",
                        width: "32px",
                        height: "32px",
                      }}
                      onClick={() => toast.info("Deleted")}
                    >
                      <i className="fas fa-trash"></i>
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Container>
    </div>
  );
};

export default ModeratorLandingPage;
