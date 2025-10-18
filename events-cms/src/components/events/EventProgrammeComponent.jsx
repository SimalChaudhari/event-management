import React, { useState } from 'react';
import { Card, Row, Col } from 'react-bootstrap';
import { API_URL } from '../../configs/env';

/**
 * ReadMoreComponent - Component to handle read more/less functionality
 */
const ReadMoreComponent = ({ text, maxLength = 100, className = "" }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    
    if (!text) return null;
    
    const shouldTruncate = text.length > maxLength;
    const displayText = isExpanded || !shouldTruncate ? text : text.substring(0, maxLength) + '...';
    
    return (
        <p className={`mb-2 ${className}`} style={{ fontSize: '14px' }}>
            {displayText}
            {shouldTruncate && (
                <button
                    type="button"
                    className="btn btn-link p-0 ml-1"
                    style={{ fontSize: '12px', textDecoration: 'none' }}
                    onClick={() => setIsExpanded(!isExpanded)}
                >
                    {isExpanded ? 'Read Less' : 'Read More'}
                </button>
            )}
        </p>
    );
};

/**
 * EventProgrammeComponent - Reusable component to display event programme tracks
 * @param {Array} programmeTracks - Programme tracks data
 * @param {Function} formatTime - Function to format time to 12-hour format
 */
const EventProgrammeComponent = ({ programmeTracks, formatTime }) => {
    // Check if programme tracks are available
    if (!programmeTracks || programmeTracks.length === 0) {
        return (
            <div className="text-center py-5">
                <i className="fas fa-calendar-times fa-3x text-muted mb-4"></i>
                <h5 className="text-muted">No Programme Available</h5>
            </div>
        );
    }

    return (
        <>
            <h5 className="mb-4">Event Programme</h5>
            {programmeTracks.map((track, trackIndex) => (
                <div key={track.id} className="mb-4">
                    <Card className="border-0 shadow-sm">
                        <Card.Header style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #4680ff' }}>
                            <h6 className="mb-0 text-primary">
                                <i className="fas fa-layer-group" style={{ marginRight: '8px' }}></i>
                                <strong className="text-primary">Programme (Title/Name) {trackIndex + 1}:</strong> {track.title}
                            </h6>
                            {track.description && (
                                <div className="mt-2">
                                    <ReadMoreComponent 
                                        text={track.description} 
                                        maxLength={120} 
                                        className="text-muted mb-0" 
                                    />
                                </div>
                            )}
                        </Card.Header>
                        <Card.Body>
                            {track.sessions && track.sessions.length > 0 ? (
                                track.sessions.map((session, sessionIndex) => (
                                    <div key={session.id} className={`${sessionIndex > 0 ? 'mt-4 pt-4 border-top' : ''}`}>
                                        <div className="d-flex justify-content-between align-items-start mb-3">
                                            <div>
                                                <h6 className="mb-2">
                                                   <strong className="text-primary" style={{ textDecoration: 'underline' }}>Session (Title/Name)</strong> : <span className="text-dark font-weight-bold">{session.title}</span>
                                                </h6>
                                                {session.description && (
                                                    <ReadMoreComponent 
                                                        text={session.description} 
                                                        maxLength={150} 
                                                        className="text-muted mb-2" 
                                                    />
                                                )}
                                            </div>
                                        </div>
                                        <Row className="mb-3">
                                            <Col md={4}>
                                                <div className="d-flex align-items-center text-muted" style={{ fontSize: '14px' }}>
                                                    <i className="fas fa-calendar" style={{ marginRight: '8px', color: '#4680ff' }}></i>
                                                    <span><strong>Date:</strong> {new Date(session.sessionDate).toLocaleDateString()}</span>
                                                </div>
                                            </Col>
                                            <Col md={4}>
                                                <div className="d-flex align-items-center text-muted" style={{ fontSize: '14px' }}>
                                                    <i className="fas fa-clock" style={{ marginRight: '8px', color: '#17a2b8' }}></i>
                                                    <span><strong>Time:</strong> {formatTime(session.startTime)} - {formatTime(session.endTime)}</span>
                                                </div>
                                            </Col>
                                            <Col md={4}>
                                                <div className="d-flex align-items-center text-muted" style={{ fontSize: '14px' }}>
                                                    <i className="fas fa-map-marker-alt" style={{ marginRight: '8px', color: '#dc3545' }}></i>
                                                    <span><strong>Venue:</strong> {session.venue}</span>
                                                </div>
                                            </Col>
                                        </Row>
                                        {session.speakers && session.speakers.length > 0 && (
                                            <div>
                                                <h6 className="mb-3" style={{ fontSize: '14px', fontWeight: 'bold' }}>
                                                    <i className="fas fa-users" style={{ marginRight: '8px', color: '#6c757d' }}></i>
                                                    Speakers:
                                                </h6>
                                                <Row>
                                                    {session.speakers.map((speaker) => (
                                                        <Col md={6} key={speaker.id} className="mb-2">
                                                            <div className="d-flex align-items-center p-2 rounded" style={{ backgroundColor: '#f8f9fa' }}>
                                                                {speaker.profilePicture ? (
                                                                    <img
                                                                        src={`${API_URL}/${speaker.profilePicture}`}
                                                                        alt={speaker.name}
                                                                        style={{
                                                                            width: '40px',
                                                                            height: '40px',
                                                                            borderRadius: '50%',
                                                                            objectFit: 'cover',
                                                                            marginRight: '12px'
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
                                                                            marginRight: '12px'
                                                                        }}
                                                                    >
                                                                        <i className="fas fa-user" style={{ color: '#6c757d' }}></i>
                                                                    </div>
                                                                )}
                                                                <div style={{ flex: 1 }}>
                                                                    <div style={{ fontWeight: '500', fontSize: '14px' }}>
                                                                        {speaker.name}
                                                                    </div>
                                                                    {speaker.position && (
                                                                        <div style={{ fontSize: '12px', color: '#6c757d' }}>
                                                                            {speaker.position}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </Col>
                                                    ))}
                                                </Row>
                                            </div>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <p className="text-muted mb-0">No sessions available for this track.</p>
                            )}
                        </Card.Body>
                    </Card>
                </div>
            ))}
        </>
    );
};

export default EventProgrammeComponent;

