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
import { getAllGalleries } from '../../../store/actions/galleryActions';
import { eventList } from '../../../store/actions/eventActions';
import '../../../assets/css/event.css';
import { EVENT_PATHS } from '../../../utils/constants';

// @ts-ignore
$.DataTable = require('datatables.net-bs');

function atable(data, events, handleView) {
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
            "<'row mb-3'<'col-sm-12 col-md-6'l><'col-sm-12 col-md-6 d-flex justify-content-end align-items-center'<'search-container'f>>>" +
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
                        <button type="button" class="btn btn-icon btn-success view-btn" data-id="${row.id}" title="View" 
                            style="width: 40px; height: 40px; border-radius: 50%; display: inline-flex; justify-content: center; align-items: center;">
                            <i class="feather icon-eye"></i>
                        </button>
                    `;
                }
            }
        ]
    });

    // Restore the page
    $(tableZero).DataTable().page(currentPage).draw(false);

    // Attach event listeners for actions
    $(document).off('click', '.view-btn').on('click', '.view-btn', function () {
        const galleryId = $(this).data('id');
        const dataGallery = data.find((gallery) => gallery.id === galleryId);
        if (dataGallery) {
            handleView(dataGallery);
        }
    });
}

const GalleryPage = () => {
    const dispatch = useDispatch();
    const { allGalleries } = useSelector(state => state.gallery);
    const { event } = useSelector(state => state.event);
    const navigate = useNavigate();

    const [currentTable, setCurrentTable] = useState(null);

    // Access the data correctly from Redux state
    const galleries = Array.isArray(allGalleries?.data) ? allGalleries.data : [];
    const events = event?.events || [];
    
    console.log('Gallery data from Redux:', allGalleries);
    console.log('Galleries array:', galleries);

    const destroyTable = () => {
        if (currentTable) {
            $('#data-table-zero').off('click', '.view-btn');
            currentTable.destroy();
            setCurrentTable(null);
        }
    };

    const initializeTable = () => {
        destroyTable();
        if (Array.isArray(galleries) && galleries.length >= 0) {
            const table = atable(galleries, events, handleView);
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

    const handleView = (data) => {
        navigate(`${EVENT_PATHS.VIEW_GALLERY}/${data.id}`);
    };

    return (
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
    );
};

export default GalleryPage;
                                  