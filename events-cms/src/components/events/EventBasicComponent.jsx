import React, { useState } from 'react';
import { Row, Col, Badge } from 'react-bootstrap';
import DateTimeFormatter from '../dateTime/DateTimeFormatter';
import { ExpandableDescription } from '../ExpandableDescription';

/**
 * EventBasicComponent - Component to display basic event details with exhibitor-style UI
 * @param {Object} eventData - Event data object
 */
const EventBasicComponent = ({ eventData }) => {
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

    // Get colorful icons based on icon class
    const getIconColor = (iconClass) => {
        const colorMap = {
            'fas fa-calendar-alt': '#007bff', // Blue for calendar
            'fas fa-tag': '#28a745', // Green for tag
            'fas fa-tags': '#ffc107', // Yellow for tags
            'fas fa-clock': '#dc3545', // Red for clock
            'fas fa-map-marker-alt': '#e74c3c', // Red for location
            'fas fa-building': '#6f42c1', // Purple for building
            'fas fa-globe': '#17a2b8', // Teal for globe
            'fas fa-dollar-sign': '#28a745', // Green for money
            'fas fa-calendar-plus': '#20c997', // Teal for created
            'fas fa-edit': '#fd7e14', // Orange for edit
            'fas fa-gift': '#e91e63', // Pink for lucky draw
            'fa fa-sticky-note': '#6c757d', // Gray for text
            'fas fa-info-circle': '#17a2b8', // Teal for info
            'fa fa-sticky-note': '#007bff'
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

    const InfoField = ({ label, value, iconClass = null }) => (
        <div
            className="info-field-container mb-2 py-2"
            style={{
                borderBottom: '1px solid #f1f1f1'
            }}
        >
            <span className="field-label" style={{ fontWeight: 'bold', color: '#495057', fontSize: '14px' }}>
                {iconClass && <i className={iconClass} style={{ marginRight: '8px', color: getIconColor(iconClass) }}></i>}
                {label}:
            </span>
            <span className="field-value" style={{ color: '#212529', fontWeight: 'normal', fontSize: '15px' }}>
                {value}
            </span>
        </div>
    );



    const renderCategories = () => {
        if (!eventData?.categories?.length) {
            return <p className="text-muted">No categories listed.</p>;
        }
        return (
            <Row>
                {eventData?.categories?.map((category, index) => (
                    <Col lg={6} md={12} key={category.id} className="mb-3">
                        <div className="mb-3">
                            {/* Category Name - Same line like other fields */}
                            <InfoField label="Category Name" value={category.name} iconClass="fas fa-tag" />

                            {/* Description - Always stacked */}
                            <div className="mb-2 py-2" style={{ borderBottom: '1px solid #f1f1f1' }}>
                                <div style={{ fontWeight: 'bold', color: '#495057', fontSize: '14px', marginBottom: '8px' }}>
                                    <i
                                        className="fa fa-sticky-note"
                                        style={{ marginRight: '8px', color: getIconColor('fa fa-sticky-note') }}
                                    ></i>
                                    Description:
                                </div>
                                <ExpandableDescription 
                                    text={category.description}
                                    maxLines={2}
                                />
                            </div>
                        </div>
                    </Col>
                ))}
            </Row>
        );
    };

    return (
        <div className="p-2 bg-light">
            {/* Event Overview Section */}
            <InfoCard title="Event Overview" iconClass="fas fa-info-circle" borderColor="#3498db">
                <Row>
                    <Col lg={6} md={12}>
                        <div style={{ fontSize: '15px', lineHeight: '1.6' }}>
                            <InfoField label="Event Name" value={eventData.name} iconClass="fas fa-calendar-alt" />
                            <InfoField
                                label="Ticket Price"
                                value={
                                    <span style={{ color: '#28a745', fontWeight: 'bold', fontSize: '16px' }}>
                                        {eventData.price ? `${eventData.price} ${eventData.currency || 'USD'}` : 'Free'}
                                    </span>
                                }
                                iconClass="fas fa-dollar-sign"
                            />
                            <InfoField
                                label="Start Date & Time"
                                value={<DateTimeFormatter date={eventData.startDate} time={eventData.startTime} />}
                                iconClass="fas fa-clock"
                            />
                            <InfoField
                                label="End Date & Time"
                                value={<DateTimeFormatter date={eventData.endDate} time={eventData.endTime} />}
                                iconClass="fas fa-clock"
                            />

                            <InfoField
                                label="Lucky Draw Feature"
                                value={
                                    <Badge bg={eventData.enableLuckyDrawFeature ? 'success' : 'danger'} className="px-3 py-1">
                                        {eventData.enableLuckyDrawFeature ? 'Enabled' : 'Disabled'}
                                        <i
                                            style={{ marginLeft: '4px' }}
                                            className={`fas fa-${eventData.enableLuckyDrawFeature ? 'check-circle' : 'times-circle'} me-1`}
                                        ></i>
                                    </Badge>
                                }
                                iconClass="fas fa-gift"
                            />
                            <InfoField
                                label="Created At"
                                value={<span style={{ color: '#6c757d', fontSize: '13px' }}>{formatTimestamp(eventData.createdAt)}</span>}
                                iconClass="fas fa-calendar-plus"
                            />
                        </div>
                    </Col>

                    <Col lg={6} md={12}>
                        <div style={{ fontSize: '15px', lineHeight: '1.6' }}>
                            <InfoField
                                label="Event Type"
                                value={
                                    <Badge bg="secondary" className="px-3 py-1">
                                        {eventData.type || 'N/A'}
                                    </Badge>
                                }
                                iconClass="fas fa-tag"
                            />
                            <InfoField label="Location" value={eventData.location || 'N/A'} iconClass="fas fa-map-marker-alt" />
                            <InfoField label="Venue" value={eventData.venue || 'N/A'} iconClass="fas fa-building" />
                            <InfoField label="Country" value={eventData.country || 'N/A'} iconClass="fas fa-globe" />

                            <InfoField label="Attendance Count" value={eventData.attendanceCount || '0'} iconClass="fas fa-users" />
                            <InfoField
                                label="Last Updated"
                                value={<span style={{ color: '#6c757d', fontSize: '13px' }}>{formatTimestamp(eventData.updatedAt)}</span>}
                                iconClass="fas fa-edit"
                            />
                        </div>
                    </Col>
                    <Col lg={12} md={12}>
                        <div className="mb-2 py-2" style={{ borderBottom: '1px solid #f1f1f1' }}>
                            <div style={{ fontWeight: 'bold', color: '#495057', fontSize: '14px', marginBottom: '8px' }}>
                                <i
                                    className="fa fa-sticky-note"
                                    style={{ marginRight: '8px', color: getIconColor('fa fa-sticky-note') }}
                                ></i>
                                Event Description:
                            </div>
                            <ExpandableDescription 
                                text={eventData.description}
                                maxLines={2}
                            />
                        </div>
                    </Col>
                </Row>
            </InfoCard>

            {/* Categories Section */}
            <InfoCard title="Event Categories" iconClass="fas fa-tags" borderColor="#f39c12">
                {renderCategories()}
            </InfoCard>

            {/* Custom CSS for Responsive Behavior */}
            <style jsx>{`
                /* Desktop: side-by-side layout */
                .info-field-container {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .field-label {
                    min-width: 140px;
                }

                .field-value {
                    text-align: right;
                    flex: 1;
                }

                /* Mobile: stacked layout */
                @media (max-width: 768px) {
                    .info-field-container {
                        display: block !important;
                        text-align: left !important;
                    }

                    .field-label {
                        display: block !important;
                        min-width: auto !important;
                        margin-bottom: 4px !important;
                        font-size: 13px !important;
                        color: #495057 !important;
                    }

                    .field-value {
                        display: block !important;
                        text-align: left !important;
                        font-size: 14px !important;
                        font-weight: 600 !important;
                        color: #212529 !important;
                        padding-left: 0 !important;
                        margin-left: 0 !important;
                    }
                }

                @media (max-width: 576px) {
                    .field-label {
                        font-size: 12px !important;
                    }

                    .field-value {
                        font-size: 13px !important;
                    }
                }
            `}</style>
        </div>
    );
};

export default EventBasicComponent;
