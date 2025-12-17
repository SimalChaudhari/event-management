import * as React from 'react';
import { useEffect, useState, useRef } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Table from 'react-bootstrap/Table';
import { useSelector, useDispatch } from 'react-redux';
import * as $ from 'jquery';
import { getAllEngagements, deleteEngagement, toggleEngagementStatus, reorderEngagements } from '../../store/actions/engagementActions';
import { useNavigate, useLocation } from 'react-router-dom';
import '../../assets/css/event.css';
import DeleteConfirmationModal from '../../components/modal/DeleteConfirmationModal';
import { formatDateTimeForTable } from '../../components/dateTime/dateTimeUtils';
import { ENGAGEMENT_PATHS } from '../../utils/constants';
import usePersistedTablePage from '../../hooks/usePersistedTablePage';
import useTableNavigation from '../../hooks/useTableNavigation';
import FilterComponent from '../../components/common/FilterComponent';
import { initializeServerSideDataTable } from '../../utils/dataTableServerSide';
import axiosInstance from '../../configs/axiosInstance';
import { ENGAGEMENT_LOADING } from '../../store/constants/actionTypes';

// @ts-ignore
$.DataTable = require('datatables.net-bs');
require('datatables.net-rowreorder');

// Helper function to flatten nested engagement data
const flattenEngagementData = (data) => {
    const flattenedData = [];
    if (!Array.isArray(data)) return flattenedData;
    
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
                    isActive: track.isActive,
                    createdAt: track.createdAt,
                    updatedAt: track.updatedAt,
                    sessionsCount: track.sessionsCount || track.sessions?.length || 0,
                    isFirstTrack: index === 0,
                    totalSessionsCount: eventGroup.totalSessionsCount,
                    statistics: eventGroup.statistics,
                    displayOrder: typeof track.displayOrder === 'number' ? track.displayOrder : index
                });
            });
        }
    });

    // Sort by displayOrder
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

    return flattenedData;
};

