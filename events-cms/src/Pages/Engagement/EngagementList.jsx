import * as React from 'react';
import { useEffect, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Table from 'react-bootstrap/Table';
import { useSelector, useDispatch } from 'react-redux';
import * as $ from 'jquery';
import { getAllEngagements, deleteEngagement, toggleEngagementStatus } from '../../store/actions/engagementActions';
import { getAllTracks } from '../../store/actions/programmeActions';
import { useNavigate } from 'react-router-dom';
import '../../assets/css/event.css';
import DeleteConfirmationModal from '../../components/modal/DeleteConfirmationModal';
import { formatDateTimeForTable } from '../../components/dateTime/dateTimeUtils';
import { ENGAGEMENT_PATHS, PROGRAMME_PATHS } from '../../utils/constants';
import FilterComponent from '../../components/common/FilterComponent';

// @ts-ignore
$.DataTable = require('datatables.net-bs');

function engagementsTable(data, handleAdd, handleEdit, handleDelete, handleView, handleToggleStatus, handleSessions) {
    let tableZero = '#engagements-data-table';
    $.fn.dataTable.ext.errMode = 'throw';

    // Flatten grouped data to show events with their tracks
    const flattenedData = [];
    data.forEach(eventGroup => {
        if (eventGroup.event && eventGroup.programmeTracks && eventGroup.programmeTracks.length > 0) {
            eventGroup.programmeTracks.forEach((track, index) => {
                flattenedData.push({
                    eventId: eventGroup.event.id,
                    eventName: eventGroup.event.name,
                    eventDate: eventGroup.event.startDate,
                    eventTime: `${eventGroup.event.startTime} - ${eventGroup.event.endTime}`,
                    trackId: track.id,
                    trackTitle: track.title,
                    engagementId: track.engagementId,
                    trackId: track.trackId,
                    isActive: track.isActive,
                    createdAt: track.createdAt,
                    updatedAt: track.updatedAt,
                    sessionsCount: track.sessionsCount || track.sessions?.length || 0,
                    isFirstTrack: index === 0,
                    totalSessionsCount: eventGroup.totalSessionsCount,
                    statistics: eventGroup.statistics
                });
            });
        }
    });

    // Preserve the current page
    let currentPage = 0;
    if ($.fn.DataTable.isDataTable(tableZero)) {
        currentPage = $(tableZero).DataTable().page();
        $(tableZero).DataTable().clear().destroy();
    }

    $(tableZero).DataTable({
        data: flattenedData || [],
        order: [[1, 'desc']], // Sort by created date descending
        searching: true,
        searchDelay: 500,
        pageLength: 10,
        lengthMenu: [
            [5, 10, 25, 50, -1],
            [5, 10, 25, 50, 'All']
        ],
        pagingType: 'full_numbers',
        dom:
            "<'row mb-3'<'col-sm-12 col-md-6'l><'col-sm-12 col-md-6 d-flex justify-content-end align-items-center'<'search-container'f><'add-engagement-button ml-2'>>>" +
            "<'row'<'col-sm-12'tr>>" +
            "<'row'<'col-sm-12 col-md-5'i><'col-sm-12 col-md-7'p>>",
        columns: [
            {
                data: null,
                title: 'Track',
                width: '30%',
                render: function (data, type, row) {
                    return `
                        <div class="d-inline-block align-middle" style="max-width: 100%;">
                            <h6 class="m-b-0" style="font-size: 14px; font-weight: 600;">${row.trackTitle || 'Unknown Track'}</h6>
                            <p class="m-b-0 text-muted" style="font-size: 12px; margin-top: 4px;">
                                <i class="feather icon-calendar" style="color: #17a2b8;"></i> <span style="font-weight: 500;">${row.eventName}</span>
                            </p>
                        </div>
                    `;
                }
            },
            {
                data: null,
                title: 'Created Date',
                width: '15%',
                render: function (data, type, row) {
                    if (row.createdAt) {
                        return formatDateTimeForTable(row.createdAt);
                    }
                    return 'N/A';
                }
            },
            {
                data: null,
                title: 'Status',
                width: '15%',
                className: 'text-center',
                render: function (data, type, row) {
                    const isActive = row.isActive || false;
                    const badgeClass = isActive ? 'badge-light-success' : 'badge-light-secondary';
                    const statusText = isActive ? 'Active' : 'Inactive';
                    const iconClass = isActive ? 'icon-check-circle' : 'icon-x-circle';

                    return `
                        <span class="badge ${badgeClass} toggle-status-badge" data-id="${row.engagementId}" 
                              style="cursor: pointer; font-size: 13px; padding: 6px 16px; min-width: 90px;" 
                              title="Click to toggle">
                            <i class="feather ${iconClass}" style="margin-right: 4px;"></i>${statusText}
                        </span>
                    `;
                }
            },
            {
                data: null,
                title: 'Sessions',
                width: '15%',
                className: 'text-center',
                render: function (data, type, row) {
                    const sessionCount = row.sessionsCount || 0;
                    return `
                        <span class="badge badge-light-info" style="font-size: 13px; padding: 6px 12px;">
                            <i class="feather icon-list" style="margin-right: 4px;"></i>${sessionCount}
                        </span>
                    `;
                }
            },
            {
                data: null,
                title: 'Actions',
                width: '25%',
                orderable: false,
                className: 'text-center',
                render: function (data, type, row) {
                    return `
                        <div class="btn-group" role="group" aria-label="Actions">
                            <button type="button" class="btn btn-icon btn-success view-btn" data-id="${row.engagementId}" title="View Details" 
                                style="margin-right: 8px;border-radius: 50%; display: inline-flex; justify-content: center; align-items: center;">
                                <i class="feather icon-eye"></i>
                            </button>
                            <button type="button" class="btn btn-icon btn-secondary sessions-btn" data-trackid="${row.trackId}" title="Sessions" 
                                style="margin-right: 8px;border-radius: 50%; display: inline-flex; justify-content: center; align-items: center;">
                                <i class="feather icon-list"></i>
                            </button>
                            <button type="button" class="btn btn-icon btn-warning edit-btn" data-id="${row.engagementId}" title="Edit Engagement" 
                                style="margin-right: 8px;border-radius: 50%; display: inline-flex; justify-content: center; align-items: center;">
                                <i class="feather icon-edit"></i>
                            </button>
                            <button type="button" class="btn btn-icon btn-danger delete-btn" data-id="${row.engagementId}" title="Delete Engagement" 
                                style="border-radius: 50%; display: inline-flex; justify-content: center; align-items: center;">
                                <i class="feather icon-trash-2"></i>
                            </button>
                        </div>
                    `;
                }
            }
        ],
        initComplete: function (settings, json) {
            // Add "Create New Engagement" button
            $('.add-engagement-button').html(
                '<button type="button" class="btn btn-primary add-new-engagement-btn" style="white-space: nowrap;">' +
                    '<i class="feather icon-plus"></i> Create' +
                    '</button>'
            );

            // Attach event listeners
            $('.add-new-engagement-btn')
                .off('click')
                .on('click', function () {
                    handleAdd();
                });

            // Restore the previous page
            $(tableZero).DataTable().page(currentPage).draw('page');
        },
        drawCallback: function (settings) {
            // Attach event listeners after each draw
            $('.view-btn')
                .off('click')
                .on('click', function () {
                    const id = $(this).data('id');
                    handleView(id);
                });


            $('.sessions-btn')
                .off('click')
                .on('click', function () {
                    const trackId = $(this).data('trackid');
                    handleSessions(trackId);
                });

            $('.edit-btn')
                .off('click')
                .on('click', function () {
                    const id = $(this).data('id');
                    handleEdit(id);
                });

            $('.delete-btn')
                .off('click')
                .on('click', function () {
                    const id = $(this).data('id');
                    handleDelete(id);
                });

            $('.toggle-status-badge')
                .off('click')
                .on('click', function () {
                    const id = $(this).data('id');
                    handleToggleStatus(id);
                });
        }
    });

    $(tableZero).DataTable().page(currentPage).draw(false);
}

const EngagementList = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const { engagements, loading } = useSelector((state) => state.engagement);
    const { tracks } = useSelector((state) => state.programme);

    const [currentTable, setCurrentTable] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [engagementToDelete, setEngagementToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [selectedEventId, setSelectedEventId] = useState('');
    const [filteredEngagements, setFilteredEngagements] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            await dispatch(getAllEngagements());
            await dispatch(getAllTracks());
        };
        fetchData();
        return () => destroyTable();
    }, [dispatch]);

    // Filter engagements by event
    useEffect(() => {
        if (!engagements || engagements.length === 0) {
            setFilteredEngagements([]);
            return;
        }
        
        if (selectedEventId) {
            const filtered = engagements.filter(engagement => {
                return engagement.event && engagement.event.id === selectedEventId;
            });
            setFilteredEngagements(filtered);
        } else {
            setFilteredEngagements(engagements);
        }
    }, [engagements, selectedEventId]);

    useEffect(() => {
        initializeTable();
        return () => destroyTable();
    }, [filteredEngagements]);

    const destroyTable = () => {
        if (currentTable) {
            $('#engagements-data-table').off('click', '.delete-btn');
            $('#engagements-data-table').off('click', '.edit-btn');
            $('#engagements-data-table').off('click', '.view-btn');
            $('#engagements-data-table').off('click', '.sessions-btn');
            $('#engagements-data-table').off('click', '.toggle-status-badge');
            currentTable.destroy();
            setCurrentTable(null);
        }
    };

    const initializeTable = () => {
        destroyTable();
        if (Array.isArray(filteredEngagements) && filteredEngagements.length >= 0) {
            const table = engagementsTable(
                filteredEngagements,
                handleAdd,
                handleEdit,
                handleDelete,
                handleView,
                handleToggleStatus,
                handleSessions
            );
            setCurrentTable(table);
        }
    };

    const handleAdd = () => {
        navigate(ENGAGEMENT_PATHS.ADD_ENGAGEMENT);
    };

    const handleEdit = (id) => {
        navigate(`${ENGAGEMENT_PATHS.EDIT_ENGAGEMENT}/${id}`);
    };

    const handleView = (id) => {
        navigate(`${ENGAGEMENT_PATHS.VIEW_ENGAGEMENT}/${id}`);
    };

    const handleQA = (id) => {
        navigate(`/engagement/qa/${id}`);
    };

    const handleSessions = (trackId) => {
        if (!trackId) return;
        navigate(`${ENGAGEMENT_PATHS.SESSIONS}/${trackId}`);
    };

    const handleDelete = (id) => {
        const engagement = engagements.find((e) => e.id === id);
        setEngagementToDelete(engagement);
        setShowDeleteModal(true);
    };

    const handleToggleStatus = async (id) => {
        await dispatch(toggleEngagementStatus(id));
        await dispatch(getAllEngagements());
    };

    const confirmDelete = async () => {
        if (!engagementToDelete) return;

        setIsDeleting(true);
        try {
            const result = await dispatch(deleteEngagement(engagementToDelete.id));
            if (result.success) {
                await dispatch(getAllEngagements());
                setShowDeleteModal(false);
                setEngagementToDelete(null);
            }
        } catch (error) {
            console.error('Error deleting engagement:', error);
        } finally {
            setIsDeleting(false);
        }
    };

    const handleCloseDeleteModal = () => {
        setShowDeleteModal(false);
        setEngagementToDelete(null);
    };

    // Get unique events from engagements
    const getAvailableEvents = () => {
        if (!engagements || engagements.length === 0) return [];
        const eventsMap = new Map();
        engagements.forEach(engagement => {
            if (engagement.event && !eventsMap.has(engagement.event.id)) {
                eventsMap.set(engagement.event.id, engagement.event);
            }
        });
        return Array.from(eventsMap.values());
    };

    const handleEventChange = (eventId) => {
        setSelectedEventId(eventId);
    };

    const activeFilters = selectedEventId ? { eventId: selectedEventId } : {};

    const applyFilters = () => {
        // Filters are already applied via selectedEventId state
    };

    const clearFilters = () => {
        setSelectedEventId('');
    };

    return (
        <React.Fragment>
            {/* Filter Component */}
            <FilterComponent
                events={getAvailableEvents()}
                loadingDropdowns={false}
                selectedEventId={selectedEventId}
                onEventChange={handleEventChange}
                onApplyFilters={applyFilters}
                onClearFilters={clearFilters}
                activeFilters={activeFilters}
                showUserFilter={false}
                showEventFilter={true}
            />

            <Row>
                <Col>
                    <Card>
                        <Card.Header>
                            <Card.Title as="h5">Engagement Management</Card.Title>
                        </Card.Header>
                        <Card.Body>
                            {loading ? (
                                <div className="text-center">
                                    <div className="spinner-border text-primary" role="status">
                                        <span className="sr-only">Loading...</span>
                                    </div>
                                </div>
                            ) : (
                                <Table striped responsive id="engagements-data-table" className="table table-hover">
                                    <thead></thead>
                                    <tbody></tbody>
                                </Table>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            <DeleteConfirmationModal
                show={showDeleteModal}
                onHide={handleCloseDeleteModal}
                onConfirm={confirmDelete}
                title="Delete Engagement"
                message={`Are you sure you want to delete this engagement for track "${engagementToDelete?.track?.title}"? This action cannot be undone.`}
                isDeleting={isDeleting}
            />
        </React.Fragment>
    );
};

export default EngagementList;

