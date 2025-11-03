import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Button, Row, Col, Badge, Alert, Tab, Nav, Modal } from 'react-bootstrap';
import { getSessionsByEvent, getTracksByEvent, getAllSessions, getAllTracks } from '../../store/actions/programmeActions';
import { ENGAGEMENT_PATHS } from '../../utils/constants';
import { API_URL } from '../../configs/env';
import EventSpeakersComponent from '../../components/events/EventSpeakersComponent';

const ViewEngagementSessionPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const location = useLocation();

    const queryParams = new URLSearchParams(location.search);
    const eventIdFromUrl = queryParams.get('eventId');

    const { tracks, sessions, loading } = useSelector((state) => state.programme);
    const [session, setSession] = useState(null);
    const [track, setTrack] = useState(null);
    
    // Speaker image modal state
    const [showSpeakerImageModal, setShowSpeakerImageModal] = useState(false);
    const [currentSpeakerImage, setCurrentSpeakerImage] = useState('');
    const [showFullDescription, setShowFullDescription] = useState(false);

    useEffect(() => {
        if (eventIdFromUrl) {
            // If we have eventId, fetch only sessions and tracks for that event
            dispatch(getSessionsByEvent(eventIdFromUrl));
            dispatch(getTracksByEvent(eventIdFromUrl));
        } else {
            // Only fetch all data if not already available
            if (!sessions || sessions.length === 0) {
                dispatch(getAllSessions());
            }
            if (!tracks || tracks.length === 0) {
                dispatch(getAllTracks());
            }
        }
    }, [dispatch, eventIdFromUrl, sessions, tracks]);

    useEffect(() => {
        if (sessions && sessions.length > 0) {
            const foundSession = sessions.find(s => s.id === id);
            setSession(foundSession);
        }
    }, [sessions, id]);

    useEffect(() => {
        if (session && tracks && tracks.length > 0) {
            const foundTrack = tracks.find(t => t.id === session.trackId);
            setTrack(foundTrack);
        }
    }, [session, tracks]);

    // InfoCard component for consistent styling similar to ViewExhibitorPage
    const InfoCard = ({ title, icon, children, borderColor = "#4680ff", className = "" }) => (
        <div className={`mb-4 ${className}`} style={{ 
            backgroundColor: '#fff', 
            borderRadius: '8px', 
            padding: '20px', 
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            border: '1px solid #e9ecef',
            borderLeft: `4px solid ${borderColor}`
        }}>
            <div style={{ padding: '24px' }}>
                <h5 style={{ 
                    fontSize: '18px', 
                    fontWeight: '600', 
                    color: '#2c3e50',
                    marginBottom: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    borderBottom: `2px solid ${borderColor}`,
                    paddingBottom: '8px',
                    position: 'relative'
                }}>
                    <span style={{ fontSize: '20px' }}>{icon}</span>
                    {title}
                </h5>
                {children}
            </div>
        </div>
    );

    const InfoField = ({ label, value, icon = null }) => (
        <div className="mb-3">
            <div style={{ 
                fontSize: '1rem', 
                fontWeight: '600', 
                color: '#495057',
                marginBottom: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
            }}>
                {icon && <span style={{ fontSize: '16px' }}>{icon}</span>}
                {label}:
            </div>
            <div style={{ 
                fontSize: '15px', 
                color: '#2c3e50',
                fontWeight: '500',
                backgroundColor: '#f8f9fa',
                padding: '10px 15px',
                borderRadius: '8px',
                border: '1px solid #e9ecef'
            }}>
                {value || 'N/A'}
            </div>
        </div>
    );


    // Speaker image modal functions
    const handleSpeakerImageClick = (speakerProfile) => {
        if (speakerProfile) {
            setCurrentSpeakerImage(speakerProfile);
            setShowSpeakerImageModal(true);
        }
    };

    if (loading) {
        return (
            <div className="p-2 bg-light">
                <div className="text-center py-5">
                    <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
                                <span className="sr-only">Loading...</span>
                            </div>
                    <p className="mt-3 text-muted h5">Loading session details...</p>
                </div>
            </div>
        );
    }

    if (!session) {
        return (
            <div className="p-2 bg-light">
                <div style={{ 
                    backgroundColor: '#fff', 
                    borderRadius: '8px', 
                    padding: '40px', 
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    textAlign: 'center'
                }}>
                    <Alert variant="warning" style={{ fontSize: '16px', padding: '20px' }}>
                        <i className="fas fa-exclamation-triangle me-2"></i>
                                Session not found or you don't have permission to view it.
                            </Alert>
                    <Button 
                        variant="outline-primary" 
                        onClick={() => navigate(-1)}
                        style={{ 
                            borderRadius: '8px',
                            padding: '10px 20px',
                            fontWeight: '500'
                        }}
                    >
                        <i className="fas fa-arrow-left me-2"></i>
                        Back to Engagement Sessions
                            </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-2 bg-light">
            {/* Header Section */}
            <div className="mb-4">
                <div style={{ 
                    backgroundColor: '#fff', 
                    borderRadius: '8px', 
                    padding: '20px', 
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    marginBottom: '24px',
                    borderTop: '4px solid #3498db'
                }}>
                    <div className="d-flex justify-content-between align-items-center">
                            <div>
                            <h4 style={{ 
                                margin: 0, 
                                color: '#2c3e50',
                                fontWeight: '600'
                            }}>
                                📅 Session Profile
                            </h4>
                            <p style={{ 
                                margin: '8px 0 0 0', 
                                color: '#6c757d',
                                fontSize: '14px'
                            }}>
                                View detailed session information and related data
                            </p>
                            </div>
                                <Button 
                                    variant="secondary" 
                                    onClick={() => navigate(-1)}
                            style={{ 
                                // borderRadius: '8px',
                                padding: '8px 16px',
                                fontWeight: '500'
                            }}
                                >
                                    <i className="feather icon-arrow-left mr-2"></i>
                                    Back
                                </Button>
                            </div>
                </div>
                                    </div>


            {/* Tabbed Content Section */}
            <InfoCard title="Session Information" icon="📋" borderColor="#e74c3c">
                <Tab.Container defaultActiveKey="details">
                    <Nav variant="pills" className="mb-4" style={{ 
                        borderBottom: '2px solid #e74c3c',
                        paddingBottom: '12px',
                        gap: '15px'
                    }}>
                        <Nav.Item>
                            <Nav.Link 
                                eventKey="details"
                                style={{
                                    borderRadius: '8px',
                                    fontWeight: '500',
                                    border: '1px solid #dee2e6',
                                    fontSize: '14px',
                                    padding: '8px 16px'
                                }}
                            >
                                📋 Session Details
                            </Nav.Link>
                        </Nav.Item>
                        <Nav.Item>
                            <Nav.Link 
                                eventKey="timing"
                                style={{
                                    borderRadius: '8px',
                                    fontWeight: '500',
                                    border: '1px solid #dee2e6',
                                    fontSize: '14px',
                                    padding: '8px 16px'
                                }}
                            >
                                ⏰ Timing Information
                            </Nav.Link>
                        </Nav.Item>
                        {session.speakers && session.speakers.length > 0 && (
                            <Nav.Item>
                                <Nav.Link 
                                    eventKey="speakers"
                                    style={{
                                        borderRadius: '8px',
                                        fontWeight: '500',
                                        border: '1px solid #dee2e6',
                                        fontSize: '14px',
                                        padding: '8px 16px'
                                    }}
                                >
                                    🎤 Speakers ({session.speakers.length})
                                </Nav.Link>
                            </Nav.Item>
                        )}
                    </Nav>

                    <Tab.Content style={{ marginTop: '20px' }}>
                        {/* Session Details Tab */}
                        <Tab.Pane eventKey="details">
                            <div style={{
                                backgroundColor: '#fff',
                                padding: '20px',
                                borderRadius: '8px',
                                border: '1px solid #e9ecef',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                            }}>
                                <Row>
                                    <Col md={6}>
                                    <div className="mb-4">
                                            <div className="d-flex align-items-center mb-2">
                                                <i className="feather icon-file-text text-primary mr-2"></i>
                                                <label className="text-muted small mb-0">Session Title</label>
                                            </div>
                                            <h5 className="text-dark font-weight-bold mb-0">{session.title}</h5>
                                    </div>
                                </Col>
                                    <Col md={6}>
                                    <div className="mb-4">
                                            <div className="d-flex align-items-center mb-2">
                                                <i className="feather icon-folder text-info mr-2"></i>
                                                <label className="text-muted small mb-0">Track</label>
                                            </div>
                                            <h5 className="text-dark font-weight-bold mb-0">{track ? track.title : 'N/A'}</h5>
                                    </div>
                                </Col>
                                <Col md={6}>
                                    <div className="mb-4">
                                            <div className="d-flex align-items-center mb-2">
                                                <i className="feather icon-map-pin text-warning mr-2"></i>
                                                <label className="text-muted small mb-0">Venue</label>
                                            </div>
                                            <h5 className="text-dark font-weight-bold mb-0">{session.venue || 'TBA'}</h5>
                                    </div>
                                </Col>
                                <Col md={6}>
                                    <div className="mb-4">
                                            <div className="d-flex align-items-center mb-2">
                                                <i className="feather icon-check-circle text-success mr-2"></i>
                                                <label className="text-muted small mb-0">Status</label>
                                            </div>
                                            <Badge 
                                                bg={session.isActive ? 'success' : 'danger'} 
                                                style={{ fontSize: '14px', padding: '6px 12px', fontWeight: 'bold' }}
                                            >
                                                {session.isActive ? 'Active' : 'Inactive'}
                                        </Badge>
                                    </div>
                                </Col>
                                    <Col md={6}>
                                        <div className="mb-3">
                                            <div className="d-flex align-items-center mb-2">
                                                <i className="feather icon-calendar text-danger mr-2"></i>
                                                <label className="text-muted small mb-0">Created At</label>
                                            </div>
                                            <div className="bg-light p-2 rounded">
                                                <span className="text-dark font-weight-medium">
                                                    {new Date(session.createdAt).toLocaleDateString('en-US', {
                                                        year: 'numeric',
                                                        month: 'long',
                                                        day: 'numeric'
                                                    })}
                                                </span>
                                            </div>
                                        </div>
                                    </Col>
                                    <Col md={6}>
                                        <div className="mb-3">
                                            <div className="d-flex align-items-center mb-2">
                                                <i className="feather icon-clock text-info mr-2"></i>
                                                <label className="text-muted small mb-0">Updated At</label>
                                            </div>
                                            <div className="bg-light p-2 rounded">
                                                <span className="text-dark font-weight-medium">
                                                    {new Date(session.updatedAt).toLocaleDateString('en-US', {
                                                        year: 'numeric',
                                                        month: 'long',
                                                        day: 'numeric'
                                                    })}
                                                </span>
                                            </div>
                                        </div>
                                    </Col>
                                    {session.description && (
                                        <Col md={12}>
                                            <div className="mb-3">
                                                <div className="d-flex align-items-center mb-2">
                                                    <i className="feather icon-file-text text-info mr-2"></i>
                                                    <label className="text-muted small mb-0">Description</label>
                                                </div>
                                                <div className="bg-light p-3 rounded">
                                                    <p className="text-dark mb-0" style={{
                                                        fontSize: '14px',
                                                        lineHeight: '1.6',
                                                        textAlign: 'justify'
                                                    }}>
                                                        {showFullDescription || session.description.length <= 150
                                                            ? session.description 
                                                            : (
                                                                <>
                                                                    {session.description.substring(0, 150)}...
                                                                    <span 
                                                                        onClick={() => setShowFullDescription(!showFullDescription)}
                                                                        style={{
                                                                            color: '#007bff',
                                                                            textDecoration: 'underline',
                                                                            cursor: 'pointer',
                                                                            fontSize: '14px',
                                                                            fontWeight: '500',
                                                                            marginLeft: '5px'
                                                                        }}
                                                                    >
                                                                        Read More
                                                                    </span>
                                                                </>
                                                            )}
                                                        {showFullDescription && session.description.length > 150 && (
                                                            <span 
                                                                onClick={() => setShowFullDescription(!showFullDescription)}
                                                                style={{
                                                                    color: '#007bff',
                                                                    textDecoration: 'underline',
                                                                    cursor: 'pointer',
                                                                    fontSize: '14px',
                                                                    fontWeight: '500',
                                                                    marginLeft: '5px'
                                                                }}
                                                            >
                                                                Show Less
                                                            </span>
                                                        )}
                                                    </p>
                                                </div>
                                            </div>
                                        </Col>
                                    )}
                                </Row>
                            </div>
                        </Tab.Pane>

                        {/* Timing Information Tab */}
                        <Tab.Pane eventKey="timing">
                            <div style={{
                                backgroundColor: '#fff',
                                padding: '20px',
                                borderRadius: '8px',
                                border: '1px solid #e9ecef',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                            }}>
                                <Row>
                                <Col md={6}>
                                    <div className="mb-4">
                                            <div className="d-flex align-items-center mb-2">
                                                <i className="feather icon-calendar text-primary mr-2"></i>
                                                <label className="text-muted small mb-0">Session Date</label>
                                            </div>
                                            <div className="bg-light p-3 rounded">
                                                <h5 className="text-dark font-weight-bold mb-0">
                                                    {(session.startDate || session.sessionDate) ? new Date(session.startDate || session.sessionDate).toLocaleDateString('en-US', {
                                                        year: 'numeric',
                                                        month: 'long',
                                                        day: 'numeric'
                                                    }) : 'N/A'}
                                                </h5>
                                            </div>
                                    </div>
                                </Col>
                                    <Col md={6}>
                                    <div className="mb-4">
                                            <div className="d-flex align-items-center mb-2">
                                                <i className="feather icon-play-circle text-success mr-2"></i>
                                                <label className="text-muted small mb-0">Start Time</label>
                                            </div>
                                            <div className="bg-light p-3 rounded">
                                                <h5 className="text-dark font-weight-bold mb-0">
                                                    {session.startTime || 'N/A'}
                                                </h5>
                                            </div>
                                    </div>
                                </Col>
                                    <Col md={6}>
                                    <div className="mb-4">
                                            <div className="d-flex align-items-center mb-2">
                                                <i className="feather icon-stop-circle text-danger mr-2"></i>
                                                <label className="text-muted small mb-0">End Time</label>
                                            </div>
                                            <div className="bg-light p-3 rounded">
                                                <h5 className="text-dark font-weight-bold mb-0">
                                                    {session.endTime || 'N/A'}
                                                </h5>
                                            </div>
                                    </div>
                                </Col>
                                </Row>
                            </div>
                        </Tab.Pane>

                        {/* Speakers Tab */}
                        {session.speakers && session.speakers.length > 0 && (
                            <Tab.Pane eventKey="speakers">
                                <div style={{
                                    backgroundColor: '#fff',
                                    padding: '20px',
                                    borderRadius: '8px',
                                    border: '1px solid #e9ecef',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                }}>
                                    <EventSpeakersComponent 
                                        speakers={session.speakers} 
                                        handleSpeakerImageClick={handleSpeakerImageClick}
                                    />
                                    </div>
                            </Tab.Pane>
                        )}
                    </Tab.Content>
                </Tab.Container>
            </InfoCard>

            {/* Speaker Image Modal */}
            <Modal
                show={showSpeakerImageModal}
                onHide={() => setShowSpeakerImageModal(false)}
                size="lg"
                centered
                style={{ backgroundColor: 'rgba(0,0,0,0.95)' }}
            >
                <Modal.Body>
                    {/* Close button */}
                    <Button
                        variant="light"
                        size="sm"
                        onClick={() => setShowSpeakerImageModal(false)}
                        style={{
                            position: 'fixed',
                            top: '20px',
                            right: '20px',
                            borderRadius: '50%',
                            width: '40px',
                            height: '40px',
                            zIndex: 1000,
                            backgroundColor: 'rgba(0,0,0,0.7)',
                            border: 'none',
                            color: 'white'
                        }}
                    >
                        <i className="fas fa-times"></i>
                    </Button>

                    {/* Image container */}
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            minHeight: '70vh',
                            padding: '60px 40px 40px 40px'
                        }}
                    >
                        <img
                            src={`${API_URL}/${currentSpeakerImage}`}
                            alt="Speaker Profile"
                            style={{
                                maxWidth: '100%',
                                maxHeight: '100%',
                                objectFit: 'contain',
                                borderRadius: '8px'
                            }}
                            onError={(e) => {
                                console.error('Speaker image failed to load:', currentSpeakerImage);
                                e.target.style.display = 'none';
                            }}
                        />
                    </div>
                </Modal.Body>
            </Modal>
                                    </div>
    );
};

export default ViewEngagementSessionPage;

