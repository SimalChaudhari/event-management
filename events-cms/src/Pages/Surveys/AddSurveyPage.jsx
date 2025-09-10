import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Button, Row, Col, Card, Badge, Container, Alert } from 'react-bootstrap';
import Select from 'react-select';
import { surveyCreate, surveyUpdate, surveyDetail, getEventSuggestions } from '../../store/actions/surveyActions';
import { eventList } from '../../store/actions/eventActions';
import { SURVEY_PATHS } from '../../utils/constants';

const AddSurveyPage = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { id } = useParams();
    const isEditing = Boolean(id);

    const events = useSelector((state) => state.event?.event?.events);

    const { selectedSurvey, createLoading, updateLoading } = useSelector((state) => state.survey);

    const [formData, setFormData] = useState({
        eventId: '',
        title: '',
        startDate: '',
        endDate: '',
        startTime: '',
        endTime: '',
        isActive: true,
        sessions: []
    });

    const [errors, setErrors] = useState({});
    const [suggestions, setSuggestions] = useState(null);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [sessionsList, setSessionsList] = useState([
        {
            name: '',
            date: '',
            startTime: '',
            endTime: '',
            description: '',
            isActive: true
        }
    ]);

    useEffect(() => {
        dispatch(eventList());
        
        if (isEditing) {
            dispatch(surveyDetail(id));
        }
    }, [dispatch, id, isEditing]);

    useEffect(() => {
        if (isEditing && selectedSurvey) {
            setFormData({
                eventId: selectedSurvey.eventId || '',
                title: selectedSurvey.title || '',
                startDate: selectedSurvey.startDate ? new Date(selectedSurvey.startDate).toISOString().split('T')[0] : '',
                endDate: selectedSurvey.endDate ? new Date(selectedSurvey.endDate).toISOString().split('T')[0] : '',
                startTime: selectedSurvey.startTime || '',
                endTime: selectedSurvey.endTime || '',
                isActive: selectedSurvey.isActive !== undefined ? selectedSurvey.isActive : true,
                sessions: selectedSurvey.sessions || []
            });

            // Load sessions into sessionsList
            if (selectedSurvey.sessions && Array.isArray(selectedSurvey.sessions)) {
                const formattedSessions = selectedSurvey.sessions.map(session => ({
                    id: session.id || Date.now() + Math.random(),
                    name: session.name || '',
                    date: session.date ? new Date(session.date).toISOString().split('T')[0] : '',
                    startTime: session.startTime || '',
                    endTime: session.endTime || '',
                    description: session.description || '',
                    isActive: session.isActive !== undefined ? session.isActive : true
                }));
                setSessionsList(formattedSessions);
            }
        }
    }, [selectedSurvey, isEditing]);

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
        
        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const handleEventChange = async (eventId) => {
        setFormData(prev => ({
            ...prev,
            eventId,
            startDate: '',
            endDate: '',
            startTime: '',
            endTime: ''
        }));

        if (eventId) {
            try {
                const response = await dispatch(getEventSuggestions(eventId));
                setSuggestions(response.data);
                setShowSuggestions(true);
            } catch (error) {
                console.error('Error getting event suggestions:', error);
            }
        } else {
            setSuggestions(null);
            setShowSuggestions(false);
        }
    };

    const useSuggestions = () => {
        if (suggestions?.eventInfo) {
            const eventInfo = suggestions.eventInfo;
            setFormData(prev => ({
                ...prev,
                startDate: eventInfo.startDate,
                endDate: eventInfo.endDate,
                startTime: eventInfo.startTime,
                endTime: eventInfo.endTime
            }));
            setShowSuggestions(false);
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.eventId) newErrors.eventId = 'Event is required';
        if (!formData.title) newErrors.title = 'Title is required';
        if (!formData.startDate) newErrors.startDate = 'Start date is required';
        if (!formData.endDate) newErrors.endDate = 'End date is required';
        if (!formData.startTime) newErrors.startTime = 'Start time is required';
        if (!formData.endTime) newErrors.endTime = 'End time is required';

        if (formData.startDate && formData.endDate && formData.startDate > formData.endDate) {
            newErrors.endDate = 'End date must be after start date';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }

        try {
            // Helper function to convert HH:MM to HH:MM:SS format
            const formatTime = (time) => {
                if (!time) return time;
                return time.includes(':') && time.split(':').length === 2 ? `${time}:00` : time;
            };

            const surveyDataToSubmit = {
                ...formData,
                startTime: formatTime(formData.startTime),
                endTime: formatTime(formData.endTime),
                sessions: sessionsList.map(session => ({
                    name: session.name,
                    date: session.date,
                    startTime: formatTime(session.startTime),
                    endTime: formatTime(session.endTime),
                    description: session.description,
                    isActive: session.isActive
                })).filter(session => session.name && session.date) // Only include sessions with name and date
            };

            let response;
            if (isEditing) {
                response = await dispatch(surveyUpdate(id, surveyDataToSubmit));
            } else {
                response = await dispatch(surveyCreate(surveyDataToSubmit));
            }

            // Only navigate if the action was successful
            if (response && !response.error) {
                navigate('/surveys');
            }
            // If error occurs, stay on page (backend will handle error display)
        } catch (error) {
            console.error('Error saving survey:', error);
            // Stay on page if error occurs (backend will handle error display)
        }
    };

    const handleNavigate = () => {
        navigate(SURVEY_PATHS.LIST_SURVEYS);
    };

    const addSession = () => {
        const newSession = {
            id: Date.now(),
            name: '',
            date: '',
            startTime: '',
            endTime: '',
            description: '',
            isActive: true
        };
        setSessionsList([...sessionsList, newSession]);
    };

    const removeSession = (sessionId) => {
        setSessionsList(sessionsList.filter(session => session.id !== sessionId));
    };

    const updateSession = (sessionId, field, value) => {
        setSessionsList(sessionsList.map(session => 
            session.id === sessionId ? { ...session, [field]: value } : session
        ));
    };

    const isLoading = createLoading || updateLoading;

    return (
        <>
            <style jsx>{`
                .react-select__menu {
                    z-index: 9999 !important;
                }
                .react-select__menu-portal {
                    z-index: 9999 !important;
                }
                .react-select__control {
                    font-size: 14px;
                }
                .react-select__option {
                    font-size: 14px;
                    padding: 8px 12px;
                }
                .react-select__single-value {
                    font-size: 14px;
                }
            `}</style>
            <Container fluid>
            <div className="row">
                <div className="col-12">
                    <div className="card">
                        <div className="card-header">
                            <div className="d-flex justify-content-between align-items-center">
                                <h4 className="card-title">{isEditing ? 'Edit Survey' : 'Add New Survey'}</h4>
                                <Button variant="secondary" onClick={handleNavigate}>
                                    <i style={{ marginRight: '10px' }} className="fas fa-arrow-left me-2"></i>
                                    Back
                                </Button>
                            </div>
                        </div>
                        <div className="card-body">
                            <form onSubmit={handleSubmit}>
                                <Row>
                                    <Col sm={12}>
                                        <div className="form-group fill" >
                                            <label className="floating-label" style={{ marginTop: '-8px' }} htmlFor="eventId">
                                                Event *
                                            </label>
                                            <Select
                                                value={events?.find(event => event.id === formData.eventId) ? 
                                                    { value: formData.eventId, label: `${events.find(event => event.id === formData.eventId)?.name} - ${events.find(event => event.id === formData.eventId)?.location}` } : null}
                                                onChange={(selectedOption) => handleEventChange(selectedOption?.value || '')}
                                                options={events?.map((event) => ({
                                                    value: event.id,
                                                    label: `${event.name} - ${event.location}`
                                                }))}
                                                placeholder="Select an event"
                                                isClearable
                                                isSearchable
                                                menuPortalTarget={document.body}
                                                menuPosition="fixed"
                                                styles={{
                                                    control: (base) => ({
                                                        ...base,
                                                        minHeight: '45px',
                                                        border: errors.eventId ? '1px solid #dc3545' : '1px solid #ced4da',
                                                        fontSize: '14px'
                                                    }),
                                                    menu: (base) => ({
                                                        ...base,
                                                        zIndex: 9999,
                                                        fontSize: '14px'
                                                    }),
                                                    menuPortal: (base) => ({
                                                        ...base,
                                                        zIndex: 9999
                                                    }),
                                                    option: (base) => ({
                                                        ...base,
                                                        fontSize: '14px',
                                                        padding: '8px 12px',
                                                        whiteSpace: 'nowrap',
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis'
                                                    }),
                                                    singleValue: (base) => ({
                                                        ...base,
                                                        fontSize: '14px',
                                                        whiteSpace: 'nowrap',
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        maxWidth: '100%'
                                                    })
                                                }}
                                            />
                                            {errors.eventId && (
                                                <div className="invalid-feedback d-block">
                                                    {errors.eventId}
                                                </div>
                                            )}
                                        </div>
                                    </Col>
                                </Row>

                                <Row>
                                    <Col sm={12}>
                                        <div className="form-group fill">
                                            <label className="floating-label" htmlFor="title">
                                                Survey Title *
                                            </label>
                                            <input
                                                type="text"
                                                className={`form-control ${errors.title ? 'is-invalid' : ''}`}
                                                name="title"
                                                value={formData.title}
                                                onChange={handleInputChange}
                                                placeholder="Enter survey title"
                                                required
                                            />
                                            {errors.title && (
                                                <div className="invalid-feedback">
                                                    {errors.title}
                                                </div>
                                            )}
                                        </div>
                                    </Col>

                                </Row>

                                {showSuggestions && suggestions && (
                                    <Row>
                                        <Col sm={12}>
                                            <Alert variant="info" className="mb-3">
                                                <Alert.Heading className="h6">
                                                    <i className="feather icon-info mr-2"></i>
                                                    Event Information Suggestions
                                                </Alert.Heading>
                                                <div className="row">
                                                    <div className="col-md-6">
                                                        <p className="mb-1"><strong>Event:</strong> {suggestions.eventInfo.name}</p>
                                                        <p className="mb-1"><strong>Location:</strong> {suggestions.eventInfo.location}</p>
                                                    </div>
                                                    <div className="col-md-6">
                                                        <p className="mb-1"><strong>Date:</strong> {suggestions.eventInfo.startDate} to {suggestions.eventInfo.endDate}</p>
                                                        <p className="mb-1"><strong>Time:</strong> {suggestions.eventInfo.startTime} to {suggestions.eventInfo.endTime}</p>
                                                    </div>
                                                </div>
                                                <Button variant="outline-info" size="sm" onClick={useSuggestions} className="mt-2">
                                                    <i className="feather icon-download mr-1"></i>
                                                    Use Event Information
                                                </Button>
                                            </Alert>
                                        </Col>
                                    </Row>
                                )}

                                <Row>
                                    <Col sm={3}>
                                        <div className="form-group fill">
                                            <label className="floating-label" htmlFor="startDate">
                                                Start Date *
                                            </label>
                                            <input
                                                type="date"
                                                className={`form-control ${errors.startDate ? 'is-invalid' : ''}`}
                                                name="startDate"
                                                value={formData.startDate}
                                                onChange={handleInputChange}
                                                required
                                            />
                                            {errors.startDate && (
                                                <div className="invalid-feedback">
                                                    {errors.startDate}
                                                </div>
                                            )}
                                        </div>
                                    </Col>
                                    <Col sm={3}>
                                        <div className="form-group fill">
                                            <label className="floating-label" htmlFor="startTime">
                                                Start Time *
                                            </label>
                                            <input
                                                type="time"
                                                className={`form-control ${errors.startTime ? 'is-invalid' : ''}`}
                                                name="startTime"
                                                value={formData.startTime}
                                                onChange={handleInputChange}
                                                required
                                            />
                                            {errors.startTime && (
                                                <div className="invalid-feedback">
                                                    {errors.startTime}
                                                </div>
                                            )}
                                        </div>
                                    </Col>
                                    <Col sm={3}>
                                        <div className="form-group fill">
                                            <label className="floating-label" htmlFor="endDate">
                                                End Date *
                                            </label>
                                            <input
                                                type="date"
                                                className={`form-control ${errors.endDate ? 'is-invalid' : ''}`}
                                                name="endDate"
                                                value={formData.endDate}
                                                onChange={handleInputChange}
                                                required
                                            />
                                            {errors.endDate && (
                                                <div className="invalid-feedback">
                                                    {errors.endDate}
                                                </div>
                                            )}
                                        </div>
                                    </Col>
                                    <Col sm={3}>
                                        <div className="form-group fill">
                                            <label className="floating-label" htmlFor="endTime">
                                                End Time *
                                            </label>
                                            <input
                                                type="time"
                                                className={`form-control ${errors.endTime ? 'is-invalid' : ''}`}
                                                name="endTime"
                                                value={formData.endTime}
                                                onChange={handleInputChange}
                                                required
                                            />
                                            {errors.endTime && (
                                                <div className="invalid-feedback">
                                                    {errors.endTime}
                                                </div>
                                            )}
                                        </div>
                                    </Col>
                                </Row>

                                <Row>
                                    <Col sm={6}>
                                        <div className="form-group fill">
                                            <div className="form-check" style={{ marginTop: '25px' }}>
                                                <input
                                                    type="checkbox"
                                                    className="form-check-input"
                                                    name="isActive"
                                                    checked={formData.isActive}
                                                    onChange={handleInputChange}
                                                    id="isActive"
                                                />
                                                <label className="form-check-label" htmlFor="isActive">
                                                    Survey is active
                                                </label>
                                            </div>
                                        </div>
                                    </Col>
                                    <Col sm={6}>
                                        <div className="form-group fill">
                                            <Badge bg="info" className="mb-2">
                                                <span>Sessions </span> {sessionsList.length}/20
                                            </Badge>
                                            <small className="text-muted">
                                                Add survey sessions (optional)
                                            </small>
                                        </div>
                                    </Col>
                                </Row>

                                {/* Sessions Management */}
                                <Row>
                                    <Col sm={12}>
                                        <Card className="mb-3">
                                            <Card.Header className="d-flex justify-content-between align-items-center">
                                                <h6 className="mb-0">
                                                    <i className="feather icon-list mr-2"></i>
                                                    Survey Sessions ({sessionsList.length})
                                                </h6>
                                                <Button
                                                    variant="outline-primary"
                                                    size="sm"
                                                    onClick={addSession}
                                                    disabled={sessionsList.length >= 20}
                                                >
                                                    <i className="feather icon-plus mr-1"></i>
                                                    Add Session
                                                </Button>
                                            </Card.Header>
                                            <Card.Body>
                                                    {sessionsList.map((session, index) => (
                                                        <div key={session.id} className="border rounded p-3 mb-3" style={{ backgroundColor: '#f8f9fa' }}>
                                                            <div className="d-flex justify-content-between align-items-center mb-2">
                                                                <h6 className="mb-0">Session {index + 1}</h6>
                                                                <Button
                                                                    variant="danger"
                                                                    size="sm"
                                                                    onClick={() => removeSession(session.id)}
                                                                >
                                                                    <i className="feather icon-trash-2"></i>
                                                                </Button>
                                                            </div>
                                                            <Row>
                                                                <Col sm={6}>
                                                                    <div className="form-group fill">
                                                                        <label className="floating-label">Session Name</label>
                                                                        <input
                                                                            type="text"
                                                                            className="form-control"
                                                                            value={session.name}
                                                                            onChange={(e) => updateSession(session.id, 'name', e.target.value)}
                                                                            placeholder="Enter session name"
                                                                        />
                                                                    </div>
                                                                </Col>
                                                                <Col sm={3}>
                                                                    <div className="form-group fill">
                                                                        <label className="floating-label">Date</label>
                                                                        <input
                                                                            type="date"
                                                                            className="form-control"
                                                                            value={session.date}
                                                                            onChange={(e) => updateSession(session.id, 'date', e.target.value)}
                                                                        />
                                                                    </div>
                                                                </Col>
                                                                <Col sm={3}>
                                                                    <div className="form-check" style={{ marginTop: '25px' }}>
                                                                        <input
                                                                            type="checkbox"
                                                                            className="form-check-input"
                                                                            checked={session.isActive}
                                                                            onChange={(e) => updateSession(session.id, 'isActive', e.target.checked)}
                                                                            id={`session-active-${session.id}`}
                                                                        />
                                                                        <label className="form-check-label" htmlFor={`session-active-${session.id}`}>
                                                                            Active
                                                                        </label>
                                                                    </div>
                                                                </Col>
                                                                <Col sm={3}>
                                                                    <div className="form-group fill">
                                                                        <label className="floating-label">Start Time</label>
                                                                        <input
                                                                            type="time"
                                                                            className="form-control"
                                                                            value={session.startTime}
                                                                            onChange={(e) => updateSession(session.id, 'startTime', e.target.value)}
                                                                        />
                                                                    </div>
                                                                </Col>
                                                                <Col sm={3}>
                                                                    <div className="form-group fill">
                                                                        <label className="floating-label">End Time</label>
                                                                        <input
                                                                            type="time"
                                                                            className="form-control"
                                                                            value={session.endTime}
                                                                            onChange={(e) => updateSession(session.id, 'endTime', e.target.value)}
                                                                        />
                                                                    </div>
                                                                </Col>
                                                                <Col sm={6}>
                                                                    <div className="form-group fill">
                                                                        <label className="floating-label">Description</label>
                                                                        <textarea
                                                                            className="form-control"
                                                                            value={session.description}
                                                                            onChange={(e) => updateSession(session.id, 'description', e.target.value)}
                                                                            placeholder="Enter session description"
                                                                            rows={2}
                                                                        />
                                                                    </div>
                                                                </Col>
                                                            </Row>
                                                        </div>
                                                    ))}
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                </Row>

                                {/* Form Actions */}
                                <div className="row mt-4">
                                    <div className="col-12">
                                        <div className="d-flex justify-content-between gap-2">
                                            <Button variant="danger" onClick={handleNavigate} disabled={isLoading}>
                                                Cancel
                                            </Button>
                                            <Button variant="primary" type="submit" disabled={isLoading}>
                                                {isLoading ? 'Saving...' : (isEditing ? 'Update Survey' : 'Create Survey')}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
            </Container>
        </>
    );
};

export default AddSurveyPage;
