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
import { API_URL, DUMMY_PATH } from '../../configs/env';
import { formatDateTimeForTable } from '../../components/dateTime/dateTimeUtils';
import { EXHIBITOR_PATHS } from '../../utils/constants';
import { getAllPromotionalOffers } from '../../store/actions/promotionalOfferActions';

// @ts-ignore
$.DataTable = require('datatables.net-bs');

function exhibitorTable(data, handleAddExhibitor, handleEdit, handleDelete, handleView, handleOffers) {
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
        pageLength: 5, 
        lengthMenu: [
            [5, 10, 25, 50, -1],
            [5, 10, 25, 50, 'All']
        ],
        pagingType: 'full_numbers', 
        dom:
            "<'row mb-3'<'col-sm-12 col-md-6'l><'col-sm-12 col-md-6 d-flex justify-content-end align-items-center'<'search-container'f><'add-exhibitor-button ml-2'>>>" +
            "<'row'<'col-sm-12'tr>>" +
            "<'row'<'col-sm-12 col-md-5'i><'col-sm-12 col-md-7'p>>",
        columns: [
            {
                data: 'name',
                title: 'Name/Company Name/Status',
                render: function (data, type, row) {
                 
                    const imageUrl = row.eventImages && row.eventImages.length > 0 
                        ? (row.eventImages[0].eventImage 
                            ? `${API_URL}/${row.eventImages[0].eventImage}` 
                            : `${API_URL}/${row.eventImages[0]}`)
                        : DUMMY_PATH;
                    
                 
                    let badgeClass = 'badge-light-success';
                    let statusText = 'Active';
                    
                    if (!row.isActive) {
                        badgeClass = 'badge-light-danger';
                        statusText = 'Inactive';
                    }

                    return `
                        <div class="d-inline-block align-middle">
                            <img src="${imageUrl}" alt="exhibitor" class="img-radius align-top m-r-15" 
                                 style="width:50px; height:50px; object-fit:cover;" 
                                 onerror="this.src='${DUMMY_PATH}';">
                            <div class="d-inline-block">
                                <h6 class="m-b-0">${row.name || 'N/A'}</h6>
                                <p class="m-b-5 text-muted">${row.companyName || 'N/A'}</p>
                                <span class="badge ${badgeClass}">
                                    ${statusText}
                                </span>
                            </div>
                        </div>   
                    `;
                }
            },
            {
                data: 'email',
                title: 'Contact & Company',
                render: function (data, type, row) {
         
                    return `
                        <div class="d-inline-block align-middle">
                            <h6 class="m-b-5">${row.email || 'N/A'}</h6>
                            <p class="m-b-0">
                                <span class="badge badge-success">
                                    <i class="feather icon-phone mr-1"></i>
                                    ${row.mobile || 'N/A'}
                                </span>
                            </p>
                            <p class="m-b-0 text-muted small">@${row.userName || 'N/A'}</p>
                        </div>
                    `;
                }
            },
            {
                data: 'address',
                title: 'Location',
                render: function (data, type, row) {
                
                    return `
                        <div class="d-inline-block align-middle">
                            <p class="m-b-0">
                                <span class="badge badge-light-primary">
                                    <i class="feather icon-map-pin mr-1"></i>
                                    ${row.address || 'Not specified'}
                                </span>
                            </p>
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
                            <button type="button" class="btn btn-info btn-circle btn-md offers-btn" data-id="${row.id}" title="Promotional Offers" 
                                style="margin-right: 10px; width: 40px; height: 40px; border-radius: 50%; display: inline-flex; justify-content: center; align-items: center;">
                                <i class="feather icon-percent"></i>
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
       
            if (!$('#addExhibitorBtn').length) {
                $('.add-exhibitor-button').html(`
                    <button class="btn btn-primary d-flex align-items-center ml-2" id="addExhibitorBtn">
                        <i class="feather icon-plus mr-1"></i>
                        Add
                    </button>
                `);

                $('#addExhibitorBtn').on('click', handleAddExhibitor);
            }

            // Add event listeners for action buttons
            $(tableZero + ' tbody').off('click', '.view-btn').on('click', '.view-btn', function () {
                const id = $(this).data('id');
                handleView(id);
            });

            $(tableZero + ' tbody').off('click', '.offers-btn').on('click', '.offers-btn', function () {
                const id = $(this).data('id');
                handleOffers(id);
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
    const [currentTable, setCurrentTable] = useState(null);

    const { exhibitors, loading } = useSelector((state) => state.exhibitor);

    useEffect(() => {
        dispatch(exhibitorList());
        return () => destroyTable(); 
    }, [dispatch]);

    useEffect(() => {
        initializeTable();
        return () => destroyTable(); 
    }, [exhibitors]);


    const destroyTable = () => {
        if (currentTable) {
            $('#exhibitor-data-table').off('click', '.delete-btn');
            currentTable.destroy();
            setCurrentTable(null);
        }
    };

    const initializeTable = () => {
        destroyTable();
        if (Array.isArray(exhibitors) && exhibitors.length >= 0) {
            const table = exhibitorTable(
                exhibitors,
                handleAddExhibitor,
                handleEdit,
                handleDelete,
                handleView,
                handleOffers
            );
            setCurrentTable(table);
        }
    };

    const handleAddExhibitor = () => {
        navigate(EXHIBITOR_PATHS.ADD_EXHIBITOR);
    };

    const handleEdit = (id) => {
        navigate(`${EXHIBITOR_PATHS.EDIT_EXHIBITOR}/${id}`);
    };

    const handleView = (id) => {

        navigate(`${EXHIBITOR_PATHS.VIEW_EXHIBITOR}/${id}`);
    };

    const handleDelete = (id) => {
        setSelectedExhibitorId(id);
        setIsDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!selectedExhibitorId) return;

        try {
            const success = await dispatch(deleteExhibitor(selectedExhibitorId));
            if (success) {
                setIsDeleteModalOpen(false);
                setSelectedExhibitorId(null);
                destroyTable();
                await dispatch(exhibitorList());
            }
        } catch (error) {
            console.error('Delete failed:', error);
        }
    };

    const handleClose = () => {
        setIsDeleteModalOpen(false);
        setSelectedExhibitorId(null);
    };

    const handleOffers = async (exhibitorId) => {
        try {
            const response = await dispatch(getAllPromotionalOffers());
            const allOffers = response?.data || [];
            const existingOffers = allOffers.filter(offer => offer.exhibitorId === exhibitorId);
            
            if (existingOffers && existingOffers.length > 0) {
                navigate(`${EXHIBITOR_PATHS.PROMOTIONAL_OFFERS}?exhibitorId=${exhibitorId}`);
            } else {
                navigate(`${EXHIBITOR_PATHS.ADD_PROMOTIONAL_OFFER}?exhibitorId=${exhibitorId}`);
            }
        } catch (error) {
            console.error('Error checking promotional offers:', error);
            navigate(`${EXHIBITOR_PATHS.ADD_PROMOTIONAL_OFFER}?exhibitorId=${exhibitorId}`);
        }
    };

    return (
        <>
    
            <DeleteConfirmationModal 
                show={isDeleteModalOpen} 
                onHide={handleClose} 
                onConfirm={handleConfirmDelete} 
                isLoading={false}
                title="Delete Exhibitor"
                message="Are you sure you want to delete this exhibitor? This action cannot be undone."
            />
            
            <Row>
                <Col sm={12} className="btn-page">
                    <Card className="exhibitor-list"> 
                        <Card.Body>
                            <Table striped hover responsive id="exhibitor-data-table">
                                <thead>
                                    <tr>
                                        <th>Name/Company Name/Status</th>
                                        <th>Contact & Company</th>
                                        <th>Location</th>  
                                        <th>Created Date</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody></tbody>
                            </Table>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </>
    );
};

export default Exhibitors;