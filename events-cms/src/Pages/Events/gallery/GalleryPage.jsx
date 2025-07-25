import * as React from 'react';
import { useEffect, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Table from 'react-bootstrap/Table';
import { useSelector, useDispatch } from 'react-redux';
import * as $ from 'jquery';
import { useNavigate } from 'react-router-dom';
import { 
    getAllGalleries, 
    deleteGallery 
} from '../../../store/actions/galleryActions';
import { eventList } from '../../../store/actions/eventActions';
import '../../../assets/css/event.css';
import DeleteConfirmationModal from '../../../components/modal/DeleteConfirmationModal';
import { EVENT_PATHS } from '../../../utils/constants';

// @ts-ignore
$.DataTable = require('datatables.net-bs');

function atable(data, events, handleAddGallery, handleEdit, handleDelete, handleView) {
    let tableZero = '#data-table-zero';
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
            "<'row mb-3'<'col-sm-12 col-md-6'l><'col-sm-12 col-md-6 d-flex justify-content-end align-items-center'<'search-container'f><'add-gallery-button ml-2'>>>" +
            "<'row'<'col-sm-12'tr>>" +
            "<'row'<'col-sm-12 col-md-5'i><'col-sm-12 col-md-7'p>>",
        columns: [
            {
                data: 'title',
                title: 'Gallery Name',
                render: function (data, type, row) {
                    const imageUrl = row.galleryImages && row.galleryImages.length > 0 
                        ? `${process.env.REACT_APP_API_URL}/${row.galleryImages[0]}`
                        : '/assets/images/gallery-placeholder.png';
                    
                    const eventName = events.find(e => e.id === row.eventId)?.name || 'Unknown Event';
                    
                    return `
                        <div class="d-inline-block align-middle">
                            <img src="${imageUrl}" alt="gallery" class="img-radius align-top m-r-15" style="width:50px; height:50px; object-fit:cover;" />
                            <div class="d-inline-block">
                                <h6 class="m-b-0">${row.title}</h6>
                                <p class="text-muted m-b-0">${eventName}</p>
                            </div>
                        </div>   
                    `;
                }
            },
       
            {
                data: 'galleryImages',
                title: 'Images',
                render: function (data, type, row) {
                    const imageCount = row.galleryImages ? row.galleryImages.length : 0;
                    return `<span class="badge badge-light-info">${imageCount} images</span>`;
                }
            },
            {
                data: 'createdAt',
                title: 'Created Date',
                render: function (data, type, row) {
                    const date = new Date(row.createdAt);
                    const formattedDate = date.toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                    });
                    return `<span class="badge badge-light">${formattedDate}</span>`;
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
            if (!$('#addGalleryBtn').length) {
                $('.add-gallery-button').html(`
                    <button class="btn btn-primary d-flex align-items-center ml-2" id="addGalleryBtn">
                        <i class="feather icon-plus mr-1"></i>
                        Add Gallery
                    </button>
                `);

                $('#addGalleryBtn').on('click', handleAddGallery);
            }
        }
    });

    // Restore the page
    $(tableZero).DataTable().page(currentPage).draw(false);

    // Attach event listeners for actions
    $(document).on('click', '.view-btn', function () {
        const galleryId = $(this).data('id');
        const dataGallery = data.find((gallery) => gallery.id === galleryId);
        if (dataGallery) {
            handleView(dataGallery);
        }
    });

    $(document).on('click', '.edit-btn', function () {
        const galleryId = $(this).data('id');
        const dataGallery = data.find((gallery) => gallery.id === galleryId);
        if (dataGallery) {
            handleEdit(dataGallery);
        }
    });

    $(document).on('click', '.delete-btn', function () {
        const galleryId = $(this).data('id');
        handleDelete(galleryId);
    });
}

const GalleryPage = () => {
    const dispatch = useDispatch();
    const { allGalleries } = useSelector(state => state.gallery);
    const { event } = useSelector(state => state.event);
    const navigate = useNavigate();

    const [currentTable, setCurrentTable] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const galleries = allGalleries?.data || [];
    const events = event?.events || [];

    const destroyTable = () => {
        if (currentTable) {
            $('#data-table-zero').off('click', '.delete-btn');
            currentTable.destroy();
            setCurrentTable(null);
        }
    };

    const initializeTable = () => {
        destroyTable();
        if (Array.isArray(galleries) && galleries.length >= 0) {
            const table = atable(galleries, events, handleAddGallery, handleEdit, handleDelete, handleView);
            setCurrentTable(table);
        }
    };

    useEffect(() => {
        dispatch(getAllGalleries());
        dispatch(eventList());
        return () => destroyTable();
    }, [dispatch]);

    useEffect(() => {
        initializeTable();
        return () => destroyTable();
    }, [galleries, events]);

    const handleAddGallery = () => {
        navigate(EVENT_PATHS.ADD_GALLERY);
    };

    const handleEdit = (data) => {
        navigate(`${EVENT_PATHS.EDIT_GALLERY}/${data.id}`);
    };

    const handleView = (data) => {
        navigate(`${EVENT_PATHS.VIEW_GALLERY}/${data.id}`);
    };

    const handleDelete = (galleryId) => {
        setItemToDelete({ id: galleryId });
        setShowDeleteModal(true);
    };

    const handleConfirmDelete = async () => {
        if (!itemToDelete) return;

        setIsDeleting(true);
        try {
            await dispatch(deleteGallery(itemToDelete.id));
            setShowDeleteModal(false);
            setItemToDelete(null);
            destroyTable();
            await dispatch(getAllGalleries());
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

    return (
        <>
            <DeleteConfirmationModal 
                show={showDeleteModal} 
                onHide={handleClose} 
                onConfirm={handleConfirmDelete} 
                isLoading={isDeleting} 
            />
            <Row>
                <Col sm={12} className="btn-page">
                    <Card className="gallery-list">
                        <Card.Body>
                            <Table striped hover responsive id="data-table-zero">
                                <thead>
                                    <tr>
                                        <th>Gallery Name</th>
                                      
                                        <th>Images</th>
                                        <th>Created Date</th>
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

export default GalleryPage;
                                  