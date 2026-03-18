import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Table from 'react-bootstrap/Table';
import { useSelector, useDispatch } from 'react-redux';
import * as $ from 'jquery';
import { eventDelete } from '../../../store/actions/eventActions';
import { EVENT_FILTER_LIST, EVENT_LIST, EVENT_LOADING } from '../../../store/constants/actionTypes';
import { useLocation, useNavigate } from 'react-router-dom';
import '../../../assets/css/event.css';
import DeleteConfirmationModal from '../../../components/modal/DeleteConfirmationModal';
import ImageViewModal from '../../../components/modal/ImageViewModal';
import SalesforceSyncSettingsModal from '../../../components/modal/SalesforceSyncSettingsModal';
import SyncConfirmationModal from '../../../components/modal/SyncConfirmationModal';
import { toast } from 'react-toastify';
import { API_URL, DUMMY_PATH } from '../../../configs/env';
import { getEventImageUrl } from '../../../utils/eventImageUtils';
import { formatDateTimeForTable } from '../../../components/dateTime/dateTimeUtils';
import { EVENT_PATHS } from '../../../utils/constants';
import FilterComponent from '../../../components/common/FilterComponent';
import useFilterLogic from '../../../hooks/useFilterLogic';
import usePersistedTablePage from '../../../hooks/usePersistedTablePage';
import useTableNavigation from '../../../hooks/useTableNavigation';
import { renderPublishDates } from '../../../components/events/PublishDatesRenderer.jsx';
import { initializeServerSideDataTable } from '../../../utils/dataTableServerSide';
import axiosInstance from '../../../configs/axiosInstance';

// @ts-ignore
$.DataTable = require('datatables.net-bs');

