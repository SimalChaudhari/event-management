import * as React from 'react';
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import 'bootstrap/dist/css/bootstrap.min.css';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Table from 'react-bootstrap/Table';
import Button from 'react-bootstrap/Button';
import * as $ from 'jquery';
import { getAllTracks, getSessionsByTrack } from '../../store/actions/programmeActions';
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

    const { tracks, trackSessions: allTrackSessions } = useSelector((state) => state.programme);

    const [trackSessions, setTrackSessions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        dispatch(getAllTracks());
        if (trackId) {
            dispatch(getSessionsByTrack(trackId));
        }
    }, [dispatch, trackId]);

    useEffect(() => {
        if (trackId && allTrackSessions[trackId]) {
            setTrackSessions(allTrackSessions[trackId]);
            setIsLoading(false);
        } else if (trackId && !allTrackSessions[trackId]) {
            setIsLoading(true);
        }
    }, [allTrackSessions, trackId]);

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
                            data: 'sessionDate',
                            title: 'Date & Time',
                            render: function (data, type, row) {
                                const dateStr = data ? formatDate(data) : 'N/A';
                                const timeStr = row.startTime && row.endTime 
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
                            data: 'createdAt',
                            title: 'Created Date',
                            render: function (data) {
                                return data ? formatDate(data) : 'N/A';
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
                        // Navigate to common programme session view for detailed view
                        const eventId = session.track && session.track.eventId ? session.track.eventId : (session.track && session.track.event && session.track.event.id);
                        if (eventId) {
                            navigate(`/programme/view-session/${session.id}?eventId=${eventId}`);
                        } else {
                            navigate(`/programme/view-session/${session.id}`);
                        }
                    }
                });

                
                $(document).off('click', '.qa-btn').on('click', '.qa-btn', function () {
                    const dtLocal = $('#engagement-sessions-table').DataTable();
                    const rowData = dtLocal.row($(this).closest('tr')).data() || {};
                    const sessionId = rowData.sessionId || rowData.id;
                    navigate(`${ENGAGEMENT_PATHS.QA}?sessionId=${sessionId}`);
                });

            }, 100);
        }

        return () => {
            if ($.fn.DataTable.isDataTable('#engagement-sessions-table')) {
                $('#engagement-sessions-table').DataTable().destroy();
            }
        };
    }, [trackSessions, navigate, isLoading]);

    const handleBack = () => {
        navigate(-1);
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
                                            <th>Created Date</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                </Table>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </>
    );
};

export default EngagementSessionsPage;


