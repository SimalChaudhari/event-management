import * as React from 'react';
import { useEffect, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Table from 'react-bootstrap/Table';
import { useSelector, useDispatch } from 'react-redux';
import * as $ from 'jquery';
import { speakerList, deleteSpeaker } from '../../store/actions/speakerActions';
import { useLocation, useNavigate } from 'react-router-dom';
import '../../assets/css/event.css';
import DeleteConfirmationModal from '../../components/modal/DeleteConfirmationModal';
import { API_URL, DUMMY_PATH, DUMMY_PATH_USER } from '../../configs/env';
import { formatPhoneDisplay } from '../../utils/phoneFormatter';
import usePersistedTablePage from '../../hooks/usePersistedTablePage';
import useTableNavigation from '../../hooks/useTableNavigation';
import { SPEAKER_PATHS } from '../../utils/constants';

// @ts-ignore
$.DataTable = require('datatables.net-bs');

function atable(data, handleAdd, handleEdit, handleDelete, handleView, restoreTablePage) {
    let tableZero = '#data-table-zero';
    $.fn.dataTable.ext.errMode = 'throw';

    // Destroy existing table if it exists
    if ($.fn.DataTable.isDataTable(tableZero)) {
        $(tableZero).DataTable().clear().destroy();
    }

    const dataTableInstance = $(tableZero).DataTable({
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
            "<'row mb-3'<'col-sm-12 col-md-6'l><'col-sm-12 col-md-6 d-flex justify-content-end align-items-center'<'search-container'f><'add-speaker-button ml-2'>>>" +
            "<'row'<'col-sm-12'tr>>" +
            "<'row'<'col-sm-12 col-md-5'i><'col-sm-12 col-md-7'p>>",
        columns: [
            {
                data: 'firstName',
                title: 'Speaker Name',
                render: function (data, type, row) {
                    const imageUrl = row.profilePicture ? `${API_URL}/${row.profilePicture}` : DUMMY_PATH_USER;
                    const fullName = `${row.firstName || ''} ${row.lastName || ''}`.trim();
                    return `
                        <div class="d-inline-block align-middle">
                            <img src="${imageUrl}" alt="speaker" class="img-radius align-top m-r-15" style="width:50px; height:50px; object-fit:cover;" />
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
                render: function (data, type, row) {
                    return `<div class="text-wrap">${row.position || 'N/A'}</div>`;
                }
            },
            {
                data: 'companyName',
                title: 'Company',
                render: function (data, type, row) {
                    return `<div class="text-wrap">${row.companyName || 'N/A'}</div>`;
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
            if (!$('#addSpeakerBtn').length) {
                $('.add-speaker-button').html(`
                    <button class="btn btn-primary d-flex align-items-center ml-2" id="addSpeakerBtn">
                        <i class="feather icon-plus mr-1"></i>
                        Add Speaker
                    </button>
                `);

                $('#addSpeakerBtn').on('click', handleAdd);
            }

            // Restore the current page using the hook function after table is fully initialized
            // This sets up the page change listener and restores page from URL if needed
            if (typeof restoreTablePage === 'function') {
                const api = this.api();
                // Always call restoreTablePage - it will check if page needs to be changed
                // and will set up the page change listener to sync URL on pagination
                restoreTablePage(api);
            }
        },
        responsive: true
    });

    // Attach event listeners for actions
    $(document).on('click', '.view-btn', function () {
        const speakerId = $(this).data('id');
        // Convert both to strings for consistent comparison (matching reducer logic)
        const dataSpeaker = data.find((speaker) => speaker && String(speaker.id) === String(speakerId));
        if (dataSpeaker) {
            // Get current page from DataTable instance before navigating
            // This ensures we always have the correct page number
            let currentPage = null;
            try {
                const pageInfo = dataTableInstance.page.info();
                if (pageInfo && pageInfo.page !== undefined) {
                    // DataTable uses 0-based indexing, URL uses 1-based
                    currentPage = (pageInfo.page + 1).toString();
                }
            } catch (e) {
                // DataTable page info not available, fallback to URL
                const urlParams = new URLSearchParams(window.location.search);
                currentPage = urlParams.get('page');
            }
            
            // Always pass the page parameter if available
            handleView(dataSpeaker, currentPage);
        }
    });

    $(document).on('click', '.edit-btn', function () {
        const speakerId = $(this).data('id');
        // Convert both to strings for consistent comparison (matching reducer logic)
        const dataSpeaker = data.find((speaker) => speaker && String(speaker.id) === String(speakerId));
        if (dataSpeaker) {
            handleEdit(dataSpeaker);
        }
    });

    $(document).on('click', '.delete-btn', function () {
        const speakerId = $(this).data('id');
        handleDelete(speakerId);
    });

    return dataTableInstance;
}

const Speakers = () => {
    const dispatch = useDispatch();
    const speakers = useSelector((state) => state.speaker?.speakers);
    const [showModal, setShowModal] = React.useState(false);

    const [currentTable, setCurrentTable] = useState(null);
    const location = useLocation();
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const navigate = useNavigate();
    const tableRef = React.useRef(null);

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

    const destroyTable = React.useCallback(() => {
        if (tableRef.current) {
            tableRef.current.off('page.dt');
            $('#data-table-zero').off('click', '.delete-btn');
            tableRef.current.destroy();
            tableRef.current = null;
            setCurrentTable(null);
        }
    }, []);

    const handleDelete = React.useCallback((speakerId) => {
        setItemToDelete({ id: speakerId });
        setShowDeleteModal(true);
    }, []);

    const initializeTable = React.useCallback(() => {
        destroyTable();
        if (Array.isArray(speakers) && speakers.length >= 0) {
            // Only initialize table when speakers change, not when page changes
            // This prevents flickering when user clicks next/previous page
            // Note: restoreTablePage is NOT in dependencies to prevent reinitialization when URL changes
            // It's captured via closure and will always have the latest version
            const table = atable(speakers, handleAdd, handleEdit, handleDelete, handleView, restoreTablePage);
            tableRef.current = table;
            setCurrentTable(table);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [speakers, destroyTable, handleAdd, handleEdit, handleDelete, handleView]);

    useEffect(() => {
        // Only fetch if speakers are not already loaded in Redux
        // This prevents unnecessary API calls when navigating back after create/update/delete
        // Since create/update/delete already update Redux, we don't need to fetch again
        if (!speakers || speakers.length === 0) {
            dispatch(speakerList());
        }
        return () => destroyTable();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Initialize table when speakers change
    // Note: We don't include location.search in dependencies to avoid reinitializing on every page change
    // The restoreTablePage function in initComplete handles page restoration from URL
    useEffect(() => {
        if (speakers) {
            initializeTable();
        }
        return () => {
            destroyTable();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [speakers]);

    const handleConfirmDelete = async () => {
        if (!itemToDelete) return;

        setIsDeleting(true);
        try {
            const result = await dispatch(deleteSpeaker(itemToDelete.id));
            // deleteSpeaker already updates Redux directly, no need to call speakerList()
            if (result === true) {
                setShowDeleteModal(false);
                setItemToDelete(null);
                // Table will be automatically reinitialized when speakers data updates via useEffect
            } else {
                setShowDeleteModal(false);
                // Delete failed - keep table intact
                // Error message is already shown via toast in the action
            }
        } catch (error) {
            console.error('Delete failed:', error);
            setShowDeleteModal(false);
            // Don't destroy table on error
            // The error message should be shown to the user
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
                                        <th>Speaker Name</th>
                                        <th>Position</th>
                                        <th>Company</th>
                                        <th>Mobile</th>
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

export default Speakers;