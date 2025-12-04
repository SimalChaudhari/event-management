import * as React from 'react';
import { useEffect, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Row, Col, Card, Table, Form, Button, InputGroup, Alert, Modal } from 'react-bootstrap';
import { useSelector, useDispatch } from 'react-redux';
import * as $ from 'jquery';
import { adminDeleteRegisterEvent, exportRegisteredUsersByEvent, downloadAdminInfoCsvTemplate, uploadAdminInfoCsv, updateEventAdminInfo, getEventAdminInfo } from '../../../store/actions/eventActions';
import FilterComponent from '../../../components/common/FilterComponent';
import { useLocation, useNavigate } from 'react-router-dom';
import useFilterLogic from '../../../hooks/useFilterLogic';
import '../../../assets/css/register.css';
import RegisterEventModal from './modal/RegisterEventModal';
import DeleteConfirmationModal from '../../../components/modal/DeleteConfirmationModal';
import ExportConfirmationModal from '../../../components/modal/ExportConfirmationModal';
import CsvUploadDetailsModal from './modal/CsvUploadDetailsModal';
import EventAdminInfoModal from './modal/EventAdminInfoModal';
import { formatDateTimeForTable } from '../../../components/dateTime/dateTimeUtils';
import { EVENT_PATHS } from '../../../utils/constants';
import usePersistedTablePage from '../../../hooks/usePersistedTablePage';
import useTableNavigation from '../../../hooks/useTableNavigation';
import { useRef, useCallback, useMemo } from 'react';
import { initializeServerSideDataTable } from '../../../utils/dataTableServerSide';
import axiosInstance from '../../../configs/axiosInstance';
import { PARTICIPATED_EVENTS, EVENT_LOADING } from '../../../store/constants/actionTypes';

// @ts-ignore
$.DataTable = require('datatables.net-bs');

// Add formatTime utility function
const formatTime = (time) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
};

