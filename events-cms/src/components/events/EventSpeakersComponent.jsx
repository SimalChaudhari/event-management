import React from 'react';
import { API_URL, DUMMY_PATH_USER } from '../../configs/env';
import { useNavigate } from 'react-router-dom';
import { SPEAKER_PATHS } from '../../utils/constants';

/**
 * EventSpeakersComponent - Component to display event speakers information
 * @param {Array} speakers - Array of speaker objects
 * @param {Function} handleSpeakerImageClick - Function to handle speaker image click
 */
const EventSpeakersComponent = ({ speakers, handleSpeakerImageClick }) => {
 
    const navigate = useNavigate();
    // Check if speakers data exists
    if (!speakers?.length) {
        return (
            <div className="text-center py-4">
                <i className="fas fa-store fa-2x text-muted mb-2"></i>
                <p className="text-muted">No speakers available.</p>
            </div>
        );
    }

    const handleClick = (speaker) => {
        navigate(`${SPEAKER_PATHS.VIEW_SPEAKER}/${speaker}`);
    };

    // Render individual speaker card
    const formatSessionDate = (dateString) => {
        if (!dateString) {
            return '';
        }
        const parsed = new Date(dateString);
        if (Number.isNaN(parsed.getTime())) {
            return dateString;
        }
        return parsed.toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const renderSpeakerCard = (speaker) => {
        const hasSpeakingSessions = Array.isArray(speaker.speakingSessions) && speaker.speakingSessions.length > 0;

        return (
        <div key={speaker.id} className="col-12 col-sm-6 col-md-6 col-lg-4 mb-4">
            <div className="speaker-card h-100" style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                transition: 'all 0.3s ease',
                border: '1px solid #e9ecef',
                overflow: 'hidden'
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.15)';
                e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                e.currentTarget.style.transform = 'translateY(0)';
            }}>
                
                {/* Profile Header Card */}
                <div className="profile-header" style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    padding: '20px',
                    textAlign: 'center',
                    color: 'white'
                }}>
                    <div 
                        className="profile-image mb-3" 
                        onClick={() => handleSpeakerImageClick(speaker.profilePicture)}
                        style={{ cursor: 'pointer' }}
                    >
                        <div style={{
                            width: '80px',
                            height: '80px',
                            borderRadius: '50%',
                            background: 'rgba(255,255,255,0.2)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto',
                            border: '3px solid rgba(255,255,255,0.3)'
                        }}>
                            {speaker.profilePicture ? (
                                <img
                                    src={`${API_URL}/${speaker.profilePicture}`}
                                    alt={`${speaker.firstName} ${speaker.lastName}`}
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        borderRadius: '50%',
                                        objectFit: 'cover'
                                    }}
                                />
                            ) : (
                                <span style={{ fontSize: '28px', fontWeight: 'bold' }}>
                                    {speaker.firstName?.charAt(0) || 'S'}
                                </span>
                            )}
                        </div>
                    </div>
                    
                    {/* Name - Large and Bold */}
                    <h5 className="speaker-name mb-2" style={{ 
                        fontSize: '20px', 
                        fontWeight: 'bold',
                        margin: '0',
                        lineHeight: '1.2'
                    }}>
                        {`${speaker.firstName} ${speaker.lastName}`}
                    </h5>
                    
                    {/* Label Box */}
                    <div className="label-box" style={{
                        backgroundColor: 'rgba(255,255,255,0.2)',
                        borderRadius: '16px',
                        padding: '6px 12px',
                        display: 'inline-block',
                        border: '1px solid rgba(255,255,255,0.3)'
                    }}>
                        <span style={{ 
                            fontSize: '12px', 
                            fontWeight: '500',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <span style={{ marginRight: '4px' }}>☆</span>
                            {speaker.position}
                        </span>
                    </div>
                </div>

                {/* Card Content */}
                <div className="card-content p-md-2">
                    {/* Information Sections with Labels */}
                    <div className="speaker-info mb-3 mt-2">
                        {/* Email */}
                        {speaker.email && (
                            <div className="mb-3">
                                <div className="d-flex align-items-center mb-1">
                                    <i className="fas fa-envelope text-primary" style={{ marginRight: '8px', flexShrink: 0 }}></i>
                                    <span className="fw-bold text-dark fs-6" style={{ flexShrink: 0 }}>Email:</span>
                                </div>
                                <div style={{ marginLeft: '24px', wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                                    <span className="text-muted fs-6" style={{ 
                                        display: 'block',
                                        wordBreak: 'break-all',
                                        overflowWrap: 'break-word'
                                    }}>
                                        {speaker.email}
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Mobile */}
                        {speaker.mobile && (
                            <div className="mb-3">
                                <div className="d-flex align-items-center mb-1">
                                    <i className="fas fa-mobile-alt text-primary" style={{ marginRight: '8px', flexShrink: 0 }}></i>
                                    <span className="fw-bold text-dark fs-6" style={{ flexShrink: 0 }}>Contact:</span>
                                </div>
                                <div style={{ marginLeft: '24px', wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                                    <span className="text-muted fs-6" style={{ 
                                        display: 'block',
                                        wordBreak: 'break-all',
                                        overflowWrap: 'break-word'
                                    }}>
                                        {speaker.mobile}
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Location */}
                        {speaker.location && (
                            <div className="mb-3">
                                <div className="d-flex align-items-center mb-1">
                                    <i className="fas fa-map-marker-alt text-primary" style={{ marginRight: '8px', flexShrink: 0 }}></i>
                                    <span className="fw-bold text-dark fs-6" style={{ flexShrink: 0 }}>Location:</span>
                                </div>
                                <div style={{ marginLeft: '24px', wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                                    <span className="text-muted fs-6" style={{ 
                                        display: 'block',
                                        wordBreak: 'break-all',
                                        overflowWrap: 'break-word'
                                    }}>
                                        {speaker.location}
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Speaking Time */}
                        {(speaker.speakingStartTime || speaker.speakingEndTime || hasSpeakingSessions) && (
                            <div className="mb-3">
                                <div className="d-flex align-items-center mb-2">
                                    <i className="fas fa-clock text-primary" style={{ marginRight: '8px', flexShrink: 0 }}></i>
                                    <span className="fw-bold text-dark fs-6" style={{ flexShrink: 0 }}>
                                        {hasSpeakingSessions ? 'Speaking Schedule:' : 'Speaking Time:'}
                                    </span>
                                </div>
                                {hasSpeakingSessions ? (
                                    <div style={{ marginLeft: '24px', display: 'grid', gap: '8px' }}>
                                        {speaker.speakingSessions.map((session, index) => (
                                            <div
                                                key={`${session.sessionId || index}`}
                                                className="border rounded px-3 py-2 bg-light"
                                                style={{ fontSize: '13px', lineHeight: 1.4 }}
                                            >
                                                <div className="d-flex justify-content-between flex-wrap">
                                                    <span className="text-dark fw-semibold">
                                                        {session.sessionTitle || 'Session'}
                                                    </span>
                                                    {(session.startTime || session.endTime) && (
                                                        <span className="text-muted">
                                                            {session.startTime ? session.startTime : '--'}
                                                            {(session.startTime || session.endTime) && ' – '}
                                                            {session.endTime ? session.endTime : '--'}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-muted">
                                                    {formatSessionDate(session.sessionDate)}
                                                    {session.trackTitle ? ` · ${session.trackTitle}` : ''}
                                                </div>
                                                {session.venue && (
                                                    <div className="text-muted">
                                                        Venue: {session.venue}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div style={{ marginLeft: '24px' }}>
                                        <div className="d-flex align-items-center flex-wrap gap-2">
                                            {speaker.speakingStartTime && (
                                                <div className="badge bg-light text-dark border" style={{ 
                                                    fontSize: '13px',
                                                    fontWeight: '500',
                                                    padding: '6px 12px',
                                                    borderRadius: '8px'
                                                }}>
                                                    <i className="fas fa-play-circle text-success me-1"></i>
                                                    {speaker.speakingStartTime}
                                                </div>
                                            )}
                                            {speaker.speakingStartTime && speaker.speakingEndTime && (
                                                <span className="text-muted">→</span>
                                            )}
                                            {speaker.speakingEndTime && (
                                                <div className="badge bg-light text-dark border" style={{ 
                                                    fontSize: '13px',
                                                    fontWeight: '500',
                                                    padding: '6px 12px',
                                                    borderRadius: '8px'
                                                }}>
                                                    <i className="fas fa-stop-circle text-danger me-1"></i>
                                                    {speaker.speakingEndTime}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Description Section with View More Button */}
                    <div className="mt-auto pt-3" style={{ borderTop: '1px solid #e9ecef' }}>
                        {/* Description first - limited to 2 lines */}
                        <div className="mb-3">
                            <div className="d-flex align-items-center mb-1">
                                <i className="fas fa-info-circle text-primary" style={{ marginRight: '8px' }}></i>
                                <span className="fw-bold text-dark fs-6">Description:</span>
                            </div>
                            <div style={{ marginLeft: '24px' }}>
                                <div 
                                    className="text-muted fs-6 mb-0" 
                                    style={{ 
                                        lineHeight: '1.5',
                                        display: '-webkit-box',
                                        WebkitLineClamp: '1',
                                        WebkitBoxOrient: 'vertical',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        wordBreak: 'break-word',
                                        overflowWrap: 'break-word'
                                    }}
                                    dangerouslySetInnerHTML={{ 
                                        __html: speaker.description || 'No description available' 
                                    }}
                                />
                            </div>
                        </div>
                        
                        {/* Button on next line */}
                        <div className="d-flex justify-content-end">
                            <button 
                                className="btn btn-outline-primary btn-sm"
                                onClick={() => handleClick(speaker.id)}
                                style={{
                                    borderRadius: '20px',
                                    fontSize: '12px',
                                    padding: '6px 16px',
                                    fontWeight: '500',
                                    whiteSpace: 'nowrap',
                                    minWidth: 'fit-content'
                                    
                                }}
                            >
                                <i className="fas fa-external-link-alt me-1"></i>
                                View More
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
    };

    // Sort speakers alphabetically by name
    const sortedSpeakers = [...speakers].sort((a, b) => {
        const nameA = `${a.firstName} ${a.lastName}`.toLowerCase();
        const nameB = `${b.firstName} ${b.lastName}`.toLowerCase();
        return nameA.localeCompare(nameB);
    });

    return (
        <div className="speakers-section p-md-2">
            <div className="row g-4">
                {sortedSpeakers.map(renderSpeakerCard)}
            </div>
        </div>
    );
};

export default EventSpeakersComponent;