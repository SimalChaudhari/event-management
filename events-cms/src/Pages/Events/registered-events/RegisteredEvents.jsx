import * as React from 'react';
import { useEffect, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Table from 'react-bootstrap/Table';
import { useSelector, useDispatch } from 'react-redux';
import * as $ from 'jquery';
import { participatedEvents, adminDeleteRegisterEvent } from '../../../store/actions/eventActions';
import { useLocation, useNavigate } from 'react-router-dom';
import '../../../assets/css/register.css';
import { setupDateFilter, resetFilters } from '../../../utils/dateFilter';
import RegisterEventModal from './modal/RegisterEventModal';
import AddRegisterEventModal from './modal/AddRegisterEventModal';
import DeleteConfirmationModal from '../../../components/modal/DeleteConfirmationModal';
import { formatDateTimeForTable } from '../../../components/dateTime/dateTimeUtils';

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

function atable(registrations, handleView, handleEdit, handleDelete, handleAddRegisterEvent) {
    let tableZero = '#data-table-zero';
    $.fn.dataTable.ext.errMode = 'throw';

    // Preserve the current page
    let currentPage = $(tableZero).DataTable().page();

    // Clean up existing table and event listeners
    if ($.fn.DataTable.isDataTable(tableZero)) {
        $(tableZero).DataTable().clear().destroy();
    }

    // Sort registrations by event start date
    const sortedRegistrations = [...registrations].sort((a, b) => new Date(a.event.startDate) - new Date(b.event.startDate));

    $(tableZero).DataTable({
        data: sortedRegistrations || [],
        order: [[5, 'asc']], // Sort by Event Schedule column by default
        searching: true,
        searchDelay: 500,
        pageLength: 5,
        lengthMenu: [
            [5, 10, 25, 50, -1],
            [5, 10, 25, 50, 'All']
        ],
        pagingType: 'full_numbers',
        dom:
            "<'row mb-3'<'col-sm-12 col-md-6'l><'col-sm-12 col-md-6 d-flex justify-content-end align-items-center'<'search-container'f><'add-register-event-button ml-2'>>>" +
            "<'row'<'col-sm-12'<'date-filter-wrapper'>>>" +
            "<'row'<'col-sm-12'tr>>" +
            "<'row'<'col-sm-12 col-md-5'i><'col-sm-12 col-md-7'p>>",

        columns: [
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
                              <span class="badge badge-primary font-weight-bold mt-2">Total Attendance: ${row.event.attendanceCount}</span>
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
                                row.event.id
                            }" title="View Event Details" 
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

            // Add event listener for view button
            $(document).on('click', '.view-btn', function () {
                const eventId = $(this).data('id');
                const registration = registrations.find((reg) => reg.event.id === eventId);
                if (registration) {
                    handleView(registration);
                }
            });

            // Add event listener for edit button
            $(document).on('click', '.edit-btn', function () {
                const registrationId = $(this).data('id');
                const registration = registrations.find((reg) => reg.id === registrationId);
                if (registration) {
                    handleEdit(registration);
                }
            });

            // Add event listener for delete button
            $(document).on('click', '.delete-btn', function () {
                const registrationId = $(this).data('id');
                const registration = registrations.find((reg) => reg.id === registrationId);
                if (registration) {
                    handleDelete(registration);
                }
            });

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
        }
    });

    // Restore the page
    $(tableZero).DataTable().page(currentPage).draw(false);

    // Attach event listeners for actions
    $(document).on('click', '.view-btn', function () {
        const eventId = $(this).data('id');
        const dataEvent = registrations.find((reg) => reg.event.id === eventId);
        if (dataEvent) {
            handleView(dataEvent);
        }
    });
}

const RegisteredEvents = () => {
    const dispatch = useDispatch();
    const registrations = useSelector((state) => state.event.participatedEvents.data || []);
    const [currentTable, setCurrentTable] = useState(null);
    const location = useLocation();
    const navigate = useNavigate();
    
    // Add state for view modal
    const [showViewModal, setShowViewModal] = useState(false);
    const [viewData, setViewData] = useState(null);

    // Add state for Add Register Event modal
    const [showAddRegisterModal, setShowAddRegisterModal] = useState(false);

    // Delete modal states
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [registrationToDelete, setRegistrationToDelete] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    // Add handler for view button
    const handleView = (registration) => {
        navigate(`/events/view-register-event/${registration.id}`);
    };

    const handleEdit = (registration) => {
        navigate(`/events/edit-register-event/${registration.id}`);
    };

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
                // Refresh the data
                dispatch(participatedEvents());
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

    // Add handler for Add Register Event button
    const handleAddRegisterEvent = () => {
        navigate(`/events/add-register-event`);
    };

    const destroyTable = () => {
        if (currentTable) {
            $('#data-table-zero').off('click', '.view-btn');
            currentTable.destroy();
            setCurrentTable(null);
        }
    };

    const initializeTable = () => {
        destroyTable();
        if (Array.isArray(registrations) && registrations.length >= 0) {
            const table = atable(registrations, handleView, handleEdit, handleDelete, handleAddRegisterEvent);
            setCurrentTable(table);
        }
    };

    useEffect(() => {
        dispatch(participatedEvents());
        return () => destroyTable();
    }, [dispatch]);

    useEffect(() => {
        initializeTable();
        return () => destroyTable();
    }, [registrations]);

    useEffect(() => {
        return () => {
            if (currentTable) {
                resetFilters(currentTable);
            }
        };
    }, [location.pathname]);

    return (
        <>
            <Row>
                <RegisterEventModal show={showViewModal} onHide={() => setShowViewModal(false)} eventData={viewData} />

                <AddRegisterEventModal show={showAddRegisterModal} onHide={() => setShowAddRegisterModal(false)} />

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
        </>
    );
};

// Add this helper function to calculate duration
function calculateDuration(startDate, endDate) {
    const diffTime = Math.abs(endDate - startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
        return '<span class="badge badge-light-info">1 day</span>';
    } else if (diffDays === 0) {
        return '<span class="badge badge-light-info">Same day</span>';
    } else {
        return `<span class="badge badge-light-info">${diffDays} days</span>`;
    }
}

export default RegisteredEvents;
