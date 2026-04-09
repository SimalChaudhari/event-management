import * as React from 'react';
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import 'bootstrap/dist/css/bootstrap.min.css';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Table from 'react-bootstrap/Table';
import Button from 'react-bootstrap/Button';
import * as $ from 'jquery';
import { getAllSessions, getAllTracks, getSessionsByTrack, deleteSession } from '../../store/actions/programmeActions';
import { PROGRAMME_PATHS, ENGAGEMENT_PATHS } from '../../utils/constants';
import DeleteConfirmationModal from '../../components/modal/DeleteConfirmationModal';
import { toast } from 'react-toastify';
import '../../assets/css/event.css';

// @ts-ignore
$.DataTable = require('datatables.net-bs');

const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${date.getDate()} ${monthNames[date.getMonth()]} ${date.getFullYear()}`;
};

const formatTime = (time) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
};

const TrackSessionsPage = () => {
    const { trackId } = useParams();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { sessions, tracks, trackSessions: allTrackSessions, loading } = useSelector((state) => state.programme);
    console.log('sessions', sessions);
    console.log('tracks', tracks);
    console.log('trackSessions', allTrackSessions);
    const [trackSessions, setTrackSessions] = useState([]);
    const [trackData, setTrackData] = useState(null);
    const [isLoadingSessions, setIsLoadingSessions] = useState(true);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [sessionToDelete, setSessionToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        // Always fetch tracks for track info
        dispatch(getAllTracks());
        
        // Always fetch sessions for the specific track
        if (trackId) {
            dispatch(getSessionsByTrack(trackId));
        }
    }, [dispatch, trackId]);

    useEffect(() => {
        if (tracks && trackId) {
            const track = tracks.find(t => t.id === trackId);
            setTrackData(track);
        }
    }, [tracks, trackId]);

    useEffect(() => {
        if (trackId && allTrackSessions[trackId]) {
            // Get sessions for this specific track from the trackSessions state
            setTrackSessions(allTrackSessions[trackId]);
            setIsLoadingSessions(false);
        } else if (trackId && !allTrackSessions[trackId]) {
            // If no sessions for this track, we're still loading
            setIsLoadingSessions(true);
        }
    }, [allTrackSessions, trackId]);

    useEffect(() => {
        if (trackSessions.length >= 0 && !isLoadingSessions) {
            setTimeout(() => {
                if ($.fn.DataTable.isDataTable('#track-sessions-table')) {
                    $('#track-sessions-table').DataTable().destroy();
                }

                const dt = $('#track-sessions-table').DataTable({
                    data: trackSessions || [],
                    order: [[0, 'asc']],
                    searching: true,
                    searchDelay: 500,
                    pageLength: 10,
                    lengthMenu: [
                        [5, 10, 25, 50, -1],
                        [5, 10, 25, 50, 'All']
                    ],
                    pagingType: 'full_numbers',
                    dom:
                        "<'row mb-3'<'col-sm-12 col-md-6'l><'col-sm-12 col-md-6 d-flex justify-content-end align-items-center'<'search-container'f><'add-session-button ml-2'>>>" +
                        "<'row'<'col-sm-12'tr>>" +
                        "<'row'<'col-sm-12 col-md-5'i><'col-sm-12 col-md-7'p>>",
                    columns: [
                        {
                            data: 'title',
                            title: 'Session Details',
                            render: function (data, type, row) {
                                const speakers = row.speakers && row.speakers.length > 0
                                    ? row.speakers.map(s => s.name).join(', ')
                                    : 'TBA';
                                
                                return `
                                    <div class="d-inline-block align-middle">
                                        <div class="d-inline-block">
                                            <h6 class="m-b-0">${data}</h6>
                                            <p class="m-b-0 text-muted" style="font-size: 12px;">
                                                ${row.description ? (row.description.length > 100 ? row.description.substring(0, 100) + '...' : row.description) : 'No description'}
                                            </p>
                                            <div class="mt-2">
                                                <span class="badge badge-light-primary">
                                                    <i class="feather icon-mic mr-1"></i>
                                                    ${speakers}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                `;
                            }
                        },
                        {
                            data: 'sessionDate',
                            title: 'Date & Time',
                            render: function (data, type, row) {
                                const dateStr = data ? formatDate(data) : 'N/A';
                                const timeStr = row.startTime && row.endTime 
                                    ? `${formatTime(row.startTime)} - ${formatTime(row.endTime)}`
                                    : 'N/A';
                                
                                return `
                                    <div class="text-muted small">
                                        <i class="feather icon-calendar mr-1"></i>${dateStr}<br>
                                        <i class="feather icon-clock mr-1"></i>${timeStr}
                                    </div>
                                `;
                            }
                        },
                        {
                            data: 'createdAt',
                            title: 'Created Date',
                            render: function (data, type, row) {
                                return data ? formatDate(data) : 'N/A';
                            }
                        },
                        {
                            data: null,
                            title: 'Actions',
                            orderable: false,
                            render: function (data, type, row) {
                                return `
                                    <div class="d-flex">
                                        <button type="button" class="btn btn-icon btn-success view-btn mr-2" data-id="${row.id}" title="View Session">
                                            <i class="feather icon-eye"></i>
                                        </button>
                                        <button type="button" class="btn btn-icon btn-info qa-btn mr-2" data-sessionid="${row.sessionId || row.id}" title="Q&A">
                                            <i class="feather icon-message-circle"></i>
                                        </button>
                                        <button type="button" class="btn btn-icon btn-warning edit-btn mr-2" data-id="${row.id}" title="Edit Session">
                                            <i class="feather icon-edit"></i>
                                        </button>
                                        <button type="button" class="btn btn-icon btn-danger delete-btn" data-id="${row.id}" title="Delete Session">
                                            <i class="feather icon-trash-2"></i>
                                        </button>
                                    </div>
                                `;
                            }
                        }
                    ],
                    initComplete: function () {
                        if (!$('#addSessionBtn').length) {
                            $('.add-session-button').html(`
                                <button class="btn btn-primary d-flex align-items-center ml-2" id="addSessionBtn">
                                    <i class="feather icon-plus mr-1"></i>
                                    Add Session
                                </button>
                            `);
                            $('#addSessionBtn').on('click', () => {
                                navigate(PROGRAMME_PATHS.ADD_SESSION);
                            });
                        }
                    }
                });

                $(document).off('click', '.view-btn').on('click', '.view-btn', function () {
                    const sessionId = $(this).data('id');
                    const session = trackSessions.find((s) => s.id === sessionId);
                    if (session) {
                        const eventId = session.track && session.track.eventId ? session.track.eventId : (session.track && session.track.event && session.track.event.id);
                        if (eventId) {
                            navigate(`${PROGRAMME_PATHS.VIEW_SESSION}/${session.id}?eventId=${eventId}`);
                        } else {
                            navigate(`${PROGRAMME_PATHS.VIEW_SESSION}/${session.id}`);
                        }
                    }
                });

                $(document).off('click', '.edit-btn').on('click', '.edit-btn', function () {
                    const sessionId = $(this).data('id');
                    const session = trackSessions.find((s) => s.id === sessionId);
                    if (session) {
                        navigate(`${PROGRAMME_PATHS.EDIT_SESSION}/${session.id}`);
                    }
                });

                $(document).off('click', '.delete-btn').on('click', '.delete-btn', function () {
                    const sessionId = $(this).data('id');
                    const session = trackSessions.find((s) => s.id === sessionId);
                    if (session) {
                        setSessionToDelete({ id: session.id, name: session.title });
                        setShowDeleteModal(true);
                    }
                });

                $(document).off('click', '.qa-btn').on('click', '.qa-btn', function () {
                    const rowData = dt.row($(this).closest('tr')).data() || {};
                    const sessionId = rowData.sessionId || rowData.id || (rowData.session && rowData.session.id) || rowData.trackSessionId || $(this).data('sessionid') || $(this).data('id');
                    if (sessionId) {
                        navigate(`${ENGAGEMENT_PATHS.QA}?sessionId=${sessionId}`);
                    }
                });
            }, 100);
        }

        return () => {
            if ($.fn.DataTable.isDataTable('#track-sessions-table')) {
                $('#track-sessions-table').DataTable().destroy();
            }
        };
    }, [trackSessions, navigate, isLoadingSessions]);

    const handleBack = () => {
        navigate(PROGRAMME_PATHS.LIST);
    };

    const handleConfirmDelete = async () => {
        if (!sessionToDelete) return;

        setIsDeleting(true);
        try {
            await dispatch(deleteSession(sessionToDelete.id));
            setShowDeleteModal(false);
            setSessionToDelete(null);
            // Refresh the sessions list and reset loading state
            setIsLoadingSessions(true);
            dispatch(getSessionsByTrack(trackId));
        } catch (error) {
            console.error('Delete failed:', error);
            toast.error('Failed to delete session');
        } finally {
            setIsDeleting(false);
        }
    };

    const handleCloseDeleteModal = () => {
        if (!isDeleting) {
            setShowDeleteModal(false);
            setSessionToDelete(null);
        }
    };

    return (
        <>
            <DeleteConfirmationModal 
                show={showDeleteModal} 
                onHide={handleCloseDeleteModal} 
                onConfirm={handleConfirmDelete} 
                isLoading={isDeleting} 
            />
            <Row>
                <Col sm={12}>
                    <Card>
                    <Card.Header>
                        <div className="d-flex justify-content-between align-items-center">
                            <h5 className="mb-0">Track Sessions</h5>
                            <Button variant="secondary" onClick={handleBack}>
                                <i className="feather icon-arrow-left mr-1"></i>
                                Back
                            </Button>
                        </div>
                    </Card.Header>
                    <Card.Body>
                        {isLoadingSessions ? (
                            <div className="text-center py-5">
                                <div className="spinner-border text-primary" role="status">
                                    <span className="sr-only">Loading sessions...</span>
                                </div>
                                <p className="mt-2">Loading sessions...</p>
                            </div>
                        ) : (
                            <Table striped hover responsive id="track-sessions-table">
                                <thead>
                                    <tr>
                                        <th>Session Details</th>
                                        <th>Date & Time</th>
                                        <th>Created Date</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                            </Table>
                        )}
                    </Card.Body>
                </Card>
            </Col>
        </Row>
        </>
    );
};

export default TrackSessionsPage;

