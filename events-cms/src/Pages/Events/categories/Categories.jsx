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
import '../../../assets/css/event.css';
import DeleteConfirmationModal from '../../../components/modal/DeleteConfirmationModal';
import { EVENT_PATHS } from '../../../utils/constants';
import usePersistedTablePage from '../../../hooks/usePersistedTablePage';
import useTableNavigation from '../../../hooks/useTableNavigation';

// @ts-ignore
$.DataTable = require('datatables.net-bs');


function atable(data, handleAddCategory, handleEdit, handleDelete, handleView, restoreTablePage) {
    const tableZero = '#data-table-zero';
    $.fn.dataTable.ext.errMode = 'throw';

    if ($.fn.DataTable.isDataTable(tableZero)) {
        $(tableZero).DataTable().clear().destroy();
    }

    const validData = Array.isArray(data) ? data.filter((item) => item && item.id) : [];

    const dataTableInstance = $(tableZero).DataTable({
        data: validData,
        rowId: 'id',
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
            "<'row mb-3'<'col-sm-12 col-md-6'l><'col-sm-12 col-md-6 d-flex justify-content-end align-items-center'<'search-container'f><'add-category-button ml-2'>>>" +
            "<'row'<'col-sm-12'tr>>" +
            "<'row'<'col-sm-12 col-md-5'i><'col-sm-12 col-md-7'p>>",
        columns: [
            {
                data: 'name',
                title: 'Category Name',
                render: function (data, type, row) {
                    // Truncate description if it's too long
                    const maxLength = 100;
                    let description = row.description || 'No description';
                    
                    // Simply truncate without any buttons
                    if (description.length > maxLength) {
                        description = description.substring(0, maxLength) + '...';
                    }
                    
                    return `
                        <div class="d-inline-block align-middle">
                            <div class="d-inline-block">
                                <h6 class="m-b-0">${row.name}</h6>
                                <p class="text-muted m-b-0">${description}</p>
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
        initComplete: function () {
            if (typeof restoreTablePage === 'function') {
                const api = this.api();
                restoreTablePage(api);
            }

            if (!$('#addCategoryBtn').length) {
                $('.add-category-button').html(`
                    <button class="btn btn-primary d-flex align-items-center ml-2" id="addCategoryBtn">
                        <i class="feather icon-plus mr-1"></i>
                        Add
                    </button>
                `);

                $('#addCategoryBtn').on('click', handleAddCategory);
            }
        },
        responsive: true
    });

    const tableSelector = `${tableZero} tbody`;
    $(tableSelector).off('click', '.view-btn').on('click', '.view-btn', function () {
        const table = $(tableZero).DataTable();
        const rowData = table.row($(this).closest('tr')).data();
        if (rowData && rowData.id) {
            handleView(rowData);
        }
    });

    $(tableSelector).off('click', '.edit-btn').on('click', '.edit-btn', function () {
        const table = $(tableZero).DataTable();
        const rowData = table.row($(this).closest('tr')).data();
        if (rowData && rowData.id) {
            handleEdit(rowData);
        }
    });

    $(tableSelector).off('click', '.delete-btn').on('click', '.delete-btn', function () {
        const categoryId = $(this).data('id');
        if (categoryId) {
            handleDelete(categoryId);
        }
    });

    return dataTableInstance;
}

const Categories = () => {
    const dispatch = useDispatch();
    const categories = useSelector((state) => state.category?.categories);
    const [currentTable, setCurrentTable] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const tableRef = React.useRef(null);
    const { restoreTablePage, checkAndAdjustPage } = usePersistedTablePage();

    const { handleView, handleEdit, handleAdd } = useTableNavigation({
        tableRef,
        listPath: EVENT_PATHS.CATEGORIES,
        viewPath: EVENT_PATHS.VIEW_CATEGORY,
        editPath: EVENT_PATHS.EDIT_CATEGORY,
        addPath: EVENT_PATHS.ADD_CATEGORY
    });

    const destroyTable = () => {
        if (currentTable) {
            currentTable.off('page.dt');
            const tableSelector = '#data-table-zero tbody';
            $(tableSelector).off('click', '.view-btn');
            $(tableSelector).off('click', '.edit-btn');
            $(tableSelector).off('click', '.delete-btn');
            currentTable.destroy();
            setCurrentTable(null);
            tableRef.current = null;
        }
    };

    const initializeTable = () => {
        destroyTable();
        if (Array.isArray(categories)) {
            const table = atable(
                categories,
                handleAddCategory,
                handleEditCategory,
                handleDeleteCategory,
                handleViewCategory,
                restoreTablePage
            );
            setCurrentTable(table);
            tableRef.current = table;
            if (table && typeof checkAndAdjustPage === 'function') {
                checkAndAdjustPage(table);
            }
        }
    };

    useEffect(() => {
        // Only fetch if categories are not already loaded in Redux
        // This prevents unnecessary API calls when navigating back after create/update/delete
        // Since create/update/delete already update Redux, we don't need to fetch again
        if (!categories || categories.length === 0) {
            dispatch(categoryList());
        }
        return () => destroyTable();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        initializeTable();
        return () => destroyTable();
    }, [categories]);

    const handleAddCategory = () => {
        handleAdd();
    };

    const handleEditCategory = (data) => {
        handleEdit(data);
    };

    const handleViewCategory = (data) => {
        handleView(data);
    };

    const handleDeleteCategory = (categoryId) => {
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