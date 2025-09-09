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
    const renderSpeakerCard = (speaker) => (
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
                                    alt={speaker.name}
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        borderRadius: '50%',
                                        objectFit: 'cover'
                                    }}
                                />
                            ) : (
                                <span style={{ fontSize: '28px', fontWeight: 'bold' }}>
                                    {speaker.name?.charAt(0) || 'S'}
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
                        {speaker.name}
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
                                <p className="text-muted fs-6 mb-0" style={{ 
                                    lineHeight: '1.5',
                                    display: '-webkit-box',
                                    WebkitLineClamp: '1',
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    wordBreak: 'break-word',
                                    overflowWrap: 'break-word'
                                }}>
                                    {speaker.description || 'Experienced professional speaker with expertise in various topics. Known for delivering engaging presentations and sharing valuable insights with diverse audiences.'}
                                </p>
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

    return (
        <div className="speakers-section p-md-2">
            <div className="row g-4">
                {speakers.map(renderSpeakerCard)}
            </div>
        </div>
    );
};

export default EventSpeakersComponent;