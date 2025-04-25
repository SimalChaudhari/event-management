import * as React from 'react';
import { useEffect, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Table from 'react-bootstrap/Table';
import { useSelector, useDispatch } from 'react-redux';
import * as $ from 'jquery';
import { eventDelete, upcomingEventList } from '../../../store/actions/eventActions';
import { setupDateFilter, resetFilters } from '../../../utils/dateFilter';
import { useLocation } from 'react-router-dom';
import '../../../assets/css/event.css';
import DeleteConfirmationModal from '../../../components/modal/DeleteConfirmationModal';

import ViewEventModal from '../all-events/components/ViewEventModal';
import AddEventModal from '../all-events/components/AddEventModal';
import { API_URL, DUMMY_PATH } from '../../../configs/env';

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

function atable(data, handleAddEvent, handleEdit, handleDelete, handleView) {
    let tableZero = '#data-table-zero';
    $.fn.dataTable.ext.errMode = 'throw';

    // Preserve the current page
    let currentPage = $(tableZero).DataTable().page();

    // Clean up existing table and event listeners
    if ($.fn.DataTable.isDataTable(tableZero)) {
        $(tableZero).DataTable().clear().destroy();
    }

    $(tableZero).DataTable({
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
                         <img src="${row.image ? `${API_URL}/${row.image}` : imageUrl}" alt="user" class="img-radius align-top m-r-15" style="width:50px; height:50px; object-fit:cover;" />
                              <div class="d-inline-block">
                            <p class="m-b-0">
                                 <h6>${row.name}</h6>
                                    <span class="badge ${badgeClass}">
                                       ${eventDate.getDate()} ${monthNames[eventDate.getMonth()]} ${eventDate.getFullYear()}
                                        <span class="ml-1">${statusText}</span>
                                    </span>
                            </p>
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
                    return `${row.currency} ${parseFloat(data).toFixed(2)}`;
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

     
        },
    })
       
  // Restore the page
  $(tableZero).DataTable().page(currentPage).draw(false);

  // Attach event listeners for actions
  $(document).on('click', '.btn-icon', function () {
      const eventId = $(this).data('id');
      const dataEvent = data.find((user) => user.id === eventId);
      if (dataEvent) {
        handleView(dataEvent);
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
}


const UpcomingEvents = () => {
    const dispatch = useDispatch();
    const events = useSelector((state) => state.event?.upcomingEvents?.events);
    const [showModal, setShowModal] = React.useState(false);

    const [currentTable, setCurrentTable] = useState(null);
    const location = useLocation();
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const [showViewModal, setShowViewModal] = React.useState(false); // State for view modal
    const [editData, setEditData] = React.useState(null);

    const [viewData, setViewData] = React.useState(null); // State for user data to view
    const [showConfirmModal, setShowConfirmModal] = React.useState(false);

    const handleView = (data) => {
        setViewData(data);
        setShowViewModal(true);
    };

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
            const table = atable(events, handleAddEvent, handleEdit, handleDelete, handleView);
            setCurrentTable(table);
        }
    };

    useEffect(() => {
        dispatch(upcomingEventList({}));
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

    const handleAddEvent = () => {
        setEditData(null);
        setShowModal(true);
    };

    const handleEdit = (data) => {
        setEditData(data);
        setShowModal(true);
    };

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
            await dispatch(upcomingEventList({}));
        } catch (error) {
            console.error('Delete failed:', error);
        } finally {
            setIsDeleting(false);
        }
    };

    const handleClose = () => {
        if (!isDeleting) {
            setShowDeleteModal(false);
            setItemToDelete(null);
        }
    };

    const handleCloseModal = () => {
        setShowModal(false);
    };
    
    return (
        <>
            <AddEventModal show={showModal} handleClose={handleCloseModal} editData={editData} />
            <ViewEventModal show={showViewModal} handleClose={() => setShowViewModal(false)} eventData={viewData} />

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
