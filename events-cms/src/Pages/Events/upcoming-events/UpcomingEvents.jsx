import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Table from 'react-bootstrap/Table';
import { useSelector, useDispatch } from 'react-redux';
import * as $ from 'jquery';
import { eventDelete, upcomingEventList } from '../../../store/actions/eventActions';
import { useLocation, useNavigate } from 'react-router-dom';
import '../../../assets/css/event.css';
import DeleteConfirmationModal from '../../../components/modal/DeleteConfirmationModal';
import { API_URL, DUMMY_PATH } from '../../../configs/env';
import { formatDateTimeForTable } from '../../../components/dateTime/dateTimeUtils';
import FilterComponent from '../../../components/common/FilterComponent';
import useEventFilter from '../../../hooks/useEventFilter';
import { EVENT_PATHS } from '../../../utils/constants';
import usePersistedTablePage from '../../../hooks/usePersistedTablePage';
import useTableNavigation from '../../../hooks/useTableNavigation';
import useFilterLogic from '../../../hooks/useFilterLogic';

// @ts-ignore
$.DataTable = require('datatables.net-bs');

function atable(data, handleAdd, handleEdit, handleDelete, handleView, restoreTablePage) {
    let tableZero = '#data-table-zero';
    $.fn.dataTable.ext.errMode = 'throw';

    // Destroy existing table if it exists
    if ($.fn.DataTable.isDataTable(tableZero)) {
        $(tableZero).DataTable().clear().destroy();
    }

    const dataTableInstance = $(tableZero).DataTable({
        data: data || [],
        order: [[0, 'asc']],
        searching: true,
        searchDelay: 500,
        pageLength: 5,
        lengthMenu: [
            [5, 10, 25, 50, -1],
            [5, 10, 25, 50, 'All']
        ],
        pagingType: 'full_numbers',
        dom:
            "<'row mb-3'<'col-sm-12 col-md-6'l><'col-sm-12 col-md-6 d-flex justify-content-end align-items-center'<'search-container'f><'add-event-button ml-2'>>>" +
            "<'row'<'col-sm-12'tr>>" +
            "<'row'<'col-sm-12 col-md-5'i><'col-sm-12 col-md-7'p>>",
        columns: [
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
                         <img src="${row.image ? `${API_URL}/${row.image}` : imageUrl}" alt="user" class="img-radius align-top m-r-15" style="width:50px; height:50px; object-fit:cover;" />
                              <div class="d-inline-block">
                            <p class="m-b-0">
                                 <h6>${row.name}</h6>
                                    <span class="badge ${badgeClass}">
                                       ${eventDate.getDate()} ${monthNames[eventDate.getMonth()]} ${eventDate.getFullYear()}
                                        <span class="ml-1">${statusText}</span>
                                    </span>
                            </p>
                                 <span class="badge badge-primary font-weight-bold">Total Attendance: ${row.attendanceCount}</span>

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
                data: null,
                title: 'Event Date',
                render: function (data, type, row) {
                    return formatDateTimeForTable(row.startDate, row.startTime);
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
        ],
        initComplete: function (settings, json) {
            // Restore the current page using the hook function after table is fully initialized
            // This sets up the page change listener and restores page from URL if needed
            if (typeof restoreTablePage === 'function') {
                const api = this.api();
                restoreTablePage(api);
            }
        },
        responsive: true
    });

    // Attach event listeners for actions
    $(document).on('click', '.btn-icon', function () {
        const eventId = $(this).data('id');
        const dataEvent = data.find((user) => user.id === eventId);
        if (dataEvent) {
            // Get current page from DataTable instance before navigating
            // This ensures we always have the correct page number
            let currentPage = null;
            try {
                const pageInfo = dataTableInstance.page.info();
                if (pageInfo && pageInfo.page !== undefined) {
                    // DataTable uses 0-based indexing, URL uses 1-based
                    currentPage = (pageInfo.page + 1).toString();
                }
            } catch (e) {
                // DataTable page info not available, fallback to URL
                const urlParams = new URLSearchParams(window.location.search);
                currentPage = urlParams.get('page');
            }
            
            // Always pass the page parameter if available
            handleView(dataEvent, currentPage);
        }
    });

    $(document).on('click', '.edit-btn', function () {
        const eventId = $(this).data('id');
        const dataEvent = data.find((user) => user.id === eventId);
        if (dataEvent) {
            // Get current page from DataTable instance before navigating
            let currentPage = null;
            try {
                const pageInfo = dataTableInstance.page.info();
                if (pageInfo && pageInfo.page !== undefined) {
                    currentPage = (pageInfo.page + 1).toString();
                }
            } catch (e) {
                const urlParams = new URLSearchParams(window.location.search);
                currentPage = urlParams.get('page');
            }
            
            handleEdit(dataEvent, currentPage);
        }
    });

    $(document).on('click', '.delete-btn', function () {
        const eventId = $(this).data('id');
        handleDelete(eventId);
    });

    return dataTableInstance;
}


const UpcomingEvents = () => {
    const dispatch = useDispatch();
    const events = useSelector((state) => state.event?.upcomingEvents?.events);
    const filterData = useSelector((state) => state.event?.upcomingEvents?.filter); // Get filter data from response
    const eventFilterList = useSelector((state) => state.event?.eventFilterList || []); // Get from Redux store

    const [showModal, setShowModal] = useState(false);
    const [editData, setEditData] = useState(null);

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
        const eventsToUse = filterData?.events?.length > 0 ? filterData.events : (eventFilterList || []);
        return eventsToUse.map(event => ({
            id: event.id,
            name: event.eventName || event.name || '',
            location: event.location || '' // Location not in filter data, will be empty
        }));
    }, [filterData?.events, eventFilterList]);

    // Use unified filter hook with event mode for upcoming events
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
        filterAction: upcomingEventList,
        dispatch,
        initialEvents: transformedFilterEvents,
        initialFilters: { upcoming: true },
        filterMode: 'event'
    });

    // Use pagination persistence hook
    const { restoreTablePage } = usePersistedTablePage();

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
        // Use the reusable handleAdd hook which preserves page number
        handleAdd();
        // Also set the modal state for backwards compatibility
        setEditData(null);
        setShowModal(true);
    }, [handleAdd]);
    
    const handleDelete = useCallback((eventId) => {
        setItemToDelete({ id: eventId });
        setShowDeleteModal(true);
    }, []);


    const initializeTable = useCallback(() => {
        destroyTable();
        if (Array.isArray(events) && events.length >= 0) {
            // Only initialize table when events change, not when page changes
            // This prevents flickering when user clicks next/previous page
            // Note: restoreTablePage is NOT in dependencies to prevent reinitialization when URL changes
            // It's captured via closure and will always have the latest version
            const table = atable(events, handleAdd, handleEdit, handleDelete, handleView, restoreTablePage);
            tableRef.current = table;
            setCurrentTable(table);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [events, destroyTable, handleAdd, handleEdit, handleDelete, handleView]);

    // Initialize table when events change
    useEffect(() => {
        if (events) {
            initializeTable();
        }
        return () => {
            destroyTable();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [events]);

 

 
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
            console.error('Delete failed:', error);
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

    const handleCloseModal = useCallback(() => {
        setShowModal(false);
    }, []);
    
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
