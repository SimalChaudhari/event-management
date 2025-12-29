import * as React from 'react';
import { useEffect, useState, useRef } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Table from 'react-bootstrap/Table';
import { useSelector, useDispatch } from 'react-redux';
import * as $ from 'jquery';
import { deleteSpeaker } from '../../store/actions/speakerActions';
import { useLocation, useNavigate } from 'react-router-dom';
import '../../assets/css/event.css';
import DeleteConfirmationModal from '../../components/modal/DeleteConfirmationModal';
import { API_URL, DUMMY_PATH_USER } from '../../configs/env';
import { formatPhoneDisplay } from '../../utils/phoneFormatter';
import usePersistedTablePage from '../../hooks/usePersistedTablePage';
import useTableNavigation from '../../hooks/useTableNavigation';
import { SPEAKER_PATHS } from '../../utils/constants';
import { initializeServerSideDataTable } from '../../utils/dataTableServerSide';
import axiosInstance from '../../configs/axiosInstance';    
import { SPEAKER_LOADING } from '../../store/constants/actionTypes';

// @ts-ignore
$.DataTable = require('datatables.net-bs');

const Speakers = () => {
    const dispatch = useDispatch();
    const { speakers, pagination: reduxPagination } = useSelector((state) => state.speaker || {});
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const navigate = useNavigate();
    const tableRef = useRef(null);

    // Use pagination persistence hook
    const { restoreTablePage, checkAndAdjustPage } = usePersistedTablePage();

    // Use reusable table navigation hook for page preservation
    const { handleView, handleEdit, handleAdd } = useTableNavigation({
        tableRef,
        listPath: SPEAKER_PATHS.LIST_SPEAKERS,
        viewPath: SPEAKER_PATHS.VIEW_SPEAKER,
        editPath: SPEAKER_PATHS.EDIT_SPEAKER,
        addPath: SPEAKER_PATHS.ADD_SPEAKER
    });

    const handleDelete = React.useCallback((speakerId) => {
        setItemToDelete({ id: speakerId });
        setShowDeleteModal(true);
    }, []);

    const handleConfirmDelete = async () => {
        if (!itemToDelete) return;

        setIsDeleting(true);
        try {
            const result = await dispatch(deleteSpeaker(itemToDelete.id));
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
                data: 'firstName',
                title: 'Speaker Name',
                render: function (data, type, row) {
                    const imageUrl = row.profilePicture ? `${API_URL}/${row.profilePicture}` : DUMMY_PATH_USER;
                    const fullName = `${row.firstName || ''} ${row.lastName || ''}`.trim();
                    
                    if (type === 'sort' || type === 'type') {
                        return fullName;
                    }
                    
                    return `
                        <div class="d-inline-block align-middle">
                            <img src="${imageUrl}" alt="speaker" class="img-radius align-top m-r-15" 
                                 style="width:50px; height:50px; object-fit:cover;" 
                                 onerror="this.src='${DUMMY_PATH_USER}';">
                            <div class="d-inline-block">
                                <h6 class="m-b-0">${fullName}</h6>
                                <p class="text-muted m-b-0">${row.email || 'No email'}</p>
                            </div>
                        </div>   
                    `;
                }
            },
            {
                data: 'position',
                title: 'Position',
                orderable: true,
                render: function (data, type, row) {
                    const position = row.position || 'N/A';
                    // For sorting, return the actual position value
                    if (type === 'sort' || type === 'type') {
                        return position;
                    }
                    return `<div class="text-wrap">${position}</div>`;
                }
            },
            {
                data: 'companyName',
                title: 'Company',
                orderable: true,
                render: function (data, type, row) {
                    const companyName = row.companyName || 'N/A';
                    // For sorting, return the actual companyName value
                    if (type === 'sort' || type === 'type') {
                        return companyName;
                    }
                    return `<div class="text-wrap">${companyName}</div>`;
                }
            },
            {
                data: 'mobile',
                title: 'Mobile',
                render: function (data, type, row) {
                    const formattedPhone = row.mobile ? formatPhoneDisplay(row.mobile) : 'N/A';
                    return `
                        <div class="d-inline-block align-middle">
                            <p class="m-b-0">
                                <span class="badge badge-success">
                                    <i class="feather icon-phone mr-1"></i>
                                    ${formattedPhone}
                                </span>
                            </p>
                        </div>
                    `;
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
            ajaxUrl: '/users/speakers/get',
            ajaxMethod: 'GET',
            columns: columns,
            order: [[4, 'desc']],
            ajaxParams: {},
            axiosInstance: axiosInstance,
            dispatch: dispatch, // Pass dispatch for loading state
            loadingActionType: SPEAKER_LOADING, // Use SPEAKER_LOADING to show GlobalLoader
            dom: "<'row mb-3'<'col-sm-12 col-md-6'l><'col-sm-12 col-md-6 d-flex justify-content-end align-items-center'<'search-container'f><'add-speaker-button ml-2'>>>" +
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
                if (!$('#addSpeakerBtn').length) {
                    $('.add-speaker-button').html(`
                        <button class="btn btn-primary d-flex align-items-center ml-2" id="addSpeakerBtn">
                            <i class="feather icon-plus mr-1"></i>
                            Add Speaker
                        </button>
                    `);
                    $('#addSpeakerBtn').on('click', handleAdd);
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
                                        <th>Speaker Name</th>
                                        <th>Position</th>
                                        <th>Company</th>
                                        <th>Mobile</th>
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

export default Speakers;
