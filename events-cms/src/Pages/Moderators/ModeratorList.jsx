import React, { useState, useEffect } from 'react';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Table from 'react-bootstrap/Table';
import { useSelector, useDispatch } from 'react-redux';
import * as $ from 'jquery';
import { getAllModerators, deleteModerator } from '../../store/actions/moderatorActions';
import { useNavigate } from 'react-router-dom';
import '../../assets/css/event.css';
import DeleteConfirmationModal from '../../components/modal/DeleteConfirmationModal';
import { formatDateTimeForTable } from '../../components/dateTime/dateTimeUtils';

// @ts-ignore
$.DataTable = require('datatables.net-bs');

function moderatorsTable(data, handleAdd, handleEdit, handleDelete, handleView, handleAssignEvents) {
    let tableZero = '#moderators-data-table';
    $.fn.dataTable.ext.errMode = 'throw';

    // Preserve the current page
    let currentPage = 0;
    if ($.fn.DataTable.isDataTable(tableZero)) {
        currentPage = $(tableZero).DataTable().page();
        $(tableZero).DataTable().clear().destroy();
    }

    $(tableZero).DataTable({
        data: data || [],
        order: [[4, 'desc']], // Sort by created date
        searching: true,
        searchDelay: 500,
        pageLength: 10,
        lengthMenu: [
            [5, 10, 25, 50, -1],
            [5, 10, 25, 50, 'All']
        ],
        pagingType: 'full_numbers',
        dom:
            "<'row mb-3'<'col-sm-12 col-md-6'l><'col-sm-12 col-md-6 d-flex justify-content-end align-items-center'<'search-container'f><'add-moderator-button ml-2'>>>" +
            "<'row'<'col-sm-12'tr>>" +
            "<'row'<'col-sm-12 col-md-5'i><'col-sm-12 col-md-7'p>>",
        columns: [
            {
                data: 'name',
                title: 'Name',
                render: function (data, type, row) {
                    return `
                        <div class="d-inline-block align-middle">
                            <h6 class="m-b-0">${row.name || 'N/A'}</h6>
                        </div>
                    `;
                }
            },
            {
                data: 'email',
                title: 'Email',
                render: function (data, type, row) {
                    return `
                        <div class="d-inline-block align-middle">
                            <p class="m-b-0">${row.email}</p>
                        </div>
                    `;
                }
            },
            {
                data: 'mobile',
                title: 'Mobile',
                render: function (data, type, row) {
                    return `
                        <div class="d-inline-block align-middle">
                            <p class="m-b-0">${row.mobile || 'N/A'}</p>
                        </div>
                    `;
                }
            },
            {
                data: 'moderatorEvents',
                title: 'Assigned Events',
                render: function (data, type, row) {
                    const eventCount = row.moderatorEvents?.length || 0;
                    return `
                        <span class="badge badge-light-info" style="font-size: 13px; padding: 6px 12px;">
                            <i class="feather icon-calendar" style="margin-right: 4px;"></i>${eventCount}
                        </span>
                    `;
                }
            },
            {
                data: 'createdAt',
                title: 'Created Date',
                render: function (data, type, row) {
                    return formatDateTimeForTable(row.createdAt);
                }
            },
            {
                data: 'isActive',
                title: 'Status',
                render: function (data, type, row) {
                    const badgeClass = row.isActive ? 'badge-success' : 'badge-secondary';
                    const statusText = row.isActive ? 'Active' : 'Inactive';
                    return `<span class="badge ${badgeClass}">${statusText}</span>`;
                }
            },
            {
                data: null,
                title: 'Actions',
                width: '20%',
                orderable: false,
                className: 'text-center',
                render: function (data, type, row) {
                    return `
                        <div class="btn-group" role="group" aria-label="Actions">
                            <button type="button" class="btn btn-icon btn-success view-btn" data-id="${row.id}" title="View Details" 
                                style="margin-right: 8px;border-radius: 50%; display: inline-flex; justify-content: center; align-items: center;">
                                <i class="feather icon-eye"></i>
                            </button>
                            <button type="button" class="btn btn-icon btn-info assign-btn" data-id="${row.id}" title="Assign Events" 
                                style="margin-right: 8px;border-radius: 50%; display: inline-flex; justify-content: center; align-items: center;">
                                <i class="feather icon-calendar"></i>
                            </button>
                            <button type="button" class="btn btn-icon btn-warning edit-btn" data-id="${row.id}" title="Edit Moderator" 
                                style="margin-right: 8px;border-radius: 50%; display: inline-flex; justify-content: center; align-items: center;">
                                <i class="feather icon-edit"></i>
                            </button>
                            <button type="button" class="btn btn-icon btn-danger delete-btn" data-id="${row.id}" title="Delete Moderator" 
                                style="border-radius: 50%; display: inline-flex; justify-content: center; align-items: center;">
                                <i class="feather icon-trash-2"></i>
                            </button>
                        </div>
                    `;
                }
            }
        ],
        initComplete: function (settings, json) {
            // Add "Create New Moderator" button
            $('.add-moderator-button').html(
                '<button type="button" class="btn btn-primary add-new-moderator-btn" style="white-space: nowrap;">' +
                    '<i class="feather icon-plus"></i> Create' +
                    '</button>'
            );

            // Attach event listeners
            $('.add-new-moderator-btn')
                .off('click')
                .on('click', function () {
                    handleAdd();
                });

            // Restore the previous page
            $(tableZero).DataTable().page(currentPage).draw('page');
        },
        drawCallback: function (settings) {
            // Attach event listeners after each draw
            $('.view-btn')
                .off('click')
                .on('click', function () {
                    const id = $(this).data('id');
                    handleView(id);
                });

            $('.assign-btn')
                .off('click')
                .on('click', function () {
                    const id = $(this).data('id');
                    handleAssignEvents(id);
                });

            $('.edit-btn')
                .off('click')
                .on('click', function () {
                    const id = $(this).data('id');
                    handleEdit(id);
                });

            $('.delete-btn')
                .off('click')
                .on('click', function () {
                    const id = $(this).data('id');
                    handleDelete(id);
                });
        }
    });

    $(tableZero).DataTable().page(currentPage).draw(false);
}

