import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Card, Table, Row, Col, Badge, Button, Spinner, Alert, Form } from 'react-bootstrap';
import { API_URL, DUMMY_PATH } from '../../../configs/env';
import { formatDateTimeForTable } from '../../../components/dateTime/dateTimeUtils';
import { eventList } from '../../../store/actions/eventActions';
import { getQAQuestions, answerQuestion, pinQuestion, unpinQuestion, updateQuestion, deleteQuestion, updateQuestionStatus } from '../../../store/actions/qaActions';
import AnswerQuestionModal from './components/AnswerQuestionModal';
import DeleteQuestionModal from './components/DeleteQuestionModal';
import * as $ from 'jquery';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../../../assets/css/event.css';
import { EVENT_PATHS } from '../../../utils/constants';

// @ts-ignore
$.DataTable = require('datatables.net-bs');

function qaTable(data, eventData, handleBack, handleAnswer, handleView, handleDelete, handleStatusUpdate) {
    let tableZero = '#qa-data-table';
    $.fn.dataTable.ext.errMode = 'throw';

    // Preserve the current page
    let currentPage = $(tableZero).DataTable().page();

    // Clean up existing table and event listeners
    if ($.fn.DataTable.isDataTable(tableZero)) {
        $(tableZero).DataTable().clear().destroy();
    }

    $(tableZero).DataTable({
        data: data || [],
        order: [[5, 'desc']], // Sort by date descending
        searching: true,
        searchDelay: 500,
        pageLength: 10,
        lengthMenu: [
            [5, 10, 25, 50, -1],
            [5, 10, 25, 50, 'All']
        ],
        pagingType: 'full_numbers',
        dom:
            "<'row mb-3'<'col-sm-12 col-md-6'l><'col-sm-12 col-md-6 d-flex justify-content-end align-items-center'<'search-container'f><'back-button ml-2'>>>" +
            "<'row'<'col-sm-12'tr>>" +
            "<'row'<'col-sm-12 col-md-5'i><'col-sm-12 col-md-7'p>>",
        columns: [
            {
                data: 'question',
                title: 'Question / Answer',
                render: function (data, type, row) {
                    // Truncate question text to 2 lines
                    const questionText = row.question;
                    const truncatedQuestion = questionText.length > 100 ? questionText.substring(0, 100) + '...' : questionText;
                    
                    const answerHtml = row.answer ? `
                        <div class="mt-2 p-2" style="background-color: #f8f9fa; border-left: 3px solid #007bff; border-radius: 0 4px 4px 0;">
                            <small class="text-muted">Answer:</small>
                            <p class="mb-0" style="display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; text-overflow: ellipsis; line-height: 1.4; max-height: 2.8em;">
                                ${row.answer.length > 100 ? row.answer.substring(0, 100) + '...' : row.answer}
                            </p>
                        </div>
                    ` : '';
                    
                    return `
                        <div class="d-inline-block align-middle">
                            <div class="d-inline-block">
                                <p class="m-b-0 fw-bold" style="display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; text-overflow: ellipsis; line-height: 1.4; max-height: 2.8em;">${truncatedQuestion}</p>
                                ${answerHtml}
                            </div>
                        </div>   
                    `;
                }
            },
            {
                data: 'askedBy',
                title: 'Asked By',
                render: function (data, type, row) {
                    const anonymousBadge = row.isAnonymous ? '<span class="badge badge-info">Anonymous</span>' : '';
                    const userName = row.isAnonymous ? 'Anonymous' : (row.askedBy?.fullName || 'Unknown');
                    
                    return `
                        <div class="d-inline-block align-middle">
                            <h6 class="m-b-5">${userName}</h6>
                            <p class="m-b-0">${anonymousBadge}</p>
                        </div>
                    `;
                }
            },
            {
                data: 'speaker',
                title: 'Speaker',
                render: function (data, type, row) {
                    const speakerImage = row.speaker?.profilePicture ? 
                        `${API_URL}/${row.speaker.profilePicture}` : 
                        `${DUMMY_PATH}`;
                    
                    return `
                        <div class="d-inline-block align-middle">
                            <img src="${speakerImage}" alt="Speaker" class="img-radius align-top m-r-15" style="width:40px; height:40px; object-fit:cover;" />
                            <div class="d-inline-block">
                                <h6 class="m-b-5">${row.speaker?.name || 'N/A'}</h6>
                                <p class="m-b-0">
                                    <span class="badge badge-primary">${row.speaker?.position || ''}</span>
                                </p>
                            </div>
                        </div>   
                    `;
                }
            },
        
            {
                data: 'totalLikes',
                title: 'Likes',
                render: function (data, type, row) {
                    return `
                        <div class="text-start" style="margin-top: 10px;">
                            <span class="badge badge-light">
                                <i class="feather icon-heart mr-1"></i>
                                ${row.totalLikes || 0}
                            </span>
                        </div>
                    `;
                }
            },
            {
                data: 'status',
                title: 'Status',
                render: function (data, type, row) {
                    const status = row.status || (row.answer ? 'answered' : 'not_answered');
                    let badgeClass = 'badge-secondary';
                    let statusText = status;
                    
                    switch(status) {
                        case 'answered':
                            badgeClass = 'badge-success';
                            statusText = 'Answered';
                            break;
                        case 'not_answered':
                            badgeClass = 'badge-warning';
                            statusText = 'Not Answered';
                            break;
                        case 'answering':
                            badgeClass = 'badge-info';
                            statusText = 'Answering';
                            break;
                        default:
                            badgeClass = 'badge-secondary';
                            statusText = status;
                    }
                    
                    return `
                        <div class="text-start" style="margin-top: 10px; position: relative;">
                            <span class="badge ${badgeClass} status-badge" 
                                  data-id="${row.id}" 
                                  data-current-status="${status}"
                                  style="cursor: pointer; position: relative;" 
                                  title="Click to change status">
                                ${statusText}
                                <i class="feather icon-chevron-down ml-1" style="font-size: 10px;"></i>
                            </span>
                            <div class="status-dropdown-menu" data-question-id="${row.id}" style="display: none;">
                                <div class="dropdown-item ${status === 'not_answered' ? 'active' : ''}" data-status="not_answered">
                                    <span class="badge badge-warning mr-2">Not Answered</span>
                                </div>
                                <div class="dropdown-item ${status === 'answering' ? 'active' : ''}" data-status="answering">
                                    <span class="badge badge-info mr-2">Answering</span>
                                </div>
                                <div class="dropdown-item ${status === 'answered' ? 'active' : ''}" data-status="answered">
                                    <span class="badge badge-success mr-2">Answered</span>
                                </div>
                            </div>
                        </div>
                    `;
                }
            },
            {
                data: 'createdAt',
                title: 'Date',
                render: function (data, type, row) {
                    return formatDateTimeForTable(row.createdAt);
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
                            <button type="button" class="btn btn-info btn-circle btn-sm answer-btn" data-id="${row.id}" title="${row.answer ? 'Edit Answer' : 'Answer'}" 
                                style="margin-right: 10px; width: 40px; height: 40px; border-radius: 50%; display: inline-flex; justify-content: center; align-items: center;">
                                <i class="feather icon-message-square"></i>
                            </button>
                        
                
                            <button type="button" class="btn btn-danger btn-circle btn-sm delete-btn" data-id="${row.id}" title="Delete" 
                                style="margin-right: 10px; width: 40px; height: 40px; border-radius: 50%; display: inline-flex; justify-content: center; align-items: center;">
                                <i class="feather icon-trash-2"></i>
                            </button>
                        </div>
                    `;
                }
            }
        ],
        initComplete: function (settings, json) {
            // Add back button
            if (!$('#backBtn').length) {
                $('.back-button').html(`
                    <button class="btn btn-secondary d-flex align-items-center ml-2" id="backBtn">
                        <i class="feather icon-arrow-left mr-1"></i>
                        Back
                    </button>
                `);

                $('#backBtn').on('click', handleBack);
            }
        }
    });

    // Restore the page
    $(tableZero).DataTable().page(currentPage).draw(false);

    // Attach event listeners for actions
    $(document).on('click', '.view-btn', function () {
        const questionId = $(this).data('id');
        const questionData = data.find((q) => q.id === questionId);
        if (questionData) {
            handleView(questionData);
        }
    });

    $(document).on('click', '.answer-btn', function () {
        const questionId = $(this).data('id');
        const questionData = data.find((q) => q.id === questionId);
        if (questionData) {
            handleAnswer(questionData);
        }
    });

    $(document).on('click', '.delete-btn', function () {
        const questionId = $(this).data('id');
        const questionData = data.find((q) => q.id === questionId);
        if (questionData) {
            handleDelete(questionData);
        }
    });

    // Use unique namespace for events to prevent accumulation
    const eventNamespace = `qaTable_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Handle status badge click to show/hide dropdown
    $(document).off(`click.${eventNamespace}`, '.status-badge').on(`click.${eventNamespace}`, '.status-badge', function (e) {
        e.stopPropagation();
        
        // Close all other dropdowns
        $('.status-dropdown-menu').hide();
        
        // Toggle current dropdown
        const dropdown = $(this).siblings('.status-dropdown-menu');
        dropdown.toggle();
    });

    // Handle dropdown item click
    $(document).off(`click.${eventNamespace}`, '.status-dropdown-menu .dropdown-item').on(`click.${eventNamespace}`, '.status-dropdown-menu .dropdown-item', function (e) {
        e.preventDefault();
        e.stopPropagation();
        
        const $this = $(this);
        const questionId = $this.closest('.status-dropdown-menu').data('question-id');
        const newStatus = $this.data('status');
        const questionData = data.find((q) => q.id === questionId);
        
        // Prevent multiple clicks on the same item
        if ($this.hasClass('updating')) {
            return;
        }
        
        // Determine current status the same way as in the render function
        const currentStatus = questionData.status || (questionData.answer ? 'answered' : 'not_answered');
        
        console.log(`Debug - Question ${questionId}:`, {
            questionData,
            newStatus,
            currentStatus,
            questionDataStatus: questionData.status,
            questionDataAnswer: questionData.answer,
            willUpdate: newStatus !== currentStatus
        });
        
        if (questionData && newStatus && newStatus !== currentStatus) {
            console.log(`Status update initiated for question ${questionId}: ${currentStatus} -> ${newStatus}`);
            
            // Mark as updating to prevent multiple calls
            $this.addClass('updating');
            
            if (handleStatusUpdate) {
                handleStatusUpdate(questionData, newStatus).then(() => {
                    console.log(`Status update completed for question ${questionId}`);
                }).catch((error) => {
                    console.error(`Status update failed for question ${questionId}:`, error);
                }).finally(() => {
                    // Remove updating class after completion
                    $this.removeClass('updating');
                });
            }
        }
        
        // Close the dropdown
        $this.closest('.status-dropdown-menu').hide();
    });

    // Close dropdown when clicking outside (only once per table initialization)
    if (!window.statusDropdownOutsideHandler) {
        window.statusDropdownOutsideHandler = function (e) {
            if (!$(e.target).closest('.status-badge, .status-dropdown-menu').length) {
                $('.status-dropdown-menu').hide();
            }
        };
        $(document).off('click.statusDropdown').on('click.statusDropdown', window.statusDropdownOutsideHandler);
    }
    
    // Store namespace for cleanup
    window.currentQaTableNamespace = eventNamespace;
}

const QAPage = () => {
    const { eventId } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const events = useSelector((state) => state.event?.event?.events);

    const [eventData, setEventData] = useState(null);
    const [qaData, setQaData] = useState(null);
    const [filteredQaData, setFilteredQaData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentTable, setCurrentTable] = useState(null);
    const [statusFilter, setStatusFilter] = useState('all');
    
    // Answer modal state
    const [showAnswerModal, setShowAnswerModal] = useState(false);
    const [selectedQuestion, setSelectedQuestion] = useState(null);
    const [isSubmittingAnswer, setIsSubmittingAnswer] = useState(false);
    

    // Delete modal state
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    // Find the event data and update qaData when events change (including Redux updates)
    useEffect(() => {
        if (events && events.length > 0) {
            const event = events.find(e => e.id === eventId);
            if (event) {
                setEventData(event);
                setQaData(event.qnaData);
                setLoading(false);
            } else {
                setError('Event not found');
                setLoading(false);
            }
        }
    }, [events, eventId]);

    // Filter qaData based on status filter
    useEffect(() => {
        if (qaData && qaData.questions) {
            let filtered = qaData.questions;
            
            if (statusFilter !== 'all') {
                filtered = qaData.questions.filter(question => {
                    const status = question.status || (question.answer ? 'answered' : 'not_answered');
                    return status === statusFilter;
                });
            }
            
            setFilteredQaData({ ...qaData, questions: filtered });
        }
    }, [qaData, statusFilter]);

    // Load events if not already loaded
    useEffect(() => {
        if (!events || events.length === 0) {
            dispatch(eventList());
        }
    }, [dispatch, events]);

    const handleBack = useCallback(() => {
        navigate(EVENT_PATHS.LIST_EVENTS);
    }, [navigate]);

    const handleAnswer = useCallback((question) => {
        console.log('Answer question:', question);
        setSelectedQuestion(question);
        setShowAnswerModal(true);
    }, []);



    const handleView = useCallback((question) => {
        console.log('View question:', question);
        navigate(`${EVENT_PATHS.QA}/${eventId}/view/${question.id}`);
    }, [navigate, eventId]);

    const handleDelete = useCallback((question) => {
        console.log('Delete question:', question);
        setSelectedQuestion(question);
        setShowDeleteModal(true);
    }, []);

    const handleStatusUpdate = useCallback(async (question, newStatus) => {
        // Prevent multiple simultaneous updates for the same question
        const updateKey = `statusUpdate_${question.id}_${newStatus}`;
        if (window.activeStatusUpdates && window.activeStatusUpdates[updateKey]) {
            console.log(`Status update already in progress for question ${question.id}`);
            return;
        }
        
        // Mark update as active
        if (!window.activeStatusUpdates) {
            window.activeStatusUpdates = {};
        }
        window.activeStatusUpdates[updateKey] = true;
        
        try {
            console.log(`Starting status update for question ${question.id}: ${question.status} -> ${newStatus}`);
            await dispatch(updateQuestionStatus(question.id, newStatus));
            console.log(`Status update successful for question ${question.id}`);
            
            // Update local state immediately
            if (qaData && qaData.questions) {
                const updatedQuestions = qaData.questions.map(q => 
                    q.id === question.id 
                        ? { ...q, status: newStatus, updatedAt: new Date().toISOString() }
                        : q
                );
                const updatedQaData = { ...qaData, questions: updatedQuestions };
                setQaData(updatedQaData);
            }
        } catch (error) {
            console.error('Error updating status:', error);
        } finally {
            // Remove from active updates
            if (window.activeStatusUpdates) {
                delete window.activeStatusUpdates[updateKey];
            }
        }
    }, [dispatch, qaData]);

    const destroyTable = useCallback(() => {
        if (currentTable) {
            $('#qa-data-table').off('click', '.view-btn, .answer-btn, .pin-btn, .edit-btn, .delete-btn');
            
            // Clean up namespaced events
            if (window.currentQaTableNamespace) {
                $(document).off(`click.${window.currentQaTableNamespace}`, '.status-badge');
                $(document).off(`click.${window.currentQaTableNamespace}`, '.status-dropdown-menu .dropdown-item');
                delete window.currentQaTableNamespace;
            }
            
            currentTable.destroy();
            setCurrentTable(null);
        }
    }, [currentTable]);

    const initializeTable = useCallback(() => {
        destroyTable();
        if (filteredQaData && filteredQaData.questions && filteredQaData.questions.length >= 0) {
            const table = qaTable(filteredQaData.questions, eventData, handleBack, handleAnswer, handleView, handleDelete, handleStatusUpdate);
            setCurrentTable(table);
        }
    }, [filteredQaData, eventData, destroyTable, handleBack, handleAnswer, handleView, handleDelete, handleStatusUpdate]);

    const handleAnswerSubmit = useCallback(async (result, question) => {
        
        // Directly update the local qaData state to trigger immediate refresh
        if (qaData && qaData.questions) {
            const updatedQuestions = qaData.questions.map(q => 
                q.id === question.id 
                    ? { 
                        ...q, 
                        answer: result.data.answer, 
                        answeredAt: result.data.answeredAt || new Date().toISOString(),
                        answeredBy: result.data.answeredBy,
                        isUpdated: result.data.isUpdated,
                        status: result.data.status || 'answered'
                    }
                    : q
            );
            const updatedQaData = { ...qaData, questions: updatedQuestions };
            setQaData(updatedQaData);
        }
    }, [qaData]);

    const handleDeleteSubmit = useCallback(async (result, question) => {
        
        // Directly update the local qaData state to trigger immediate refresh
        if (qaData && qaData.questions) {
            const updatedQuestions = qaData.questions.filter(q => q.id !== question.id);
            const updatedQaData = { ...qaData, questions: updatedQuestions };
            setQaData(updatedQaData);
        }
    }, [qaData]);

    useEffect(() => {
        if (filteredQaData) {
            initializeTable();
        }
        return destroyTable;
    }, [filteredQaData, initializeTable, destroyTable]);

    // Cleanup global outside click handler on unmount
    useEffect(() => {
        return () => {
            if (window.statusDropdownOutsideHandler) {
                $(document).off('click.statusDropdown', window.statusDropdownOutsideHandler);
                delete window.statusDropdownOutsideHandler;
            }
            // Also clean up any remaining namespaced events
            if (window.currentQaTableNamespace) {
                $(document).off(`click.${window.currentQaTableNamespace}`);
                delete window.currentQaTableNamespace;
            }
        };
    }, []);

    // Add CSS for custom dropdown in DataTable
    useEffect(() => {
        const style = document.createElement('style');
        style.textContent = `
            .status-dropdown-menu {
                position: absolute !important;
                top: 100% !important;
                left: 0 !important;
                z-index: 1050 !important;
                // min-width: 160px;
                background: white;
                border: 1px solid #dee2e6;
                border-radius: 4px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                margin-top: 2px;
            }
            .status-dropdown-menu .dropdown-item {
                padding: 8px 12px;
                display: flex;
                align-items: center;
                cursor: pointer;
                border-bottom: 1px solid #f1f3f4;
                transition: background-color 0.2s;
            }
            .status-dropdown-menu .dropdown-item:last-child {
                border-bottom: none;
            }
            .status-dropdown-menu .dropdown-item:hover {
                background-color: #f8f9fa;
            }
            .status-dropdown-menu .dropdown-item.active {
                background-color: #e3f2fd;
            }
            .status-dropdown-menu .dropdown-item .badge {
                margin-right: 8px;
            }
        `;
        document.head.appendChild(style);
        
        return () => {
            document.head.removeChild(style);
        };
    }, []);


    if (!eventData || !qaData) {
        return (
            <Row>
                <Col sm={12}>
                    <Alert variant="warning">
                        <Alert.Heading>No Q&A Data</Alert.Heading>
                        <p>No Q&A data found for this event.</p>
                        <Button variant="outline-warning" onClick={handleBack}>
                            Back
                        </Button>
                    </Alert>
                </Col>
            </Row>
        );
    }

    return (
        <div className="qa-page">
            {/* Status Filter */}
            <Row className="mb-3">
                <Col sm={12}>

                    {/* Filter Component - Same as Polling */}
                    <Card className="mb-4 shadow-sm border-0" style={{ borderRadius: '8px' }}>
                        <Card.Header className="bg-light border-0" style={{ padding: '16px 20px', borderRadius: '8px 8px 0 0' }}>
                            <div className="d-flex align-items-center justify-content-between">
                                <div className="d-flex align-items-center">
                                    <i className="feather icon-filter mr-2" style={{ color: '#4680ff', fontSize: '18px' }}></i>
                                    <h6 className="mb-0" style={{ fontWeight: '600', color: '#495057' }}>
                                        Filter Options
                                    </h6>
                                </div>
                                {statusFilter !== 'all' && (
                                    <span
                                        className="badge badge-primary"
                                        style={{ backgroundColor: '#4680ff', fontSize: '11px', padding: '4px 8px' }}
                                    >
                                        1 Active
                                    </span>
                                )}
                            </div>
                        </Card.Header>
                        <Card.Body style={{ padding: '20px' }}>
                            <Row className="align-items-end g-3">
                                {/* Status Filter */}
                                <Col xl={4} lg={4} md={6} sm={12} xs={12}>
                                    <Form.Group className="mb-0">
                                        <Form.Label style={{ fontSize: '14px', fontWeight: '600', color: '#495057', marginBottom: '8px' }}>
                                            <i className="feather icon-check-circle mr-1"></i>
                                            Filter by Status
                                        </Form.Label>
                                        <Form.Select
                                            value={statusFilter}
                                            onChange={(e) => setStatusFilter(e.target.value)}
                                            style={{
                                                borderRadius: '6px',
                                                border: '1px solid #ced4da',
                                                padding: '8px 12px',
                                                width: '100%',
                                                maxWidth: '100%',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis'
                                            }}
                                        >
                                            <option value="all">All Questions</option>
                                            <option value="not_answered">Not Answered</option>
                                            <option value="answered">Answered</option>
                                            <option value="answering">Answering</option>
                                        </Form.Select>
                                    </Form.Group>
                                </Col>

                                {/* Clear Button */}
                                <Col xl={4} lg={4} md={6} sm={12} xs={12} className="mt-md-3 mt-sm-3 mt-3">
                                    <div className="d-flex align-items-end justify-content-xl-start justify-content-lg-start justify-content-md-start justify-content-sm-start justify-content-start flex-wrap" style={{ gap: '12px' }}>
                                        {statusFilter !== 'all' && (
                                            <Button
                                                variant="outline-secondary"
                                                onClick={() => setStatusFilter('all')}
                                                style={{ borderRadius: '6px', padding: '8px 14px', fontSize: '13px', fontWeight: '500', minWidth: '75px', whiteSpace: 'nowrap' }}
                                            >
                                                <i className="feather icon-x mr-1"></i>
                                                Clear
                                            </Button>
                                        )}
                                    </div>
                                </Col>
                            </Row>
                        </Card.Body>
                    </Card>

                </Col>
            </Row>

            {/* Q&A Table */}
            <Row>
                <Col sm={12} className="btn-page">
                    <Card className="event-list">
                        <Card.Body>
                            <Table striped hover responsive id="qa-data-table">
                                <thead>
                                    <tr>
                                        <th>Question / Answer</th>
                                        <th>Asked By</th>
                                        <th>Speaker</th>
                                        <th>Likes</th>
                                        <th>Status</th>
                                        <th>Date</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                            </Table>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Answer Question Modal */}
            <AnswerQuestionModal
                show={showAnswerModal}
                onHide={() => setShowAnswerModal(false)}
                question={selectedQuestion}
                onSubmit={handleAnswerSubmit}
            />



            {/* Delete Question Modal */}
            <DeleteQuestionModal
                show={showDeleteModal}
                onHide={() => setShowDeleteModal(false)}
                question={selectedQuestion}
                onSubmit={handleDeleteSubmit}
            />
        </div>
    );
};

export default QAPage;
