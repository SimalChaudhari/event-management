import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Button, Row, Col, Container } from 'react-bootstrap';
import Select from 'react-select';
import { createEngagement, updateEngagement, getEngagementById, getEngagementsByEvent, getAllEngagements } from '../../store/actions/engagementActions';
import { getTracksByEvent, getSessionsByTrack, getAllTracks } from '../../store/actions/programmeActions';
import { getAllEventsForFilter } from '../../store/actions/eventActions';
import { toast } from 'react-toastify';
import { ENGAGEMENT_PATHS } from '../../utils/constants';
import store from '../../store/store';
import useTableNavigation from '../../hooks/useTableNavigation';

const AddEngagementPage = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const location = useLocation();
    const { id } = useParams();
    const isEditing = Boolean(id);

    const { selectedEngagement, loading, engagements } = useSelector((state) => state.engagement);
    const { tracks, trackSessions: allTrackSessions } = useSelector((state) => state.programme);
    
    const previousPageRef = React.useRef(null);
    const originalDisplayOrderRef = React.useRef(null);
    
    const { handleBack: handleBackNavigation } = useTableNavigation({
        tableRef: null,
        listPath: ENGAGEMENT_PATHS.LIST_ENGAGEMENTS,
        viewPath: ENGAGEMENT_PATHS.VIEW_ENGAGEMENT,
        editPath: ENGAGEMENT_PATHS.EDIT_ENGAGEMENT,
        addPath: ENGAGEMENT_PATHS.ADD_ENGAGEMENT
    });

    const [formData, setFormData] = useState({
        isActive: true
    });

    const [selectedEventId, setSelectedEventId] = useState('');
    const [selectedTrackId, setSelectedTrackId] = useState('');
    const [selectedSessionIds, setSelectedSessionIds] = useState([]);
    const [events, setEvents] = useState([]);
    const [eventsWithTracks, setEventsWithTracks] = useState([]); // Filtered events that have tracks
    const [usedTrackIds, setUsedTrackIds] = useState([]); // Track IDs that already have engagements
    const [loadingEvents, setLoadingEvents] = useState(false);
    const [loadingTracks, setLoadingTracks] = useState(false);
    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [loadingSessions, setLoadingSessions] = useState(false);

    // Store previous page from URL
    useEffect(() => {
        const params = new URLSearchParams(location.search || window.location.search);
        const pageParam = params.get('page');
        if (pageParam) {
            previousPageRef.current = parseInt(pageParam, 10);
        } else if (location.state?.page) {
            previousPageRef.current = location.state.page;
        }
    }, [location.search, location.state, id]);

    // Helper function to flatten engagements and calculate target page
    const calculateEngagementTargetPage = React.useCallback(async (engagementId, isCreate = false) => {
        // Always fetch fresh data to ensure we have the latest engagements
        // This is especially important for create, but also needed for update to get correct sorting
        await dispatch(getAllEngagements());
        
        // Get current engagements from Redux store directly (after refresh)
        const currentEngagements = store.getState().engagement?.engagements || [];
        
        // Flatten the grouped data (same logic as in EngagementList)
        const flattenedData = [];
        currentEngagements.forEach(eventGroup => {
            if (eventGroup.event && eventGroup.programmeTracks && eventGroup.programmeTracks.length > 0) {
                eventGroup.programmeTracks.forEach((track, index) => {
                    if (track.engagementId) {
                        flattenedData.push({
                            engagementId: track.engagementId,
                            displayOrder: typeof track.displayOrder === 'number' ? track.displayOrder : index,
                            createdAt: track.createdAt || new Date().toISOString()
                        });
                    }
                });
            }
        });
        
        // Sort by displayOrder then createdAt (same as table)
        flattenedData.sort((a, b) => {
            const orderA = Number.isFinite(a.displayOrder) ? a.displayOrder : Number.MAX_SAFE_INTEGER;
            const orderB = Number.isFinite(b.displayOrder) ? b.displayOrder : Number.MAX_SAFE_INTEGER;
            if (orderA !== orderB) {
                return orderA - orderB;
            }
            const createdA = new Date(a.createdAt).getTime();
            const createdB = new Date(b.createdAt).getTime();
            return createdA - createdB;
        });
        
        // Find the position of the engagement
        const engagementIndex = flattenedData.findIndex(item => 
            String(item.engagementId) === String(engagementId)
        );
        
        if (engagementIndex === -1) {
            // If not found, return to previous page or page 1
            return previousPageRef.current || 1;
        }
        
        // Calculate page number (pageLength is 10)
        const pageNumber = Math.floor(engagementIndex / 10) + 1;
        return pageNumber;
    }, [dispatch]);

    // Track if events have been loaded to prevent duplicate calls
    const eventsLoadedRef = React.useRef(false);

    // Load events and filter to show only future/upcoming events (all future events)
    useEffect(() => {
        // Only load events once on mount, not on every render
        if (eventsLoadedRef.current) {
            return;
        }

        const loadEvents = async () => {
            setLoadingEvents(true);
            try {
                // Load all events
                const eventsData = await dispatch(getAllEventsForFilter());
                console.log("eventsData", eventsData);
                
                // Ensure eventsData is an array
                const eventsArray = Array.isArray(eventsData) ? eventsData : [];
                
                // Log first event structure to understand the data format
                if (eventsArray.length > 0) {
                    console.log("First event structure:", eventsArray[0]);
                    console.log("First event keys:", Object.keys(eventsArray[0]));
                }
                
                setEvents(eventsArray);
                
                // Filter events to show only future/upcoming events (all future events, not just those with tracks)
                const today = new Date();
                today.setHours(0, 0, 0, 0); // Set to start of day for accurate comparison
                
                const filteredEvents = eventsArray.filter(event => {
                    // Check for startDate in different possible field names
                    const eventStartDate = event.startDate || event.eventStartDate || event.start_date;
                    
                    if (!eventStartDate) {
                        // If no startDate found, include it (might be a data issue, but don't exclude all)
                        console.log('Event has no startDate field:', event.id, event.name || event.eventName);
                        return true; // Include events without date to avoid filtering everything out
                    }
                    
                    try {
                        // Parse the event start date - handle different date formats
                        let eventDate;
                        if (typeof eventStartDate === 'string') {
                            // Handle ISO string format (e.g., "2024-12-25" or "2024-12-25T00:00:00.000Z")
                            eventDate = new Date(eventStartDate.split('T')[0]); // Get date part only
                        } else if (eventStartDate instanceof Date) {
                            eventDate = new Date(eventStartDate);
                        } else {
                            // Try to parse as date
                            eventDate = new Date(eventStartDate);
                        }
                        
                        // Check if date is valid
                        if (isNaN(eventDate.getTime())) {
                            console.warn('Invalid date for event:', event.id, event.name || event.eventName, eventStartDate);
                            return true; // Include events with invalid dates (don't exclude)
                        }
                        
                        eventDate.setHours(0, 0, 0, 0); // Set to start of day for accurate comparison
                        
                        // Only include events where startDate is today or in the future
                        return eventDate >= today;
                    } catch (error) {
                        console.warn('Error parsing date for event:', event.id, event.name || event.eventName, error);
                        return true; // Include events with date parsing errors (don't exclude)
                    }
                });
                
                console.log("filteredEvents", filteredEvents);
                console.log("filteredEvents length", filteredEvents.length);
                setEventsWithTracks(filteredEvents);
                eventsLoadedRef.current = true;
            } catch (error) {
                console.error('Error loading events:', error);
                setEvents([]);
                setEventsWithTracks([]);
            } finally {
                setLoadingEvents(false);
            }
        };

        loadEvents();
        if (isEditing) {
            dispatch(getEngagementById(id));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Only run once on mount

    // Track last loaded event to prevent duplicate calls
    const lastLoadedEventIdRef = React.useRef(null);

    // Load tracks and engagements when event is selected (on-demand loading)
    useEffect(() => {
        const loadEventData = async () => {
            if (!selectedEventId) {
                // Clear tracks and used track IDs when no event is selected
                setUsedTrackIds([]);
                lastLoadedEventIdRef.current = null;
                return;
            }

            // Skip if we already loaded data for this event
            if (lastLoadedEventIdRef.current === selectedEventId) {
                return;
            }

            setLoadingTracks(true);
            try {
                // Load tracks for the selected event
                await dispatch(getTracksByEvent(selectedEventId));
                
                // Load engagements for the selected event to check which tracks are used
                const engagementResult = await dispatch(getEngagementsByEvent(selectedEventId));
                if (engagementResult?.success) {
                    setUsedTrackIds(engagementResult.data || []);
                }
                lastLoadedEventIdRef.current = selectedEventId;
            } catch (error) {
                console.error('Error loading event data:', error);
                setUsedTrackIds([]);
            } finally {
                setLoadingTracks(false);
            }
        };

        loadEventData();
    }, [dispatch, selectedEventId]);

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
                
                // Ensure the current event is included in eventsWithTracks if editing
                // (in case it's not in the filtered list for some reason)
                if (event && !eventsWithTracks.find(e => e.id === eventId)) {
                    setEventsWithTracks(prev => {
                        const exists = prev.find(e => e.id === eventId);
                        if (!exists) {
                            return [...prev, event].sort((a, b) => {
                                const nameA = a.name || '';
                                const nameB = b.name || '';
                                return nameA.localeCompare(nameB);
                            });
                        }
                        return prev;
                    });
                }
            }
            if (trackId) {
                setSelectedTrackId(trackId);
            }

            // Store original displayOrder for comparison
            const originalDisplayOrder = firstTrack?.displayOrder ?? selectedEngagement.displayOrder ?? null;
            originalDisplayOrderRef.current = originalDisplayOrder;

            // Set session IDs if they exist - check both locations
            if (selectedEngagement.sessionIds) {
                setSelectedSessionIds(selectedEngagement.sessionIds);
            } else if (firstTrack?.sessionIds) {
                setSelectedSessionIds(firstTrack.sessionIds);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isEditing, selectedEngagement, eventsWithTracks]);

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
        // Reset track and session selection when event changes
        setSelectedTrackId('');
        setSelectedSessionIds([]);
        if (errors.eventId) {
            setErrors(prev => ({ ...prev, eventId: '' }));
        }
        if (errors.trackId) {
            setErrors(prev => ({ ...prev, trackId: '' }));
        }
        if (errors.sessionIds) {
            setErrors(prev => ({ ...prev, sessionIds: '' }));
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

            const getReturnPage = () => {
                const params = new URLSearchParams(location.search || window.location.search);
                return params.get('page') || location.state?.page || previousPageRef.current;
            };

            if (isEditing) {
                const result = await dispatch(updateEngagement(id, payload));
                if (result?.success) {
                    const updatedEngagementId = result?.data?.id ? String(result.data.id) : String(id);
                    
                    // Calculate target page to navigate to where the engagement appears
                    // This calls getAllEngagements to get fresh data for accurate page calculation
                    const pageNumber = await calculateEngagementTargetPage(updatedEngagementId, false);
                    // Navigate with a flag to skip initial data fetch in EngagementList (data already fresh)
                    navigate(`${ENGAGEMENT_PATHS.LIST_ENGAGEMENTS}?page=${pageNumber}`, { 
                        state: { skipInitialFetch: true }
                    });
                }
            } else {
                const result = await dispatch(createEngagement(payload));
                if (result?.success) {
                    const createdEngagementId = result?.data?.id
                        ? String(result.data.id)
                        : null;

                    // Reset form
                    setFormData({ isActive: true });
                    setSelectedEventId('');
                    setSelectedTrackId('');
                    setSelectedSessionIds([]);

                    // Navigate to page 1 after create
                    // Fetch engagements once here, then EngagementList will skip fetching
                    await dispatch(getAllEngagements());
                    navigate(`${ENGAGEMENT_PATHS.LIST_ENGAGEMENTS}?page=1`, { 
                        state: { skipInitialFetch: true }
                    });
                }
            }
        } catch (error) {
            console.error('Error saving engagement:', error);
        } finally {
            setSubmitting(false);
        }
    };

    const getReturnPage = () => {
        const params = new URLSearchParams(location.search || window.location.search);
        return params.get('page') || location.state?.page || previousPageRef.current;
    };

    const handleCancel = () => {
        const targetPage = getReturnPage();
        handleBackNavigation(targetPage);
    };

    // Filter out tracks that already have engagements (excluding current one if editing)
    const currentTrackId = selectedEngagement?.trackId || selectedEngagement?.programmeTracks?.[0]?.id || selectedEngagement?.programmeTracks?.[0]?.trackId;
    const filteredUsedTrackIds = isEditing && currentTrackId
        ? usedTrackIds.filter(trackId => trackId !== currentTrackId)
        : usedTrackIds;

    // Filter tracks: Since getTracksByEvent already returns tracks for the selected event,
    // we only need to filter out tracks that already have engagements
    // All tracks in Redux are already for the selected event, so just filter by used tracks
    const availableTracks = tracks?.filter(track => 
        !filteredUsedTrackIds.includes(track.id)
    ) || [];

    // If editing, include the current track even if it has an engagement
    const displayTracks = isEditing && currentTrackId
        ? [...availableTracks, tracks?.find(t => t.id === currentTrackId)].filter(Boolean)
        : availableTracks;

    // Tracks are already filtered
    const filteredTracks = displayTracks;

    // Check if all tracks are full (have engagements)
    const allTracksForEvent = tracks || [];
    const totalTracksCount = allTracksForEvent.length;
    const usedTracksCount = filteredUsedTrackIds.length;
    const allTracksFull = totalTracksCount > 0 && usedTracksCount >= totalTracksCount && !isEditing;

    // Create track options for select dropdown (simple list, not grouped since we filter by event)
    let trackOptions = [];
    if (allTracksFull) {
        // Show message when all tracks are full
        trackOptions = [{
            value: '',
            label: 'All tracks are full - No available tracks',
            isDisabled: true
        }];
    } else {
        trackOptions = filteredTracks
            .map(track => ({
                value: track.id,
                label: track.title || track.name || 'Untitled Track'
            }))
            .filter(option => option.value) // Filter out any invalid options
            .sort((a, b) => {
                const labelA = a.label || '';
                const labelB = b.label || '';
                return labelA.localeCompare(labelB);
            });
    }

    // Find selected track option
    const selectedTrackOption = trackOptions.find(option => option.value === selectedTrackId);

    // Create event options for select dropdown (all future events)
    console.log("eventsWithTracks", eventsWithTracks);
    const eventOptions = eventsWithTracks
        .map(event => ({
            value: event.id,
            label: event.name || event.eventName || 'Untitled Event'
        }))
        .filter(option => option.value) // Filter out any invalid options
        .sort((a, b) => {
            const labelA = a.label || '';
            const labelB = b.label || '';
            return labelA.localeCompare(labelB);
        });
    console.log("eventOptions", eventOptions);

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
                                    <Button variant="secondary" onClick={handleCancel}>
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
                                                    isClearable={!isEditing}
                                                    isSearchable={!isEditing}
                                                    isDisabled={loadingEvents || isEditing}
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
                                                    {isEditing 
                                                        ? "Event cannot be changed when editing an engagement"
                                                        : "Select an event to view its programme tracks"
                                                    }
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
                                                    placeholder={
                                                        !selectedEventId 
                                                            ? "Please select an event first"
                                                            : loadingTracks 
                                                            ? "Loading tracks..." 
                                                            : allTracksFull
                                                            ? "All tracks are full"
                                                            : "Select Programme Track..."
                                                    }
                                                    isClearable={!allTracksFull && !isEditing}
                                                    isSearchable={!allTracksFull && !isEditing}
                                                    isDisabled={!selectedEventId || loadingTracks || allTracksFull || isEditing}
                                                    isLoading={loadingTracks}
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
                                                <small className={`form-text ${allTracksFull ? 'text-warning' : 'text-muted'}`}>
                                                    {isEditing
                                                        ? "Programme track cannot be changed when editing an engagement"
                                                        : !selectedEventId 
                                                        ? "Select an event first to view available tracks"
                                                        : allTracksFull
                                                        ? "⚠️ All tracks for this event already have engagements created"
                                                        : "Only tracks without existing engagements are shown"
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
                                                    onClick={handleCancel}
                                                    disabled={submitting}
                                                >
                                                    Cancel
                                                </Button>
                                                <Button 
                                                    variant="primary" 
                                                    type="submit"
                                                    disabled={submitting || (allTracksFull && !isEditing)}
                                                    title={allTracksFull && !isEditing ? "Cannot create engagement - all tracks are full" : ""}
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