const ModeratorList = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const { moderators, loading } = useSelector((state) => state.moderator);

    const [currentTable, setCurrentTable] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [moderatorToDelete, setModeratorToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            await dispatch(getAllModerators());
        };
        fetchData();
        return () => destroyTable();
    }, [dispatch]);

    useEffect(() => {
        initializeTable();
        return () => destroyTable();
    }, [moderators]);

    const destroyTable = () => {
        if (currentTable) {
            $('#moderators-data-table').off('click', '.delete-btn');
            $('#moderators-data-table').off('click', '.edit-btn');
            $('#moderators-data-table').off('click', '.view-btn');
            $('#moderators-data-table').off('click', '.assign-btn');
            currentTable.destroy();
            setCurrentTable(null);
        }
    };

    const initializeTable = () => {
        destroyTable();
        if (Array.isArray(moderators) && moderators.length >= 0) {
            const table = moderatorsTable(
                moderators,
                handleAdd,
                handleEdit,
                handleDelete,
                handleView,
                handleAssignEvents
            );
            setCurrentTable(table);
        }
    };

    const handleAdd = () => {
        navigate('/moderators/add');
    };

    const handleEdit = (id) => {
        navigate(`/moderators/edit/${id}`);
    };

    const handleView = (id) => {
        navigate(`/moderators/view/${id}`);
    };

    const handleAssignEvents = (id) => {
        navigate(`/moderators/assign-events/${id}`);
    };

    const handleDelete = (id) => {
        const moderator = moderators.find((m) => m.id === id);
        setModeratorToDelete(moderator);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (!moderatorToDelete) return;

        setIsDeleting(true);
        try {
            const result = await dispatch(deleteModerator(moderatorToDelete.id));
            if (result.success) {
                await dispatch(getAllModerators());
                setShowDeleteModal(false);
                setModeratorToDelete(null);
            }
        } catch (error) {
            console.error('Delete error:', error);
        } finally {
            setIsDeleting(false);
        }
    };

    const cancelDelete = () => {
        setShowDeleteModal(false);
        setModeratorToDelete(null);
    };

    return (
        <>
            <Row>
                <Col sm={12} className="btn-page">
                    <Card className="event-list">
                        <Card.Body>
                            <Table striped hover responsive id="moderators-data-table">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Email</th>
                                        <th>Mobile</th>
                                        <th>Assigned Events</th>
                                        <th>Created Date</th>
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
                onHide={cancelDelete}
                onConfirm={confirmDelete}
                title="Delete Moderator"
                message={
                    moderatorToDelete
                        ? `Are you sure you want to delete moderator "${moderatorToDelete.name}"? This will also remove all event assignments.`
                        : ''
                }
                isDeleting={isDeleting}
            />
        </>
    );
};

export default ModeratorList;