const EngagementList = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();

    const { events: engagementEvents } = useSelector((state) => state.engagement);

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [engagementToDelete, setEngagementToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isReordering, setIsReordering] = useState(false);
    const [selectedEventId, setSelectedEventId] = useState('');
    const [activeFilters, setActiveFilters] = useState({});
    const tableRef = useRef(null);
    const selectedEventIdRef = useRef('');
    const { restoreTablePage } = usePersistedTablePage();
    
    const { handleView: handleViewWithPage, handleEdit: handleEditWithPage, handleAdd: handleAddWithPage } = useTableNavigation({
        tableRef,
        listPath: ENGAGEMENT_PATHS.LIST_ENGAGEMENTS,
        viewPath: ENGAGEMENT_PATHS.VIEW_ENGAGEMENT,
        editPath: ENGAGEMENT_PATHS.EDIT_ENGAGEMENT,
        addPath: ENGAGEMENT_PATHS.ADD_ENGAGEMENT
    });

    // Initialize filters from URL on mount
    useEffect(() => {
        const urlParams = new URLSearchParams(location.search);
        const eventId = urlParams.get('eventId') || '';
        setSelectedEventId(eventId);
        selectedEventIdRef.current = eventId;
        setActiveFilters({ event: eventId });
    }, []);

    const handleReorder = React.useCallback(async (items) => {
        if (!Array.isArray(items) || items.length === 0 || isReordering) {
            return;
        }

        const uniqueItemsMap = new Map();
        items.forEach((item) => {
            if (item?.id && typeof item.displayOrder === 'number' && !uniqueItemsMap.has(item.id)) {
                uniqueItemsMap.set(item.id, item);
            }
        });

        const payload = Array.from(uniqueItemsMap.values());
        if (payload.length === 0) {
            return;
        }

        setIsReordering(true);
        try {
            const result = await dispatch(reorderEngagements(payload));
            if (!result?.error && tableRef.current) {
                // Reload table after reorder
                tableRef.current.ajax.reload(null, false);
            }
        } catch (error) {
            console.error('Error reordering engagements:', error);
        } finally {
            setIsReordering(false);
        }
    }, [dispatch, isReordering]);

    const handleAdd = () => {
        handleAddWithPage();
    };

    const handleEdit = (data) => {
        if (typeof data === 'string') {
            handleEditWithPage({ id: data });
        } else {
            handleEditWithPage(data);
        }
    };

    const handleView = (data) => {
        if (typeof data === 'string') {
            handleViewWithPage({ id: data });
        } else {
            handleViewWithPage(data);
        }
    };

    const handleSessions = (trackId) => {
        if (!trackId) return;
        const urlParams = new URLSearchParams(window.location.search);
        const currentPage = urlParams.get('page');
        const url = currentPage ? `${ENGAGEMENT_PATHS.SESSIONS}/${trackId}?page=${currentPage}` : `${ENGAGEMENT_PATHS.SESSIONS}/${trackId}`;
        navigate(url);
    };

    const handleDelete = (id, rowData) => {
        // Use rowData if provided, otherwise create minimal engagement object
        const engagement = rowData ? {
            id: id,
            track: {
                title: rowData.trackTitle || 'Unknown Track',
                id: rowData.trackId
            }
        } : {
            id: id,
            track: {
                title: 'Unknown Track',
                id: null
            }
        };
        
        setEngagementToDelete(engagement);
        setShowDeleteModal(true);
    };

    const handleToggleStatus = React.useCallback(async (id) => {
        await dispatch(toggleEngagementStatus(id));
        // Reload table after toggle
        if (tableRef.current) {
            tableRef.current.ajax.reload(null, false);
        }
    }, [dispatch]);

    const confirmDelete = async () => {
        if (!engagementToDelete || !engagementToDelete.id) return;

        setIsDeleting(true);
        try {
            const result = await dispatch(deleteEngagement(engagementToDelete.id));
            if (result && !result.error) {
                // Reload table after successful deletion
                if (tableRef.current) {
                    tableRef.current.ajax.reload(null, false);
                }
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

    const handleApplyFilters = async (filters) => {
        const newEventId = filters.eventId || '';
        const currentEventId = activeFilters.event || '';
        const filterChanged = currentEventId !== newEventId;
        
        // Update state first
        setSelectedEventId(newEventId);
        selectedEventIdRef.current = newEventId;
        setActiveFilters(newEventId ? { event: newEventId } : {});
        
        // Update URL with filters
        const urlParams = new URLSearchParams();
        if (newEventId) {
            urlParams.set('eventId', newEventId);
        }
        
        // Reset to page 1 when filter changes
        if (filterChanged) {
            urlParams.set('page', '1');
        } else {
            const currentPage = new URLSearchParams(location.search).get('page');
            if (currentPage) {
                urlParams.set('page', currentPage);
            }
        }
        
        const newUrl = urlParams.toString() ? `${location.pathname}?${urlParams.toString()}` : location.pathname;
        navigate(newUrl, { replace: true });
        
        // Reload table with new filters
        if (tableRef.current) {
            tableRef.current.ajax.reload(null, false);
        }
    };

    const handleClearFilters = async () => {
        setSelectedEventId('');
        selectedEventIdRef.current = '';
        setActiveFilters({});
        
        // Update URL - reset to page 1 when clearing filters
        const urlParams = new URLSearchParams();
        urlParams.set('page', '1');
        
        const newUrl = urlParams.toString() ? `${location.pathname}?${urlParams.toString()}` : location.pathname;
        navigate(newUrl, { replace: true });
        
        // Reload table
        if (tableRef.current) {
            tableRef.current.ajax.reload(null, false);
        }
    };

    const handleEventChange = async (eventId) => {
        const newEventId = eventId || '';
        setSelectedEventId(newEventId);
        selectedEventIdRef.current = newEventId;
        
        let eventName = null;
        if (newEventId && engagementEvents && engagementEvents.length > 0) {
            const selectedEvent = engagementEvents.find(event => {
                const eventIdStr = String(event.id || '');
                const searchId = String(newEventId);
                return eventIdStr === searchId;
            });
            if (selectedEvent) {
                eventName = selectedEvent.name || selectedEvent.eventName || null;
            }
        }
        
        await handleApplyFilters({
            eventId: newEventId,
            eventName: eventName
        });
    };

    // Transform events for FilterComponent
    const transformedEvents = React.useMemo(() => {
        return (engagementEvents || []).map(event => ({
            id: event.id,
            name: event.name || event.eventName || ''
        }));
    }, [engagementEvents]);

    useEffect(() => {
        const columns = [
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
                data: null,
                title: 'Track',
                width: '30%',
                render: function (data, type, row) {
                    if (type === 'sort' || type === 'type') {
                        return row.trackTitle || '';
                    }
                    return `
                        <div class="d-inline-block align-middle" style="max-width: 100%;">
                            <h6 class="m-b-0" style="font-size: 14px; font-weight: 600;">${row.trackTitle || 'Unknown Track'}</h6>
                            <p class="m-b-0 text-muted" style="font-size: 12px; margin-top: 4px;">
                                <i class="feather icon-calendar" style="color: #17a2b8;"></i> <span style="font-weight: 500;">${row.eventName || 'N/A'}</span>
                            </p>
                        </div>
                    `;
                }
            },
            {
                data: 'createdAt',
                title: 'Created Date',
                width: '15%',
                render: function (data, type, row) {
                    if (data) {
                        return formatDateTimeForTable(data);
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
        ];

        // Get ajaxParams function that includes eventId filter
        // Use ref to always get the latest selectedEventId value
        const getAjaxParams = () => {
            const params = {};
            const currentEventId = selectedEventIdRef.current;
            if (currentEventId) {
                params.eventId = currentEventId;
            }
            return params;
        };

        // Initialize server-side DataTable
        const tableInstance = initializeServerSideDataTable({
            tableSelector: '#engagements-data-table',
            ajaxUrl: '/engagements',
            ajaxMethod: 'GET',
            columns: columns,
            ajaxParams: getAjaxParams,
            fetchAction: getAllEngagements, // Use Redux action instead of direct API call
            dispatch: dispatch,
            loadingActionType: ENGAGEMENT_LOADING,
            dom: "<'row mb-3'<'col-sm-12 col-md-6'l><'col-sm-12 col-md-6 d-flex justify-content-end align-items-center'<'search-container'f><'add-engagement-button ml-2'>>>" +
                 "<'row'<'col-sm-12'tr>>" +
                 "<'row'<'col-sm-12 col-md-5'i><'col-sm-12 col-md-7'p>>",
            pageLength: 10,
            lengthMenu: [[10, 25, 50, 100, -1], [10, 25, 50, 100, 'All']],
            order: [],
            rowReorder: {
                dataSrc: 'displayOrder',
                selector: 'td.reorder-handle-column'
            },
            onDataLoaded: (data, metadata, fullResponse) => {
                // Store events from response for filter dropdown
                if (fullResponse?.events) {
                    dispatch({
                        type: 'ENGAGEMENT_EVENTS_LIST',
                        payload: fullResponse.events
                    });
                }
                // Return flattened data - this will be used by DataTables
                return flattenEngagementData(data);
            },
            restoreTablePage: restoreTablePage,
            initCompleteCallback: function (settings, json, api) {
                // Add "Create New Engagement" button
                if (!$('#addEngagementBtn').length) {
                    $('.add-engagement-button').html(`
                        <button class="btn btn-primary d-flex align-items-center ml-2" id="addEngagementBtn">
                            <i class="feather icon-plus mr-1"></i>
                            Create
                        </button>
                    `);
                    $('#addEngagementBtn').on('click', handleAdd);
                }

                // Attach event listeners for actions
                $(settings.nTable).off('click', '.view-btn').on('click', '.view-btn', function () {
                    const rowData = api.row($(this).closest('tr')).data();
                    if (rowData && rowData.engagementId) {
                        handleView({ id: rowData.engagementId });
                    }
                });

                $(settings.nTable).off('click', '.sessions-btn').on('click', '.sessions-btn', function () {
                    const trackId = $(this).data('trackid');
                    handleSessions(trackId);
                });

                $(settings.nTable).off('click', '.edit-btn').on('click', '.edit-btn', function () {
                    const rowData = api.row($(this).closest('tr')).data();
                    if (rowData && rowData.engagementId) {
                        handleEdit({ id: rowData.engagementId });
                    }
                });

                $(settings.nTable).off('click', '.delete-btn').on('click', '.delete-btn', function () {
                    const rowData = api.row($(this).closest('tr')).data();
                    const id = $(this).data('id');
                    if (id && rowData) {
                        handleDelete(id, rowData);
                    }
                });

                $(settings.nTable).off('click', '.toggle-status-badge').on('click', '.toggle-status-badge', function () {
                    const id = $(this).data('id');
                    if (id) {
                        handleToggleStatus(id);
                    }
                });

            }
        });

        // Setup row reordering event handler
        if (tableInstance && $.fn.dataTable && $.fn.dataTable.RowReorder) {
            tableInstance.on('row-reorder', function (e, diff) {
                if (!diff || diff.length === 0) {
                    return;
                }

                const api = tableInstance;
                const reorderedItems = diff.map((item) => {
                    const rowData = api.row(item.node).data();
                    const newOrderValue = item.newPosition;
                    if (rowData) {
                        rowData.displayOrder = newOrderValue;
                    }
                    return {
                        id: rowData?.engagementId,
                        displayOrder: newOrderValue
                    };
                }).filter((item) => item.id);

                api.rows().invalidate().draw(false);

                if (reorderedItems.length > 0) {
                    handleReorder(reorderedItems);
                }
            });
        }

        tableRef.current = tableInstance;

        return () => {
            if (tableRef.current) {
                tableRef.current.destroy();
                tableRef.current = null;
            }
        };
    }, []); // Only run once on mount - use refs for dynamic values

    return (
        <React.Fragment>
            <FilterComponent
                events={transformedEvents}
                showUserFilter={false}
                showDateFilter={false}
                showEventFilter={true}
                selectedEventId={selectedEventId}
                onEventChange={handleEventChange}
                onApplyFilters={handleApplyFilters}
                onClearFilters={handleClearFilters}
                activeFilters={activeFilters}
                loadingDropdowns={false}
            />
            <Row>
                <Col>
                    <Card>
                        <Card.Header>
                            <Card.Title as="h5">Engagement Management </Card.Title>
                        </Card.Header>
                        <Card.Body>
                            <Table striped responsive id="engagements-data-table" className="table table-hover">
                                <thead></thead>
                                <tbody></tbody>
                            </Table>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            <DeleteConfirmationModal
                show={showDeleteModal}
                onHide={handleCloseDeleteModal}
                onConfirm={confirmDelete}
                title="Delete Engagement"
                message={`Are you sure you want to delete this engagement${engagementToDelete?.track?.title ? ` for track "${engagementToDelete.track.title}"` : ''}? This action cannot be undone.`}
                isDeleting={isDeleting}
            />
        </React.Fragment>
    );
};

export default EngagementList;
