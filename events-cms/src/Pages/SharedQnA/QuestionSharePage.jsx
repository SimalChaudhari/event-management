import React, { useState, useEffect } from "react";
import { Container, Row, Col, Spinner, Alert, Card, Badge } from "react-bootstrap";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { API_URL } from "../../configs/env";

const QuestionSharePage = () => {
  const { shareToken } = useParams();
  
  const [question, setQuestion] = useState(null);
  const [session, setSession] = useState(null);
  const [track, setTrack] = useState(null);
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, [shareToken]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!shareToken) {
        setError('Share token is required');
        setLoading(false);
        return;
      }

      // Fetch from public API endpoint without authentication
      const response = await fetch(`${API_URL}/api/engagements/qna/question/${shareToken}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success && data.data) {
        setQuestion(data.data.question);
        setSession(data.data.session);
        setTrack(data.data.track);
        setEvent(data.data.event);
      } else {
        setError(data.message || 'Failed to fetch question data');
        toast.error(data.message || 'Failed to fetch question data');
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Failed to fetch question data");
      toast.error("Failed to fetch question data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ 
        minHeight: "100vh", 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center",
        backgroundColor: "#f8f9fa"
      }}>
        <div className="text-center">
          <Spinner animation="border" style={{ color: "#71C0BB" }} />
          <p className="mt-3" style={{ color: "#333" }}>Loading question...</p>
        </div>
      </div>
    );
  }

  if (error || !question) {
    return (
      <Container className="mt-5">
        <Alert variant="danger">
          <h5>Error</h5>
          <p>{error || 'Question not found or link has expired.'}</p>
        </Alert>
      </Container>
    );
  }

  // Get background image URL
  const backgroundImageUrl = event?.backgroundImage 
    ? `${API_URL}/${event.backgroundImage.replace(/\\/g, '/')}`
    : null;


  return (
    <div 
      style={{ 
        minHeight: "100vh",
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden"
      }}
    >
      {/* Blurred background image */}
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
        ></div>
      )}
      {/* Light overlay for better black text visibility */}
      <div style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(255, 255, 255, 0.3)",
        zIndex: 1
      }}></div>

      {/* Question Display - Centered */}
      <Container fluid className="py-5" style={{ position: "relative", zIndex: 2 }}>
        <Row className="justify-content-center align-items-center" style={{ minHeight: "80vh" }}>
          <Col xl={10} lg={11} md={12}>
            <h1 style={{
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
            }}>
              {question.question}
            </h1>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default QuestionSharePage;
