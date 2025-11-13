import { useEffect, useState, useCallback, useRef } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Table from 'react-bootstrap/Table';
import { useSelector, useDispatch } from 'react-redux';
import * as $ from 'jquery';
import { eventDelete, eventList } from '../../../store/actions/eventActions';
import { setupDateFilter, resetFilters } from '../../../utils/dateFilter';
import { useLocation, useNavigate } from 'react-router-dom';
import '../../../assets/css/event.css';
import DeleteConfirmationModal from '../../../components/modal/DeleteConfirmationModal';
import { API_URL, DUMMY_PATH } from '../../../configs/env';
import { formatDateTimeForTable } from '../../../components/dateTime/dateTimeUtils';
import { EVENT_PATHS } from '../../../utils/constants';
import { getAllGalleries } from '../../../store/actions/galleryActions';
import FilterComponent from '../../../components/common/FilterComponent';
import useEventFilter from '../../../hooks/useEventFilter';
import usePersistedTablePage from '../../../hooks/usePersistedTablePage';
import useTableNavigation from '../../../hooks/useTableNavigation';

// @ts-ignore
$.DataTable = require('datatables.net-bs');

function atable(data, handleAdd, handleEdit, handleDelete, handleView, handleGallery, handleQA, restoreTablePage) {
    let tableZero = '#data-table-zero';
    $.fn.dataTable.ext.errMode = 'throw';

    // Destroy existing table if it exists
    if ($.fn.DataTable.isDataTable(tableZero)) {
        $(tableZero).DataTable().clear().destroy();
    }

    const dataTableInstance = $(tableZero).DataTable({
        data: data || [],
        rowId: 'id', // Explicitly set the row ID field
        ordering: true, // Allow column sorting
        order: [[4, 'desc']], // Sort by Event Date column (index 4) in descending order (newest first)
        // Backend already sorts the data, but DataTable will maintain this order on initial load
        // Configure date sorting to handle YYYY-MM-DD format correctly
        columnDefs: [
            {
                targets: 4, // Event Date column (index 4)
                type: 'num', // Use numeric type for proper date comparison
                render: function (data, type, row) {
                    if (type === 'sort' || type === 'type') {
                        // Return timestamp for sorting - ensures Dec 1, 2 come before Nov 28, 30
                        if (row.startDate) {
                            const dateStr = String(row.startDate);
                            const parts = dateStr.split('T')[0].split('-');
                            if (parts.length === 3) {
                                const year = parseInt(parts[0], 10);
                                const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed
                                const day = parseInt(parts[2], 10);
                                // Use UTC to avoid timezone issues
                                return new Date(Date.UTC(year, month, day)).getTime();
                            }
                            return new Date(row.startDate).getTime();
                        }
                        return 0;
                    }
                    // For display, use the formatted date
                    return formatDateTimeForTable(row.startDate, row.startTime);
                }
            }
        ],
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
            "<'row'<'col-sm-12'<'date-filter-wrapper'>>>" +
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
        ],
        initComplete: function (settings, json) {
            const dateFilterHtml = `
                <div class="date-filter-container d-flex align-items-center">
                    <div class="filter-group mr-3">
                        <label class="small mr-2">From:</label>
                        <input 
                            type="date" 
                            id="startDateFilter" 
                            class="form-control form-control-sm"
                        >
                    </div>
                    <div class="filter-group mr-3">
                        <label class="small mr-2">To:</label>
                        <input 
                            type="date" 
                            id="endDateFilter" 
                            class="form-control form-control-sm"
                        >
                    </div>
                    <div id="clearFilterBtn" class="filter-group" style="display: none;">
                        <button class="btn btn-light">
                            <i class="feather icon-x"></i> Clear Filter
                        </button>
                    </div>
                </div>
            `;

            $('.date-filter-wrapper').html(dateFilterHtml);
            // Setup date filter after table is initialized
            setupDateFilter(this.api());

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

            // Restore the current page using the hook function after table is fully initialized
            // This sets up the page change listener and restores page from URL if needed
            if (typeof restoreTablePage === 'function') {
                const api = this.api();
                // Always call restoreTablePage - it will check if page needs to be changed
                // and will set up the page change listener to sync URL on pagination
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

    $(document).on('click', '.gallery-btn', function () {
        const eventId = $(this).data('id');
        const dataEvent = data.find((event) => event.id === eventId);
        if (dataEvent) {
            handleGallery(dataEvent);
        }
    });

    $(document).on('click', '.edit-btn', function () {
        const eventId = $(this).data('id');
        const dataEvent = data.find((user) => user.id === eventId);
        if (dataEvent) {
            handleEdit(dataEvent);
        }
    });

    $(document).on('click', '.delete-btn', function () {
        const eventId = $(this).data('id');
        handleDelete(eventId);
    });

    $(document).on('click', '.qa-btn', function () {
        const eventId = $(this).data('id');
        const dataEvent = data.find((event) => event.id === eventId);
        if (dataEvent) {
            handleQA(dataEvent);
        }
    });

    return dataTableInstance;
}

const EventView = () => {
    const dispatch = useDispatch();
    const events = useSelector((state) => state.event?.event?.events);

    const [currentTable, setCurrentTable] = useState(null);
    const location = useLocation();
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const navigate = useNavigate();
    const tableRef = useRef(null);

    // Use reusable event filter hook
    const { selectedEventId, allEvents, loadingDropdowns, activeFilters, applyFilters, clearFilters, handleEventChange } =
        useEventFilter(eventList);

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
        if (Array.isArray(events) && events.length >= 0) {
            // Sort events by startDate in descending order (newest first) to match backend sorting
            // This ensures Dec 7, 6, 5, 4, 2, 1 show before Nov 30, 29, 28, etc.
            const sortedEvents = [...events].sort((a, b) => {
                const parseDate = (dateValue) => {
                    if (!dateValue) return new Date(0);
                    if (dateValue instanceof Date) return dateValue;
                    const dateStr = String(dateValue);
                    const parts = dateStr.split('T')[0].split('-');
                    if (parts.length === 3) {
                        // Create date in UTC to avoid timezone issues
                        return new Date(Date.UTC(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10)));
                    }
                    return new Date(dateStr);
                };
                
                const dateA = parseDate(a.startDate);
                const dateB = parseDate(b.startDate);
                
                // Compare dates in descending order (newest first)
                const dateComparison = dateB.getTime() - dateA.getTime();
                if (dateComparison !== 0) {
                    return dateComparison;
                }
                
                // If dates are the same, sort by time (newest time first)
                const timeA = a.startTime || '00:00:00';
                const timeB = b.startTime || '00:00:00';
                return timeB.localeCompare(timeA);
            });
            
            // Only initialize table when events change, not when page changes
            // This prevents flickering when user clicks next/previous page
            // Note: restoreTablePage is NOT in dependencies to prevent reinitialization when URL changes
            // It's captured via closure and will always have the latest version
            const table = atable(sortedEvents, handleAdd, handleEdit, handleDelete, handleView, handleGallery, handleQA, restoreTablePage);
            tableRef.current = table;
            setCurrentTable(table);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [events, destroyTable, handleAdd, handleEdit, handleDelete, handleView, handleGallery, handleQA]);

    // Load events only once on mount - check Redux first
    useEffect(() => {
        // Check if events already exist in Redux
        if (!events || events.length === 0) {
            dispatch(eventList());
        }
        return () => {
            destroyTable();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Initialize table when events change
    // Note: We don't include location.search in dependencies to avoid reinitializing on every page change
    // The restoreTablePage function in initComplete handles page restoration from URL
    useEffect(() => {
        if (events) {
            initializeTable();
        }
        return () => {
            destroyTable();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [events]);

    useEffect(() => {
        return () => {
            if (tableRef.current) {
                resetFilters(tableRef.current);
            }
        };
    }, [location.pathname]);

    const handleConfirmDelete = useCallback(async () => {
        if (!itemToDelete) return;

        setIsDeleting(true);
        try {
            await dispatch(eventDelete(itemToDelete.id));
            setShowDeleteModal(false);
            setItemToDelete(null);
            // Redux state is updated directly in the action, useEffect will handle table recreation
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
                onEventChange={handleEventChange}
                onApplyFilters={applyFilters}
                onClearFilters={clearFilters}
                activeFilters={activeFilters}
                showUserFilter={false}
                showEventFilter={true}
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
