import * as React from 'react';
import { useEffect, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Table from 'react-bootstrap/Table';
import { useSelector, useDispatch } from 'react-redux';
import * as $ from 'jquery';
import { exhibitorList, deleteExhibitor } from '../../store/actions/exhibitorsActions';
import { useNavigate } from 'react-router-dom';
import DeleteConfirmationModal from '../../components/modal/DeleteConfirmationModal';
import { API_URL } from '../../configs/env';
import { formatDateTimeForTable } from '../../components/dateTime/dateTimeUtils';
import { EXHIBITOR_PATHS } from '../../utils/constants';

// @ts-ignore
$.DataTable = require('datatables.net-bs');

function exhibitorTable(data, handleAddExhibitor, handleEdit, handleDelete, handleView) {
    let tableZero = '#exhibitor-data-table';
    $.fn.dataTable.ext.errMode = 'throw';

    // Preserve the current page
    let currentPage = 0;
    if ($.fn.DataTable.isDataTable(tableZero)) {
        currentPage = $(tableZero).DataTable().page();
        $(tableZero).DataTable().clear().destroy();
    }

    $(tableZero).DataTable({
        data: data || [],
        order: [[0, 'asc']],
        searching: true,
        searchDelay: 500,
        pageLength: 10,
        lengthMenu: [
            [5, 10, 25, 50, -1],
            [5, 10, 25, 50, 'All']
        ],
        columns: [
            {
                data: 'name',
                title: 'Exhibitor Details',
                render: function (data, type, row) {
                    const imageUrl = row.eventImages && row.eventImages.length > 0 
                        ? `${API_URL}/${row.eventImages[0]}` 
                        : '/assets/images/user/avatar-1.jpg';
                    
                    const statusBadge = row.isActive 
                        ? '<span class="badge badge-success">Active</span>'
                        : '<span class="badge badge-danger">Inactive</span>';

                    return `
                        <div class="d-inline-block align-middle">
                            <img src="${imageUrl}" alt="exhibitor image" class="img-radius wid-40 align-top m-r-15" 
                                 onerror="this.src='/assets/images/user/avatar-1.jpg';">
                            <div class="d-inline-block">
                                <h6 class="m-b-0">${row.name || 'N/A'}</h6>
                                <p class="m-b-0 text-muted">${row.companyName || 'N/A'}</p>
                                ${statusBadge}
                            </div>
                        </div>
                    `;
                }
            },
            {
                data: 'email',
                title: 'Contact Information',
                render: function (data, type, row) {
                    return `
                        <div class="contact-info">
                            <div><strong>Email:</strong> ${row.email || 'N/A'}</div>
                            <div><strong>Mobile:</strong> ${row.mobile || 'N/A'}</div>
                            <div><strong>Username:</strong> ${row.userName || 'N/A'}</div>
                        </div>
                    `;
                }
            },
            {
                data: 'address',
                title: 'Location',
                render: function (data, type, row) {
                    return `
                        <div class="text-wrap" style="max-width: 200px;">
                            <span class="badge badge-light-primary">
                                <i class="feather icon-map-pin mr-1"></i>
                                ${row.address || 'N/A'}
                            </span>
                        </div>
                    `;
                }
            },
            {
                data: 'promotionalOffers',
                title: 'Offers & Documents',
                render: function (data, type, row) {
                    const offersCount = row.promotionalOffers?.length || 0;
                    const documentsCount = row.documents?.length || 0;
                    const flyersCount = row.flyers?.length || 0;
                    
                    return `
                        <div class="offers-info">
                            <div class="mb-1">
                                <span class="badge badge-info">Offers: ${offersCount}</span>
                            </div>
                            <div class="mb-1">
                                <span class="badge badge-warning">Documents: ${documentsCount}</span>
                            </div>
                            <div>
                                <span class="badge badge-secondary">Flyers: ${flyersCount}</span>
                            </div>
                        </div>
                    `;
                }
            },
            {
                data: null,
                title: 'Created Date',
                render: function (data, type, row) {
                    return formatDateTimeForTable(row.createdAt);
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
            // Add event listeners for action buttons
            $(tableZero + ' tbody').off('click', '.view-btn').on('click', '.view-btn', function () {
                const id = $(this).data('id');
                handleView(id);
            });

            $(tableZero + ' tbody').off('click', '.edit-btn').on('click', '.edit-btn', function () {
                const id = $(this).data('id');
                handleEdit(id);
            });

            $(tableZero + ' tbody').off('click', '.delete-btn').on('click', '.delete-btn', function () {
                const id = $(this).data('id');
                handleDelete(id);
            });
        },
        responsive: true,
        language: {
            search: 'Search Exhibitors:',
            lengthMenu: 'Show _MENU_ exhibitors per page',
            info: 'Showing _START_ to _END_ of _TOTAL_ exhibitors',
            infoEmpty: 'No exhibitors found',
            infoFiltered: '(filtered from _MAX_ total exhibitors)',
            zeroRecords: 'No matching exhibitors found'
        }
    });

    // Restore the current page
    $(tableZero).DataTable().page(currentPage).draw('page');
}

const Exhibitors = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedExhibitorId, setSelectedExhibitorId] = useState(null);

    const { exhibitors, loading } = useSelector((state) => state.exhibitor);

    useEffect(() => {
        dispatch(exhibitorList());
    }, [dispatch]);

    useEffect(() => {
        if (exhibitors && exhibitors.length >= 0) {
            exhibitorTable(
                exhibitors,
                handleAddExhibitor,
                handleEdit,
                handleDelete,
                handleView
            );
        }
    }, [exhibitors]);

    const handleAddExhibitor = () => {
        navigate(EXHIBITOR_PATHS.ADD_EXHIBITOR);
    };

    const handleEdit = (id) => {
        navigate(`${EXHIBITOR_PATHS.EDIT_EXHIBITOR}?id=${id}`);
    };

    const handleView = (id) => {
        navigate(`${EXHIBITOR_PATHS.VIEW_EXHIBITOR}?id=${id}`);
    };

    const handleDelete = (id) => {
        setSelectedExhibitorId(id);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (selectedExhibitorId) {
            const success = await dispatch(deleteExhibitor(selectedExhibitorId));
            if (success) {
                dispatch(exhibitorList()); // Refresh the list
            }
        }
        setIsDeleteModalOpen(false);
        setSelectedExhibitorId(null);
    };

    const cancelDelete = () => {
        setIsDeleteModalOpen(false);
        setSelectedExhibitorId(null);
    };

    return (
        <>
            <Row>
                <Col sm={12}>
                    <Card>
                        <Card.Header>
                            <div className="d-flex justify-content-between align-items-center">
                                <Card.Title as="h5">Exhibitors Management</Card.Title>
                                <button 
                                    className="btn btn-primary"
                                    onClick={handleAddExhibitor}
                                >
                                    <i className="feather icon-plus mr-2"></i>
                                    Add New Exhibitor
                                </button>
                            </div>
                        </Card.Header>
                        <Card.Body>
                            {loading ? (
                                <div className="text-center">
                                    <div className="spinner-border" role="status">
                                        <span className="sr-only">Loading...</span>
                                    </div>
                                </div>
                            ) : (
                                <Table id="exhibitor-data-table" className="table table-striped table-bordered nowrap">
                                    <thead>
                                        <tr>
                                            <th>Exhibitor Details</th>
                                            <th>Contact Information</th>
                                            <th>Location</th>
                                            <th>Offers & Documents</th>
                                            <th>Created Date</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody></tbody>
                                </Table>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            <DeleteConfirmationModal
                isOpen={isDeleteModalOpen}
                onConfirm={confirmDelete}
                onCancel={cancelDelete}
                title="Delete Exhibitor"
                message="Are you sure you want to delete this exhibitor? This action cannot be undone."
            />
        </>
    );
};

export default Exhibitors;