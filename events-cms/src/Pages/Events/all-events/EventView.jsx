import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Table from 'react-bootstrap/Table';
import { useSelector, useDispatch } from 'react-redux';
import * as $ from 'jquery';
import { eventDelete } from '../../../store/actions/eventActions';
import { EVENT_FILTER_LIST, EVENT_LIST } from '../../../store/constants/actionTypes';
import { useLocation, useNavigate } from 'react-router-dom';
import '../../../assets/css/event.css';
import DeleteConfirmationModal from '../../../components/modal/DeleteConfirmationModal';
import { API_URL, DUMMY_PATH } from '../../../configs/env';
import { formatDateTimeForTable } from '../../../components/dateTime/dateTimeUtils';
import { EVENT_PATHS } from '../../../utils/constants';
import { getAllGalleries } from '../../../store/actions/galleryActions';
import FilterComponent from '../../../components/common/FilterComponent';
import useFilterLogic from '../../../hooks/useFilterLogic';
import usePersistedTablePage from '../../../hooks/usePersistedTablePage';
import useTableNavigation from '../../../hooks/useTableNavigation';
import { renderPublishDates } from '../../../components/events/PublishDatesRenderer.jsx';
import { initializeServerSideDataTable } from '../../../utils/dataTableServerSide';
import axiosInstance from '../../../configs/axiosInstance';

// @ts-ignore
$.DataTable = require('datatables.net-bs');

