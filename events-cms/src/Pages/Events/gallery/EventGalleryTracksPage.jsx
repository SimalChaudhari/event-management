import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Row, Col, Card, Button, Table } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import * as $ from 'jquery';
import { deleteGallery } from '../../../store/actions/galleryActions';
import { EVENT_PATHS } from '../../../utils/constants';
import { API_URL, DUMMY_PATH_GALLERY } from '../../../configs/env';
import { initializeServerSideDataTable } from '../../../utils/dataTableServerSide';
import axiosInstance from '../../../configs/axiosInstance';
import { GALLERY_LOADING } from '../../../store/constants/actionTypes';
import DeleteConfirmationModal from '../../../components/modal/DeleteConfirmationModal';
import '../../../assets/css/event.css';

// @ts-ignore
$.DataTable = require('datatables.net-bs');

const TABLE_ID = '#gallery-tracks-table';

const EventGalleryTracksPage = () => {
    const { eventId } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const [eventName, setEventName] = useState(null);
    const [deletingTrackId, setDeletingTrackId] = useState(null);
    const [showDeleteTrackModal, setShowDeleteTrackModal] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const tableRef = useRef(null);
    const handlersRef = useRef({});

    const handleBack = () => navigate(EVENT_PATHS.LIST_EVENTS);

    const handleView = useCallback((track) => {
        navigate(`${EVENT_PATHS.VIEW_GALLERY}/${track.id}`);
    }, [navigate]);

    const handleEdit = useCallback((track) => {
        const params = new URLSearchParams({ eventId, galleryId: track.id, trackTitle: track.trackTitle });
        navigate(`${EVENT_PATHS.EDIT_GALLERY}?${params.toString()}`);
    }, [eventId, navigate]);

    const handleDeleteTrack = useCallback((track) => {
        setDeletingTrackId(track.id);
        setShowDeleteTrackModal(true);
    }, []);

    handlersRef.current = { handleView, handleEdit, handleDeleteTrack };

    const handleCloseDeleteModal = () => {
        if (!isDeleting) {
            setShowDeleteTrackModal(false);
            setDeletingTrackId(null);
        }
    };

    const confirmDeleteTrack = async () => {
        if (!deletingTrackId) return;
        setIsDeleting(true);
        try {
            await dispatch(deleteGallery(deletingTrackId));
            setShowDeleteTrackModal(false);
            setDeletingTrackId(null);
            if (tableRef.current && tableRef.current.ajax && typeof tableRef.current.ajax.reload === 'function') {
                tableRef.current.ajax.reload(null, false);
            }
        } finally {
            setIsDeleting(false);
        }
    };

    useEffect(() => {
        if (!eventId) return;
        if ($.fn.DataTable.isDataTable(TABLE_ID)) {
            $(TABLE_ID).DataTable().destroy();
            $(TABLE_ID).empty();
        }

        const columns = [
            {
                data: 'trackTitle',
                title: 'Track',
                orderable: true,
                render: function (data, type, row) {
                    if (type === 'sort' || type === 'type') return data || '';
                    const firstImg = row.galleryImages?.[0];
                    const thumbSrc = firstImg ? `${API_URL}/${firstImg}` : DUMMY_PATH_GALLERY;
                    return `
                        <div class="d-inline-block align-middle">
                            <span class="track-image-clickable" data-id="${row.id}" title="Click to view gallery" style="cursor: pointer; display: inline-block;">
                                <img src="${thumbSrc}" alt="" class="img-radius align-top m-r-15" 
                                     style="width:50px; height:50px; object-fit:cover; transition: opacity 0.2s;" 
                                     onerror="this.src='${DUMMY_PATH_GALLERY}'"
                                     onmouseover="this.style.opacity='0.8'"
                                     onmouseout="this.style.opacity='1'">
                            </span>
                            <div class="d-inline-block">
                                <h6 class="m-b-0">${(data || '—')}</h6>
                            </div>
                        </div>
                    `;
                }
            },
            {
                data: 'galleryImages',
                title: 'Images',
                orderable: true,
                render: function (data) {
                    const count = Array.isArray(data) ? data.length : 0;
                    return `<span class="badge badge-light-info">${count} images</span>`;
                }
            },
            {
                data: 'createdAt',
                title: 'Created Date',
                orderable: true,
                render: function (data) {
                    if (!data) return '—';
                    const d = new Date(data);
                    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
                }
            },
            {
                data: null,
                title: 'Actions',
                orderable: false,
                render: function (data, type, row) {
                    return `
                        <div class="btn-group" role="group" aria-label="Actions">
                            <button type="button" class="btn btn-icon btn-success btn-circle btn-sm view-btn" data-id="${row.id}" title="View" 
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

        const dt = initializeServerSideDataTable({
            tableSelector: TABLE_ID,
            ajaxUrl: `/gallery/event/${eventId}/tracks`,
            ajaxMethod: 'GET',
            columns,
            axiosInstance,
            dispatch,
            loadingActionType: GALLERY_LOADING,
            pageLength: 10,
            lengthMenu: [[5, 10, 25, 50, -1], [5, 10, 25, 50, 'All']],
            order: [[2, 'desc']],
            searchParamName: 'keyword',
            infoEntityName: 'entries',
            dom: "<'row mb-3'<'col-sm-12 col-md-6'l><'col-sm-12 col-md-6 d-flex justify-content-end align-items-center'<'search-container'f><'add-track-button ml-2'>>>" +
                 "<'row'<'col-sm-12'tr>>" +
                 "<'row mt-2'<'col-sm-12 col-md-5'i><'col-sm-12 col-md-7'p>>",
            onDataLoaded: (responseData, metadata, fullResponse) => {
                if (fullResponse?.metadata?.eventName != null) {
                    setEventName(fullResponse.metadata.eventName);
                }
            },
            initCompleteCallback: function (settings, json, api) {
                if (!$('#addGalleryTrackBtn').length) {
                    $('.add-track-button').html(`
                        <button class="btn btn-primary d-flex align-items-center ml-2" id="addGalleryTrackBtn">
                            <i class="feather icon-plus mr-1"></i> Add new track
                        </button>
                    `);
                    $('#addGalleryTrackBtn').on('click', () => navigate(`${EVENT_PATHS.ADD_GALLERY}?eventId=${eventId}`));
                }
                const getRow = (el) => api.row($(el).closest('tr')).data();
                $(TABLE_ID + ' tbody').off('click', '.track-image-clickable').on('click', '.track-image-clickable', function (e) {
                    e.stopPropagation();
                    const track = getRow(this);
                    if (track) handlersRef.current.handleView(track);
                });
                $(TABLE_ID + ' tbody').off('click', '.view-btn').on('click', '.view-btn', function () {
                    const track = getRow(this);
                    if (track) handlersRef.current.handleView(track);
                });
                $(TABLE_ID + ' tbody').off('click', '.edit-btn').on('click', '.edit-btn', function () {
                    const track = getRow(this);
                    if (track) handlersRef.current.handleEdit(track);
                });
                $(TABLE_ID + ' tbody').off('click', '.delete-btn').on('click', '.delete-btn', function () {
                    const track = getRow(this);
                    if (track) handlersRef.current.handleDeleteTrack(track);
                });
            }
        });
        tableRef.current = dt;

        return () => {
            if ($.fn.DataTable.isDataTable(TABLE_ID)) {
                $(TABLE_ID).DataTable().destroy();
                tableRef.current = null;
            }
        };
    }, [eventId, navigate]);

    if (!eventId) {
        return (
            <Card>
                <Card.Body>
                    <p className="text-muted">Invalid event.</p>
                    <Button variant="secondary" onClick={handleBack}>Back to events</Button>
                </Card.Body>
            </Card>
        );
    }

    return (
        <>
            <Row>
                <Col sm={12} className="btn-page">
                    <Card className="gallery-list">
                        <Card.Body>
                            <div className="d-flex flex-wrap justify-content-between align-items-center mb-3">
                                <div>
                                    <Button variant="light" size="sm" onClick={handleBack} className="mb-2">
                                        <i className="feather icon-arrow-left mr-1"></i> Back to events
                                    </Button>
                                    <h5 className="mb-0">
                                        <i className="feather icon-image mr-2" style={{ color: '#4680ff' }}></i>
                                        {eventName != null ? `${eventName} – Gallery` : 'Gallery'}
                                    </h5>
                                    <p className="text-muted mb-0 mt-1 small">Tracks for this event. View, edit, or delete per track. Pagination is loaded from the server.</p>
                                </div>
                            </div>
                            <Table striped hover responsive id="gallery-tracks-table">
                                <thead>
                                    <tr>
                                        <th>Track</th>
                                        <th>Images</th>
                                        <th>Created Date</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody />
                            </Table>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            <DeleteConfirmationModal
                show={showDeleteTrackModal}
                onHide={handleCloseDeleteModal}
                onConfirm={confirmDeleteTrack}
                title="Delete track"
                message="Delete this track and all its images? This action cannot be undone."
                isLoading={isDeleting}
            />
        </>
    );
};

export default EventGalleryTracksPage;
