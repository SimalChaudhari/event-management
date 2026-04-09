import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Row, Col } from 'react-bootstrap';
import { API_URL } from '../../configs/env';
import { ExpandableDescription } from '../ExpandableDescription';
import { SPEAKER_PATHS } from '../../utils/constants';

/**
 * EventProgrammeComponent - Reusable component to display event programme tracks
 * @param {Array} programmeTracks - Programme tracks data
 * @param {Function} formatTime - Function to format time to 12-hour format
 */
const EventProgrammeComponent = ({ programmeTracks, formatTime }) => {
    const navigate = useNavigate();
    
    // Check if programme tracks are available
    if (!programmeTracks || programmeTracks.length === 0) {
        return (
            <div className="text-center py-5">
                <i className="fas fa-calendar-times fa-3x text-muted mb-4"></i>
                <h5 className="text-muted">No Programme Available</h5>
            </div>
        );
    }

    // Handle speaker click navigation
    const handleSpeakerClick = (speakerId) => {
        if (speakerId) {
            navigate(`${SPEAKER_PATHS.VIEW_SPEAKER}/${speakerId}`);
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

    const content = (
        <Row className="m-0" style={{ width: '100%', maxWidth: '100%' }}>
            {programmeTracks.map((track, trackIndex) => (
                <Col xs={12} key={track.id} className="mb-md-4 mb-3 p-0" style={{ overflow: 'hidden', width: '100%', maxWidth: '100%' }}>
                    {/* Programme Overview Section */}
                    <h5 className="mb-md-3 mb-3 pb-md-2 pb-2" style={{ 
                        fontSize: '16px', 
                        fontWeight: '600', 
                        color: '#000000',
                        borderBottom: '2px solid #4680ff'
                    }}>
                        <i className="fas fa-layer-group mr-2" style={{ color: '#4680ff' }}></i>
                        Programme {trackIndex + 1} Overview
                    </h5>
                    
                    <Row>
                        <InfoField 
                            label="Programme Title" 
                            value={track.title || 'N/A'} 
                            icon="fas fa-layer-group"
                            colSize={12}
                        />
                        
                        {track.description && (
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
                                            <span>Description:</span>
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
                                            <ExpandableDescription text={track.description} maxLines={2} />
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
                                            <span style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}> Description:</span>
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
                                            <ExpandableDescription text={track.description} maxLines={2} />
                                        </div>
                                    </div>
                                </div>
                            </Col>
                        )}

                        {/* Sessions Section */}
                        {track.sessions && track.sessions.length > 0 ? (
                            <Row style={{ width: '100%', marginLeft: 0, marginRight: 0 }}>
                                {track.sessions.map((session, sessionIndex) => {
                                    // Determine column size: full width (12) if only 1 session, otherwise 2-column grid (6)
                                    const sessionColSize = track.sessions.length === 1 ? 12 : 6;
                                    
                                    // Unique colors for each session to make them visually distinct
                                    const sessionColors = [
                                        { border: '#4680ff', bg: '#f0f4ff', icon: 'fa-calendar-alt' },
                                        { border: '#28a745', bg: '#f0fff4', icon: 'fa-clock' },
                                        { border: '#ffc107', bg: '#fffbf0', icon: 'fa-calendar-check' },
                                        { border: '#dc3545', bg: '#fff5f5', icon: 'fa-calendar-times' },
                                        { border: '#17a2b8', bg: '#f0f9fa', icon: 'fa-calendar-day' },
                                        { border: '#6f42c1', bg: '#f5f0ff', icon: 'fa-calendar-week' }
                                    ];
                                    const colorIndex = sessionIndex % sessionColors.length;
                                    const sessionStyle = sessionColors[colorIndex];
                                    
                                    return (
                                        <Col xs={12} md={sessionColSize} key={session.id} className="mb-md-3 mb-3" style={{ overflow: 'hidden' }}>
                                            <div style={{ 
                                                padding: '12px',
                                                border: `2px solid ${sessionStyle.border}`,
                                                borderLeft: `5px solid ${sessionStyle.border}`,
                                                borderRadius: '8px',
                                                backgroundColor: sessionStyle.bg,
                                                height: '100%',
                                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                            }}>
                                                <h6 className="mb-md-3 mb-3 pb-md-2 pb-2" style={{ 
                                                    fontSize: '15px', 
                                                    fontWeight: '600', 
                                                    color: '#000000',
                                                    borderBottom: `2px solid ${sessionStyle.border}`
                                                }}>
                                                    <i className={`fas ${sessionStyle.icon} mr-2`} style={{ color: sessionStyle.border }}></i>
                                                    Session {sessionIndex + 1}
                                                </h6>
                                                
                                                <Row style={{ width: '100%', marginLeft: 0, marginRight: 0 }}>
                                                    <InfoField 
                                                        label="Session Title" 
                                                        value={session.title || 'N/A'} 
                                                        icon="fas fa-calendar-alt"
                                                        colSize={12}
                                                    />
                                                    
                                                    <InfoField
                                                        label="Date"
                                                        value={session.sessionDate ? new Date(session.sessionDate).toLocaleDateString('en-US', {
                                                            year: 'numeric',
                                                            month: 'long',
                                                            day: 'numeric'
                                                        }) : 'N/A'}
                                                        icon="fas fa-calendar"
                                                        colSize={12}
                                                    />
                                                    
                                                    <InfoField
                                                        label="Time"
                                                        value={session.startTime && session.endTime 
                                                            ? `${formatTime(session.startTime)} - ${formatTime(session.endTime)}`
                                                            : 'N/A'}
                                                        icon="fas fa-clock"
                                                        colSize={12}
                                                    />
                                                    
                                                    {session.venue && (
                                                        <InfoField
                                                            label="Venue"
                                                            value={session.venue}
                                                            icon="fas fa-map-marker-alt"
                                                            colSize={12}
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
                                                                                                    flexShrink: 0
                                                                                                }}
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
                                                                                                    flexShrink: 0
                                                                                                }}
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
                                            </div>
                                        </Col>
                                    );
                                })}
                            </Row>
                        ) : (
                            <Col xs={12} className="mb-2">
                                <div style={{ 
                                    padding: '8px 12px',
                                    borderBottom: '1px solid #e9ecef',
                                    width: '100%',
                                    maxWidth: '100%',
                                    boxSizing: 'border-box'
                                }}
                                className="px-md-3 px-2 py-md-2 py-2"
                                >
                                    <p className="text-muted mb-0" style={{ fontSize: '14px' }}>No sessions available for this programme.</p>
                                </div>
                            </Col>
                        )}
                    </Row>
                </Col>
            ))}
        </Row>
    );

    return (
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
                        {content}
                    </Card.Body>
                </Card>
            </div>
            {/* Mobile: No card wrapper, minimal padding - hide on desktop to avoid duplicate */}
            <div className="d-block d-md-none">
                {content}
            </div>
        </div>
    );
};

export default EventProgrammeComponent;

