import React from 'react';
import { Row, Col, Badge, Card } from 'react-bootstrap';
import { ExpandableDescription } from '../ExpandableDescription';

/**
 * EventSurveyComponent - Component to display event survey details with exhibitor-style UI
 * @param {Object} surveyDetails - Survey details object
 * @param {Function} formatTime - Function to format time
 */
const EventSurveyComponent = ({ surveyDetails, formatTime }) => {
    // Early return if surveyDetails is not available
    if (!surveyDetails) {
        return <div className="p-2 bg-light">No survey data available.</div>;
    }

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
            {/* Survey Overview Section */}
            <Col xs={12} className="p-0" style={{ overflow: 'hidden', width: '100%', maxWidth: '100%' }}>
                <h5 className="mb-md-3 mb-3 pb-md-2 pb-2" style={{ 
                    fontSize: '16px', 
                    fontWeight: '600', 
                    color: '#000000',
                    borderBottom: '2px solid #4680ff'
                }}>
                    <i className="fas fa-poll mr-2" style={{ color: '#4680ff' }}></i>
                    Survey Overview
                </h5>
                <Row>
                    <InfoField 
                        label="Survey Title" 
                        value={surveyDetails.title || 'N/A'}
                        icon="fas fa-file-alt"
                        colSize={6}
                    />
                    <InfoField 
                        label="Status" 
                        value={
                            <Badge bg={surveyDetails.isActive ? 'success' : 'secondary'} style={{ fontSize: '12px', padding: '6px 12px', fontWeight: '600' }}>
                                {surveyDetails.isActive ? 'Active' : 'Inactive'}
                                <i
                                    style={{ marginLeft: '4px' }}
                                    className={`fas fa-${surveyDetails.isActive ? 'check-circle' : 'pause-circle'} me-1`}
                                ></i>
                            </Badge>
                        }
                        icon="fas fa-toggle-on"
                        colSize={6}
                    />
                    <InfoField 
                        label="Start Date & Time" 
                        value={
                            <span>
                                {surveyDetails.startDate} <i className="fas fa-clock" style={{ marginLeft: '8px', marginRight: '4px', color: '#6c757d' }}></i>
                                {formatTime(surveyDetails.startTime)}
                            </span>
                        }
                        icon="fas fa-calendar-alt"
                        colSize={6}
                    />
                    <InfoField 
                        label="End Date & Time" 
                        value={
                            <span>
                                {surveyDetails.endDate} <i className="fas fa-clock" style={{ marginLeft: '8px', marginRight: '4px', color: '#6c757d' }}></i>
                                {formatTime(surveyDetails.endTime)}
                            </span>
                        }
                        icon="fas fa-calendar-check"
                        colSize={6}
                    />
                </Row>
            </Col>

            {/* Survey URLs Section */}
            {surveyDetails.surveyUrls?.length > 0 && (
                <Col xs={12} className="mt-md-4 mt-3 p-0" style={{ overflow: 'hidden', width: '100%', maxWidth: '100%' }}>
                    <h5 className="mb-md-3 mb-3 pb-md-2 pb-2" style={{ 
                        fontSize: '16px', 
                        fontWeight: '600', 
                        color: '#000000',
                        borderBottom: '2px solid #4680ff'
                    }}>
                        <i className="fas fa-link mr-2" style={{ color: '#4680ff' }}></i>
                        Survey URLs
                    </h5>
                    <Row>
                        {surveyDetails.surveyUrls.map((urlItem, index) => (
                            <Col xs={12} sm={12} md={6} lg={4} key={index} className="mb-3" style={{ overflow: 'hidden' }}>
                                {/* Survey Group Container */}
                                <div style={{ 
                                    border: '1px solid #e9ecef',
                                    borderRadius: '4px',
                                    padding: '12px',
                                    backgroundColor: '#fafafa',
                                    marginBottom: '8px'
                                }}>
                                    {/* Survey Number Header */}
                                    <div style={{ 
                                        fontSize: '14px', 
                                        fontWeight: '600', 
                                        color: '#4680ff',
                                        marginBottom: '12px',
                                        paddingBottom: '8px',
                                        borderBottom: '1px solid #e9ecef'
                                    }}>
                                        <i className="fas fa-hashtag mr-2"></i>
                                        Survey {index + 1}
                                    </div>

                                    {/* Survey Title */}
                                    <div style={{ 
                                        padding: '8px 12px',
                                        borderBottom: '1px solid #e9ecef',
                                        borderLeft: '4px solid #4680ff',
                                        backgroundColor: '#FFFFFF',
                                        borderRadius: '4px',
                                        width: '100%',
                                        maxWidth: '100%',
                                        boxSizing: 'border-box',
                                        marginBottom: '8px'
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
                                                <span>Survey Title:</span>
                                            </div>
                                            <div style={{ 
                                                fontSize: '14px', 
                                                color: '#000000',
                                                fontWeight: '500',
                                                wordBreak: 'break-word',
                                                overflowWrap: 'break-word',
                                                width: '100%',
                                                lineHeight: '1.5'
                                            }}>
                                                {urlItem.title || 'N/A'}
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
                                                <span style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>Survey Title:</span>
                                            </div>
                                            <div style={{ 
                                                fontSize: '14px', 
                                                color: '#000000',
                                                fontWeight: '500',
                                                flex: 1,
                                                minWidth: 0,
                                                wordBreak: 'break-word',
                                                overflowWrap: 'break-word',
                                                overflow: 'hidden'
                                            }}>
                                                {urlItem.title || 'N/A'}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Survey URL */}
                                    <div style={{ 
                                        padding: '8px 12px',
                                        borderBottom: '1px solid #e9ecef',
                                        borderLeft: '4px solid #ffc107',
                                        backgroundColor: '#fffbf0',
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
                                                <span>Survey URL:</span>
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
                                                <a 
                                                    href={urlItem.url} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    style={{ 
                                                        color: '#007bff', 
                                                        textDecoration: 'none',
                                                        wordBreak: 'break-all'
                                                    }}
                                                >
                                                    <i className="fas fa-external-link-alt me-2"></i>
                                                    {urlItem.url}
                                                </a>
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
                                                <span style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>Survey URL:</span>
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
                                                <a 
                                                    href={urlItem.url} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    style={{ 
                                                        color: '#007bff', 
                                                        textDecoration: 'none',
                                                        wordBreak: 'break-all'
                                                    }}
                                                >
                                                    <i className="fas fa-external-link-alt me-2"></i>
                                                    {urlItem.url}
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Col>
                        ))}
                    </Row>
                </Col>
            )}

            {/* Survey Sessions Section */}
            {surveyDetails.sessions?.length > 0 && (
                <Col xs={12} className="mt-md-4 mt-3 p-0" style={{ overflow: 'hidden', width: '100%', maxWidth: '100%' }}>
                    <h5 className="mb-md-3 mb-3 pb-md-2 pb-2" style={{ 
                        fontSize: '16px', 
                        fontWeight: '600', 
                        color: '#000000',
                        borderBottom: '2px solid #4680ff'
                    }}>
                        <i className="fas fa-calendar-day mr-2" style={{ color: '#4680ff' }}></i>
                        Survey Sessions
                    </h5>
                    <Row>
                        {surveyDetails.sessions.map((session, index) => (
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
                                                {session.date || 'N/A'} {formatTime(session.startTime) && formatTime(session.endTime) ? `| ${formatTime(session.startTime)} - ${formatTime(session.endTime)}` : ''}
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
                                                {session.date || 'N/A'} {formatTime(session.startTime) && formatTime(session.endTime) ? `| ${formatTime(session.startTime)} - ${formatTime(session.endTime)}` : ''}
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
            )}
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

export default EventSurveyComponent;