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
import AddSpeakerModal from './components/AddSpeakerModal';
import ViewSpeakerModal from './components/ViewSpeakerModal';
import { API_URL, DUMMY_PATH } from '../../configs/env';

// @ts-ignore
$.DataTable = require('datatables.net-bs');

function atable(data, handleAddSpeaker, handleEdit, handleDelete, handleView) {
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
            "<'row mb-3'<'col-sm-12 col-md-6'l><'col-sm-12 col-md-6 d-flex justify-content-end align-items-center'<'search-container'f><'add-speaker-button ml-2'>>>" +
            "<'row'<'col-sm-12'tr>>" +
            "<'row'<'col-sm-12 col-md-5'i><'col-sm-12 col-md-7'p>>",
        columns: [
            {
                data: 'name',
                title: 'Speaker Name',
                render: function (data, type, row) {
                    const imageUrl = row.speakerProfile ? `${API_URL}/${row.speakerProfile}` : DUMMY_PATH;
                    return `
                        <div class="d-inline-block align-middle">
                            <img src="${imageUrl}" alt="speaker" class="img-radius align-top m-r-15" style="width:50px; height:50px; object-fit:cover;" />
                            <div class="d-inline-block">
                                <h6 class="m-b-0">${row.name}</h6>
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
                data: 'location',
                title: 'Location',
                render: function (data, type, row) {
                    return `<div class="text-wrap">${row.location || 'N/A'}</div>`;
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

                $('#addSpeakerBtn').on('click', handleAddSpeaker);
            }
        }
    });

    // Restore the page
    $(tableZero).DataTable().page(currentPage).draw(false);

    // Attach event listeners for actions
    $(document).on('click', '.view-btn', function () {
        const speakerId = $(this).data('id');
        const dataSpeaker = data.find((speaker) => speaker.id === speakerId);
        if (dataSpeaker) {
            handleView(dataSpeaker);
        }
    });

    $(document).on('click', '.edit-btn', function () {
        const speakerId = $(this).data('id');
        const dataSpeaker = data.find((speaker) => speaker.id === speakerId);
        if (dataSpeaker) {
            handleEdit(dataSpeaker);
        }
    });

    $(document).on('click', '.delete-btn', function () {
        const speakerId = $(this).data('id');
        handleDelete(speakerId);
    });
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

    const [showViewModal, setShowViewModal] = React.useState(false);
    const [editData, setEditData] = React.useState(null);
    const [viewData, setViewData] = React.useState(null);

    const handleView = (data) => {
        navigate(`/speakers/view-speaker/${data.id}`);
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
        if (Array.isArray(speakers) && speakers.length >= 0) {
            const table = atable(speakers, handleAddSpeaker, handleEdit, handleDelete, handleView);
            setCurrentTable(table);
        }
    };

    useEffect(() => {
        dispatch(speakerList());
        return () => destroyTable();
    }, [dispatch]);

    useEffect(() => {
        initializeTable();
        return () => destroyTable();
    }, [speakers]);

    const handleAddSpeaker = () => {
        navigate(`/speakers/add-speaker`);
    };

    const handleEdit = (data) => {
        navigate(`/speakers/edit-speaker/${data.id}`);  
    };

    const handleDelete = (speakerId) => {
        setItemToDelete({ id: speakerId });
        setShowDeleteModal(true);
    };

    const handleConfirmDelete = async () => {
        if (!itemToDelete) return;

        setIsDeleting(true);
        try {
            await dispatch(deleteSpeaker(itemToDelete.id));
            setShowDeleteModal(false);
            setItemToDelete(null);
            destroyTable();
            await dispatch(speakerList());
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
            <AddSpeakerModal show={showModal} handleClose={handleCloseModal} editData={editData} />
            <ViewSpeakerModal show={showViewModal} handleClose={() => setShowViewModal(false)} speakerData={viewData} />

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
                                        <th>Location</th>
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