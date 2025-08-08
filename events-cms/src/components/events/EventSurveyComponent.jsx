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
                icon="📊"
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
                    {/* Survey Title and Status */}
                    <div className="row">
                        <div className="col-lg-6 mb-3">
                            <div className="d-flex align-items-center mb-2">
                                <i className="fas fa-heading text-primary me-2" style={{ marginRight: 8 }}></i>
                                <strong>Survey Title:</strong>
                            </div>
                            <p className="mb-0 text-dark">{surveyDetails.title}</p>
                        </div>

                        <div className="col-lg-6 mb-3">
                            <div className="d-flex align-items-center mb-2">
                                <i className="fas fa-toggle-on text-primary me-2" style={{ marginRight: 8 }}></i>
                                <strong>Status:</strong>
                            </div>
                            <Badge bg={surveyDetails.isActive ? 'success' : 'secondary'} className="px-3 py-2">
                                <i
                                    className={`fas fa-${surveyDetails.isActive ? 'check-circle' : 'pause-circle'} me-1`}
                                ></i>
                                {surveyDetails.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                        </div>
                    </div>

                    <hr className="my-3" />

                    {/* Survey Dates */}
                    <div className="row">
                        <div className="col-lg-6 mb-3">
                            <div className="d-flex align-items-center mb-2">
                                <i className="fas fa-calendar-alt text-primary" style={{ marginRight: 8 }}></i>
                                <strong>Start Date & Time:</strong>
                            </div>
                            <p className="mb-0 text-dark">
                                {surveyDetails.startDate}
                                <span style={{ margin: '0 6px' }}></span>
                                <i className="fas fa-clock text-secondary" style={{ marginRight: 4 }}></i>
                                {formatTime(surveyDetails.startTime)}
                            </p>
                        </div>

                        <div className="col-lg-6 mb-3">
                            <div className="d-flex align-items-center mb-2">
                                <i className="fas fa-calendar-check text-primary" style={{ marginRight: 8 }}></i>
                                <strong>End Date & Time:</strong>
                            </div>
                            <p className="mb-0 text-dark">
                                {surveyDetails.endDate}
                                <span style={{ margin: '0 6px' }}></span>
                                <i className="fas fa-clock text-secondary" style={{ marginRight: 4 }}></i>
                                {formatTime(surveyDetails.endTime)}
                            </p>
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
                    <div className="d-flex align-items-center mb-2">
                        <span className="badge bg-primary me-2" style={{ minWidth: 60 }}>
                            Session {index + 1}
                        </span>
                        <h6 className="mb-0 fw-bold">{session.name}</h6>
                    </div>

                    {/* Session Description */}
                    <p className="mb-2 small text-muted">{session.description}</p>

                    {/* Session Date and Time */}
                    <div className="row mb-2">
                        <div className="col-6">
                            <small>
                                <i className="fas fa-calendar-day" style={{ marginRight: 4 }}></i>
                                <strong>Date:</strong> {session.date}
                            </small>
                        </div>
                        <div className="col-6">
                            <small>
                                <i className="fas fa-clock" style={{ marginRight: 4 }}></i>
                                <strong>Time:</strong> {formatTime(session.startTime)} -{' '}
                                {formatTime(session.endTime)}
                            </small>
                        </div>
                    </div>

                    {/* Session Status */}
                    <Badge bg={session.isActive ? 'success' : 'secondary'} className="mt-2">
                        <i
                            className={`fas fa-${session.isActive ? 'check-circle' : 'pause-circle'}`}
                            style={{ marginRight: 4 }}
                        ></i>
                        {session.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                </div>
            </div>
        </div>
    );

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
            icon="📊"
            borderColor="blue"
        >
            <div className="survey-section">
                {renderSurveyOverview()}
                {renderSurveySessions()}
            </div>
        </StandardComponentTemplate>
    );
};

export default EventSurveyComponent;