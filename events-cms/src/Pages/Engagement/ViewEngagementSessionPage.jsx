import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Button, Row, Col, Badge, Alert, Modal, Card } from 'react-bootstrap';
import { getSessionsByEvent, getTracksByEvent, getAllSessions, getAllTracks } from '../../store/actions/programmeActions';
import { ENGAGEMENT_PATHS } from '../../utils/constants';
import { API_URL } from '../../configs/env';
import EventSpeakersComponent from '../../components/events/EventSpeakersComponent';
import { ExpandableDescription } from '../../components/ExpandableDescription';

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
    const hasFetchedDataRef = useRef(false);
    
    // Speaker image modal state
    const [showSpeakerImageModal, setShowSpeakerImageModal] = useState(false);
    const [currentSpeakerImage, setCurrentSpeakerImage] = useState('');

    useEffect(() => {
        // Prevent multiple API calls
        if (hasFetchedDataRef.current) return;
        
        if (eventIdFromUrl) {
            // If we have eventId, fetch only sessions and tracks for that event
            dispatch(getSessionsByEvent(eventIdFromUrl));
            dispatch(getTracksByEvent(eventIdFromUrl));
            hasFetchedDataRef.current = true;
        } else {
            // Only fetch all data if not already available
            if (!sessions || sessions.length === 0) {
                dispatch(getAllSessions());
            }
            if (!tracks || tracks.length === 0) {
                dispatch(getAllTracks());
            }
            hasFetchedDataRef.current = true;
        }
    }, [dispatch, eventIdFromUrl]); // Removed sessions and tracks from dependencies

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

    // InfoField component matching EventBasicComponent pattern - responsive design
    const InfoField = ({ label, value, icon = null, colSize = 6 }) => (
        <Col xs={12} sm={12} md={colSize} className="mb-2" style={{ overflow: 'hidden' }}>
            <div style={{ 
                padding: '8px 12px',
                borderBottom: '1px solid #e9ecef',
                width: '100%',
                maxWidth: '100%',
                boxSizing: 'border-box'
            }}
            className="px-md-3 px-2 py-md-2 py-2"
            >
                {/* Mobile & Tablet: Label on top */}
                <div className="d-block d-md-none">
                    <div style={{ 
                        fontSize: '13px', 
                        fontWeight: '600', 
                        color: '#4680ff',
                        marginBottom: '4px',
                        wordBreak: 'break-word',
                        overflowWrap: 'break-word'
                    }}>
                        <span>{label}:</span>
                    </div>
                    <div style={{ 
                        fontSize: '14px', 
                        color: '#000000',
                        fontWeight: '400',
                        wordBreak: 'break-word',
                        overflowWrap: 'break-word',
                        width: '100%',
                        lineHeight: '1.5'
                    }}>
                        {value || 'N/A'}
                    </div>
                </div>
                {/* Desktop: Label and value side by side */}
                <div className="d-none d-md-flex align-items-start" style={{ width: '100%', minWidth: 0 }}>
                    <div style={{ 
                        minWidth: '140px',
                        maxWidth: '140px',
                        fontSize: '13px', 
                        fontWeight: '600', 
                        color: '#4680ff',
                        marginRight: '12px',
                        flexShrink: 0
                    }}>
                        <span style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>{label}:</span>
                    </div>
                    <div style={{ 
                        fontSize: '14px', 
                        color: '#000000',
                        fontWeight: '400',
                        flex: 1,
                        minWidth: 0,
                        wordBreak: 'break-word',
                        overflowWrap: 'break-word',
                        overflow: 'hidden'
                    }}>
                        {value || 'N/A'}
                    </div>
                </div>
            </div>
        </Col>
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
                                Session Profile
                            </h4>
                         
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


            {/* Session Information Section */}
            <div>
                {/* Desktop: Card wrapper */}
                <div className="d-none d-md-block">
                    <Card style={{ 
                        backgroundColor: '#fff', 
                        borderRadius: '8px', 
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        border: '1px solid #e9ecef',
                        overflow: 'hidden'
                    }}>
                        <Card.Body style={{ padding: '24px', overflow: 'hidden', width: '100%', maxWidth: '100%' }}>
                            <Row className="m-0" style={{ width: '100%', maxWidth: '100%' }}>
                                {/* Session Overview Section */}
                                <Col xs={12} className="p-0" style={{ overflow: 'hidden', width: '100%', maxWidth: '100%' }}>
                                    <h5 className="mb-md-3 mb-3 pb-md-2 pb-2" style={{ 
                                        fontSize: '16px', 
                                        fontWeight: '600', 
                                        color: '#000000',
                                        borderBottom: '2px solid #4680ff'
                                    }}>
                                        <i className="fas fa-info-circle mr-2" style={{ color: '#4680ff' }}></i>
                                        Session Overview
                                    </h5>
                                    <Row>
                                        <InfoField 
                                            label="Session Title" 
                                            value={session.title || 'N/A'} 
                                            icon="fas fa-calendar-alt"
                                            colSize={12}
                                        />
                                        <InfoField
                                            label="Track"
                                            value={track ? track.title : 'N/A'}
                                            icon="fas fa-folder"
                                            colSize={6}
                                        />
                                        <InfoField
                                            label="Venue"
                                            value={session.venue || 'TBA'}
                                            icon="fas fa-map-marker-alt"
                                            colSize={6}
                                        />
                                        <InfoField
                                            label="Status"
                                            value={
                                                <Badge bg={session.isActive ? 'success' : 'danger'} style={{ fontSize: '12px', padding: '6px 12px', fontWeight: '600' }}>
                                                    {session.isActive ? 'Active' : 'Inactive'}
                                                </Badge>
                                            }
                                            icon="fas fa-check-circle"
                                            colSize={6}
                                        />
                                        <InfoField
                                            label="Session Date"
                                            value={(session.startDate || session.sessionDate) ? new Date(session.startDate || session.sessionDate).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            }) : 'N/A'}
                                            icon="fas fa-calendar"
                                            colSize={6}
                                        />
                                        <InfoField
                                            label="Start Time"
                                            value={session.startTime || 'N/A'}
                                            icon="fas fa-play-circle"
                                            colSize={6}
                                        />
                                        <InfoField
                                            label="End Time"
                                            value={session.endTime || 'N/A'}
                                            icon="fas fa-stop-circle"
                                            colSize={6}
                                        />
                                        <InfoField
                                            label="Created At"
                                            value={new Date(session.createdAt).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            })}
                                            icon="fas fa-calendar"
                                            colSize={6}
                                        />
                                        <InfoField
                                            label="Updated At"
                                            value={new Date(session.updatedAt).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            })}
                                            icon="fas fa-edit"
                                            colSize={6}
                                        />
                                        {session.description && (
                                            <Col xs={12} sm={12} md={12} className="mb-2" style={{ overflow: 'hidden' }}>
                                                <div style={{ 
                                                    padding: '8px 12px',
                                                    borderBottom: '1px solid #e9ecef',
                                                    backgroundColor: '#f8f9fa',
                                                    borderRadius: '4px',
                                                    width: '100%',
                                                    maxWidth: '100%',
                                                    boxSizing: 'border-box'
                                                }}
                                                className="px-md-3 px-2 py-md-2 py-2"
                                                >
                                                    {/* Mobile & Tablet: Label on top */}
                                                    <div className="d-block d-md-none">
                                                        <div style={{ 
                                                            fontSize: '13px', 
                                                            fontWeight: '600', 
                                                            color: '#4680ff',
                                                            marginBottom: '4px',
                                                            wordBreak: 'break-word',
                                                            overflowWrap: 'break-word'
                                                        }}>
                                                            <span>Session Description:</span>
                                                        </div>
                                                        <div style={{ 
                                                            fontSize: '14px', 
                                                            color: '#000000',
                                                            fontWeight: '400',
                                                            wordBreak: 'break-word',
                                                            overflowWrap: 'break-word',
                                                            width: '100%',
                                                            lineHeight: '1.5'
                                                        }}>
                                                            <ExpandableDescription text={session.description} maxLines={2} />
                                                        </div>
                                                    </div>
                                                    {/* Desktop: Label and value side by side */}
                                                    <div className="d-none d-md-flex align-items-start" style={{ width: '100%', minWidth: 0 }}>
                                                        <div style={{ 
                                                            minWidth: '140px',
                                                            maxWidth: '140px',
                                                            fontSize: '13px', 
                                                            fontWeight: '600', 
                                                            color: '#4680ff',
                                                            marginRight: '12px',
                                                            flexShrink: 0
                                                        }}>
                                                            <span style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>Session Description:</span>
                                                        </div>
                                                        <div style={{ 
                                                            fontSize: '14px', 
                                                            color: '#000000',
                                                            fontWeight: '400',
                                                            flex: 1,
                                                            minWidth: 0,
                                                            wordBreak: 'break-word',
                                                            overflowWrap: 'break-word',
                                                            overflow: 'hidden'
                                                        }}>
                                                            <ExpandableDescription text={session.description} maxLines={2} />
                                                        </div>
                                                    </div>
                                                </div>
                                            </Col>
                                        )}
                                    </Row>
                                </Col>

                                {/* Speakers Section */}
                                {session.speakers && session.speakers.length > 0 && (
                                    <Col xs={12} className="mt-md-4 mt-3 p-0" style={{ overflow: 'hidden', width: '100%', maxWidth: '100%' }}>
                                        <h5 className="mb-md-3 mb-3 pb-md-2 pb-2" style={{ 
                                            fontSize: '16px', 
                                            fontWeight: '600', 
                                            color: '#000000',
                                            borderBottom: '2px solid #4680ff'
                                        }}>
                                            <i className="fas fa-users mr-2" style={{ color: '#4680ff' }}></i>
                                            Speakers
                                        </h5>
                                        <EventSpeakersComponent 
                                            speakers={session.speakers} 
                                            handleSpeakerImageClick={handleSpeakerImageClick}
                                        />
                                    </Col>
                                )}
                            </Row>
                        </Card.Body>
                    </Card>
                </div>
                {/* Mobile: No card wrapper, minimal padding */}
                <div className="d-block d-md-none px-2 py-2">
                    <Row className="m-0" style={{ width: '100%', maxWidth: '100%' }}>
                        {/* Session Overview Section */}
                        <Col xs={12} className="p-0" style={{ overflow: 'hidden', width: '100%', maxWidth: '100%' }}>
                            <h5 className="mb-md-3 mb-3 pb-md-2 pb-2" style={{ 
                                fontSize: '16px', 
                                fontWeight: '600', 
                                color: '#000000',
                                borderBottom: '2px solid #4680ff'
                            }}>
                                <i className="fas fa-info-circle mr-2" style={{ color: '#4680ff' }}></i>
                                Session Overview
                            </h5>
                            <Row>
                                <InfoField 
                                    label="Session Title" 
                                    value={session.title || 'N/A'} 
                                    icon="fas fa-calendar-alt"
                                    colSize={12}
                                />
                                <InfoField
                                    label="Track"
                                    value={track ? track.title : 'N/A'}
                                    icon="fas fa-folder"
                                    colSize={6}
                                />
                                <InfoField
                                    label="Venue"
                                    value={session.venue || 'TBA'}
                                    icon="fas fa-map-marker-alt"
                                    colSize={6}
                                />
                                <InfoField
                                    label="Status"
                                    value={
                                        <Badge bg={session.isActive ? 'success' : 'danger'} style={{ fontSize: '12px', padding: '6px 12px', fontWeight: '600' }}>
                                            {session.isActive ? 'Active' : 'Inactive'}
                                        </Badge>
                                    }
                                    icon="fas fa-check-circle"
                                    colSize={6}
                                />
                                <InfoField
                                    label="Session Date"
                                    value={(session.startDate || session.sessionDate) ? new Date(session.startDate || session.sessionDate).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    }) : 'N/A'}
                                    icon="fas fa-calendar"
                                    colSize={6}
                                />
                                <InfoField
                                    label="Start Time"
                                    value={session.startTime || 'N/A'}
                                    icon="fas fa-play-circle"
                                    colSize={6}
                                />
                                <InfoField
                                    label="End Time"
                                    value={session.endTime || 'N/A'}
                                    icon="fas fa-stop-circle"
                                    colSize={6}
                                />
                                <InfoField
                                    label="Created At"
                                    value={new Date(session.createdAt).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })}
                                    icon="fas fa-calendar"
                                    colSize={6}
                                />
                                <InfoField
                                    label="Updated At"
                                    value={new Date(session.updatedAt).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })}
                                    icon="fas fa-edit"
                                    colSize={6}
                                />
                                {session.description && (
                                    <Col xs={12} sm={12} md={12} className="mb-2" style={{ overflow: 'hidden' }}>
                                        <div style={{ 
                                            padding: '8px 12px',
                                            borderBottom: '1px solid #e9ecef',
                                            backgroundColor: '#f8f9fa',
                                            borderRadius: '4px',
                                            width: '100%',
                                            maxWidth: '100%',
                                            boxSizing: 'border-box'
                                        }}
                                        className="px-md-3 px-2 py-md-2 py-2"
                                        >
                                            {/* Mobile & Tablet: Label on top */}
                                            <div className="d-block d-md-none">
                                                <div style={{ 
                                                    fontSize: '13px', 
                                                    fontWeight: '600', 
                                                    color: '#4680ff',
                                                    marginBottom: '4px',
                                                    wordBreak: 'break-word',
                                                    overflowWrap: 'break-word'
                                                }}>
                                                    <span>Session Description:</span>
                                                </div>
                                                <div style={{ 
                                                    fontSize: '14px', 
                                                    color: '#000000',
                                                    fontWeight: '400',
                                                    wordBreak: 'break-word',
                                                    overflowWrap: 'break-word',
                                                    width: '100%',
                                                    lineHeight: '1.5'
                                                }}>
                                                    <ExpandableDescription text={session.description} maxLines={2} />
                                                </div>
                                            </div>
                                            {/* Desktop: Label and value side by side */}
                                            <div className="d-none d-md-flex align-items-start" style={{ width: '100%', minWidth: 0 }}>
                                                <div style={{ 
                                                    minWidth: '140px',
                                                    maxWidth: '140px',
                                                    fontSize: '13px', 
                                                    fontWeight: '600', 
                                                    color: '#4680ff',
                                                    marginRight: '12px',
                                                    flexShrink: 0
                                                }}>
                                                    <span style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>Session Description:</span>
                                                </div>
                                                <div style={{ 
                                                    fontSize: '14px', 
                                                    color: '#000000',
                                                    fontWeight: '400',
                                                    flex: 1,
                                                    minWidth: 0,
                                                    wordBreak: 'break-word',
                                                    overflowWrap: 'break-word',
                                                    overflow: 'hidden'
                                                }}>
                                                    <ExpandableDescription text={session.description} maxLines={2} />
                                                </div>
                                            </div>
                                        </div>
                                    </Col>
                                )}
                            </Row>
                        </Col>

                        {/* Speakers Section */}
                        {session.speakers && session.speakers.length > 0 && (
                            <Col xs={12} className="mt-md-4 mt-3 p-0" style={{ overflow: 'hidden', width: '100%', maxWidth: '100%' }}>
                                <h5 className="mb-md-3 mb-3 pb-md-2 pb-2" style={{ 
                                    fontSize: '16px', 
                                    fontWeight: '600', 
                                    color: '#000000',
                                    borderBottom: '2px solid #4680ff'
                                }}>
                                    <i className="fas fa-users mr-2" style={{ color: '#4680ff' }}></i>
                                    Speakers
                                </h5>
                                <EventSpeakersComponent 
                                    speakers={session.speakers} 
                                    handleSpeakerImageClick={handleSpeakerImageClick}
                                />
                            </Col>
                        )}
                    </Row>
                </div>
            </div>

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

