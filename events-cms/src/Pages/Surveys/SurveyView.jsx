import { useEffect, useState, useCallback, useRef } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Table from 'react-bootstrap/Table';
import { useSelector, useDispatch } from 'react-redux';
import * as $ from 'jquery';
import { surveyDelete } from '../../store/actions/surveyActions';
import { useLocation, useNavigate } from 'react-router-dom';
import DeleteConfirmationModal from '../../components/modal/DeleteConfirmationModal';
import '../../assets/css/event.css';
import FilterComponent from '../../components/common/FilterComponent';
import useFilterLogic from '../../hooks/useFilterLogic';
import usePersistedTablePage from '../../hooks/usePersistedTablePage';
import { initializeServerSideDataTable } from '../../utils/dataTableServerSide';
import axiosInstance from '../../configs/axiosInstance';
import { SURVEY_LOADING } from '../../store/constants/actionTypes';

// @ts-ignore
$.DataTable = require('datatables.net-bs');

const formatTime = (time) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
};

const formatSurveyStatus = (survey) => {
    const startDate = new Date(survey.startDate);
    const endDate = new Date(survey.endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let badgeClass = 'badge-light-info';
    let statusText = '';

    if (endDate < today) {
        badgeClass = 'badge-light-secondary';
        statusText = 'Completed';
    } else if (startDate <= today && endDate >= today) {
        badgeClass = 'badge-light-success';
        statusText = 'Active';
    } else {
        badgeClass = 'badge-light-warning';
        statusText = 'Upcoming';
    }

    return { badgeClass, statusText };
};

function surveyTable(handleAdd, handleEdit, handleDelete, handleView, restoreTablePage, ajaxParams = {}, dispatch = null) {
    let tableZero = '#survey-data-table';
    $.fn.dataTable.ext.errMode = 'throw';

    // Define columns
    const columns = [
        {
            data: 'title',
            title: 'Survey Details',
            render: function (data, type, row) {
                const { badgeClass, statusText } = formatSurveyStatus(row);
                const startDate = new Date(row.startDate);
                const endDate = new Date(row.endDate);
                const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

                return `
                    <div class="d-inline-block align-middle">
                        <div class="d-inline-block">
                            <h6 class="m-b-0">${row.title}</h6>
                            <div class="m-b-2">
                                <span class="badge ${badgeClass} mr-2">
                                    <i class="fas fa-calendar-alt mr-1"></i>
                                    ${startDate.getDate()} ${monthNames[startDate.getMonth()]} ${startDate.getFullYear()}
                                    <span class="ml-1">${statusText}</span>
                                </span>
                                <span class="badge badge-primary">
                                    <i class="fas fa-list mr-1"></i>
                                    Sessions: ${row.sessions?.length || 0}
                                </span>
                            </div>
                            <div class="text-muted small">
                                <div class="mb-1">
                                    <i class="fas fa-play-circle text-danger mr-1"></i>
                                    <strong>Start:</strong> ${startDate.getDate()} ${monthNames[startDate.getMonth()]} ${startDate.getFullYear()} at ${formatTime(row.startTime)}
                                </div>
                                <div>
                                    <i class="fas fa-stop-circle text-success mr-1"></i>
                                    <strong>End:</strong> ${endDate.getDate()} ${monthNames[endDate.getMonth()]} ${endDate.getFullYear()} at ${formatTime(row.endTime)}
                                </div>
                            </div>
                        </div>
                    </div>   
                `;
            }
        },
        {
            data: 'eventInfo',
            title: 'Event Details',
            render: function (data, type, row) {
                const eventInfo = row.eventInfo;
                if (!eventInfo) return '<span class="text-muted">No event linked</span>';

                const eventStartDate = eventInfo.startDate ? new Date(eventInfo.startDate) : null;
                const eventEndDate = eventInfo.endDate ? new Date(eventInfo.endDate) : null;
                const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

                return `
                    <div class="d-inline-block align-middle">
                        <h6 class="m-b-5">${eventInfo.name || 'N/A'}</h6>
                        <p class="m-b-2">
                            <span class="badge badge-info">
                                <i class="feather icon-map-pin mr-1"></i>
                                ${eventInfo.location || 'N/A'}
                            </span>
                        </p>
                        ${eventStartDate ? `
                            <div class="text-muted small">
                                <div class="mb-1">
                                    <i class="fas fa-calendar-alt text-primary mr-1"></i>
                                    <strong>Event Date:</strong> ${eventStartDate.getDate()} ${monthNames[eventStartDate.getMonth()]} ${eventStartDate.getFullYear()}
                                    ${eventInfo.startTime ? ` at ${formatTime(eventInfo.startTime)}` : ''}
                                </div>
                                ${eventEndDate && eventEndDate.getTime() !== eventStartDate.getTime() ? `
                                    <div>
                                        <i class="fas fa-calendar-check text-success mr-1"></i>
                                        <strong>Ends:</strong> ${eventEndDate.getDate()} ${monthNames[eventEndDate.getMonth()]} ${eventEndDate.getFullYear()}
                                        ${eventInfo.endTime ? ` at ${formatTime(eventInfo.endTime)}` : ''}
                                    </div>
                                ` : ''}
                            </div>
                        ` : ''}
                    </div>
                `;
            }
        },
        {
            data: 'isActive',
            title: 'Status',
            render: function (data, type, row) {
                const activeClass = row.isActive ? 'badge-success' : 'badge-danger';
                const activeText = row.isActive ? 'Active' : 'Inactive';
                return `<span class="badge ${activeClass}">${activeText}</span>`;
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
    const dataTableInstance = initializeServerSideDataTable({
        tableSelector: tableZero,
        ajaxUrl: '/events/surveys/current',
        ajaxMethod: 'GET',
        columns: columns,
        ajaxParams: ajaxParams,
        axiosInstance: axiosInstance,
        dispatch: dispatch,
        loadingActionType: SURVEY_LOADING,
        onDataLoaded: (data, metadata, fullResponse) => {
            // Handle data if needed
        },
        restoreTablePage: restoreTablePage,
        pageLength: 10,
        lengthMenu: [[5, 10, 25, 50, -1], [5, 10, 25, 50, 'All']],
        order: [[0, 'desc']], // Sort by first column (title) in descending order
        initCompleteCallback: function (settings, json, api) {
            // Add button initialization
            if (!$('#addSurveyBtn').length) {
                $('.add-survey-button').html(`
                    <button class="btn btn-primary d-flex align-items-center" id="addSurveyBtn">
                        <i class="feather icon-plus mr-1"></i>
                        Add
                    </button>
                `);

                $('#addSurveyBtn').on('click', handleAdd);
            }

            // Add event listeners for action buttons
            $(tableZero + ' tbody').off('click', '.view-btn').on('click', '.view-btn', function () {
                const table = $(tableZero).DataTable();
                const rowData = table.row($(this).closest('tr')).data();
                if (rowData && rowData.id) {
                    handleView(rowData);
                } else {
                    const id = $(this).data('id');
                    if (id) {
                        handleView({ id });
                    }
                }
            });

            $(tableZero + ' tbody').off('click', '.edit-btn').on('click', '.edit-btn', function () {
                const table = $(tableZero).DataTable();
                const rowData = table.row($(this).closest('tr')).data();
                if (rowData && rowData.id) {
                    handleEdit(rowData);
                } else {
                    const id = $(this).data('id');
                    if (id) {
                        handleEdit({ id });
                    }
                }
            });

            $(tableZero + ' tbody').off('click', '.delete-btn').on('click', '.delete-btn', function () {
                const id = $(this).data('id');
                if (id) {
                    handleDelete(id);
                }
            });
        },
        dom: "<'row mb-3'<'col-sm-12 col-md-6'l><'col-sm-12 col-md-6 d-flex justify-content-end align-items-center'<'search-container'f><'add-survey-button ml-2'>>>" +
             "<'row'<'col-sm-12'tr>>" +
             "<'row'<'col-sm-12 col-md-5'i><'col-sm-12 col-md-7'p>>"
    });

    return dataTableInstance;
}

const SurveyView = () => {
    const dispatch = useDispatch();
    const [currentTable, setCurrentTable] = useState(null);
    const location = useLocation();
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const navigate = useNavigate();
    const tableRef = useRef(null);

    // Use filter logic hook for date filtering
    const { 
        startDate, 
        endDate, 
        activeFilters, 
        applyFilters, 
        clearFilters, 
        setStartDate, 
        setEndDate 
    } = useFilterLogic({
        filterAction: null, // Don't call API - DataTable handles it
        dispatch,
        initialEvents: [],
        initialFilters: {},
        filterMode: 'event'
    });

    // Use pagination persistence hook
    const { initialPage, restoreTablePage, checkAndAdjustPage } = usePersistedTablePage();

    const destroyTable = useCallback(() => {
        if (tableRef.current) {
            tableRef.current.off('page.dt');
            $('#survey-data-table').off('click', '.delete-btn');
            tableRef.current.destroy();
            tableRef.current = null;
            setCurrentTable(null);
        }
    }, []);

    const handleView = useCallback((data) => {
        navigate(`/surveys/view/${data.id}`);
    }, [navigate]);

    const handleAddSurvey = useCallback(() => {
        navigate('/surveys/add');
    }, [navigate]);

    const handleEdit = useCallback((data) => {
        navigate(`/surveys/edit/${data.id}`);
    }, [navigate]);

    const handleDelete = useCallback((surveyId) => {
        setItemToDelete({ id: surveyId });
        setShowDeleteModal(true);
    }, []);

    const initializeTable = useCallback(() => {
        destroyTable();
        try {
            // Use function for ajaxParams to read from URL dynamically on each request
            const ajaxParams = () => {
                const urlParams = new URLSearchParams(window.location.search);
                const params = {};
                if (urlParams.get('search')) params.search = urlParams.get('search');
                if (urlParams.get('startDate')) params.startDate = urlParams.get('startDate');
                if (urlParams.get('endDate')) params.endDate = urlParams.get('endDate');
                return params;
            };
            
            const table = surveyTable(handleAddSurvey, handleEdit, handleDelete, handleView, restoreTablePage, ajaxParams, dispatch);
            tableRef.current = table;
            setCurrentTable(table);
        } catch (error) {
            // Error initializing survey table
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [destroyTable, handleAddSurvey, handleEdit, handleDelete, handleView]);

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
                // Filters changed - reload table
                tableRef.current.ajax.reload();
            }
            
            prevUrlRef.current = location.search;
        }
        
        return () => {
            // Only destroy on unmount
            if (!tableRef.current) {
                destroyTable();
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.search]);

    const handleConfirmDelete = useCallback(async () => {
        if (!itemToDelete) return;

        setIsDeleting(true);
        try {
            await dispatch(surveyDelete(itemToDelete.id));
            setShowDeleteModal(false);
            setItemToDelete(null);
            // Reload table after deletion
            if (tableRef.current) {
                tableRef.current.ajax.reload();
            }
        } catch (error) {
            // Delete failed
        } finally {
            setIsDeleting(false);
        }
    }, [itemToDelete, dispatch]);

    const handleClose = useCallback(() => {
        if (!isDeleting) {
            setShowDeleteModal(false);
            setItemToDelete(null);
        }
    }, [isDeleting]);

    return (
        <>
            {/* Filter Component */}
            <FilterComponent
                events={[]}
                loadingDropdowns={false}
                selectedEventId={null}
                startDate={startDate}
                endDate={endDate}
                onEventChange={() => {}}
                onStartDateChange={setStartDate}
                onEndDateChange={setEndDate}
                onApplyFilters={applyFilters}
                onClearFilters={clearFilters}
                activeFilters={activeFilters}
                showUserFilter={false}
                showEventFilter={false}
                showDateFilter={true}
            />

            <DeleteConfirmationModal show={showDeleteModal} onHide={handleClose} onConfirm={handleConfirmDelete} isLoading={isDeleting} />
            <Row>
                <Col sm={12} className="btn-page">
                    <Card>
                        <Card.Body>
                            <Table striped hover responsive id="survey-data-table">
                                <thead>
                                    <tr>
                                        <th>Survey Details</th>
                                        <th>Event Details</th>                                     
                                        <th>Status</th>
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

export default SurveyView;
