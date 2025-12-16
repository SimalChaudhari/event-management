import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Table from 'react-bootstrap/Table';
import { useSelector, useDispatch } from 'react-redux';
import * as $ from 'jquery';
import { eventDelete } from '../../../store/actions/eventActions';
import { useLocation, useNavigate } from 'react-router-dom';
import '../../../assets/css/event.css';
import DeleteConfirmationModal from '../../../components/modal/DeleteConfirmationModal';
import { API_URL, DUMMY_PATH } from '../../../configs/env';
import { formatDateTimeForTable } from '../../../components/dateTime/dateTimeUtils';
import FilterComponent from '../../../components/common/FilterComponent';
import { EVENT_PATHS } from '../../../utils/constants';
import usePersistedTablePage from '../../../hooks/usePersistedTablePage';
import useTableNavigation from '../../../hooks/useTableNavigation';
import useFilterLogic from '../../../hooks/useFilterLogic';
import { renderPublishDates } from '../../../components/events/PublishDatesRenderer.jsx';
import { initializeServerSideDataTable } from '../../../utils/dataTableServerSide';
import axiosInstance from '../../../configs/axiosInstance';
import { EVENT_FILTER_LIST, UPCOMING_EVENT_LIST, EVENT_LOADING } from '../../../store/constants/actionTypes';

// @ts-ignore
$.DataTable = require('datatables.net-bs');

