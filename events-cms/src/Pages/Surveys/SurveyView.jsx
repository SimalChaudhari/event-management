import * as React from 'react';
import { useEffect, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Table from 'react-bootstrap/Table';
import { useSelector, useDispatch } from 'react-redux';
import * as $ from 'jquery';
import { surveyDelete, surveyList } from '../../store/actions/surveyActions';
import { setupDateFilter, resetFilters } from '../../utils/dateFilter';
import { useLocation, useNavigate } from 'react-router-dom';
import DeleteConfirmationModal from '../../components/modal/DeleteConfirmationModal';
import { formatDateTimeForTable } from '../../components/dateTime/dateTimeUtils';

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

function atable(data, handleAddSurvey, handleEdit, handleDelete, handleView) {
    let tableZero = '#survey-data-table';
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
            "<'row mb-3'<'col-sm-12 col-md-6'l><'col-sm-12 col-md-6 d-flex justify-content-end align-items-center'<'search-container'f><'add-survey-button ml-2'>>>" +
            "<'row'<'col-sm-12'<'date-filter-wrapper'>>>" +
            "<'row'<'col-sm-12'tr>>" +
            "<'row'<'col-sm-12 col-md-5'i><'col-sm-12 col-md-7'p>>",
        columns: [
            {
                data: 'title',
                title: 'Survey Details',
                render: function (data, type, row) {
                    const { badgeClass, statusText } = formatSurveyStatus(row);
                    const startDate = new Date(row.startDate);
                    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

                    return `
                        <div class="d-inline-block align-middle">
                            <div class="d-inline-block">
                                <h6 class="m-b-0">${row.title}</h6>
                                <span class="badge ${badgeClass} mr-2">
                                    ${startDate.getDate()} ${monthNames[startDate.getMonth()]} ${startDate.getFullYear()}
                                    <span class="ml-1">${statusText}</span>
                                </span>
                                <span class="badge badge-primary">
                                    Sessions: ${row.sessions?.length || 0}
                                </span>
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

                    return `
                        <div class="d-inline-block align-middle">
                            <h6 class="m-b-5">${eventInfo.name || 'N/A'}</h6>
                            <p class="m-b-0">
                                <span class="badge badge-info">
                                    <i class="feather icon-map-pin mr-1"></i>
                                    ${eventInfo.location || 'N/A'}
                                </span>
                            </p>
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
        ],
        initComplete: function (settings, json) {
            const dateFilterHtml = `
                <div class="date-filter-container d-flex align-items-center">
                    <div class="filter-group mr-3">
                        <label class="small mr-2">From:</label>
                        <input 
                            type="date" 
                            id="startDateFilter" 
                            class="form-control form-control-sm"
                        >
                    </div>
                    <div class="filter-group mr-3">
                        <label class="small mr-2">To:</label>
                        <input 
                            type="date" 
                            id="endDateFilter" 
                            class="form-control form-control-sm"
                        >
                    </div>
                    <div id="clearFilterBtn" class="filter-group" style="display: none;">
                        <button class="btn btn-light">
                            <i class="feather icon-x"></i> Clear Filter
                        </button>
                    </div>
                </div>
            `;

            $('.date-filter-wrapper').html(dateFilterHtml);
            setupDateFilter(this.api());

            // Add button initialization
            if (!$('#addSurveyBtn').length) {
                $('.add-survey-button').html(`
                    <button class="btn btn-primary d-flex align-items-center ml-2" id="addSurveyBtn">
                        <i class="feather icon-plus mr-1"></i>
                        Add Survey
                    </button>
                `);

                $('#addSurveyBtn').on('click', handleAddSurvey);
            }
        }
    });

    // Restore the page
    $(tableZero).DataTable().page(currentPage).draw(false);

    // Attach event listeners for actions
    $(document).on('click', '.view-btn', function () {
        const surveyId = $(this).data('id');
        const dataSurvey = data.find((survey) => survey.id === surveyId);
        if (dataSurvey) {
            handleView(dataSurvey);
        }
    });

    $(document).on('click', '.edit-btn', function () {
        const surveyId = $(this).data('id');
        const dataSurvey = data.find((survey) => survey.id === surveyId);
        if (dataSurvey) {
            handleEdit(dataSurvey);
        }
    });

    $(document).on('click', '.delete-btn', function () {
        const surveyId = $(this).data('id');
        handleDelete(surveyId);
    });
}

const SurveyView = () => {
    const dispatch = useDispatch();
    const surveys = useSelector((state) => state.survey?.surveys);
    const [currentTable, setCurrentTable] = useState(null);
    const location = useLocation();
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const navigate = useNavigate();

    const handleView = (data) => {
        navigate(`/surveys/view/${data.id}`);
    };

    const destroyTable = () => {
        if (currentTable) {
            $('#survey-data-table').off('click', '.delete-btn');
            currentTable.destroy();
            setCurrentTable(null);
        }
    };

    const initializeTable = () => {
        destroyTable();
        if (Array.isArray(surveys) && surveys.length >= 0) {
            const table = atable(surveys, handleAddSurvey, handleEdit, handleDelete, handleView);
            setCurrentTable(table);
        }
    };

    useEffect(() => {
        dispatch(surveyList());
        return () => destroyTable();
    }, [dispatch]);

    useEffect(() => {
        initializeTable();
        return () => destroyTable();
    }, [surveys]);

    useEffect(() => {
        return () => {
            if (currentTable) {
                resetFilters(currentTable);
            }
        };
    }, [location.pathname]);

    const handleAddSurvey = () => {
        navigate('/surveys/add');
    };

    const handleEdit = (data) => {
        navigate(`/surveys/edit/${data.id}`);
    };

    const handleDelete = (surveyId) => {
        setItemToDelete({ id: surveyId });
        setShowDeleteModal(true);
    };

    const handleConfirmDelete = async () => {
        if (!itemToDelete) return;

        setIsDeleting(true);
        try {
            await dispatch(surveyDelete(itemToDelete.id));
            setShowDeleteModal(false);
            setItemToDelete(null);
            destroyTable();
            await dispatch(surveyList());
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

    return (
        <>
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
