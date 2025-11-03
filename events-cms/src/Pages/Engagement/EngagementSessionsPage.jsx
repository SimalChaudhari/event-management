import * as React from 'react';
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import 'bootstrap/dist/css/bootstrap.min.css';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Table from 'react-bootstrap/Table';
import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';
import Button from 'react-bootstrap/Button';
import * as $ from 'jquery';
import { getAllTracks } from '../../store/actions/programmeActions';
import { getEngagementsByTrack, toggleEngagementSessionStatus } from '../../store/actions/engagementActions';
import axiosInstance from '../../configs/axiosInstance';
import { toast } from 'react-toastify';
import { ENGAGEMENT_PATHS } from '../../utils/constants';
import DeleteConfirmationModal from '../../components/modal/DeleteConfirmationModal';
import '../../assets/css/event.css';

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
    const { trackEngagements } = useSelector((state) => state.engagement);

    const [trackSessions, setTrackSessions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showPollingModal, setShowPollingModal] = useState(false);
    const [activeSession, setActiveSession] = useState(null);
    const [pollingTitle, setPollingTitle] = useState('');
    const [pollingUrl, setPollingUrl] = useState('');
    const [pollingLinkId, setPollingLinkId] = useState(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        dispatch(getAllTracks());
        if (trackId) {
            // Use engagement API instead of programme API to get filtered sessions
            dispatch(getEngagementsByTrack(trackId));
        }
    }, [dispatch, trackId]);

    useEffect(() => {
        if (trackId && trackEngagements && trackEngagements[trackId]) {
            // Get engagements for this track from trackEngagements
            const engagementsForTrack = trackEngagements[trackId];
            
            if (engagementsForTrack && engagementsForTrack.length > 0) {
                // Get the first engagement (should only be one per track)
                const engagementData = engagementsForTrack[0];
                
                // Extract sessions from programmeTracks
                const programmeTracks = engagementData?.programmeTracks || [];
                const trackData = programmeTracks.find(t => 
                    t.trackId === trackId || t.id === trackId
                );
                
                // Get filtered sessions (already filtered by backend based on sessionIds)
                const sessions = trackData?.sessions || [];
                
                setTrackSessions(sessions);
                setIsLoading(false);
            } else {
                // No engagement found for this track
                setTrackSessions([]);
                setIsLoading(false);
            }
        } else if (trackId) {
            setIsLoading(true);
        }
    }, [trackEngagements, trackId]);

    const handleToggleSessionStatus = React.useCallback(async (sessionId, session) => {
        try {
            const currentIsActive = session.isActive !== undefined ? session.isActive : true;
            const newIsActive = !currentIsActive;
            
            // Optimistic update - update local state and DataTable immediately
            setTrackSessions(prevSessions => 
                prevSessions.map(s => 
                    s.id === sessionId ? { ...s, isActive: newIsActive } : s
                )
            );
            
            // Update DataTable directly
            setTimeout(() => {
                const dt = $('#engagement-sessions-table').DataTable();
                if (dt) {
                    dt.rows().every(function() {
                        const rowData = this.data();
                        if (rowData && rowData.id === sessionId) {
                            const updatedData = { ...rowData, isActive: newIsActive };
                            this.data(updatedData);
                            return false; // Stop iteration
                        }
                        return true;
                    });
                    dt.draw(false);
                }
            }, 0);
            
            // Call engagement session toggle API - only one API call
            const result = await dispatch(toggleEngagementSessionStatus(sessionId));
            if (result && !result.error) {
                // Success message already shown by action
            } else {
                // Revert on error
                setTrackSessions(prevSessions => 
                    prevSessions.map(s => 
                        s.id === sessionId ? { ...s, isActive: currentIsActive } : s
                    )
                );
                setTimeout(() => {
                    const dt = $('#engagement-sessions-table').DataTable();
                    if (dt) {
                        dt.rows().every(function() {
                            const rowData = this.data();
                            if (rowData && rowData.id === sessionId) {
                                this.data(session);
                                return false;
                            }
                            return true;
                        });
                        dt.draw(false);
                    }
                }, 0);
                toast.error('Failed to toggle session status');
            }
        } catch (error) {
            console.error('Error toggling session status:', error);
            toast.error('Failed to toggle session status');
        }
    }, [dispatch]);

    useEffect(() => {
        if (trackSessions.length >= 0 && !isLoading) {
            setTimeout(() => {
                if ($.fn.DataTable.isDataTable('#engagement-sessions-table')) {
                    $('#engagement-sessions-table').DataTable().destroy();
                }

                const dt = $('#engagement-sessions-table').DataTable({
                    data: trackSessions || [],
                    order: [[0, 'asc']],
                    searching: true,
                    searchDelay: 500,
                    pageLength: 10,
                    lengthMenu: [
                        [5, 10, 25, 50, -1],
                        [5, 10, 25, 50, 'All']
                    ],
                    pagingType: 'full_numbers',
                    dom:
                        "<'row mb-3'<'col-sm-12 col-md-6'l><'col-sm-12 col-md-6 d-flex justify-content-end align-items-center'<'search-container'f>>>'" +
                        "<'row'<'col-sm-12'tr>>" +
                        "<'row'<'col-sm-12 col-md-5'i><'col-sm-12 col-md-7'p>>",
                    columns: [
                        {
                            data: 'title',
                            title: 'Session',
                            render: function (data, type, row) {
                                const speakers = row.speakers && row.speakers.length > 0
                                    ? row.speakers.map(s => s.name).join(', ')
                                    : 'TBA';
                                return `
                                    <div class="d-inline-block align-middle">
                                        <div class="d-inline-block">
                                            <h6 class="m-b-0">${data}</h6>
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
                            data: null,
                            title: 'Date & Time',
                            render: function (data, type, row) {
                                // Use startDate for the date display
                                const dateStr = row.startDate ? formatDate(row.startDate) : 'N/A';
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
                                // Check isActive from row data
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
                                console.log(row);
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
                    ],
                });

                $(document).off('click', '.view-btn').on('click', '.view-btn', function () {
                    const sessionId = $(this).data('id');
                    console.log(sessionId);
                    const session = trackSessions.find((s) => s.id === sessionId);
                    if (session) {
                        // Navigate to engagement session view page (dedicated page for engagement)
                        const eventId = session.track && session.track.eventId ? session.track.eventId : (session.track && session.track.event && session.track.event.id);
                        if (eventId) {
                            navigate(`${ENGAGEMENT_PATHS.VIEW_SESSION}/${session.id}?eventId=${eventId}`);
                        } else {
                            navigate(`${ENGAGEMENT_PATHS.VIEW_SESSION}/${session.id}`);
                        }
                    }
                });

                
                $(document).off('click', '.qa-btn').on('click', '.qa-btn', function () {
                    const dtLocal = $('#engagement-sessions-table').DataTable();
                    const rowData = dtLocal.row($(this).closest('tr')).data() || {};
                    const sessionId = rowData.sessionId || rowData.id;
                    navigate(`${ENGAGEMENT_PATHS.QA}?sessionId=${sessionId}`);
                });

                $(document).off('click', '.polling-btn').on('click', '.polling-btn', async function () {
                    const dtLocal = $('#engagement-sessions-table').DataTable();
                    const rowData = dtLocal.row($(this).closest('tr')).data() || {};
                    const sessionId = rowData.sessionId || rowData.id;
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
                });

                $(document).off('click', '.toggle-session-status-badge').on('click', '.toggle-session-status-badge', function () {
                    const sessionId = $(this).data('id');
                    const session = trackSessions.find((s) => s.id === sessionId);
                    if (session) {
                        handleToggleSessionStatus(sessionId, session);
                    }
                });

            }, 100);
        }

        return () => {
            if ($.fn.DataTable.isDataTable('#engagement-sessions-table')) {
                $('#engagement-sessions-table').DataTable().destroy();
            }
        };
    }, [trackSessions, navigate, isLoading, handleToggleSessionStatus]);

    const handleBack = () => {
        navigate(-1);
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
                                <Button variant="secondary" onClick={handleBack}>
                                    <i className="feather icon-arrow-left mr-1"></i>
                                    Back
                                </Button>
                            </div>
                        </Card.Header>
                        <Card.Body>
                            {isLoading ? (
                                <div className="text-center py-5">
                                    <div className="spinner-border text-primary" role="status">
                                        <span className="sr-only">Loading sessions...</span>
                                    </div>
                                    <p className="mt-2">Loading sessions...</p>
                                </div>
                            ) : (
                                <Table striped hover responsive id="engagement-sessions-table">
                                    <thead>
                                        <tr>
                                            <th>Session</th>
                                            <th>Date & Time</th>
                                            <th>Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                </Table>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
            <Modal show={showPollingModal} onHide={() => setShowPollingModal(false)} centered>
                <Modal.Header>
                    <Modal.Title>Session Polling Link</Modal.Title>
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
        </>
    );
};

// Modal JSX appended within the component above return - ensure it's inside the component

export default EngagementSessionsPage;


