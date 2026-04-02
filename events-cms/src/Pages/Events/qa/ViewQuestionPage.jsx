import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Card, Row, Col, Badge, Button, Alert, Spinner, Container, Nav, Tab, Modal } from 'react-bootstrap';
import { API_URL, DUMMY_PATH } from '../../../configs/env';
import { formatDateTimeForTable } from '../../../components/dateTime/dateTimeUtils';
import DateTimeFormatter from '../../../components/dateTime/DateTimeFormatter';
import { eventList } from '../../../store/actions/eventActions';
import { updateQuestionStatus } from '../../../store/actions/qaActions';
import ImageModalComponent from '../../../components/events/ImageModalComponent';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../../../assets/css/event.css';
import { EVENT_PATHS } from '../../../utils/constants';

const ViewQuestionPage = () => {
    const { eventId, questionId } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const events = useSelector((state) => state.event?.event?.events);

    const [eventData, setEventData] = useState(null);
    const [questionData, setQuestionData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('details');

    // Modal states
    const [showSpeakerImageModal, setShowSpeakerImageModal] = useState(false);
    const [currentSpeakerImage, setCurrentSpeakerImage] = useState('');

    // Text truncation states
    const [showFullQuestion, setShowFullQuestion] = useState(false);
    const [showFullAnswer, setShowFullAnswer] = useState(false);

    // Find the event data and question
    useEffect(() => {
        if (events && events.length > 0) {
            const event = events.find((e) => e.id === eventId);
            if (event) {
                setEventData(event);

                // Find the specific question
                if (event.qnaData && event.qnaData.questions) {
                    const question = event.qnaData.questions.find((q) => q.id === questionId);
                    if (question) {
                        setQuestionData(question);
                    } else {
                        setError('Question not found');
                    }
                } else {
                    setError('No Q&A data found for this event');
                }
                setLoading(false);
            } else {
                setError('Event not found');
                setLoading(false);
            }
        }
    }, [events, eventId, questionId]);

    // Load events if not already loaded
    useEffect(() => {
        if (!events || events.length === 0) {
            dispatch(eventList());
        }
    }, [dispatch, events]);

    const handleBack = useCallback(() => {
        navigate(`${EVENT_PATHS.QA}/${eventId}`);
    }, [navigate, eventId]);

    const handleStatusUpdate = useCallback(
        async (newStatus) => {
            if (!questionData?.id) return;

            try {
                await dispatch(updateQuestionStatus(questionData.id, newStatus));

                // Update local state
                setQuestionData((prev) => ({
                    ...prev,
                    status: newStatus,
                    updatedAt: new Date().toISOString()
                }));
            } catch (error) {
                console.error('Error updating status:', error);
            }
        },
        [dispatch, questionData?.id]
    );

    // Helper functions
    const handleSpeakerImageClick = (speakerProfile) => {
        if (speakerProfile) {
            setCurrentSpeakerImage(speakerProfile);
            setShowSpeakerImageModal(true);
        } else {
            setShowSpeakerImageModal(false);
        }
    };

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
            answering: { variant: 'info', text: 'Answering' }
        };

        const config = statusConfig[status] || { variant: 'secondary', text: status };
        return <Badge variant={config.variant}>{config.text}</Badge>;
    };

    const renderQuestionStats = () => (
        <Row>
            <Col xs={6} md={3} className="mb-3">
                <div
                    className="text-center p-3"
                    style={{ backgroundColor: '#f8f9fa', borderRadius: '8px', border: '1px solid #e9ecef', padding: '20px' }}
                >
                    <i className="fas fa-heart text-primary mb-2" style={{ fontSize: '1.5rem' }}></i>
                    <h6 className="mb-1" style={{ color: '#495057', fontSize: '0.9rem' }}>
                        Likes
                    </h6>
                    <p className="mb-0" style={{ fontSize: '0.95rem', fontWeight: '500', color: '#28a745' }}>
                        {questionData?.totalLikes || 0}
                    </p>
                </div>
            </Col>
            <Col xs={6} md={3} className="mb-3">
                <div
                    className="text-center p-3"
                    style={{ backgroundColor: '#f8f9fa', borderRadius: '8px', border: '1px solid #e9ecef', padding: '20px' }}
                >
                    <i className="fas fa-user text-primary mb-2" style={{ fontSize: '1.5rem' }}></i>
                    <h6 className="mb-1" style={{ color: '#495057', fontSize: '0.9rem' }}>
                        Asked By
                    </h6>
                    <p className="mb-0" style={{ fontSize: '0.95rem', fontWeight: '500' }}>
                        {questionData?.isAnonymous ? 'Anonymous' : questionData?.askedBy?.fullName || 'Unknown'}
                    </p>
                </div>
            </Col>
            <Col xs={6} md={3} className="mb-3">
                <div
                    className="text-center p-3"
                    style={{ backgroundColor: '#f8f9fa', borderRadius: '8px', border: '1px solid #e9ecef', padding: '20px' }}
                >
                    <i className="fas fa-microphone text-primary mb-2" style={{ fontSize: '1.5rem' }}></i>
                    <h6 className="mb-1" style={{ color: '#495057', fontSize: '0.9rem' }}>
                        Speaker
                    </h6>
                    <p className="mb-0" style={{ fontSize: '0.95rem', fontWeight: '500' }}>
                        {questionData?.speaker?.name || 'N/A'}
                    </p>
                </div>
            </Col>
            <Col xs={6} md={3} className="mb-3">
                <div
                    className="text-center p-3"
                    style={{ backgroundColor: '#f8f9fa', borderRadius: '8px', border: '1px solid #e9ecef', padding: '20px' }}
                >
                    <i className="fas fa-check-circle text-primary mb-2" style={{ fontSize: '1.5rem' }}></i>
                    <h6 className="mb-1" style={{ color: '#495057', fontSize: '0.9rem' }}>
                        Status
                    </h6>
                    <div className="mb-0">
                        {getStatusBadge(questionData?.status || (questionData?.answer ? 'answered' : 'not_answered'))}
                    </div>
                </div>
            </Col>
        </Row>
    );

    // Get image source
    const getImageSrc = (image) => {
        if (typeof image === 'string') {
            if (image.startsWith('http')) {
                return image;
            } else {
                return `${API_URL}/${image.replace(/\\/g, '/')}`;
            }
        }
        return '';
    };

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

    if (error || !questionData) {
        return (
            <div className="mt-4">
                <div
                    className="mb-3"
                    style={{ backgroundColor: '#fff', borderRadius: '8px', padding: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
                >
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
                <div
                    className="mb-3"
                    style={{ backgroundColor: '#fff', borderRadius: '8px', padding: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
                >
                    <div className="d-flex justify-content-between align-items-center">
                        <div>
                            <h4 className="card-title mb-1">View Question</h4>
                            <p className="text-muted mb-0">Event: {eventData?.name || 'Unknown Event'}</p>
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

                {/* Main Content with Tabs */}
                <div style={{ backgroundColor: '#fff', borderRadius: '8px', padding: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                    <Tab.Container id="question-tabs" defaultActiveKey="details">
                        <Row>
                            <Col sm={12}>
                                <Nav variant="tabs" className="mb-3">
                                    <Nav.Item>
                                        <Nav.Link eventKey="details">
                                            <i className="fas fa-info-circle me-2" style={{ color: '#4680ff', marginRight: 6 }}></i>
                                            Question Details
                                        </Nav.Link>
                                    </Nav.Item>
                                    <Nav.Item>
                                        <Nav.Link eventKey="speaker">
                                            <i className="fas fa-microphone me-2" style={{ color: '#4680ff', marginRight: 6 }}></i>
                                            Speaker Info
                                        </Nav.Link>
                                    </Nav.Item>
                                    <Nav.Item>
                                        <Nav.Link eventKey="event">
                                            <i className="fas fa-calendar me-2" style={{ color: '#4680ff', marginRight: 6 }}></i>
                                            Event Context
                                        </Nav.Link>
                                    </Nav.Item>
                                </Nav>
                            </Col>
                        </Row>

                        <Tab.Content>
                            {/* Question Details Tab */}
                            <Tab.Pane eventKey="details">
                                <div className="p-2 bg-light">
                                    {/* Question Section - Prominent Red Card */}
                                    <div
                                        className="mb-4"
                                        style={{
                                            backgroundColor: '#fff',
                                            borderRadius: '8px',
                                            padding: '20px',
                                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                            border: '1px solid #e9ecef',
                                            borderLeft: '4px solid #dc3545'
                                        }}
                                    >
                                        <div style={{ padding: '24px' }}>
                                            <h5
                                                style={{
                                                    fontSize: '18px',
                                                    fontWeight: '600',
                                                    color: '#2c3e50',
                                                    marginBottom: '20px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '10px',
                                                    borderBottom: '2px solid #dc3545',
                                                    paddingBottom: '8px',
                                                    position: 'relative'
                                                }}
                                            >
                                                <i className="fas fa-question-circle" style={{ fontSize: '20px', color: '#dc3545' }}></i>
                                                Question Details
                                            </h5>
                                            <Row>
                                                <Col lg={8} md={12}>
                                                    <div className="mb-4">
                                                        <div
                                                            className="p-4"
                                                            style={
                                                                {
                                                                    // backgroundColor: '#fff5f5',
                                                                    // border: '2px solid #fecaca',
                                                                    // borderRadius: '12px',
                                                                    // boxShadow: '0 2px 8px rgba(220, 53, 69, 0.1)'
                                                                }
                                                            }
                                                        >
                                                            <div className="d-flex align-items-center mb-3">
                                                                <i
                                                                    className="fas fa-question-circle text-primary"
                                                                    style={{ fontSize: '18px', marginRight: '12px' }}
                                                                ></i>
                                                                <h6 className="mb-0 text-primary fw-bold">Question</h6>
                                                            </div>
                                                            <p
                                                                className="mb-0"
                                                                style={{
                                                                    fontSize: '16px',
                                                                    lineHeight: '1.6',
                                                                    // color: '#dc2626',
                                                                    fontWeight: '500'
                                                                }}
                                                            >
                                                                {showFullQuestion
                                                                    ? questionData.question
                                                                    : truncateText(questionData.question)}
                                                            </p>
                                                            {questionData.question && questionData.question.length > 200 && (
                                                                <div className="mt-3 d-flex justify-content-end">
                                                                    <Button
                                                                        variant="outline-danger"
                                                                        size="sm"
                                                                        onClick={toggleQuestionText}
                                                                        style={{
                                                                            borderRadius: '20px',
                                                                            fontSize: '12px',
                                                                            padding: '6px 16px',
                                                                            fontWeight: '500'
                                                                        }}
                                                                    >
                                                                        <i
                                                                            className={`fas fa-${showFullQuestion ? 'eye-slash' : 'eye'}`}
                                                                            style={{ marginRight: '6px' }}
                                                                        ></i>
                                                                        {showFullQuestion ? 'Show Less' : 'Show More'}
                                                                    </Button>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="mt-3 d-flex align-items-end justify-content-end">
                                                            <i className="fas fa-clock text-danger" style={{ marginRight: '12px' }}></i>
                                                            <span className="text-muted fw-bold">
                                                                Asked on: <DateTimeFormatter date={questionData.createdAt} />
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {questionData.answer && (
                                                        <div className="mb-4">
                                                            <div
                                                                className="p-4"
                                                                style={{
                                                                    backgroundColor: '#f0f9ff',
                                                                    border: '2px solid #7dd3fc',
                                                                    borderRadius: '12px',
                                                                    boxShadow: '0 2px 8px rgba(59, 130, 246, 0.1)'
                                                                }}
                                                            >
                                                                <div className="d-flex align-items-center mb-3">
                                                                    <i
                                                                        className="fas fa-reply text-primary"
                                                                        style={{ fontSize: '18px', marginRight: '12px' }}
                                                                    ></i>
                                                                    <h6 className="mb-0 text-primary fw-bold">Answer</h6>
                                                                </div>
                                                                <p
                                                                    className="mb-0"
                                                                    style={{
                                                                        fontSize: '16px',
                                                                        lineHeight: '1.6',
                                                                        color: '#1e40af',
                                                                        fontWeight: '500'
                                                                    }}
                                                                >
                                                                    {showFullAnswer
                                                                        ? questionData.answer
                                                                        : truncateText(questionData.answer)}
                                                                </p>
                                                                {questionData.answer && questionData.answer.length > 200 && (
                                                                    <div className="mt-3 d-flex justify-content-end">
                                                                        <Button
                                                                            variant="outline-primary"
                                                                            size="sm"
                                                                            onClick={toggleAnswerText}
                                                                            style={{
                                                                                borderRadius: '20px',
                                                                                fontSize: '12px',
                                                                                padding: '6px 16px',
                                                                                fontWeight: '500'
                                                                            }}
                                                                        >
                                                                            <i
                                                                                className={`fas fa-${showFullAnswer ? 'eye-slash' : 'eye'}`}
                                                                                style={{ marginRight: '6px' }}
                                                                            ></i>
                                                                            {showFullAnswer ? 'Show Less' : 'Show More'}
                                                                        </Button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="mt-3 d-flex flex-column gap-2">
                                                                {/* {questionData.answeredBy && (
                                                                    <div className="d-flex align-items-end justify-content-end">
                                                                        <i
                                                                            className="fas fa-user text-success"
                                                                            style={{ marginRight: '12px' }}
                                                                        ></i>
                                                                        <span className="text-muted fw-bold">
                                                                            Answered by:{' '}
                                                                            <span className="text-success">
                                                                                {questionData.answeredBy.fullName}
                                                                            </span>
                                                                        </span>
                                                                    </div>
                                                                )} */}
                                                                {questionData.answeredAt && (
                                                                    <div className="d-flex align-items-end justify-content-end">
                                                                        <i
                                                                            className="fas fa-clock text-success"
                                                                            style={{ marginRight: '12px' }}
                                                                        ></i>
                                                                        <span className="text-muted fw-bold">
                                                                            Answered on:{' '}
                                                                            <span className="text-success">
                                                                                <DateTimeFormatter date={questionData.answeredAt} />
                                                                            </span>
                                                                        </span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}
                                                </Col>

                                                <Col lg={4} md={12}>
                                                    <div
                                                        style={{
                                                            backgroundColor: '#fff',
                                                            borderRadius: '8px',
                                                            padding: '20px',
                                                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                                            border: '1px solid #e9ecef',
                                                            borderLeft: '4px solid #6f42c1'
                                                        }}
                                                    >
                                                        <h6
                                                            style={{
                                                                fontSize: '16px',
                                                                fontWeight: '600',
                                                                color: '#2c3e50',
                                                                marginBottom: '20px',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '8px',
                                                                borderBottom: '2px solid #6f42c1',
                                                                paddingBottom: '8px'
                                                            }}
                                                        >
                                                            <i
                                                                className="fas fa-info-circle"
                                                                style={{ fontSize: '16px', color: '#6f42c1' }}
                                                            ></i>
                                                            Question Information
                                                        </h6>
                                                        <div style={{ fontSize: '16px', lineHeight: '1.6' }}>
                                                            <div
                                                                className="info-field-container mb-3 py-2"
                                                                style={{ borderBottom: '1px solid #f1f1f1' }}
                                                            >
                                                                <span
                                                                    className="field-label"
                                                                    style={{ fontWeight: 'bold', color: '#495057', fontSize: '15px' }}
                                                                >
                                                                    <i
                                                                        className="fas fa-check-circle"
                                                                        style={{ marginRight: '8px', color: '#28a745' }}
                                                                    ></i>
                                                                    Status:
                                                                </span>
                                                                <span
                                                                    className="field-value"
                                                                    style={{ color: '#212529', fontWeight: 'normal', fontSize: '16px' }}
                                                                >
                                                                    {getStatusBadge(
                                                                        questionData.status ||
                                                                            (questionData.answer ? 'answered' : 'not_answered')
                                                                    )}
                                                                </span>
                                                            </div>
                                                            <div
                                                                className="info-field-container mb-3 py-2"
                                                                style={{ borderBottom: '1px solid #f1f1f1' }}
                                                            >
                                                                <span
                                                                    className="field-label"
                                                                    style={{ fontWeight: 'bold', color: '#495057', fontSize: '15px' }}
                                                                >
                                                                    <i
                                                                        className="fas fa-user"
                                                                        style={{ marginRight: '8px', color: '#007bff' }}
                                                                    ></i>
                                                                    Asked By:
                                                                </span>
                                                                <span
                                                                    className="field-value"
                                                                    style={{ color: '#212529', fontWeight: 'normal', fontSize: '16px' }}
                                                                >
                                                                    {questionData.isAnonymous && (
                                                                        <Badge variant="info" className="ms-2" style={{ fontSize: '12px' }}>
                                                                            {questionData.isAnonymous
                                                                                ? 'Anonymous'
                                                                                : questionData.askedBy?.fullName || 'Unknown'}
                                                                        </Badge>
                                                                    )}
                                                                </span>
                                                            </div>
                                                            <div
                                                                className="info-field-container mb-3 py-2"
                                                                style={{ borderBottom: '1px solid #f1f1f1' }}
                                                            >
                                                                <span
                                                                    className="field-label"
                                                                    style={{ fontWeight: 'bold', color: '#495057', fontSize: '15px' }}
                                                                >
                                                                    <i
                                                                        className="fas fa-heart"
                                                                        style={{ marginRight: '8px', color: '#e91e63' }}
                                                                    ></i>
                                                                    Likes:
                                                                </span>
                                                                <span
                                                                    className="field-value"
                                                                    style={{ color: '#212529', fontWeight: 'normal', fontSize: '16px' }}
                                                                >
                                                                    <Badge
                                                                        variant="light"
                                                                        style={{
                                                                            backgroundColor: '#f8f9fa',
                                                                            color: '#e91e63',
                                                                            border: '1px solid #e9ecef'
                                                                        }}
                                                                    >
                                                                        {questionData.totalLikes || 0}
                                                                    </Badge>
                                                                </span>
                                                            </div>
                                                            <div
                                                                className="info-field-container mb-3 py-2"
                                                                style={{ borderBottom: '1px solid #f1f1f1' }}
                                                            >
                                                                <span
                                                                    className="field-label"
                                                                    style={{ fontWeight: 'bold', color: '#495057', fontSize: '15px' }}
                                                                >
                                                                    <i
                                                                        className="fas fa-calendar-plus"
                                                                        style={{ marginRight: '8px', color: '#17a2b8' }}
                                                                    ></i>
                                                                    Created:
                                                                </span>
                                                                <span
                                                                    className="field-value"
                                                                    style={{ color: '#212529', fontWeight: 'normal', fontSize: '16px' }}
                                                                >
                                                                    <DateTimeFormatter date={questionData.createdAt} />
                                                                </span>
                                                            </div>
                                                            {questionData.updatedAt &&
                                                                questionData.updatedAt !== questionData.createdAt && (
                                                                    <div
                                                                        className="info-field-container mb-3 py-2"
                                                                        style={{ borderBottom: '1px solid #f1f1f1' }}
                                                                    >
                                                                        <span
                                                                            className="field-label"
                                                                            style={{
                                                                                fontWeight: 'bold',
                                                                                color: '#495057',
                                                                                fontSize: '15px'
                                                                            }}
                                                                        >
                                                                            <i
                                                                                className="fas fa-edit"
                                                                                style={{ marginRight: '8px', color: '#fd7e14' }}
                                                                            ></i>
                                                                            Last Updated:
                                                                        </span>
                                                                        <span
                                                                            className="field-value"
                                                                            style={{
                                                                                color: '#212529',
                                                                                fontWeight: 'normal',
                                                                                fontSize: '16px'
                                                                            }}
                                                                        >
                                                                            <DateTimeFormatter date={questionData.updatedAt} />
                                                                        </span>
                                                                    </div>
                                                                )}
                                                        </div>
                                                    </div>
                                                </Col>
                                            </Row>
                                        </div>
                                    </div>
                                </div>
                            </Tab.Pane>

                            {/* Speaker Info Tab */}
                            <Tab.Pane eventKey="speaker">
                                <div className="p-3">
                                    {questionData.speaker ? (
                                        <Card>
                                            <Card.Header>
                                                <h5 className="mb-0">
                                                    <i className="fas fa-microphone me-2"></i>
                                                    Speaker Information
                                                </h5>
                                            </Card.Header>
                                            <Card.Body>
                                                <Row className="align-items-center">
                                                    <Col md={3} className="text-center mb-3 mb-md-0">
                                                        <img
                                                            src={
                                                                questionData.speaker.profilePicture
                                                                    ? `${API_URL}/${questionData.speaker.profilePicture}`
                                                                    : DUMMY_PATH
                                                            }
                                                            alt="Speaker"
                                                            style={{
                                                                width: '150px',
                                                                height: '150px',
                                                                objectFit: 'cover',
                                                                borderRadius: '50%',
                                                                border: '3px solid #4680ff',
                                                                cursor: 'pointer',
                                                                transition: 'transform 0.2s'
                                                            }}
                                                            onClick={() => handleSpeakerImageClick(questionData.speaker.profilePicture)}
                                                            onMouseEnter={(e) => (e.target.style.transform = 'scale(1.05)')}
                                                            onMouseLeave={(e) => (e.target.style.transform = 'scale(1)')}
                                                        />
                                                    </Col>
                                                    <Col md={9}>
                                                        <h4>{questionData.speaker.name}</h4>
                                                        <p className="text-muted mb-2">{questionData.speaker.position}</p>
                                                        {questionData.speaker.companyName && (
                                                            <p className="text-muted mb-2">
                                                                <i className="fas fa-building me-1"></i>
                                                                {questionData.speaker.companyName}
                                                            </p>
                                                        )}
                                                        {questionData.speaker.email && (
                                                            <p className="text-muted mb-2">
                                                                <i className="fas fa-envelope me-1"></i>
                                                                {questionData.speaker.email}
                                                            </p>
                                                        )}
                                                        {questionData.speaker.mobile && (
                                                            <p className="text-muted mb-2">
                                                                <i className="fas fa-phone me-1"></i>
                                                                {questionData.speaker.mobile}
                                                            </p>
                                                        )}
                                                    </Col>
                                                </Row>
                                                <div className="d-flex justify-content-end mt-3">
                                                    <Button
                                                        variant="outline-primary"
                                                        onClick={() => navigate(`/speakers/view-speaker/${questionData.speaker.id}`)}
                                                        style={{
                                                            borderRadius: '20px',
                                                            fontSize: '12px',
                                                            padding: '8px 20px',
                                                            fontWeight: '500',
                                                            whiteSpace: 'nowrap',
                                                            minWidth: 'fit-content'
                                                        }}
                                                    >
                                                        <i className="fas fa-external-link-alt me-2"></i>
                                                        View Full Speaker Details
                                                    </Button>
                                                </div>
                                            </Card.Body>
                                        </Card>
                                    ) : (
                                        <Alert variant="warning">
                                            <i className="fas fa-exclamation-triangle me-2"></i>
                                            No speaker information available for this question.
                                        </Alert>
                                    )}
                                </div>
                            </Tab.Pane>

                            {/* Event Context Tab */}
                            <Tab.Pane eventKey="event">
                                <div className="p-2 bg-light">
                                    {eventData ? (
                                        <div
                                            className="mb-4"
                                            style={{
                                                backgroundColor: '#fff',
                                                borderRadius: '8px',
                                                padding: '20px',
                                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                                border: '1px solid #e9ecef',
                                                borderLeft: '4px solid #3498db'
                                            }}
                                        >
                                            <div style={{ padding: '24px' }}>
                                                <h5
                                                    style={{
                                                        fontSize: '18px',
                                                        fontWeight: '600',
                                                        color: '#2c3e50',
                                                        marginBottom: '20px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '10px',
                                                        borderBottom: '2px solid #3498db',
                                                        paddingBottom: '8px',
                                                        position: 'relative'
                                                    }}
                                                >
                                                    <i className="fas fa-info-circle" style={{ fontSize: '20px', color: '#17a2b8' }}></i>
                                                    Event Overview
                                                </h5>
                                                <Row>
                                                    <Col lg={6} md={12}>
                                                        <div style={{ fontSize: '15px', lineHeight: '1.6' }}>
                                                            <div
                                                                className="info-field-container mb-2 py-2"
                                                                style={{ borderBottom: '1px solid #f1f1f1' }}
                                                            >
                                                                <span
                                                                    className="field-label"
                                                                    style={{ fontWeight: 'bold', color: '#495057', fontSize: '14px' }}
                                                                >
                                                                    <i
                                                                        className="fas fa-calendar-alt"
                                                                        style={{ marginRight: '8px', color: '#007bff' }}
                                                                    ></i>
                                                                    Event Name:
                                                                </span>
                                                                <span
                                                                    className="field-value"
                                                                    style={{ color: '#212529', fontWeight: 'normal', fontSize: '15px' }}
                                                                >
                                                                    {eventData.name}
                                                                </span>
                                                            </div>
                                                            <div
                                                                className="info-field-container mb-2 py-2"
                                                                style={{ borderBottom: '1px solid #f1f1f1' }}
                                                            >
                                                                <span
                                                                    className="field-label"
                                                                    style={{ fontWeight: 'bold', color: '#495057', fontSize: '14px' }}
                                                                >
                                                                    <i
                                                                        className="fas fa-dollar-sign"
                                                                        style={{ marginRight: '8px', color: '#28a745' }}
                                                                    ></i>
                                                                    Ticket Price:
                                                                </span>
                                                                <span
                                                                    className="field-value"
                                                                    style={{ color: '#28a745', fontWeight: 'bold', fontSize: '16px' }}
                                                                >
                                                                    {eventData.isEarlyBirdActive && eventData.earlyBirdPrice != null && eventData.earlyBirdPrice !== ''
                                                                        ? (
                                                                            <>
                                                                                <span>{Number(eventData.earlyBirdPrice).toFixed(2)} {eventData.currency || 'USD'}</span>
                                                                                {eventData.price != null && eventData.price !== '' && (
                                                                                    <span style={{ textDecoration: 'line-through', color: '#6c757d', fontWeight: 'normal', marginLeft: '8px' }}>
                                                                                        {Number(eventData.price).toFixed(2)} {eventData.currency || 'USD'}
                                                                                    </span>
                                                                                )}
                                                                            </>
                                                                        )
                                                                        : (eventData.price
                                                                            ? `${eventData.price} ${eventData.currency || 'USD'}`
                                                                            : 'Free')
                                                                    }
                                                                </span>
                                                            </div>
                                                            <div
                                                                className="info-field-container mb-2 py-2"
                                                                style={{ borderBottom: '1px solid #f1f1f1' }}
                                                            >
                                                                <span
                                                                    className="field-label"
                                                                    style={{ fontWeight: 'bold', color: '#495057', fontSize: '14px' }}
                                                                >
                                                                    <i
                                                                        className="fas fa-clock"
                                                                        style={{ marginRight: '8px', color: '#dc3545' }}
                                                                    ></i>
                                                                    Start Date & Time:
                                                                </span>
                                                                <span
                                                                    className="field-value"
                                                                    style={{ color: '#212529', fontWeight: 'normal', fontSize: '15px' }}
                                                                >
                                                                    <DateTimeFormatter
                                                                        date={eventData.startDate}
                                                                        time={eventData.startTime}
                                                                    />
                                                                </span>
                                                            </div>
                                                            <div
                                                                className="info-field-container mb-2 py-2"
                                                                style={{ borderBottom: '1px solid #f1f1f1' }}
                                                            >
                                                                <span
                                                                    className="field-label"
                                                                    style={{ fontWeight: 'bold', color: '#495057', fontSize: '14px' }}
                                                                >
                                                                    <i
                                                                        className="fas fa-clock"
                                                                        style={{ marginRight: '8px', color: '#dc3545' }}
                                                                    ></i>
                                                                    End Date & Time:
                                                                </span>
                                                                <span
                                                                    className="field-value"
                                                                    style={{ color: '#212529', fontWeight: 'normal', fontSize: '15px' }}
                                                                >
                                                                    <DateTimeFormatter date={eventData.endDate} time={eventData.endTime} />
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </Col>
                                                    <Col lg={6} md={12}>
                                                        <div style={{ fontSize: '15px', lineHeight: '1.6' }}>
                                                            <div
                                                                className="info-field-container mb-2 py-2"
                                                                style={{ borderBottom: '1px solid #f1f1f1' }}
                                                            >
                                                                <span
                                                                    className="field-label"
                                                                    style={{ fontWeight: 'bold', color: '#495057', fontSize: '14px' }}
                                                                >
                                                                    <i
                                                                        className="fas fa-tag"
                                                                        style={{ marginRight: '8px', color: '#28a745' }}
                                                                    ></i>
                                                                    Event Type:
                                                                </span>
                                                                <span
                                                                    className="field-value"
                                                                    style={{ color: '#212529', fontWeight: 'normal', fontSize: '15px' }}
                                                                >
                                                                    <Badge bg="secondary" className="px-3 py-1">
                                                                        {eventData.type || 'N/A'}
                                                                    </Badge>
                                                                </span>
                                                            </div>
                                                            <div
                                                                className="info-field-container mb-2 py-2"
                                                                style={{ borderBottom: '1px solid #f1f1f1' }}
                                                            >
                                                                <span
                                                                    className="field-label"
                                                                    style={{ fontWeight: 'bold', color: '#495057', fontSize: '14px' }}
                                                                >
                                                                    <i
                                                                        className="fas fa-map-marker-alt"
                                                                        style={{ marginRight: '8px', color: '#e74c3c' }}
                                                                    ></i>
                                                                    Location:
                                                                </span>
                                                                <span
                                                                    className="field-value"
                                                                    style={{ color: '#212529', fontWeight: 'normal', fontSize: '15px' }}
                                                                >
                                                                    {eventData.location || 'N/A'}
                                                                </span>
                                                            </div>
                                                            <div
                                                                className="info-field-container mb-2 py-2"
                                                                style={{ borderBottom: '1px solid #f1f1f1' }}
                                                            >
                                                                <span
                                                                    className="field-label"
                                                                    style={{ fontWeight: 'bold', color: '#495057', fontSize: '14px' }}
                                                                >
                                                                    <i
                                                                        className="fas fa-building"
                                                                        style={{ marginRight: '8px', color: '#6f42c1' }}
                                                                    ></i>
                                                                    Venue:
                                                                </span>
                                                                <span
                                                                    className="field-value"
                                                                    style={{ color: '#212529', fontWeight: 'normal', fontSize: '15px' }}
                                                                >
                                                                    {eventData.venue || 'N/A'}
                                                                </span>
                                                            </div>
                                                            <div
                                                                className="info-field-container mb-2 py-2"
                                                                style={{ borderBottom: '1px solid #f1f1f1' }}
                                                            >
                                                                <span
                                                                    className="field-label"
                                                                    style={{ fontWeight: 'bold', color: '#495057', fontSize: '14px' }}
                                                                >
                                                                    <i
                                                                        className="fas fa-users"
                                                                        style={{ marginRight: '8px', color: '#007bff' }}
                                                                    ></i>
                                                                    Registered Participants:
                                                                </span>
                                                                <span
                                                                    className="field-value"
                                                                    style={{ color: '#212529', fontWeight: 'normal', fontSize: '15px' }}
                                                                >
                                                                    {eventData.attendanceCount || '0'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </Col>
                                                    <Col lg={12} md={12}>
                                                        <div className="mb-2 py-2" style={{ borderBottom: '1px solid #f1f1f1' }}>
                                                            <div
                                                                style={{
                                                                    fontWeight: 'bold',
                                                                    color: '#495057',
                                                                    fontSize: '14px',
                                                                    marginBottom: '8px'
                                                                }}
                                                            >
                                                                <i
                                                                    className="fa fa-sticky-note"
                                                                    style={{ marginRight: '8px', color: '#007bff' }}
                                                                ></i>
                                                                Event Description:
                                                            </div>
                                                            <div 
                                                                style={{ color: '#212529', lineHeight: '1.6', fontSize: '15px' }}
                                                                dangerouslySetInnerHTML={{ 
                                                                    __html: eventData.description || 'No description available.' 
                                                                }}
                                                            />
                                                        </div>
                                                    </Col>
                                                    <Col lg={12} md={12}>
                                                        <div className="d-flex justify-content-end mt-3">
                                                            <Button
                                                                variant="outline-primary"
                                                                onClick={() => navigate(`/events/view-event/${eventData.id}`)}
                                                                style={{
                                                                    borderRadius: '20px',
                                                                    fontSize: '12px',
                                                                    padding: '8px 20px',
                                                                    fontWeight: '500',
                                                                    whiteSpace: 'nowrap',
                                                                    minWidth: 'fit-content'
                                                                }}
                                                            >
                                                                <i className="fas fa-external-link-alt me-2"></i>
                                                                View Full Event Details
                                                            </Button>
                                                        </div>
                                                    </Col>
                                                </Row>
                                            </div>
                                        </div>
                                    ) : (
                                        <Alert variant="warning">
                                            <i className="fas fa-exclamation-triangle me-2"></i>
                                            No event information available.
                                        </Alert>
                                    )}
                                </div>
                            </Tab.Pane>
                        </Tab.Content>
                    </Tab.Container>
                </div>
            </div>

            {/* Speaker Image Modal */}
            <ImageModalComponent
                show={showSpeakerImageModal}
                onHide={() => setShowSpeakerImageModal(false)}
                imageSrc={`${API_URL}/${currentSpeakerImage}`}
                imageAlt="Speaker Profile"
                downloadFileName="speaker-profile.jpg"
                currentIndex={0}
                totalImages={1}
            />

            {/* Custom CSS for Responsive Behavior */}
            <style jsx>{`
                /* Desktop: side-by-side layout */
                .info-field-container {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .field-label {
                    min-width: 140px;
                }

                .field-value {
                    text-align: right;
                    flex: 1;
                }

                /* Mobile: stacked layout */
                @media (max-width: 768px) {
                    .info-field-container {
                        display: block !important;
                        text-align: left !important;
                    }

                    .field-label {
                        display: block !important;
                        min-width: auto !important;
                        margin-bottom: 4px !important;
                        font-size: 15px !important;
                        color: #495057 !important;
                    }

                    .field-value {
                        display: block !important;
                        text-align: left !important;
                        font-size: 16px !important;
                        font-weight: 600 !important;
                        color: #212529 !important;
                        padding-left: 0 !important;
                        margin-left: 0 !important;
                    }
                }

                @media (max-width: 576px) {
                    .field-label {
                        font-size: 14px !important;
                    }

                    .field-value {
                        font-size: 15px !important;
                    }
                }
            `}</style>
        </>
    );
};

export default ViewQuestionPage;
