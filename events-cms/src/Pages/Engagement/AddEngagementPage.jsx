import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Button, Row, Col, Container } from 'react-bootstrap';
import Select from 'react-select';
import { createEngagement, updateEngagement, getEngagementById, getAllEngagements } from '../../store/actions/engagementActions';
import { getAllTracks, getSessionsByTrack } from '../../store/actions/programmeActions';
import { getAllEventsForFilter } from '../../store/actions/eventActions';
import { toast } from 'react-toastify';
import { ENGAGEMENT_PATHS } from '../../utils/constants';

const AddEngagementPage = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { id } = useParams();
    const isEditing = Boolean(id);

    const { selectedEngagement, engagements, loading } = useSelector((state) => state.engagement);
    const { tracks, trackSessions: allTrackSessions } = useSelector((state) => state.programme);

    const [formData, setFormData] = useState({
        isActive: true
    });

    const [selectedEventId, setSelectedEventId] = useState('');
    const [selectedTrackId, setSelectedTrackId] = useState('');
    const [selectedSessionIds, setSelectedSessionIds] = useState([]);
    const [events, setEvents] = useState([]);
    const [loadingEvents, setLoadingEvents] = useState(false);
    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [loadingSessions, setLoadingSessions] = useState(false);

    useEffect(() => {
        const loadEvents = async () => {
            setLoadingEvents(true);
            try {
                const eventsData = await dispatch(getAllEventsForFilter());
                setEvents(eventsData || []);
            } catch (error) {
                console.error('Error loading events:', error);
                setEvents([]);
            } finally {
                setLoadingEvents(false);
            }
        };

        dispatch(getAllTracks());
        dispatch(getAllEngagements());
        loadEvents();
        if (isEditing) {
            dispatch(getEngagementById(id));
        }
    }, [dispatch, isEditing, id]);

    useEffect(() => {
        if (isEditing && selectedEngagement) {
            setFormData({
                isActive: selectedEngagement.isActive !== undefined ? selectedEngagement.isActive : true
            });
            
            // Handle both grouped format (from getEngagementById) and flat format
            // Grouped format has: event, programmeTracks array
            // Flat format has: trackId, track object
            const firstTrack = selectedEngagement.programmeTracks?.[0];
            const event = selectedEngagement.event;
            const trackId = selectedEngagement.trackId || firstTrack?.id || firstTrack?.trackId;
            const eventId = event?.id || selectedEngagement.track?.eventId || selectedEngagement.track?.event?.id;
            
            if (eventId) {
                setSelectedEventId(eventId);
            }
            if (trackId) {
                setSelectedTrackId(trackId);
            }

            // Set session IDs if they exist - check both locations
            if (selectedEngagement.sessionIds) {
                setSelectedSessionIds(selectedEngagement.sessionIds);
            } else if (firstTrack?.sessionIds) {
                setSelectedSessionIds(firstTrack.sessionIds);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isEditing, selectedEngagement]);

    const handleInputChange = (e) => {
        const { name, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : e.target.value
        }));
        
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const handleEventChange = (eventId) => {
        setSelectedEventId(eventId || '');
        // Only reset track selection when event changes in add mode, not in edit mode
        if (!isEditing) {
            setSelectedTrackId('');
        }
        if (errors.eventId) {
            setErrors(prev => ({ ...prev, eventId: '' }));
        }
        if (errors.trackId) {
            setErrors(prev => ({ ...prev, trackId: '' }));
        }
    };

    const handleTrackChange = (trackId) => {
        setSelectedTrackId(trackId || '');
        setSelectedSessionIds([]); // Reset session selection when track changes
        if (errors.trackId) {
            setErrors(prev => ({ ...prev, trackId: '' }));
        }
        if (errors.sessionIds) {
            setErrors(prev => ({ ...prev, sessionIds: '' }));
        }
    };

    // Load sessions when track is selected
    useEffect(() => {
        const loadSessions = async () => {
            if (selectedTrackId) {
                setLoadingSessions(true);
                try {
                    await dispatch(getSessionsByTrack(selectedTrackId));
                } catch (error) {
                    console.error('Error loading sessions:', error);
                } finally {
                    setLoadingSessions(false);
                }
            }
        };
        loadSessions();
    }, [dispatch, selectedTrackId]);

    const validateForm = () => {
        const newErrors = {};

        if (!selectedEventId) {
            newErrors.eventId = 'Please select an event';
        }

        if (!selectedTrackId) {
            newErrors.trackId = 'Please select a programme track';
        }

        if (!selectedSessionIds || selectedSessionIds.length === 0) {
            newErrors.sessionIds = 'Please select at least one session';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            toast.error('Please fix the validation errors');
            return;
        }

        setSubmitting(true);

        try {
            const payload = {
                ...formData,
                sessionIds: selectedSessionIds
            };

            // Only include trackId for create or if it changed in edit
            if (!isEditing) {
                payload.trackId = selectedTrackId;
            } else if (selectedEngagement) {
                // Get existing trackId from either flat or nested format
                const existingTrackId = selectedEngagement.trackId || selectedEngagement.programmeTracks?.[0]?.id || selectedEngagement.programmeTracks?.[0]?.trackId;
                if (selectedTrackId !== existingTrackId) {
                    payload.trackId = selectedTrackId;
                }
            }

            let result;
            if (isEditing) {
                result = await dispatch(updateEngagement(id, payload));
            } else {
                result = await dispatch(createEngagement(payload));
            }

            if (result.success) {
                navigate(ENGAGEMENT_PATHS.LIST_ENGAGEMENTS);
            }
        } catch (error) {
            console.error('Error saving engagement:', error);
        } finally {
            setSubmitting(false);
        }
    };

    const handleNavigate = () => {
        navigate(ENGAGEMENT_PATHS.LIST_ENGAGEMENTS);
    };

    // Get list of track IDs that already have engagements (excluding current one if editing)
    const usedTrackIds = engagements
        ?.filter(engagement => !isEditing || engagement.id !== id)
        .map(engagement => engagement.trackId) || [];

    // Filter out tracks that already have engagements
    const availableTracks = tracks?.filter(track => !usedTrackIds.includes(track.id)) || [];

    // If editing, include the current track even if it has an engagement
    const displayTracks = isEditing && selectedEngagement?.trackId
        ? [...availableTracks, tracks?.find(t => t.id === selectedEngagement.trackId)].filter(Boolean)
        : availableTracks;

    // Filter tracks by selected event
    const filteredTracks = selectedEventId
        ? displayTracks.filter(track => track.event?.id === selectedEventId)
        : displayTracks;

    // Create track options for select dropdown (simple list, not grouped since we filter by event)
    const trackOptions = filteredTracks
        .map(track => ({
            value: track.id,
            label: track.title
        }))
        .sort((a, b) => a.label.localeCompare(b.label));

    // Find selected track option
    const selectedTrackOption = trackOptions.find(option => option.value === selectedTrackId);

    // Create event options for select dropdown
    const eventOptions = events
        .map(event => ({
            value: event.id,
            label: event.name
        }))
        .sort((a, b) => a.label.localeCompare(b.label));

    const selectedEventOption = eventOptions.find(option => option.value === selectedEventId);

    // Get sessions for the selected track - only active sessions
    const trackSessions = selectedTrackId && allTrackSessions[selectedTrackId] ? allTrackSessions[selectedTrackId] : [];
    const activeSessions = trackSessions.filter(session => session.isActive !== false); // Filter only active sessions
    const sessionOptions = activeSessions
        .map(session => ({
            value: session.id,
            label: `${session.title}${session.sessionDate ? ` - ${new Date(session.sessionDate).toLocaleDateString()}` : ''}`
        }))
        .sort((a, b) => a.label.localeCompare(b.label));

    const selectedSessionOptions = sessionOptions.filter(option => selectedSessionIds.includes(option.value));

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
                                        {isEditing ? 'Edit Engagement' : 'Add New Engagement'}
                                    </h4>
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
                                            <div className="form-group fill">
                                                <label className="floating-label" 
                                                style={{ marginTop: '-8px' }}
                                                htmlFor="eventId">
                                                    Event <span className="text-danger">*</span>
                                                </label>
                                                <Select
                                                    options={eventOptions}
                                                    value={selectedEventOption}
                                                    onChange={(option) => handleEventChange(option?.value)}
                                                    placeholder="Select Event..."
                                                    isClearable
                                                    isSearchable
                                                    isDisabled={loadingEvents}
                                                    isLoading={loadingEvents}
                                                    className={errors.eventId ? 'is-invalid' : ''}
                                                    styles={{
                                                        control: (base) => ({
                                                            ...base,
                                                            fontSize: '14px',
                                                            borderColor: errors.eventId ? '#dc3545' : base.borderColor,
                                                        }),
                                                        menu: (base) => ({
                                                            ...base,
                                                            zIndex: 9999
                                                        })
                                                    }}
                                                />
                                                {errors.eventId && (
                                                    <small className="text-danger">{errors.eventId}</small>
                                                )}
                                                <small className="form-text text-muted">
                                                    Select an event to view its programme tracks
                                                </small>
                                            </div>
                                        </Col>

                                        <Col sm={12}>
                                            <div className="form-group fill">
                                                <label className="floating-label" 
                                                style={{ marginTop: '-8px' }}
                                                htmlFor="trackId">
                                                    Programme Track <span className="text-danger">*</span>
                                                </label>
                                                <Select
                                                    options={trackOptions}
                                                    value={selectedTrackOption}
                                                    onChange={(option) => handleTrackChange(option?.value)}
                                                    placeholder={selectedEventId ? "Select Programme Track..." : "Please select an event first"}
                                                    isClearable
                                                    isSearchable
                                                    isDisabled={!selectedEventId}
                                                    className={errors.trackId ? 'is-invalid' : ''}
                                                    styles={{
                                                        control: (base) => ({
                                                            ...base,
                                                            fontSize: '14px',
                                                            borderColor: errors.trackId ? '#dc3545' : base.borderColor,
                                                        }),
                                                        menu: (base) => ({
                                                            ...base,
                                                            zIndex: 9999
                                                        })
                                                    }}
                                                />
                                                {errors.trackId && (
                                                    <small className="text-danger">{errors.trackId}</small>
                                                )}
                                                <small className="form-text text-muted">
                                                    {selectedEventId 
                                                        ? "Only tracks without existing engagements are shown"
                                                        : "Select an event first to view available tracks"
                                                    }
                                                </small>
                                            </div>
                                        </Col>

                                        <Col sm={12}>
                                            <div className="form-group fill">
                                                <label className="floating-label" 
                                                style={{ marginTop: '-8px' }}
                                                htmlFor="sessionIds">
                                                    Sessions <span className="text-danger">*</span>
                                                </label>
                                                <Select
                                                    options={sessionOptions}
                                                    value={selectedSessionOptions}
                                                    onChange={(options) => {
                                                        const newSessionIds = options ? options.map(opt => opt.value) : [];
                                                        setSelectedSessionIds(newSessionIds);
                                                        if (errors.sessionIds && newSessionIds.length > 0) {
                                                            setErrors(prev => ({ ...prev, sessionIds: '' }));
                                                        }
                                                    }}
                                                    placeholder={selectedTrackId ? "Select Sessions..." : "Please select a track first"}
                                                    isSearchable
                                                    isMulti
                                                    isDisabled={!selectedTrackId || loadingSessions}
                                                    isLoading={loadingSessions}
                                                    className={errors.sessionIds ? 'is-invalid' : ''}
                                                    styles={{
                                                        control: (base) => ({
                                                            ...base,
                                                            fontSize: '14px',
                                                            borderColor: errors.sessionIds ? '#dc3545' : base.borderColor,
                                                        }),
                                                        menu: (base) => ({
                                                            ...base,
                                                            zIndex: 9999
                                                        })
                                                    }}
                                                />
                                                {errors.sessionIds && (
                                                    <small className="text-danger">{errors.sessionIds}</small>
                                                )}
                                                <small className="form-text text-muted">
                                                    {selectedTrackId 
                                                        ? "Select at least one session for this engagement (required)"
                                                        : "Select a track first to view available sessions"
                                                    }
                                                </small>
                                            </div>
                                        </Col>

                                        <Col sm={12}>
                                            <div className="form-group">
                                                <div className="checkbox d-inline">
                                                    <input
                                                        type="checkbox"
                                                        name="isActive"
                                                        id="isActive"
                                                        checked={formData.isActive}
                                                        onChange={handleInputChange}
                                                        style={{ marginRight: '8px' }}
                                                    />
                                                    <label htmlFor="isActive" className="cr">
                                                        Active
                                                    </label>
                                                </div>
                                                <small className="form-text text-muted d-block mt-2">
                                                    Check this to make the engagement active
                                                </small>
                                            </div>
                                        </Col>
                                    </Row>

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
                                                    disabled={submitting}
                                                >
                                                    {submitting ? 'Saving...' : (isEditing ? 'Update' : 'Create')}
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

export default AddEngagementPage;
