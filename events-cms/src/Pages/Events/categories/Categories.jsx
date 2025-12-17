import * as React from 'react';
import { useEffect, useState, useRef } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Table from 'react-bootstrap/Table';
import { useSelector, useDispatch } from 'react-redux';
import * as $ from 'jquery';
import { deleteCategory } from '../../../store/actions/categoryActions';
import '../../../assets/css/event.css';
import DeleteConfirmationModal from '../../../components/modal/DeleteConfirmationModal';
import { EVENT_PATHS } from '../../../utils/constants';
import usePersistedTablePage from '../../../hooks/usePersistedTablePage';
import useTableNavigation from '../../../hooks/useTableNavigation';
import { initializeServerSideDataTable } from '../../../utils/dataTableServerSide';
import axiosInstance from '../../../configs/axiosInstance';
import { CATEGORY_LOADING } from '../../../store/constants/actionTypes';

// @ts-ignore
$.DataTable = require('datatables.net-bs');

const Categories = () => {
    const dispatch = useDispatch();
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const tableRef = useRef(null);

    // Use pagination persistence hook
    const { restoreTablePage, checkAndAdjustPage } = usePersistedTablePage();

    // Use reusable table navigation hook for page preservation
    const { handleView, handleEdit, handleAdd } = useTableNavigation({
        tableRef,
        listPath: EVENT_PATHS.CATEGORIES,
        viewPath: EVENT_PATHS.VIEW_CATEGORY,
        editPath: EVENT_PATHS.EDIT_CATEGORY,
        addPath: EVENT_PATHS.ADD_CATEGORY
    });

    const handleDelete = React.useCallback((categoryId) => {
        setItemToDelete({ id: categoryId });
        setShowDeleteModal(true);
    }, []);

    const handleConfirmDelete = async () => {
        if (!itemToDelete) return;

        setIsDeleting(true);
        try {
            const result = await dispatch(deleteCategory(itemToDelete.id));
            if (result === true) {
                setShowDeleteModal(false);
                setItemToDelete(null);
                // Reload DataTable after deletion
                if (tableRef.current) {
                    tableRef.current.ajax.reload(null, false);
                }
            } else {
                setShowDeleteModal(false);
            }
        } catch (error) {
            console.error('Delete failed:', error);
            setShowDeleteModal(false);
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

    useEffect(() => {
        const columns = [
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
                    
                    if (type === 'sort' || type === 'type') {
                        return row.name || '';
                    }
                    
                    return `
                        <div class="d-inline-block align-middle">
                            <div class="d-inline-block">
                                <h6 class="m-b-0">${row.name || 'N/A'}</h6>
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
                    if (data) {
                        const date = new Date(data);
                        const formattedDate = date.toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                        });
                        return `<span class="badge badge-light">${formattedDate}</span>`;
                    }
                    return 'N/A';
                }
            },
            {
                data: 'updatedAt',
                title: 'Last Updated',
                render: function (data, type, row) {
                    if (data) {
                        const date = new Date(data);
                        const formattedDate = date.toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                        });
                        return `<span class="badge badge-light">${formattedDate}</span>`;
                    }
                    return 'N/A';
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
        ];

        // Initialize server-side DataTable
        tableRef.current = initializeServerSideDataTable({
            tableSelector: '#data-table-zero',
            ajaxUrl: '/categories/get',
            ajaxMethod: 'GET',
            columns: columns,
            ajaxParams: {},
            axiosInstance: axiosInstance,
            dispatch: dispatch, // Pass dispatch for loading state
            loadingActionType: CATEGORY_LOADING, // Use CATEGORY_LOADING to show GlobalLoader
            dom: "<'row mb-3'<'col-sm-12 col-md-6'l><'col-sm-12 col-md-6 d-flex justify-content-end align-items-center'<'search-container'f><'add-category-button ml-2'>>>" +
                 "<'row'<'col-sm-12'tr>>" +
                 "<'row'<'col-sm-12 col-md-5'i><'col-sm-12 col-md-7'p>>",
            pageLength: 10,
            lengthMenu: [[5, 10, 25, 50, -1], [5, 10, 25, 50, 'All']],
            onDataLoaded: (data, metadata) => {
                // Optional: Handle data if needed
            },
            restoreTablePage: restoreTablePage,
            initCompleteCallback: function (settings, json, api) {
                // Add button initialization
                if (!$('#addCategoryBtn').length) {
                    $('.add-category-button').html(`
                        <button class="btn btn-primary d-flex align-items-center ml-2" id="addCategoryBtn">
                            <i class="feather icon-plus mr-1"></i>
                            Add
                        </button>
                    `);
                    $('#addCategoryBtn').on('click', handleAdd);
                }

                // Attach event listeners for actions
                $(settings.nTable).off('click', '.view-btn').on('click', '.view-btn', function () {
                    const rowData = api.row($(this).closest('tr')).data();
                    if (rowData && rowData.id) {
                        handleView(rowData);
                    }
                });

                $(settings.nTable).off('click', '.edit-btn').on('click', '.edit-btn', function () {
                    const rowData = api.row($(this).closest('tr')).data();
                    if (rowData && rowData.id) {
                        handleEdit(rowData);
                    }
                });

                $(settings.nTable).off('click', '.delete-btn').on('click', '.delete-btn', function () {
                    const rowData = api.row($(this).closest('tr')).data();
                    if (rowData && rowData.id) {
                        handleDelete(rowData.id);
                    }
                });
            }
        });

        return () => {
            if (tableRef.current) {
                tableRef.current.destroy();
                tableRef.current = null;
            }
        };
    }, []); // Only run once on mount

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
