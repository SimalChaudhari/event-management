import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Button, Row, Col, Badge, Modal } from 'react-bootstrap';
import { getEngagementById } from '../../store/actions/engagementActions';
import { ENGAGEMENT_PATHS } from '../../utils/constants';

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
                    <Button variant="primary" onClick={() => navigate(ENGAGEMENT_PATHS.LIST_ENGAGEMENTS)}>
                        Back to List
                    </Button>
                </div>
            </div>
        );
    }

    // Backend sends 'programmeTrack' instead of 'track'
    const track = selectedEngagement.programmeTrack || selectedEngagement.track || {};
    const event = selectedEngagement.event || {};
    const isActive = selectedEngagement.isActive !== undefined ? selectedEngagement.isActive : true;

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
                                onClick={() => navigate(ENGAGEMENT_PATHS.LIST_ENGAGEMENTS)}
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
                        <Col md={6}>
                            <div className="mb-4">
                                <div className="d-flex align-items-center mb-2">
                                    <i className="feather icon-folder text-primary mr-2"></i>
                                    <label className="text-muted small mb-0">Programme Track</label>
                                </div>
                                <h5 className="text-dark font-weight-bold mb-0">{track.title || 'Unknown Track'}</h5>
                            </div>
                        </Col>
                        <Col md={6}>
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
                        {selectedEngagement.sessions && selectedEngagement.sessions.length > 0 && (
                            <Col md={6}>
                                <div className="mb-3">
                                    <div className="d-flex align-items-center mb-2">
                                        <i className="feather icon-list text-success mr-2"></i>
                                        <label className="text-muted small mb-0">Total Sessions</label>
                                    </div>
                                    <div className="bg-light p-2 rounded">
                                        <span className="text-dark font-weight-medium">
                                            {selectedEngagement.sessions.length} {selectedEngagement.sessions.length === 1 ? 'Session' : 'Sessions'}
                                        </span>
                                    </div>
                                </div>
                            </Col>
                        )}
                    </Row>
                </div>
            </InfoCard>

            {/* Sessions Information (if available) */}
            {selectedEngagement.sessions && selectedEngagement.sessions.length > 0 && (
                <InfoCard title="Sessions" icon="📅" borderColor="#17a2b8">
                    <div style={{
                        backgroundColor: '#fff',
                        padding: '20px',
                        borderRadius: '8px',
                        border: '1px solid #e9ecef',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}>
                        {selectedEngagement.sessions.map((session, index) => (
                            <div key={index} className={`mb-3 pb-3 ${index < selectedEngagement.sessions.length - 1 ? 'border-bottom' : ''}`}>
                                <h6 className="text-primary font-weight-bold mb-2">{session.title}</h6>
                                <div className="d-flex flex-wrap gap-3">
                                    {session.startDate && (
                                        <div className="text-muted" style={{ fontSize: '13px' }}>
                                            <i className="feather icon-calendar mr-1"></i>
                                            {new Date(session.startDate).toLocaleDateString()}
                                        </div>
                                    )}
                                    {session.startTime && session.endTime && (
                                        <div className="text-muted" style={{ fontSize: '13px' }}>
                                            <i className="feather icon-clock mr-1"></i>
                                            {session.startTime} - {session.endTime}
                                        </div>
                                    )}
                                </div>
                                {session.speakers && session.speakers.length > 0 && (
                                    <div className="mt-3">
                                        <h6 className="text-muted mb-2" style={{ fontSize: '14px', fontWeight: '600' }}>
                                            <i className="feather icon-users mr-1"></i>
                                            Speakers ({session.speakers.length})
                                        </h6>
                                        <EventSpeakersComponent 
                                            speakers={session.speakers} 
                                            handleSpeakerImageClick={handleSpeakerImageClick}
                                            handleSpeakerProfileClick={handleSpeakerProfileClick}
                                        />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </InfoCard>
            )}

            {/* Speaker Image Modal */}
            <Modal 
                show={showSpeakerImageModal} 
                onHide={() => setShowSpeakerImageModal(false)}
                centered
                size="lg"
            >
                <Modal.Header closeButton>
                    <Modal.Title>Speaker Profile</Modal.Title>
                </Modal.Header>
                <Modal.Body className="text-center">
                    {currentSpeakerImage && (
                        <img 
                            src={currentSpeakerImage} 
                            alt="Speaker Profile" 
                            style={{ 
                                maxWidth: '100%', 
                                maxHeight: '500px', 
                                borderRadius: '8px',
                                boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                            }}
                        />
                    )}
                </Modal.Body>
            </Modal>
        </div>
    );
};

export default ViewEngagementPage;
