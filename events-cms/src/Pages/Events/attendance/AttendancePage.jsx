import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { useSelector, useDispatch } from 'react-redux';
import * as $ from 'jquery';
import { getRegisteredParticipantsWithAttendance, eventById } from '../../../store/actions/eventActions';
import { EVENT_PATHS } from '../../../utils/constants';
import 'bootstrap/dist/css/bootstrap.min.css';

// @ts-ignore
$.DataTable = require('datatables.net-bs');

function atable(participants) {
    let tableZero = '#data-table-zero';
    $.fn.dataTable.ext.errMode = 'throw';

    // Destroy existing table if it exists
    if ($.fn.DataTable.isDataTable(tableZero)) {
        $(tableZero).DataTable().clear().destroy();
    }

    const dataTableInstance = $(tableZero).DataTable({
        data: participants || [],
        order: [[0, 'asc']], // Sort by # column
        searching: true,
        searchDelay: 500,
        pageLength: 10,
        lengthMenu: [
            [5, 10, 25, 50, 100],
            [5, 10, 25, 50, 100]
        ],
        pagingType: 'full_numbers',
        dom:
            "<'row mb-3'<'col-sm-12 col-md-6'l><'col-sm-12 col-md-6'f>>" +
            "<'row'<'col-sm-12'tr>>" +
            "<'row'<'col-sm-12 col-md-5'i><'col-sm-12 col-md-7'p>>",
        columns: [
            {
                data: null,
                title: '#',
                render: function (data, type, row, meta) {
                    return meta.row + 1;
                }
            },
            {
                data: null,
                title: 'Name',
                render: function (data, type, row) {
                    return `
                        <div>
                            <strong>${row.firstName || ''} ${row.lastName || ''}</strong>
                        </div>
                    `;
                }
            },
            {
                data: 'email',
                title: 'Email',
                render: function (data, type, row) {
                    return `<div>${row.email || 'N/A'}</div>`;
                }
            },
            {
                data: 'company',
                title: 'Company',
                render: function (data, type, row) {
                    return `<div>${row.company || 'N/A'}</div>`;
                }
            },
            {
                data: 'type',
                title: 'Type',
                render: function (data, type, row) {
                    const typeLower = (row.type || 'Attendee').toLowerCase();
                    const bgColor = typeLower === 'exhibitor' 
                        ? 'background-color:rgb(162, 209, 231); padding: 6px 12px; border-radius: 4px; color:rgb(14, 13, 13); font-weight: 500;'
                        : 'background-color:rgb(223, 228, 165); padding: 6px 12px; border-radius: 4px; color:rgb(14, 13, 13); font-weight: 500;';
                    return `<div class="text-wrap" style="max-width: 200px;">
                        <span style="${bgColor}">${row.type || 'Attendee'}</span>
                    </div>`;
                }
            },
            {
                data: 'registeredAt',
                title: 'Registered At',
                render: function (data, type, row) {
                    if (!row.registeredAt) return 'N/A';
                    const date = new Date(row.registeredAt);
                    return date.toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    });
                }
            },
            {
                data: 'hasMarkedAttendance',
                title: 'Attendance Status',
                render: function (data, type, row) {
                    if (row.hasMarkedAttendance) {
                        return `<span class="badge badge-success">
                            <i class="fas fa-check mr-1"></i>Attended
                        </span>`;
                    } else {
                        return `<span class="badge badge-danger">
                            <i class="fas fa-times mr-1"></i>Not Attended
                        </span>`;
                    }
                }
            },
            {
                data: 'checkInTime',
                title: 'Check-In Time',
                render: function (data, type, row) {
                    if (!row.checkInTime) return '<span class="text-muted">-</span>';
                    const date = new Date(row.checkInTime);
                    return date.toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    });
                }
            },
            {
                data: 'checkInMethod',
                title: 'Check-In Method',
                render: function (data, type, row) {
                    if (!row.checkInMethod) return '<span class="text-muted">-</span>';
                    const method = row.checkInMethod === 'qr_code' 
                        ? '<i class="fas fa-qrcode mr-1"></i>QR Code'
                        : '<i class="fas fa-hand-pointer mr-1"></i>Manual';
                    return `<span class="badge badge-info">${method}</span>`;
                }
            },
            {
                data: 'luckyDrawNumber',
                title: 'Lucky Draw Number',
                render: function (data, type, row) {
                    if (!row.luckyDrawNumber) return '<span class="text-muted">-</span>';
                    return `<span class="badge badge-warning" style="font-size: 14px; font-weight: bold; padding: 8px 12px;">
                        <i class="fas fa-gift mr-1"></i>${row.luckyDrawNumber}
                    </span>`;
                }
            }
        ]
    });

    return dataTableInstance;
}

