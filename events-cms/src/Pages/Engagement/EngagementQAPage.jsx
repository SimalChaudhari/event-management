import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Card, Table, Row, Col, Badge, Button, Alert, Form, Modal, InputGroup } from 'react-bootstrap';
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

// @ts-ignore
$.DataTable = require('datatables.net-bs');

function engagementQaTable(data, engagementData, handleBack, handleAnswer, handleView, handleDelete) {
    let tableZero = '#engagement-qa-data-table';
    $.fn.dataTable.ext.errMode = 'throw';

    // Preserve the current page
    let currentPage = 0;
    if ($.fn.DataTable.isDataTable(tableZero)) {
        currentPage = $(tableZero).DataTable().page();
        $(tableZero).DataTable().clear().destroy();
    }

    $(tableZero).DataTable({
        data: data || [],
        order: [[4, 'desc']], // Sort by date descending
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
                render: function (data, type, row) {
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
}

const EngagementQAPage = () => {
    const { engagementId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const { selectedEngagement } = useSelector((state) => state.engagement);
    const { engagementQuestions, loading } = useSelector((state) => state.engagementQna);

    const [filteredQaData, setFilteredQaData] = useState(null);
    const [currentTable, setCurrentTable] = useState(null);
    const [statusFilter, setStatusFilter] = useState('all');
    
    // Answer modal state
    const [showAnswerModal, setShowAnswerModal] = useState(false);
    const [selectedQuestion, setSelectedQuestion] = useState(null);
    
    // Delete modal state
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    
    // Generate URL modal state
    const [showGenerateUrlModal, setShowGenerateUrlModal] = useState(false);
    const [shareUrl, setShareUrl] = useState('');
    const [generating, setGenerating] = useState(false);
    const [copied, setCopied] = useState(false);

    // Read sessionId from query
    const [sessionFilterId, setSessionFilterId] = useState(null);
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const sId = params.get('sessionId');
        setSessionFilterId(sId || null);
    }, [location.search]);

    // Load engagement (if valid) and fetch questions (by sessionId if present)
    useEffect(() => {
        const hasValidEngagement = engagementId && engagementId !== 'unknown';
        if (hasValidEngagement) {
            dispatch(getEngagementById(engagementId));
        }
        if (sessionFilterId) {
            dispatch(getEngagementQAQuestions(null, 'all', 'likes', sessionFilterId));
        } else if (hasValidEngagement) {
            dispatch(getEngagementQAQuestions(engagementId));
        }
    }, [dispatch, engagementId, sessionFilterId]);

    // Filter questions based on status filter
    useEffect(() => {
        if (engagementQuestions) {
            let filtered = engagementQuestions;
            
            if (statusFilter !== 'all') {
                filtered = engagementQuestions.filter(question => {
                    const status = question.status || (question.answer ? 'answered' : 'not_answered');
                    return status === statusFilter;
                });
            }
            
            setFilteredQaData(filtered);
        }
    }, [engagementQuestions, statusFilter]);

    const handleBack = useCallback(() => {
        navigate(-1);
    }, [navigate]);

    const handleAnswer = useCallback((question) => {
        setSelectedQuestion(question);
        setShowAnswerModal(true);
    }, []);

    const handleView = useCallback((question) => {
        navigate(`/engagement/qa/${engagementId}/view/${question.id}`);
    }, [navigate, engagementId]);

    const handleDelete = useCallback((question) => {
        setSelectedQuestion(question);
        setShowDeleteModal(true);
    }, []);

    const destroyTable = useCallback(() => {
        if (currentTable) {
            $('#engagement-qa-data-table').off('click', '.view-btn, .answer-btn, .delete-btn');
            currentTable.destroy();
            setCurrentTable(null);
        }
    }, [currentTable]);

    const initializeTable = useCallback(() => {
        destroyTable();
        if (filteredQaData && filteredQaData.length >= 0) {
            const table = engagementQaTable(filteredQaData, selectedEngagement, handleBack, handleAnswer, handleView, handleDelete);
            setCurrentTable(table);
        }
    }, [filteredQaData, selectedEngagement, destroyTable, handleBack, handleAnswer, handleView, handleDelete]);

    const handleAnswerSubmit = useCallback(async () => {
        // Reload questions after answer
        const hasValidEngagement = engagementId && engagementId !== 'unknown';
        if (sessionFilterId) {
            await dispatch(getEngagementQAQuestions(null, 'all', 'likes', sessionFilterId));
        } else if (hasValidEngagement) {
            await dispatch(getEngagementQAQuestions(hasValidEngagement ? engagementId : null));
        }
    }, [dispatch, engagementId, sessionFilterId]);

    const handleDeleteSubmit = useCallback(async () => {
        // Reload questions after delete
        const hasValidEngagement = engagementId && engagementId !== 'unknown';
        if (sessionFilterId) {
            await dispatch(getEngagementQAQuestions(null, 'all', 'likes', sessionFilterId));
        } else if (hasValidEngagement) {
            await dispatch(getEngagementQAQuestions(hasValidEngagement ? engagementId : null));
        }
    }, [dispatch, engagementId, sessionFilterId]);

    const handleGenerateUrl = useCallback(async () => {
        if (!sessionFilterId) {
            toast.error('Session ID is required');
            return;
        }

        setGenerating(true);
        setCopied(false);
        try {
            const response = await axiosInstance.post('/engagements/qna/generate-link', {
                sessionId: sessionFilterId
            });

            if (response.data.success && response.data.data.shareUrl) {
                const url = response.data.data.shareUrl;
                setShareUrl(url);
                setShowGenerateUrlModal(true);
            } else {
                toast.error(response.data.message || 'Failed to generate URL');
            }
        } catch (error) {
            console.error('Error generating share URL:', error);
            toast.error(error?.response?.data?.message || 'Failed to generate URL');
        } finally {
            setGenerating(false);
        }
    }, [sessionFilterId]);

    const handleCopyUrl = useCallback(() => {
        if (shareUrl) {
            navigator.clipboard.writeText(shareUrl).then(() => {
                setCopied(true);
                toast.success('URL copied to clipboard!');
                setTimeout(() => setCopied(false), 2000);
            }).catch(() => {
                toast.error('Failed to copy URL');
            });
        }
    }, [shareUrl]);

    useEffect(() => {
        if (filteredQaData) {
            initializeTable();
        }
        return destroyTable;
    }, [filteredQaData, initializeTable, destroyTable]);

    // Don't block UI if engagement is unknown; table can render with questions only

    return (
        <div className="engagement-qa-page">
            {/* Status Filter */}
            <Row className="mb-3">
                <Col sm={12}>
                    <Card className="mb-4 shadow-sm border-0">
                        <Card.Header className="bg-light border-0">
                            <div className="d-flex align-items-center justify-content-between">
                                <div className="d-flex align-items-center">
                                    <i className="feather icon-filter mr-2" style={{ color: '#4680ff', fontSize: '18px' }}></i>
                                    <h6 className="mb-0" style={{ fontWeight: '600', color: '#495057' }}>
                                        Filter Options
                                    </h6>
                                </div>
                                <div className="d-flex align-items-center gap-2">
                                    {statusFilter !== 'all' && (
                                        <span className="badge badge-primary" style={{ backgroundColor: '#4680ff', fontSize: '11px', padding: '4px 8px' }}>
                                            1 Active
                                        </span>
                                    )}
                                    {sessionFilterId && (
                                        <Button
                                            variant="primary"
                                            onClick={handleGenerateUrl}
                                            disabled={generating}
                                            style={{
                                                backgroundColor: '#71C0BB',
                                                borderColor: '#71C0BB',
                                                fontSize: '14px',
                                                padding: '6px 16px'
                                            }}
                                        >
                                            {generating ? (
                                                <>
                                                    <span className="spinner-border spinner-border-sm mr-2" role="status" aria-hidden="true"></span>
                                                    Generating...
                                                </>
                                            ) : (
                                                <>
                                                    <i className="feather icon-link-2 mr-2"></i>
                                                    Generate Share URL
                                                </>
                                            )}
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </Card.Header>
                        <Card.Body>
                            <Row className="align-items-end g-3">
                                <Col xl={4} lg={4} md={6} sm={12} xs={12}>
                                    <Form.Group className="mb-0">
                                        <Form.Label style={{ fontSize: '14px', fontWeight: '600', color: '#495057', marginBottom: '8px' }}>
                                            <i className="feather icon-check-circle mr-1"></i>
                                            Filter by Status
                                        </Form.Label>
                                        <Form.Select
                                            value={statusFilter}
                                            onChange={(e) => setStatusFilter(e.target.value)}
                                            className="border rounded"
                                        >
                                            <option value="all">All Questions</option>
                                            <option value="not_answered">Not Answered</option>
                                            <option value="answered">Answered</option>
                                        </Form.Select>
                                    </Form.Group>
                                </Col>

                                <Col xl={4} lg={4} md={6} sm={12} xs={12} className="mt-md-3 mt-sm-3 mt-3">
                                    <div className="d-flex align-items-end justify-content-start flex-wrap" style={{ gap: '12px' }}>
                                        {statusFilter !== 'all' && (
                                            <Button
                                                variant="outline-secondary"
                                                onClick={() => setStatusFilter('all')}
                                                className="border rounded"
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
                            <Table striped hover responsive id="engagement-qa-data-table">
                                <thead>
                                    <tr>
                                        <th>Question / Answer</th>
                                        <th>Asked By</th>
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

            {/* Generate URL Modal */}
            <Modal show={showGenerateUrlModal} onHide={() => setShowGenerateUrlModal(false)} centered size="lg">
                <Modal.Header style={{ borderBottom: '1px solid #e0e0e0', padding: '20px', position: 'relative' }}>
                    <Modal.Title style={{ color: '#333', fontWeight: '600', fontSize: '18px' }}>
                        <i className="feather icon-link-2 mr-2" style={{ color: '#71C0BB' }}></i>
                        Shareable Q&A Link
                    </Modal.Title>
                    <button
                        type="button"
                        className="btn-close"
                        onClick={() => setShowGenerateUrlModal(false)}
                        style={{
                            position: 'absolute',
                            top: '15px',
                            right: '15px',
                            width: '30px',
                            height: '30px',
                            backgroundColor: 'transparent',
                            border: 'none',
                            fontSize: '18px',
                            color: '#666',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '50%',
                            transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.backgroundColor = '#f5f5f5';
                            e.target.style.color = '#333';
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.backgroundColor = 'transparent';
                            e.target.style.color = '#666';
                        }}
                    >
                        <i className="feather icon-x" style={{ fontSize: '16px' }}></i>
                    </button>
                </Modal.Header>
                <Modal.Body style={{ padding: '20px' }}>
                    <div className="mb-3">
                        <Form.Label style={{ color: '#333', fontWeight: '600', marginBottom: '8px' }}>
                            <i className="feather icon-info mr-2" style={{ color: '#71C0BB' }}></i>
                            Share this link to allow public access to session Q&A
                        </Form.Label>
                        <InputGroup>
                            <Form.Control
                                type="text"
                                value={shareUrl}
                                readOnly
                                style={{
                                    border: '1px solid #ced4da',
                                    borderRadius: '6px 0 0 6px',
                                    fontSize: '14px',
                                    backgroundColor: '#f8f9fa'
                                }}
                            />
                            <Button
                                variant={copied ? "success" : "primary"}
                                onClick={handleCopyUrl}
                                style={{
                                    backgroundColor: copied ? '#28a745' : '#71C0BB',
                                    borderColor: copied ? '#28a745' : '#71C0BB',
                                    borderRadius: '0 6px 6px 0',
                                    borderLeft: 'none',
                                    padding: '8px 20px',
                                    fontSize: '14px',
                                    fontWeight: '500'
                                }}
                            >
                                {copied ? (
                                    <>
                                        <i className="feather icon-check mr-2"></i>
                                        Copied!
                                    </>
                                ) : (
                                    <>
                                        <i className="feather icon-copy mr-2"></i>
                                        Copy
                                    </>
                                )}
                            </Button>
                        </InputGroup>
                        <small className="text-muted" style={{ fontSize: '12px', display: 'block', marginTop: '8px' }}>
                            <i className="feather icon-alert-circle mr-1"></i>
                            This link provides public access. Anyone with this link can view and manage Q&A for this session.
                        </small>
                    </div>
                </Modal.Body>
                <Modal.Footer style={{ borderTop: '1px solid #e0e0e0', padding: '20px', justifyContent: 'flex-end' }}>
                    <Button
                        variant="secondary"
                        onClick={() => setShowGenerateUrlModal(false)}
                        style={{
                            borderRadius: '6px',
                            padding: '8px 16px',
                            fontSize: '14px',
                            fontWeight: '500'
                        }}
                    >
                        Close
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default EngagementQAPage;