function registeredEventsTable(handleView, handleEdit, handleDelete, handleAddRegisterEvent, restoreTablePage, ajaxParams = {}, dispatch = null) {
    let tableZero = '#data-table-zero';
    $.fn.dataTable.ext.errMode = 'throw';

    // Define columns
    const columns = [
            {
                data: 'user',
                title: 'Registered By',
                render: function (data, type, row) {
                    let createdByBadge = '';
                    if (row.isCreatedByAdmin === true) {
                        createdByBadge = '<span class="badge badge-danger"><i class="feather icon-shield mr-1"></i>Admin</span>';
                    }

                    const regDate = new Date(row.createdAt).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    });
                    return `
                        <div class="d-inline-block">
                            <div>${row.user.firstName} ${row.user.lastName}</div>
                            <span class="text-muted">${row.user.email}</span>
                            ${row.user.mobile ? `<br><span class="text-muted">${row.user.mobile}</span>` : ''}
                               <div><span class="text-muted">${regDate}</span></div>
                                    ${
                                        row.isCreatedByAdmin === true
                                            ? `
                            <div class="created-by-section">
                                <p class="text-muted d-block mb-1 mt-2">Created By:  ${createdByBadge}</p>
                            </div>
                            `
                                            : ''
                                    }
                        </div>
                    `;
                }
            },

            {
                data: 'user',
                title: 'User Type',
                render: function (data, type, row) {
                    let bgColor = '';

                    if (row.type?.toLowerCase() === 'exhibitor') {
                        bgColor =
                            'background-color:rgb(162, 209, 231); padding: 6px 12px; border-radius: 4px; color:rgb(14, 13, 13); font-weight: 500;';
                    } else if (row.type?.toLowerCase() === 'attendee') {
                        bgColor =
                            'background-color:rgb(223, 228, 165); padding: 6px 12px; border-radius: 4px; color:rgb(14, 13, 13); font-weight: 500;';
                    }
                    return `<div class="text-wrap" style="margin-top: 10px; max-width: 200px;">
                    <span style="${bgColor}">${row.type || 'N/A'}</span>
                    
                  
                    </div>`;
                }
            },
            {
                data: 'event.name',

                render: function (data, type, row) {
                    const eventDate = new Date(row.event.startDate);
                    const today = new Date();
                    const daysUntilEvent = Math.ceil((eventDate - today) / (1000 * 60 * 60 * 24));

                    let badgeClass = 'badge-light-info';
                    let statusText = '';

                    if (daysUntilEvent < 0) {
                        badgeClass = 'badge-light-secondary';
                        statusText = `${Math.abs(daysUntilEvent)} days ago`;
                    } else if (daysUntilEvent === 0) {
                        badgeClass = 'badge-light-success';
                        statusText = 'Today';
                    } else if (daysUntilEvent === 1) {
                        badgeClass = 'badge-light-danger';
                        statusText = 'Tomorrow';
                    } else if (daysUntilEvent <= 3) {
                        badgeClass = 'badge-light-danger';
                        statusText = `in ${daysUntilEvent} days`;
                    } else if (daysUntilEvent <= 7) {
                        badgeClass = 'badge-light-warning';
                        statusText = `in ${daysUntilEvent} days`;
                    } else {
                        statusText = `in ${daysUntilEvent} days`;
                    }

                    return `
                        <div class="d-inline-block align-middle">
                            <h6 class="m-b-5">${row.event.name}</h6>
                            <p class="m-b-0">
                                <span class="badge ${badgeClass}">${statusText}</span>
                    
                            </p>
                              <span class="badge badge-primary font-weight-bold mt-2">Registered Participants: ${row.event.attendanceCount}</span>
                        </div>
                    `;
                }
            },

            {
                data: 'location',
                render: function (data, type, row) {
                    return `
                        <div class="d-inline-block align-middle">
                            <h6 class="m-b-5">${row?.event?.location || 'N/A'}</h6>
                            <p class="m-b-0">
                                <span class="badge badge-success">
                                    <i class="feather icon-map-pin mr-1"></i>
                                    ${row?.event?.venue || 'N/A'}, ${row.event?.country || 'N/A'}
                                </span>
                            </p>
                        </div>
                    `;
                }
            },
            {
                data: null,
                title: 'Event Schedule',
                render: function (data, type, row) {
                    if (type === 'sort' || type === 'type') {
                        // Return raw date for sorting purposes
                        return row.event?.startDate ? new Date(row.event.startDate).getTime() : 0;
                    }
                    return formatDateTimeForTable(row.event.startDate, row.event.startTime);
                }
            },

            {
                data: 'status',
                title: 'Status',
                render: function (data, type, row) {
                    let statusClass = 'badge-light-warning';

                    if (data === 'Sucesss') {
                        statusClass = 'badge-light-success';
                    } else if (data === 'Withdraw') {
                        statusClass = 'badge-light-danger';
                    } else if (data === 'Pending') {
                        statusClass = 'badge-light-warning';
                    }

                    return `<span class="badge ${statusClass}">${data}</span>`;
                }
            },
            {
                data: null,
                title: 'Actions',
                orderable: false,
                render: function (data, type, row) {
                    return `
                        <div class="btn-group" role="group" aria-label="Actions">
                            <button type="button" class="btn btn-icon btn-success view-btn" data-id="${
                                row.id
                            }" title="View Registration Details" 
                                style="margin-right: 10px; width: 40px; height: 40px; border-radius: 50%; display: inline-flex; justify-content: center; align-items: center;">
                                <i class="feather icon-eye"></i>
                            </button>
                            <button type="button" class="btn btn-icon btn-warning edit-btn" data-id="${
                                row.id
                            }" title="Edit Registration" 
                                style="margin-right: 10px; width: 40px; height: 40px; border-radius: 50%; display: inline-flex; justify-content: center; align-items: center;">
                                <i class="feather icon-edit"></i>
                            </button>
                            <button type="button" class="btn btn-icon btn-danger delete-btn" data-id="${
                                row.id
                            }" title="Delete Registration" 
                                style="margin-right: 10px; width: 40px; height: 40px; border-radius: 50%; display: inline-flex; justify-content: center; align-items: center;">
                                <i class="feather icon-trash-2"></i>
                            </button>
                            ${
                                row.receiptUrl
                                    ? `
                                <button type="button" class="btn btn-info btn-circle btn-sm receipt-btn" data-url="${row.receiptUrl}" title="Download Receipt" 
                                    style="margin-right: 10px; width: 40px; height: 40px; border-radius: 50%; display: inline-flex; justify-content: center; align-items: center;">
                                    <i class="feather icon-download"></i>
                                </button>
                            `
                                    : ''
                            }
                            ${
                                row.invoiceUrl
                                    ? `
                                <button type="button" class="btn btn-primary btn-circle btn-sm invoice-btn" data-url="${row.invoiceUrl}" title="Download Invoice" 
                                    style="width: 40px; height: 40px; border-radius: 50%; display: inline-flex; justify-content: center; align-items: center;">
                                    <i class="feather icon-file-text"></i>
                                </button>
                            `
                                    : ''
                            }
                        </div>
                    `;
                }
            }
    ];

    // Initialize server-side DataTable
    const dataTableInstance = initializeServerSideDataTable({
        tableSelector: tableZero,
        ajaxUrl: '/register-events/all',
        ajaxMethod: 'GET',
        columns: columns,
        ajaxParams: ajaxParams,
        axiosInstance: axiosInstance,
        dispatch: dispatch, // Pass dispatch for loading state
        loadingActionType: EVENT_LOADING, // Use EVENT_LOADING to show GlobalLoader
        onDataLoaded: (data, metadata, fullResponse) => {
            // Extract filter data from response and store in Redux
            if (fullResponse?.filter && dispatch) {
                dispatch({
                    type: PARTICIPATED_EVENTS,
                    payload: {
                        ...fullResponse,
                        filter: fullResponse.filter
                    }
                });
            }
            console.log('Loaded', data.length, 'registered events. Total:', metadata?.total);
        },
        restoreTablePage: restoreTablePage,
        pageLength: 10,
        lengthMenu: [[5, 10, 25, 50, -1], [5, 10, 25, 50, 'All']],
        order: [[4, 'desc']], // Sort by Event Schedule column (index 4) in descending order
        initCompleteCallback: function (settings, json, api) {
            // Restore the current page using the hook function after table is fully initialized
            if (typeof restoreTablePage === 'function') {
                restoreTablePage(api);
            }

            // Add button initialization
            if (!$('#addRegisterEventBtn').length) {
                $('.add-register-event-button').html(`
                    <button class="btn btn-primary d-flex align-items-center ml-2" id="addRegisterEventBtn">
                        <i class="feather icon-plus mr-1"></i>
                        Add
                    </button>
                `);
                $('#addRegisterEventBtn').on('click', handleAddRegisterEvent);
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
                    handleEdit(rowData, currentPage);
                } else {
                    const id = $(this).data('id');
                    if (id) {
                        handleEdit({ id }, null);
                    }
                }
            });

            $(tableZero + ' tbody').off('click', '.delete-btn').on('click', '.delete-btn', function () {
                const id = $(this).data('id');
                if (id) {
                    const table = $(tableZero).DataTable();
                    const rowData = table.row($(this).closest('tr')).data();
                    if (rowData) {
                        handleDelete(rowData);
                    } else {
                        handleDelete({ id });
                    }
                }
            });
        },
        dom: "<'row mb-3'<'col-sm-12 col-md-6'l><'col-sm-12 col-md-6 d-flex justify-content-end align-items-center'<'search-container'f><'add-register-event-button ml-2'>>>" +
             "<'row'<'col-sm-12'tr>>" +
             "<'row'<'col-sm-12 col-md-5'i><'col-sm-12 col-md-7'p>>"
    });

    return dataTableInstance;
}

