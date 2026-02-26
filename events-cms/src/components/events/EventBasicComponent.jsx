import React from 'react';
import { Row, Col, Badge, Card } from 'react-bootstrap';
import DateTimeFormatter from '../dateTime/DateTimeFormatter';
import { ExpandableDescription } from '../ExpandableDescription';
import EventStampsComponent from './EventStampsComponent';
import { API_URL } from '../../configs/env';

/**
 * EventBasicComponent - Component to display basic event details with exhibitor-style UI
 * @param {Object} eventData - Event data object
 */
const EventBasicComponent = ({ eventData }) => {
    // Early return if eventData is not available
    if (!eventData) {
        return <div className="p-2 bg-light">No event data available.</div>;
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

    // InfoField component matching speaker view pattern - responsive design
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


    // Simple getImageSrc for stamp images (user-side view)
    const getImageSrc = (image) => {
        if (!image || typeof image !== 'string') return '';
        if (image.startsWith('http')) return image;
        const normalizedPath = image.replace(/\\/g, '/').replace(/^\/+|\/+$/g, '');
        const baseUrl = (API_URL || '').replace(/\/+$/, '');
        return baseUrl ? `${baseUrl}/${normalizedPath}` : '';
    };
    const handleStampImageClick = () => {}; // No modal on user view; optional expand later

    const content = (
        <Row className="m-0" style={{ width: '100%', maxWidth: '100%' }}>
                        {/* Event Overview Section */}
                        <Col xs={12} className="p-0" style={{ overflow: 'hidden', width: '100%', maxWidth: '100%' }}>
                            <h5 className="mb-md-3 mb-3 pb-md-2 pb-2" style={{ 
                                fontSize: '16px', 
                                fontWeight: '600', 
                                color: '#000000',
                                borderBottom: '2px solid #4680ff'
                            }}>
                                <i className="fas fa-info-circle mr-2" style={{ color: '#4680ff' }}></i>
                                Event Overview
                            </h5>
                            <Row>
                                <InfoField 
                                    label="Event Name" 
                                    value={eventData.name} 
                                    icon="fas fa-calendar-alt"
                                    colSize={6}
                                />
                                <InfoField
                                    label="Ticket Price"
                                    value={
                                        <span style={{ color: '#28a745', fontWeight: 'bold', fontSize: '14px' }}>
                                            {eventData.price ? `${eventData.price} ${eventData.currency || 'USD'}` : 'Free'}
                                        </span>
                                    }
                                    icon="fas fa-dollar-sign"
                                    colSize={6}
                                />
                                <InfoField
                                    label="Start Date & Time"
                                    value={<DateTimeFormatter date={eventData.startDate} time={eventData.startTime} />}
                                    icon="fas fa-clock"
                                    colSize={6}
                                />
                                <InfoField
                                    label="End Date & Time"
                                    value={<DateTimeFormatter date={eventData.endDate} time={eventData.endTime} />}
                                    icon="fas fa-clock"
                                    colSize={6}
                                />
                                <InfoField
                                    label="Event Type"
                                    value={
                                        <Badge bg="secondary" style={{ fontSize: '12px', padding: '6px 12px', fontWeight: '600' }}>
                                            {eventData.type || 'N/A'}
                                        </Badge>
                                    }
                                    icon="fas fa-tag"
                                    colSize={6}
                                />
                                <InfoField 
                                    label="Lucky Draw Feature" 
                                    value={
                                        <Badge bg={eventData.enableLuckyDrawFeature ? 'success' : 'danger'} style={{ fontSize: '12px', padding: '6px 12px', fontWeight: '600' }}>
                                            {eventData.enableLuckyDrawFeature ? 'Enabled' : 'Disabled'}
                                            <i
                                                style={{ marginLeft: '4px' }}
                                                className={`fas fa-${eventData.enableLuckyDrawFeature ? 'check-circle' : 'times-circle'} me-1`}
                                            ></i>
                                        </Badge>
                                    }
                                    icon="fas fa-gift"
                                    colSize={6}
                                />
                                <InfoField label="Location" value={eventData.location || 'N/A'} icon="fas fa-map-marker-alt" colSize={6} />
                                <InfoField label="Venue" value={eventData.venue || 'N/A'} icon="fas fa-building" colSize={6} />
                                <InfoField label="Country" value={eventData.country || 'N/A'} icon="fas fa-globe" colSize={6} />
                                <InfoField label="Attendance Count" value={eventData.attendanceCount || '0'} icon="fas fa-users" colSize={6} />
                                {eventData?.publishStartDate && (
                                    <InfoField
                                        label="Publish Start Date"
                                        value={new Date(eventData.publishStartDate).toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}
                                        icon="fas fa-calendar-check"
                                        colSize={6}
                                    />
                                )}
                                {eventData?.publishEndDate && (
                                    <InfoField
                                        label="Publish End Date"
                                        value={new Date(eventData.publishEndDate).toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}
                                        icon="fas fa-calendar-times"
                                        colSize={6}
                                    />
                                )}
                                <InfoField
                                    label="Created At"
                                    value={<span style={{ color: '#6c757d', fontSize: '13px' }}>{formatTimestamp(eventData.createdAt)}</span>}
                                    icon="fas fa-calendar-plus"
                                    colSize={6}
                                />
                                <InfoField
                                    label="Last Updated"
                                    value={<span style={{ color: '#6c757d', fontSize: '13px' }}>{formatTimestamp(eventData.updatedAt)}</span>}
                                    icon="fas fa-edit"
                                    colSize={6}
                                />
                                {eventData?.description && (
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
                                                    <span>Event Description:</span>
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
                                                    <ExpandableDescription text={eventData.description} maxLines={2} />
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
                                                    <span style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>Event Description:</span>
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
                                                    <ExpandableDescription text={eventData.description} maxLines={2} />
                                                </div>
                                            </div>
                                        </div>
                                    </Col>
                                )}
                            </Row>
                        </Col>

                        {/* Event Categories - Separate Section */}
                        {eventData?.categories?.length > 0 && (
                            <Col xs={12} className="mt-md-4 mt-3 p-0" style={{ overflow: 'hidden', width: '100%', maxWidth: '100%' }}>
                                <h5 className="mb-md-3 mb-3 pb-md-2 pb-2" style={{ 
                                    fontSize: '16px', 
                                    fontWeight: '600', 
                                    color: '#000000',
                                    borderBottom: '2px solid #4680ff'
                                }}>
                                    <i className="fas fa-tags mr-2" style={{ color: '#4680ff' }}></i>
                                    Event Categories
                                </h5>
                                <Row>
                                    {eventData.categories.map((category, index) => (
                                        <React.Fragment key={category.id}>
                                            <Col xs={12} sm={12} md={12} className="mb-2" style={{ overflow: 'hidden' }}>
                                                <div style={{ 
                                                    padding: '8px 12px',
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
                                                            <span>Category {index + 1}:</span>
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
                                                            {category.name || 'N/A'}
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
                                                            <span style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>Category {index + 1}:</span>
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
                                                            {category.name || 'N/A'}
                                                        </div>
                                                    </div>
                                                </div>
                                            </Col>
                                            {category.description && (
                                                <Col xs={12} sm={12} md={12} className="mb-2" style={{ overflow: 'hidden' }}>
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
                                                                <span>Category {index + 1} Description:</span>
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
                                                                <ExpandableDescription text={category.description} maxLines={2} />
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
                                                                <span style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>Description:</span>
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
                                                                <ExpandableDescription text={category.description} maxLines={2} />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </Col>
                                            )}
                                        </React.Fragment>
                                    ))}
                                </Row>
                            </Col>
                        )}

                        {/* Event Stamps - show progress (e.g. 3/8) when admin set stampRequiredForReward */}
                        {eventData?.eventStamps?.stamps?.length > 0 && (
                            <Col xs={12} className="mt-md-4 mt-3 p-0" style={{ overflow: 'hidden', width: '100%', maxWidth: '100%' }}>
                                <EventStampsComponent
                                    eventStamps={eventData.eventStamps}
                                    getImageSrc={getImageSrc}
                                    handleStampImageClick={handleStampImageClick}
                                />
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

export default EventBasicComponent;