function upcomingEventTable(handleAdd, handleEdit, handleDelete, handleView, restoreTablePage, ajaxParams = {}, dispatch = null) {
    let tableZero = '#data-table-zero';
    $.fn.dataTable.ext.errMode = 'throw';

    // Define columns
    const columns = [
        {
            data: 'name',
            render: function (data, type, row) {
                const imageUrl = DUMMY_PATH;
                const eventDate = new Date(row.startDate);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const daysUntilEvent = Math.ceil((eventDate - today) / (1000 * 60 * 60 * 24));

                const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

                let badgeClass = 'badge-light-info';
                let statusText = '';

                if (daysUntilEvent < 0) {
                    badgeClass = 'badge-light-secondary';
                    statusText = `Event Expired (${Math.abs(daysUntilEvent)} days ago)`;
                } else if (daysUntilEvent === 0) {
                    badgeClass = 'badge-light-success';
                    statusText = 'Today';
                } else {
                    if (daysUntilEvent <= 3) {
                        badgeClass = 'badge-light-danger';
                    } else if (daysUntilEvent <= 7) {
                        badgeClass = 'badge-light-warning';
                    }
                    statusText = `in ${daysUntilEvent} days`;
                }

                return `
                    <div class="d-inline-block align-middle">
                        <img src="${row.image ? `${API_URL}/${row.image}` : imageUrl}" alt="user" class="img-radius align-top m-r-15" style="width:50px; height:50px; object-fit:cover;" />
                        <div class="d-inline-block">
                            <p class="m-b-0">
                                <h6>${row.name}</h6>
                                <span class="badge ${badgeClass}">
                                    ${eventDate.getDate()} ${monthNames[eventDate.getMonth()]} ${eventDate.getFullYear()}
                                    <span class="ml-1">${statusText}</span>
                                </span>
                            </p>
                            <span class="badge badge-primary font-weight-bold">Registered Participants: ${row.attendanceCount}</span>
                        </div>
                    </div> 
                `;
            }
        },
        {
            data: 'type',
            title: 'User Type',
            render: function (data, type, row) {
                let bgColor = '';
                if (row.type?.toLowerCase() === 'physical') {
                    bgColor = 'background-color:rgb(162, 209, 231); padding: 6px 12px; border-radius: 4px; color:rgb(14, 13, 13); font-weight: 500;';
                } else if (row.type?.toLowerCase() === 'virtual') {
                    bgColor = 'background-color:rgb(223, 228, 165); padding: 6px 12px; border-radius: 4px; color:rgb(14, 13, 13); font-weight: 500;';
                }
                return `<div class="text-wrap" style="margin-top: 10px; max-width: 200px;"><span style="${bgColor}">${row.type || 'N/A'}</span></div>`;
            }
        },
        {
            data: 'price',
            title: 'Price',
            render: function (data, type, row) {
                const currencySymbol = row.currency === 'USD' ? '$' : '';
                return `${currencySymbol}${parseFloat(data).toFixed(2)}(${row.currency})`;
            }
        },
        {
            data: 'location',
            title: 'Location / Venue / Country',
            render: function (data, type, row) {
                return `
                    <div class="d-inline-block align-middle">
                        <h6 class="m-b-5">${row.location || 'N/A'}</h6>
                        <p class="m-b-0">
                            <span class="badge badge-success">
                                <i class="feather icon-map-pin mr-1"></i>
                                ${row.venue || 'N/A'}, ${row.country || 'N/A'}
                            </span>
                        </p>
                    </div>
                `;
            }
        },
        {
            data: 'startDate',
            title: 'Event Date',
            render: function (data, type, row) {
                return formatDateTimeForTable(row.startDate, row.startTime);
            }
        },
        {
            data: 'publishStartDate',
            title: 'Publish Dates',
            render: function (data, type, row) {
                return renderPublishDates(row);
            }
        },
        {
            data: null,
            title: 'Actions',
            orderable: false,
            render: function (data, type, row) {
                return `
                    <div class="btn-group" role="group" aria-label="Actions">
                        <button type="button" class="btn btn-icon btn-success view-btn" data-id="${row.id}" title="View" 
                            style="margin-right: 10px; width: 40px; height: 40px; border-radius: 50%; display: inline-flex; justify-content: center; align-items: center;">
                            <i class="feather icon-eye"></i>
                        </button>
                        <button type="button" class="btn btn-warning btn-circle btn-sm edit-btn" data-id="${row.id}" title="Edit" 
                            style="margin-right: 10px; width: 40px; height: 40px; border-radius: 50%; display: inline-flex; justify-content: center; align-items: center;">
                            <i class="feather icon-edit"></i>
                        </button>
                        <button type="button" class="btn btn-danger btn-circle btn-sm delete-btn" data-id="${row.id}" title="Delete" 
                            style="width: 40px; height: 40px; border-radius: 50%; display: inline-flex; justify-content: center; align-items: center;">
                            <i class="feather icon-trash-2"></i>
                        </button>
                    </div>
                `;
            }
        }
    ];

    // Initialize server-side DataTable
    const dataTableInstance = initializeServerSideDataTable({
        tableSelector: tableZero,
        ajaxUrl: '/events',
        ajaxMethod: 'GET',
        columns: columns,
        ajaxParams: ajaxParams,
        axiosInstance: axiosInstance,
        dispatch: dispatch, // Pass dispatch for loading state
        loadingActionType: EVENT_LOADING, // Use EVENT_LOADING to show GlobalLoader
        onDataLoaded: (data, metadata, fullResponse) => {
            // Extract filter data from response and store in Redux
            if (fullResponse?.filter?.events && dispatch) {
                dispatch({
                    type: EVENT_FILTER_LIST,
                    payload: fullResponse.filter.events
                });
                // Also update the upcoming events filter in Redux store
                dispatch({
                    type: UPCOMING_EVENT_LIST,
                    payload: {
                        ...fullResponse,
                        filter: fullResponse.filter
                    }
                });
            }
        },
        restoreTablePage: restoreTablePage,
        pageLength: 10,
        lengthMenu: [[5, 10, 25, 50, -1], [5, 10, 25, 50, 'All']],
        order: [[4, 'desc']], // Sort by Event Date column (index 4) in descending order
        initCompleteCallback: function (settings, json, api) {
            // Add button initialization
            if (!$('#addUpcomingEventBtn').length) {
                $('.add-event-button').html(`
                    <button class="btn btn-primary d-flex align-items-center ml-2" id="addUpcomingEventBtn">
                        <i class="feather icon-plus mr-1"></i>
                        Add
                    </button>
                `);
                $('#addUpcomingEventBtn').on('click', handleAdd);
            }

            // Add event listeners for action buttons
            $(tableZero + ' tbody').off('click', '.view-btn').on('click', '.view-btn', function () {
                const table = $(tableZero).DataTable();
                const rowData = table.row($(this).closest('tr')).data();
                if (rowData && rowData.id) {
                    let currentPage = null;
                    try {
                        const pageInfo = table.page.info();
                        if (pageInfo && pageInfo.page !== undefined) {
                            currentPage = (pageInfo.page + 1).toString();
                        }
                    } catch (e) {
                        const urlParams = new URLSearchParams(window.location.search);
                        currentPage = urlParams.get('page');
                    }
                    handleView(rowData, currentPage);
                } else {
                    const id = $(this).data('id');
                    if (id) {
                        handleView({ id }, null);
                    }
                }
            });

            $(tableZero + ' tbody').off('click', '.edit-btn').on('click', '.edit-btn', function () {
                const table = $(tableZero).DataTable();
                const rowData = table.row($(this).closest('tr')).data();
                if (rowData && rowData.id) {
                    handleEdit(rowData);
                } else {
                    const id = $(this).data('id');
                    if (id) {
                        handleEdit({ id });
                    }
                }
            });

            $(tableZero + ' tbody').off('click', '.delete-btn').on('click', '.delete-btn', function () {
                const id = $(this).data('id');
                if (id) {
                    handleDelete(id);
                }
            });
        },
        dom: "<'row mb-3'<'col-sm-12 col-md-6'l><'col-sm-12 col-md-6 d-flex justify-content-end align-items-center'<'search-container'f><'add-event-button ml-2'>>>" +
             "<'row'<'col-sm-12'tr>>" +
             "<'row'<'col-sm-12 col-md-5'i><'col-sm-12 col-md-7'p>>"
    });

    return dataTableInstance;
}


