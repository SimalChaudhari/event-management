import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Button, Row, Col, Card, Badge, Nav, Tab, Container, Alert } from 'react-bootstrap';
import { surveyDetail } from '../../store/actions/surveyActions';
import { formatDateTimeForTable } from '../../components/dateTime/dateTimeUtils';
import SurveyBasicComponent from '../../components/surveys/SurveyBasicComponent';
import SurveySessionsComponent from '../../components/surveys/SurveySessionsComponent';

const ViewSurveyPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    
    const { selectedSurvey } = useSelector((state) => state.survey);
    const [activeTab, setActiveTab] = useState('details');

    useEffect(() => {
        if (id) {
            dispatch(surveyDetail(id));
        }
    }, [dispatch, id]);

    if (!selectedSurvey) {
        return (
            <Row>
                <Col sm={12}>
                    <Card>
                        <Card.Body>
                            <Alert variant="warning">
                                Survey not found or you don't have permission to view it.
                            </Alert>
                            <Button variant="primary" onClick={() => navigate('/surveys')}>
                                Back to Surveys
                            </Button>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        );
    }

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

    const surveyStatus = selectedSurvey ? formatSurveyStatus(selectedSurvey) : { variant: 'secondary', text: 'N/A' };

    // 12-hour AM/PM format helper
    const formatTime = (timeStr) => {
        if (!timeStr) return '';
        const [hour, minute] = timeStr.split(':');
        const date = new Date();
        date.setHours(hour, minute);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    };

    // Render survey statistics
    const renderSurveyStats = () => (
        <Row>
            <Col xs={6} md={3} className="mb-3">
                <div
                    className="text-center p-3"
                    style={{ backgroundColor: '#f8f9fa', borderRadius: '8px', border: '1px solid #e9ecef', padding: '20px' }}
                >
                    <i className="fas fa-list-alt text-primary mb-2" style={{ fontSize: '1.5rem' }}></i>
                    <h6 className="mb-1" style={{ color: '#495057', fontSize: '0.9rem' }}>
                        Sessions
                    </h6>
                    <p className="mb-0" style={{ fontSize: '0.95rem', fontWeight: '500', color: '#28a745' }}>
                        {selectedSurvey?.sessions?.length || 0}
                    </p>
                </div>
            </Col>
            <Col xs={6} md={3} className="mb-3">
                <div
                    className="text-center p-3"
                    style={{ backgroundColor: '#f8f9fa', borderRadius: '8px', border: '1px solid #e9ecef', padding: '20px' }}
                >
                    <i className="fas fa-calendar-day text-primary mb-2" style={{ fontSize: '1.5rem' }}></i>
                    <h6 className="mb-1" style={{ color: '#495057', fontSize: '0.9rem' }}>
                        Total Days
                    </h6>
                    <p className="mb-0" style={{ fontSize: '0.95rem', fontWeight: '500' }}>
                        {selectedSurvey?.eventStats?.totalDays || 'N/A'}
                    </p>
                </div>
            </Col>
            <Col xs={6} md={3} className="mb-3">
                <div
                    className="text-center p-3"
                    style={{ backgroundColor: '#f8f9fa', borderRadius: '8px', border: '1px solid #e9ecef', padding: '20px' }}
                >
                    <i className="fas fa-clock text-primary mb-2" style={{ fontSize: '1.5rem' }}></i>
                    <h6 className="mb-1" style={{ color: '#495057', fontSize: '0.9rem' }}>
                        Total Hours
                    </h6>
                    <p className="mb-0" style={{ fontSize: '0.95rem', fontWeight: '500' }}>
                        {selectedSurvey?.eventStats?.totalHours || 'N/A'}
                    </p>
                </div>
            </Col>
            <Col xs={6} md={3} className="mb-3">
                <div
                    className="text-center p-3"
                    style={{ backgroundColor: '#f8f9fa', borderRadius: '8px', border: '1px solid #e9ecef', padding: '20px' }}
                >
                    <i className="fas fa-toggle-on text-primary mb-2" style={{ fontSize: '1.5rem' }}></i>
                    <h6 className="mb-1" style={{ color: '#495057', fontSize: '0.9rem' }}>
                        Status
                    </h6>
                    <p className="mb-0" style={{ fontSize: '0.95rem', fontWeight: '500' }}>
                        <Badge bg={selectedSurvey?.isActive ? 'success' : 'danger'}>
                            {selectedSurvey?.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                    </p>
                </div>
            </Col>
        </Row>
    );

    return (
        <>
            <div className="mt-4">
                <div
                    className="mb-3"
                    style={{ backgroundColor: '#fff', borderRadius: '8px', padding: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
                >
                    <div className="d-flex justify-content-between align-items-center">
                        <h4 className="card-title">View Survey</h4>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <Button 
                                variant="primary"
                                style={{ backgroundColor: '#4680ff', borderColor: '#4680ff', color: '#ffffff' }}
                                onClick={() => navigate(`/surveys/edit/${selectedSurvey?.id}`)}
                            >
                                <i className="fas fa-edit me-2" style={{ color: '#ffffff' }}></i> Edit
                            </Button>
                            <Button 
                                variant="secondary"
                                onClick={() => navigate('/surveys')}
                            >
                                <i className="fas fa-arrow-left me-2"></i> Back
                            </Button>
                        </div>
                    </div>
                    <hr />
                    {renderSurveyStats()}
                </div>

                <div style={{ backgroundColor: '#fff', borderRadius: '8px', padding: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                    <Tab.Container id="survey-tabs" defaultActiveKey="details">
                        <Row>
                            <Col sm={12}>
                                <Nav variant="tabs" className="mb-3">
                                    <Nav.Item>
                                        <Nav.Link eventKey="details">
                                            <i className="fas fa-info-circle me-2" style={{ color: '#4680ff', marginRight: 6 }}></i>
                                            Details
                                        </Nav.Link>
                                    </Nav.Item>
                                    <Nav.Item>
                                        <Nav.Link eventKey="sessions">
                                            <i className="fas fa-list-alt me-2" style={{ color: '#4680ff', marginRight: 6 }}></i>
                                            Sessions
                                        </Nav.Link>
                                    </Nav.Item>
                                </Nav>
                            </Col>
                        </Row>

                        <Tab.Content>
                            {/* Details Tab */}
                            <Tab.Pane eventKey="details">
                                <SurveyBasicComponent surveyData={selectedSurvey || {}} />
                            </Tab.Pane>

                            {/* Sessions Tab */}
                            <Tab.Pane eventKey="sessions">
                                <SurveySessionsComponent 
                                    sessions={selectedSurvey?.sessions || []} 
                                    formatTime={formatTime} 
                                />
                            </Tab.Pane>
                        </Tab.Content>
                    </Tab.Container>
                </div>
            </div>
        </>
    );
};

export default ViewSurveyPage;
