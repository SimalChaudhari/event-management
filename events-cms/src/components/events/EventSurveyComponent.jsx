import React from 'react';
import { Badge } from 'react-bootstrap';
import StandardComponentTemplate from '../StandardComponentTemplate';

/**
 * EventSurveyComponent - Component to display event survey details
 * @param {Object} surveyDetails - Survey details object
 * @param {Function} formatTime - Function to format time
 */
const EventSurveyComponent = ({ surveyDetails, formatTime }) => {
    // Check if survey details are available
    if (!surveyDetails) {
        return (
            <StandardComponentTemplate 
                title="Event Survey" 
                icon="fas fa-poll"
                borderColor="blue"
            >
                <div className="text-center py-4">
                    <i className="fas fa-store fa-2x text-muted mb-2"></i>
                    <p className="text-muted">No Survey available.</p>
                </div>
            </StandardComponentTemplate>
        );
    }

    // Render survey overview section
    const renderSurveyOverview = () => (
        <div className="mb-4">
            <div className="d-flex align-items-center mb-3">
                <h5 className="mb-0 fw-bold">Survey Overview</h5>
            </div>

            <div className="card border-0 shadow-sm">
                <div className="card-body p-4">
                    {/* Survey Title and Status - Using label style */}
                    <div className="row">
                        <div className="col-lg-6 mb-3">
                            <div className="info-field-container mb-2 py-2" style={{ borderBottom: '1px solid #f1f1f1' }}>
                                <span className="field-label" style={{ fontWeight: 'bold', color: '#495057', fontSize: '14px' }}>
                                    <i className="fas fa-file-alt" style={{ marginRight: '8px', color: '#007bff' }}></i>
                                    Survey Title:
                                </span>
                                <span className="field-value" style={{ color: '#212529', fontWeight: 'normal', fontSize: '15px' }}>
                                    {surveyDetails.title}
                                </span>
                            </div>
                        </div>

                        <div className="col-lg-6 mb-3">
                            <div className="info-field-container mb-2 py-2" style={{ borderBottom: '1px solid #f1f1f1' }}>
                                <span className="field-label" style={{ fontWeight: 'bold', color: '#495057', fontSize: '14px' }}>
                                    <i className="fas fa-toggle-on" style={{ marginRight: '8px', color: '#28a745' }}></i>
                                    Status:
                                </span>
                                <span className="field-value" style={{ color: '#212529', fontWeight: 'normal', fontSize: '15px' }}>
                                    <Badge bg={surveyDetails.isActive ? 'success' : 'secondary'} className="px-3 py-1">
                                        <i className={`fas fa-${surveyDetails.isActive ? 'check-circle' : 'pause-circle'} me-1`}></i>
                                        {surveyDetails.isActive ? 'Active' : 'Inactive'}
                                    </Badge>
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Survey Dates - Using label style */}
                    <div className="row">
                        <div className="col-lg-6 mb-3">
                            <div className="info-field-container mb-2 py-2" style={{ borderBottom: '1px solid #f1f1f1' }}>
                                <span className="field-label" style={{ fontWeight: 'bold', color: '#495057', fontSize: '14px' }}>
                                    <i className="fas fa-calendar-alt" style={{ marginRight: '8px', color: '#007bff' }}></i>
                                    Start Date & Time:
                                </span>
                                <span className="field-value" style={{ color: '#212529', fontWeight: 'normal', fontSize: '15px' }}>
                                    {surveyDetails.startDate} <i className="fas fa-clock" style={{ marginLeft: '8px', marginRight: '4px', color: '#6c757d' }}></i>
                                    {formatTime(surveyDetails.startTime)}
                                </span>
                            </div>
                        </div>

                        <div className="col-lg-6 mb-3">
                            <div className="info-field-container mb-2 py-2" style={{ borderBottom: '1px solid #f1f1f1' }}>
                                <span className="field-label" style={{ fontWeight: 'bold', color: '#495057', fontSize: '14px' }}>
                                    <i className="fas fa-calendar-check" style={{ marginRight: '8px', color: '#dc3545' }}></i>
                                    End Date & Time:
                                </span>
                                <span className="field-value" style={{ color: '#212529', fontWeight: 'normal', fontSize: '15px' }}>
                                    {surveyDetails.endDate} <i className="fas fa-clock" style={{ marginLeft: '8px', marginRight: '4px', color: '#6c757d' }}></i>
                                    {formatTime(surveyDetails.endTime)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    // Render individual survey session
    const renderSurveySession = (session, index) => (
        <div key={session.id} className="col-md-6 mb-4">
            <div className="card border-0 shadow-sm h-100">
                <div className="card-body">
                    {/* Session Header */}
                    <div className="info-field-container mb-2 py-2" style={{ borderBottom: '1px solid #f1f1f1' }}>
                        <span className="field-label" style={{ fontWeight: 'bold', color: '#495057', fontSize: '14px' }}>
                            <i className="fas fa-hashtag" style={{ marginRight: '8px', color: '#007bff' }}></i>
                            Session {index + 1}:
                        </span>
                        <span className="field-value" style={{ color: '#212529', fontWeight: 'normal', fontSize: '15px' }}>
                            {session.name}
                        </span>
                    </div>

                    {/* Session Description */}
                    <div className="info-field-container mb-2 py-2" style={{ borderBottom: '1px solid #f1f1f1' }}>
                        <span className="field-label" style={{ fontWeight: 'bold', color: '#495057', fontSize: '14px' }}>
                            <i className="fas fa-sticky-note" style={{ marginRight: '8px', color: '#6c757d' }}></i>
                            Description:
                        </span>
                        <span className="field-value" style={{ color: '#212529', fontWeight: 'normal', fontSize: '15px' }}>
                            {session.description}
                        </span>
                    </div>

                    {/* Session Date */}
                    <div className="info-field-container mb-2 py-2" style={{ borderBottom: '1px solid #f1f1f1' }}>
                        <span className="field-label" style={{ fontWeight: 'bold', color: '#495057', fontSize: '14px' }}>
                            <i className="fas fa-calendar-day" style={{ marginRight: '8px', color: '#28a745' }}></i>
                            Date:
                        </span>
                        <span className="field-value" style={{ color: '#212529', fontWeight: 'normal', fontSize: '15px' }}>
                            {session.date}
                        </span>
                    </div>

                    {/* Session Time */}
                    <div className="info-field-container mb-2 py-2" style={{ borderBottom: '1px solid #f1f1f1' }}>
                        <span className="field-label" style={{ fontWeight: 'bold', color: '#495057', fontSize: '14px' }}>
                            <i className="fas fa-clock" style={{ marginRight: '8px', color: '#dc3545' }}></i>
                            Time:
                        </span>
                        <span className="field-value" style={{ color: '#212529', fontWeight: 'normal', fontSize: '15px' }}>
                            {formatTime(session.startTime)} - {formatTime(session.endTime)}
                        </span>
                    </div>

                    {/* Session Status */}
                    <div className="info-field-container mb-2 py-2">
                        <span className="field-label" style={{ fontWeight: 'bold', color: '#495057', fontSize: '14px' }}>
                            <i className="fas fa-toggle-on" style={{ marginRight: '8px', color: '#28a745' }}></i>
                            Status:
                        </span>
                        <span className="field-value" style={{ color: '#212529', fontWeight: 'normal', fontSize: '15px' }}>
                            <Badge bg={session.isActive ? 'success' : 'secondary'} className="px-3 py-1">
                                <i className={`fas fa-${session.isActive ? 'check-circle' : 'pause-circle'} me-1`}></i>
                                {session.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );

    // Render survey URLs section
    const renderSurveyUrls = () => {
        if (!surveyDetails.surveyUrls?.length) {
            return null;
        }

        return (
            <div>
                <div className="d-flex align-items-center mb-3 mt-4">
                    <h5 className="mb-0 fw-bold">
                      
                        Survey URLs
                    </h5>
                </div>
                <div className="row">
                    {surveyDetails.surveyUrls.map((urlItem, index) => (
                        <div key={index} className="col-md-6 mb-3">
                            <div className="card border-0 shadow-sm">
                                <div className="card-body">
                                    <div className="info-field-container mb-2 py-2">
                                        <span className="field-label" style={{ fontWeight: 'bold', color: '#495057', fontSize: '14px' }}>
                                            <i className="fas fa-link" style={{ marginRight: '8px', color: '#007bff' }}></i>
                                            {urlItem.title}:
                                        </span>
                                        <div className="field-value" style={{ marginTop: '8px' }}>
                                            <a 
                                                href={urlItem.url} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                style={{ 
                                                    color: '#007bff', 
                                                    textDecoration: 'none',
                                                    wordBreak: 'break-all',
                                                    fontSize: '14px',
                                                    display: 'flex',
                                                    alignItems: 'center'
                                                }}
                                            >
                                                <i className="fas fa-external-link-alt me-2"></i>
                                                {urlItem.url}
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    // Render survey sessions section
    const renderSurveySessions = () => {
        if (!surveyDetails.sessions?.length) {
            return null;
        }

        return (
            <div>
                <div className="d-flex align-items-center mb-3 mt-4">
                    <h5 className="mb-0 fw-bold">Survey Sessions</h5>
                </div>
                <div className="row">
                    {surveyDetails.sessions.map((session, index) => 
                        renderSurveySession(session, index)
                    )}
                </div>
            </div>
        );
    };

    return (
        <StandardComponentTemplate 
            title="Event Survey" 
            // icon="📊"
            borderColor="blue"
        >
            <div className="survey-section">
                {renderSurveyOverview()}
                {renderSurveyUrls()}
                {renderSurveySessions()}
            </div>
        </StandardComponentTemplate>
    );
};

export default EventSurveyComponent;