import React from 'react';
import { Badge, Row, Col, Card } from 'react-bootstrap';
import { ExpandableDescription } from '../ExpandableDescription';

/**
 * SurveySessionsComponent - Component to display survey sessions with exhibitor-style UI
 * @param {Array} sessions - Array of survey sessions
 * @param {Function} formatTime - Function to format time
 */
const SurveySessionsComponent = ({ sessions, formatTime }) => {
    // Early return if sessions are not available
    if (!sessions || sessions.length === 0) {
        return <div className="p-2 bg-light">No sessions found for this survey.</div>;
    }

    const content = (
        <Row className="m-0" style={{ width: '100%', maxWidth: '100%' }}>
            {/* Survey Sessions Section */}
            <Col xs={12} className="p-0" style={{ overflow: 'hidden', width: '100%', maxWidth: '100%' }}>
                <h5 className="mb-md-3 mb-3 pb-md-2 pb-2" style={{ 
                    fontSize: '16px', 
                    fontWeight: '600', 
                    color: '#000000',
                    borderBottom: '2px solid #4680ff'
                }}>
                    <i className="fas fa-calendar-day mr-2" style={{ color: '#4680ff' }}></i>
                    Survey Sessions ({sessions.length})
                </h5>
                <Row>
                    {sessions.map((session, index) => (
                        <Col xs={12} sm={12} md={6} key={session.id} className="mb-3" style={{ overflow: 'hidden' }}>
                            <div style={{ 
                                padding: '12px',
                                borderBottom: '1px solid #e9ecef',
                                borderLeft: '4px solid #4680ff',
                                backgroundColor: '#f0f4ff',
                                borderRadius: '4px',
                                width: '100%',
                                maxWidth: '100%',
                                boxSizing: 'border-box'
                            }}
                            className="px-md-3 px-2 py-md-2 py-2"
                            >
                                {/* Session Name */}
                                <div className="mb-2" style={{ borderBottom: '1px solid #e9ecef', paddingBottom: '8px' }}>
                                    <div className="d-block d-md-none">
                                        <div style={{ 
                                            fontSize: '13px', 
                                            fontWeight: '600', 
                                            color: '#4680ff',
                                            marginBottom: '4px'
                                        }}>
                                            <span>Session {index + 1}:</span>
                                        </div>
                                        <div style={{ 
                                            fontSize: '14px', 
                                            color: '#000000',
                                            fontWeight: '500'
                                        }}>
                                            {session.name || 'N/A'}
                                        </div>
                                    </div>
                                    <div className="d-none d-md-flex align-items-start">
                                        <div style={{ 
                                            minWidth: '120px',
                                            fontSize: '13px', 
                                            fontWeight: '600', 
                                            color: '#4680ff',
                                            marginRight: '12px'
                                        }}>
                                            <span>Session {index + 1}:</span>
                                        </div>
                                        <div style={{ 
                                            fontSize: '14px', 
                                            color: '#000000',
                                            fontWeight: '500',
                                            flex: 1
                                        }}>
                                            {session.name || 'N/A'}
                                        </div>
                                    </div>
                                </div>

                                {/* Session Date and Time - Combined in one line */}
                                <div className="mb-2" style={{ borderBottom: '1px solid #e9ecef', paddingBottom: '8px' }}>
                                    <div className="d-block d-md-none">
                                        <div style={{ fontSize: '13px', fontWeight: '600', color: '#4680ff', marginBottom: '4px' }}>
                                            <span>Date & Time:</span>
                                        </div>
                                        <div style={{ fontSize: '14px', color: '#000000' }}>
                                            {new Date(session.date).toLocaleDateString()} {formatTime(session.startTime) && formatTime(session.endTime) ? `| ${formatTime(session.startTime)} - ${formatTime(session.endTime)}` : ''}
                                        </div>
                                    </div>
                                    <div className="d-none d-md-flex align-items-start">
                                        <div style={{ 
                                            minWidth: '120px',
                                            fontSize: '13px', 
                                            fontWeight: '600', 
                                            color: '#4680ff',
                                            marginRight: '12px'
                                        }}>
                                            <span>Date & Time:</span>
                                        </div>
                                        <div style={{ 
                                            fontSize: '14px', 
                                            color: '#000000',
                                            flex: 1
                                        }}>
                                            {new Date(session.date).toLocaleDateString()} {formatTime(session.startTime) && formatTime(session.endTime) ? `| ${formatTime(session.startTime)} - ${formatTime(session.endTime)}` : ''}
                                        </div>
                                    </div>
                                </div>

                                {/* Session Status */}
                                <div className="mb-2">
                                    <div className="d-block d-md-none">
                                        <div style={{ fontSize: '13px', fontWeight: '600', color: '#4680ff', marginBottom: '4px' }}>
                                            <span>Status:</span>
                                        </div>
                                        <div>
                                            <Badge bg={session.isActive ? 'success' : 'secondary'} style={{ fontSize: '12px', padding: '6px 12px', fontWeight: '600' }}>
                                                {session.isActive ? 'Active' : 'Inactive'}
                                                <i
                                                    style={{ marginLeft: '4px' }}
                                                    className={`fas fa-${session.isActive ? 'check-circle' : 'pause-circle'} me-1`}
                                                ></i>
                                            </Badge>
                                        </div>
                                    </div>
                                    <div className="d-none d-md-flex align-items-start">
                                        <div style={{ 
                                            minWidth: '120px',
                                            fontSize: '13px', 
                                            fontWeight: '600', 
                                            color: '#4680ff',
                                            marginRight: '12px'
                                        }}>
                                            <span>Status:</span>
                                        </div>
                                        <div>
                                            <Badge bg={session.isActive ? 'success' : 'secondary'} style={{ fontSize: '12px', padding: '6px 12px', fontWeight: '600' }}>
                                                {session.isActive ? 'Active' : 'Inactive'}
                                                <i
                                                    style={{ marginLeft: '4px' }}
                                                    className={`fas fa-${session.isActive ? 'check-circle' : 'pause-circle'} me-1`}
                                                ></i>
                                            </Badge>
                                        </div>
                                    </div>
                                </div>

                                {/* Session Description - Last */}
                                {session.description && (
                                    <div>
                                        <div className="d-block d-md-none">
                                            <div style={{ 
                                                fontSize: '13px', 
                                                fontWeight: '600', 
                                                color: '#4680ff',
                                                marginBottom: '4px'
                                            }}>
                                                <span>Description:</span>
                                            </div>
                                            <div style={{ 
                                                fontSize: '14px', 
                                                color: '#000000',
                                                fontWeight: '400'
                                            }}>
                                                <ExpandableDescription text={session.description} maxLines={2} />
                                            </div>
                                        </div>
                                        <div className="d-none d-md-flex align-items-start">
                                            <div style={{ 
                                                minWidth: '120px',
                                                fontSize: '13px', 
                                                fontWeight: '600', 
                                                color: '#4680ff',
                                                marginRight: '12px'
                                            }}>
                                                <span>Description:</span>
                                            </div>
                                            <div style={{ 
                                                fontSize: '14px', 
                                                color: '#000000',
                                                fontWeight: '400',
                                                flex: 1
                                            }}>
                                                <ExpandableDescription text={session.description} maxLines={2} />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </Col>
                    ))}
                </Row>
            </Col>
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
            {/* Mobile: No card wrapper, minimal padding */}
            <div className="d-block d-md-none px-2 py-2">
                {content}
            </div>
        </div>
    );
};

export default SurveySessionsComponent;
