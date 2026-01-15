import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Row, Col, Card, Table, Button } from 'react-bootstrap';
import { useDispatch } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import * as $ from 'jquery';
import axiosInstance from '../../configs/axiosInstance';
import { API_URL, DUMMY_PATH } from '../../configs/env';
import ImageViewModal from '../../components/modal/ImageViewModal';
import usePersistedTablePage from '../../hooks/usePersistedTablePage';
import { initializeServerSideDataTable } from '../../utils/dataTableServerSide';
import { TRANSACTION_PATHS, EXHIBITOR_PATHS } from '../../utils/constants';

// @ts-ignore
$.DataTable = require('datatables.net-bs');

const ViewEventReportPage = () => {
    const dispatch = useDispatch();
    const { eventId } = useParams();
    const navigate = useNavigate();
    const [eventData, setEventData] = useState(null);
    const [showImageModal, setShowImageModal] = useState(false);
    const [selectedImageUrl, setSelectedImageUrl] = useState('');
    const tableRef = useRef(null);
    const [currentTable, setCurrentTable] = useState(null);

    // Use pagination persistence hook
    const { restoreTablePage } = usePersistedTablePage();

    // Load event data
    useEffect(() => {
        const loadEventData = async () => {
            try {
                const response = await axiosInstance.get(`/events/${eventId}`);
                setEventData(response.data?.data || response.data);
            } catch (error) {
                console.error('Failed to load event data:', error);
            }
        };
        if (eventId) {
            loadEventData();
        }
    }, [eventId]);

    const handleImageClick = useCallback((imageUrl) => {
        if (imageUrl && imageUrl !== DUMMY_PATH) {
            setSelectedImageUrl(imageUrl);
            setShowImageModal(true);
        }
    }, []);

    const handleExhibitorClick = useCallback((exhibitorId) => {
        if (exhibitorId) {
            navigate(`${EXHIBITOR_PATHS.VIEW_EXHIBITOR}/${exhibitorId}`);
        }
    }, [navigate]);

    const destroyTable = useCallback(() => {
        if (tableRef.current) {
            tableRef.current.off('page.dt');
            const tableSelector = '#event-reports-data-table';
            $(tableSelector).off('click', '.exhibitor-logo-clickable');
            $(tableSelector).off('click', '.exhibitor-name-clickable');
            $(tableSelector).off('click', '.view-attendees-btn');
            tableRef.current.destroy();
            tableRef.current = null;
            setCurrentTable(null);
        }
    }, []);

    const initializeTable = useCallback(() => {
        if (!eventId) return;
        
        destroyTable();
        try {
            const columns = [
                {
                    data: 'exhibitor',
                    title: 'Company',
                    orderable: true,
                    render: function (data, type, row) {
                        if (type === 'sort' || type === 'type') {
                            return row.exhibitor?.companyName || '';
                        }
                        
                        const logoUrl = row.exhibitor?.logo 
                            ? `${API_URL}/${row.exhibitor.logo}` 
                            : DUMMY_PATH;
                        
                        return `
                            <div class="d-inline-block align-middle">
                                <span class="exhibitor-logo-clickable" data-image-url="${logoUrl}" title="Click to view logo">
                                    <img src="${logoUrl}" alt="logo" class="img-radius align-top m-r-15" 
                                         style="width:50px; height:50px; object-fit:cover; transition: opacity 0.2s; cursor: pointer;" 
                                         onerror="this.src='${DUMMY_PATH}';"
                                         onmouseover="this.style.opacity='0.8'"
                                         onmouseout="this.style.opacity='1'">
                                </span>
                                <div class="d-inline-block">
                                    <h6 class="m-b-0">
                                        <span class="exhibitor-name-clickable" data-exhibitor-id="${row.exhibitor?.id}" 
                                              style="color: #4680ff; cursor: pointer; text-decoration: none;" 
                                              onmouseover="this.style.textDecoration='underline'" 
                                              onmouseout="this.style.textDecoration='none'">
                                            ${row.exhibitor?.companyName || 'N/A'}
                                        </span>
                                    </h6>
                                    <p class="m-b-0 text-muted">Booth: ${row.exhibitor?.boothNumber || 'N/A'}</p>
                                    ${row.exhibitor?.email ? `<p class="m-b-0 text-muted small">${row.exhibitor.email}</p>` : ''}
                                </div>
                            </div>
                        `;
                    }
                },
                {
                    data: 'report.totalLeadsCount',
                    title: 'Total Leads',
                    orderable: true,
                    render: function (data, type, row) {
                        if (type === 'sort' || type === 'type') {
                            return row.report?.totalLeadsCount || 0;
                        }
                        const count = row.report?.totalLeadsCount || 0;
                        return `<span class="badge badge-primary" style="font-size: 14px; padding: 6px 12px;">${count}</span>`;
                    }
                },
                {
                    data: 'report.leadsCollectedPercentage',
                    title: 'Leads %',
                    orderable: true,
                    render: function (data, type, row) {
                        if (type === 'sort' || type === 'type') {
                            return row.report?.leadsCollectedPercentage || 0;
                        }
                        const percentage = row.report?.leadsCollectedPercentage || 0;
                        const badgeClass = percentage >= 50 ? 'badge-success' : 'badge-warning';
                        return `<span class="badge ${badgeClass}" style="font-size: 14px; padding: 6px 12px;">${percentage}%</span>`;
                    }
                },
                {
                    data: 'report.stampsIssued',
                    title: 'Stamps Issued',
                    orderable: true,
                    render: function (data, type, row) {
                        if (type === 'sort' || type === 'type') {
                            return row.report?.stampsIssued || 0;
                        }
                        const count = row.report?.stampsIssued || 0;
                        return `<span class="badge badge-info" style="font-size: 14px; padding: 6px 12px;">${count}</span>`;
                    }
                },
                {
                    data: 'report.totalViewCount',
                    title: 'Views',
                    orderable: true,
                    render: function (data, type, row) {
                        if (type === 'sort' || type === 'type') {
                            return row.report?.totalViewCount || 0;
                        }
                        const count = row.report?.totalViewCount || 0;
                        return `<span class="badge badge-secondary" style="font-size: 14px; padding: 6px 12px;">${count}</span>`;
                    }
                },
                {
                    data: 'report.ratingScore',
                    title: 'Rating',
                    orderable: true,
                    render: function (data, type, row) {
                        if (type === 'sort' || type === 'type') {
                            return row.report?.ratingScore || 0;
                        }
                        const rating = row.report?.ratingScore || 0;
                        if (rating > 0) {
                            return `<span class="badge badge-success" style="font-size: 14px; padding: 6px 12px;">
                                <i class="fas fa-star mr-1"></i>${rating}
                            </span>`;
                        }
                        return '<span class="text-muted">N/A</span>';
                    }
                },
                {
                    data: 'report.attendees',
                    title: 'Scanned Attendees',
                    orderable: true,
                    render: function (data, type, row) {
                        if (type === 'sort' || type === 'type') {
                            return row.report?.attendees?.length || 0;
                        }
                        const attendees = row.report?.attendees || [];
                        const totalAttendees = row.report?.totalAttendees || 0;
                        const scannedCount = attendees.length;
                        
                        if (attendees.length === 0) {
                            return '<span class="text-muted">No attendees scanned</span>';
                        }
                        
                        return `
                            <div class="d-flex align-items-center">
                                <div class="mr-2">
                                    <span class="badge badge-primary" style="font-size: 12px;">Total: ${totalAttendees}</span>
                                    <span class="badge badge-success ml-1" style="font-size: 12px;">Scanned: ${scannedCount}</span>
                                </div>
                            </div>
                        `;
                    }
                },
                {
                    data: null,
                    title: 'Actions',
                    orderable: false,
                    render: function (data, type, row) {
                        const attendees = row.report?.attendees || [];
                        const scannedCount = attendees.length;
                        
                        if (scannedCount === 0) {
                            return '<span class="text-muted">-</span>';
                        }
                        
                        return `
                            <div class="btn-group" role="group" aria-label="Actions">
                                <button type="button" class="btn btn-icon btn-success view-attendees-btn" 
                                        data-exhibitor-id="${row.exhibitor?.id}" 
                                        title="View Attendees" 
                                        style="width: 40px; height: 40px; border-radius: 50%; display: inline-flex; justify-content: center; align-items: center;">
                                    <i class="feather icon-eye"></i>
                                </button>
                            </div>
                        `;
                    }
                }
            ];

            // Use function for ajaxParams to include eventId
            const ajaxParams = () => {
                return { eventId: eventId };
            };
            
            const table = initializeServerSideDataTable({
                tableSelector: '#event-reports-data-table',
                ajaxUrl: '/exhibitors/report/all-exhibitor-reports',
                ajaxMethod: 'GET',
                columns: columns,
                ajaxParams: ajaxParams,
                axiosInstance: axiosInstance,
                dispatch: dispatch,
                dom: "<'row mb-3'<'col-sm-12 col-md-6'l><'col-sm-12 col-md-6 d-flex justify-content-end align-items-center'<'search-container'f>>>" +
                     "<'row'<'col-sm-12'tr>>" +
                     "<'row'<'col-sm-12 col-md-5'i><'col-sm-12 col-md-7'p>>",
                pageLength: 10,
                lengthMenu: [[5, 10, 25, 50, -1], [5, 10, 25, 50, 'All']],
                order: [[0, 'asc']], // Default sort by Company Name
                restoreTablePage: restoreTablePage,
                initCompleteCallback: function (settings, json, api) {
                    // Add event listener for clickable exhibitor logo
                    $(settings.nTable).off('click', '.exhibitor-logo-clickable').on('click', '.exhibitor-logo-clickable', function (e) {
                        e.stopPropagation();
                        const imageUrl = $(this).data('image-url');
                        if (imageUrl && handleImageClick) {
                            handleImageClick(imageUrl);
                        }
                    });

                    // Add event listener for clickable exhibitor name
                    $(settings.nTable).off('click', '.exhibitor-name-clickable').on('click', '.exhibitor-name-clickable', function (e) {
                        e.stopPropagation();
                        const exhibitorId = $(this).data('exhibitor-id');
                        if (exhibitorId && handleExhibitorClick) {
                            handleExhibitorClick(exhibitorId);
                        }
                    });

                    // Add event listener for view attendees button
                    $(settings.nTable).off('click', '.view-attendees-btn').on('click', '.view-attendees-btn', function (e) {
                        e.stopPropagation();
                        const exhibitorId = $(this).data('exhibitor-id');
                        if (exhibitorId && eventId) {
                            navigate(`${TRANSACTION_PATHS.VIEW_EXHIBITOR_ATTENDEES}/${eventId}/${exhibitorId}`);
                        }
                    });
                }
            });
            
            tableRef.current = table;
            setCurrentTable(table);
        } catch (error) {
            console.error('Error initializing event reports table:', error);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [destroyTable, handleImageClick, handleExhibitorClick, restoreTablePage, dispatch, eventId, navigate]);

    useEffect(() => {
        initializeTable();
        return () => {
            destroyTable();
        };
    }, [initializeTable, destroyTable]);

    return (
        <>
            {/* Header */}
            <Row className="mb-3">
                <Col sm={12}>
                    <Card>
                        <Card.Body>
                            <div className="d-flex flex-column flex-md-row justify-content-between align-items-start" style={{ gap: 'clamp(12px, 3vw, 16px)' }}>
                                <div style={{ width: '100%', flex: '1 1 auto' }}>
                                    {eventData && (
                                        <>
                                            <h4 className="mb-2 mb-md-3" style={{ marginBottom: 'clamp(10px, 2.5vw, 16px)' }}>{eventData.name || 'Event Report'}</h4>
                                            <div className="d-flex flex-column flex-md-row align-items-start align-items-md-center" style={{ gap: 'clamp(8px, 2vw, 12px)', flexWrap: 'wrap' }}>
                                                {eventData.startDate && (
                                                    <span className="badge badge-light-info" style={{ fontSize: '14px', padding: '6px 12px', fontWeight: '500', whiteSpace: 'nowrap' }}>
                                                        <i className="feather icon-calendar mr-1"></i>
                                                        {(() => {
                                                            const startDate = new Date(eventData.startDate);
                                                            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                                                            const startDateStr = `${startDate.getDate()} ${monthNames[startDate.getMonth()]} ${startDate.getFullYear()}`;
                                                            
                                                            if (eventData.endDate) {
                                                                const endDate = new Date(eventData.endDate);
                                                                const endDateStr = `${endDate.getDate()} ${monthNames[endDate.getMonth()]} ${endDate.getFullYear()}`;
                                                                return `${startDateStr} - ${endDateStr}`;
                                                            }
                                                            return startDateStr;
                                                        })()}
                                                    </span>
                                                )}
                                                {eventData.location && (
                                                    <span className="text-muted" style={{ marginLeft: '0', marginTop: '0' }}>
                                                        <i className="fas fa-map-marker-alt mr-1" style={{ color: '#4680ff' }}></i>
                                                        {eventData.location}
                                                    </span>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>
                                <Button
                                    variant="secondary"
                                    onClick={() => navigate(-1)}
                                    className="d-flex align-items-center"
                                    style={{ flexShrink: 0, marginTop: '0', alignSelf: 'flex-start' }}
                                >
                                    <i className="fas fa-arrow-left"></i>
                                    <span className="d-none d-md-inline" style={{ marginLeft: '8px' }}>Back</span>
                                </Button>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Exhibitors Report Table */}
            <Row>
                <Col sm={12} className="btn-page">
                    <Card className="event-list">
                        <Card.Body>
                            <Table striped hover responsive id="event-reports-data-table">
                                <thead>
                                    <tr>
                                        <th>Company</th>
                                        <th>Total Leads</th>
                                        <th>Leads %</th>
                                        <th>Stamps Issued</th>
                                        <th>Views</th>
                                        <th>Rating</th>
                                        <th>Scanned Attendees</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody></tbody>
                            </Table>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Image Modal */}
            <ImageViewModal
                show={showImageModal}
                onHide={() => setShowImageModal(false)}
                imageSrc={selectedImageUrl}
                imageAlt="Exhibitor Logo"
                downloadFileName={`exhibitor-logo-${Date.now()}.jpg`}
            />

        </>
    );
};

export default ViewEventReportPage;
