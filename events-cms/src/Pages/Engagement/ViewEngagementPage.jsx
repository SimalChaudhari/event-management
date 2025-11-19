import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Button, Row, Col, Badge, Modal, Tab, Nav } from 'react-bootstrap';
import { getEngagementById } from '../../store/actions/engagementActions';
import { ENGAGEMENT_PATHS } from '../../utils/constants';
import { API_URL } from '../../configs/env';

import EventSpeakersComponent from '../../components/events/EventSpeakersComponent';

const ViewEngagementPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const { selectedEngagement, loading } = useSelector((state) => state.engagement);
    
    // Speaker image modal state
    const [showSpeakerImageModal, setShowSpeakerImageModal] = useState(false);
    const [currentSpeakerImage, setCurrentSpeakerImage] = useState('');
    const [showFullDescription, setShowFullDescription] = useState(false);

    useEffect(() => {
        if (id) {
            dispatch(getEngagementById(id));
        }
    }, [dispatch, id]);

    // Speaker image modal functions
    const handleSpeakerImageClick = (speakerProfile) => {
        if (speakerProfile) {
            setCurrentSpeakerImage(speakerProfile);
            setShowSpeakerImageModal(true);
        }
    };

    // Handle speaker profile navigation
    const handleSpeakerProfileClick = (speakerId) => {
        if (speakerId) {
            // Navigate to speaker profile page
            navigate(`/speakers/${speakerId}`);
        }
    };

    // InfoCard component for consistent styling (same as Programme)
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

    if (loading) {
        return (
            <div className="p-2 bg-light">
                <div className="text-center py-5">
                    <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
                        <span className="sr-only">Loading...</span>
                    </div>
                    <p className="mt-3 text-muted h5">Loading engagement details...</p>
                </div>
            </div>
        );
    }

    if (!selectedEngagement) {
        return (
            <div className="p-2 bg-light">
                <div className="text-center py-5">
                    <i className="feather icon-alert-circle" style={{ fontSize: '48px', color: '#dc3545' }}></i>
                    <h4 className="mt-3">Engagement Not Found</h4>
                    <p className="text-muted">The engagement you're looking for doesn't exist.</p>
                    <Button variant="primary" onClick={() => {
                        const urlParams = new URLSearchParams(window.location.search);
                        const currentPage = urlParams.get('page');
                        const url = currentPage ? `${ENGAGEMENT_PATHS.LIST_ENGAGEMENTS}?page=${currentPage}` : ENGAGEMENT_PATHS.LIST_ENGAGEMENTS;
                        navigate(url);
                    }}>
                        Back to List
                    </Button>
                </div>
            </div>
        );
    }

    // Backend sends 'programmeTracks' array
    const programmeTracks = selectedEngagement.programmeTracks || [];
    const event = selectedEngagement.event || {};
    const isActive = selectedEngagement.isActive !== undefined ? selectedEngagement.isActive : true;
    
    // Get sessionIds from engagement (could be at root or in first track)
    const engagementSessionIds = selectedEngagement.sessionIds || programmeTracks[0]?.sessionIds || [];
    
    // Filter sessions based on sessionIds if available
    const filteredProgrammeTracks = engagementSessionIds.length > 0 
        ? programmeTracks.map(track => ({
            ...track,
            sessions: track.sessions?.filter(session => engagementSessionIds.includes(session.id)) || []
        }))
        : programmeTracks;
    
    // Calculate total sessions across all tracks (only filtered sessions)
    const totalSessions = filteredProgrammeTracks.reduce((total, track) => total + (track.sessions?.length || 0), 0);

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
                    borderTop: '4px solid #28a745'
                }}>
                    <div className="d-flex justify-content-between align-items-center">
                        <div>
                            <h4 style={{ 
                                margin: 0, 
                                color: '#2c3e50',
                                fontWeight: '600'
                            }}>
                                👥 Engagement Profile
                            </h4>
                            <p style={{ 
                                margin: '8px 0 0 0', 
                                color: '#6c757d',
                                fontSize: '14px'
                            }}>
                                View detailed engagement information and related data
                            </p>
                        </div>
                        <div>
                            <Button 
                                variant="secondary" 
                                onClick={() => {
                                    const urlParams = new URLSearchParams(window.location.search);
                                    const currentPage = urlParams.get('page');
                                    const url = currentPage ? `${ENGAGEMENT_PATHS.LIST_ENGAGEMENTS}?page=${currentPage}` : ENGAGEMENT_PATHS.LIST_ENGAGEMENTS;
                                    navigate(url);
                                }}
                                style={{ 
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
            </div>

            {/* Engagement Information Card */}
            <InfoCard title="Engagement Information" icon="📋" borderColor="#28a745">
                <div style={{
                    backgroundColor: '#fff',
                    padding: '20px',
                    borderRadius: '8px',
                    border: '1px solid #e9ecef',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}>
                    <Row>
                        {programmeTracks.length > 0 && (
                            <Col md={6}>
                                <div className="mb-4">
                                    <div className="d-flex align-items-center mb-2">
                                        <i className="feather icon-folder text-primary mr-2"></i>
                                        <label className="text-muted small mb-0">Programme Tracks</label>
                                    </div>
                                    <h5 className="text-dark font-weight-bold mb-0">
                                        {programmeTracks.map((track, idx) => (
                                            <span key={track.id || idx}>
                                                {track.title}
                                                {idx < programmeTracks.length - 1 && ', '}
                                            </span>
                                        ))}
                                    </h5>
                                </div>
                            </Col>
                        )}
                        <Col md={programmeTracks.length > 0 ? 6 : 12}>
                            <div className="mb-4">
                                <div className="d-flex align-items-center mb-2">
                                    <i className="feather icon-check-circle text-success mr-2"></i>
                                    <label className="text-muted small mb-0">Status</label>
                                </div>
                                <Badge 
                                    bg={isActive ? 'success' : 'secondary'}
                                    style={{ fontSize: '14px', padding: '6px 12px', fontWeight: 'bold' }}
                                >
                                    <i className={`feather ${isActive ? 'icon-check' : 'icon-x'} mr-1`}></i>
                                    {isActive ? 'Active' : 'Inactive'}
                                </Badge>
                            </div>
                        </Col>
                        <Col md={6}>
                            <div className="mb-4">
                                <div className="d-flex align-items-center mb-2">
                                    <i className="feather icon-calendar text-info mr-2"></i>
                                    <label className="text-muted small mb-0">Event Name</label>
                                </div>
                                <div className="bg-light p-2 rounded">
                                    <span className="text-dark font-weight-medium">
                                        {event.name || 'N/A'}
                                    </span>
                                </div>
                            </div>
                        </Col>
                        <Col md={6}>
                            <div className="mb-4">
                                <div className="d-flex align-items-center mb-2">
                                    <i className="feather icon-clock text-warning mr-2"></i>
                                    <label className="text-muted small mb-0">Event Date</label>
                                </div>
                                <div className="bg-light p-2 rounded">
                                    <span className="text-dark font-weight-medium">
                                        {event.startDate ? new Date(event.startDate).toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        }) : 'N/A'}
                                    </span>
                                </div>
                            </div>
                        </Col>
                        {event.startTime && event.endTime && (
                            <Col md={6}>
                                <div className="mb-3">
                                    <div className="d-flex align-items-center mb-2">
                                        <i className="feather icon-clock text-danger mr-2"></i>
                                        <label className="text-muted small mb-0">Event Time</label>
                                    </div>
                                    <div className="bg-light p-2 rounded">
                                        <span className="text-dark font-weight-medium">
                                            {event.startTime} - {event.endTime}
                                        </span>
                                    </div>
                                </div>
                            </Col>
                        )}
                        {totalSessions > 0 && (
                            <Col md={6}>
                                <div className="mb-3">
                                    <div className="d-flex align-items-center mb-2">
                                        <i className="feather icon-list text-success mr-2"></i>
                                        <label className="text-muted small mb-0">Total Sessions</label>
                                    </div>
                                    <div className="bg-light p-2 rounded">
                                        <span className="text-dark font-weight-medium">
                                            {totalSessions} {totalSessions === 1 ? 'Session' : 'Sessions'}
                                        </span>
                                    </div>
                                </div>
                            </Col>
                        )}
                    </Row>
                </div>
            </InfoCard>

            {/* Programme Tracks with Sessions */}
            {filteredProgrammeTracks.length > 0 && filteredProgrammeTracks.map((track, trackIndex) => 
                track.sessions && track.sessions.length > 0 ? track.sessions.map((session, sessionIndex) => (
                    <InfoCard 
                        key={`${track.id || trackIndex}-${session.id || sessionIndex}`}
                        title={`Session ${sessionIndex + 1}: ${session.title}`} 
                        icon="📅" 
                        borderColor="#17a2b8"
                    >
                        <Tab.Container defaultActiveKey={`details-${sessionIndex}`}>
                            <Nav variant="pills" className="mb-4" style={{ 
                                borderBottom: '2px solid #17a2b8',
                                paddingBottom: '12px',
                                gap: '15px'
                            }}>
                                <Nav.Item>
                                    <Nav.Link 
                                        eventKey={`details-${sessionIndex}`}
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
                                        eventKey={`timing-${sessionIndex}`}
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
                                            eventKey={`speakers-${sessionIndex}`}
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
                                <Tab.Pane eventKey={`details-${sessionIndex}`}>
                                    <div style={{
                                        backgroundColor: '#fff',
                                        padding: '20px',
                                        borderRadius: '8px',
                                        border: '1px solid #e9ecef',
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                    }}>
                                        <Row>
                                            <Col md={12}>
                                                <div className="mb-4">
                                                    <div className="d-flex align-items-center mb-2">
                                                        <i className="feather icon-file-text text-primary mr-2"></i>
                                                        <label className="text-muted small mb-0">Session Title</label>
                                                    </div>
                                                    <h5 className="text-dark font-weight-bold mb-0">{session.title}</h5>
                                                </div>
                                            </Col>
                                            {session.venue && (
                                                <Col md={6}>
                                                    <div className="mb-4">
                                                        <div className="d-flex align-items-center mb-2">
                                                            <i className="feather icon-map-pin text-warning mr-2"></i>
                                                            <label className="text-muted small mb-0">Venue</label>
                                                        </div>
                                                        <h5 className="text-dark font-weight-bold mb-0">{session.venue || 'TBA'}</h5>
                                                    </div>
                                                </Col>
                                            )}
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
                                                                {session.description}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </Col>
                                            )}
                                        </Row>
                                    </div>
                                </Tab.Pane>

                                {/* Timing Information Tab */}
                                <Tab.Pane eventKey={`timing-${sessionIndex}`}>
                    <div style={{
                        backgroundColor: '#fff',
                        padding: '20px',
                        borderRadius: '8px',
                        border: '1px solid #e9ecef',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}>
                                        <Row>
                                    {session.startDate && (
                                                <Col md={6}>
                                                    <div className="mb-4">
                                                        <div className="d-flex align-items-center mb-2">
                                                            <i className="feather icon-calendar text-primary mr-2"></i>
                                                            <label className="text-muted small mb-0">Session Date</label>
                                                        </div>
                                                        <div className="bg-light p-3 rounded">
                                                            <h5 className="text-dark font-weight-bold mb-0">
                                                                {session.startDate ? new Date(session.startDate).toLocaleDateString('en-US', {
                                                                    year: 'numeric',
                                                                    month: 'long',
                                                                    day: 'numeric'
                                                                }) : 'N/A'}
                                                            </h5>
                                                        </div>
                                                    </div>
                                                </Col>
                                            )}
                                            {session.startTime && (
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
                                            )}
                                            {session.endTime && (
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
                                    )}
                                        </Row>
                                </div>
                                </Tab.Pane>

                                {/* Speakers Tab */}
                                {session.speakers && session.speakers.length > 0 && (
                                    <Tab.Pane eventKey={`speakers-${sessionIndex}`}>
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
                                            handleSpeakerProfileClick={handleSpeakerProfileClick}
                                        />
                                    </div>
                                    </Tab.Pane>
                                )}
                            </Tab.Content>
                        </Tab.Container>
                    </InfoCard>
                )) : null
            )}

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

export default ViewEngagementPage;
