import React, { useState, useEffect } from 'react';
import { Card, Button, Row, Col, Badge, Table } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import TrackModal from './TrackModal';
import SessionModal from './SessionModal';
import {
    getTracksByEvent,
    getSessionsByTrack,
    createTrack,
    updateTrack,
    deleteTrack,
    createSession,
    updateSession,
    deleteSession,
    getSessionsByEvent
} from '../../store/actions/programmeActions';
import { speakerList as fetchSpeakerList } from '../../store/actions/speakerActions';
import { getEventSpeakers } from '../../store/actions/eventActions';
import DeleteConfirmationModal from '../modal/DeleteConfirmationModal';

const EventProgrammeManagement = ({ eventId, isEditMode = false, onProgrammeDataChange = null, initialProgrammeData = null }) => {
    const dispatch = useDispatch();
    const { tracks, sessions, loading } = useSelector((state) => state.programme || { tracks: [], sessions: [], loading: false });
    const reduxSpeakers = useSelector((state) => state.speaker?.speakers || []);

    // In preview mode (creation), use local state; in edit mode, use API data
    const isPreviewMode = !isEditMode || !eventId;

    const [programmeTracks, setProgrammeTracks] = useState(initialProgrammeData?.tracks || []);
    const [trackSessions, setTrackSessions] = useState(initialProgrammeData?.sessions || {});
    const [showTrackModal, setShowTrackModal] = useState(false);
    const [showSessionModal, setShowSessionModal] = useState(false);
    const [showTrackViewModal, setShowTrackViewModal] = useState(false);
    const [showSessionViewModal, setShowSessionViewModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteItem, setDeleteItem] = useState(null);
    const [deleteType, setDeleteType] = useState(null); // 'track' or 'session'
    const [deleteIndex, setDeleteIndex] = useState(null); // For preview mode deletion
    const [currentTrack, setCurrentTrack] = useState(null);
    const [currentSession, setCurrentSession] = useState(null);
    const [currentTrackIndex, setCurrentTrackIndex] = useState(null);
    const [currentSessionIndex, setCurrentSessionIndex] = useState(null);
    const [expandedTracks, setExpandedTracks] = useState({});
    const [speakerList, setSpeakerList] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    // Track form state
    const [trackForm, setTrackForm] = useState({
        title: '',
        description: '',
        isActive: true
    });

    // Session form state
    const [sessionForm, setSessionForm] = useState({
        trackId: '',
        title: '',
        description: '',
        sessionDate: '',
        startTime: '',
        endTime: '',
        venue: '',
        isActive: true,
        enablePolling: false,
        enableQna: false,
        speakerIds: []
    });

    // Fetch tracks when eventId is available (edit mode only)
    useEffect(() => {
        if (eventId && isEditMode && !isPreviewMode) {
            loadProgrammeData();
            fetchEventSpeakers();
        }
    }, [eventId, isEditMode, isPreviewMode]);

    // Notify parent component of programme data changes in preview mode
    useEffect(() => {
        if (isPreviewMode && onProgrammeDataChange) {
            onProgrammeDataChange({
                tracks: programmeTracks,
                sessions: trackSessions
            });
        }
    }, [programmeTracks, trackSessions, isPreviewMode, onProgrammeDataChange]);

    const loadProgrammeData = async () => {
        try {
            setIsLoading(true);
            const result = await dispatch(getTracksByEvent(eventId));
            if (result?.success && result.data) {
                setProgrammeTracks(result.data);
                // Load sessions for each track
                for (const track of result.data) {
                    await loadSessionsForTrack(track.id);
                }
            }
        } catch (error) {
            console.error('Error loading programme data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const loadSessionsForTrack = async (trackId) => {
        try {
            // Use event-based endpoint when eventId is available
            const result = await dispatch(getSessionsByTrack(trackId, eventId));
            if (result?.success && result.data) {
                setTrackSessions((prev) => ({
                    ...prev,
                    [trackId]: result.data
                }));
            }
        } catch (error) {
            console.error('Error loading sessions:', error);
        }
    };

    const fetchEventSpeakers = async () => {
        try {
            if (eventId && isEditMode) {
                // Fetch speakers assigned to this event using action
                const result = await dispatch(getEventSpeakers(eventId));
                if (result?.success && result.data && result.data.length > 0) {
                    setSpeakerList(result.data);
                    return;
                }
            }
            
            // Fallback: fetch all speakers using fetchSpeakerList action
            await dispatch(fetchSpeakerList());
            // fetchSpeakerList action updates Redux store, we'll use useEffect to sync
        } catch (error) {
            console.error('Error fetching speakers:', error);
            // toast.error('Failed to load speakers. Please try again.');
        }
    };

    // Sync reduxSpeakers to local state when they change
    useEffect(() => {
        if (reduxSpeakers.length > 0 && speakerList.length === 0) {
            setSpeakerList(reduxSpeakers);
        }
    }, [reduxSpeakers, speakerList.length]);

    // Fetch speakers from localStorage first, then API if needed
    useEffect(() => {
        // Check localStorage for event speakers first
        const eventSpeakersKey = eventId && isEditMode ? `event_${eventId}_speakers` : 'event_temp_speakers';
        const storedSpeakers = localStorage.getItem(eventSpeakersKey);

        if (storedSpeakers) {
            try {
                const speakersData = JSON.parse(storedSpeakers);
                if (speakersData.speakers && Array.isArray(speakersData.speakers) && speakersData.speakers.length > 0) {
                    setSpeakerList(speakersData.speakers);
                    return; // Don't fetch from API if we have stored speakers
                }
            } catch (error) {
                console.error('Error parsing stored speakers:', error);
            }
        }

        // If no stored speakers, fetch from API
        if (speakerList.length === 0) {
            fetchEventSpeakers();
        }
    }, [eventId, isEditMode]);

    // Fetch speakers when session modal opens (if not already loaded)
    useEffect(() => {
        if (showSessionModal) {
            // Always check localStorage first when modal opens
            const eventSpeakersKey = eventId && isEditMode ? `event_${eventId}_speakers` : 'event_temp_speakers';
            const storedSpeakers = localStorage.getItem(eventSpeakersKey);

            if (storedSpeakers) {
                try {
                    const speakersData = JSON.parse(storedSpeakers);
                    if (speakersData.speakers && Array.isArray(speakersData.speakers) && speakersData.speakers.length > 0) {
                        setSpeakerList(speakersData.speakers);
                        return;
                    }
                } catch (error) {
                    console.error('Error parsing stored speakers:', error);
                }
            }

            // If no stored speakers and list is empty, fetch from API
            if (speakerList.length === 0) {
                fetchEventSpeakers();
            }
        }
    }, [showSessionModal]);

    const handleAddTrack = () => {
        setCurrentTrack(null);
        setCurrentTrackIndex(null);
        setTrackForm({
            title: '',
            description: '',
            isActive: true
        });
        setShowTrackModal(true);
    };

    const handleViewTrack = (track) => {
        setCurrentTrack(track);
        setShowTrackViewModal(true);
    };

    const handleEditTrack = (track, index = null) => {
        setCurrentTrack(track);
        setCurrentTrackIndex(index);
        setTrackForm({
            title: track.title || '',
            description: track.description || '',
            isActive: track.isActive !== undefined ? track.isActive : true
        });
        setShowTrackModal(true);
    };

    const handleSaveTrack = async () => {
        if (!trackForm.title.trim()) {
            toast.error('Track title is required');
            return;
        }

        if (isPreviewMode) {
            // Preview mode: store locally
            const newTrack = {
                id: `temp-${Date.now()}`,
                title: trackForm.title,
                description: trackForm.description,
                isActive: trackForm.isActive,
                displayOrder: programmeTracks.length,
                sessions: []
            };

            if (currentTrackIndex !== null && currentTrackIndex >= 0) {
                // Update existing track
                const updatedTracks = [...programmeTracks];
                updatedTracks[currentTrackIndex] = {
                    ...updatedTracks[currentTrackIndex],
                    ...newTrack,
                    id: updatedTracks[currentTrackIndex].id,
                    sessions: trackSessions[updatedTracks[currentTrackIndex].id] || []
                };
                setProgrammeTracks(updatedTracks);
            } else {
                // Add new track
                setProgrammeTracks([...programmeTracks, newTrack]);
                setTrackSessions({
                    ...trackSessions,
                    [newTrack.id]: []
                });
            }
            setShowTrackModal(false);
            // toast.success(currentTrack ? 'Track updated' : 'Track added');
            return;
        }

        // Edit mode: save to API
        try {
            setIsLoading(true);
            let result;
            if (currentTrack) {
                result = await dispatch(updateTrack(currentTrack.id, trackForm, eventId));
            } else {
                result = await dispatch(createTrack(eventId, trackForm));
            }

            if (result?.success || !result?.error) {
                await loadProgrammeData();
                setShowTrackModal(false);
                // toast.success(currentTrack ? 'Track updated successfully' : 'Track created successfully');
            }
        } catch (error) {
            console.error('Error saving track:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteTrack = (track, index = null) => {
        setDeleteItem(track);
        setDeleteIndex(index);
        setDeleteType('track');
        setShowDeleteModal(true);
    };

    const confirmDeleteTrack = async () => {
        if (isPreviewMode) {
            // Preview mode: delete from local state
            if (deleteIndex !== null && deleteIndex >= 0) {
                const trackToDelete = programmeTracks[deleteIndex];
                const updatedTracks = programmeTracks.filter((_, idx) => idx !== deleteIndex);
                const updatedSessions = { ...trackSessions };
                delete updatedSessions[trackToDelete.id];

                setProgrammeTracks(updatedTracks);
                setTrackSessions(updatedSessions);
            }
            setShowDeleteModal(false);
            // toast.success('Track removed');
            return;
        }

        // Edit mode: delete via API
        try {
            setIsLoading(true);
            const result = await dispatch(deleteTrack(deleteItem.id, eventId));
            if (result?.success || !result?.error) {
                await loadProgrammeData();
                setShowDeleteModal(false);
                // toast.success('Track deleted successfully');
            }
        } catch (error) {
            console.error('Error deleting track:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddSession = (track) => {
        setCurrentSession(null);
        setCurrentSessionIndex(null);
        setCurrentTrack(track);
        setSessionForm({
            trackId: track.id,
            title: '',
            description: '',
            sessionDate: '',
            startTime: '',
            endTime: '',
            venue: '',
            isActive: true,
            enablePolling: false,
            enableQna: false,
            speakerIds: []
        });
        setShowSessionModal(true);
    };

    const handleViewSession = (session, track) => {
        setCurrentSession(session);
        setCurrentTrack(track);
        setShowSessionViewModal(true);
    };

    const handleEditSession = (session, track, sessionIndex = null) => {
        setCurrentSession(session);
        setCurrentSessionIndex(sessionIndex);
        setCurrentTrack(track);
        setSessionForm({
            trackId: track.id,
            title: session.title || '',
            description: session.description || '',
            sessionDate: session.sessionDate ? new Date(session.sessionDate).toISOString().split('T')[0] : '',
            startTime: session.startTime || '',
            endTime: session.endTime || '',
            venue: session.venue || '',
            isActive: session.isActive !== undefined ? session.isActive : true,
            enablePolling: session.enablePolling !== undefined ? session.enablePolling : false,
            enableQna: session.enableQna !== undefined ? session.enableQna : false,
            speakerIds: session.speakers
                ? Array.isArray(session.speakers)
                    ? session.speakers
                          .map((s) => {
                              if (typeof s === 'string' || typeof s === 'number') return s;
                              return s?.id || s;
                          })
                          .filter(Boolean)
                    : []
                : []
        });
        setShowSessionModal(true);
    };

    const handleSaveSession = async () => {
        if (!sessionForm.title.trim()) {
            toast.error('Session title is required');
            return;
        }
        if (!sessionForm.sessionDate) {
            toast.error('Session date is required');
            return;
        }
        if (!sessionForm.startTime || !sessionForm.endTime) {
            toast.error('Start time and end time are required');
            return;
        }

        if (isPreviewMode) {
            // Preview mode: store locally
            const newSession = {
                id: `temp-${Date.now()}`,
                trackId: sessionForm.trackId,
                title: sessionForm.title,
                description: sessionForm.description,
                sessionDate: sessionForm.sessionDate,
                startTime: sessionForm.startTime,
                endTime: sessionForm.endTime,
                venue: sessionForm.venue,
                isActive: sessionForm.isActive,
                speakers: sessionForm.speakerIds
                    .map((id) => speakerList.find((s) => s.id === id || s.id === String(id) || String(s.id) === String(id)))
                    .filter(Boolean)
            };

            const trackSessionsList = trackSessions[sessionForm.trackId] || [];

            if (currentSessionIndex !== null && currentSessionIndex >= 0) {
                // Update existing session
                const updatedSessions = [...trackSessionsList];
                updatedSessions[currentSessionIndex] = {
                    ...updatedSessions[currentSessionIndex],
                    ...newSession,
                    id: updatedSessions[currentSessionIndex].id
                };
                setTrackSessions({
                    ...trackSessions,
                    [sessionForm.trackId]: updatedSessions
                });
            } else {
                // Add new session
                setTrackSessions({
                    ...trackSessions,
                    [sessionForm.trackId]: [...trackSessionsList, newSession]
                });
            }
            setShowSessionModal(false);
            // toast.success(currentSession ? 'Session updated' : 'Session added');

            // Remove used speakers from localStorage after session is created
            if (!currentSession && sessionForm.speakerIds.length > 0) {
                removeUsedSpeakersFromStorage(sessionForm.speakerIds);
            }

            return;
        }

        // Edit mode: save to API
        try {
            setIsLoading(true);
            let result;
            if (currentSession) {
                result = await dispatch(updateSession(currentSession.id, sessionForm, eventId));
            } else {
                result = await dispatch(createSession(sessionForm, eventId));
            }

            if (result?.success || !result?.error) {
                await loadSessionsForTrack(sessionForm.trackId);
                setShowSessionModal(false);
                // toast.success(currentSession ? 'Session updated successfully' : 'Session created successfully');

                // Remove used speakers from localStorage after session is created
                if (!currentSession && sessionForm.speakerIds.length > 0) {
                    removeUsedSpeakersFromStorage(sessionForm.speakerIds);
                }
            }
        } catch (error) {
            console.error('Error saving session:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteSession = (session, trackId, sessionIndex = null) => {
        setDeleteItem({ ...session, trackId });
        setDeleteIndex(sessionIndex);
        setDeleteType('session');
        setShowDeleteModal(true);
    };

    const confirmDeleteSession = async () => {
        if (isPreviewMode) {
            // Preview mode: delete from local state
            if (deleteIndex !== null && deleteIndex >= 0 && deleteItem.trackId) {
                const trackSessionsList = trackSessions[deleteItem.trackId] || [];
                const updatedSessions = trackSessionsList.filter((_, idx) => idx !== deleteIndex);
                setTrackSessions({
                    ...trackSessions,
                    [deleteItem.trackId]: updatedSessions
                });
            }
            setShowDeleteModal(false);
            toast.success('Session removed');
            return;
        }

        // Edit mode: delete via API
        try {
            setIsLoading(true);
            const result = await dispatch(deleteSession(deleteItem.id, eventId));
            if (result?.success || !result?.error) {
                await loadSessionsForTrack(deleteItem.trackId);
                setShowDeleteModal(false);
                // toast.success('Session deleted successfully');
            }
        } catch (error) {
            console.error('Error deleting session:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const toggleTrackExpansion = (trackId) => {
        setExpandedTracks((prev) => ({
            ...prev,
            [trackId]: !prev[trackId]
        }));
    };

    const formatTime = (time) => {
        if (!time) return '';
        const [hours, minutes] = time.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const hour12 = hour % 12 || 12;
        return `${hour12}:${minutes} ${ampm}`;
    };

    // Remove used speakers from localStorage after they're used in sessions
    const removeUsedSpeakersFromStorage = (usedSpeakerIds) => {
        try {
            const eventSpeakersKey = eventId && isEditMode ? `event_${eventId}_speakers` : 'event_temp_speakers';
            const storedSpeakers = localStorage.getItem(eventSpeakersKey);

            if (storedSpeakers && usedSpeakerIds && usedSpeakerIds.length > 0) {
                const speakersData = JSON.parse(storedSpeakers);

                // Normalize IDs for comparison (handle string/number mismatches)
                const normalizeId = (id) => String(id);
                const normalizedUsedIds = new Set(usedSpeakerIds.map(normalizeId));

                // Remove used speaker IDs
                const remainingSpeakerIds = speakersData.speakerIds.filter((id) => !normalizedUsedIds.has(normalizeId(id)));

                const remainingSpeakers = speakersData.speakers.filter((speaker) => !normalizedUsedIds.has(normalizeId(speaker.id)));

                // Update localStorage with remaining speakers
                if (remainingSpeakerIds.length > 0 && remainingSpeakers.length > 0) {
                    localStorage.setItem(
                        eventSpeakersKey,
                        JSON.stringify({
                            speakerIds: remainingSpeakerIds,
                            speakers: remainingSpeakers,
                            timestamp: speakersData.timestamp
                        })
                    );
                    // Update speaker list to reflect removed speakers
                    setSpeakerList(remainingSpeakers);
                } else {
                    // Remove key if no speakers left
                    localStorage.removeItem(eventSpeakersKey);
                }
            }
        } catch (error) {
            console.error('Error removing used speakers from storage:', error);
        }
    };

    // Component is always available, just in different modes

    return (
        <div className="mb-4">
            <Card>
                <Card.Header className="d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">
                        <i className="fas fa-calendar-alt mr-2"></i>
                        Programme Management
                    </h5>
                    <Button variant="primary" size="sm" onClick={handleAddTrack} disabled={isLoading}>
                        <i className="fas fa-plus mr-1"></i>
                        Add Track
                    </Button>
                </Card.Header>
                <Card.Body>
                    {isLoading && programmeTracks.length === 0 ? (
                        <div className="text-center py-4">
                            <div className="spinner-border text-primary" role="status">
                                <span className="sr-only">Loading...</span>
                            </div>
                        </div>
                    ) : programmeTracks.length === 0 ? (
                        <div className="text-center py-4">
                            <i className="fas fa-calendar-times fa-3x text-muted mb-3"></i>
                            <p className="text-muted">No programme tracks yet. Add your first track to get started.</p>
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <Table striped bordered hover className="mb-0">
                                <thead>
                                    <tr>
                                        <th style={{ width: '30%' }}>Track Title</th>
                                        <th style={{ width: '20%' }}>Description</th>
                                        <th style={{ width: '10%' }}>Status</th>
                                        <th style={{ width: '10%' }}>Sessions</th>
                                        <th style={{ width: '30%' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {programmeTracks.map((track, index) => {
                                        const trackSessionsList = trackSessions[track.id] || [];
                                        const isExpanded = expandedTracks[track.id];
                                        return (
                                            <React.Fragment key={track.id}>
                                                <tr>
                                                    <td>
                                                        <strong>{track.title}</strong>
                                                    </td>
                                                    <td>
                                                        {track.description ? (
                                                            <span className="text-muted">
                                                                {track.description.length > 50
                                                                    ? track.description.substring(0, 50) + '...'
                                                                    : track.description}
                                                            </span>
                                                        ) : (
                                                            <span className="text-muted">-</span>
                                                        )}
                                                    </td>
                                                    <td>
                                                        {track.isActive ? (
                                                            <span
                                                                style={{
                                                                    backgroundColor: '#28a745',
                                                                    color: '#fff',
                                                                    padding: '6px 12px',
                                                                    fontSize: '12px',
                                                                    display: 'inline-flex',
                                                                    alignItems: 'center',
                                                                    borderRadius: '4px',
                                                                    fontWeight: '500'
                                                                }}
                                                            >
                                                                <i className="fas fa-check-circle mr-1"></i>
                                                                Active
                                                            </span>
                                                        ) : (
                                                            <Badge variant="secondary" style={{ padding: '6px 12px', fontSize: '12px' }}>
                                                                Inactive
                                                            </Badge>
                                                        )}
                                                    </td>
                                                    <td>
                                                        <Badge variant="info" style={{ color: '#fff' }}>
                                                            {trackSessionsList.length}{' '}
                                                            {trackSessionsList.length === 1 ? 'Session' : 'Sessions'}
                                                        </Badge>
                                                    </td>
                                                    <td>
                                                        <Button
                                                            variant="success"
                                                            size="sm"
                                                            className="mr-1"
                                                            onClick={() => handleAddSession(track)}
                                                            title="Add Session"
                                                        >
                                                            <i className="fas fa-plus"></i>
                                                        </Button>
                                                        <Button
                                                            variant="info"
                                                            size="sm"
                                                            className="mr-1"
                                                            onClick={() => toggleTrackExpansion(track.id)}
                                                            title={isExpanded ? 'Hide Sessions' : 'Show Sessions'}
                                                        >
                                                            <i className={`fas ${isExpanded ? 'fa-chevron-up' : 'fa-chevron-down'}`}></i>
                                                        </Button>
                                                        <Button
                                                            variant="primary"
                                                            size="sm"
                                                            className="mr-1"
                                                            onClick={() => handleViewTrack(track)}
                                                            title="View Track"
                                                        >
                                                            <i className="fas fa-eye"></i>
                                                        </Button>
                                                        <Button
                                                            variant="warning"
                                                            size="sm"
                                                            className="mr-1"
                                                            onClick={() => handleEditTrack(track, index)}
                                                            title="Edit Track"
                                                        >
                                                            <i className="fas fa-edit"></i>
                                                        </Button>
                                                        <Button
                                                            variant="danger"
                                                            size="sm"
                                                            onClick={() => handleDeleteTrack(track, index)}
                                                            title="Delete Track"
                                                        >
                                                            <i className="fas fa-trash"></i>
                                                        </Button>
                                                    </td>
                                                </tr>
                                                {isExpanded && (
                                                    <tr>
                                                        <td colSpan="5" style={{ padding: '0', backgroundColor: '#f8f9fa' }}>
                                                            <div style={{ padding: '15px' }}>
                                                                {trackSessionsList.length === 0 ? (
                                                                    <p className="text-muted text-center py-3 mb-0">
                                                                        No sessions in this track yet.
                                                                    </p>
                                                                ) : (
                                                                    <div className="table-responsive">
                                                                        <Table bordered hover size="sm" className="mb-0">
                                                                            <thead>
                                                                                <tr>
                                                                                    <th>Title</th>
                                                                                    <th>Date</th>
                                                                                    <th>Time</th>
                                                                                    <th>Venue</th>
                                                                                    <th>Speakers</th>
                                                                                    <th>Status</th>
                                                                                    <th>Actions</th>
                                                                                </tr>
                                                                            </thead>
                                                                            <tbody>
                                                                                {trackSessionsList.map((session, sessionIndex) => (
                                                                                    <tr key={session.id}>
                                                                                        <td>
                                                                                            <strong>{session.title}</strong>
                                                                                            {session.description && (
                                                                                                <p className="text-muted small mb-0">
                                                                                                    {session.description.length > 50
                                                                                                        ? session.description.substring(
                                                                                                              0,
                                                                                                              50
                                                                                                          ) + '...'
                                                                                                        : session.description}
                                                                                                </p>
                                                                                            )}
                                                                                        </td>
                                                                                        <td>
                                                                                            {session.sessionDate
                                                                                                ? new Date(
                                                                                                      session.sessionDate
                                                                                                  ).toLocaleDateString()
                                                                                                : 'N/A'}
                                                                                        </td>
                                                                                        <td>
                                                                                            {session.startTime && session.endTime
                                                                                                ? `${formatTime(
                                                                                                      session.startTime
                                                                                                  )} - ${formatTime(session.endTime)}`
                                                                                                : 'N/A'}
                                                                                        </td>
                                                                                        <td>{session.venue || 'N/A'}</td>
                                                                                        <td>
                                                                                            {session.speakers &&
                                                                                            session.speakers.length > 0 ? (
                                                                                                <div>
                                                                                                    {session.speakers
                                                                                                        .slice(0, 2)
                                                                                                        .map((speaker) => (
                                                                                                            <Badge
                                                                                                                key={speaker.id || speaker}
                                                                                                                variant="primary"
                                                                                                                className="mr-1"
                                                                                                                style={{ color: '#fff' }}
                                                                                                            >
                                                                                                                {speaker.name ||
                                                                                                                    speaker.firstName +
                                                                                                                        ' ' +
                                                                                                                        speaker.lastName ||
                                                                                                                    'Speaker'}
                                                                                                            </Badge>
                                                                                                        ))}
                                                                                                    {session.speakers.length > 2 && (
                                                                                                        <Badge
                                                                                                            variant="secondary"
                                                                                                            style={{ color: '#fff' }}
                                                                                                        >
                                                                                                            +{session.speakers.length - 2}
                                                                                                        </Badge>
                                                                                                    )}
                                                                                                </div>
                                                                                            ) : (
                                                                                                <span className="text-muted">
                                                                                                    No speakers
                                                                                                </span>
                                                                                            )}
                                                                                        </td>
                                                                                        <td>
                                                                                            {session.isActive ? (
                                                                                                <span
                                                                                                    style={{
                                                                                                        backgroundColor: '#28a745',
                                                                                                        color: '#fff',
                                                                                                        padding: '6px 12px',
                                                                                                        fontSize: '12px',
                                                                                                        display: 'inline-flex',
                                                                                                        alignItems: 'center',
                                                                                                        borderRadius: '4px',
                                                                                                        fontWeight: '500'
                                                                                                    }}
                                                                                                >
                                                                                                    <i className="fas fa-check-circle mr-1"></i>
                                                                                                    Active
                                                                                                </span>
                                                                                            ) : (
                                                                                                <Badge
                                                                                                    variant="secondary"
                                                                                                    style={{
                                                                                                        padding: '6px 12px',
                                                                                                        fontSize: '12px'
                                                                                                    }}
                                                                                                >
                                                                                                    Inactive
                                                                                                </Badge>
                                                                                            )}
                                                                                        </td>
                                                                                        <td>
                                                                                            <Button
                                                                                                variant="primary"
                                                                                                size="sm"
                                                                                                className="mr-1"
                                                                                                onClick={() =>
                                                                                                    handleViewSession(session, track)
                                                                                                }
                                                                                                title="View Session"
                                                                                            >
                                                                                                <i className="fas fa-eye"></i>
                                                                                            </Button>
                                                                                            <Button
                                                                                                variant="warning"
                                                                                                size="sm"
                                                                                                className="mr-1"
                                                                                                onClick={() =>
                                                                                                    handleEditSession(
                                                                                                        session,
                                                                                                        track,
                                                                                                        sessionIndex
                                                                                                    )
                                                                                                }
                                                                                                title="Edit Session"
                                                                                            >
                                                                                                <i className="fas fa-edit"></i>
                                                                                            </Button>
                                                                                            <Button
                                                                                                variant="danger"
                                                                                                size="sm"
                                                                                                onClick={() =>
                                                                                                    handleDeleteSession(
                                                                                                        session,
                                                                                                        track.id,
                                                                                                        sessionIndex
                                                                                                    )
                                                                                                }
                                                                                                title="Delete Session"
                                                                                            >
                                                                                                <i className="fas fa-trash"></i>
                                                                                            </Button>
                                                                                        </td>
                                                                                    </tr>
                                                                                ))}
                                                                            </tbody>
                                                                        </Table>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </React.Fragment>
                                        );
                                    })}
                                </tbody>
                            </Table>
                        </div>
                    )}
                </Card.Body>
            </Card>

            {/* Track Modal - Add/Edit */}
            <TrackModal
                show={showTrackModal}
                onHide={() => setShowTrackModal(false)}
                trackForm={trackForm}
                setTrackForm={setTrackForm}
                currentTrack={currentTrack}
                isLoading={isLoading}
                onSubmit={handleSaveTrack}
                mode="edit"
                trackSessions={trackSessions}
            />

            {/* Session Modal - Add/Edit */}
            <SessionModal
                show={showSessionModal}
                onHide={() => setShowSessionModal(false)}
                sessionForm={sessionForm}
                setSessionForm={setSessionForm}
                currentSession={currentSession}
                currentTrack={currentTrack}
                speakerList={speakerList}
                isLoading={isLoading}
                onSubmit={handleSaveSession}
                mode="edit"
                formatTime={formatTime}
            />

            {/* Track View Modal */}
            <TrackModal
                show={showTrackViewModal}
                onHide={() => setShowTrackViewModal(false)}
                trackForm={trackForm}
                setTrackForm={setTrackForm}
                currentTrack={currentTrack}
                isLoading={false}
                onSubmit={() => {}}
                mode="view"
                trackSessions={trackSessions}
            />

            {/* Session View Modal */}
            <SessionModal
                show={showSessionViewModal}
                onHide={() => setShowSessionViewModal(false)}
                sessionForm={sessionForm}
                setSessionForm={setSessionForm}
                currentSession={currentSession}
                currentTrack={currentTrack}
                speakerList={speakerList}
                isLoading={false}
                onSubmit={() => {}}
                mode="view"
                formatTime={formatTime}
            />

            {/* Delete Confirmation Modal */}
            <DeleteConfirmationModal
                show={showDeleteModal}
                onHide={() => setShowDeleteModal(false)}
                onConfirm={deleteType === 'track' ? confirmDeleteTrack : confirmDeleteSession}
                title={deleteType === 'track' ? 'Delete Track' : 'Delete Session'}
                message={`Are you sure you want to delete this ${deleteType}? This action cannot be undone.`}
                itemName={deleteItem?.title || ''}
                isDeleting={isLoading}
            />
        </div>
    );
};

export default EventProgrammeManagement;
