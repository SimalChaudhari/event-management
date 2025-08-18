import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import Badge from 'react-bootstrap/Badge';
import Table from 'react-bootstrap/Table';
import Alert from 'react-bootstrap/Alert';
import { surveyDetail } from '../../store/actions/surveyActions';
import { formatDateTimeForTable } from '../../components/dateTime/dateTimeUtils';

const ViewSurveyPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    
    const { selectedSurvey, loading } = useSelector((state) => state.survey);

    useEffect(() => {
        if (id) {
            dispatch(surveyDetail(id));
        }
    }, [dispatch, id]);

    if (loading) {
        return (
            <Row>
                <Col sm={12}>
                    <Card>
                        <Card.Body className="text-center">
                            <div className="spinner-border text-primary" role="status">
                                <span className="sr-only">Loading...</span>
                            </div>
                            <p className="mt-2">Loading survey details...</p>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        );
    }

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

    const surveyStatus = formatSurveyStatus(selectedSurvey);

    return (
        <Row>
            <Col sm={12}>
                {/* Survey Header */}
                <Card className="mb-4">
                    <Card.Header className="d-flex justify-content-between align-items-center">
                        <div>
                            <h5 className="mb-0">{selectedSurvey.title}</h5>
                            <Badge variant={surveyStatus.variant} className="mt-1">
                                {surveyStatus.text}
                            </Badge>
                        </div>
                        <div>
                            <Button 
                                variant="warning" 
                                className="me-2"
                                onClick={() => navigate(`/surveys/edit/${selectedSurvey.id}`)}
                            >
                                <i className="feather icon-edit"></i> Edit
                            </Button>
                            <Button 
                                variant="secondary"
                                onClick={() => navigate('/surveys')}
                            >
                                <i className="feather icon-arrow-left"></i> Back
                            </Button>
                        </div>
                    </Card.Header>
                </Card>

                {/* Survey Details */}
                <Row>
                    <Col md={8}>
                        <Card className="mb-4">
                            <Card.Header>
                                <h6>Survey Information</h6>
                            </Card.Header>
                            <Card.Body>
                                <Row>
                                    <Col md={6}>
                                        <p><strong>Title:</strong> {selectedSurvey.title}</p>
                                        <p><strong>Event ID:</strong> {selectedSurvey.eventId}</p>
                                        <p><strong>Status:</strong> 
                                            <Badge 
                                                variant={selectedSurvey.isActive ? 'success' : 'danger'}
                                                className="ms-2"
                                            >
                                                {selectedSurvey.isActive ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </p>
                                    </Col>
                                    <Col md={6}>
                                        <p><strong>Start:</strong> {formatDateTimeForTable(selectedSurvey.startDate, selectedSurvey.startTime)}</p>
                                        <p><strong>End:</strong> {formatDateTimeForTable(selectedSurvey.endDate, selectedSurvey.endTime)}</p>
                                        <p><strong>Created:</strong> {new Date(selectedSurvey.createdAt).toLocaleDateString()}</p>
                                    </Col>
                                </Row>
                            </Card.Body>
                        </Card>
                    </Col>

                    <Col md={4}>
                        <Card className="mb-4">
                            <Card.Header>
                                <h6>Statistics</h6>
                            </Card.Header>
                            <Card.Body>
                                <div className="text-center">
                                    <div className="mb-3">
                                        <h4 className="text-primary">{selectedSurvey.sessions?.length || 0}</h4>
                                        <p className="mb-0">Total Sessions</p>
                                    </div>
                                    <div className="mb-3">
                                        <h4 className="text-success">{selectedSurvey.eventStats?.totalDays || 'N/A'}</h4>
                                        <p className="mb-0">Total Days</p>
                                    </div>
                                    <div>
                                        <h4 className="text-info">{selectedSurvey.eventStats?.totalHours || 'N/A'}</h4>
                                        <p className="mb-0">Total Hours</p>
                                    </div>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>

                {/* Sessions Table */}
                <Card>
                    <Card.Header className="d-flex justify-content-between align-items-center">
                        <h6>Survey Sessions</h6>
                        <Badge variant="primary">{selectedSurvey.sessions?.length || 0} Sessions</Badge>
                    </Card.Header>
                    <Card.Body>
                        {selectedSurvey.sessions && selectedSurvey.sessions.length > 0 ? (
                            <Table striped hover responsive>
                                <thead>
                                    <tr>
                                        <th>Session Name</th>
                                        <th>Date</th>
                                        <th>Time</th>
                                        <th>Description</th>
                                        <th>Status</th>
                                        <th>Active</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {selectedSurvey.sessions.map((session) => {
                                        const sessionStatus = formatSessionStatus(session);
                                        return (
                                            <tr key={session.id}>
                                                <td>
                                                    <strong>{session.name}</strong>
                                                </td>
                                                <td>
                                                    {new Date(session.date).toLocaleDateString()}
                                                </td>
                                                <td>
                                                    {session.startTime} - {session.endTime}
                                                </td>
                                                <td>
                                                    {session.description || 'No description'}
                                                </td>
                                                <td>
                                                    <Badge variant={sessionStatus.variant}>
                                                        {sessionStatus.text}
                                                    </Badge>
                                                </td>
                                                <td>
                                                    <Badge variant={session.isActive ? 'success' : 'danger'}>
                                                        {session.isActive ? 'Active' : 'Inactive'}
                                                    </Badge>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </Table>
                        ) : (
                            <Alert variant="info" className="text-center">
                                <i className="feather icon-info"></i>
                                <p className="mb-0 mt-2">No sessions found for this survey.</p>
                            </Alert>
                        )}
                    </Card.Body>
                </Card>
            </Col>
        </Row>
    );
};

export default ViewSurveyPage;