function eventTable(handleAdd, handleEdit, handleDelete, handleView, handleGallery, handleQA, restoreTablePage, ajaxParams = {}, dispatch = null) {
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
                        // Past event
                        badgeClass = 'badge-light-secondary';
                        statusText = `Event Expired (${Math.abs(daysUntilEvent)} days ago)`;
                    } else if (daysUntilEvent === 0) {
                        // Today's event
                        badgeClass = 'badge-light-success';
                        statusText = 'Today';
                    } else {
                        // Future event
                        if (daysUntilEvent <= 3) {
                            badgeClass = 'badge-light-danger';
                        } else if (daysUntilEvent <= 7) {
                            badgeClass = 'badge-light-warning';
                        }
                        statusText = `in ${daysUntilEvent} days`;
                    }

                    return `
                        <div class="d-inline-block align-middle">
                         <img src="${
                             row.image ? `${API_URL}/${row.image}` : imageUrl
                         }" alt="user" class="img-radius align-top m-r-15" style="width:50px; height:50px; object-fit:cover;" />
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
                        bgColor =
                            'background-color:rgb(162, 209, 231); padding: 6px 12px; border-radius: 4px; color:rgb(14, 13, 13); font-weight: 500;';
                    } else if (row.type?.toLowerCase() === 'virtual') {
                        bgColor =
                            'background-color:rgb(223, 228, 165); padding: 6px 12px; border-radius: 4px; color:rgb(14, 13, 13); font-weight: 500;';
                    }
                    return `<div class="text-wrap" style="margin-top: 10px; max-width: 200px;"><span style="${bgColor}">${
                        row.type || 'N/A'
                    }</span></div>`;
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
                data: 'startDate', // Use startDate for sorting
                title: 'Event Date',
                render: function (data, type, row) {
                    // Display formatting is handled by columnDefs render function
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
                            <button type="button" class="btn btn-info btn-circle btn-sm gallery-btn" data-id="${row.id}" title="Gallery" 
                                style="margin-right: 10px; width: 40px; height: 40px; border-radius: 50%; display: inline-flex; justify-content: center; align-items: center;">
                                <i class="feather icon-image"></i>
                            </button>
                            <button type="button" class="btn btn-primary btn-circle btn-sm qa-btn" data-id="${row.id}" title="Q&A" 
                                style="margin-right: 10px; width: 40px; height: 40px; border-radius: 50%; display: inline-flex; justify-content: center; align-items: center;">
                                <i class="feather icon-message-circle"></i>
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
        onDataLoaded: (data, metadata, fullResponse) => {
            // Extract filter data from response and store in Redux (only on first load)
            if (fullResponse?.filter?.events && dispatch) {
                dispatch({
                    type: EVENT_FILTER_LIST,
                    payload: fullResponse.filter.events
                });
                // Also update the event filter in Redux store
                dispatch({
                    type: EVENT_LIST,
                    payload: {
                        ...fullResponse,
                        filter: fullResponse.filter
                    }
                });
            }
            console.log('Loaded', data.length, 'events. Total:', metadata?.total);
        },
        restoreTablePage: restoreTablePage,
        pageLength: 10,
        lengthMenu: [[5, 10, 25, 50, -1], [5, 10, 25, 50, 'All']],
        order: [[4, 'desc']], // Sort by Event Date column (index 4) in descending order
        initCompleteCallback: function (settings, json, api) {
            // Add button initialization
            if (!$('#addEventBtn').length) {
                $('.add-event-button').html(`
                    <button class="btn btn-primary d-flex align-items-center ml-2" id="addEventBtn">
                        <i class="feather icon-plus mr-1"></i>
                        Add
                    </button>
                `);

                $('#addEventBtn').on('click', handleAdd);
            }

            // Add event listeners for action buttons
            $(tableZero + ' tbody').off('click', '.view-btn').on('click', '.view-btn', function () {
                const table = $(tableZero).DataTable();
                const rowData = table.row($(this).closest('tr')).data();
                if (rowData && rowData.id) {
                    // Get current page from DataTable
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

            $(tableZero + ' tbody').off('click', '.gallery-btn').on('click', '.gallery-btn', function () {
                const table = $(tableZero).DataTable();
                const rowData = table.row($(this).closest('tr')).data();
                if (rowData && rowData.id) {
                    handleGallery(rowData);
                } else {
                    const id = $(this).data('id');
                    if (id) {
                        handleGallery({ id });
                    }
                }
            });

            $(tableZero + ' tbody').off('click', '.qa-btn').on('click', '.qa-btn', function () {
                const table = $(tableZero).DataTable();
                const rowData = table.row($(this).closest('tr')).data();
                if (rowData && rowData.id) {
                    handleQA(rowData);
                } else {
                    const id = $(this).data('id');
                    if (id) {
                        handleQA({ id });
                    }
                }
            });
        },
        dom: "<'row mb-3'<'col-sm-12 col-md-6'l><'col-sm-12 col-md-6 d-flex justify-content-end align-items-center'<'search-container'f><'add-event-button ml-2'>>>" +
             "<'row'<'col-sm-12'tr>>" +
             "<'row'<'col-sm-12 col-md-5'i><'col-sm-12 col-md-7'p>>"
    });

    return dataTableInstance;
}

const EventView = () => {
    const dispatch = useDispatch();
    const filterData = useSelector((state) => state.event?.event?.filter); // Get filter data from response
    const eventFilterList = useSelector((state) => state.event?.eventFilterList || []); // Get from Redux store

    const [currentTable, setCurrentTable] = useState(null);
    const location = useLocation();
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const navigate = useNavigate();
    const tableRef = useRef(null);

    // Transform filter events data to match FilterComponent format
    // IMPORTANT: Prioritize filterData?.events (from backend filter response) as it contains ALL available events
    // Use eventFilterList as fallback only if filterData?.events is not available
    const transformedFilterEvents = useMemo(() => {
        // Use filterData?.events first (from backend - contains all events), then eventFilterList as fallback
        const eventsToUse = filterData?.events?.length > 0 
            ? filterData.events 
            : (eventFilterList?.length > 0 ? eventFilterList : []);
        return eventsToUse.map(event => ({
            id: event.id,
            name: event.eventName || event.name || '',
            // location: event.location || '' // Location not in filter data, will be empty
        }));
    }, [filterData?.events, eventFilterList]);

    // Use unified filter hook with event mode
    // Note: We don't pass filterAction since DataTable handles all API calls server-side
    // useFilterLogic is only used for filter UI state management
    // Use events from eventList API response (filterData.events or eventFilterList) - no separate API call needed
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
        // No loadEventsAction - use events from eventList API response instead
        dispatch,
        initialEvents: transformedFilterEvents,
        initialFilters: {},
        filterMode: 'event'
    });

    // Use pagination persistence hook
    const { initialPage, restoreTablePage, checkAndAdjustPage } = usePersistedTablePage();

    // Use reusable table navigation hook for page preservation
    const { handleView, handleEdit, handleAdd } = useTableNavigation({
        tableRef,
        listPath: EVENT_PATHS.LIST_EVENTS,
        viewPath: EVENT_PATHS.VIEW_EVENT,
        editPath: EVENT_PATHS.EDIT_EVENT,
        addPath: EVENT_PATHS.ADD_EVENT
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

    const handleDelete = useCallback((eventId) => {
        setItemToDelete({ id: eventId });
        setShowDeleteModal(true);
    }, []);

    const handleGallery = useCallback(
        async (data) => {
            try {
                const response = await dispatch(getAllGalleries());
                const allGalleries = response?.data || [];
                const existingGallery = allGalleries.find((gallery) => gallery.eventId === data.id);

                if (existingGallery) {
                    navigate(`${EVENT_PATHS.VIEW_GALLERY}/${existingGallery.id}`);
                } else {
                    navigate(`${EVENT_PATHS.ADD_GALLERY}?eventId=${data.id}`);
                }
            } catch (error) {
                console.error('Error checking gallery:', error);
                navigate(`${EVENT_PATHS.ADD_GALLERY}?eventId=${data.id}`);
            }
        },
        [dispatch, navigate]
    );

    const handleQA = useCallback(
        (data) => {
            navigate(`/events/qa/${data.id}`);
        },
        [navigate]
    );

    const initializeTable = useCallback(() => {
        destroyTable();
        try {
            // Use function for ajaxParams to read from URL dynamically on each request
            const ajaxParams = () => {
                const urlParams = new URLSearchParams(window.location.search);
                const params = {};
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
            
            const table = eventTable(handleAdd, handleEdit, handleDelete, handleView, handleGallery, handleQA, restoreTablePage, ajaxParams, dispatch);
            tableRef.current = table;
            setCurrentTable(table);
        } catch (error) {
            console.error('Error initializing event table:', error);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [destroyTable, handleAdd, handleEdit, handleDelete, handleView, handleGallery, handleQA]);

    // Track previous URL to detect filter changes vs pagination changes
    const prevUrlRef = useRef(location.search);
    
    // Initialize table on mount
    useEffect(() => {
        if (!tableRef.current) {
            initializeTable();
            prevUrlRef.current = location.search;
        } else {
            // Only reload if URL changed due to filters (not pagination)
            // Check if the change is a filter change by comparing non-page params
            const currentParams = new URLSearchParams(location.search);
            const prevParams = new URLSearchParams(prevUrlRef.current);
            
            // Remove page parameter for comparison
            currentParams.delete('page');
            prevParams.delete('page');
            
            const currentParamsStr = currentParams.toString();
            const prevParamsStr = prevParams.toString();
            
            // Only reload if filters changed (not just pagination)
            if (currentParamsStr !== prevParamsStr) {
                // Filters changed - reload table
                tableRef.current.ajax.reload();
            }
            // If only page changed, DataTable already handled it - don't reload
            
            prevUrlRef.current = location.search;
        }
        
        return () => {
            // Only destroy on unmount
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
            // Reload table after deletion
            if (tableRef.current) {
                tableRef.current.ajax.reload();
            }
        } catch (error) {
            console.error('Delete failed:', error);
        } finally {
            setIsDeleting(false);
        }
    }, [itemToDelete, dispatch]);

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

            <DeleteConfirmationModal show={showDeleteModal} onHide={handleClose} onConfirm={handleConfirmDelete} isLoading={isDeleting} />
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

export default EventView;