const AttendancePage = () => {
    const { eventId } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    
    // Get data from Redux store
    const attendanceData = useSelector((state) => state.event?.registeredParticipantsWithAttendance);
    const loading = useSelector((state) => state.event?.attendanceLoading || false);
    const eventData = useSelector((state) => state.event?.eventByID);
    
    const [participants, setParticipants] = useState([]);
    const [summary, setSummary] = useState({
        totalRegistered: 0,
        totalAttended: 0,
        totalNotAttended: 0,
        attendanceRate: 0
    });
    const [eventInfo, setEventInfo] = useState(null);
    const tableRef = useRef(null);

    useEffect(() => {
        if (eventId) {
            dispatch(getRegisteredParticipantsWithAttendance(eventId));
            dispatch(eventById(eventId));
        }
    }, [eventId, dispatch]);

    // Update local state when Redux data changes
    useEffect(() => {
        if (attendanceData) {
            setParticipants(attendanceData.participants || []);
            setSummary(attendanceData.summary || {
                totalRegistered: 0,
                totalAttended: 0,
                totalNotAttended: 0,
                attendanceRate: 0
            });
        }
    }, [attendanceData]);

    // Update event info when Redux data changes
    useEffect(() => {
        if (eventData?.data) {
            setEventInfo(eventData.data);
        } else if (eventData) {
            setEventInfo(eventData);
        }
    }, [eventData]);

    useEffect(() => {
        if (participants.length > 0 && !loading) {
            // Initialize DataTable when participants are loaded
            const dt = atable(participants);
            tableRef.current = dt;
        }

        // Cleanup function
        return () => {
            if (tableRef.current) {
                try {
                    tableRef.current.destroy();
                } catch (e) {
                    // Ignore destroy errors
                }
                tableRef.current = null;
            }
        };
    }, [participants, loading]);


    const handleBack = () => {
        navigate(EVENT_PATHS.REGISTERED_EVENTS);
    };

    return (
        <Container fluid className="mt-4">
            {/* Header */}
            <Card className="mb-4">
                <Card.Body>
                    <div className="d-flex justify-content-between align-items-center">
                        <div>
                            <h4 className="card-title mb-1">
                                <i className="fas fa-clipboard-check mr-2" style={{ color: '#4680ff' }}></i>
                                Attendance Tracking
                            </h4>
                            {eventInfo && (
                                <p className="text-muted mb-0">{eventInfo.name}</p>
                            )}
                        </div>
                        <Button variant="secondary" onClick={handleBack}>
                            <i className="fas fa-arrow-left mr-2"></i>
                            Back
                        </Button>
                    </div>
                </Card.Body>
            </Card>

            {/* Summary Cards */}
            <Row className="mb-4">
                <Col md={3}>
                    <Card className="text-center">
                        <Card.Body>
                            <i className="fas fa-users fa-2x text-primary mb-2"></i>
                            <h5 className="mb-1">{summary.totalRegistered}</h5>
                            <p className="text-muted mb-0">Registered Participants</p>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={3}>
                    <Card className="text-center">
                        <Card.Body>
                            <i className="fas fa-check-circle fa-2x text-success mb-2"></i>
                            <h5 className="mb-1">{summary.totalAttended}</h5>
                            <p className="text-muted mb-0">Marked Attendance</p>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={3}>
                    <Card className="text-center">
                        <Card.Body>
                            <i className="fas fa-times-circle fa-2x text-danger mb-2"></i>
                            <h5 className="mb-1">{summary.totalNotAttended}</h5>
                            <p className="text-muted mb-0">Not Attended</p>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={3}>
                    <Card className="text-center">
                        <Card.Body>
                            <i className="fas fa-percentage fa-2x text-info mb-2"></i>
                            <h5 className="mb-1">{summary.attendanceRate.toFixed(1)}%</h5>
                            <p className="text-muted mb-0">Attendance Rate</p>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Participants Table */}
            <Card>
                <Card.Header>
                    <h5 className="mb-0">
                        <i className="fas fa-list mr-2"></i>
                        Participants List ({participants.length})
                    </h5>
                </Card.Header>
                <Card.Body>
                    <div className="table-responsive">
                        <table id="data-table-zero" className="table table-striped table-bordered table-hover" style={{ width: '100%' }}></table>
                    </div>
                </Card.Body>
            </Card>
        </Container>
    );
};

export default AttendancePage;

