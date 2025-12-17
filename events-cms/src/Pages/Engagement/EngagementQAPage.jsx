import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Card, Table, Row, Col, Badge, Button, Alert, Form, Modal } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { formatDateTimeForTable } from '../../components/dateTime/dateTimeUtils';
import { getEngagementQAQuestions, answerEngagementQuestion, deleteEngagementQuestion } from '../../store/actions/engagementQnaActions';
import { getEngagementById } from '../../store/actions/engagementActions';
import AnswerEngagementQuestionModal from './components/AnswerEngagementQuestionModal';
import DeleteEngagementQuestionModal from './components/DeleteEngagementQuestionModal';
import axiosInstance from '../../configs/axiosInstance';
import * as $ from 'jquery';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../../assets/css/event.css';
import { initializeServerSideDataTable } from '../../utils/dataTableServerSide';
import usePersistedTablePage from '../../hooks/usePersistedTablePage';
import { ENGAGEMENT_QNA_LOADING } from '../../store/constants/actionTypes';

// @ts-ignore
$.DataTable = require('datatables.net-bs');

const EngagementQAPage = () => {
    const { engagementId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const { selectedEngagement } = useSelector((state) => state.engagement);
    const { loading, pagination } = useSelector((state) => state.engagementQna);

    const [statusFilter, setStatusFilter] = useState('all');
    const [sessionFilterId, setSessionFilterId] = useState(null);
    const [statusFilterOptions, setStatusFilterOptions] = useState([
        { value: 'all', label: 'All Questions' },
        { value: 'not_answered', label: 'Not Answered' },
        { value: 'answered', label: 'Answered' },
    ]);
    
    // Reset filter options when context changes (engagementId or sessionId)
    useEffect(() => {
        // Reset to default options when context changes
        setStatusFilterOptions([
            { value: 'all', label: 'All Questions' },
            { value: 'not_answered', label: 'Not Answered' },
            { value: 'answered', label: 'Answered' },
        ]);
        setStatusFilter('all');
        statusFilterRef.current = 'all';
    }, [engagementId, sessionFilterId]);
    
    // Answer modal state
    const [showAnswerModal, setShowAnswerModal] = useState(false);
    const [selectedQuestion, setSelectedQuestion] = useState(null);
    
    // Delete modal state
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    
    const tableRef = useRef(null);
    const statusFilterRef = useRef('all');
    const sessionFilterIdRef = useRef(null);
    const engagementIdRef = useRef(engagementId);
    const isTableInitializedRef = useRef(false);
    const { restoreTablePage } = usePersistedTablePage();

    // Update refs when values change
    useEffect(() => {
        statusFilterRef.current = statusFilter;
    }, [statusFilter]);

    useEffect(() => {
        sessionFilterIdRef.current = sessionFilterId;
    }, [sessionFilterId]);

    useEffect(() => {
        engagementIdRef.current = engagementId;
    }, [engagementId]);

    // Read sessionId from query - initialize ref immediately
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const sId = params.get('sessionId');
        const sessionIdValue = sId || null;
        sessionFilterIdRef.current = sessionIdValue;
        setSessionFilterId(sessionIdValue);
    }, [location.search]);

    // Load engagement (if valid)
    useEffect(() => {
        const hasValidEngagement = engagementId && engagementId !== 'unknown';
        if (hasValidEngagement) {
            dispatch(getEngagementById(engagementId));
        }
    }, [dispatch, engagementId]);

    const handleBack = useCallback(() => {
        navigate(-1);
    }, [navigate]);

    const handleAnswer = useCallback((question) => {
        setSelectedQuestion(question);
        setShowAnswerModal(true);
    }, []);

    const handleView = useCallback((question) => {
        const currentEngagementId = engagementIdRef.current;
        const currentSessionId = sessionFilterIdRef.current;
        
        // Get engagementId from question data if available
        const questionEngagementId = question?.engagementId || question?.engagement?.id;
        
        // Use engagementId from question, then ref, then 'unknown' as fallback
        const engagementIdToUse = questionEngagementId || (currentEngagementId && currentEngagementId !== 'unknown' ? currentEngagementId : 'unknown');
        
        // Navigate with engagementId (required by route)
        navigate(`/engagement/qa/${engagementIdToUse}/view/${question.id}${currentSessionId ? `?sessionId=${currentSessionId}` : ''}`);
    }, [navigate]);

    const handleDelete = useCallback((question) => {
        setSelectedQuestion(question);
        setShowDeleteModal(true);
    }, []);

    const handleAnswerSubmit = useCallback(async () => {
        // Reload table after answer
        if (tableRef.current) {
            tableRef.current.ajax.reload(null, false);
        }
    }, []);

    const handleDeleteSubmit = useCallback(async () => {
        // Reload table after delete
        if (tableRef.current) {
            tableRef.current.ajax.reload(null, false);
        }
    }, []);

    const handleStatusFilterChange = useCallback((newStatus) => {
        // Update ref immediately before state update
        statusFilterRef.current = newStatus;
        setStatusFilter(newStatus);
        // Reload table with new filter immediately
        if (tableRef.current) {
            tableRef.current.ajax.reload(null, false);
        }
    }, []);

    // Initialize server-side DataTable
    useEffect(() => {
        // Prevent multiple initializations
        if (isTableInitializedRef.current && tableRef.current) {
            return;
        }
        
        const currentEngagementId = engagementIdRef.current;
        const currentSessionId = sessionFilterIdRef.current;
        
        // At least one of engagementId or sessionId must be present
        if (!currentEngagementId && !currentSessionId) {
            return; // Wait for one of them to be set
        }
        
        // Destroy existing table if any
        if (tableRef.current) {
            try {
                tableRef.current.destroy();
            } catch (e) {
                // Ignore destroy errors
            }
            tableRef.current = null;
        }
        
        isTableInitializedRef.current = true;

        const columns = [
            {
                data: 'question',
                title: 'Question / Answer',
                orderable: true,
                render: function (data, type, row) {
                    if (type === 'sort' || type === 'type') {
                        return (data || '') + ' ' + (row.answer || '');
                    }
                    const questionText = row.question || '';
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
                orderable: true,
                render: function (data, type, row) {
                    if (type === 'sort' || type === 'type') {
                        return row.askedBy?.fullName || '';
                    }
                    const userName = row.askedBy?.fullName || 'Unknown';
                    return `
                        <div class="d-inline-block align-middle">
                            <h6 class="m-b-5">${userName}</h6>
                        </div>
                    `;
                }
            },
            {
                data: 'likesCount',
                title: 'Likes',
                orderable: true,
                render: function (data, type, row) {
                    if (type === 'sort' || type === 'type') {
                        return row.likesCount || 0;
                    }
                    return `
                        <div class="text-start" style="margin-top: 10px;">
                            <span class="badge badge-light">
                                <i class="feather icon-heart mr-1"></i>
                                ${row.likesCount || 0}
                            </span>
                        </div>
                    `;
                }
            },
            {
                data: 'status',
                title: 'Status',
                orderable: true,
                render: function (data, type, row) {
                    if (type === 'sort' || type === 'type') {
                        return row.status || (row.answer ? 'answered' : 'not_answered');
                    }
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
                        default:
                            badgeClass = 'badge-secondary';
                            statusText = status;
                    }
                    
                    return `<span class="badge ${badgeClass}">${statusText}</span>`;
                }
            },
            {
                data: 'createdAt',
                title: 'Date',
                orderable: true,
                render: function (data, type, row) {
                    if (type === 'sort' || type === 'type') {
                        return row.createdAt || '';
                    }
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
        ];

        // Get ajaxParams function that includes sessionId filter (status is handled in fetchAction)
        const getAjaxParams = () => {
            const params = {};
            const currentSessionId = sessionFilterIdRef.current;
            
            if (currentSessionId) {
                params.sessionId = currentSessionId;
            }
            
            return params;
        };

        // Fetch action wrapper - always reads latest ref values
        const fetchAction = (filters) => {
            // Read latest values from refs (they're always up-to-date)
            const currentEngagementId = engagementIdRef.current;
            const currentSessionId = sessionFilterIdRef.current;
            const currentStatus = statusFilterRef.current;
            
            // Start with filters from DataTables (page, limit, search, etc.)
            const mergedFilters = {
                ...filters,
            };
            
            // Override with current filter values from refs
            // Add status filter if not 'all' (don't send 'all' to backend)
            if (currentStatus && currentStatus !== 'all') {
                mergedFilters.status = currentStatus;
            } else {
                // Explicitly remove status if it's 'all' or not set
                delete mergedFilters.status;
            }
            
            // Add sessionId if present
            if (currentSessionId) {
                mergedFilters.sessionId = currentSessionId;
            }
            
            // Add engagementId if valid
            if (currentEngagementId && currentEngagementId !== 'unknown') {
                mergedFilters.engagementId = currentEngagementId;
            }
            
            return getEngagementQAQuestions(
                mergedFilters.engagementId,
                currentStatus !== 'all' ? currentStatus : 'all', // Pass status for action logic
                'likes',
                mergedFilters.sessionId,
                mergedFilters
            );
        };

        // Callback to update filter options from backend response
        const onDataLoaded = (responseData, metadata, fullResponse) => {
            // Update status filter options from backend metadata
            if (metadata?.filterOptions?.status) {
                setStatusFilterOptions(metadata.filterOptions.status);
            }
            return responseData;
        };

        // Initialize server-side DataTable
        const tableInstance = initializeServerSideDataTable({
            tableSelector: '#engagement-qa-data-table',
            ajaxUrl: '/engagements/qna/questions',
            ajaxMethod: 'GET',
            columns: columns,
            ajaxParams: getAjaxParams,
            fetchAction: fetchAction,
            onDataLoaded: onDataLoaded,
            axiosInstance: axiosInstance,
            dispatch: dispatch,
            loadingActionType: ENGAGEMENT_QNA_LOADING,
            dom: "<'row mb-3'<'col-sm-12 col-md-6'l><'col-sm-12 col-md-6 d-flex justify-content-end align-items-center'<'search-container'f><'back-button ml-2'>>>" +
                 "<'row'<'col-sm-12'tr>>" +
                 "<'row'<'col-sm-12 col-md-5'i><'col-sm-12 col-md-7'p>>",
            pageLength: 10,
            lengthMenu: [[5, 10, 25, 50, -1], [5, 10, 25, 50, 'All']],
            order: [[4, 'desc']], // Sort by date descending
            restoreTablePage: restoreTablePage,
            initCompleteCallback: function (settings, json, api) {
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

                // Attach event listeners for actions
                $(settings.nTable).off('click', '.view-btn').on('click', '.view-btn', function () {
                    const rowData = api.row($(this).closest('tr')).data();
                    const questionId = $(this).data('id');
                    if (questionId && rowData) {
                        handleView(rowData);
                    }
                });

                $(settings.nTable).off('click', '.answer-btn').on('click', '.answer-btn', function () {
                    const rowData = api.row($(this).closest('tr')).data();
                    const questionId = $(this).data('id');
                    if (questionId && rowData) {
                        handleAnswer(rowData);
                    }
                });

                $(settings.nTable).off('click', '.delete-btn').on('click', '.delete-btn', function () {
                    const rowData = api.row($(this).closest('tr')).data();
                    const questionId = $(this).data('id');
                    if (questionId && rowData) {
                        handleDelete(rowData);
                    }
                });
            }
        });

        tableRef.current = tableInstance;

        return () => {
            if (tableRef.current) {
                tableRef.current.destroy();
                tableRef.current = null;
                isTableInitializedRef.current = false;
            }
        };
    }, [sessionFilterId, engagementId]); // Re-initialize when sessionFilterId or engagementId changes

    return (
        <div className="engagement-qa-page">
            {/* Status Filter */}
            <Card className="mb-4 shadow-sm border-0" style={{ borderRadius: '8px' }}>
                <Card.Header
                    className="bg-light border-0"
                    style={{
                        padding: '16px 20px',
                        borderRadius: '8px 8px 0 0'
                    }}
                >
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
                                style={{
                                    backgroundColor: '#4680ff',
                                    fontSize: '11px',
                                    padding: '4px 8px'
                                }}
                            >
                                1 Active
                            </span>
                        )}
                    </div>
                </Card.Header>
                <Card.Body style={{ padding: '20px' }}>
                    <Row className="align-items-end">
                        <Col xl={4} lg={4} md={6} sm={12} xs={12} className="mb-xl-0 mb-lg-0 mb-md-3 mb-sm-3 mb-3">
                            <Form.Group className="mb-0">
                                <Form.Label
                                    style={{
                                        fontSize: '14px',
                                        fontWeight: '600',
                                        color: '#495057',
                                        marginBottom: '8px'
                                    }}
                                >
                                    <i className="feather icon-check-circle mr-1"></i>
                                    Filter by Status
                                </Form.Label>
                                <Form.Select
                                    value={statusFilter}
                                    onChange={(e) => handleStatusFilterChange(e.target.value)}
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
                                    {statusFilterOptions.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label} {option.count !== undefined ? `(${option.count})` : ''}
                                        </option>
                                    ))}
                                </Form.Select>
                            </Form.Group>
                        </Col>

                        <Col xl={4} lg={4} md={6} sm={12} xs={12} className="d-flex justify-content-xl-end justify-content-lg-end justify-content-md-start justify-content-sm-start justify-content-start align-items-center mt-xl-0 mt-lg-0 mt-md-4 mt-sm-4 mt-4">
                            <div className="d-flex flex-wrap align-items-center" style={{ gap: '10px', width: '100%' }}>
                                {statusFilter !== 'all' && (
                                    <Button
                                        variant="outline-secondary"
                                        onClick={() => handleStatusFilterChange('all')}
                                        style={{
                                            borderRadius: '6px',
                                            padding: '8px 14px',
                                            fontSize: '13px',
                                            fontWeight: '500',
                                            minWidth: '75px',
                                            whiteSpace: 'nowrap'
                                        }}
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

            {/* Q&A Table */}
            <Row>
                <Col sm={12} className="btn-page">
                    <Card className="event-list">
                        <Card.Body>
                            <Table striped hover responsive id="engagement-qa-data-table">
                                <thead></thead>
                                <tbody></tbody>
                            </Table>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Answer Question Modal */}
            <AnswerEngagementQuestionModal
                show={showAnswerModal}
                onHide={() => setShowAnswerModal(false)}
                question={selectedQuestion}
                onSubmit={handleAnswerSubmit}
            />

            {/* Delete Question Modal */}
            <DeleteEngagementQuestionModal
                show={showDeleteModal}
                onHide={() => setShowDeleteModal(false)}
                question={selectedQuestion}
                onSubmit={handleDeleteSubmit}
            />
        </div>
    );
};

export default EngagementQAPage;
