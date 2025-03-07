import * as React from 'react';
import { useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Table from 'react-bootstrap/Table';
import { useSelector, useDispatch } from 'react-redux';
import * as $ from 'jquery';
import { eventList } from '../../../store/actions/eventActions'; // You'll need to create this

// @ts-ignore
$.DataTable = require('datatables.net-bs');

function atable(data, handleAddEvent) {
    let tableZero = '#data-table-zero';
    $.fn.dataTable.ext.errMode = 'throw';

    if ($.fn.DataTable.isDataTable(tableZero)) {
        $(tableZero).DataTable().clear().destroy();
    }

    $(tableZero).DataTable({
        data: data,
        order: [[0, 'asc']],
        searching: true,
        searchDelay: 500,
        pageLength: 5,
        lengthMenu: [[5, 10, 25, 50, -1], [5, 10, 25, 50, "All"]],
        pagingType: "full_numbers",

        dom: "<'row'<'col-sm-12 col-md-6'l><'col-sm-12 col-md-6 d-flex justify-content-end'f<'add-event-button ml-2'>>>" +
             "<'row'<'col-sm-12'tr>>" +
             "<'row'<'col-sm-12 col-md-5'i><'col-sm-12 col-md-7'p>>",

        initComplete: function(settings, json) {
            $('.add-event-button').html(`
                <button class="btn btn-primary d-flex align-items-center ml-2" id="addEventBtn">
                    <i class="feather icon-plus mr-1"></i>
                    Add Event
                </button>
            `);

            $('#addEventBtn').on('click', function() {
                handleAddEvent();
            });
        },

        columns: [
            {
                data: 'name',
                title: 'Event Name',
                render: function(data, type, row) {
                    return `
                        <div class="d-inline-block align-middle">
                            <h6 class="m-b-0">${row.name}</h6>
                            <p class="m-b-0 text-muted">${row.type}</p>
                        </div>
                    `;
                }
            },
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
                data: 'startDate',
                title: 'Start Date',
                render: function(data) {
                    return new Date(data).toLocaleDateString();
                }
            },
            { 
                data: 'endDate',
                title: 'End Date',
                render: function(data) {
                    return new Date(data).toLocaleDateString();
                }
            },
            { data: 'location', title: 'Location' },
            { data: 'type', title: 'Type' },
            { 
                data: 'price',
                title: 'Price',
                render: function(data, type, row) {
                    return `${row.currency} ${parseFloat(data).toFixed(2)}`;
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

    // Event handlers
    $(document).on('click', '.view-btn', function() {
        const eventId = $(this).data('id');
        alert(`View event with ID: ${eventId}`);
    });

    $(document).on('click', '.edit-btn', function() {
        const eventId = $(this).data('id');
        alert(`Edit event with ID: ${eventId}`);
    });

    $(document).on('click', '.delete-btn', function() {
        const eventId = $(this).data('id');
        if(window.confirm('Are you sure you want to delete this event?')) {
            alert(`Delete event with ID: ${eventId}`);
        }
    });
}

const EventView = () => {
    const dispatch = useDispatch();
    const events = useSelector((state) => state.event?.event?.events);

    const handleAddEvent = () => {
        // Add your modal logic here
    };

    useEffect(() => {
        if (events?.length) {
            atable(events, handleAddEvent);
        }
    }, [events]);

    useEffect(() => {
        const fetchData = async () => {
            await dispatch(eventList());
        };
        fetchData();
    }, [dispatch]);

    return (
        <Row>
            <Col sm={12} className="btn-page">
                <Card className="event-list">
                    <Card.Body>
                        <Table striped hover responsive id="data-table-zero">
                            <thead>
                                <tr>
                                    <th>Event Name</th>
                                    <th>Description</th>
                                    <th>Start Date</th>
                                    <th>End Date</th>
                                    <th>Location</th>
                                    <th>Type</th>
                                    <th>Price</th>
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

export default EventView;