const UpcomingEvents = () => {
    const dispatch = useDispatch();
    const filterData = useSelector((state) => state.event?.upcomingEvents?.filter); // Get filter data from response
    const eventFilterList = useSelector((state) => state.event?.eventFilterList || []); // Get from Redux store

    const [currentTable, setCurrentTable] = useState(null);
    const location = useLocation();
    const navigate = useNavigate();
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const tableRef = useRef(null);

    // Transform filter events data to match FilterComponent format
    // IMPORTANT: For upcoming events, use filterData?.events (upcoming events only) not eventFilterList (all events)
    // This ensures the dropdown only shows upcoming events, not all events
    const transformedFilterEvents = useMemo(() => {
        // For upcoming events page, prioritize filterData?.events (contains only upcoming events)
        // Only use eventFilterList as fallback if filterData?.events is not available
        // This ensures we only show upcoming events in the dropdown, not all events
        let eventsToUse = filterData?.events?.length > 0 ? filterData.events : (eventFilterList || []);
        
        // CRITICAL: Only filter out past events if we're using eventFilterList (all events)
        // filterData?.events already comes filtered from backend with upcoming=true, so no need to filter again
        if (!filterData?.events?.length && eventFilterList?.length > 0) {
            // We're using eventFilterList (all events), so filter out past events
            const today = new Date();
            today.setHours(0, 0, 0, 0); // Set to start of day for accurate comparison
            
            eventsToUse = eventsToUse.filter(event => {
                if (!event.startDate) {
                    // If no startDate, include it (might be a data issue, but don't exclude)
                    return true;
                }
                
                try {
                    // Parse the event start date - handle different date formats
                    let eventDate;
                    if (typeof event.startDate === 'string') {
                        // Handle ISO string format (e.g., "2024-12-25" or "2024-12-25T00:00:00.000Z")
                        eventDate = new Date(event.startDate.split('T')[0]); // Get date part only
                    } else if (event.startDate instanceof Date) {
                        eventDate = new Date(event.startDate);
                    } else {
                        // Try to parse as date
                        eventDate = new Date(event.startDate);
                    }
                    
                    // Check if date is valid
                    if (isNaN(eventDate.getTime())) {
                        return true; // Include events with invalid dates (don't exclude)
                    }
                    
                    eventDate.setHours(0, 0, 0, 0); // Set to start of day for accurate comparison
                    
                    // Only include events where startDate is today or in the future
                    return eventDate >= today;
                } catch (error) {
                    return true; // Include events with date parsing errors (don't exclude)
                }
            });
        }
        
        return eventsToUse.map(event => ({
            id: event.id,
            name: event.eventName || event.name || '',
            location: event.location || '' // Location not in filter data, will be empty
        }));
    }, [filterData?.events, eventFilterList]);

    // Use unified filter hook with event mode for upcoming events
    // Note: We don't pass filterAction since DataTable handles all API calls server-side
    // useFilterLogic is only used for filter UI state management
    // Use events from upcomingEventList API response (filterData.events or eventFilterList) - no separate API call needed
    const {
        selectedEventId,
        startDate,
        endDate,
        events: allEvents,
        loadingDropdowns,
        activeFilters,
        applyFilters,
        clearFilters,
        handleEventChange,
        setStartDate,
        setEndDate
    } = useFilterLogic({
        filterAction: null, // Don't call API - DataTable handles it
        // No loadEventsAction - use events from upcomingEventList API response instead
        dispatch,
        initialEvents: transformedFilterEvents,
        initialFilters: { upcoming: true },
        filterMode: 'event'
    });

    // Use pagination persistence hook
    const { initialPage, restoreTablePage, checkAndAdjustPage } = usePersistedTablePage();

    // Use reusable table navigation hook for page preservation
    const { handleView, handleEdit, handleAdd } = useTableNavigation({
        tableRef,
        listPath: EVENT_PATHS.UPCOMING_EVENTS,
        viewPath: EVENT_PATHS.VIEW_UPCOMING_EVENT,
        editPath: EVENT_PATHS.EDIT_UPCOMING_EVENT,
        addPath: EVENT_PATHS.ADD_UPCOMING_EVENT
    });

    const destroyTable = useCallback(() => {
        if (tableRef.current) {
            tableRef.current.off('page.dt');
            $('#data-table-zero').off('click', '.delete-btn');
            tableRef.current.destroy();
            tableRef.current = null;
            setCurrentTable(null);
        }
    }, []);

    const handleAddEvent = useCallback(() => {
        handleAdd();
    }, [handleAdd]);
    
    const handleDelete = useCallback((eventId) => {
        setItemToDelete({ id: eventId });
        setShowDeleteModal(true);
    }, []);

    const handleQA = useCallback((data) => {
        // Handle Q&A navigation if needed
    }, []);

    const initializeTable = useCallback(() => {
        destroyTable();
        try {
            // Use function for ajaxParams to read from URL dynamically on each request
            // Always include upcoming=true for upcoming events
            const ajaxParams = () => {
                const urlParams = new URLSearchParams(window.location.search);
                const params = { upcoming: true }; // Always include upcoming=true
                if (urlParams.get('eventName')) params.eventName = urlParams.get('eventName');
                if (urlParams.get('startDate')) params.startDate = urlParams.get('startDate');
                if (urlParams.get('endDate')) params.endDate = urlParams.get('endDate');
                if (urlParams.get('type')) params.type = urlParams.get('type');
                if (urlParams.get('location')) params.location = urlParams.get('location');
                if (urlParams.get('category')) params.category = urlParams.get('category');
                if (urlParams.get('keyword')) params.keyword = urlParams.get('keyword');
                if (urlParams.get('globalSearch')) params.globalSearch = urlParams.get('globalSearch');
                return params;
            };
            
            const table = upcomingEventTable(handleAdd, handleEdit, handleDelete, handleView, restoreTablePage, ajaxParams, dispatch);
            tableRef.current = table;
            setCurrentTable(table);
        } catch (error) {
            // Error initializing upcoming events table
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [destroyTable, handleAdd, handleEdit, handleDelete, handleView, handleQA]);

    // Track previous URL to detect filter changes vs pagination changes
    const prevUrlRef = useRef(location.search);
    
    // Initialize table on mount
    useEffect(() => {
        if (!tableRef.current) {
            initializeTable();
            prevUrlRef.current = location.search;
        } else {
            // Only reload if URL changed due to filters (not pagination)
            const currentParams = new URLSearchParams(location.search);
            const prevParams = new URLSearchParams(prevUrlRef.current);
            
            currentParams.delete('page');
            prevParams.delete('page');
            
            const currentParamsStr = currentParams.toString();
            const prevParamsStr = prevParams.toString();
            
            if (currentParamsStr !== prevParamsStr) {
                tableRef.current.ajax.reload();
            }
            
            prevUrlRef.current = location.search;
        }
        
        return () => {
            if (!tableRef.current) {
                destroyTable();
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.search]);

 

 
    const handleConfirmDelete = useCallback(async () => {
        if (!itemToDelete) return;

        setIsDeleting(true);
        try {
            await dispatch(eventDelete(itemToDelete.id));
            setShowDeleteModal(false);
            setItemToDelete(null);
            destroyTable();
            // Redux state is updated directly in the action, no need to refetch
        } catch (error) {
            // Delete failed
        } finally {
            setIsDeleting(false);
        }
    }, [itemToDelete, dispatch, destroyTable]);

    const handleClose = useCallback(() => {
        if (!isDeleting) {
            setShowDeleteModal(false);
            setItemToDelete(null);
        }
    }, [isDeleting]);

    return (
        <>
            {/* Filter Component */}
            <FilterComponent
                events={allEvents}
                loadingDropdowns={loadingDropdowns}
                selectedEventId={selectedEventId}
                startDate={startDate}
                endDate={endDate}
                onEventChange={handleEventChange}
                onStartDateChange={setStartDate}
                onEndDateChange={setEndDate}
                onApplyFilters={applyFilters}
                onClearFilters={clearFilters}
                activeFilters={activeFilters}
                showUserFilter={false}
                showEventFilter={true}
                showDateFilter={true}
            />
        
            <DeleteConfirmationModal
                show={showDeleteModal}
                onHide={handleClose}
                onConfirm={handleConfirmDelete}
                isLoading={isDeleting}
            />
            <Row>
                <Col sm={12} className="btn-page">
                    <Card className="event-list">
                        <Card.Body>
                            <Table striped hover responsive id="data-table-zero">
                                <thead>
                                    <tr>
                                        <th>Event Name / Image / Date</th>
                                        <th>Type</th>
                                        <th>Price</th>
                                        <th>Location</th> 
                                        <th>Event Date</th>
                                        <th>Publish Dates</th>
                                        <th>Actions</th>
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

export default UpcomingEvents;
