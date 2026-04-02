import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Container, Row, Col, Button, Badge, Table, Form, Alert } from 'react-bootstrap';
import { toast } from 'react-toastify';
import axios from 'axios';

const ModeratorQAPage = () => {
    const { moderatorId, eventId } = useParams();
    const [moderator, setModerator] = useState(null);
    const [event, setEvent] = useState(null);
    const [engagement, setEngagement] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [answeringQuestion, setAnsweringQuestion] = useState(null);
    const [answerText, setAnswerText] = useState('');
    const [submittingAnswer, setSubmittingAnswer] = useState(false);

    useEffect(() => {
        fetchData();
    }, [moderatorId, eventId]);

    const fetchData = async () => {
        try {
            setLoading(true);
            
            // Fetch moderator details
            const moderatorResponse = await axios.get(`${process.env.REACT_APP_API_URL}/api/moderators/${moderatorId}`);
            setModerator(moderatorResponse.data.data);

            // Fetch event details
            const eventResponse = await axios.get(`${process.env.REACT_APP_API_URL}/api/events/${eventId}`);
            setEvent(eventResponse.data.data);

            // Fetch engagement for this event
            const engagementResponse = await axios.get(`${process.env.REACT_APP_API_URL}/api/engagements/event/${eventId}`);
            if (engagementResponse.data.data && engagementResponse.data.data.length > 0) {
                setEngagement(engagementResponse.data.data[0]);
                
                // Fetch questions for this engagement
                const questionsResponse = await axios.get(`${process.env.REACT_APP_API_URL}/api/engagements/qna/questions?engagementId=${engagementResponse.data.data[0].id}`);
                setQuestions(questionsResponse.data.data || []);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            toast.error('Error loading data');
        } finally {
            setLoading(false);
        }
    };

    const handleAnswerQuestion = async (questionId) => {
        if (!answerText.trim()) {
            toast.error('Please enter an answer');
            return;
        }

        try {
            setSubmittingAnswer(true);
            await axios.put(`${process.env.REACT_APP_API_URL}/api/engagements/qna/${questionId}/answer`, {
                answer: answerText
            });

            toast.success('Answer submitted successfully');
            setAnsweringQuestion(null);
            setAnswerText('');
            fetchData(); // Refresh questions
        } catch (error) {
            console.error('Error answering question:', error);
            toast.error('Error submitting answer');
        } finally {
            setSubmittingAnswer(false);
        }
    };

    const handleLikeQuestion = async (questionId) => {
        try {
            await axios.post(`${process.env.REACT_APP_API_URL}/api/engagements/qna/like`, {
                questionId
            });
            fetchData(); // Refresh questions
        } catch (error) {
            console.error('Error liking question:', error);
            toast.error('Error updating like');
        }
    };

    const handleDeleteQuestion = async (questionId) => {
        if (window.confirm('Are you sure you want to delete this question?')) {
            try {
                await axios.delete(`${process.env.REACT_APP_API_URL}/api/engagements/qna/${questionId}`);
                toast.success('Question deleted successfully');
                fetchData(); // Refresh questions
            } catch (error) {
                console.error('Error deleting question:', error);
                toast.error('Error deleting question');
            }
        }
    };

    const formatTime = (timeString) => {
        if (!timeString) return '';
        const time = new Date(`2000-01-01T${timeString}`);
        return time.toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true 
        });
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'answered': return '#007bff';
            case 'answering': return '#17a2b8';
            default: return '#ffffff';
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'answered': return 'Answered';
            case 'answering': return 'Answering';
            default: return 'Not Answered';
        }
    };

    if (loading) {
        return (
            <Container className="mt-4">
                <div className="text-center">
                    <div className="spinner-border" role="status">
                        <span className="sr-only">Loading...</span>
                    </div>
                </div>
            </Container>
        );
    }

    if (!moderator || !event || !engagement) {
        return (
            <Container className="mt-4">
                <Alert variant="danger">
                    <h4>Access Denied</h4>
                    <p>You don't have permission to access this event or the event doesn't exist.</p>
                </Alert>
            </Container>
        );
    }

    return (
        <Container fluid className="p-0">
            {/* Answering Question Banner - Exact match to image */}
            {answeringQuestion && (
                <div style={{ 
                    backgroundColor: '#17a2b8', 
                    color: 'white', 
                    padding: '20px',
                    marginBottom: '0px'
                }}>
                    <Container>
                        <Row className="align-items-center">
                            <Col md={8}>
                                <div style={{ 
                                    fontSize: '14px', 
                                    marginBottom: '5px',
                                    color: '#f8f9fa',
                                    fontWeight: 'normal'
                                }}>
                                    This question is now being answered:
                                </div>
                                <div style={{ 
                                    fontSize: '18px', 
                                    fontWeight: 'bold', 
                                    fontStyle: 'italic',
                                    color: '#ffffff'
                                }}>
                                    {answeringQuestion.question}
                                </div>
                            </Col>
                            <Col md={4} className="text-end">
                                <Button 
                                    variant="light" 
                                    className="me-2"
                                    style={{
                                        backgroundColor: 'white',
                                        color: '#000',
                                        border: '1px solid #ccc',
                                        borderRadius: '4px',
                                        padding: '8px 16px',
                                        fontWeight: 'normal'
                                    }}
                                    onClick={() => setAnsweringQuestion(null)}
                                >
                                    Cancel Answering
                                </Button>
                                <Button 
                                    variant="primary"
                                    style={{
                                        backgroundColor: '#007bff',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        padding: '8px 16px',
                                        fontWeight: 'normal'
                                    }}
                                    onClick={() => handleAnswerQuestion(answeringQuestion.id)}
                                    disabled={submittingAnswer}
                                >
                                    Mark as Answered
                                </Button>
                            </Col>
                        </Row>
                    </Container>
                </div>
            )}

            {/* Event Information - Exact match to image */}
            <Container className="mt-4">
                <Row>
                    <Col md={6}>
                        <p style={{ marginBottom: '8px', fontSize: '16px' }}><strong>Event Title:</strong> {event.title}</p>
                        <p style={{ marginBottom: '8px', fontSize: '16px' }}><strong>Track Title:</strong> {engagement.trackTitle}</p>
                        <p style={{ marginBottom: '8px', fontSize: '16px' }}><strong>Session Title:</strong> {engagement.title}</p>
                    </Col>
                    <Col md={6}>
                        <p style={{ marginBottom: '8px', fontSize: '16px' }}><strong>Start Date:</strong> {event.startDate ? new Date(event.startDate).toLocaleDateString() : 'Not set'}</p>
                        <p style={{ marginBottom: '8px', fontSize: '16px' }}><strong>End Date:</strong> {event.endDate ? new Date(event.endDate).toLocaleDateString() : 'Not set'}</p>
                        <p style={{ marginBottom: '8px', fontSize: '16px' }}><strong>Time:</strong> {engagement.startTime && formatTime(engagement.startTime)} - {engagement.endTime && formatTime(engagement.endTime)}</p>
                    </Col>
                </Row>

                {/* URL Field */}
                <Row className="mt-3">
                    <Col md={12}>
                        <p style={{ marginBottom: '8px', fontSize: '16px' }}><strong>URL to display answering question:</strong></p>
                        <Form.Control 
                            type="text" 
                            value={`${window.location.origin}/moderator/qa/${moderatorId}/${eventId}`}
                            readOnly
                            style={{ 
                                backgroundColor: '#f8f9fa',
                                border: '1px solid #ccc',
                                borderRadius: '4px',
                                padding: '8px 12px',
                                fontSize: '14px'
                            }}
                        />
                    </Col>
                </Row>

                {/* Status Legend */}
                <Row className="mt-3">
                    <Col md={12}>
                        <div className="d-flex align-items-center">
                            <div className="d-flex align-items-center me-3">
                                <div style={{ 
                                    width: '20px', 
                                    height: '20px', 
                                    backgroundColor: '#ffffff', 
                                    border: '1px solid #ccc',
                                    marginRight: '5px'
                                }}></div>
                                <span style={{ fontSize: '14px' }}>Not Answered</span>
                            </div>
                            <div className="d-flex align-items-center me-3">
                                <div style={{ 
                                    width: '20px', 
                                    height: '20px', 
                                    backgroundColor: '#007bff',
                                    marginRight: '5px'
                                }}></div>
                                <span style={{ fontSize: '14px' }}>Answered</span>
                            </div>
                            <div className="d-flex align-items-center">
                                <div style={{ 
                                    width: '20px', 
                                    height: '20px', 
                                    backgroundColor: '#17a2b8',
                                    marginRight: '5px'
                                }}></div>
                                <span style={{ fontSize: '14px' }}>Answering</span>
                            </div>
                        </div>
                    </Col>
                </Row>
            </Container>

            {/* Questions Table */}
            <Container className="mt-4">
                <Table bordered style={{ borderCollapse: 'collapse' }}>
                    <thead style={{ backgroundColor: '#000', color: 'white' }}>
                        <tr>
                            <th style={{ padding: '12px', border: '1px solid #000' }}>Questions</th>
                            <th style={{ padding: '12px', border: '1px solid #000' }}>Votes</th>
                            <th style={{ padding: '12px', border: '1px solid #000' }}>Status</th>
                            <th style={{ padding: '12px', border: '1px solid #000' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {questions.map((question, index) => {
                            const isAnswering = answeringQuestion && answeringQuestion.id === question.id;
                            const rowBgColor = isAnswering ? '#17a2b8' : 
                                             question.status === 'answered' ? '#007bff' : 
                                             'white';
                            const textColor = (isAnswering || question.status === 'answered') ? 'white' : 'black';
                            
                            return (
                                <tr key={question.id} style={{ 
                                    backgroundColor: rowBgColor,
                                    color: textColor
                                }}>
                                    <td style={{ 
                                        padding: '12px', 
                                        border: '1px solid #ccc',
                                        fontWeight: 'bold',
                                        fontStyle: 'italic'
                                    }}>
                                        {question.question}
                                    </td>
                                    <td style={{ 
                                        padding: '12px', 
                                        border: '1px solid #ccc',
                                        textAlign: 'center'
                                    }}>
                                        {question.likesCount || 0}
                                    </td>
                                    <td style={{ 
                                        padding: '12px', 
                                        border: '1px solid #ccc'
                                    }}>
                                        {isAnswering ? 'Answering' : getStatusText(question.status)}
                                        {question.status === 'not_answered' && !isAnswering && (
                                            <i className="fas fa-check-circle ms-2" style={{ fontSize: '12px' }}></i>
                                        )}
                                    </td>
                                    <td style={{ 
                                        padding: '12px', 
                                        border: '1px solid #ccc'
                                    }}>
                                        <div className="d-flex gap-2">
                                            <Button
                                                variant="light"
                                                size="sm"
                                                style={{ 
                                                    width: '30px', 
                                                    height: '30px', 
                                                    borderRadius: '50%',
                                                    backgroundColor: isAnswering ? '#f8f9fa' : '#17a2b8',
                                                    border: '1px solid #dee2e6',
                                                    color: isAnswering ? '#000' : 'white'
                                                }}
                                                onClick={() => {
                                                    setAnsweringQuestion(question);
                                                    setAnswerText(question.answer || '');
                                                }}
                                                title="Answer"
                                            >
                                                <i className="fas fa-comment-dots"></i>
                                            </Button>
                                            <Button
                                                variant="light"
                                                size="sm"
                                                style={{ 
                                                    width: '30px', 
                                                    height: '30px', 
                                                    borderRadius: '50%',
                                                    backgroundColor: isAnswering ? '#f8f9fa' : '#17a2b8',
                                                    border: '1px solid #dee2e6',
                                                    color: isAnswering ? '#000' : 'white'
                                                }}
                                                onClick={() => handleLikeQuestion(question.id)}
                                                title="Like"
                                            >
                                                <i className="fas fa-thumbs-up"></i>
                                            </Button>
                                            <Button
                                                variant="light"
                                                size="sm"
                                                style={{ 
                                                    width: '30px', 
                                                    height: '30px', 
                                                    borderRadius: '50%',
                                                    backgroundColor: isAnswering ? '#f8f9fa' : '#17a2b8',
                                                    border: '1px solid #dee2e6',
                                                    color: isAnswering ? '#000' : 'white'
                                                }}
                                                onClick={() => handleDeleteQuestion(question.id)}
                                                title="Delete"
                                            >
                                                <i className="fas fa-trash"></i>
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </Table>
            </Container>

            {/* Answer Modal */}
            {answeringQuestion && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    zIndex: 1050,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <div style={{
                        backgroundColor: 'white',
                        padding: '30px',
                        borderRadius: '10px',
                        width: '80%',
                        maxWidth: '600px'
                    }}>
                        <h4>Answer Question</h4>
                        <p><strong>Question:</strong> {answeringQuestion.question}</p>
                        <Form.Group className="mb-3">
                            <Form.Label>Your Answer:</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={4}
                                value={answerText}
                                onChange={(e) => setAnswerText(e.target.value)}
                                placeholder="Enter your answer here..."
                            />
                        </Form.Group>
                        <div className="d-flex justify-content-end gap-2">
                            <Button 
                                variant="secondary" 
                                onClick={() => {
                                    setAnsweringQuestion(null);
                                    setAnswerText('');
                                }}
                            >
                                Cancel
                            </Button>
                            <Button 
                                variant="primary"
                                onClick={() => handleAnswerQuestion(answeringQuestion.id)}
                                disabled={submittingAnswer}
                            >
                                {submittingAnswer ? 'Submitting...' : 'Submit Answer'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </Container>
    );
};

export default ModeratorQAPage;
