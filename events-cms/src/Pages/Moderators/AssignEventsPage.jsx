import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Button, Row, Col, Container, Badge, Alert } from 'react-bootstrap';
import Select from 'react-select';
import { getModeratorById, assignModeratorToMultipleEvents, getModeratorEvents } from '../../store/actions/moderatorActions';
import * as eventActions from '../../store/actions/eventActions';
import { toast } from 'react-toastify';
import axiosInstance from '../../configs/axiosInstance';

const AssignEventsPage = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { id } = useParams();

    const { selectedModerator } = useSelector((state) => state.moderator);
    const { event: events } = useSelector((state) => state.event);

    const [selectedEventIds, setSelectedEventIds] = useState([]);
    const [selectedEventId, setSelectedEventId] = useState(null);
    const [selectedTrackId, setSelectedTrackId] = useState(null);
    const [selectedSessionId, setSelectedSessionId] = useState(null);
    const [tracks, setTracks] = useState([]);
    const [sessions, setSessions] = useState([]);
    const [loadingTracks, setLoadingTracks] = useState(false);
    const [loadingSessions, setLoadingSessions] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [currentAssignedEvents, setCurrentAssignedEvents] = useState([]);

    useEffect(() => {
        if (id) {
            console.log('Loading moderator data for ID:', id);
            dispatch(getModeratorById(id));
            dispatch(getModeratorEvents(id));
        }
        dispatch(eventActions.eventList());
    }, [dispatch, id]);

    useEffect(() => {
        console.log('Selected moderator data:', selectedModerator);
        if (selectedModerator && selectedModerator.assignments) {
            const assignedEventIds = selectedModerator.assignments.map(assignment => assignment.eventId);
            setCurrentAssignedEvents(assignedEventIds);
            setSelectedEventIds(assignedEventIds);
        }
    }, [selectedModerator]);

    // Fetch tracks for selected event
    const fetchTracks = async (eventId) => {
        if (!eventId) {
            setTracks([]);
            setSessions([]);
            setSelectedTrackId(null);
            setSelectedSessionId(null);
            return;
        }

        setLoadingTracks(true);
        try {
            const response = await axiosInstance.get(`/programme/events/${eventId}/tracks`);
            if (response.data.success) {
                setTracks(response.data.data);
            } else {
                setTracks([]);
            }
        } catch (error) {
            console.error('Error fetching tracks:', error);
            setTracks([]);
            toast.error('Failed to fetch tracks');
        } finally {
            setLoadingTracks(false);
        }
    };

    // Fetch sessions for selected track
    const fetchSessions = async (trackId) => {
        if (!trackId) {
            setSessions([]);
            setSelectedSessionId(null);
            return;
        }

        setLoadingSessions(true);
        try {
            const response = await axiosInstance.get(`/programme/tracks/${trackId}/sessions`);
            if (response.data.success) {
                setSessions(response.data.data);
            } else {
                setSessions([]);
            }
        } catch (error) {
            console.error('Error fetching sessions:', error);
            setSessions([]);
            toast.error('Failed to fetch sessions');
        } finally {
            setLoadingSessions(false);
        }
    };

    const handleEventChange = (selectedOption) => {
        setSelectedEventId(selectedOption ? selectedOption.value : null);
        setSelectedTrackId(null);
        setSelectedSessionId(null);
        setTracks([]);
        setSessions([]);
        
        if (selectedOption) {
            fetchTracks(selectedOption.value);
        }
    };

    const handleTrackChange = (selectedOption) => {
        setSelectedTrackId(selectedOption ? selectedOption.value : null);
        setSelectedSessionId(null);
        setSessions([]);
        
        if (selectedOption) {
            fetchSessions(selectedOption.value);
        }
    };

    const handleSessionChange = (selectedOption) => {
        setSelectedSessionId(selectedOption ? selectedOption.value : null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!selectedEventId) {
            toast.error('Please select an event');
            return;
        }

        // Debug: Log the moderator ID
        console.log('Moderator ID from URL:', id);
        console.log('Selected Event ID:', selectedEventId);
        console.log('Selected Track ID:', selectedTrackId);
        console.log('Selected Session ID:', selectedSessionId);

        // Validate moderator ID format
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(id)) {
            toast.error('Invalid moderator ID format');
            console.error('Invalid moderator ID:', id);
            return;
        }

        setSubmitting(true);

        try {
            let result;
            
            if (selectedSessionId) {
                // Assign to specific session
                result = await axiosInstance.post('/moderators/assign-session', {
                    moderatorId: id,
                    eventId: selectedEventId,
                    trackId: selectedTrackId,
                    sessionId: selectedSessionId
                });
            } else if (selectedTrackId) {
                // Assign to track
                result = await axiosInstance.post('/moderators/assign-event', {
                    moderatorId: id,
                    eventId: selectedEventId,
                    trackId: selectedTrackId
                });
            } else {
                // Assign to event only
                result = await axiosInstance.post('/moderators/assign-event', {
                    moderatorId: id,
                    eventId: selectedEventId
                });
            }
            
            if (result.data.success) {
                toast.success('Moderator assigned successfully!');
                navigate('/moderators');
            } else {
                toast.error(result.data.message || 'Failed to assign moderator');
            }
        } catch (error) {
            console.error('Error assigning moderator:', error);
            const errorMessage = error.response?.data?.message || 'Failed to assign moderator';
            toast.error(errorMessage);
        } finally {
            setSubmitting(false);
        }
    };

    const handleNavigate = () => {
        navigate('/moderators');
    };

    // Create options for dropdowns
    const eventList = events?.events || [];
    const eventOptions = eventList.map(event => ({
        value: event.id,
        label: event.name
    }));

    const trackOptions = tracks.map(track => ({
        value: track.id,
        label: track.title
    }));

    const sessionOptions = sessions.map(session => ({
        value: session.id,
        label: session.title
    }));

    const selectedEventOption = eventOptions.find(option => option.value === selectedEventId);
    const selectedTrackOption = trackOptions.find(option => option.value === selectedTrackId);
    const selectedSessionOption = sessionOptions.find(option => option.value === selectedSessionId);

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
            `}</style>
            <Container fluid>
                <div className="row">
                    <div className="col-12">
                        <div className="card">
                            <div className="card-header">
                                <div className="d-flex justify-content-between align-items-center">
                                    <h4 className="card-title">
                                        Assign Events to Moderator
                                    </h4>
                                    <Button variant="secondary" onClick={handleNavigate}>
                                        <i style={{ marginRight: '10px' }} className="fas fa-arrow-left me-2"></i>
                                        Back
                                    </Button>
                                </div>
                            </div>
                            <div className="card-body">
                                {selectedModerator && (
                                    <div className="mb-4 p-3 bg-light rounded">
                                        <h6 className="mb-2">
                                            <i className="feather icon-user mr-2"></i>
                                            Moderator: <strong>{selectedModerator.name}</strong>
                                        </h6>
                                        <p className="mb-0 text-muted">
                                            <i className="feather icon-mail mr-2"></i>
                                            {selectedModerator.email}
                                        </p>
                                        {currentAssignedEvents.length > 0 && (
                                            <p className="mb-0 mt-2">
                                                <Badge bg="info">
                                                    Currently assigned to {currentAssignedEvents.length} event(s)
                                                </Badge>
                                            </p>
                                        )}
                                    </div>
                                )}

                                <form onSubmit={handleSubmit}>
                                    <Row>
                                        <Col sm={12}>
                                            <Alert variant="info" className="mb-4">
                                                <i className="fas fa-info-circle me-2"></i>
                                                <strong>Assignment Levels:</strong> You can assign moderators to entire events, specific tracks, or individual sessions. 
                                                Select an event first, then optionally choose a track and session for more specific assignments.
                                            </Alert>
                                        </Col>
                                    </Row>

                                    <Row>
                                        <Col sm={12}>
                                            <div className="form-group fill">
                                                <label className="floating-label" 
                                                style={{ marginTop: '-8px' }}
                                                htmlFor="event">
                                                    Select Event <span className="text-danger">*</span>
                                                </label>
                                                <Select
                                                    options={eventOptions}
                                                    value={selectedEventOption}
                                                    onChange={handleEventChange}
                                                    placeholder="Select an event..."
                                                    isSearchable
                                                    styles={{
                                                        control: (base) => ({
                                                            ...base,
                                                            fontSize: '14px',
                                                        }),
                                                        menu: (base) => ({
                                                            ...base,
                                                            zIndex: 9999
                                                        })
                                                    }}
                                                />
                                                <small className="form-text text-muted">
                                                    Choose the event for this moderator assignment
                                                </small>
                                            </div>
                                        </Col>
                                    </Row>

                                    {selectedEventId && (
                                        <Row>
                                            <Col sm={12}>
                                                <div className="form-group fill">
                                                    <label className="floating-label" 
                                                    style={{ marginTop: '-8px' }}
                                                    htmlFor="track">
                                                        Select Track <span className="text-muted">(Optional)</span>
                                                    </label>
                                                    <Select
                                                        options={trackOptions}
                                                        value={selectedTrackOption}
                                                        onChange={handleTrackChange}
                                                        placeholder={loadingTracks ? "Loading tracks..." : "Select a track..."}
                                                        isSearchable
                                                        isLoading={loadingTracks}
                                                        isDisabled={loadingTracks}
                                                        styles={{
                                                            control: (base) => ({
                                                                ...base,
                                                                fontSize: '14px',
                                                            }),
                                                            menu: (base) => ({
                                                                ...base,
                                                                zIndex: 9999
                                                            })
                                                        }}
                                                    />
                                                    <small className="form-text text-muted">
                                                        Choose a specific track within the event (optional)
                                                    </small>
                                                </div>
                                            </Col>
                                        </Row>
                                    )}

                                    {selectedTrackId && (
                                        <Row>
                                            <Col sm={12}>
                                                <div className="form-group fill">
                                                    <label className="floating-label" 
                                                    style={{ marginTop: '-8px' }}
                                                    htmlFor="session">
                                                        Select Session <span className="text-muted">(Optional)</span>
                                                    </label>
                                                    <Select
                                                        options={sessionOptions}
                                                        value={selectedSessionOption}
                                                        onChange={handleSessionChange}
                                                        placeholder={loadingSessions ? "Loading sessions..." : "Select a session..."}
                                                        isSearchable
                                                        isLoading={loadingSessions}
                                                        isDisabled={loadingSessions}
                                                        styles={{
                                                            control: (base) => ({
                                                                ...base,
                                                                fontSize: '14px',
                                                            }),
                                                            menu: (base) => ({
                                                                ...base,
                                                                zIndex: 9999
                                                            })
                                                        }}
                                                    />
                                                    <small className="form-text text-muted">
                                                        Choose a specific session within the track (optional)
                                                    </small>
                                                </div>
                                            </Col>
                                        </Row>
                                    )}

                                    {/* Assignment Summary */}
                                    {selectedEventId && (
                                        <Row>
                                            <Col sm={12}>
                                                <div className="alert alert-success">
                                                    <h6><i className="fas fa-check-circle me-2"></i>Assignment Summary:</h6>
                                                    <p className="mb-1">
                                                        <strong>Event:</strong> {selectedEventOption?.label}
                                                    </p>
                                                    {selectedTrackOption && (
                                                        <p className="mb-1">
                                                            <strong>Track:</strong> {selectedTrackOption.label}
                                                        </p>
                                                    )}
                                                    {selectedSessionOption && (
                                                        <p className="mb-0">
                                                            <strong>Session:</strong> {selectedSessionOption.label}
                                                        </p>
                                                    )}
                                                </div>
                                            </Col>
                                        </Row>
                                    )}

                                    <Row>
                                        <Col sm={12}>
                                            <div className="d-flex justify-content-between gap-2 mt-4">
                                                <Button 
                                                    variant="danger" 
                                                    onClick={handleNavigate}
                                                    disabled={submitting}
                                                >
                                                    Cancel
                                                </Button>
                                                <Button 
                                                    variant="primary" 
                                                    type="submit"
                                                    disabled={submitting || !selectedEventId}
                                                >
                                                    {submitting ? 'Assigning...' : 'Assign Moderator'}
                                                </Button>
                                            </div>
                                        </Col>
                                    </Row>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </Container>
        </>
    );
};

export default AssignEventsPage;

