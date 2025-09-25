import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Card, Table, Row, Col, Badge, Button, Spinner, Alert } from 'react-bootstrap';
import { API_URL, DUMMY_PATH } from '../../../configs/env';
import { formatDateTimeForTable } from '../../../components/dateTime/dateTimeUtils';
import { eventList } from '../../../store/actions/eventActions';
import { getQAQuestions, answerQuestion, pinQuestion, unpinQuestion } from '../../../store/actions/qaActions';
import AnswerQuestionModal from './components/AnswerQuestionModal';
import * as $ from 'jquery';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../../../assets/css/event.css';

// @ts-ignore
$.DataTable = require('datatables.net-bs');

function qaTable(data, eventData, handleBack, handleAnswer, handlePin, handleView) {
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
                    const answerHtml = row.answer ? `
                        <div class="mt-2 p-2" style="background-color: #f8f9fa; border-left: 3px solid #007bff; border-radius: 0 4px 4px 0;">
                            <small class="text-muted">Answer:</small>
                            <p class="mb-0">${row.answer}</p>
                        </div>
                    ` : '';
                    
                    return `
                        <div class="d-inline-block align-middle">
                            <div class="d-inline-block">
                                <p class="m-b-0 fw-bold">${row.question}</p>
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
                            ${!row.isAnswered ? `
                                <button type="button" class="btn btn-info btn-circle btn-sm answer-btn" data-id="${row.id}" title="Answer" 
                                    style="margin-right: 10px; width: 40px; height: 40px; border-radius: 50%; display: inline-flex; justify-content: center; align-items: center;">
                                    <i class="feather icon-message-square"></i>
                                </button>
                            ` : ''}
                            <button type="button" class="btn btn-warning btn-circle btn-sm pin-btn" data-id="${row.id}" title="${row.isPinned ? 'Unpin' : 'Pin'}" 
                                style="margin-right: 10px; width: 40px; height: 40px; border-radius: 50%; display: inline-flex; justify-content: center; align-items: center;">
                                <i class="feather ${row.isPinned ? 'icon-unlock' : 'icon-lock'}"></i>
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
                        Back to Events
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

    $(document).on('click', '.pin-btn', function () {
        const questionId = $(this).data('id');
        const questionData = data.find((q) => q.id === questionId);
        if (questionData) {
            handlePin(questionData);
        }
    });
}

const QAPage = () => {
    const { eventId } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const events = useSelector((state) => state.event?.event?.events);
    const { questions, loading: qaLoading, error: qaError } = useSelector((state) => state.qa);
    
    const [eventData, setEventData] = useState(null);
    const [qaData, setQaData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentTable, setCurrentTable] = useState(null);
    
    // Answer modal state
    const [showAnswerModal, setShowAnswerModal] = useState(false);
    const [selectedQuestion, setSelectedQuestion] = useState(null);
    const [isSubmittingAnswer, setIsSubmittingAnswer] = useState(false);

    // Find the event data
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

    // Load events if not already loaded
    useEffect(() => {
        if (!events || events.length === 0) {
            dispatch(eventList());
        }
    }, [dispatch, events]);

    const handleBack = useCallback(() => {
        navigate('/events/event-list');
    }, [navigate]);

    const handleAnswer = useCallback((question) => {
        console.log('Answer question:', question);
        setSelectedQuestion(question);
        setShowAnswerModal(true);
    }, []);

    const handlePin = useCallback(async (question) => {
        console.log('Pin/Unpin question:', question);
        try {
            if (question.isPinned) {
                await dispatch(unpinQuestion(question.id));
            } else {
                await dispatch(pinQuestion(question.id));
            }
        } catch (error) {
            console.error('Error pinning/unpinning question:', error);
        }
    }, [dispatch]);

    const handleView = useCallback((question) => {
        console.log('View question:', question);
        // TODO: Implement view functionality
    }, []);

    const handleAnswerSubmit = useCallback(async (result, question) => {
        console.log('Answer submitted successfully:', result);
        
        // The Redux action already updates the state, so we just need to refresh the table
        if (currentTable) {
            currentTable.ajax.reload();
        }
    }, [currentTable]);

    const destroyTable = useCallback(() => {
        if (currentTable) {
            $('#qa-data-table').off('click', '.view-btn, .answer-btn, .pin-btn');
            currentTable.destroy();
            setCurrentTable(null);
        }
    }, [currentTable]);

    const initializeTable = useCallback(() => {
        destroyTable();
        if (qaData && qaData.questions && qaData.questions.length >= 0) {
            const table = qaTable(qaData.questions, eventData, handleBack, handleAnswer, handlePin, handleView);
            setCurrentTable(table);
        }
    }, [qaData, eventData, destroyTable, handleBack, handleAnswer, handlePin, handleView]);

    useEffect(() => {
        if (qaData) {
            initializeTable();
        }
        return destroyTable;
    }, [initializeTable, destroyTable]);

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
                <Spinner animation="border" role="status">
                    <span className="visually-hidden">Loading...</span>
                </Spinner>
            </div>
        );
    }

    if (error) {
        return (
            <Row>
                <Col sm={12}>
                    <Alert variant="danger">
                        <Alert.Heading>Error</Alert.Heading>
                        <p>{error}</p>
                        <Button variant="outline-danger" onClick={handleBack}>
                            Back to Events
                        </Button>
                    </Alert>
                </Col>
            </Row>
        );
    }

    if (!eventData || !qaData) {
        return (
            <Row>
                <Col sm={12}>
                    <Alert variant="warning">
                        <Alert.Heading>No Q&A Data</Alert.Heading>
                        <p>No Q&A data found for this event.</p>
                        <Button variant="outline-warning" onClick={handleBack}>
                            Back to Events
                        </Button>
                    </Alert>
                </Col>
            </Row>
        );
    }

    return (
        <div className="qa-page">
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
        </div>
    );
};

export default QAPage;
