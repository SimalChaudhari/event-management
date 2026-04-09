import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Button, Row, Col, Badge, Modal, Card } from 'react-bootstrap';
import { getEngagementById } from '../../store/actions/engagementActions';
import { ENGAGEMENT_PATHS, SPEAKER_PATHS } from '../../utils/constants';
import { API_URL } from '../../configs/env';
import { ExpandableDescription } from '../../components/ExpandableDescription';

const ViewEngagementPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const { selectedEngagement, loading } = useSelector((state) => state.engagement);
    
    // Speaker image modal state
    const [showSpeakerImageModal, setShowSpeakerImageModal] = useState(false);
    const [currentSpeakerImage, setCurrentSpeakerImage] = useState('');

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

    // Handle speaker click navigation
    const handleSpeakerClick = (speakerId) => {
        if (speakerId) {
            navigate(`${SPEAKER_PATHS.VIEW_SPEAKER}/${speakerId}`);
        }
    };

    // Format time to 12-hour format with AM/PM
    const formatTime = (time) => {
        if (!time) return '';
        try {
            const [hours, minutes] = time.split(':');
            const hour = parseInt(hours);
            const ampm = hour >= 12 ? 'PM' : 'AM';
            const hour12 = hour % 12 || 12;
            const displayMinutes = minutes ? minutes.padStart(2, '0') : '00';
            return `${hour12}:${displayMinutes} ${ampm}`;
        } catch (error) {
            console.error('Time parsing error:', error);
            return time;
        }
    };

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


    // Backend sends 'programmeTracks' array
    const programmeTracks = selectedEngagement?.programmeTracks || [];
    const event = selectedEngagement?.event || {};
    const isActive = selectedEngagement?.isActive !== undefined ? selectedEngagement.isActive : true;
    
    // Get sessionIds from engagement (could be at root or in first track)
    const engagementSessionIds = selectedEngagement?.sessionIds || programmeTracks[0]?.sessionIds || [];
    
    // Filter sessions based on sessionIds if available
    const filteredProgrammeTracks = engagementSessionIds.length > 0 
        ? programmeTracks.map(track => ({
            ...track,
            sessions: track.sessions?.filter(session => engagementSessionIds.includes(session.id)) || []
        }))
        : programmeTracks;
    
    // Calculate total sessions across all tracks (only filtered sessions)
    const totalSessions = filteredProgrammeTracks.reduce((total, track) => total + (track.sessions?.length || 0), 0);

    const content = (
        <Row className="m-0" style={{ width: '100%', maxWidth: '100%' }}>
            {/* Engagement Information Section */}
            <Col xs={12} className="mb-md-4 mb-3 p-0" style={{ overflow: 'hidden', width: '100%', maxWidth: '100%' }}>
                <h5 className="mb-md-3 mb-3 pb-md-2 pb-2" style={{ 
                    fontSize: '16px', 
                    fontWeight: '600', 
                    color: '#000000',
                    borderBottom: '2px solid #4680ff'
                }}>
                    <i className="fas fa-info-circle mr-2" style={{ color: '#4680ff' }}></i>
                    Engagement Information
                </h5>
                
                <Row>
                    {programmeTracks.length > 0 && (
                        <InfoField
                            label="Programme Tracks"
                            value={programmeTracks.map((track, idx) => (
                                <span key={track.id || idx}>
                                    {track.title}
                                    {idx < programmeTracks.length - 1 && ', '}
                                </span>
                            ))}
                            icon="fas fa-folder"
                            colSize={6}
                        />
                    )}
                    <InfoField
                        label="Status"
                        value={
                            <Badge bg={isActive ? 'success' : 'secondary'} style={{ fontSize: '12px', padding: '6px 12px', fontWeight: '600' }}>
                                {isActive ? 'Active' : 'Inactive'}
                            </Badge>
                        }
                        icon="fas fa-check-circle"
                        colSize={programmeTracks.length > 0 ? 6 : 12}
                    />
                    <InfoField
                        label="Event Name"
                        value={event.name || 'N/A'}
                        icon="fas fa-calendar"
                        colSize={6}
                    />
                    <InfoField
                        label="Event Date"
                        value={event.startDate ? new Date(event.startDate).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        }) : 'N/A'}
                        icon="fas fa-calendar-alt"
                        colSize={6}
                    />
                    {event.startTime && event.endTime && (
                        <InfoField
                            label="Event Time"
                            value={`${formatTime(event.startTime)} - ${formatTime(event.endTime)}`}
                            icon="fas fa-clock"
                            colSize={6}
                        />
                    )}
                    {totalSessions > 0 && (
                        <InfoField
                            label="Total Sessions"
                            value={`${totalSessions} ${totalSessions === 1 ? 'Session' : 'Sessions'}`}
                            icon="fas fa-list"
                            colSize={6}
                        />
                    )}
                </Row>
            </Col>

            {/* Sessions Section */}
            {filteredProgrammeTracks.length > 0 && filteredProgrammeTracks.map((track, trackIndex) => 
                track.sessions && track.sessions.length > 0 ? track.sessions.map((session, sessionIndex) => (
                    <Col xs={12} key={`${track.id || trackIndex}-${session.id || sessionIndex}`} className="mb-md-4 mb-3 p-0" style={{ overflow: 'hidden', width: '100%', maxWidth: '100%' }}>
                        <h5 className="mb-md-3 mb-3 pb-md-2 pb-2" style={{ 
                            fontSize: '16px', 
                            fontWeight: '600', 
                            color: '#000000',
                            borderBottom: '2px solid #4680ff'
                        }}>
                            <i className="fas fa-calendar-alt mr-2" style={{ color: '#4680ff' }}></i>
                            Session {sessionIndex + 1} Overview
                        </h5>
                        
                        <Row>
                            <InfoField 
                                label="Session Title" 
                                value={session.title || 'N/A'} 
                                icon="fas fa-calendar-alt"
                                colSize={12}
                            />
                            
                            {session.venue && (
                                <InfoField
                                    label="Venue"
                                    value={session.venue}
                                    icon="fas fa-map-marker-alt"
                                    colSize={6}
                                />
                            )}
                            
                            {session.startDate && (
                                <InfoField
                                    label="Session Date"
                                    value={new Date(session.startDate).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })}
                                    icon="fas fa-calendar"
                                    colSize={6}
                                />
                            )}
                            
                            {session.startTime && (
                                <InfoField
                                    label="Start Time"
                                    value={formatTime(session.startTime) || 'N/A'}
                                    icon="fas fa-play-circle"
                                    colSize={6}
                                />
                            )}
                            
                            {session.endTime && (
                                <InfoField
                                    label="End Time"
                                    value={formatTime(session.endTime) || 'N/A'}
                                    icon="fas fa-stop-circle"
                                    colSize={6}
                                />
                            )}
                            
                            {/* Speakers */}
                            {session.speakers && session.speakers.length > 0 && (
                                <Col xs={12} sm={12} md={12} className="mb-2" style={{ overflow: 'hidden' }}>
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
                                                marginBottom: '8px',
                                                wordBreak: 'break-word',
                                                overflowWrap: 'break-word'
                                            }}>
                                                <span>Speakers:</span>
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
                                                <Row>
                                                    {session.speakers.map((speaker) => (
                                                        <Col xs={12} sm={6} key={speaker.id} className="mb-2">
                                                            <div className="d-flex align-items-center p-2 rounded" style={{ backgroundColor: '#ffffff' }}>
                                                                {speaker.profilePicture ? (
                                                                    <img
                                                                        src={`${API_URL}/${speaker.profilePicture}`}
                                                                        alt={speaker.name}
                                                                        style={{
                                                                            width: '40px',
                                                                            height: '40px',
                                                                            borderRadius: '50%',
                                                                            objectFit: 'cover',
                                                                            marginRight: '12px',
                                                                            flexShrink: 0,
                                                                            cursor: 'pointer'
                                                                        }}
                                                                        onClick={() => handleSpeakerImageClick(speaker.profilePicture)}
                                                                    />
                                                                ) : (
                                                                    <div
                                                                        style={{
                                                                            width: '40px',
                                                                            height: '40px',
                                                                            borderRadius: '50%',
                                                                            backgroundColor: '#e9ecef',
                                                                            display: 'flex',
                                                                            alignItems: 'center',
                                                                            justifyContent: 'center',
                                                                            marginRight: '12px',
                                                                            flexShrink: 0
                                                                        }}
                                                                    >
                                                                        <i className="fas fa-user" style={{ color: '#6c757d' }}></i>
                                                                    </div>
                                                                )}
                                                                <div style={{ flex: 1, minWidth: 0, cursor: 'pointer' }} onClick={() => handleSpeakerClick(speaker.id)}>
                                                                    <div style={{ 
                                                                        fontWeight: '500', 
                                                                        fontSize: '14px', 
                                                                        wordBreak: 'break-word',
                                                                        color: '#4680ff',
                                                                        textDecoration: 'none',
                                                                        transition: 'all 0.2s ease'
                                                                    }}
                                                                    onMouseEnter={(e) => {
                                                                        e.target.style.textDecoration = 'underline';
                                                                        e.target.style.color = '#0056b3';
                                                                    }}
                                                                    onMouseLeave={(e) => {
                                                                        e.target.style.textDecoration = 'none';
                                                                        e.target.style.color = '#4680ff';
                                                                    }}
                                                                    >
                                                                        {speaker.name || 'N/A'}
                                                                    </div>
                                                                    {speaker.position && (
                                                                        <div style={{ 
                                                                            fontSize: '12px', 
                                                                            color: '#6c757d', 
                                                                            wordBreak: 'break-word',
                                                                            cursor: 'pointer',
                                                                            transition: 'all 0.2s ease'
                                                                        }}
                                                                        onMouseEnter={(e) => {
                                                                            e.target.style.color = '#4680ff';
                                                                        }}
                                                                        onMouseLeave={(e) => {
                                                                            e.target.style.color = '#6c757d';
                                                                        }}
                                                                        onClick={() => handleSpeakerClick(speaker.id)}
                                                                        >
                                                                            {speaker.position}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </Col>
                                                    ))}
                                                </Row>
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
                                                <span style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>Speakers:</span>
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
                                                <Row>
                                                    {session.speakers.map((speaker) => (
                                                        <Col md={12} key={speaker.id} className="mb-2">
                                                            <div className="d-flex align-items-center p-2 rounded" style={{ backgroundColor: '#ffffff' }}>
                                                                {speaker.profilePicture ? (
                                                                    <img
                                                                        src={`${API_URL}/${speaker.profilePicture}`}
                                                                        alt={speaker.name}
                                                                        style={{
                                                                            width: '40px',
                                                                            height: '40px',
                                                                            borderRadius: '50%',
                                                                            objectFit: 'cover',
                                                                            marginRight: '12px',
                                                                            flexShrink: 0,
                                                                            cursor: 'pointer'
                                                                        }}
                                                                        onClick={() => handleSpeakerImageClick(speaker.profilePicture)}
                                                                    />
                                                                ) : (
                                                                    <div
                                                                        style={{
                                                                            width: '40px',
                                                                            height: '40px',
                                                                            borderRadius: '50%',
                                                                            backgroundColor: '#e9ecef',
                                                                            display: 'flex',
                                                                            alignItems: 'center',
                                                                            justifyContent: 'center',
                                                                            marginRight: '12px',
                                                                            flexShrink: 0
                                                                        }}
                                                                    >
                                                                        <i className="fas fa-user" style={{ color: '#6c757d' }}></i>
                                                                    </div>
                                                                )}
                                                                <div style={{ flex: 1, minWidth: 0, cursor: 'pointer' }} onClick={() => handleSpeakerClick(speaker.id)}>
                                                                    <div style={{ 
                                                                        fontWeight: '500', 
                                                                        fontSize: '14px', 
                                                                        wordBreak: 'break-word',
                                                                        color: '#4680ff',
                                                                        textDecoration: 'none',
                                                                        transition: 'all 0.2s ease'
                                                                    }}
                                                                    onMouseEnter={(e) => {
                                                                        e.target.style.textDecoration = 'underline';
                                                                        e.target.style.color = '#0056b3';
                                                                    }}
                                                                    onMouseLeave={(e) => {
                                                                        e.target.style.textDecoration = 'none';
                                                                        e.target.style.color = '#4680ff';
                                                                    }}
                                                                    >
                                                                        {speaker.name || 'N/A'}
                                                                    </div>
                                                                    {speaker.position && (
                                                                        <div style={{ 
                                                                            fontSize: '12px', 
                                                                            color: '#6c757d', 
                                                                            wordBreak: 'break-word',
                                                                            cursor: 'pointer',
                                                                            transition: 'all 0.2s ease'
                                                                        }}
                                                                        onMouseEnter={(e) => {
                                                                            e.target.style.color = '#4680ff';
                                                                        }}
                                                                        onMouseLeave={(e) => {
                                                                            e.target.style.color = '#6c757d';
                                                                        }}
                                                                        onClick={() => handleSpeakerClick(speaker.id)}
                                                                        >
                                                                            {speaker.position}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </Col>
                                                    ))}
                                                </Row>
                                            </div>
                                        </div>
                                    </div>
                                </Col>
                            )}
                            
                            {/* Session Description - Last */}
                            {session.description && (
                                <Col xs={12} sm={12} md={12} className="mb-2" style={{ overflow: 'hidden' }}>
                                    <div style={{ 
                                        padding: '8px 12px',
                                        borderBottom: '1px solid #e9ecef',
                                        backgroundColor: '#ffffff',
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
                )) : null
            )}
        </Row>
    );

    return (
        <div className="p-2 bg-light">
            {/* Header Section */}
            <div className="mb-md-4 mb-3">
                <div className="d-none d-md-block">
                    <Card style={{ 
                        backgroundColor: '#fff', 
                        borderRadius: '8px', 
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        border: '1px solid #e9ecef',
                        overflow: 'hidden',
                        marginBottom: '24px'
                    }}>
                        <Card.Body style={{ padding: '20px' }}>
                            <div className="d-flex justify-content-between align-items-center">
                                <div>
                                    <h4 style={{ 
                                        margin: 0, 
                                        color: '#2c3e50',
                                        fontWeight: '600'
                                    }}>
                                        <i className="fas fa-users mr-2" style={{ color: '#4680ff' }}></i>
                                        Engagement Profile
                                    </h4>
                                  
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
                                        <i className="fas fa-arrow-left mr-2"></i>
                                        Back
                                    </Button>
                                </div>
                            </div>
                        </Card.Body>
                    </Card>
                </div>
                <div className="d-block d-md-none px-2 py-2">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <div>
                            <h4 style={{ 
                                margin: 0, 
                                color: '#2c3e50',
                                fontWeight: '600',
                                fontSize: '18px'
                            }}>
                                <i className="fas fa-users mr-2" style={{ color: '#4680ff' }}></i>
                                Engagement Profile
                            </h4>
                        </div>
                        <div>
                            <Button 
                                variant="secondary" 
                                size="sm"
                                onClick={() => {
                                    const urlParams = new URLSearchParams(window.location.search);
                                    const currentPage = urlParams.get('page');
                                    const url = currentPage ? `${ENGAGEMENT_PATHS.LIST_ENGAGEMENTS}?page=${currentPage}` : ENGAGEMENT_PATHS.LIST_ENGAGEMENTS;
                                    navigate(url);
                                }}
                                style={{ 
                                    padding: '6px 12px',
                                    fontWeight: '500'
                                }}
                            >
                                <i className="fas fa-arrow-left mr-2"></i>
                                Back
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Section */}
            <div className="d-none d-md-block">
                <Card style={{ 
                    backgroundColor: '#fff', 
                    borderRadius: '8px', 
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    border: '1px solid #e9ecef',
                    overflow: 'hidden'
                }}>
                    <Card.Body style={{ padding: '24px', overflow: 'hidden', width: '100%', maxWidth: '100%' }}>
                        {content}
                    </Card.Body>
                </Card>
            </div>
            <div className="d-block d-md-none px-2 py-2">
                {content}
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

export default ViewEngagementPage;
