import * as React from 'react';
import { useEffect, useState, useRef, useCallback } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Table from 'react-bootstrap/Table';
import { useSelector, useDispatch } from 'react-redux';
import * as $ from 'jquery';
import { useNavigate } from 'react-router-dom';
import '../../../assets/css/event.css';
import { EVENT_PATHS } from '../../../utils/constants';
import usePersistedTablePage from '../../../hooks/usePersistedTablePage';
import useTableNavigation from '../../../hooks/useTableNavigation';
import { initializeServerSideDataTable } from '../../../utils/dataTableServerSide';
import axiosInstance from '../../../configs/axiosInstance';
import { GALLERY_LOADING } from '../../../store/constants/actionTypes';
import { DUMMY_PATH, DUMMY_PATH_GALLERY } from '../../../configs/env';
import ImageViewModal from '../../../components/modal/ImageViewModal';

// @ts-ignore
$.DataTable = require('datatables.net-bs');

const GalleryPage = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const tableRef = useRef(null);
    const [showProfileImageModal, setShowProfileImageModal] = useState(false);
    const [selectedImageUrl, setSelectedImageUrl] = useState('');

    // Use pagination persistence hook
    const { restoreTablePage } = usePersistedTablePage();

    // Use reusable table navigation hook for page preservation
    const { handleView } = useTableNavigation({
        tableRef,
        listPath: EVENT_PATHS.GALLERY,
        viewPath: EVENT_PATHS.VIEW_GALLERY,
    });

    const handleImageClick = useCallback((imageUrl) => {
        if (imageUrl && imageUrl !== DUMMY_PATH) {
            setSelectedImageUrl(imageUrl);
            setShowProfileImageModal(true);
        }
    }, []);

    useEffect(() => {
        const columns = [
            {
                data: 'title',
                title: 'Gallery Name',
                render: function (data, type, row) {
                    const placeholderUrl = DUMMY_PATH_GALLERY;
                    let imageUrl = placeholderUrl;
                    let isDummyImage = true;
                    
                    // Check if gallery has images
                    if (row.galleryImages && row.galleryImages.length > 0) {
                        const firstImage = row.galleryImages[0];
                        // Check if image is not a dummy path - check for dummy URLs
                        if (firstImage && 
                            firstImage.trim() !== '' &&
                            !firstImage.includes('freepik.com') && 
                            !firstImage.includes('dreamstime.com') &&
                            !firstImage.includes('dummy') && 
                            !firstImage.includes('placeholder')) {
                            imageUrl = `${process.env.REACT_APP_API_URL}/${firstImage}`;
                            isDummyImage = false;
                        }
                    }
                    
                    const eventName = row.event?.name || 'Unknown Event';
                    
                    if (type === 'sort' || type === 'type') {
                        return row.title || '';
                    }
                    
                    // If no real image available, show dummy/placeholder image (not clickable)
                    if (isDummyImage) {
                        return `
                            <div class="d-inline-block align-middle">
                                <img src="${placeholderUrl}" alt="gallery" class="img-radius align-top m-r-15" 
                                     style="width:50px; height:50px; object-fit:cover;" />
                                <div class="d-inline-block">
                                    <h6 class="m-b-0">${row.title || 'N/A'}</h6>
                                    <p class="text-muted m-b-0">${eventName}</p>
                                </div>
                            </div>   
                        `;
                    }
                    
                    return `
                        <div class="d-inline-block align-middle">
                            <span class="event-image-clickable" data-image-url="${imageUrl}" title="Click to view image">
                                <img src="${imageUrl}" alt="gallery" class="img-radius align-top m-r-15" 
                                     style="width:50px; height:50px; object-fit:cover; transition: opacity 0.2s; cursor: pointer;" 
                                     onerror="this.onerror=null; this.src='${placeholderUrl}';"
                                     onmouseover="this.style.opacity='0.8'"
                                     onmouseout="this.style.opacity='1'">
                            </span>
                            <div class="d-inline-block">
                                <h6 class="m-b-0">${row.title || 'N/A'}</h6>
                                <p class="text-muted m-b-0">${eventName}</p>
                            </div>
                        </div>   
                    `;
                }
            },
            {
                data: 'galleryImages',
                title: 'Images',
                orderable: false,
                render: function (data, type, row) {
                    const imageCount = row.galleryImages ? row.galleryImages.length : 0;
                    return `<span class="badge badge-light-info">${imageCount} images</span>`;
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
                data: null,
                title: 'Actions',
                orderable: false,
                render: function (data, type, row) {
                    return `
                        <button type="button" class="btn btn-icon btn-success view-btn" data-id="${row.id}" title="View" 
                            style="width: 40px; height: 40px; border-radius: 50%; display: inline-flex; justify-content: center; align-items: center;">
                            <i class="feather icon-eye"></i>
                        </button>
                    `;
                }
            }
        ];

        // Initialize server-side DataTable
        tableRef.current = initializeServerSideDataTable({
            tableSelector: '#data-table-zero',
            ajaxUrl: '/gallery/get-all',
            ajaxMethod: 'GET',
            columns: columns,
            ajaxParams: {},
            axiosInstance: axiosInstance,
            dispatch: dispatch,
            loadingActionType: GALLERY_LOADING,
            dom: "<'row mb-3'<'col-sm-12 col-md-6'l><'col-sm-12 col-md-6 d-flex justify-content-end align-items-center'<'search-container'f>>>" +
                 "<'row'<'col-sm-12'tr>>" +
                 "<'row'<'col-sm-12 col-md-5'i><'col-sm-12 col-md-7'p>>",
            pageLength: 10,
            lengthMenu: [[5, 10, 25, 50, -1], [5, 10, 25, 50, 'All']],
            order: [[2, 'desc']], // Sort by Created Date column (index 2) in descending order
            onDataLoaded: (data, metadata) => {
                // Optional: Handle data if needed
            },
            restoreTablePage: restoreTablePage,
            initCompleteCallback: function (settings, json, api) {
                const $table = $(settings.nTable);
                
                // Add event listener for clickable gallery image
                $table.find('tbody').off('click', '.event-image-clickable').on('click', '.event-image-clickable', function (e) {
                    e.stopPropagation(); // Prevent event bubbling
                    const imageUrl = $(this).data('image-url');
                    if (imageUrl && handleImageClick) {
                        handleImageClick(imageUrl);
                    }
                });

                // Attach event listeners for actions
                $table.off('click', '.view-btn').on('click', '.view-btn', function () {
                    const rowData = api.row($(this).closest('tr')).data();
                    if (rowData && rowData.id) {
                        handleView(rowData);
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
    }, []); // Only run once on mount - handleImageClick is stable from useCallback

    return (
        <>
            {/* Gallery Image Modal */}
            <ImageViewModal
                show={showProfileImageModal}
                onHide={() => setShowProfileImageModal(false)}
                imageSrc={selectedImageUrl}
                imageAlt="Gallery Image"
                downloadFileName={`gallery-image-${Date.now()}.jpg`}
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
                                  