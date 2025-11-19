import * as React from 'react';
import { useEffect, useState } from 'react';
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
import { ENGAGEMENT_PATHS, PROGRAMME_PATHS } from '../../utils/constants';
import usePersistedTablePage from '../../hooks/usePersistedTablePage';
import useTableNavigation from '../../hooks/useTableNavigation';
import FilterComponent from '../../components/common/FilterComponent';

// @ts-ignore
$.DataTable = require('datatables.net-bs');
require('datatables.net-rowreorder');

function engagementsTable(data, handleAdd, handleEdit, handleDelete, handleView, handleToggleStatus, handleSessions, handleReorder, restoreTablePage) {
    let tableZero = '#engagements-data-table';
    $.fn.dataTable.ext.errMode = 'throw';

    // Flatten grouped data to show events with their tracks
    // Backend already sorts events by event name, so we maintain that order
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
                    statistics: eventGroup.statistics,
                    displayOrder: typeof track.displayOrder === 'number' ? track.displayOrder : index
                });
            });
        }
    });

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

    // Destroy existing table if it exists
    if ($.fn.DataTable.isDataTable(tableZero)) {
        $(tableZero).DataTable().clear().destroy();
    }

    const tableInstance = $(tableZero).DataTable({
        data: flattenedData || [],
        order: [],
        searching: true,
        searchDelay: 500,
        pageLength: 10,
        lengthMenu: [
            [10, 25, 50, 100, -1],
            [10, 25, 50, 100, 'All']
        ],
        rowReorder: {
            dataSrc: 'displayOrder',
            selector: 'td.reorder-handle-column'
        },
        processing: true,
        pagingType: 'full_numbers',
        dom:
            "<'row mb-3'<'col-sm-12 col-md-6'l><'col-sm-12 col-md-6 d-flex justify-content-end align-items-center'<'search-container'f><'add-engagement-button ml-2'>>>" +
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
            // Restore table page from URL if restoreTablePage function is provided
            if (typeof restoreTablePage === 'function') {
                const api = new $.fn.dataTable.Api(settings);
                restoreTablePage(api);
            }

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
        },
        drawCallback: function (settings) {
            const api = new $.fn.dataTable.Api(settings);
            // Attach event listeners after each draw
            $('.view-btn')
                .off('click')
                .on('click', function () {
                    const rowData = api.row($(this).closest('tr')).data();
                    if (rowData && rowData.engagementId) {
                        handleView({ id: rowData.engagementId });
                    }
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
                    const rowData = api.row($(this).closest('tr')).data();
                    if (rowData && rowData.engagementId) {
                        handleEdit({ id: rowData.engagementId });
                    }
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

    tableInstance.on('row-reorder', function (e, diff) {
        if (!diff || diff.length === 0) {
            return;
        }

        const reorderedItems = diff.map((item) => {
            const rowData = tableInstance.row(item.node).data();
            const newOrderValue = item.newPosition;
            if (rowData) {
                rowData.displayOrder = newOrderValue;
            }
            return {
                id: rowData?.engagementId,
                displayOrder: newOrderValue
            };
        }).filter((item) => item.id);

        tableInstance.rows().invalidate().draw(false);

        if (typeof handleReorder === 'function') {
            if (typeof tableInstance.processing === 'function') {
                tableInstance.processing(true);
            }
            Promise.resolve(handleReorder(reorderedItems)).finally(() => {
                if ($.fn.DataTable.isDataTable(tableZero) && typeof tableInstance.processing === 'function') {
                    tableInstance.processing(false);
                }
            });
        }
    });

    return tableInstance;
}

const EngagementList = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();

    const { engagements, loading, events: engagementEvents } = useSelector((state) => state.engagement);

    const [currentTable, setCurrentTable] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [engagementToDelete, setEngagementToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isReordering, setIsReordering] = useState(false);
    const [selectedEventId, setSelectedEventId] = useState('');
    const [activeFilters, setActiveFilters] = useState({});
    const tableRef = React.useRef(null);
    const isApplyingFiltersRef = React.useRef(false);
    const lastUrlParamsRef = React.useRef('');
    const filtersAppliedRef = React.useRef(false);
    const { restoreTablePage, checkAndAdjustPage } = usePersistedTablePage();
    
    const { handleView: handleViewWithPage, handleEdit: handleEditWithPage, handleAdd: handleAddWithPage, handleBack } = useTableNavigation({
        tableRef,
        listPath: ENGAGEMENT_PATHS.LIST_ENGAGEMENTS,
        viewPath: ENGAGEMENT_PATHS.VIEW_ENGAGEMENT,
        editPath: ENGAGEMENT_PATHS.EDIT_ENGAGEMENT,
        addPath: ENGAGEMENT_PATHS.ADD_ENGAGEMENT
    });


    // Initialize filters from URL and fetch engagements
    // Only run on initial mount, not on every URL change
    useEffect(() => {
        const urlParams = new URLSearchParams(location.search);
        const eventId = urlParams.get('eventId') || '';
        setSelectedEventId(eventId);
        setActiveFilters({ event: eventId });
        
        // Fetch engagements with filters from URL
        const fetchData = async () => {
            const filters = {};
            if (eventId) {
                filters.eventId = eventId;
            }
            await dispatch(getAllEngagements(filters));
        };
        fetchData();
        lastUrlParamsRef.current = location.search;
        filtersAppliedRef.current = true;
        return () => destroyTable();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Only run once on mount

    // Handle external URL changes (browser back/forward)
    useEffect(() => {
        const currentUrlParams = location.search;
        
        // Skip if we're currently applying filters internally
        if (isApplyingFiltersRef.current) {
            return;
        }
        
        // Skip if URL matches what we just set (already handled by handleApplyFilters)
        if (filtersAppliedRef.current) {
            const expectedUrlParams = lastUrlParamsRef.current;
            const normalizedCurrent = currentUrlParams || '';
            const normalizedExpected = expectedUrlParams || '';
            const currentQuery = normalizedCurrent.replace(/^\?/, '');
            const expectedQuery = normalizedExpected.replace(/^\?/, '');
            if (currentQuery === expectedQuery) {
                return; // Already handled
            }
        }
        
        // URL changed externally (browser back/forward) - apply filters from URL
        const urlParams = new URLSearchParams(currentUrlParams);
        const eventId = urlParams.get('eventId') || '';
        setSelectedEventId(eventId);
        setActiveFilters({ event: eventId });
        
        const fetchData = async () => {
            const filters = {};
            if (eventId) {
                filters.eventId = eventId;
            }
            await dispatch(getAllEngagements(filters));
        };
        fetchData();
        lastUrlParamsRef.current = currentUrlParams;
        filtersAppliedRef.current = true;
    }, [location.search, dispatch]);

    useEffect(() => {
        initializeTable();
        return () => destroyTable();
    }, [engagements]);

    const destroyTable = () => {
        if (currentTable) {
            currentTable.off('page.dt');
            $('#engagements-data-table').off('click', '.delete-btn');
            $('#engagements-data-table').off('click', '.edit-btn');
            $('#engagements-data-table').off('click', '.view-btn');
            $('#engagements-data-table').off('click', '.sessions-btn');
            $('#engagements-data-table').off('click', '.toggle-status-badge');
            $('#engagements-data-table').off('row-reorder');
            currentTable.destroy();
            setCurrentTable(null);
            tableRef.current = null;
        }
    };

    const handleReorder = async (items) => {
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
            if (!result?.error) {
                const filters = {};
                if (selectedEventId) {
                    filters.eventId = selectedEventId;
                }
                await dispatch(getAllEngagements(filters));
            }
        } catch (error) {
            console.error('Error reordering engagements:', error);
        } finally {
            setIsReordering(false);
        }
    };

    const initializeTable = () => {
        destroyTable();
        if (Array.isArray(engagements) && engagements.length >= 0) {
            const table = engagementsTable(
                engagements,
                handleAdd,
                handleEdit,
                handleDelete,
                handleView,
                handleToggleStatus,
                handleSessions,
                handleReorder,
                restoreTablePage
            );
            setCurrentTable(table);
            tableRef.current = table;
            if (table && typeof checkAndAdjustPage === 'function') {
                checkAndAdjustPage(table);
            }
        }
    };

    const handleAdd = () => {
        handleAddWithPage();
    };

    const handleEdit = (data) => {
        if (typeof data === 'string') {
            // Backward compatibility: if id is passed as string
            handleEditWithPage({ id: data });
        } else {
            handleEditWithPage(data);
        }
    };

    const handleView = (data) => {
        if (typeof data === 'string') {
            // Backward compatibility: if id is passed as string
            handleViewWithPage({ id: data });
        } else {
            handleViewWithPage(data);
        }
    };

    const handleQA = (id) => {
        const urlParams = new URLSearchParams(window.location.search);
        const currentPage = urlParams.get('page');
        const url = currentPage ? `/engagement/qa/${id}?page=${currentPage}` : `/engagement/qa/${id}`;
        navigate(url);
    };

    const handleSessions = (trackId) => {
        if (!trackId) return;
        const urlParams = new URLSearchParams(window.location.search);
        const currentPage = urlParams.get('page');
        const url = currentPage ? `${ENGAGEMENT_PATHS.SESSIONS}/${trackId}?page=${currentPage}` : `${ENGAGEMENT_PATHS.SESSIONS}/${trackId}`;
        navigate(url);
    };

    const handleDelete = (id) => {
        // Find engagement from grouped format
        let engagement = null;
        if (engagements && engagements.length > 0) {
            for (const engagementGroup of engagements) {
                if (engagementGroup.programmeTracks && engagementGroup.programmeTracks.length > 0) {
                    const track = engagementGroup.programmeTracks.find(t => t.engagementId === id);
                    if (track) {
                        // Create engagement object with id and track info
                        engagement = {
                            id: id,
                            track: {
                                title: track.title,
                                id: track.id
                            }
                        };
                        break;
                    }
                }
            }
        }
        
        if (engagement) {
            setEngagementToDelete(engagement);
            setShowDeleteModal(true);
        } else {
            console.error('Engagement not found:', id);
        }
    };

    const handleToggleStatus = async (id) => {
        await dispatch(toggleEngagementStatus(id));
        const filters = {};
        if (selectedEventId) {
            filters.eventId = selectedEventId;
        }
        await dispatch(getAllEngagements(filters));
    };

    const confirmDelete = async () => {
        if (!engagementToDelete || !engagementToDelete.id) return;

        setIsDeleting(true);
        try {
            const result = await dispatch(deleteEngagement(engagementToDelete.id));
            if (result && !result.error) {
                // Refresh the list after successful deletion
                const filters = {};
                if (selectedEventId) {
                    filters.eventId = selectedEventId;
                }
                await dispatch(getAllEngagements(filters));
                setShowDeleteModal(false);
                setEngagementToDelete(null);
            }
        } catch (error) {
            console.error('Error deleting engagement:', error);
            setIsDeleting(false);
        } finally {
            setIsDeleting(false);
        }
    };

    const handleCloseDeleteModal = () => {
        setShowDeleteModal(false);
        setEngagementToDelete(null);
    };

    const handleApplyFilters = async (filters) => {
        // Handle empty eventId as clearing the filter
        const newEventId = filters.eventId || '';
        const currentEventId = activeFilters.event || '';
        const filterChanged = currentEventId !== newEventId;
        
        // Set flag to prevent useEffect from running
        isApplyingFiltersRef.current = true;
        
        // Apply filters immediately
        const filterParams = {};
        if (newEventId) {
            filterParams.eventId = newEventId;
        }
        await dispatch(getAllEngagements(filterParams));
        
        // Update URL with filters
        const urlParams = new URLSearchParams();
        
        // Only add eventId to URL if it's not empty
        if (newEventId) {
            urlParams.set('eventId', newEventId);
        }
        
        // Reset to page 1 when filter changes, otherwise preserve current page
        if (filterChanged) {
            urlParams.set('page', '1');
        } else {
            const currentPage = new URLSearchParams(location.search).get('page');
            if (currentPage) {
                urlParams.set('page', currentPage);
            }
        }
        
        const newUrl = urlParams.toString() ? `${location.pathname}?${urlParams.toString()}` : location.pathname;
        const newUrlParams = newUrl.includes('?') ? newUrl.split('?')[1] : '';
        lastUrlParamsRef.current = newUrlParams ? `?${newUrlParams}` : '';
        filtersAppliedRef.current = true;
        
        navigate(newUrl, { replace: true });
        
        // Update state - clear filter if eventId is empty
        setSelectedEventId(newEventId);
        setActiveFilters(newEventId ? { event: newEventId } : {});
        
        // Reset flag after a short delay
        setTimeout(() => {
            isApplyingFiltersRef.current = false;
        }, 100);
    };

    const handleClearFilters = async () => {
        // Check if there are active filters to clear
        const hasActiveFilters = activeFilters.event;
        
        // Set flag to prevent useEffect from running
        isApplyingFiltersRef.current = true;
        
        // Clear filters immediately
        await dispatch(getAllEngagements({}));
        
        // Update URL - reset to page 1 when clearing filters
        const urlParams = new URLSearchParams();
        
        // Only preserve page if no filters were active (shouldn't happen, but just in case)
        if (!hasActiveFilters) {
            const currentPage = new URLSearchParams(location.search).get('page');
            if (currentPage) {
                urlParams.set('page', currentPage);
            }
        } else {
            // Reset to page 1 when clearing filters
            urlParams.set('page', '1');
        }
        
        const newUrl = urlParams.toString() ? `${location.pathname}?${urlParams.toString()}` : location.pathname;
        const newUrlParams = newUrl.includes('?') ? newUrl.split('?')[1] : '';
        lastUrlParamsRef.current = newUrlParams ? `?${newUrlParams}` : '';
        filtersAppliedRef.current = true;
        
        navigate(newUrl, { replace: true });
        
        setSelectedEventId('');
        setActiveFilters({});
        
        // Reset flag after a short delay
        setTimeout(() => {
            isApplyingFiltersRef.current = false;
        }, 100);
    };

    const handleEventChange = async (eventId) => {
        const newEventId = eventId || '';
        setSelectedEventId(newEventId);
        
        // Automatically apply filter when event is changed (including "All Events")
        // Find event name for the filter
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
        
        // Apply filters immediately
        await handleApplyFilters({
            eventId: newEventId,
            eventName: eventName
        });
    };

    // Transform events for FilterComponent (from engagements response)
    const transformedEvents = React.useMemo(() => {
        return (engagementEvents || []).map(event => ({
            id: event.id,
            name: event.name || event.eventName || ''
        }));
    }, [engagementEvents]);

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

