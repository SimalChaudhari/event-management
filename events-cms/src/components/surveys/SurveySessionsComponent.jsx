import React from 'react';
import { Badge, Row, Col } from 'react-bootstrap';

/**
 * SurveySessionsComponent - Component to display survey sessions in card format
 * @param {Array} sessions - Array of survey sessions
 * @param {Function} formatTime - Function to format time
 */
const SurveySessionsComponent = ({ sessions, formatTime }) => {
    // Get colorful icons based on icon class
    const getIconColor = (iconClass) => {
        const colorMap = {
            'fas fa-list-alt': '#6f42c1', // Purple for sessions
            'fas fa-file-alt': '#007bff', // Blue for file
            'fas fa-sticky-note': '#6c757d', // Gray for text
            'fas fa-calendar-day': '#28a745', // Green for date
            'fas fa-clock': '#dc3545', // Red for clock
            'fas fa-toggle-on': '#28a745', // Green for active
            'fas fa-hashtag': '#6f42c1', // Purple for sessions
            'fas fa-info-circle': '#17a2b8' // Teal for info
        };
        return colorMap[iconClass] || '#495057';
    };

    // InfoCard component for consistent styling similar to exhibitor view
    const InfoCard = ({ title, iconClass, children, borderColor = '#4680ff', className = '' }) => (
        <div
            className={`mb-4 ${className}`}
            style={{
                backgroundColor: '#fff',
                borderRadius: '8px',
                padding: '20px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                border: '1px solid #e9ecef',
                borderLeft: `4px solid ${borderColor}`
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
                        borderBottom: `2px solid ${borderColor}`,
                        paddingBottom: '8px',
                        position: 'relative'
                    }}
                >
                    <i className={iconClass} style={{ fontSize: '20px', color: getIconColor(iconClass) }}></i>
                    {title}
                </h5>
                {children}
            </div>
        </div>
    );

    // Check if sessions are available
    if (!sessions || sessions.length === 0) {
        return (
            <div className="p-2 bg-light">
                <InfoCard title="Survey Sessions" iconClass="fas fa-list-alt" borderColor="#6f42c1">
                    <div className="text-center py-4">
                        <i className="fas fa-list-alt fa-2x text-muted mb-2"></i>
                        <p className="text-muted">No sessions found for this survey.</p>
                    </div>
                </InfoCard>
            </div>
        );
    }

    // Format session status
    const formatSessionStatus = (session) => {
        const sessionDate = new Date(session.date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (sessionDate < today) {
            return { variant: 'secondary', text: 'Completed' };
        } else if (sessionDate.getTime() === today.getTime()) {
            return { variant: 'success', text: 'Today' };
        } else {
            return { variant: 'info', text: 'Upcoming' };
        }
    };

    // Render individual session card
    const renderSessionCard = (session, index) => {
        const sessionStatus = formatSessionStatus(session);
        
        // Dynamic column sizing based on number of sessions
        const getColumnSize = () => {
            if (sessions.length === 1) {
                return { md: 12, lg: 12 }; // Full width for single session
            } else if (sessions.length === 2) {
                return { md: 6, lg: 6 }; // Two columns for two sessions
            } else {
                return { md: 6, lg: 4 }; // Three columns for three or more sessions
            }
        };
        
        const columnSize = getColumnSize();
        
        return (
            <Col md={columnSize.md} lg={columnSize.lg} key={session.id} className="mb-4">
                <div className="card border-0 shadow-sm h-100">
                    <div className="card-header bg-light d-flex justify-content-between align-items-center">
                        <h6 className="mb-0 fw-bold">
                            <i className="fas fa-hashtag me-2 text-primary"></i>
                            Session {index + 1}
                        </h6>
                        <Badge bg={sessionStatus.variant} className="px-2 py-1">
                            {sessionStatus.text}
                        </Badge>
                    </div>
                    <div className="card-body">
                        {/* Session Name */}
                        <div className="info-field-container mb-3 py-2" style={{ borderBottom: '1px solid #f1f1f1' }}>
                            <span className="field-label" style={{ fontWeight: 'bold', color: '#495057', fontSize: '14px' }}>
                                <i className="fas fa-file-alt" style={{ marginRight: '8px', color: '#007bff' }}></i>
                                Name:
                            </span>
                            <span className="field-value" style={{ color: '#212529', fontWeight: 'normal', fontSize: '15px' }}>
                                {session.name}
                            </span>
                        </div>

                        {/* Session Description */}
                        <div className="info-field-container mb-3 py-2" style={{ borderBottom: '1px solid #f1f1f1' }}>
                            <span className="field-label" style={{ fontWeight: 'bold', color: '#495057', fontSize: '14px' }}>
                                <i className="fas fa-sticky-note" style={{ marginRight: '8px', color: '#6c757d' }}></i>
                                Description:
                            </span>
                            <span className="field-value" style={{ color: '#212529', fontWeight: 'normal', fontSize: '15px' }}>
                                {session.description || 'No description'}
                            </span>
                        </div>

                        {/* Session Date */}
                        <div className="info-field-container mb-3 py-2" style={{ borderBottom: '1px solid #f1f1f1' }}>
                            <span className="field-label" style={{ fontWeight: 'bold', color: '#495057', fontSize: '14px' }}>
                                <i className="fas fa-calendar-day" style={{ marginRight: '8px', color: '#28a745' }}></i>
                                Date:
                            </span>
                            <span className="field-value" style={{ color: '#212529', fontWeight: 'normal', fontSize: '15px' }}>
                                {new Date(session.date).toLocaleDateString()}
                            </span>
                        </div>

                        {/* Session Time */}
                        <div className="info-field-container mb-3 py-2" style={{ borderBottom: '1px solid #f1f1f1' }}>
                            <span className="field-label" style={{ fontWeight: 'bold', color: '#495057', fontSize: '14px' }}>
                                <i className="fas fa-clock" style={{ marginRight: '8px', color: '#dc3545' }}></i>
                                Time:
                            </span>
                            <span className="field-value" style={{ color: '#212529', fontWeight: 'normal', fontSize: '15px' }}>
                                {formatTime(session.startTime)} - {formatTime(session.endTime)}
                            </span>
                        </div>

                        {/* Session Active Status */}
                        <div className="info-field-container py-2">
                            <span className="field-label" style={{ fontWeight: 'bold', color: '#495057', fontSize: '14px' }}>
                                <i className="fas fa-toggle-on" style={{ marginRight: '8px', color: '#28a745' }}></i>
                                Active:
                            </span>
                            <span className="field-value" style={{ color: '#212529', fontWeight: 'normal', fontSize: '15px' }}>
                                <Badge bg={session.isActive ? 'success' : 'danger'} className="px-3 py-1">
                                    <i className={`fas fa-${session.isActive ? 'check-circle' : 'pause-circle'} me-1`}></i>
                                    {session.isActive ? 'Active' : 'Inactive'}
                                </Badge>
                            </span>
                        </div>
                    </div>
                </div>
            </Col>
        );
    };

    return (
        <div className="p-2 bg-light">
            <InfoCard title={`Survey Sessions (${sessions.length})`} iconClass="fas fa-list-alt" borderColor="#6f42c1">
                <div className="sessions-section">
                  
                    
                    <Row>
                        {sessions.map((session, index) => renderSessionCard(session, index))}
                    </Row>
                </div>
            </InfoCard>

            <style jsx>{`
                .info-field-container {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .field-label {
                    min-width: 100px;
                    font-size: 13px;
                }

                .field-value {
                    text-align: right;
                    flex: 1;
                    font-size: 14px;
                }

                /* Responsive session layout */
                .sessions-section .row {
                    margin: 0 -10px;
                }

                .sessions-section .col {
                    padding: 0 10px;
                }

                /* Single session - full width */
                .sessions-section .col-md-12 {
                    max-width: 100%;
                    flex: 0 0 100%;
                }

                /* Two sessions - side by side */
                .sessions-section .col-md-6 {
                    max-width: 50%;
                    flex: 0 0 50%;
                }

                /* Three or more sessions - grid layout */
                .sessions-section .col-lg-4 {
                    max-width: 33.333333%;
                    flex: 0 0 33.333333%;
                }

                /* Mobile: stacked layout */
                @media (max-width: 768px) {
                    .info-field-container {
                        display: block !important;
                        text-align: left !important;
                    }

                    .field-label {
                        min-width: auto !important;
                        display: block;
                        margin-bottom: 4px;
                    }

                    .field-value {
                        text-align: left !important;
                    }

                    /* Force single column on mobile */
                    .sessions-section .col-md-6,
                    .sessions-section .col-lg-4 {
                        max-width: 100% !important;
                        flex: 0 0 100% !important;
                    }
                }

                /* Tablet: two columns for 2+ sessions */
                @media (min-width: 769px) and (max-width: 991px) {
                    .sessions-section .col-lg-4 {
                        max-width: 50%;
                        flex: 0 0 50%;
                    }
                }
            `}</style>
        </div>
    );
};

export default SurveySessionsComponent;
