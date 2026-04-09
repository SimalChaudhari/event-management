import * as React from 'react';
import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import 'bootstrap/dist/css/bootstrap.min.css';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Table from 'react-bootstrap/Table';
import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import * as $ from 'jquery';
import { getAllTracks } from '../../store/actions/programmeActions';
import { getEngagementsByTrack, toggleEngagementSessionStatus } from '../../store/actions/engagementActions';
import axiosInstance from '../../configs/axiosInstance';
import { toast } from 'react-toastify';
import { ENGAGEMENT_PATHS } from '../../utils/constants';
import TrackQnAShareLinkModal from './components/TrackQnAShareLinkModal';
import '../../assets/css/event.css';
import { initializeServerSideDataTable } from '../../utils/dataTableServerSide';
import usePersistedTablePage from '../../hooks/usePersistedTablePage';
import { ENGAGEMENT_LOADING } from '../../store/constants/actionTypes';

// @ts-ignore
$.DataTable = require('datatables.net-bs');

const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${date.getDate()} ${monthNames[date.getMonth()]} ${date.getFullYear()}`;
};

const formatTime = (time) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
};

const EngagementSessionsPage = () => {
    const { trackId } = useParams();
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const { tracks } = useSelector((state) => state.programme);

    const [showPollingModal, setShowPollingModal] = useState(false);
    const [activeSession, setActiveSession] = useState(null);
    const [pollingTitle, setPollingTitle] = useState('');
    const [pollingUrl, setPollingUrl] = useState('');
    const [pollingLinkId, setPollingLinkId] = useState(null);
    const [saving, setSaving] = useState(false);
    const [showTrackLinkModal, setShowTrackLinkModal] = useState(false);
    const [trackShareUrl, setTrackShareUrl] = useState('');
    const [generatingTrackLink, setGeneratingTrackLink] = useState(false);
    const [showGenerateQuestionModal, setShowGenerateQuestionModal] = useState(false);
    const [questionTitle, setQuestionTitle] = useState('');
    const [questionText, setQuestionText] = useState('');
    const [generatingQuestion, setGeneratingQuestion] = useState(false);
    
    const tableRef = useRef(null);
    const trackIdRef = useRef(trackId);
    const { restoreTablePage } = usePersistedTablePage();

    // Update ref when trackId changes
    useEffect(() => {
        trackIdRef.current = trackId;
    }, [trackId]);

    useEffect(() => {
        dispatch(getAllTracks());
    }, [dispatch]);

    const handleToggleSessionStatus = React.useCallback(async (sessionId) => {
        try {
            const result = await dispatch(toggleEngagementSessionStatus(sessionId));
            if (result && !result.error) {
                // Reload table after toggle
                if (tableRef.current) {
                    tableRef.current.ajax.reload(null, false);
                }
            }
        } catch (error) {
            console.error('Error toggling session status:', error);
            toast.error('Failed to toggle session status');
        }
    }, [dispatch]);

    useEffect(() => {
        if (!trackIdRef.current) return;

        const currentTrackId = trackIdRef.current;
        const columns = [
            {
                data: 'title',
                title: 'Session',
                render: function (data, type, row) {
                    if (type === 'sort' || type === 'type') {
                        return data || '';
                    }
                    const speakers = row.speakers && row.speakers.length > 0
                        ? row.speakers.map(s => s.name).join(', ')
                        : 'TBA';
                    return `
                        <div class="d-inline-block align-middle">
                            <div class="d-inline-block">
                                <h6 class="m-b-0">${data || 'N/A'}</h6>
                                <div class="mt-2">
                                    <span class="badge badge-light-primary">
                                        <i class="feather icon-mic mr-1"></i>
                                        ${speakers}
                                    </span>
                                </div>
                            </div>
                        </div>
                    `;
                }
            },
            {
                data: 'sessionDate',
                title: 'Date & Time',
                render: function (data, type, row) {
                    if (type === 'sort' || type === 'type') {
                        return row.sessionDate || '';
                    }
                    const dateStr = row.sessionDate ? formatDate(row.sessionDate) : 'N/A';
                    const timeStr = (row.startTime && row.endTime) 
                        ? `${formatTime(row.startTime)} - ${formatTime(row.endTime)}`
                        : 'N/A';
                    return `
                        <div class="text-muted small">
                            <i class="feather icon-calendar mr-1"></i>${dateStr}<br>
                            <i class="feather icon-clock mr-1"></i>${timeStr}
                        </div>
                    `;
                }
            },
            {
                data: null,
                title: 'Status',
                className: 'text-center',
                width: '15%',
                orderable: false,
                render: function (data, type, row) {
                    const isActive = (row.isActive !== undefined && row.isActive !== null) ? row.isActive : true;
                    const badgeClass = isActive ? 'badge-light-success' : 'badge-light-secondary';
                    const statusText = isActive ? 'Active' : 'Inactive';
                    const iconClass = isActive ? 'icon-check-circle' : 'icon-x-circle';
                    
                    return `
                        <span class="badge ${badgeClass} toggle-session-status-badge" data-id="${row.id}" 
                              style="cursor: pointer; font-size: 13px; padding: 6px 16px; min-width: 90px;" 
                              title="Click to toggle status">
                            <i class="feather ${iconClass}" style="margin-right: 4px;"></i>${statusText}
                        </span>
                    `;
                }
            },
            {
                data: null,
                title: 'Actions',
                orderable: false,
                render: function (data, type, row) {
                    return `
                        <div class="d-flex">
                            <button type="button" class="btn btn-icon btn-success view-btn mr-2" data-id="${row.id}" title="View Session">
                                <i class="feather icon-eye"></i>
                            </button>
                            <button type="button" class="btn btn-icon btn-info qa-btn mr-2" data-sessionid="${row.id}" title="Q&A">
                                <i class="feather icon-message-circle"></i>
                            </button>
                            <button type="button" class="btn btn-icon btn-warning polling-btn" data-sessionid="${row.id}" title="Polling Link">
                                <i class="feather icon-link-2"></i>
                            </button>
                        </div>`;
                }
            }
        ];

        // Get ajaxParams function that includes trackId
        const getAjaxParams = () => {
            return {};
        };

        // Initialize server-side DataTable
        const tableInstance = initializeServerSideDataTable({
            tableSelector: '#engagement-sessions-table',
            ajaxUrl: `/engagements/track/${currentTrackId}`,
            ajaxMethod: 'GET',
            columns: columns,
            ajaxParams: getAjaxParams,
            fetchAction: (filters) => getEngagementsByTrack(currentTrackId, filters), // Use existing Redux action
            axiosInstance: axiosInstance,
            dispatch: dispatch,
            loadingActionType: ENGAGEMENT_LOADING,
            dom: "<'row mb-3'<'col-sm-12 col-md-6'l><'col-sm-12 col-md-6 d-flex justify-content-end align-items-center'<'search-container'f>>>" +
                 "<'row'<'col-sm-12'tr>>" +
                 "<'row'<'col-sm-12 col-md-5'i><'col-sm-12 col-md-7'p>>",
            pageLength: 10,
            lengthMenu: [[5, 10, 25, 50, -1], [5, 10, 25, 50, 'All']],
            order: [[0, 'asc']],
            restoreTablePage: restoreTablePage,
            initCompleteCallback: function (settings, json, api) {
                // Attach event listeners for actions
                $(settings.nTable).off('click', '.view-btn').on('click', '.view-btn', function () {
                    const rowData = api.row($(this).closest('tr')).data();
                    const sessionId = $(this).data('id');
                    if (sessionId && rowData) {
                        const eventId = rowData.track?.eventId || (rowData.track?.event?.id);
                        if (eventId) {
                            navigate(`${ENGAGEMENT_PATHS.VIEW_SESSION}/${sessionId}?eventId=${eventId}`);
                        } else {
                            navigate(`${ENGAGEMENT_PATHS.VIEW_SESSION}/${sessionId}`);
                        }
                    }
                });

                $(settings.nTable).off('click', '.qa-btn').on('click', '.qa-btn', function () {
                    const rowData = api.row($(this).closest('tr')).data();
                    const sessionId = rowData?.id || $(this).data('sessionid');
                    if (sessionId) {
                        navigate(`${ENGAGEMENT_PATHS.QA}?sessionId=${sessionId}`);
                    }
                });

                $(settings.nTable).off('click', '.polling-btn').on('click', '.polling-btn', async function () {
                    const rowData = api.row($(this).closest('tr')).data();
                    const sessionId = rowData?.id || $(this).data('sessionid');
                    if (sessionId && rowData) {
                        setActiveSession(rowData);
                        try {
                            const res = await axiosInstance.get(`/engagements/sessions/${sessionId}/polling-link`);
                            const link = res?.data?.data || null;
                            setPollingLinkId(link?.id || null);
                            setPollingTitle(link?.title || '');
                            setPollingUrl(link?.url || '');
                        } catch (e) {
                            setPollingLinkId(null);
                            setPollingTitle('');
                            setPollingUrl('');
                        }
                        setShowPollingModal(true);
                    }
                });

                $(settings.nTable).off('click', '.toggle-session-status-badge').on('click', '.toggle-session-status-badge', function () {
                    const sessionId = $(this).data('id');
                    if (sessionId) {
                        // Use the callback directly - it's stable
                        handleToggleSessionStatus(sessionId);
                    }
                });
            }
        });

        tableRef.current = tableInstance;

        return () => {
            if (tableRef.current) {
                tableRef.current.destroy();
                tableRef.current = null;
            }
        };
    }, []); // Only run once on mount - use refs for dynamic values

    const handleBack = () => {
        // Preserve page number when navigating back
        const urlParams = new URLSearchParams(window.location.search);
        const currentPage = urlParams.get('page');
        const url = currentPage ? `${ENGAGEMENT_PATHS.LIST_ENGAGEMENTS}?page=${currentPage}` : ENGAGEMENT_PATHS.LIST_ENGAGEMENTS;
        navigate(url);
    };

    const handleSavePolling = async () => {
        if (!activeSession) return;
        if (!pollingTitle || !pollingUrl) {
            toast.error('Title and URL are required');
            return;
        }
        try {
            setSaving(true);
            const sessionId = activeSession.id;
            const res = await axiosInstance.post(`/engagements/sessions/${sessionId}/polling-link`, {
                title: pollingTitle,
                url: pollingUrl
            });
            setPollingLinkId(res?.data?.data?.id || null);
            toast.success('Polling link saved');
            setShowPollingModal(false);
            // Reload table after saving
            if (tableRef.current) {
                tableRef.current.ajax.reload(null, false);
            }
        } catch (e) {
            toast.error(e?.response?.data?.message || 'Failed to save polling link');
        } finally {
            setSaving(false);
        }
    };

    const handleDeletePolling = async () => {
        if (!pollingLinkId) {
            setPollingTitle('');
            setPollingUrl('');
            setShowPollingModal(false);
            return;
        }
        try {
            setSaving(true);
            await axiosInstance.delete(`/engagements/polling-links/${pollingLinkId}`);
            toast.success('Polling link deleted');
            setPollingLinkId(null);
            setPollingTitle('');
            setPollingUrl('');
            setShowPollingModal(false);
            // Reload table after deleting
            if (tableRef.current) {
                tableRef.current.ajax.reload(null, false);
            }
        } catch (e) {
            toast.error(e?.response?.data?.message || 'Failed to delete polling link');
        } finally {
            setSaving(false);
        }
    };

    return (
        <>
            <Row>
                <Col sm={12}>
                    <Card>
                        <Card.Header>
                            <div className="d-flex justify-content-between align-items-center">
                                <h5 className="mb-0">Engagement Sessions</h5>
                                <div className="d-flex" style={{ gap: '12px' }}>
                                    <Button 
                                        onClick={async () => {
                                            if (!trackId) {
                                                toast.error('Track ID is required');
                                                return;
                                            }
                                            setGeneratingTrackLink(true);
                                            try {
                                                const res = await axiosInstance.post('/engagements/qna/generate-track-link', {
                                                    trackId: trackId
                                                });
                                                if (res?.data?.success && res?.data?.data?.shareUrl) {
                                                    setTrackShareUrl(res.data.data.shareUrl);
                                                    setShowTrackLinkModal(true);
                                                } else {
                                                    toast.error(res?.data?.message || 'Failed to generate track link');
                                                }
                                            } catch (e) {
                                                toast.error(e?.response?.data?.message || 'Failed to generate track link');
                                            } finally {
                                                setGeneratingTrackLink(false);
                                            }
                                        }}
                                        disabled={generatingTrackLink || !trackId}
                                        style={{
                                            backgroundColor: '#71C0BB',
                                            borderColor: '#71C0BB',
                                            color: 'white'
                                        }}
                                        onMouseEnter={(e) => {
                                            if (!generatingTrackLink && trackId) {
                                                e.target.style.backgroundColor = '#5ba8a3';
                                                e.target.style.borderColor = '#5ba8a3';
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            if (!generatingTrackLink && trackId) {
                                                e.target.style.backgroundColor = '#71C0BB';
                                                e.target.style.borderColor = '#71C0BB';
                                            }
                                        }}
                                    >
                                        <i className="feather icon-link mr-1"></i>
                                        {generatingTrackLink ? 'Generating...' : 'Generate Link'}
                                    </Button>
                                    <Button variant="secondary" onClick={handleBack}>
                                        <i className="feather icon-arrow-left mr-1"></i>
                                        Back
                                    </Button>
                                </div>
                            </div>
                        </Card.Header>
                        <Card.Body>
                            <Table striped hover responsive id="engagement-sessions-table">
                                <thead></thead>
                                <tbody></tbody>
                            </Table>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
            <Modal show={showPollingModal} onHide={() => setShowPollingModal(false)} centered>
                <Modal.Header style={{ position: 'relative' }}>
                    <Modal.Title>Session Polling Link</Modal.Title>
                    <button
                        type="button"
                        onClick={() => setShowPollingModal(false)}
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
                <Modal.Body>
                    <Form>
                        <Form.Group className="mb-3">
                            <Form.Label>Title</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="Enter title"
                                value={pollingTitle}
                                onChange={(e) => setPollingTitle(e.target.value)}
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>URL</Form.Label>
                            <Form.Control
                                type="url"
                                placeholder="https://example.com"
                                value={pollingUrl}
                                onChange={(e) => setPollingUrl(e.target.value)}
                            />
                        </Form.Group>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowPollingModal(false)}>
                        Close
                    </Button>
                    {pollingLinkId && (
                        <Button variant="danger" onClick={handleDeletePolling} disabled={saving}>
                            <i className="feather icon-trash-2 mr-1"></i> Delete
                        </Button>
                    )}
                    <Button variant="primary" onClick={handleSavePolling} disabled={saving}>
                        <i className="feather icon-save mr-1"></i> Save
                    </Button>
                </Modal.Footer>
            </Modal>
            <TrackQnAShareLinkModal
                show={showTrackLinkModal}
                onHide={() => setShowTrackLinkModal(false)}
                trackShareUrl={trackShareUrl}
            />
            <Modal show={showGenerateQuestionModal} onHide={() => setShowGenerateQuestionModal(false)} centered>
                <Modal.Header style={{ position: 'relative' }}>
                    <Modal.Title>Generate Question</Modal.Title>
                    <button
                        type="button"
                        onClick={() => setShowGenerateQuestionModal(false)}
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
                <Modal.Body>
                    <Form>
                        <Form.Group className="mb-3">
                            <Form.Label>Question Title</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="Enter question title"
                                value={questionTitle}
                                onChange={(e) => setQuestionTitle(e.target.value)}
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Question Text</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={4}
                                placeholder="Enter question text"
                                value={questionText}
                                onChange={(e) => setQuestionText(e.target.value)}
                            />
                        </Form.Group>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowGenerateQuestionModal(false)} disabled={generatingQuestion}>
                        Close
                    </Button>
                    <Button 
                        variant="primary" 
                        onClick={async () => {
                            if (!questionTitle || !questionText) {
                                toast.error('Title and question text are required');
                                return;
                            }
                            setGeneratingQuestion(true);
                            try {
                                // Add your API call here to generate question
                                // const res = await axiosInstance.post('/engagements/questions/generate', {
                                //     title: questionTitle,
                                //     text: questionText,
                                //     trackId: trackId
                                // });
                                toast.success('Question generated successfully');
                                setQuestionTitle('');
                                setQuestionText('');
                                setShowGenerateQuestionModal(false);
                            } catch (e) {
                                toast.error(e?.response?.data?.message || 'Failed to generate question');
                            } finally {
                                setGeneratingQuestion(false);
                            }
                        }}
                        disabled={generatingQuestion}
                    >
                        <i className="feather icon-save mr-1"></i> {generatingQuestion ? 'Generating...' : 'Generate'}
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );
};

export default EngagementSessionsPage;
