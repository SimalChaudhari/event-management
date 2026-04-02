import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Row, Col, Card, Table } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import * as $ from 'jquery';
import axiosInstance from '../../configs/axiosInstance';
import { formatDateTimeForTable } from '../../components/dateTime/dateTimeUtils';
import usePersistedTablePage from '../../hooks/usePersistedTablePage';
import { initializeServerSideDataTable } from '../../utils/dataTableServerSide';
import { TRANSACTION_PATHS } from '../../utils/constants';
import FilterComponent from '../../components/common/FilterComponent';
import useFilterLogic from '../../hooks/useFilterLogic';
import { getAllEventsForFilter } from '../../store/actions/eventActions';
import ImageViewModal from '../../components/modal/ImageViewModal';
import { API_URL, DUMMY_PATH } from '../../configs/env';
import { getEventImageUrl } from '../../utils/eventImageUtils';

// @ts-ignore
$.DataTable = require('datatables.net-bs');

const Reports = () => {
    const dispatch = useDispatch();
    const location = useLocation();
    const navigate = useNavigate();
    const tableRef = useRef(null);
    const [currentTable, setCurrentTable] = useState(null);
    const [selectedImage, setSelectedImage] = useState(null);
    const [showImageModal, setShowImageModal] = useState(false);
    
    // Debug: Log state changes
    useEffect(() => {
        console.log('Modal state changed - showImageModal:', showImageModal, 'selectedImage:', selectedImage);
    }, [showImageModal, selectedImage]);
    const handleImageClickRef = useRef(null);

    // Use pagination persistence hook
    const { restoreTablePage } = usePersistedTablePage();

    // Get events from Redux store for filter dropdown
    const allEvents = useSelector((state) => state.event?.eventFilterList || []);

    // Use filter logic hook for event filter
    const {
        selectedEventId,
        events,
        startDate,
        endDate,
        loadingDropdowns,
        activeFilters,
        applyFilters,
        clearFilters,
        handleEventChange,
        setStartDate,
        setEndDate,
        loadDropdownData
    } = useFilterLogic({
        filterAction: null, // No Redux action - DataTable handles API calls
        loadEventsAction: getAllEventsForFilter,
        dispatch,
        initialEvents: allEvents,
        filterMode: 'event' // Use event mode for event name filtering
    });

    // Load events on mount if not already loaded
    useEffect(() => {
        // Always try to load events on mount to ensure dropdown is populated
        if (!loadingDropdowns && (!events || events.length === 0) && (!allEvents || allEvents.length === 0)) {
            loadDropdownData();
        }
    }, []); // Only run once on mount

    const destroyTable = useCallback(() => {
        if (tableRef.current) {
            tableRef.current.off('page.dt');
            const tableSelector = '#reports-events-data-table';
            $(tableSelector).off('click', '.view-btn');
            $(tableSelector).off('click', '.event-image-clickable');
            tableRef.current.destroy();
            tableRef.current = null;
            setCurrentTable(null);
        }
    }, []);

    const handleView = useCallback((eventId) => {
        navigate(`${TRANSACTION_PATHS.REPORTS}/view/${eventId}`);
    }, [navigate]);

    const handleImageClick = useCallback((imageUrl) => {
        if (imageUrl && imageUrl !== DUMMY_PATH) {
            setSelectedImage(imageUrl);
            setShowImageModal(true);
        }
    }, []);

    // Store handleImageClick in ref so it's accessible in jQuery callbacks
    useEffect(() => {
        handleImageClickRef.current = handleImageClick;
    }, [handleImageClick]);

    const initializeTable = useCallback(() => {
        destroyTable();
        try {
            const columns = [
                {
                    data: 'name',
                    title: 'Event Name',
                    orderable: true,
                    render: function (data, type, row) {
                        if (type === 'sort' || type === 'type') {
                            return row.name || '';
                        }
                        const imageUrl = DUMMY_PATH;
                        const eventImageUrl = getEventImageUrl(row.images?.[0], { apiUrl: API_URL, fallback: imageUrl });
                        return `
                            <div class="d-inline-block align-middle">
                                <span class="event-image-clickable" data-image-url="${eventImageUrl}" title="Click to view image">
                                    <img src="${eventImageUrl}" alt="event" class="img-radius align-top m-r-15" 
                                         style="width:50px; height:50px; object-fit:cover; transition: opacity 0.2s; cursor: pointer;" 
                                         onerror="this.src='${imageUrl}';"
                                         onmouseover="this.style.opacity='0.8'"
                                         onmouseout="this.style.opacity='1'">
                                </span>
                                <div class="d-inline-block">
                                    <h6 class="m-b-0">${row.name || 'N/A'}</h6>
                                    ${row.startDate ? `<p class="m-b-0 text-muted small">${formatDateTimeForTable(row.startDate)}</p>` : ''}
                                </div>
                            </div>
                        `;
                    }
                },
                {
                    data: 'totalAttendees',
                    title: 'Total Attendees',
                    orderable: true,
                    render: function (data, type, row) {
                        if (type === 'sort' || type === 'type') {
                            return row.totalAttendees || 0;
                        }
                        return `<span class="badge badge-primary" style="font-size: 14px; padding: 6px 12px;">${row.totalAttendees || 0}</span>`;
                    }
                },
                {
                    data: 'exhibitorCount',
                    title: 'Exhibitors',
                    orderable: true,
                    render: function (data, type, row) {
                        if (type === 'sort' || type === 'type') {
                            return row.exhibitorCount || 0;
                        }
                        return `<span class="badge badge-info" style="font-size: 14px; padding: 6px 12px;">${row.exhibitorCount || 0}</span>`;
                    }
                },
                {
                    data: null,
                    title: 'Actions',
                    orderable: false,
                    render: function (data, type, row) {
                        return `
                            <div class="btn-group" role="group" aria-label="Actions">
                                <button type="button" class="btn btn-icon btn-success view-btn" data-id="${row.id}" title="View Report" 
                                    style="width: 40px; height: 40px; border-radius: 50%; display: inline-flex; justify-content: center; align-items: center;">
                                    <i class="feather icon-eye"></i>
                                </button>
                            </div>
                        `;
                    }
                }
            ];

            // Use function for ajaxParams to read from URL dynamically on each request
            const ajaxParams = () => {
                const urlParams = new URLSearchParams(window.location.search);
                const params = {
                    sortBy: 'startDate', // Default: sort by date
                    sortOrder: 'DESC'   // Default: recent dates first (newest to oldest)
                };
                if (urlParams.get('keyword')) params.keyword = urlParams.get('keyword');
                if (urlParams.get('eventId')) params.eventId = urlParams.get('eventId');
                if (urlParams.get('startDate')) params.startDate = urlParams.get('startDate');
                if (urlParams.get('endDate')) params.endDate = urlParams.get('endDate');
                return params;
            };
            
            const table = initializeServerSideDataTable({
                tableSelector: '#reports-events-data-table',
                ajaxUrl: '/exhibitors/report/events-list',
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
                order: null, // Let backend handle default sorting (startDate DESC - recent dates first)
                restoreTablePage: restoreTablePage,
                initCompleteCallback: function (settings, json, api) {
                    const tableSelector = '#reports-events-data-table';
                    
                    // Add event listener for view button
                    $(tableSelector + ' tbody').off('click', '.view-btn').on('click', '.view-btn', function () {
                        const rowData = api.row($(this).closest('tr')).data();
                        if (rowData && rowData.id) {
                            handleView(rowData.id);
                        } else {
                            const id = $(this).data('id');
                            if (id) {
                                handleView(id);
                            }
                        }
                    });

                    // Add event listener for clickable event image using event delegation on table
                    // This ensures it works even after pagination/sorting
                    $(tableSelector).off('click', '.event-image-clickable').on('click', '.event-image-clickable', function (e) {
                        e.stopPropagation(); // Prevent event bubbling
                        const imageUrl = $(this).data('image-url');
                        console.log('Image clicked:', imageUrl, 'Handler available:', !!handleImageClickRef.current);
                        if (imageUrl && handleImageClickRef.current) {
                            handleImageClickRef.current(imageUrl);
                        }
                    });
                }
            });
            
            tableRef.current = table;
            setCurrentTable(table);
            
            // Also attach event listener after a short delay to ensure ref is set
            // This is a fallback in case initCompleteCallback runs before ref is updated
            setTimeout(() => {
                const tableSelector = '#reports-events-data-table';
                $(tableSelector).off('click', '.event-image-clickable').on('click', '.event-image-clickable', function (e) {
                    e.stopPropagation();
                    const imageUrl = $(this).data('image-url');
                    if (imageUrl && handleImageClickRef.current) {
                        handleImageClickRef.current(imageUrl);
                    }
                });
            }, 500);
        } catch (error) {
            console.error('Error initializing reports table:', error);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [destroyTable, handleView, handleImageClick, restoreTablePage, dispatch]);

    // Track previous URL to detect filter changes vs pagination changes
    const prevUrlRef = useRef(location.search);
    
    // Initialize table on mount
    useEffect(() => {
        if (!tableRef.current) {
            initializeTable();
            prevUrlRef.current = location.search;
        } else {
            // Only reload if URL changed due to filters (not pagination)
            const currentParams = new URLSearchParams(location.search);
            const prevParams = new URLSearchParams(prevUrlRef.current);
            
            // Remove page parameter for comparison
            currentParams.delete('page');
            prevParams.delete('page');
            
            const currentParamsStr = currentParams.toString();
            const prevParamsStr = prevParams.toString();
            
            // Only reload if filters changed (not just pagination)
            if (currentParamsStr !== prevParamsStr) {
                tableRef.current.ajax.reload();
            }
            
            prevUrlRef.current = location.search;
        }
        
        return () => {
            if (!tableRef.current) {
                destroyTable();
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.search]);

    // Transform events to ensure they have 'name' property (backend returns 'eventName')
    const transformedEvents = (events || allEvents).map(event => ({
        ...event,
        name: event.name || event.eventName || ''
    }));

    return (
        <>
            {/* Filter Component */}
            <FilterComponent
                events={transformedEvents}
                loadingDropdowns={loadingDropdowns}
                selectedEventId={selectedEventId}
                startDate={startDate}
                endDate={endDate}
                onEventChange={handleEventChange}
                onStartDateChange={setStartDate}
                onEndDateChange={setEndDate}
                onApplyFilters={applyFilters}
                onClearFilters={clearFilters}
                activeFilters={activeFilters}
                showUserFilter={false}
                showEventFilter={true}
                showDateFilter={true}
            />

            <Row>
                <Col sm={12} className="btn-page">
                    <Card className="event-list">
                        <Card.Body>
                            <Table striped hover responsive id="reports-events-data-table">
                                <thead>
                                    <tr>
                                        <th>Event Name</th>
                                        <th>Total Attendees</th>
                                        <th>Exhibitors</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody></tbody>
                            </Table>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Image View Modal */}
            <ImageViewModal
                show={showImageModal}
                onHide={() => setShowImageModal(false)}
                imageSrc={selectedImage}
                imageAlt="Event Image"
            />
        </>
    );
};

export default Reports;
