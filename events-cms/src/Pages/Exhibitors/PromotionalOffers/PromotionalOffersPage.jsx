import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Row, Col, Card, Table, Button } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import * as $ from 'jquery';
import { 
    getPromotionalOffersByExhibitor, 
    deletePromotionalOffer 
} from '../../../store/actions/promotionalOfferActions';
import { exhibitorById } from '../../../store/actions/exhibitorsActions';
import DeleteConfirmationModal from '../../../components/modal/DeleteConfirmationModal';
import { API_URL, DUMMY_PATH } from '../../../configs/env';
import { formatDateTimeForTable } from '../../../components/dateTime/dateTimeUtils';
import { EXHIBITOR_PATHS } from '../../../utils/constants';

// @ts-ignore
$.DataTable = require('datatables.net-bs');

// DataTable function (GalleryPage जैसा pattern)
function promotionalOffersTable(data, exhibitor, handleAdd, handleEdit, handleDelete, handleView) {
    let tableZero = '#promotional-offers-table';
    $.fn.dataTable.ext.errMode = 'throw';

    // Preserve the current page
    let currentPage = 0;
    if ($.fn.DataTable.isDataTable(tableZero)) {
        currentPage = $(tableZero).DataTable().page();
        $(tableZero).DataTable().clear().destroy();
    }

    $(tableZero).DataTable({
        data: data || [],
        order: [[0, 'desc']],
        searching: true,
        searchDelay: 500,
        pageLength: 10,
        lengthMenu: [
            [5, 10, 25, 50, -1],
            [5, 10, 25, 50, 'All']
        ],
        pagingType: 'full_numbers',
        dom:
            "<'row mb-3'<'col-sm-12 col-md-6'l><'col-sm-12 col-md-6 d-flex justify-content-end align-items-center'<'search-container'f><'add-offer-button ml-2'>>>" +
            "<'row'<'col-sm-12'tr>>" +
            "<'row'<'col-sm-12 col-md-5'i><'col-sm-12 col-md-7'p>>",
        columns: [
            {
                data: 'title',
                title: 'Offer Details',
                render: function (data, type, row) {
                    const imageUrl = row.image 
                        ? `${API_URL}/${row.image}` 
                        : DUMMY_PATH;
                    
                    let badgeClass = 'badge-light-success';
                    let statusText = 'Active';
                    
                    if (!row.isActive) {
                        badgeClass = 'badge-light-danger';
                        statusText = 'Inactive';
                    }

                    return `
                        <div class="d-inline-block align-middle">
                            <img src="${imageUrl}" alt="offer" class="img-radius align-top m-r-15" 
                                 style="width:50px; height:50px; object-fit:cover;" 
                                 onerror="this.src='${DUMMY_PATH}';">
                            <div class="d-inline-block">
                                <h6 class="m-b-0">${row.title || 'N/A'}</h6>
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
                data: 'description',
                title: 'Description',
                render: function (data, type, row) {
                    const description = row.description || 'No description';
                    const truncated = description.length > 100 ? 
                        description.substring(0, 100) + '...' : description;
                    
                    return `<span class="text-wrap">${truncated}</span>`;
                }
            },
            {
                data: 'validDate',
                title: 'Valid Date',
                render: function (data, type, row) {
                    return `<span class="badge badge-light-info">${row.validDate || 'N/A'}</span>`;
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
            // Add button initialization
            if (!$('#addOfferBtn').length) {
                $('.add-offer-button').html(`
                    <button class="btn btn-primary d-flex align-items-center ml-2" id="addOfferBtn">
                        <i class="feather icon-plus mr-1"></i>
                        Add Offer
                    </button>
                `);

                $('#addOfferBtn').on('click', handleAdd);
            }
        }
    });

    // Restore the page
    $(tableZero).DataTable().page(currentPage).draw(false);

    // Attach event listeners for actions
    $(document).on('click', '.view-btn', function () {
        const offerId = $(this).data('id');
        const dataOffer = data.find((offer) => offer.id === offerId);
        if (dataOffer) {
            handleView(dataOffer);
        }
    });

    $(document).on('click', '.edit-btn', function () {
        const offerId = $(this).data('id');
        const dataOffer = data.find((offer) => offer.id === offerId);
        if (dataOffer) {
            handleEdit(dataOffer);
        }
    });

    $(document).on('click', '.delete-btn', function () {
        const offerId = $(this).data('id');
        handleDelete(offerId);
    });
}

const PromotionalOffersPage = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const exhibitorId = searchParams.get('exhibitorId');
    
    const { promotionalOffers } = useSelector((state) => state.exhibitor);
    
    const [exhibitor, setExhibitor] = useState(null);
    const [currentTable, setCurrentTable] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const offers = promotionalOffers || [];

    const destroyTable = () => {
        if (currentTable) {
            $('#promotional-offers-table').off('click', '.delete-btn');
            currentTable.destroy();
            setCurrentTable(null);
        }
    };

    const initializeTable = () => {
        destroyTable();
        if (Array.isArray(offers) && offers.length >= 0) {
            const table = promotionalOffersTable(
                offers, 
                exhibitor, 
                handleAddOffer, 
                handleEdit, 
                handleDelete, 
                handleView
            );
            setCurrentTable(table);
        }
    };

    useEffect(() => {
        if (exhibitorId) {
            // Fetch exhibitor details
            dispatch(exhibitorById(exhibitorId)).then((data) => {
                if (data) {
                    setExhibitor(data.data);
                }
            });
            // Fetch promotional offers
            dispatch(getPromotionalOffersByExhibitor(exhibitorId));
        }
        return () => destroyTable();
    }, [exhibitorId, dispatch]);

    useEffect(() => {
        initializeTable();
        return () => destroyTable();
    }, [offers, exhibitor]);

    const handleAddOffer = () => {
        navigate(`${EXHIBITOR_PATHS.ADD_PROMOTIONAL_OFFER}?exhibitorId=${exhibitorId}`);
    };

    const handleEdit = (data) => {
        navigate(`${EXHIBITOR_PATHS.EDIT_PROMOTIONAL_OFFER}/${data.id}`);
    };

    const handleView = (data) => {
        navigate(`${EXHIBITOR_PATHS.VIEW_PROMOTIONAL_OFFER}/${data.id}`);
    };

    const handleDelete = (offerId) => {
        setItemToDelete({ id: offerId });
        setShowDeleteModal(true);
    };

    const handleConfirmDelete = async () => {
        if (!itemToDelete) return;

        setIsDeleting(true);
        try {
            await dispatch(deletePromotionalOffer(itemToDelete.id));
            setShowDeleteModal(false);
            setItemToDelete(null);
            destroyTable();
            await dispatch(getPromotionalOffersByExhibitor(exhibitorId));
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

    const handleBackToExhibitors = () => {
        navigate(EXHIBITOR_PATHS.LIST_EXHIBITORS);
    };

    if (!exhibitorId) {
        return (
            <div className="text-center">
                <Card>
                    <Card.Body>
                        <h5>No exhibitor selected</h5>
                        <Button variant="primary" onClick={handleBackToExhibitors}>
                            Back to Exhibitors
                        </Button>
                    </Card.Body>
                </Card>
            </div>
        );
    }

    return (
        <>
            <DeleteConfirmationModal 
                show={showDeleteModal} 
                onHide={handleClose} 
                onConfirm={handleConfirmDelete} 
                isLoading={isDeleting}
                title="Delete Promotional Offer"
                message="Are you sure you want to delete this promotional offer? This action cannot be undone."
            />
            
            <Row>
                <Col sm={12}>
                    <Card>
                        <Card.Header>
                            <div className="d-flex justify-content-between align-items-center">
                                <div>
                                    <h5 className="mb-0">
                                        <i className="feather icon-gift mr-2"></i>
                                        Promotional Offers - {exhibitor?.name}
                                    </h5>
                                    {exhibitor && (
                                        <small className="text-muted">
                                            Company: {exhibitor.companyName} | Email: {exhibitor.email}
                                        </small>
                                    )}
                                </div>
                                <Button variant="secondary" onClick={handleBackToExhibitors}>
                                    <i className="feather icon-arrow-left mr-1"></i>
                                    Back to Exhibitors
                                </Button>
                            </div>
                        </Card.Header>
                        <Card.Body>
                            <Table striped hover responsive id="promotional-offers-table">
                                <thead>
                                    <tr>
                                        <th>Offer Details</th>
                                        <th>Description</th>
                                        <th>Valid Date</th>
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

export default PromotionalOffersPage; 