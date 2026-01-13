import * as React from 'react';
import { useEffect, useState, useRef, useCallback } from 'react';
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
import { formatPhoneDisplay } from '../../utils/phoneFormatter';
import usePersistedTablePage from '../../hooks/usePersistedTablePage';
import useTableNavigation from '../../hooks/useTableNavigation';
import { initializeServerSideDataTable } from '../../utils/dataTableServerSide';
import axiosInstance from '../../configs/axiosInstance';
import { EXHIBITOR_LOADING } from '../../store/constants/actionTypes';

// @ts-ignore
$.DataTable = require('datatables.net-bs');


const Exhibitors = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const tableRef = useRef(null);

    // Use pagination persistence hook
    const { restoreTablePage, checkAndAdjustPage } = usePersistedTablePage();

    // Use reusable table navigation hook for page preservation
    const { handleView, handleEdit, handleAdd } = useTableNavigation({
        tableRef,
        listPath: EXHIBITOR_PATHS.LIST_EXHIBITORS,
        viewPath: EXHIBITOR_PATHS.VIEW_EXHIBITOR,
        editPath: EXHIBITOR_PATHS.EDIT_EXHIBITOR,
        addPath: EXHIBITOR_PATHS.ADD_EXHIBITOR
    });

    const handleAddExhibitor = () => {
        handleAdd();
    };

    const handleDelete = useCallback((exhibitorId) => {
        setItemToDelete({ id: exhibitorId });
        setShowDeleteModal(true);
    }, []);

    const handleConfirmDelete = async () => {
        if (!itemToDelete) return;

        setIsDeleting(true);
        try {
            const result = await dispatch(deleteExhibitor(itemToDelete.id));
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
                data: 'companyName',
                title: 'Company & Status',
                render: function (data, type, row) {
                    const logoUrl = row.logo 
                        ? `${API_URL}/${row.logo}` 
                        : (row.eventImages && row.eventImages.length > 0 
                            ? (row.eventImages[0].eventImage 
                                ? `${API_URL}/${row.eventImages[0].eventImage}` 
                                : `${API_URL}/${row.eventImages[0]}`)
                            : DUMMY_PATH);
                    
                    let badgeClass = 'badge-light-success';
                    let statusText = 'Active';
                    
                    if (!row.isActive) {
                        badgeClass = 'badge-light-danger';
                        statusText = 'Inactive';
                    }

                    if (type === 'sort' || type === 'type') {
                        return row.companyName || '';
                    }

                    return `
                        <div class="d-inline-block align-middle">
                            <img src="${logoUrl}" alt="company logo" class="img-radius align-top m-r-15" 
                                 style="width:50px; height:50px; object-fit:cover;" 
                                 onerror="this.src='${DUMMY_PATH}';">
                            <div class="d-inline-block">
                                <h6 class="m-b-0">${row.companyName || 'N/A'}</h6>
                                <p class="m-b-5 text-muted">Booth: ${row.boothNumber || 'N/A'}</p>
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
                title: 'Contact Information',
                render: function (data, type, row) {
                    const formattedPhone = row.mobile ? formatPhoneDisplay(row.mobile) : 'N/A';
                    if (type === 'sort' || type === 'type') {
                        return row.email || '';
                    }
                    return `
                        <div class="d-inline-block align-middle">
                            <h6 class="m-b-5">${row.email || 'N/A'}</h6>
                            <p class="m-b-0">
                                <span class="badge badge-success">
                                    <i class="feather icon-phone mr-1"></i>
                                    ${formattedPhone}
                                </span>
                            </p>
                            <p class="m-b-0 text-muted small">UEN: ${row.uen || 'N/A'}</p>
                        </div>
                    `;
                }
            },
            {
                data: 'createdAt',
                title: 'Created Date',
                render: function (data, type, row) {
                    if (data) {
                        return formatDateTimeForTable(data);
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
            tableSelector: '#exhibitor-data-table',
            ajaxUrl: '/exhibitors',
            ajaxMethod: 'GET',
            columns: columns,
            ajaxParams: {},
            axiosInstance: axiosInstance,
            dispatch: dispatch,
            loadingActionType: EXHIBITOR_LOADING,
            dom: "<'row mb-3'<'col-sm-12 col-md-6'l><'col-sm-12 col-md-6 d-flex justify-content-end align-items-center'<'search-container'f><'add-exhibitor-button ml-2'>>>" +
                 "<'row'<'col-sm-12'tr>>" +
                 "<'row'<'col-sm-12 col-md-5'i><'col-sm-12 col-md-7'p>>",
            pageLength: 10,
            lengthMenu: [[5, 10, 25, 50, -1], [5, 10, 25, 50, 'All']],
            order: [[2, 'desc']], // Default sort by Created Date DESC
            onDataLoaded: (data, metadata) => {
                // Optional: Handle data if needed
            },
            restoreTablePage: restoreTablePage,
            initCompleteCallback: function (settings, json, api) {
                // Add button initialization
                if (!$('#addExhibitorBtn').length) {
                    $('.add-exhibitor-button').html(`
                        <button class="btn btn-primary d-flex align-items-center ml-2" id="addExhibitorBtn">
                            <i class="feather icon-plus mr-1"></i>
                            Add Exhibitor
                        </button>
                    `);
                    $('#addExhibitorBtn').on('click', handleAddExhibitor);
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
                                        <th>Company & Status</th>
                                        <th>Contact Information</th>
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