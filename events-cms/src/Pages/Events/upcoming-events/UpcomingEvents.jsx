import * as React from 'react';
import { useEffect, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Table from 'react-bootstrap/Table';
import { useSelector, useDispatch } from 'react-redux';
import * as $ from 'jquery';
import { eventList, eventDelete } from '../../../store/actions/eventActions'; // You'll need to create this
import '../../../assets/css/event.css';
import { setupDateFilter, resetFilters } from '../../../utils/dateFilter';
import { useLocation } from 'react-router-dom';
import DeleteConfirmationModal from '../../../components/modal/DeleteConfirmationModal';

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

function atable(data, handleAddEvent, handleDelete) {
    let tableZero = '#data-table-zero';
    $.fn.dataTable.ext.errMode = 'throw';

    // First destroy existing table if it exists
    if ($.fn.DataTable.isDataTable(tableZero)) {
        const existingTable = $(tableZero).DataTable();
        $(tableZero).off('click', '.delete-btn');
        existingTable.destroy();
        $(tableZero).empty();
    }

    // Filter and sort upcoming events
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const upcomingEvents = data
        .filter(event => {
            const eventDate = new Date(event.startDate);
            eventDate.setHours(0, 0, 0, 0);
            return eventDate >= today;
        })
        .sort((a, b) => new Date(a.startDate) - new Date(b.startDate)); // Sort by date

    const tableConfig = {
        data: upcomingEvents,
        order: [[5, 'asc']], // Sort by Start Date column by default
        searching: true,
        searchDelay: 500,
        pageLength: 5,
        lengthMenu: [[5, 10, 25, 50, -1], [5, 10, 25, 50, "All"]],
        pagingType: "full_numbers",
        dom: "<'row mb-3'<'col-sm-12 col-md-6'l><'col-sm-12 col-md-6 d-flex justify-content-end align-items-center'<'search-container'f>>>" +
             "<'row'<'col-sm-12'<'date-filter-wrapper'>>>" +
             "<'row'<'col-sm-12'tr>>" +
             "<'row'<'col-sm-12 col-md-5'i><'col-sm-12 col-md-7'p>>",

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
        },
        columns: [
            {
                data: 'name',
                title: 'Event Name',
                render: function(data, type, row) {
                    const eventDate = new Date(row.startDate);
                    const today = new Date();
                    const daysUntilEvent = Math.ceil(
                        (eventDate - today) / (1000 * 60 * 60 * 24)
                    );
                    
                    let badgeClass = 'badge-light-info';
                    let statusText = '';

                    if (daysUntilEvent === 0) {
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
                            <h6 class="m-b-0">${row.name}</h6>
                            <p class="m-b-0">
                                <span class="badge ${badgeClass}">
                                    ${statusText}
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
                render: function(data, type, row) {
                    return `${row.currency} ${parseFloat(data).toFixed(2)}`;
                }
            },
            { data: 'location', title: 'Location' },
            { 
                data: 'description',
                title: 'Description',
                render: function(data) {
                    return `<div style="max-width: 200px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                        ${data}
                    </div>`;
                }
            },
            { 
                data: null,
                title: 'Start',
                render: function(data, type, row) {
                    if (type === 'sort') {
                        return row.startDate + ' ' + (row.startTime || '');
                    }

                    const date = new Date(row.startDate);
                    const today = new Date();
                    const tomorrow = new Date(today);
                    tomorrow.setDate(tomorrow.getDate() + 1);

                    let dateDisplay;
                    if (date.toDateString() === today.toDateString()) {
                        dateDisplay = 'Today';
                    } else if (date.toDateString() === tomorrow.toDateString()) {
                        dateDisplay = 'Tomorrow';
                    } else {
                        dateDisplay = date.toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                        });
                    }

                    const formattedTime = row.startTime ? formatTime(row.startTime) : '';
                    return `
                        <div class="event-date-time">
                            <div class="event-date">${dateDisplay}</div>
                            ${formattedTime ? `<div class="event-time-text">${formattedTime}</div>` : ''}
                        </div>
                    `;
                }
            },
            { 
                data: null,
                title: 'End',
                render: function(data, type, row) {
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
                render: function(data, type, row) {
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
                render: function(data, type, row) {
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
        ]
    };

    return $(tableZero).DataTable(tableConfig);
}

const UpcomingEvents = () => {
    const dispatch = useDispatch();
    const events = useSelector((state) => state.event?.event?.events);
    const [currentTable, setCurrentTable] = useState(null);
    const location = useLocation();

    // Add these states for delete modal
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
        // Add your modal logic here
    }, []);

    // Add delete handling functions
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

export default UpcomingEvents;

