import * as React from 'react';
import { useEffect, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Table from 'react-bootstrap/Table';
import { useSelector, useDispatch } from 'react-redux';
import * as $ from 'jquery';
import {  participatedEvents } from '../../../store/actions/eventActions'; // You'll need to create this
import { useLocation } from 'react-router-dom';
import '../../../assets/css/register.css'; // Import the CSS file
import { setupDateFilter, resetFilters } from '../../../utils/dateFilter';

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

function atable(registrations) {
    let tableZero = '#data-table-zero';

    // Clean up existing table
    if ($.fn.DataTable.isDataTable(tableZero)) {
        const existingTable = $(tableZero).DataTable();
        existingTable.destroy();
        $(tableZero).empty();
    }

    // Sort registrations by event start date
    const sortedRegistrations = [...registrations].sort((a, b) => 
        new Date(a.event.startDate) - new Date(b.event.startDate)
    );

    const tableConfig = {
        data: sortedRegistrations,
        order: [[5, 'asc']], // Sort by Event Schedule column by default
        searching: true,
        searchDelay: 500,
        pageLength: 5,
        lengthMenu: [[5, 10, 25, 50, -1], [5, 10, 25, 50, "All"]],
        pagingType: "full_numbers",
        dom: "<'row mb-3'<'col-sm-12 col-md-6'l><'col-sm-12 col-md-6 d-flex justify-content-end align-items-center'<'search-container'f>>>" +
             "<'row'<'col-sm-12'<'date-filter-wrapper'>>>" +
             "<'row'<'col-sm-12'tr>>" +
             "<'row'<'col-sm-12 col-md-5'i><'col-sm-12 col-md-7'p>>",

        columns: [
            {
                data: 'event.name',
                title: 'Event Name',
                render: function(data, type, row) {
                    const eventDate = new Date(row.event.startDate);
                    const today = new Date();
                    const daysUntilEvent = Math.ceil(
                        (eventDate - today) / (1000 * 60 * 60 * 24)
                    );
                    
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
                            <h6 class="m-b-0">${row.event.name}</h6>
                            <p class="m-b-0">
                                <span class="badge ${badgeClass}">${statusText}</span>
                                <span class="badge badge-secondary ml-1">${row.event.type}</span>
                            </p>
                        </div>
                    `;
                }
            },
            {
                data: 'user',
                title: 'Registered By',
                render: function(data, type, row) {
                    return `
                        <div class="d-inline-block">
                            <div>${row.user.firstName} ${row.user.lastName}</div>
                            <span class="text-muted">${row.user.email}</span>
                            ${row.user.mobile ? `<br><span class="text-muted">${row.user.mobile}</span>` : ''}
                        </div>
                    `;
                }
            },
            {
                data: null,
                title: 'Registration Details',
                render: function(data, type, row) {
                    const regDate = new Date(row.registeredAt).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    });
                    
                    return `
                        <div class="d-flex flex-column">
                         
                            <span class="text-muted mt-1">Role: ${row.role}</span>
                            <span class="text-muted">Registered: ${regDate}</span>

                               <div>
                                <span class="badge ${row.paymentStatus === 'Completed' ? 'badge-light-success' : 'badge-light-warning'}">
                                    ${row.paymentStatus}
                                </span>
                            </div>
                        </div>
                    `;
                }
            },
            { 
                data: 'event.price',
                title: 'Price',
                render: function(data, type, row) {
                    return `${row.event.currency} ${parseFloat(row.event.price).toFixed(2)}`;
                }
            },
            { 
                data: 'event.location', 
                title: 'Venue',
                render: function(data) {
                    return `<div class="text-wrap" style="max-width: 200px;">${data}</div>`;
                }
            },
            { 
                data: null,
                title: 'Event Schedule',
                render: function(data, type, row) {
                    if (type === 'sort') {
                        return row.event.startDate + ' ' + (row.event.startTime || '');
                    }

                    const startDate = new Date(row.event.startDate);
                    const endDate = new Date(row.event.endDate);
                    const today = new Date();
                    const tomorrow = new Date(today);
                    tomorrow.setDate(tomorrow.getDate() + 1);

                    let startDateDisplay;
                    if (startDate.toDateString() === today.toDateString()) {
                        startDateDisplay = 'Today';
                    } else if (startDate.toDateString() === tomorrow.toDateString()) {
                        startDateDisplay = 'Tomorrow';
                    } else {
                        startDateDisplay = startDate.toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                        });
                    }

                    const endDateDisplay = endDate.toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                    });

                    const startTime = row.event.startTime ? formatTime(row.event.startTime) : '';
                    const endTime = row.event.endTime ? formatTime(row.event.endTime) : '';

                    return `
                        <div class="event-schedule-inline">
                            <div class="schedule-time">
                                <i class="feather icon-calendar text-primary"></i>
                                <span class="date-range">
                                    ${startDateDisplay} ${startTime ? `at ${startTime}` : ''} 
                                    <i class="feather icon-arrow-right mx-2"></i> 
                                    ${endDateDisplay} ${endTime ? `at ${endTime}` : ''}
                                </span>
                            </div>
                            <div class="duration-badge mt-1">
                                ${calculateDuration(startDate, endDate)}
                            </div>
                        </div>
                    `;
                }
            },
            {
                data: null,
                title: 'Actions',
                orderable: false,
                render: function(data, type, row) {
                    return `
                        <div class="btn-group" role="group" aria-label="Actions">
                            <button type="button" class="btn btn-icon btn-success view-btn" data-id="${row.event.id}" title="View Event Details" 
                                style="margin-right: 10px; width: 40px; height: 40px; border-radius: 50%; display: inline-flex; justify-content: center; align-items: center;">
                                <i class="feather icon-eye"></i>
                            </button>
                            ${row.receiptUrl ? `
                                <button type="button" class="btn btn-info btn-circle btn-sm receipt-btn" data-url="${row.receiptUrl}" title="Download Receipt" 
                                    style="margin-right: 10px; width: 40px; height: 40px; border-radius: 50%; display: inline-flex; justify-content: center; align-items: center;">
                                    <i class="feather icon-download"></i>
                                </button>
                            ` : ''}
                            ${row.invoiceUrl ? `
                                <button type="button" class="btn btn-primary btn-circle btn-sm invoice-btn" data-url="${row.invoiceUrl}" title="Download Invoice" 
                                    style="width: 40px; height: 40px; border-radius: 50%; display: inline-flex; justify-content: center; align-items: center;">
                                    <i class="feather icon-file-text"></i>
                                </button>
                            ` : ''}
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

            // Setup date filter after table is initialized
            setupDateFilter(this.api());
        }
    };

    return $(tableZero).DataTable(tableConfig);
}

const RegisteredEvents = () => {
    const dispatch = useDispatch();
    const registrations = useSelector((state) => state.event.participatedEvents.registrations || []);
    const [currentTable, setCurrentTable] = useState(null);
    const location = useLocation();

    useEffect(() => {
        dispatch(participatedEvents());
    }, [dispatch]);

    useEffect(() => {
        if (registrations?.length) {
            const table = atable(registrations);
            setCurrentTable(table);
        }

        return () => {
            if (currentTable) {
                resetFilters(currentTable);
                currentTable.destroy();
                setCurrentTable(null);
            }
        };
    }, [registrations]);

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

    return (
        <Row>
            <Col sm={12} className="btn-page">
                <Card className="event-list">
                    <Card.Body>
                        <Table striped hover responsive id="data-table-zero">
                            <thead>
                                <tr>
                                    <th>Event Name</th>
                                    <th>Registered By</th>
                                    <th>Registration Details</th>
                                    <th>Price</th>
                                    <th>Venue</th>
                                    <th>Event Schedule</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                        </Table>
                    </Card.Body>
                </Card>
            </Col>
        </Row>
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

// Add this helper function to parse the date string
function parseDate(dateStr) {
    // Convert date format "DD MMM YYYY" to Date object
    const [day, month, year] = dateStr.split(' ');
    const months = {
        'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
        'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
    };
    return new Date(year, months[month], parseInt(day));
}

export default RegisteredEvents;



