import * as React from 'react';
import { useEffect, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Table from 'react-bootstrap/Table';
import { useSelector, useDispatch } from 'react-redux';
import * as $ from 'jquery';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import '../../assets/css/event.css';
import {
    getAllTracks,
    getAllSessions,
    deleteTrack,
    deleteSession,
    reorderProgrammeTracks
} from '../../store/actions/programmeActions';
import DeleteConfirmationModal from '../../components/modal/DeleteConfirmationModal';
import { PROGRAMME_PATHS } from '../../utils/constants';
import { formatDateTimeForTable } from '../../components/dateTime/dateTimeUtils';

// @ts-ignore
$.DataTable = require('datatables.net-bs');
require('datatables.net-rowreorder');

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

function tracksTable(data, handleAddTrack, handleEdit, handleDelete, handleView, handleViewSessions, handleReorder) {
    let tableZero = '#programme-data-table';
    $.fn.dataTable.ext.errMode = 'throw';

    let currentPage = 0;
    if ($.fn.DataTable.isDataTable(tableZero)) {
        currentPage = $(tableZero).DataTable().page();
        $(tableZero).DataTable().clear().destroy();
    }

    const tableInstance = $(tableZero).DataTable({
        data: data || [],
        order: [],
        searching: true,
        searchDelay: 500,
        pageLength: 10,
        lengthMenu: [
            [5, 10, 25, 50, -1],
            [5, 10, 25, 50, 'All']
        ],
        rowReorder: {
            dataSrc: 'displayOrder',
            selector: 'td.reorder-handle-column'
        },
        processing: true,
        pagingType: 'full_numbers',
        dom:
            "<'row mb-3'<'col-sm-12 col-md-6'l><'col-sm-12 col-md-6 d-flex justify-content-end align-items-center'<'search-container'f><'add-track-button ml-2'>>>" +
            "<'row'<'col-sm-12'tr>>" +
            "<'row'<'col-sm-12 col-md-5'i><'col-sm-12 col-md-7'p>>",
        columns: [
            {
                data: 'displayOrder',
                title: '',
                width: '5%',
                orderable: false,
                className: 'text-center align-middle reorder-handle-column',
                render: function () {
                    return `
                        <span class="drag-handle" title="Drag to reorder" style="cursor: move; display: inline-flex; align-items: center; justify-content: center;">
                            <i class="feather icon-move"></i>
                        </span>
                    `;
                }
            },
            {
                data: 'title',
                title: 'Track Details',
                render: function (data, type, row) {
                    const sessionCount = row.sessionCount || 0;
                    const description = row.description 
                        ? (row.description.length > 100 ? row.description.substring(0, 100) + '...' : row.description)
                        : 'No description';
                    return `
                        <div class="d-inline-block align-middle">
                            <div class="d-inline-block">
                                <h6 class="m-b-0">${data}</h6>
                                <p class="m-b-0 text-muted" style="font-size: 12px;">
                                    ${description}
                                </p>
                                <div class="mt-2">
                                    <span class="badge badge-primary">
                                        <i class="feather icon-calendar mr-1"></i>
                                        Sessions: ${sessionCount}
                                    </span>
                                </div>
                            </div>
                        </div>
                    `;
                }
            },
            {
                data: 'eventName',
                title: 'Event',
                render: function (data, type, row) {
                    return `
                        <span class="badge badge-light-info" style="font-size: 13px; padding: 6px 12px;">
                            <i class="feather icon-calendar mr-1"></i>
                            ${data || 'Unknown Event'}
                        </span>
                    `;
                }
            },
            {
                data: 'isActive',
                title: 'Status',
                render: function (data, type, row) {
                    const badgeClass = data ? 'badge-success' : 'badge-secondary';
                    const statusText = data ? 'Active' : 'Inactive';
                    return `
                        <span class="badge ${badgeClass}">
                            ${statusText}
                        </span>
                    `;
                }
            },
            {
                data: 'createdAt',
                title: 'Created Date',
                render: function (data, type, row) {
                    return data ? formatDateTimeForTable(data) : 'N/A';
                }
            },
            {
                data: null,
                title: 'Actions',
                orderable: false,
                render: function (data, type, row) {
                    return `
                        <div class="d-flex">
                            <button type="button" class="btn btn-icon btn-success view-btn mr-2" data-id="${row.id}" title="View Track">
                                <i class="feather icon-eye"></i>
                            </button>
                            <button type="button" class="btn btn-icon btn-warning edit-btn mr-2" data-id="${row.id}" title="Edit Track">
                                <i class="feather icon-edit"></i>
                            </button>
                            <button type="button" class="btn btn-icon session-btn mr-2" data-id="${row.id}" title="Sessions" style="background-color: #1e7e34; color: white;">
                                <i class="feather icon-calendar"></i>
                            </button>
                            <button type="button" class="btn btn-icon btn-danger delete-btn" data-id="${row.id}" title="Delete Track">
                                <i class="feather icon-trash-2"></i>
                            </button>
                        </div>
                    `;
                }
            }
        ],
        initComplete: function () {
            if (!$('#addTrackBtn').length) {
                $('.add-track-button').html(`
                    <button class="btn btn-primary d-flex align-items-center ml-2" id="addTrackBtn">
                        <i class="feather icon-plus mr-1"></i>
                        Add Track
                    </button>
                `);
                $('#addTrackBtn').on('click', handleAddTrack);
            }
        }
    });

    tableInstance.page(currentPage).draw(false);

    tableInstance.on('row-reorder', function () {
        const orderedRows = tableInstance.rows({ order: 'current' }).data().toArray();
        if (!orderedRows || orderedRows.length === 0) {
            return;
        }

        const reorderedItems = orderedRows.map((row, index) => {
            row.displayOrder = index;
            return {
                id: row.id,
                displayOrder: index
            };
        });

        tableInstance.rows().invalidate().draw(false);

        if (typeof handleReorder === 'function') {
            if (typeof tableInstance.processing === 'function') {
                tableInstance.processing(true);
            }
            Promise.resolve(handleReorder(reorderedItems)).finally(() => {
                if ($.fn && $.fn.DataTable && $.fn.DataTable.isDataTable(tableZero) && typeof tableInstance.processing === 'function') {
                    tableInstance.processing(false);
                }
            });
        }
    });

    $(document).off('click', '.view-btn').on('click', '.view-btn', function () {
        const trackId = $(this).data('id');
        const dataTrack = data.find((track) => track.id === trackId);
        if (dataTrack) {
            handleView(dataTrack);
        }
    });

    $(document).off('click', '.edit-btn').on('click', '.edit-btn', function () {
        const trackId = $(this).data('id');
        const dataTrack = data.find((track) => track.id === trackId);
        if (dataTrack) {
            handleEdit(dataTrack);
        }
    });

    $(document).off('click', '.delete-btn').on('click', '.delete-btn', function () {
        const trackId = $(this).data('id');
        const dataTrack = data.find((track) => track.id === trackId);
        if (dataTrack) {
            handleDelete(dataTrack);
        }
    });

    $(document).off('click', '.session-btn').on('click', '.session-btn', function () {
        const trackId = $(this).data('id');
        const dataTrack = data.find((track) => track.id === trackId);
        if (dataTrack) {
            handleViewSessions(dataTrack);
        }
    });

    return tableInstance;
}

function sessionsTable(data, handleAddSession, handleEdit, handleDelete, handleView) {
    let tableZero = '#programme-data-table';
    $.fn.dataTable.ext.errMode = 'throw';

    let currentPage = 0;
    if ($.fn.DataTable.isDataTable(tableZero)) {
        currentPage = $(tableZero).DataTable().page();
        $(tableZero).DataTable().clear().destroy();
    }

    const tableInstance = $(tableZero).DataTable({
        data: data || [],
        order: [[3, 'asc']], // Sort by Date & Time column (index 3) to match backend order
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
                data: 'trackName',
                title: 'Track',
                render: function (data, type, row) {
                    return `
                        <span class="badge badge-light-info" style="font-size: 13px; padding: 6px 12px;">
                            <i class="feather icon-folder mr-1"></i>
                            ${data || 'N/A'}
                        </span>
                    `;
                }
            },
            {
                data: 'eventName',
                title: 'Event',
                render: function (data, type, row) {
                    return `
                        <span class="badge badge-light-primary" style="font-size: 13px; padding: 6px 12px;">
                            <i class="feather icon-calendar mr-1"></i>
                            ${data || 'Unknown Event'}
                        </span>
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
                            <button type="button" class="btn btn-icon btn-warning edit-btn mr-2" data-id="${row.id}" title="Edit Session">
                                <i class="feather icon-edit"></i>
                            </button>
                            <button type="button" class="btn btn-icon session-btn mr-2" data-id="${row.id}" title="Session Details" style="background-color: #1e7e34; color: white;">
                                <i class="feather icon-calendar"></i>
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
                $('#addSessionBtn').on('click', handleAddSession);
            }
        }
    });

    tableInstance.page(currentPage).draw(false);

    $(document).off('click', '.view-btn').on('click', '.view-btn', function () {
        const sessionId = $(this).data('id');
        const dataSession = data.find((session) => session.id === sessionId);
        if (dataSession) {
            handleView(dataSession);
        }
    });

    $(document).off('click', '.edit-btn').on('click', '.edit-btn', function () {
        const sessionId = $(this).data('id');
        const dataSession = data.find((session) => session.id === sessionId);
        if (dataSession) {
            handleEdit(dataSession);
        }
    });

    $(document).off('click', '.delete-btn').on('click', '.delete-btn', function () {
        const sessionId = $(this).data('id');
        const dataSession = data.find((session) => session.id === sessionId);
        if (dataSession) {
            handleDelete(dataSession);
        }
    });

    $(document).off('click', '.session-btn').on('click', '.session-btn', function () {
        const sessionId = $(this).data('id');
        const dataSession = data.find((session) => session.id === sessionId);
        console.log('Session icon clicked for session:', dataSession);
    });

    return tableInstance;
}

const ProgrammeList = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const { tracks, sessions, loading } = useSelector((state) => state.programme);

    const [currentTable, setCurrentTable] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [viewMode, setViewMode] = useState('tracks'); // 'tracks' or 'sessions'
    const [tableData, setTableData] = useState([]);
    const [isReordering, setIsReordering] = useState(false);

    const destroyTable = () => {
        const tableSelector = '#programme-data-table';
        $(document).off('click', '.delete-btn');
        $(document).off('click', '.edit-btn');
        $(document).off('click', '.view-btn');
        $(document).off('click', '.session-btn');
        $(tableSelector).off('row-reorder');

        if ($.fn && $.fn.DataTable && $.fn.DataTable.isDataTable(tableSelector)) {
            $(tableSelector).DataTable().destroy();
        }

        setCurrentTable(null);
    };

    const handleReorder = async (items) => {
        if (!Array.isArray(items) || items.length === 0 || isReordering) {
            return;
        }

        setIsReordering(true);
        try {
            const result = await dispatch(reorderProgrammeTracks(items));
            if (!result?.error) {
                await dispatch(getAllTracks());
            }
        } catch (error) {
            console.error('Error reordering tracks:', error);
        } finally {
            setIsReordering(false);
        }
    };

    const initializeTable = () => {
        destroyTable();
        if (Array.isArray(tableData) && tableData.length >= 0) {
            let table = null;
            if (viewMode === 'tracks') {
                table = tracksTable(
                    tableData,
                    handleAddTrack,
                    handleEditTrack,
                    handleDeleteTrack,
                    handleViewTrack,
                    handleViewTrackSessions,
                    handleReorder
                );
            } else {
                table = sessionsTable(
                    tableData,
                    handleAddSession,
                    handleEditSession,
                    handleDeleteSession,
                    handleViewSession
                );
            }
            setCurrentTable(table || null);
        }
    };

    useEffect(() => {
        // Fetch data on component mount and view mode change
        if (viewMode === 'tracks') {
            dispatch(getAllTracks());
            dispatch(getAllSessions());
        } else {
            // Sessions view mode - need both tracks and sessions
            dispatch(getAllTracks());
            dispatch(getAllSessions());
        }
        return () => destroyTable();
    }, [dispatch, viewMode]);

    useEffect(() => {
        if (viewMode === 'tracks' && tracks) {
            const tracksWithCount = tracks.map((track, index) => ({
                ...track,
                displayOrder: typeof track.displayOrder === 'number' ? track.displayOrder : index,
                sessionCount: sessions ? sessions.filter(s => s.trackId === track.id).length : 0,
                eventName: track.event ? track.event.name : 'Unknown Event'
            }));
            // Sort by displayOrder and fallback to createdAt
            const sortedTracks = [...tracksWithCount].sort((a, b) => {
                const orderA = Number.isFinite(a.displayOrder) ? a.displayOrder : Number.MAX_SAFE_INTEGER;
                const orderB = Number.isFinite(b.displayOrder) ? b.displayOrder : Number.MAX_SAFE_INTEGER;
                if (orderA !== orderB) {
                    return orderA - orderB;
                }
                const dateA = new Date(a.createdAt || 0).getTime();
                const dateB = new Date(b.createdAt || 0).getTime();
                return dateA - dateB;
            });
            setTableData(sortedTracks);
        } else if (viewMode === 'sessions' && sessions) {
            const sessionsWithTrack = sessions.map(session => {
                const track = tracks ? tracks.find(t => t.id === session.trackId) : null;
                return {
                    ...session,
                    trackName: track ? track.title : 'Unassigned',
                    eventName: track && track.event ? track.event.name : 'Unknown Event'
                };
            });
            // Sort by sessionDate and startTime to match backend order
            const sortedSessions = [...sessionsWithTrack].sort((a, b) => {
                const dateA = new Date(a.sessionDate || 0);
                const dateB = new Date(b.sessionDate || 0);
                if (dateA.getTime() !== dateB.getTime()) {
                    return dateA - dateB;
                }
                // If same date, sort by startTime
                const timeA = a.startTime || '';
                const timeB = b.startTime || '';
                return timeA.localeCompare(timeB);
            });
            setTableData(sortedSessions);
        }
    }, [viewMode, tracks, sessions]);

    useEffect(() => {
        initializeTable();
        return () => destroyTable();
    }, [tableData, viewMode]);

    // Track Handlers
    const handleAddTrack = () => {
        navigate(PROGRAMME_PATHS.ADD_TRACK);
    };

    const handleEditTrack = (data) => {
        navigate(`${PROGRAMME_PATHS.EDIT_TRACK}/${data.id}`);
    };

    const handleViewTrack = (data) => {
        const eventId = data.eventId || (data.event && data.event.id);
        if (eventId) {
            navigate(`${PROGRAMME_PATHS.VIEW_TRACK}/${data.id}?eventId=${eventId}`);
        } else {
            navigate(`${PROGRAMME_PATHS.VIEW_TRACK}/${data.id}`);
        }
    };

    const handleDeleteTrack = (track) => {
        setItemToDelete({ type: 'track', id: track.id, name: track.title });
        setShowDeleteModal(true);
    };

    const handleViewTrackSessions = (track) => {
        // Navigate to track sessions page
        navigate(`${PROGRAMME_PATHS.TRACK_SESSIONS}/${track.id}`);
    };

    // Session Handlers
    const handleAddSession = () => {
        navigate(PROGRAMME_PATHS.ADD_SESSION);
    };

    const handleEditSession = (data) => {
        navigate(`${PROGRAMME_PATHS.EDIT_SESSION}/${data.id}`);
    };

    const handleViewSession = (data) => {
        const track = tracks ? tracks.find(t => t.id === data.trackId) : null;
        const eventId = track && track.eventId ? track.eventId : (track && track.event && track.event.id);
        if (eventId) {
            navigate(`${PROGRAMME_PATHS.VIEW_SESSION}/${data.id}?eventId=${eventId}`);
        } else {
            navigate(`${PROGRAMME_PATHS.VIEW_SESSION}/${data.id}`);
        }
    };

    const handleDeleteSession = (session) => {
        setItemToDelete({ type: 'session', id: session.id, name: session.title });
        setShowDeleteModal(true);
    };

    const handleConfirmDelete = async () => {
        if (!itemToDelete) return;

        setIsDeleting(true);
        try {
            if (itemToDelete.type === 'track') {
                await dispatch(deleteTrack(itemToDelete.id));
            } else {
                await dispatch(deleteSession(itemToDelete.id));
            }
            setShowDeleteModal(false);
            setItemToDelete(null);
            destroyTable();
            await dispatch(getAllTracks());
            await dispatch(getAllSessions());
        } catch (error) {
            console.error('Delete failed:', error);
            toast.error('Failed to delete item');
        } finally {
            setIsDeleting(false);
        }
    };

    const handleClose = () => {
        if (!isDeleting) {
            setShowDeleteModal(false);
            setItemToDelete(null);
        }
    };

    return (
        <>
            <DeleteConfirmationModal 
                show={showDeleteModal} 
                onHide={handleClose} 
                onConfirm={handleConfirmDelete} 
                isLoading={isDeleting} 
            />
            <Row>
                <Col sm={12} className="btn-page">
                    <Card>
                    
                        <Card.Body>
                            <Table striped hover responsive id="programme-data-table">
                                <thead>
                                    <tr>
                                        {viewMode === 'tracks' ? (
                                            <>
                                                <th style={{ width: '40px' }}></th>
                                                <th>Track Details</th>
                                                <th>Event</th>
                                                <th>Status</th>
                                                <th>Created Date</th>
                                                <th>Actions</th>
                                            </>
                                        ) : (
                                            <>
                                                <th>Session Details</th>
                                                <th>Track</th>
                                                <th>Event</th>
                                                <th>Date & Time</th>
                                                <th>Created Date</th>
                                                <th>Actions</th>
                                            </>
                                        )}
                                    </tr>
                                </thead>
                            </Table>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </>
    );
};

export default ProgrammeList;
