import React from 'react';
import { Row, Col, Badge, Card } from 'react-bootstrap';
import DateTimeFormatter from '../dateTime/DateTimeFormatter';
import { ExpandableDescription } from '../ExpandableDescription';

/**
 * SurveyBasicComponent - Component to display basic survey details with exhibitor-style UI
 * @param {Object} surveyData - Survey data object
 */
const SurveyBasicComponent = ({ surveyData }) => {
    // Early return if surveyData is not available
    if (!surveyData) {
        return <div className="p-2 bg-light">No survey data available.</div>;
    }

    // Format timestamp to readable date
    const formatTimestamp = (timestamp) => {
        if (!timestamp) return 'N/A';
        const date = new Date(timestamp);
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
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

    // Format survey status
    const formatSurveyStatus = (survey) => {
        const startDate = new Date(survey.startDate);
        const endDate = new Date(survey.endDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (endDate < today) {
            return { variant: 'secondary', text: 'Completed' };
        } else if (startDate <= today && endDate >= today) {
            return { variant: 'success', text: 'Active' };
        } else {
            return { variant: 'warning', text: 'Upcoming' };
        }
    };

    const surveyStatus = formatSurveyStatus(surveyData);

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
                        value={surveyData.title || 'N/A'}
                        icon="fas fa-poll"
                        colSize={6}
                    />
                    <InfoField 
                        label="Status" 
                        value={
                            <Badge bg={surveyStatus.variant} style={{ fontSize: '12px', padding: '6px 12px', fontWeight: '600' }}>
                                {surveyStatus.text}
                                <i
                                    style={{ marginLeft: '4px' }}
                                    className={`fas fa-${surveyData.isActive ? 'check-circle' : 'pause-circle'} me-1`}
                                ></i>
                            </Badge>
                        }
                        icon="fas fa-toggle-on"
                        colSize={6}
                    />
                    <InfoField 
                        label="Active Status" 
                        value={
                            <Badge bg={surveyData.isActive ? 'success' : 'danger'} style={{ fontSize: '12px', padding: '6px 12px', fontWeight: '600' }}>
                                {surveyData.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                        }
                        icon="fas fa-toggle-on"
                        colSize={6}
                    />
                    <InfoField 
                        label="Sessions Count" 
                        value={surveyData.sessions ? surveyData.sessions.length : 0}
                        icon="fas fa-list"
                        colSize={6}
                    />
                    <InfoField 
                        label="Start Date & Time" 
                        value={<DateTimeFormatter date={surveyData.startDate} time={surveyData.startTime} />}
                        icon="fas fa-clock"
                        colSize={6}
                    />
                    <InfoField 
                        label="End Date & Time" 
                        value={<DateTimeFormatter date={surveyData.endDate} time={surveyData.endTime} />}
                        icon="fas fa-calendar-check"
                        colSize={6}
                    />
                    <InfoField
                        label="Created At"
                        value={<span style={{ color: '#6c757d', fontSize: '13px' }}>{formatTimestamp(surveyData.createdAt)}</span>}
                        icon="fas fa-calendar-plus"
                        colSize={6}
                    />
                    <InfoField
                        label="Last Updated"
                        value={<span style={{ color: '#6c757d', fontSize: '13px' }}>{formatTimestamp(surveyData.updatedAt)}</span>}
                        icon="fas fa-edit"
                        colSize={6}
                    />
                    {surveyData?.description && (
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
                                        <span>Survey Description:</span>
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
                                        <ExpandableDescription text={surveyData.description} maxLines={2} />
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
                                        <span style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>Survey Description:</span>
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
                                        <ExpandableDescription text={surveyData.description} maxLines={2} />
                                    </div>
                                </div>
                            </div>
                        </Col>
                    )}
                </Row>
            </Col>

            {/* Survey URLs Section */}
            {surveyData.surveyUrls && Array.isArray(surveyData.surveyUrls) && surveyData.surveyUrls.length > 0 && (
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
                        {surveyData.surveyUrls.map((urlItem, index) => (
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
                                        backgroundColor: '#f0f4ff',
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

            {/* Event Information Section */}
            {surveyData.eventInfo && (
                <Col xs={12} className="mt-md-4 mt-3 p-0" style={{ overflow: 'hidden', width: '100%', maxWidth: '100%' }}>
                    <h5 className="mb-md-3 mb-3 pb-md-2 pb-2" style={{ 
                        fontSize: '16px', 
                        fontWeight: '600', 
                        color: '#000000',
                        borderBottom: '2px solid #4680ff'
                    }}>
                        <i className="fas fa-calendar-alt mr-2" style={{ color: '#4680ff' }}></i>
                        Event Information
                    </h5>
                    <Row>
                        <InfoField 
                            label="Event Name" 
                            value={surveyData.eventInfo?.name || 'N/A'}
                            icon="fas fa-calendar-alt"
                            colSize={6}
                        />
                        <InfoField 
                            label="Event Location" 
                            value={surveyData.eventInfo?.location || 'No location'}
                            icon="fas fa-map-marker-alt"
                            colSize={6}
                        />
                        <InfoField 
                            label="Event Price" 
                            value={
                                <span style={{ color: '#28a745', fontWeight: 'bold', fontSize: '14px' }}>
                                    {surveyData.eventInfo?.isEarlyBirdActive && surveyData.eventInfo?.earlyBirdPrice != null && surveyData.eventInfo?.earlyBirdPrice !== ''
                                        ? (
                                            <>
                                                <span>{Number(surveyData.eventInfo.earlyBirdPrice).toFixed(2)} {surveyData.eventInfo.currency || 'USD'}</span>
                                                {surveyData.eventInfo?.price != null && surveyData.eventInfo?.price !== '' && (
                                                    <span style={{ textDecoration: 'line-through', color: '#6c757d', fontWeight: 'normal', marginLeft: '8px' }}>
                                                        {Number(surveyData.eventInfo.price).toFixed(2)} {surveyData.eventInfo.currency || 'USD'}
                                                    </span>
                                                )}
                                            </>
                                        )
                                        : (surveyData.eventInfo?.price ? `${surveyData.eventInfo.price} ${surveyData.eventInfo.currency || 'USD'}` : 'N/A')
                                    }
                                </span>
                            }
                            icon="fas fa-dollar-sign"
                            colSize={6}
                        />
                        <InfoField 
                            label="Event Type" 
                            value={
                                <Badge bg="secondary" style={{ fontSize: '12px', padding: '6px 12px', fontWeight: '600' }}>
                                    {surveyData.eventInfo?.type || 'N/A'}
                                </Badge>
                            }
                            icon="fas fa-tag"
                            colSize={6}
                        />
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

export default SurveyBasicComponent;
