import * as React from 'react';
import { useEffect, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Table from 'react-bootstrap/Table';
import { useSelector, useDispatch } from 'react-redux';
import * as $ from 'jquery';
import { eventList } from '../../../store/actions/eventActions'; // You'll need to create this
import { useNavigate, useLocation } from 'react-router-dom';
import queryString from 'query-string'; // You might need to install this package

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

function atable(data, handleAddEvent) {
    let tableZero = '#data-table-zero';
    $.fn.dataTable.ext.errMode = 'throw';

    // First destroy existing table if it exists
    if ($.fn.DataTable.isDataTable(tableZero)) {
        $(tableZero).DataTable().destroy();
        $(tableZero).empty(); // Clear the table contents
    }

    // Filter out past events
    const upcomingEvents = data.filter(event => {
        const eventDate = new Date(event.startDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return eventDate >= today;
    });

    const table = $(tableZero).DataTable({
        data: upcomingEvents,
        order: [], // Disable initial sorting as we're pre-sorting the data
        searching: true,
        searchDelay: 500,
        pageLength: 5,
        lengthMenu: [[5, 10, 25, 50, -1], [5, 10, 25, 50, "All"]],
        pagingType: "full_numbers",

        dom: "<'row mb-3'<'col-sm-12 col-md-6'l><'col-sm-12 col-md-6 d-flex justify-content-end align-items-center'<'search-container'f><'add-event-button ml-2'>>>" +
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
                        <div class="btn btn-light">
                            <i class="feather icon-x mr-1 mt-1"></i>
                        </div>
                    </div>
                </div>
            `;
            
            $('.date-filter-wrapper').html(dateFilterHtml);

            // Add event listeners for date inputs
            $('#startDateFilter, #endDateFilter').on('change', function() {
                const startDate = $('#startDateFilter').val();
                const endDate = $('#endDateFilter').val();

                if (startDate && endDate) {
                    if (new Date(endDate) < new Date(startDate)) {
                        alert('End date cannot be earlier than start date');
                        this.value = '';
                        return;
                    }

                    // Filter the table
                    table.draw();
                    $('#clearFilterBtn').show();
                }
            });

            // Add clear filter functionality
            $('#clearFilterBtn').on('click', function() {
                $('#startDateFilter').val('');
                $('#endDateFilter').val('');
                table.draw();
                $(this).hide();
            });

            // Custom filter function
            $.fn.dataTable.ext.search.push(
                function(settings, data, dataIndex) {
                    const startDate = $('#startDateFilter').val();
                    const endDate = $('#endDateFilter').val();

                    if (!startDate && !endDate) {
                        return true;
                    }

                    const eventStartDate = new Date(data[5]); // Index 5 is the Start Date column
                    
                    if (startDate && endDate) {
                        const filterStart = new Date(startDate);
                        const filterEnd = new Date(endDate);
                        return eventStartDate >= filterStart && eventStartDate <= filterEnd;
                    }
                    
                    return true;
                }
            );
        },

        columns: [
            {
                data: 'name',
                title: 'Event Name',
                render: function(data, type, row) {
                    const eventDate = new Date(row.startDate);
                    const daysUntilEvent = Math.ceil(
                        (eventDate - new Date()) / (1000 * 60 * 60 * 24)
                    );
                    
                    let badgeClass = 'badge-light-info';
                    if (daysUntilEvent <= 7) {
                        badgeClass = 'badge-light-warning';
                    }
                    if (daysUntilEvent <= 3) {
                        badgeClass = 'badge-light-danger';
                    }
                    
                    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                                     'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                    
                    return `
                        <div class="d-inline-block align-middle">
                            <h6 class="m-b-0">${row.name}</h6>
                            <p class="m-b-0">
                                <span class="badge ${badgeClass}">
                                    ${eventDate.getDate()} ${monthNames[eventDate.getMonth()]} ${eventDate.getFullYear()}
                                    (in ${daysUntilEvent} days)
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
    });

    return table;
}

const RegisteredEvents = () => {
    const dispatch = useDispatch();
    const events = useSelector((state) => state.event?.event?.events);
    const [currentTable, setCurrentTable] = useState(null);
    const location = useLocation();

    useEffect(() => {
        dispatch(eventList({}));
        return () => {
            if (currentTable) {
                currentTable.destroy();
                setCurrentTable(null);
            }
        };
    }, [dispatch, location.key]);

    useEffect(() => {
        if (events?.length) {
            const table = atable(events, handleAddEvent);
            setCurrentTable(table);
        }

        return () => {
            if (currentTable) {
                currentTable.destroy();
                setCurrentTable(null);
            }
        };
    }, [events]);

    const handleAddEvent = React.useCallback(() => {
        // Add your modal logic here
    }, []);

    useEffect(() => {
        // Add styles when component mounts
        const styleSheet = document.createElement("style");
        styleSheet.innerText = styles;
        document.head.appendChild(styleSheet);

        // Cleanup styles when component unmounts
        return () => {
            document.head.removeChild(styleSheet);
        };
    }, []); // Empty dependency array means this runs once on mount

    return (
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
    );
};

// Update CSS
const styles = `
    .badge-light-info {
        background-color: rgba(3, 169, 244, 0.15);
        color: #03a9f4;
        font-weight: 500;
        font-size: 0.75rem;
        padding: 4px 8px;
        border-radius: 4px;
    }

    .badge-light-warning {
        background-color: rgba(255, 152, 0, 0.15);
        color: #ff9800;
        font-weight: 500;
        font-size: 0.75rem;
        padding: 4px 8px;
        border-radius: 4px;
    }

    .badge-light-danger {
        background-color: rgba(244, 67, 54, 0.15);
        color: #f44336;
        font-weight: 500;
        font-size: 0.75rem;
        padding: 4px 8px;
        border-radius: 4px;
    }

    .event-list .dataTables_empty {
        text-align: center;
        padding: 40px 0;
        color: #6c757d;
        font-style: italic;
    }

    .event-time {
        font-size: 0.875rem;
        color: #6c757d;
    }

    .badge-light {
        background-color: #f8f9fa;
        color: #495057;
        border: 1px solid #dee2e6;
        font-size: 0.75rem;
        padding: 3px 8px;
        border-radius: 12px;
    }

    .duration-badge {
        font-size: 0.75rem;
        padding: 3px 8px;
        border-radius: 12px;
    }

    .event-date-time {
        display: flex;
        flex-direction: column;
    }

    .event-date {
        font-weight: 500;
        color: #495057;
    }

    .event-time-text {
        font-size: 0.8125rem;
        color: #6c757d;
        margin-top: 2px;
    }

    .date-filter-container {
        background: #f8f9fa;
        padding: 12px 15px;
        border-radius: 4px;
        margin-bottom: 15px;
    }

    .filter-group {
        display: flex;
        align-items: center;
    }

    .filter-group input[type="date"] {
        width: 140px;
        height: 31px;
        padding: 4px 8px;
        font-size: 13px;
        border: 1px solid #dee2e6;
        border-radius: 4px;
    }

    .filter-group label {
        margin: 0;
        white-space: nowrap;
        color: #495057;
        font-weight: 500;
    }

    #clearFilterBtn {
        transition: all 0.3s ease;
    }

    #clearFilterBtn .btn {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 4px 12px;
        height: 31px;
        font-size: 13px;
        border: 1px solid #dee2e6;
    }

    #clearFilterBtn .btn:hover {
        background-color: #e9ecef;
    }

    .search-container {
        flex: 1;
        max-width: 300px;
    }

    .dataTables_filter input {
        width: 100% !important;
        min-width: 200px;
    }

    .add-event-button {
        min-width: fit-content;
        position: relative;
        bottom: 4px;
    }

        @media (max-width: 650px) {
        .add-event-button {
            width: 100%;
            margin-left: 0 !important;
            padding-left: 15px !important;
            position: static;  /* Remove position */
            bottom: 0;        /* Remove bottom spacing */
        }



    .dataTables_length select {
        margin: 0 8px;
    }

    .dataTables_filter {
        width: 100%;
    }

    .dataTables_filter label {
        width: 100%;
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .dataTables_filter input {
        width: 100% !important;
        min-width: 200px;
        margin-left: 0 !important;
    }

    @media (max-width: 480px) {
        .dataTables_length,
        .dataTables_filter,
        .date-filter-container {
            width: 100%;
            margin-bottom: 10px;
        }

        .dataTables_length {
            text-align: left;
            padding-left: 0;
        }

        .search-container {
            max-width: 100%;
            margin-bottom: 10px;
            padding-left: 0;
        }

        .dataTables_filter {
            padding-left: 0;
        }

        .dataTables_filter label {
            margin-left: 0;
        }

        .dataTables_length select,
        .dataTables_filter input {
            flex: 1;
        }

        .dataTables_wrapper .row:first-child > div {
            padding-left: 15px !important;
        }

        .date-filter-container {
            flex-direction: column;
            gap: 10px;
        }

        .filter-group {
            width: 100%;
        }

        .add-event-button {
            width: 100%;
            margin-left: 0 !important;
            padding-left: 15px !important;
        }


        .d-flex {
            flex-wrap: wrap;
        }

        /* Ensure consistent left alignment */
        .dataTables_wrapper .row > div {
            padding-left: 15px;
            padding-right: 15px;
        }
    }
`;

export default RegisteredEvents;