function eventTable(
    handleAdd,
    handleEdit,
    handleDelete,
    handleView,
    handleGallery,
    handleQA,
    restoreTablePage,
    ajaxParams = {},
    dispatch = null,
    handleImageClick = null,
    handleSyncEvents = null,
    handleOpenCronSettings = null
) {
    let tableZero = '#data-table-zero';
    $.fn.dataTable.ext.errMode = 'throw';

    // Define columns
    const columns = [
        {
            data: 'name',
            orderable: true,
            render: function (data, type, row) {
                // Return raw name value for sorting
                if (type === 'sort' || type === 'type') {
                    return row.name || '';
                }
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

                // Return formatted HTML for display (support Salesforce/external URL via shared util)
                const eventImageUrl = getEventImageUrl(row.images?.[0], { apiUrl: API_URL, fallback: imageUrl });
                return `
                        <div class="d-inline-block align-middle">
                            <span class="event-image-clickable" data-image-url="${eventImageUrl}" title="Click to view image">
                                <img src="${eventImageUrl}" alt="event" class="img-radius align-top m-r-15" 
                                     style="width:50px; height:50px; object-fit:cover; transition: opacity 0.2s; cursor: pointer;" 
                                     onerror="this.src='${imageUrl}';"
                                     onmouseover="this.style.opacity='0.8'"
                                     onmouseout="this.style.opacity='1'">
                            </span>
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
            data: 'price',
            title: 'Price',
            orderable: true,
            render: function (data, type, row) {
                // Return raw numeric value for sorting
                if (type === 'sort' || type === 'type') {
                    return parseFloat(data) || 0;
                }
                // Return formatted string for display
                const currencySymbol = row.currency === 'USD' ? '$' : '';
                return `${currencySymbol}${parseFloat(data).toFixed(2)}(${row.currency})`;
            }
        },
        {
            data: 'location',
            title: 'Location / Venue / Country',
            orderable: true,
            render: function (data, type, row) {
                // Return raw location value for sorting
                if (type === 'sort' || type === 'type') {
                    return row.location || '';
                }
                // Return formatted HTML for display
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
            orderable: true,
            render: function (data, type, row) {
                // Return raw date for sorting
                if (type === 'sort' || type === 'type') {
                    return row.startDate ? new Date(row.startDate).getTime() : 0;
                }
                // Return formatted string for display
                return formatDateTimeForTable(row.startDate, row.startTime);
            }
        },
        {
            data: 'publishStartDate',
            title: 'Publish Dates',
            orderable: true,
            render: function (data, type, row) {
                // Return raw date for sorting
                if (type === 'sort' || type === 'type') {
                    return row.publishStartDate ? new Date(row.publishStartDate).getTime() : 0;
                }
                // Return formatted HTML for display
                return renderPublishDates(row);
            }
        },
        {
            data: 'isPrivate',
            title: 'Is Private',
            orderable: true,
            render: function (data, type, row) {
                const isPrivate = row && (row.isPrivate === true || row.isPrivate === 'true');
                if (type === 'sort' || type === 'type') {
                    return isPrivate ? 1 : 0;
                }
                const id = (row && row.id) ? String(row.id) : '';
                const checked = isPrivate ? 'checked' : '';
                const label = isPrivate ? 'Yes' : 'No';
                // Bootstrap 4 doesn't support .form-switch; use a standard checkbox + badge-like label.
                return `
                    <div class="d-inline-flex align-items-center">
                        <input class="is-private-toggle" type="checkbox"
                            style="width: 18px; height: 18px; cursor: pointer;"
                            data-id="${id}" data-is-private="${isPrivate}"
                            ${checked}
                            title="Private events are hidden from registration (upcoming/featured). Only visible under Registered events if already registered.">
                        <span class="ml-2 badge ${isPrivate ? 'badge-secondary' : 'badge-light'}">${label}</span>
                    </div>
                `;
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
        dispatch: dispatch, // Pass dispatch for loading state
        loadingActionType: EVENT_LOADING, // Use EVENT_LOADING to show GlobalLoader
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
        },
        restoreTablePage: restoreTablePage,
        pageLength: 10,
        lengthMenu: [
            [5, 10, 25, 50, -1],
            [5, 10, 25, 50, 'All']
        ],
        order: [[4, 'desc']], // Sort by Event Date column (index 4) in descending order
        initCompleteCallback: function (settings, json, api) {
            // Add button initialization
            if (!$('#addEventBtn').length) {
                $('.add-event-button').html(`
                    <div class="d-flex flex-wrap align-items-center ml-2">
                        <button type="button" class="btn btn-primary d-flex align-items-center mr-2" id="addEventBtn">
                            <i class="feather icon-plus mr-1"></i>
                            Add
                        </button>
                      
                           <button type="button" class="btn btn-secondary d-flex align-items-center mr-2" id="salesforceCronSettingsBtn" title="Set cron schedule for Salesforce sync">
                            <i class="feather icon-settings mr-1"></i>
                            Settings
                        </button>
                    </div>
                `);

                $('#addEventBtn').on('click', handleAdd);
                if (handleOpenCronSettings) $('#salesforceCronSettingsBtn').on('click', handleOpenCronSettings);
            }

            // Add event listener for clickable event image
            $(tableZero + ' tbody')
                .off('click', '.event-image-clickable')
                .on('click', '.event-image-clickable', function (e) {
                    e.stopPropagation(); // Prevent event bubbling
                    const imageUrl = $(this).data('image-url');
                    if (imageUrl && handleImageClick) {
                        handleImageClick(imageUrl);
                    }
                });

            // Add event listeners for action buttons
            $(tableZero + ' tbody')
                .off('click', '.view-btn')
                .on('click', '.view-btn', function () {
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

            $(tableZero + ' tbody')
                .off('click', '.edit-btn')
                .on('click', '.edit-btn', function () {
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

            $(tableZero + ' tbody')
                .off('click', '.delete-btn')
                .on('click', '.delete-btn', function () {
                    const id = $(this).data('id');
                    if (id) {
                        handleDelete(id);
                    }
                });

            $(tableZero + ' tbody')
                .off('click', '.gallery-btn')
                .on('click', '.gallery-btn', function () {
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

            $(tableZero + ' tbody')
                .off('click', '.qa-btn')
                .on('click', '.qa-btn', function () {
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

            // Is Private toggle: update event and refresh row
            $(tableZero + ' tbody')
                .off('change', '.is-private-toggle')
                .on('change', '.is-private-toggle', function () {
                    const checkbox = $(this);
                    const id = checkbox.data('id');
                    const newValue = checkbox.prop('checked');
                    const table = $(tableZero).DataTable();
                    const row = table.row(checkbox.closest('tr'));
                    const rowData = row.data();
                    if (!id || !rowData) return;
                    axiosInstance
                        .put(`/events/${id}/is-private`, { isPrivate: newValue })
                        .then(() => {
                            rowData.isPrivate = newValue;
                            row.data(rowData).invalidate().draw(false);
                            toast.success(newValue ? 'Event set as private.' : 'Event set as public.');
                        })
                        .catch((err) => {
                            checkbox.prop('checked', !newValue);
                            toast.error(err.response?.data?.message || 'Failed to update private status');
                        });
                });
        },
        dom:
            "<'row mb-3'<'col-sm-12 col-md-6'l><'col-sm-12 col-md-6 d-flex justify-content-end align-items-center flex-wrap'<'search-container'f><'add-event-button'>>>" +
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
    const [showProfileImageModal, setShowProfileImageModal] = useState(false);
    const [selectedImageUrl, setSelectedImageUrl] = useState('');
    const navigate = useNavigate();
    const tableRef = useRef(null);
    const [selectedType, setSelectedType] = useState('');
    const [syncLoading, setSyncLoading] = useState(false);
    const [showCronModal, setShowCronModal] = useState(false);
    const [showSyncConfirmModal, setShowSyncConfirmModal] = useState(false);

    // Transform filter events data to match FilterComponent format
    // IMPORTANT: Prioritize filterData?.events (from backend filter response) as it contains ALL available events
    // Use eventFilterList as fallback only if filterData?.events is not available
    const transformedFilterEvents = useMemo(() => {
        // Use filterData?.events first (from backend - contains all events), then eventFilterList as fallback
        const eventsToUse = filterData?.events?.length > 0 ? filterData.events : eventFilterList?.length > 0 ? eventFilterList : [];
        return eventsToUse.map((event) => ({
            id: event.id,
            name: event.eventName || event.name || ''
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
        applyFilters: baseApplyFilters,
        clearFilters: baseClearFilters,
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

    // Initialize type from URL on mount
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const typeFromUrl = urlParams.get('type') || '';
        if (typeFromUrl) {
            setSelectedType(typeFromUrl);
        }
    }, []);

    // Custom applyFilters that includes type
    const applyFilters = useCallback(
        (filters = {}) => {
            const urlParams = new URLSearchParams(window.location.search);

            // Update URL with all filters including type
            if (filters.eventName) {
                urlParams.set('eventName', filters.eventName);
            } else {
                urlParams.delete('eventName');
            }

            if (filters.startDate) {
                urlParams.set('startDate', filters.startDate);
            } else {
                urlParams.delete('startDate');
            }

            if (filters.endDate) {
                urlParams.set('endDate', filters.endDate);
            } else {
                urlParams.delete('endDate');
            }

            if (filters.type || selectedType) {
                const typeToSet = filters.type || selectedType;
                urlParams.set('type', typeToSet);
            } else {
                urlParams.delete('type');
            }

            // Remove page param when filters change
            urlParams.delete('page');

            navigate(`${location.pathname}?${urlParams.toString()}`, { replace: true });

            // Also call base applyFilters for other filter handling
            baseApplyFilters(filters);
        },
        [selectedType, navigate, location.pathname, baseApplyFilters]
    );

    // Custom clearFilters that includes type
    const clearFilters = useCallback(() => {
        setSelectedType('');
        baseClearFilters();
        const urlParams = new URLSearchParams();
        navigate(`${location.pathname}`, { replace: true });
    }, [navigate, location.pathname, baseClearFilters]);

    // Use pagination persistence hook
    const { initialPage, restoreTablePage } = usePersistedTablePage();

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
            const tableSelector = '#data-table-zero';
            $(tableSelector + ' tbody').off('click', '.event-image-clickable');
            $(tableSelector).off('click', '.delete-btn');
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
        (data) => {
            navigate(`${EVENT_PATHS.GALLERY_EVENT}/${data.id}`);
        },
        [navigate]
    );

    const handleQA = useCallback(
        (data) => {
            navigate(`/events/qa/${data.id}`);
        },
        [navigate]
    );

    const handleImageClick = useCallback((imageUrl) => {
        if (imageUrl && imageUrl !== DUMMY_PATH) {
            setSelectedImageUrl(imageUrl);
            setShowProfileImageModal(true);
        }
    }, []);

    const runSyncEvents = useCallback(() => {
        setSyncLoading(true);
        const $btn = $('#syncEventsBtn');
        if ($btn.length) $btn.prop('disabled', true);
        axiosInstance
            .post('/salesforce/sync/events')
            .then((res) => {
                const d = res.data?.data;
                const msg = d
                    ? `Created: ${d.created}, Updated: ${d.updated}, Unchanged: ${d.existing}`
                    : res.data?.message || 'Sync completed';
                toast.success(msg);
                if (tableRef.current) tableRef.current.ajax.reload(null, false);
            })
            .catch((err) => toast.error(err.response?.data?.message || 'Sync failed'))
            .finally(() => {
                setSyncLoading(false);
                const $b = $('#syncEventsBtn');
                if ($b.length) $b.prop('disabled', false);
            });
    }, []);

    const handleSyncEvents = useCallback(() => {
        if (syncLoading) return;
        setShowSyncConfirmModal(true);
    }, [syncLoading]);

    const handleConfirmSync = useCallback(() => {
        setShowSyncConfirmModal(false);
        runSyncEvents();
    }, [runSyncEvents]);

    const handleOpenCronSettings = useCallback(() => {
        setShowCronModal(true);
    }, []);

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

            const table = eventTable(
                handleAdd,
                handleEdit,
                handleDelete,
                handleView,
                handleGallery,
                handleQA,
                restoreTablePage,
                ajaxParams,
                dispatch,
                handleImageClick,
                handleSyncEvents,
                handleOpenCronSettings
            );
            tableRef.current = table;
            setCurrentTable(table);
        } catch (error) {
            // Error initializing event table
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [destroyTable, handleAdd, handleEdit, handleDelete, handleView, handleGallery, handleQA, handleSyncEvents, handleOpenCronSettings]);

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
            // Reload table after deletion - pass false to keep current page (same flow as Categories)
            if (tableRef.current) {
                tableRef.current.ajax.reload(null, false);
            }
        } catch (error) {
            // Delete failed
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
                selectedType={selectedType}
                startDate={startDate}
                endDate={endDate}
                onEventChange={handleEventChange}
                onTypeChange={setSelectedType}
                onStartDateChange={setStartDate}
                onEndDateChange={setEndDate}
                onApplyFilters={applyFilters}
                onClearFilters={clearFilters}
                activeFilters={activeFilters}
                showUserFilter={false}
                showEventFilter={true}
                showTypeFilter={true}
                showDateFilter={true}
                headerActions={
                    <div className="d-flex align-items-center">
                        <button
                            type="button"
                            className="btn btn-outline-primary btn-sm d-flex align-items-center"
                            id="syncEventsBtn"
                            title="Sync events from Salesforce"
                            disabled={syncLoading}
                            onClick={handleSyncEvents}
                        >
                            <i className="feather icon-refresh-cw mr-1" />
                            Sync events
                        </button>
                    </div>
                }
            />

            <DeleteConfirmationModal show={showDeleteModal} onHide={handleClose} onConfirm={handleConfirmDelete} isLoading={isDeleting} />

            {/* Event Image Modal */}
            <ImageViewModal
                show={showProfileImageModal}
                onHide={() => setShowProfileImageModal(false)}
                imageSrc={selectedImageUrl}
                imageAlt="Event Image"
                downloadFileName={`event-image-${Date.now()}.jpg`}
            />

            <SalesforceSyncSettingsModal show={showCronModal} onHide={() => setShowCronModal(false)} onSaved={() => {}} />

            <SyncConfirmationModal
                show={showSyncConfirmModal}
                onHide={() => !syncLoading && setShowSyncConfirmModal(false)}
                onConfirm={handleConfirmSync}
                isLoading={syncLoading}
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

export default EventView;
