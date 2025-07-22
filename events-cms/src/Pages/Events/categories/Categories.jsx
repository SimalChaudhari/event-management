import * as React from 'react';
import { useEffect, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Table from 'react-bootstrap/Table';
import { useSelector, useDispatch } from 'react-redux';
import * as $ from 'jquery';
import { categoryList, deleteCategory } from '../../../store/actions/categoryActions';
import { useLocation, useNavigate } from 'react-router-dom';
import '../../../assets/css/event.css';
import DeleteConfirmationModal from '../../../components/modal/DeleteConfirmationModal';
import { EVENT_PATHS } from '../../../utils/constants';

// @ts-ignore
$.DataTable = require('datatables.net-bs');

function atable(data, handleAddCategory, handleEdit, handleDelete, handleView) {
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
        pageLength: 10,
        lengthMenu: [
            [5, 10, 25, 50, -1],
            [5, 10, 25, 50, 'All']
        ],
        pagingType: 'full_numbers',
        dom:
            "<'row mb-3'<'col-sm-12 col-md-6'l><'col-sm-12 col-md-6 d-flex justify-content-end align-items-center'<'search-container'f><'add-category-button ml-2'>>>" +
            "<'row'<'col-sm-12'tr>>" +
            "<'row'<'col-sm-12 col-md-5'i><'col-sm-12 col-md-7'p>>",
        columns: [
            {
                data: 'name',
                title: 'Category Name',
                render: function (data, type, row) {
                    return `
                        <div class="d-inline-block align-middle">
                            <div class="d-inline-block">
                                <h6 class="m-b-0">${row.name}</h6>
                                <p class="text-muted m-b-0">${row.description || 'No description'}</p>
                            </div>
                        </div>   
                    `;
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
                data: 'updatedAt',
                title: 'Last Updated',
                render: function (data, type, row) {
                    const date = new Date(row.updatedAt);
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
            if (!$('#addCategoryBtn').length) {
                $('.add-category-button').html(`
                    <button class="btn btn-primary d-flex align-items-center ml-2" id="addCategoryBtn">
                        <i class="feather icon-plus mr-1"></i>
                        Add Category
                    </button>
                `);

                $('#addCategoryBtn').on('click', handleAddCategory);
            }
        }
    });

    // Restore the page
    $(tableZero).DataTable().page(currentPage).draw(false);

    // Attach event listeners for actions
    $(document).on('click', '.view-btn', function () {
        const categoryId = $(this).data('id');
        const dataCategory = data.find((category) => category.id === categoryId);
        if (dataCategory) {
            handleView(dataCategory);
        }
    });

    $(document).on('click', '.edit-btn', function () {
        const categoryId = $(this).data('id');
        const dataCategory = data.find((category) => category.id === categoryId);
        if (dataCategory) {
            handleEdit(dataCategory);
        }
    });

    $(document).on('click', '.delete-btn', function () {
        const categoryId = $(this).data('id');
        handleDelete(categoryId);
    });
}

const Categories = () => {
    const dispatch = useDispatch();
    const categories = useSelector((state) => state.category?.categories);
    const [showModal, setShowModal] = React.useState(false);
    const [currentTable, setCurrentTable] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const [showViewModal, setShowViewModal] = React.useState(false);
    const [editData, setEditData] = React.useState(null);
    const [viewData, setViewData] = React.useState(null);
    const navigate = useNavigate();

    const handleView = (data) => {
        navigate(EVENT_PATHS.VIEW_CATEGORY + `/${data.id}`);
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
        if (Array.isArray(categories) && categories.length >= 0) {
            const table = atable(categories, handleAddCategory, handleEdit, handleDelete, handleView);
            setCurrentTable(table);
        }
    };

    useEffect(() => {
        dispatch(categoryList());
        return () => destroyTable();
    }, [dispatch]);

    useEffect(() => {
        initializeTable();
        return () => destroyTable();
    }, [categories]);

    const handleAddCategory = () => {
        navigate(EVENT_PATHS.ADD_CATEGORY);
    };

    const handleEdit = (data) => {
        navigate(EVENT_PATHS.EDIT_CATEGORY + `/${data.id}`);
    };

    const handleDelete = (categoryId) => {
        setItemToDelete({ id: categoryId });
        setShowDeleteModal(true);
    };

    const handleConfirmDelete = async () => {
        if (!itemToDelete) return;

        setIsDeleting(true);
        try {
            await dispatch(deleteCategory(itemToDelete.id));
            setShowDeleteModal(false);
            setItemToDelete(null);
            destroyTable();
            await dispatch(categoryList());
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
          
            <DeleteConfirmationModal show={showDeleteModal} onHide={handleClose} onConfirm={handleConfirmDelete} isLoading={isDeleting} />
            <Row>
                <Col sm={12} className="btn-page">
                    <Card className="event-list">
                        <Card.Body>
                            <Table striped hover responsive id="data-table-zero">
                                <thead>
                                    <tr>
                                        <th>Category Name</th>
                                        <th>Created Date</th>
                                        <th>Last Updated</th>
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

export default Categories;