const RegisteredEvents = () => {
    const dispatch = useDispatch();
    const participatedEventsData = useSelector((state) => state.event.participatedEvents || {});
    const filterData = participatedEventsData.filter || null; // Extract filter data from response
    
    const [currentTable, setCurrentTable] = useState(null);
    const location = useLocation();
    const navigate = useNavigate();
    const tableRef = useRef(null);
    
    // Transform filter data to match FilterComponent expected format
    // Backend returns: { events: [{id, eventName}], users: [{id, username, email}] }
    // FilterComponent expects: { events: [{id, name, location}], users: [{id, firstName, lastName, email}] }
    const transformedFilterUsers = useMemo(() => {
        if (!filterData?.users) return [];
        return filterData.users.map(user => {
            // Split username into firstName and lastName if possible, otherwise use username as firstName
            const nameParts = (user.username || '').split(' ').filter(part => part.trim());
            return {
                id: user.id,
                firstName: nameParts[0] || user.username || '',
                lastName: nameParts.slice(1).join(' ') || '',
                email: user.email || user.username || '' // Use email from backend or username as fallback
            };
        });
    }, [filterData?.users]);
    
    const transformedFilterEvents = useMemo(() => {
        if (!filterData?.events) return [];
        return filterData.events.map(event => ({
            id: event.id,
            name: event.eventName || event.name || '',
            location: '' // Location not in filter data, will be empty
        }));
    }, [filterData?.events]);
    
    // Filter logic using custom hook - pass filter data as initial data
    // Note: We don't pass filterAction since DataTable handles all API calls server-side
    // useFilterLogic is only used for filter UI state management
    // Use events/users from register-events API response (filterData) - no separate API call needed
    const {
        selectedUserId,
        selectedEventId,
        startDate,
        endDate,
        users,
        events,
        loadingDropdowns,
        activeFilters,
        applyFilters,
        clearFilters,
        setSelectedUserId,
        setSelectedEventId,
        setStartDate,
        setEndDate,
        handleUserChange,
        handleEventChange
    } = useFilterLogic({
        filterAction: null, // Don't call API - DataTable handles it
        // No loadUsersAction or loadEventsAction - use data from register-events API response instead
        dispatch,
        initialUsers: transformedFilterUsers, // Pass transformed filter users
        initialEvents: transformedFilterEvents, // Pass transformed filter events
        filterMode: 'registered' // Use registered mode for userFilter/eventFilter
    });

    // Use pagination persistence hook
    const { restoreTablePage } = usePersistedTablePage();

    // Use reusable table navigation hook for page preservation
    const { handleView, handleEdit, handleAdd } = useTableNavigation({
        tableRef,
        listPath: EVENT_PATHS.REGISTERED_EVENTS,
        viewPath: EVENT_PATHS.VIEW_REGISTER_EVENT,
        editPath: EVENT_PATHS.EDIT_REGISTER_EVENT,
        addPath: EVENT_PATHS.ADD_REGISTER_EVENT
    });

    // Delete modal states
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [registrationToDelete, setRegistrationToDelete] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    // Export modal states
    const [showExportModal, setShowExportModal] = useState(false);
    const [isExporting, setIsExporting] = useState(false);

    // CSV Upload states (using selectedEventId from filter)
    const [csvFile, setCsvFile] = useState(null);
    const [csvUploading, setCsvUploading] = useState(false);
    const [csvUploadError, setCsvUploadError] = useState('');
    const [csvUploadSuccess, setCsvUploadSuccess] = useState('');
    const [csvUploadDetails, setCsvUploadDetails] = useState(null); // Store upload details (successful/failed counts and errors)
    const [showErrorDetailsModal, setShowErrorDetailsModal] = useState(false);
    const [showEventAdminInfoModal, setShowEventAdminInfoModal] = useState(false);
    const [eventAdminInfoData, setEventAdminInfoData] = useState(null);

    // Add handler for Add Register Event button
    const handleAddRegisterEvent = useCallback(() => {
        handleAdd();
    }, [handleAdd]);

    // Handle delete button click
    const handleDelete = (registration) => {
        setRegistrationToDelete(registration);
        setShowDeleteModal(true);
    };

    // Handle delete confirmation
    const handleDeleteConfirm = async () => {
        if (!registrationToDelete) return;
        
        setDeleteLoading(true);
        try {
            const success = await dispatch(adminDeleteRegisterEvent(registrationToDelete.id));
            if (success) {
                setShowDeleteModal(false);
                setRegistrationToDelete(null);
                // Reload table after deletion
                if (tableRef.current) {
                    tableRef.current.ajax.reload();
                }
            }
        } catch (error) {
            console.error('Error deleting registration:', error);
        } finally {
            setDeleteLoading(false);
        }
    };

    // Handle cancel delete
    const handleCancelDelete = () => {
        setShowDeleteModal(false);
        setRegistrationToDelete(null);
    };

    // Handle export button click
    const handleExportClick = () => {
        if (!selectedEventId) {
            alert('Please select an event to export registered users');
            return;
        }
        setShowExportModal(true);
    };

    const handleGenerateQrClick = () => {
        if (!selectedEventId) {
            alert('Please select an event to generate QR codes');
            return;
        }
        const qrPath = EVENT_PATHS.PUBLIC_EVENT_QR.replace(':eventId', selectedEventId);
        window.open(qrPath, '_blank', 'noopener,noreferrer');
    };

    // CSV Upload handlers
    const handleDownloadTemplate = async () => {
        await dispatch(downloadAdminInfoCsvTemplate());
    };

    const handleCsvFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
                setCsvUploadError('Please select a valid CSV file');
                setCsvFile(null);
                return;
            }
            setCsvFile(file);
            setCsvUploadError('');
            setCsvUploadSuccess('');
        }
    };

    const handleCsvUpload = async () => {
        if (!csvFile) {
            setCsvUploadError('Please select a CSV file');
            return;
        }

        if (!selectedEventId) {
            setCsvUploadError('Please select an event from the filter above');
            return;
        }

        setCsvUploading(true);
        setCsvUploadError('');
        setCsvUploadSuccess('');
        setCsvUploadDetails(null);

        try {
            const result = await dispatch(uploadAdminInfoCsv(csvFile, selectedEventId));
            if (result.success) {
                const data = result.data || {};
                const successfulCount = data.successfulUpdates || 0;
                const failedCount = data.failedUpdates || 0;
                const totalProcessed = data.totalProcessed || 0;
                const errors = data.errors || [];

                // Set upload details
                setCsvUploadDetails({
                    successful: successfulCount,
                    failed: failedCount,
                    total: totalProcessed,
                    errors: errors
                });

                if (failedCount === 0) {
                    // All successful
                    setCsvUploadSuccess(`CSV uploaded successfully! All ${successfulCount} records processed.`);
                    setCsvFile(null);
                    // Reset file input
                    const fileInput = document.getElementById('csvFileInput');
                    if (fileInput) {
                        fileInput.value = '';
                    }
                    // Reload table after CSV upload
                    if (tableRef.current) {
                        tableRef.current.ajax.reload();
                    }
                    
                    // Load existing admin info and show modal
                    const adminInfoResult = await dispatch(getEventAdminInfo(selectedEventId));
                    if (adminInfoResult.success) {
                        setEventAdminInfoData(adminInfoResult.data);
                    }
                    setShowEventAdminInfoModal(true);
                } else {
                    // Some failed
                    const successMsg = successfulCount > 0 
                        ? `${successfulCount} record(s) uploaded successfully. ` 
                        : '';
                    const failMsg = `${failedCount} record(s) failed.`;
                    setCsvUploadSuccess(successMsg + failMsg);
                    // Clear file input even if some failed
                    setCsvFile(null);
                    const fileInput = document.getElementById('csvFileInput');
                    if (fileInput) {
                        fileInput.value = '';
                    }
                    // Error details will be shown in modal via button
                }
            } else {
                setCsvUploadError(result.message || 'Upload failed');
            }
        } catch (error) {
            setCsvUploadError('An error occurred during upload');
        } finally {
            setCsvUploading(false);
        }
    };

    // Get selected event name for modal
    const selectedEvent = events.find(event => event.id === selectedEventId);
    const selectedEventName = selectedEvent ? selectedEvent.name : '';

    // Handle save event admin info
    const handleSaveEventAdminInfo = async (eventId, data) => {
        const result = await dispatch(updateEventAdminInfo(eventId, data));
        if (result.success) {
            // Reload table after update
            if (tableRef.current) {
                tableRef.current.ajax.reload();
            }
            // Update local data
            setEventAdminInfoData(data);
        }
        return result;
    };

    // Handle export confirmation
    const handleExportConfirm = async () => {
        if (!selectedEventId) {
            alert('Please select an event to export');
            return;
        }
        setIsExporting(true);
        try {
            await dispatch(exportRegisteredUsersByEvent(selectedEventId));
            setShowExportModal(false);
        } catch (error) {
            console.error('Error exporting registered users:', error);
        } finally {
            setIsExporting(false);
        }
    };

    const destroyTable = useCallback(() => {
        if (tableRef.current) {
            tableRef.current.off('page.dt');
            $('#data-table-zero').off('click', '.view-btn');
            $('#data-table-zero').off('click', '.edit-btn');
            $('#data-table-zero').off('click', '.delete-btn');
            tableRef.current.destroy();
            tableRef.current = null;
            setCurrentTable(null);
        }
    }, []);

    const initializeTable = useCallback(() => {
        destroyTable();
        try {
            // Use function for ajaxParams to read from URL dynamically on each request
            const ajaxParams = () => {
                const urlParams = new URLSearchParams(window.location.search);
                const params = {};
                if (urlParams.get('userId')) params.userId = urlParams.get('userId');
                if (urlParams.get('eventId')) params.eventId = urlParams.get('eventId');
                if (urlParams.get('startDate')) params.startDate = urlParams.get('startDate');
                if (urlParams.get('endDate')) params.endDate = urlParams.get('endDate');
                // Support legacy filter parameters
                if (urlParams.get('user')) params.userFilter = urlParams.get('user');
                if (urlParams.get('event')) params.eventFilter = urlParams.get('event');
                return params;
            };
            
            const table = registeredEventsTable(handleView, handleEdit, handleDelete, handleAddRegisterEvent, restoreTablePage, ajaxParams, dispatch);
            tableRef.current = table;
            setCurrentTable(table);
        } catch (error) {
            console.error('Error initializing registered events table:', error);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [destroyTable, handleView, handleEdit, handleDelete, handleAddRegisterEvent]);

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


    return (
        <>
            {/* Filter Component */}
            <FilterComponent
                users={users}
                events={events}
                loadingDropdowns={loadingDropdowns}
                selectedUserId={selectedUserId}
                selectedEventId={selectedEventId}
                startDate={startDate}
                endDate={endDate}
                onUserChange={handleUserChange}
                onEventChange={handleEventChange}
                onStartDateChange={setStartDate}
                onEndDateChange={setEndDate}
                onApplyFilters={applyFilters}
                onClearFilters={clearFilters}
                activeFilters={activeFilters}
                showUserFilter={true}
                showEventFilter={true}
                showDateFilter={true}
                actionButtons={
                    <>
                        <button
                            className="btn btn-success d-flex align-items-center mb-2 mb-xl-0 mb-lg-0 mb-md-0 mb-sm-0"
                            onClick={handleGenerateQrClick}
                            disabled={!selectedEventId}
                            style={{ whiteSpace: 'nowrap' }}
                        >
                            <i className="feather icon-grid mr-1"></i>
                            Generate QR Codes
                        </button>
                        <button 
                            className="btn btn-info d-flex align-items-center mb-2 mb-xl-0 mb-lg-0 mb-md-0 mb-sm-0" 
                            onClick={handleExportClick}
                            disabled={!selectedEventId}
                            style={{ whiteSpace: 'nowrap' }}
                        >
                            <i className="feather icon-download mr-1"></i>
                            Export Users
                        </button>
                    </>
                }
            />

            {/* CSV Upload Section */}
            <Row className="mb-4">
                <Col sm={12}>
                    <Card>
                        <Card.Header>
                            <h5 className="mb-0">
                                <i className="feather icon-upload mr-2"></i>
                                Upload Table Numbers (CSV)
                            </h5>
                        </Card.Header>
                        <Card.Body>
                            {!selectedEventId && (
                                <Alert variant="warning" className="mb-3">
                                    <i className="feather icon-alert-triangle mr-2"></i>
                                    <strong>Please select an event from the filter above</strong> to upload CSV file.
                                </Alert>
                            )}
                            <Row>
                                <Col md={6}>
                                    <Form.Group>
                                        <Form.Label>CSV File <span className="text-danger">*</span></Form.Label>
                                        <div>
                                            <input
                                                type="file"
                                                id="csvFileInput"
                                                className="form-control"
                                                accept=".csv"
                                                onChange={handleCsvFileChange}
                                            />
                                            {csvFile && (
                                                <small className="text-muted d-block mt-1">
                                                    Selected: {csvFile.name}
                                                </small>
                                            )}
                                        </div>
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group>
                                        <Form.Label>&nbsp;</Form.Label>
                                        <div className="d-flex gap-2 flex-wrap">
                                            <Button
                                                variant="primary"
                                                onClick={handleCsvUpload}
                                                disabled={!csvFile || !selectedEventId || csvUploading}
                                                className="flex-fill"
                                            >
                                                {csvUploading ? (
                                                    <>
                                                        <span className="spinner-border spinner-border-sm mr-1" role="status" aria-hidden="true"></span>
                                                        Uploading...
                                                    </>
                                                ) : (
                                                    <>
                                                        <i className="feather icon-upload mr-1"></i>
                                                        Upload CSV
                                                    </>
                                                )}
                                            </Button>
                                            <Button
                                                variant="outline-primary"
                                                onClick={handleDownloadTemplate}
                                                className="flex-fill"
                                            >
                                                <i className="feather icon-download mr-1"></i>
                                                Download Template
                                            </Button>
                                            {selectedEventId && (
                                                <Button
                                                    variant="outline-secondary"
                                                    onClick={async () => {
                                                        const adminInfoResult = await dispatch(getEventAdminInfo(selectedEventId));
                                                        if (adminInfoResult.success) {
                                                            setEventAdminInfoData(adminInfoResult.data);
                                                        }
                                                        setShowEventAdminInfoModal(true);
                                                    }}
                                                    className="flex-fill"
                                                >
                                                    <i className="feather icon-edit mr-1"></i>
                                                    Update Admin Info
                                                </Button>
                                            )}
                                        </div>
                                        {selectedEventId && (
                                            <small className="text-muted d-block mt-2">
                                                <i className="feather icon-info mr-1"></i>
                                                Selected Event: <strong>{selectedEvent?.name || 'N/A'}</strong>
                                            </small>
                                        )}
                                    </Form.Group>
                                </Col>
                            </Row>
                            {csvUploadError && (
                                <Alert variant="danger" className="mt-3 mb-0">
                                    <i className="feather icon-alert-circle mr-2"></i>
                                    {csvUploadError}
                                </Alert>
                            )}
                            {csvUploadSuccess && (
                                <Alert variant={csvUploadDetails?.failed > 0 ? "warning" : "success"} className="mt-3 mb-0">
                                    <div className="d-flex justify-content-between align-items-center">
                                        <span>
                                            <i className={`feather icon-${csvUploadDetails?.failed > 0 ? 'alert-triangle' : 'check-circle'} mr-2`}></i>
                                            {csvUploadSuccess}
                                        </span>
                                        {csvUploadDetails && (
                                            <Button
                                                variant="outline-primary"
                                                size="sm"
                                                onClick={() => setShowErrorDetailsModal(true)}
                                            >
                                                <i className="feather icon-eye mr-1"></i>
                                                View Record Details
                                            </Button>
                                        )}
                                    </div>
                                </Alert>
                            )}
                            <Alert variant="info" className="mt-3 mb-2">
                                <small>
                                    <strong>Note:</strong> CSV format should be: User ID, Table Number, Dress Code, Hall. 
                                    Lucky Draw Number is auto-generated when participants mark attendance.
                                </small>
                            </Alert>
                            <Alert variant="warning" className="mb-0">
                                <small>
                                    <i className="feather icon-alert-triangle mr-2"></i>
                                    <strong>Important:</strong> Upload results are temporary. If you refresh the page or navigate away, 
                                    these details will not be available again. Please review failed records in the modal before closing.
                                </small>
                            </Alert>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
            
            <Row>
              
                <Col sm={12} className="btn-page">
                    <Card className="event-list">
                        <Card.Body>
                            <Table striped hover responsive id="data-table-zero">
                                <thead>
                                    <tr>
                                        <th>Registered By</th>
                                        <th>User Type</th>
                                        <th>Event Name / Date</th>
                                        <th>Location / Venue / Country</th>
                                        <th>Event Schedule</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                            </Table>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Delete Confirmation Modal */}
            <DeleteConfirmationModal
                show={showDeleteModal}
                onHide={handleCancelDelete}
                onConfirm={handleDeleteConfirm}
                title="Delete Registration"
                isLoading={deleteLoading}
            />

            {/* Export Confirmation Modal */}
            <ExportConfirmationModal
                show={showExportModal}
                onHide={() => setShowExportModal(false)}
                onConfirm={handleExportConfirm}
                isLoading={isExporting}
                exportType="registrations"
                eventName={selectedEventName}
            />

            {/* CSV Upload Record Details Modal */}
            <CsvUploadDetailsModal
                show={showErrorDetailsModal}
                onHide={() => setShowErrorDetailsModal(false)}
                csvUploadDetails={csvUploadDetails}
            />

            {/* Event Admin Info Modal */}
            <EventAdminInfoModal
                show={showEventAdminInfoModal}
                onHide={() => setShowEventAdminInfoModal(false)}
                eventId={selectedEventId}
                eventName={selectedEventName}
                onSave={handleSaveEventAdminInfo}
                initialData={eventAdminInfoData}
            />
        </>
    );
};


export default RegisteredEvents;
