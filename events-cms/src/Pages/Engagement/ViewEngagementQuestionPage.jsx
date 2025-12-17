import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Card, Row, Col, Badge, Button, Alert, Spinner } from 'react-bootstrap';
import DateTimeFormatter from '../../components/dateTime/DateTimeFormatter';
import { getEngagementQAQuestionById } from '../../store/actions/engagementQnaActions';
import { getEngagementById } from '../../store/actions/engagementActions';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../../assets/css/event.css';

const ViewEngagementQuestionPage = () => {
    const { engagementId, questionId } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const location = useLocation();

    const { selectedEngagement } = useSelector((state) => state.engagement);
    const { selectedQuestion, loading } = useSelector((state) => state.engagementQna);

    const [error, setError] = useState(null);
    const hasFetchedDataRef = React.useRef(false);

    // Text truncation states
    const [showFullQuestion, setShowFullQuestion] = useState(false);
    const [showFullAnswer, setShowFullAnswer] = useState(false);

    // Load data on mount
    useEffect(() => {
        // Prevent multiple API calls
        if (hasFetchedDataRef.current) return;
        
        if (questionId) {
            // Load question by ID (engagementId is optional)
            dispatch(getEngagementQAQuestionById(questionId));
            
            // Load engagement only if engagementId is provided
            if (engagementId && engagementId !== 'unknown') {
                dispatch(getEngagementById(engagementId));
            }
            
            hasFetchedDataRef.current = true;
        }
    }, [dispatch, engagementId, questionId]);

    const handleBack = useCallback(() => {
        // Check if we have sessionId in query params
        const params = new URLSearchParams(location.search);
        const sessionId = params.get('sessionId');
        
        if (sessionId) {
            navigate(-1);
        }
    }, [navigate, engagementId, location.search]);

    const truncateText = (text, maxLength = 200) => {
        if (!text) return '';
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    };

    const toggleQuestionText = () => {
        setShowFullQuestion(!showFullQuestion);
    };

    const toggleAnswerText = () => {
        setShowFullAnswer(!showFullAnswer);
    };

    const getStatusBadge = (status) => {
        const statusConfig = {
            answered: { variant: 'success', text: 'Answered' },
            not_answered: { variant: 'warning', text: 'Not Answered' },
        };

        const config = statusConfig[status] || { variant: 'secondary', text: status };
        return <Badge bg={config.variant}>{config.text}</Badge>;
    };

    const renderQuestionStats = () => (
        <Row>
            <Col xs={6} md={3} className="mb-3">
                <div className="text-center p-3 bg-light rounded border">
                    <i className="fas fa-heart text-primary mb-2" style={{ fontSize: '1.5rem' }}></i>
                    <h6 className="mb-1 text-muted" style={{ fontSize: '0.9rem' }}>
                        Likes
                    </h6>
                    <p className="mb-0 text-success" style={{ fontSize: '0.95rem', fontWeight: '500' }}>
                        {selectedQuestion?.likesCount || 0}
                    </p>
                </div>
            </Col>
            <Col xs={6} md={3} className="mb-3">
                <div className="text-center p-3 bg-light rounded border">
                    <i className="fas fa-user text-primary mb-2" style={{ fontSize: '1.5rem' }}></i>
                    <h6 className="mb-1 text-muted" style={{ fontSize: '0.9rem' }}>
                        Asked By
                    </h6>
                    <p className="mb-0" style={{ fontSize: '0.95rem', fontWeight: '500' }}>
                        {selectedQuestion?.askedBy?.fullName || 'Unknown'}
                    </p>
                </div>
            </Col>
            <Col xs={6} md={3} className="mb-3">
                <div className="text-center p-3 bg-light rounded border">
                    <i className="fas fa-layer-group text-primary mb-2" style={{ fontSize: '1.5rem' }}></i>
                    <h6 className="mb-1 text-muted" style={{ fontSize: '0.9rem' }}>
                        Track
                    </h6>
                    <p className="mb-0" style={{ fontSize: '0.95rem', fontWeight: '500' }}>
                        {selectedQuestion?.engagement?.trackTitle || selectedEngagement?.programmeTrack?.title || 'N/A'}
                    </p>
                </div>
            </Col>
            <Col xs={6} md={3} className="mb-3">
                <div className="text-center p-3 bg-light rounded border">
                    <i className="fas fa-check-circle text-primary mb-2" style={{ fontSize: '1.5rem' }}></i>
                    <h6 className="mb-1 text-muted" style={{ fontSize: '0.9rem' }}>
                        Status
                    </h6>
                    <div className="mb-0">
                        {getStatusBadge(selectedQuestion?.status || (selectedQuestion?.answer ? 'answered' : 'not_answered'))}
                    </div>
                </div>
            </Col>
        </Row>
    );

    if (loading) {
        return (
            <div className="mt-4">
                <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '50vh' }}>
                    <Spinner animation="border" role="status">
                        <span className="sr-only">Loading...</span>
                    </Spinner>
                </div>
            </div>
        );
    }

    if (error || !selectedQuestion) {
        return (
            <div className="mt-4">
                <div className="mb-3 bg-white rounded p-4 shadow-sm">
                    <Alert variant="danger">
                        <Alert.Heading>Error</Alert.Heading>
                        <p>{error || 'Question not found'}</p>
                        <Button variant="outline-danger" onClick={handleBack}>
                            <i className="fas fa-arrow-left me-2"></i>
                            Back to Q&A
                        </Button>
                    </Alert>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="mt-4">
                {/* Header with Stats */}
                <div className="mb-3 bg-white rounded p-4 shadow-sm">
                    <div className="d-flex justify-content-between align-items-center">
                        <div>
                            <h4 className="card-title mb-1">View Question</h4>
                           
                        </div>
                        <div className="d-flex gap-2">
                            <Button variant="secondary" onClick={handleBack}>
                                <i className="fas fa-arrow-left" style={{ marginRight: '8px' }}></i>
                                Back
                            </Button>
                        </div>
                    </div>
                    <hr />
                    {renderQuestionStats()}
                </div>

                {/* Main Content */}
                <div className="bg-white rounded p-4 shadow-sm">
                    <div className="p-3">
                        {/* Question Section */}
                        <Card className="mb-4 border-0 shadow-sm">
                                <Card.Header style={{ backgroundColor: '#fff5f5', borderBottom: '2px solid #dc3545' }}>
                                    <h5 className="mb-0 text-danger">
                                        <i className="fas fa-question-circle me-2" style={{ marginRight: '10px' }}></i>
                                        Question
                                    </h5>
                                </Card.Header>
                                <Card.Body className="p-4">
                                    <p style={{ fontSize: '18px', lineHeight: '1.8', color: '#2c3e50', fontWeight: '500' }}>
                                        {showFullQuestion ? selectedQuestion.question : truncateText(selectedQuestion.question)}
                                    </p>
                                    {selectedQuestion.question && selectedQuestion.question.length > 200 && (
                                        <Button
                                            variant="link"
                                            onClick={toggleQuestionText}
                                            className="p-0 text-decoration-none"
                                        >
                                            {showFullQuestion ? 'Show Less' : 'Read More'}
                                        </Button>
                                    )}
                                    <div className="mt-4 pt-3 border-top">
                                        <p className="mb-3" style={{ fontSize: '14px' }}>
                                            <i className="fas fa-user" style={{ color: '#4680ff', fontSize: '18px', marginRight: '15px' }}></i>
                                            <strong>Asked by :</strong> {selectedQuestion.askedBy?.fullName || 'Unknown'}
                                        </p>
                                        <p className="mb-3" style={{ fontSize: '14px' }}>
                                            <i className="fas fa-clock" style={{ color: '#17a2b8', fontSize: '18px', marginRight: '15px' }}></i>
                                            <DateTimeFormatter date={selectedQuestion.createdAt} />
                                        </p>
                                        <p className="mb-0" style={{ fontSize: '14px' }}>
                                            <i className="fas fa-heart" style={{ color: '#e91e63', fontSize: '18px', marginRight: '15px' }}></i>
                                            {selectedQuestion.likesCount || 0} Likes
                                        </p>
                                    </div>
                                </Card.Body>
                        </Card>

                        {/* Answer Section */}
                        {selectedQuestion.answer ? (
                            <Card className="mb-4 border-0 shadow-sm">
                                <Card.Header style={{ backgroundColor: '#f0f9ff', borderBottom: '2px solid #3b82f6' }}>
                                    <h5 className="mb-0 text-primary">
                                        <i className="fas fa-reply me-2" style={{ marginRight: '10px' }}></i>
                                        Answer
                                    </h5>
                                </Card.Header>
                                <Card.Body className="p-4">
                                    <p style={{ fontSize: '18px', lineHeight: '1.8', color: '#1e40af', fontWeight: '500' }}>
                                        {showFullAnswer ? selectedQuestion.answer : truncateText(selectedQuestion.answer)}
                                    </p>
                                    {selectedQuestion.answer && selectedQuestion.answer.length > 200 && (
                                        <Button
                                            variant="link"
                                            onClick={toggleAnswerText}
                                            className="p-0 text-decoration-none"
                                        >
                                            {showFullAnswer ? 'Show Less' : 'Read More'}
                                        </Button>
                                    )}
                                    {selectedQuestion.answeredAt && (
                                        <div className="mt-4 pt-3 border-top">
                                            <p className="mb-0" style={{ fontSize: '14px' }}>
                                                <i className="fas fa-clock" style={{ color: '#28a745', fontSize: '18px', marginRight: '15px' }}></i>
                                                <strong>Answered on :</strong> <DateTimeFormatter date={selectedQuestion.answeredAt} />
                                            </p>
                                        </div>
                                    )}
                                </Card.Body>
                            </Card>
                        ) : (
                            <Alert variant="warning">
                                <i className="fas fa-info-circle me-2"></i>
                                This question has not been answered yet.
                            </Alert>
                        )}

                        {/* Additional Info */}
                        <Card className="border-0 shadow-sm">
                            <Card.Header className="bg-light">
                                <h6 className="mb-0">
                                    <i className="fas fa-info-circle" style={{ marginRight: '10px' }}></i>
                                    Status
                                </h6>
                            </Card.Header>
                            <Card.Body className="p-4">
                                <p className="mb-0" style={{ fontSize: '16px' }}>
                                    <i className="fas fa-check-circle" style={{ color: '#28a745', fontSize: '18px', marginRight: '15px' }}></i>
                                    {getStatusBadge(selectedQuestion.status || (selectedQuestion.answer ? 'answered' : 'not_answered'))}
                                </p>
                                {selectedQuestion.updatedAt && selectedQuestion.updatedAt !== selectedQuestion.createdAt && (
                                    <div className="mt-3">
                                        <p className="mb-0" style={{ fontSize: '14px' }}>
                                            <i className="fas fa-edit" style={{ color: '#fd7e14', fontSize: '16px', marginRight: '15px' }}></i>
                                            <strong>Last Updated :</strong> <DateTimeFormatter date={selectedQuestion.updatedAt} />
                                        </p>
                                    </div>
                                )}
                            </Card.Body>
                        </Card>
                    </div>
                </div>
            </div>

        </>
    );
};

export default ViewEngagementQuestionPage;

