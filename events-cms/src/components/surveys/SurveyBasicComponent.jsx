import React from 'react';
import { Row, Col, Badge } from 'react-bootstrap';
import DateTimeFormatter from '../dateTime/DateTimeFormatter';
import { ExpandableDescription } from '../ExpandableDescription';

/**
 * SurveyBasicComponent - Component to display basic survey details with event-style UI
 * @param {Object} surveyData - Survey data object
 */
const SurveyBasicComponent = ({ surveyData }) => {
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
            'fas fa-poll': '#007bff', // Blue for poll
            'fas fa-calendar-alt': '#007bff', // Blue for calendar
            'fas fa-clock': '#dc3545', // Red for clock
            'fas fa-toggle-on': '#28a745', // Green for active
            'fas fa-calendar-plus': '#20c997', // Teal for created
            'fas fa-edit': '#fd7e14', // Orange for edit
            'fa fa-sticky-note': '#6c757d', // Gray for text
            'fas fa-info-circle': '#17a2b8', // Teal for info
            'fas fa-hashtag': '#6f42c1', // Purple for sessions
            'fas fa-calendar-check': '#dc3545', // Red for end date
            'fas fa-list': '#17a2b8', // Teal for list/sessions count
            'fas fa-map-marker-alt': '#dc3545', // Red for location
            'fas fa-tag': '#fd7e14' // Orange for type
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

    return (
        <div className="p-2 bg-light">
            {/* Survey Overview Section */}
            <InfoCard title="Survey Overview" iconClass="fas fa-info-circle" borderColor="#3498db">
                <Row>
                    <Col lg={6} md={12}>
                        <div style={{ fontSize: '15px', lineHeight: '1.6' }}>
                            <InfoField label="Survey Title" value={surveyData.title} iconClass="fas fa-poll" />
                            <InfoField
                                label="Status"
                                value={
                                    <Badge bg={surveyStatus.variant} className="px-3 py-1">
                                        <i className={`fas fa-${surveyData.isActive ? 'check-circle' : 'pause-circle'} me-1`}></i>
                                        {surveyStatus.text}
                                    </Badge>
                                }
                                iconClass="fas fa-toggle-on"
                            />
                            <InfoField
                                label="Active Status"
                                value={
                                    <Badge bg={surveyData.isActive ? 'success' : 'danger'} className="px-3 py-1">
                                        {surveyData.isActive ? 'Active' : 'Inactive'}
                                    </Badge>
                                }
                                iconClass="fas fa-toggle-on"
                            />
                                <InfoField
                                label="Created"
                                value={<span style={{ color: '#6c757d', fontSize: '13px' }}>{formatTimestamp(surveyData.createdAt)}</span>}
                                iconClass="fas fa-calendar-plus"
                            />
                        </div>
                    </Col>

                    <Col lg={6} md={12}>
                        <div style={{ fontSize: '15px', lineHeight: '1.6' }}>
                            <InfoField
                                label="Start Date & Time"
                                value={<DateTimeFormatter date={surveyData.startDate} time={surveyData.startTime} />}
                                iconClass="fas fa-clock"
                            />
                            <InfoField
                                label="End Date & Time"
                                value={<DateTimeFormatter date={surveyData.endDate} time={surveyData.endTime} />}
                                iconClass="fas fa-calendar-check"
                            />
                            <InfoField
                                label="Sessions Count"
                                value={surveyData.sessions ? surveyData.sessions.length : 0}
                                iconClass="fas fa-list"
                            />
                        
                            <InfoField
                                label="Last Updated"
                                value={<span style={{ color: '#6c757d', fontSize: '13px' }}>{formatTimestamp(surveyData.updatedAt)}</span>}
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
                                Survey Description:
                            </div>
                            <ExpandableDescription text={surveyData.description || 'No description available'} maxLines={3} />
                        </div>
                    </Col>
                </Row>
            </InfoCard>

            {/* Event Information Section */}
            <InfoCard title="Event Information" iconClass="fas fa-calendar-alt" borderColor="#28a745">
                <Row>
                    <Col lg={6} md={12}>
                        <div style={{ fontSize: '15px', lineHeight: '1.6' }}>
                            <InfoField 
                                label="Event Name" 
                                value={surveyData.eventInfo?.name || 'N/A'} 
                                iconClass="fas fa-calendar-alt" 
                            />
                            <InfoField 
                                label="Event Location" 
                                value={surveyData.eventInfo?.location || 'No location'} 
                                iconClass="fas fa-map-marker-alt" 
                            />
                        </div>
                    </Col>
                    <Col lg={6} md={12}>
                        <div style={{ fontSize: '15px', lineHeight: '1.6' }}>
                            <InfoField 
                                label="Event Price" 
                                value={surveyData.eventInfo.price || 'N/A'} 
                                iconClass="fas fa-hashtag" 
                            />
                            <InfoField 
                                label="Event Type" 
                                value={surveyData.eventInfo?.type || 'N/A'} 
                                iconClass="fas fa-tag" 
                            />
                        </div>
                    </Col>
                </Row>
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

export default SurveyBasicComponent;
