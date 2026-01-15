import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Row, Col, Card, Table, Button, Badge } from 'react-bootstrap';
import { useDispatch } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import * as $ from 'jquery';
import axiosInstance from '../../configs/axiosInstance';
import { API_URL, DUMMY_PATH } from '../../configs/env';
import { formatDateTimeForTable } from '../../components/dateTime/dateTimeUtils';
import usePersistedTablePage from '../../hooks/usePersistedTablePage';
import { initializeServerSideDataTable } from '../../utils/dataTableServerSide';
import { TRANSACTION_PATHS, EXHIBITOR_PATHS, USER_PATHS } from '../../utils/constants';

// @ts-ignore
$.DataTable = require('datatables.net-bs');

const ViewExhibitorAttendeesPage = () => {
    const dispatch = useDispatch();
    const { eventId, exhibitorId } = useParams();
    const navigate = useNavigate();
    const [exhibitorData, setExhibitorData] = useState(null);
    const tableRef = useRef(null);
    const [currentTable, setCurrentTable] = useState(null);

    // Use pagination persistence hook
    const { restoreTablePage } = usePersistedTablePage();

    // Load exhibitor data
    useEffect(() => {
        const loadData = async () => {
            try {
                if (exhibitorId) {
                    const exhibitorResponse = await axiosInstance.get(`/exhibitors/${exhibitorId}`);
                    setExhibitorData(exhibitorResponse.data?.data || exhibitorResponse.data);
                }
            } catch (error) {
                console.error('Failed to load exhibitor data:', error);
            }
        };
        if (exhibitorId) {
            loadData();
        }
    }, [exhibitorId]);

    const handleUserClick = useCallback(
        (userId) => {
            if (userId) {
                navigate(`${USER_PATHS.VIEW_USER}/${userId}`);
            }
        },
        [navigate]
    );

    const destroyTable = useCallback(() => {
        if (tableRef.current) {
            tableRef.current.off('page.dt');
            const tableSelector = '#exhibitor-attendees-data-table';
            $(tableSelector).off('click', '.attendee-name-clickable');
            $(tableSelector).off('click', '.scanner-name-clickable');
            tableRef.current.destroy();
            tableRef.current = null;
            setCurrentTable(null);
        }
    }, []);

    const initializeTable = useCallback(() => {
        if (!eventId || !exhibitorId) return;

        destroyTable();
        try {
            const columns = [
                {
                    data: 'attendee',
                    title: 'Attendee Name',
                    orderable: true,
                    render: function (data, type, row) {
                        if (type === 'sort' || type === 'type') {
                            return `${row.attendee?.firstName || ''} ${row.attendee?.lastName || ''}`.trim() || '';
                        }
                        const attendeeName = `${row.attendee?.firstName || ''} ${row.attendee?.lastName || ''}`.trim() || 'N/A';
                        return `
                            <div class="d-inline-block align-middle">
                                <h6 class="m-b-0">
                                    <a href="${USER_PATHS.VIEW_USER}/${row.attendee?.id}" 
                                       class="attendee-name-clickable" 
                                       data-user-id="${row.attendee?.id}"
                                       style="color: #4680ff; cursor: pointer; text-decoration: none; font-weight: 500;"
                                       onmouseover="this.style.textDecoration='underline'"
                                       onmouseout="this.style.textDecoration='none'">
                                        ${attendeeName}
                                    </a>
                                </h6>
                                ${row.attendee?.email ? `<p class="m-b-0 text-muted small">${row.attendee.email}</p>` : ''}
                                ${row.attendee?.mobile ? `<p class="m-b-0 text-muted small">${row.attendee.mobile}</p>` : ''}
                            </div>
                        `;
                    }
                },
                {
                    data: 'attendee.company',
                    title: 'Company',
                    orderable: true,
                    render: function (data, type, row) {
                        return row.attendee?.company || 'N/A';
                    }
                },
                {
                    data: 'attendee.designation',
                    title: 'Designation',
                    orderable: true,
                    render: function (data, type, row) {
                        return row.attendee?.designation || 'N/A';
                    }
                },
                {
                    data: 'scanner',
                    title: 'Scanned By',
                    orderable: true,
                    render: function (data, type, row) {
                        if (type === 'sort' || type === 'type') {
                            return row.scanner ? `${row.scanner.firstName || ''} ${row.scanner.lastName || ''}`.trim() : '';
                        }
                        if (!row.scanner || !row.scanner.id) {
                            return 'N/A';
                        }
                        const scannerName = `${row.scanner.firstName || ''} ${row.scanner.lastName || ''}`.trim() || 'N/A';
                        return `
                            <div class="d-inline-block align-middle">
                                <a href="${USER_PATHS.VIEW_USER}/${row.scanner.id}" 
                                   class="scanner-name-clickable" 
                                   data-user-id="${row.scanner.id}"
                                   style="color: #4680ff; cursor: pointer; text-decoration: none; font-weight: 500;"
                                   onmouseover="this.style.textDecoration='underline'"
                                   onmouseout="this.style.textDecoration='none'">
                                    ${scannerName}
                                </a>
                                ${row.scanner.email ? `<p class="m-b-0 text-muted small">${row.scanner.email}</p>` : ''}
                            </div>
                        `;
                    }
                },
                {
                    data: 'collectedAt',
                    title: 'Scanned Date',
                    orderable: true,
                    render: function (data, type, row) {
                        if (type === 'sort' || type === 'type') {
                            return row.collectedAt ? new Date(row.collectedAt).getTime() : 0;
                        }
                        return row.collectedAt ? formatDateTimeForTable(row.collectedAt) : 'N/A';
                    }
                },
                {
                    data: 'notes',
                    title: 'Notes',
                    orderable: false,
                    render: function (data, type, row) {
                        return row.notes || 'N/A';
                    }
                }
            ];

            // Use function for ajaxParams to include eventId and exhibitorId
            const ajaxParams = () => {
                return {
                    eventId: eventId,
                    exhibitorId: exhibitorId
                };
            };

            const table = initializeServerSideDataTable({
                tableSelector: '#exhibitor-attendees-data-table',
                ajaxUrl: '/exhibitors/leads',
                ajaxMethod: 'GET',
                columns: columns,
                ajaxParams: ajaxParams,
                axiosInstance: axiosInstance,
                dispatch: dispatch,
                dom:
                    "<'row mb-3'<'col-sm-12 col-md-6'l><'col-sm-12 col-md-6 d-flex justify-content-end align-items-center'<'search-container'f>>>" +
                    "<'row'<'col-sm-12'tr>>" +
                    "<'row'<'col-sm-12 col-md-5'i><'col-sm-12 col-md-7'p>>",
                pageLength: 10,
                lengthMenu: [
                    [5, 10, 25, 50, -1],
                    [5, 10, 25, 50, 'All']
                ],
                order: [[4, 'desc']], // Default sort by Scanned Date DESC
                restoreTablePage: restoreTablePage,
                initCompleteCallback: function (settings, json, api) {
                    // Add event listener for clickable attendee names
                    $(settings.nTable)
                        .off('click', '.attendee-name-clickable')
                        .on('click', '.attendee-name-clickable', function (e) {
                            e.preventDefault();
                            e.stopPropagation();
                            const userId = $(this).data('user-id');
                            if (userId && handleUserClick) {
                                handleUserClick(userId);
                            }
                        });

                    // Add event listener for clickable scanner names
                    $(settings.nTable)
                        .off('click', '.scanner-name-clickable')
                        .on('click', '.scanner-name-clickable', function (e) {
                            e.preventDefault();
                            e.stopPropagation();
                            const userId = $(this).data('user-id');
                            if (userId && handleUserClick) {
                                handleUserClick(userId);
                            }
                        });
                }
            });

            tableRef.current = table;
            setCurrentTable(table);
        } catch (error) {
            console.error('Error initializing exhibitor attendees table:', error);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [destroyTable, handleUserClick, restoreTablePage, dispatch, eventId, exhibitorId]);

    useEffect(() => {
        initializeTable();
        return () => {
            destroyTable();
        };
    }, [initializeTable, destroyTable]);

    return (
        <>
            {/* Header */}
            <Row className="mb-3">
                <Col sm={12}>
                    <Card>
                        <Card.Body>
                            <div className="d-flex flex-column flex-md-row justify-content-between align-items-start" style={{ gap: 'clamp(12px, 3vw, 16px)' }}>
                                <div style={{ width: '100%', flex: '1 1 auto' }}>
                                    {exhibitorData && (
                                        <span className="badge badge-light-info" style={{ fontSize: 'clamp(14px, 2.5vw, 16px)', fontWeight: '600', padding: 'clamp(6px, 1.5vw, 8px) clamp(12px, 2.5vw, 16px)' }}>
                                            <span style={{ fontSize: 'clamp(14px, 2.5vw, 16px)', fontWeight: '600' }}>
                                                {exhibitorData.companyName || 'N/A'}
                                            </span>
                                            <i className="fas fa-check-circle text-success" style={{ marginLeft: 'clamp(6px, 1.5vw, 8px)' }}></i>
                                        </span>
                                    )}
                                </div>
                                <Button
                                    variant="secondary"
                                    onClick={() => navigate(-1)}
                                    className="d-flex align-items-center"
                                    style={{ flexShrink: 0, marginTop: '0', alignSelf: 'flex-start' }}
                                >
                                    <i className="fas fa-arrow-left"></i>
                                    <span className="d-none d-md-inline" style={{ marginLeft: '8px' }}>
                                        Back
                                    </span>
                                </Button>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Attendees Table */}
            <Row>
                <Col sm={12} className="btn-page">
                    <Card className="event-list">
                        <Card.Body>
                            <Table striped hover responsive id="exhibitor-attendees-data-table">
                                <thead>
                                    <tr>
                                        <th>Attendee Name</th>
                                        <th>Company</th>
                                        <th>Designation</th>
                                        <th>Scanned By</th>
                                        <th>Scanned Date</th>
                                        <th>Notes</th>
                                    </tr>
                                </thead>
                                <tbody></tbody>
                            </Table>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </>
    );
};

export default ViewExhibitorAttendeesPage;
