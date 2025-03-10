import * as React from 'react';
import { useEffect, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Table from 'react-bootstrap/Table';
import { useSelector, useDispatch } from 'react-redux';
import * as $ from 'jquery';
import { eventDelete, eventList } from '../../../store/actions/eventActions';
import { setupDateFilter, resetFilters } from '../../../utils/dateFilter';
import { useLocation } from 'react-router-dom';
import '../../../assets/css/event.css';
import DeleteConfirmationModal from '../../../components/modal/DeleteConfirmationModal';
// @ts-ignore
$.DataTable = require('datatables.net-bs');

const formatTime = (time) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
};

function atable(data, handleAddEvent, handleDelete) {
    let tableZero = '#data-table-zero';
    $.fn.dataTable.ext.errMode = 'throw';
    
    // Clean up existing table and event listeners
    if ($.fn.DataTable.isDataTable(tableZero)) {
        const existingTable = $(tableZero).DataTable();
        $(tableZero).off('click', '.delete-btn');
        existingTable.destroy();
        $(tableZero).empty();
    }

    const tableConfig = {
        data: data || [],
        order: [[0, 'asc']],
        searching: true,
        searchDelay: 500,
        pageLength: 5,
        lengthMenu: [[5, 10, 25, 50, -1], [5, 10, 25, 50, "All"]],
        pagingType: "full_numbers",
        dom: "<'row mb-3'<'col-sm-12 col-md-6'l><'col-sm-12 col-md-6 d-flex justify-content-end align-items-center'<'search-container'f><'add-event-button ml-2'>>>" +
             "<'row'<'col-sm-12'<'date-filter-wrapper'>>>" +
             "<'row'<'col-sm-12'tr>>" +
             "<'row'<'col-sm-12 col-md-5'i><'col-sm-12 col-md-7'p>>",
        columns: [
            {
                data: 'name',
                title: 'Event Name',
                render: function (data, type, row) {
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
                            <h6 class="m-b-0">${row.name}</h6>
                            <p class="m-b-0">
                                <span class="badge ${badgeClass}">
                                    ${eventDate.getDate()} ${monthNames[eventDate.getMonth()]} ${eventDate.getFullYear()}
                                    <span class="ml-1">${statusText}</span>
                                </span>
                            </p>
                        </div>
                    `;
                }
            },
            { data: 'type', title: 'Type' },
            {
                data: 'price',
                title: 'Price',
                render: function (data, type, row) {
                    return `${row.currency} ${parseFloat(data).toFixed(2)}`;
                }
            },
            { data: 'location', title: 'Location' },
            {
                data: 'description',
                title: 'Description',
                render: function (data) {
                    return `<div style="max-width: 200px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                        ${data}
                    </div>`;
                }
            },
            {
                data: null,
                title: 'Start',
                render: function (data, type, row) {
                    const date = new Date(row.startDate);
                    const formattedDate = date.toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                    });
                    const formattedTime = row.startTime ? formatTime(row.startTime) : '';
                    return `
                        <div class="event-date-time">
                            <div class="event-date">${formattedDate}</div>
                            ${formattedTime ? `<div class="event-time-text">${formattedTime}</div>` : ''}
                        </div>
                    `;
                }
            },
            {
                data: null,
                title: 'End',
                render: function (data, type, row) {
                    const date = new Date(row.endDate);
                    const formattedDate = date.toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                    });
                    const formattedTime = row.endTime ? formatTime(row.endTime) : '';
                    return `
                        <div class="event-date-time">
                            <div class="event-date">${formattedDate}</div>
                            ${formattedTime ? `<div class="event-time-text">${formattedTime}</div>` : ''}
                        </div>
                    `;
                }
            },
            {
                data: null,
                title: 'Duration',
                render: function (data, type, row) {
                    if (!row.startDate || !row.endDate) return '';

                    const startDate = new Date(row.startDate);
                    const endDate = new Date(row.endDate);
                    const diffTime = Math.abs(endDate - startDate);
                    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

                    let duration = '';
                    if (diffDays === 0) {
                        duration = 'Same day';
                    } else if (diffDays === 1) {
                        duration = '1 day';
                    } else {
                        duration = `${diffDays} days`;
                    }

                    return `<span class="badge badge-light">${duration}</span>`;
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
        initComplete: function(settings, json) {
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

            // Add button initialization
            if (!$('#addEventBtn').length) {
                $('.add-event-button').html(`
                    <button class="btn btn-primary d-flex align-items-center ml-2" id="addEventBtn">
                        <i class="feather icon-plus mr-1"></i>
                        Add Event
                    </button>
                `);

                $('#addEventBtn').on('click', handleAddEvent);
            }

            // Add delete button event listener
            $(tableZero).on('click', '.delete-btn', function(e) {
                e.preventDefault();
                const eventId = $(this).data('id');
                handleDelete(eventId);
            });

            // Setup date filter after table is initialized
            setupDateFilter(this.api());
        },
        drawCallback: function(settings) {
            // Reattach event listeners after table redraw
            $(tableZero).find('.delete-btn').off('click').on('click', function(e) {
                e.preventDefault();
                const eventId = $(this).data('id');
                handleDelete(eventId);
            });
        }
    };

    return $(tableZero).DataTable(tableConfig);
}

const EventView = () => {
    const dispatch = useDispatch();
    const events = useSelector((state) => state.event?.event?.events);
   
    const [currentTable, setCurrentTable] = useState(null);
    const location = useLocation();
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const destroyTable = () => {
        if (currentTable) {
            $('#data-table-zero').off('click', '.delete-btn');
            currentTable.destroy();
            setCurrentTable(null);
        }
    };

    const initializeTable = () => {
        destroyTable();
        if (Array.isArray(events) && events.length >= 0) {
            const table = atable(events, handleAddEvent, handleDelete);
            setCurrentTable(table);
        }
    };

    useEffect(() => {
        dispatch(eventList({}));
        return () => destroyTable();
    }, [dispatch]);

    useEffect(() => {
        initializeTable();
        return () => destroyTable();
    }, [events]);

    useEffect(() => {
        return () => {
            if (currentTable) {
                resetFilters(currentTable);
            }
        };
    }, [location.pathname]);

    const handleAddEvent = React.useCallback(() => {
        // Your add event logic
    }, []);

    const handleDelete = (eventId) => {
        setItemToDelete({ id: eventId });
        setShowDeleteModal(true);
    };

    const handleConfirmDelete = async () => {
        if (!itemToDelete) return;

        setIsDeleting(true);
        try {
            await dispatch(eventDelete(itemToDelete.id));
            setShowDeleteModal(false);
            setItemToDelete(null);
            destroyTable();
            await dispatch(eventList({}));
        } catch (error) {
            console.error('Delete failed:', error);
        } finally {
            setIsDeleting(false);
        }
    };

    const handleCloseModal = () => {
        if (!isDeleting) {
            setShowDeleteModal(false);
            setItemToDelete(null);
        }
    };

    return (
        <>
            <DeleteConfirmationModal
                show={showDeleteModal}
                onHide={handleCloseModal}
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
                                        <th>Event Name</th>
                                        <th>Type</th>
                                        <th>Price</th>
                                        <th>Location</th>
                                        <th>Description</th>
                                        <th>Start</th>
                                        <th>End</th>
                                        <th>Duration</th>
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
