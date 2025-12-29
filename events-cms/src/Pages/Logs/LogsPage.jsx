import * as React from 'react';
import { useEffect, useRef } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Table from 'react-bootstrap/Table';
import { useDispatch } from 'react-redux';
import * as $ from 'jquery';
import { exportLogRecipients } from '../../store/actions/logsActions';
import '../../assets/css/event.css';
import usePersistedTablePage from '../../hooks/usePersistedTablePage';
import { initializeServerSideDataTable } from '../../utils/dataTableServerSide';
import axiosInstance from '../../configs/axiosInstance';
import { LOGS_LOADING } from '../../store/constants/actionTypes';

// @ts-ignore
$.DataTable = require('datatables.net-bs');

const LogsPage = () => {
    const dispatch = useDispatch();
    const tableRef = useRef(null);

    // Use pagination persistence hook
    const { restoreTablePage } = usePersistedTablePage();

    const handleExport = React.useCallback(
        (sessionId) => {
            dispatch(exportLogRecipients(sessionId));
        },
        [dispatch]
    );

    useEffect(() => {
        const columns = [
            {
                data: 'createdAt',
                title: 'Date/Time',
                render: function (data, type, row) {
                    if (type === 'sort' || type === 'type') {
                        return data || '';
                    }
                    const date = new Date(data).toLocaleString('en-IN', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                    });
                    return `<div class="font-weight-bold">${date}</div>`;
                }
            },
            {
                data: 'fileName',
                title: 'File Name',
                render: function (data, type, row) {
                    if (type === 'sort' || type === 'type') {
                        return data || '';
                    }
                    return `<div class="font-weight-bold">${data || 'N/A'}</div>`;
                }
            },
            {
                data: 'status',
                title: 'Status',
                render: function (data, type, row) {
                    if (type === 'sort' || type === 'type') {
                        return data || '';
                    }
                    const variants = {
                        completed: 'success',
                        processing: 'warning',
                        failed: 'danger',
                        partial: 'info'
                    };
                    const variant = variants[data] || 'secondary';
                    return `<span class="badge badge-${variant}">${(data || '').toUpperCase()}</span>`;
                }
            },
            {
                data: 'recordsProcessed',
                title: 'Records',
                orderable: false,
                render: function (data, type, row) {
                    let html = `<div class="font-weight-bold">${data || 0}/${row.totalRecords || 0}</div>`;
                    if (row.recordsSkipped > 0) {
                        html += `<small class="text-warning">+${row.recordsSkipped} skipped</small>`;
                    }
                    return html;
                }
            },
            {
                data: 'newUsersCreated',
                title: 'Users Created',
                orderable: false,
                render: function (data, type, row) {
                    return `<span class="text-success font-weight-bold">${data || 0}</span>`;
                }
            },
            {
                data: 'emailsSent',
                title: 'Emails Sent',
                orderable: false,
                render: function (data, type, row) {
                    let html = `<span class="text-info font-weight-bold">${data || 0}</span>`;
                    if (row.emailsFailed > 0) {
                        html += `<div class="text-danger small">${row.emailsFailed} failed</div>`;
                    }
                    return html;
                }
            },
            {
                data: 'processingTimeMs',
                title: 'Duration',
                orderable: false,
                render: function (data, type, row) {
                    const duration = data < 1000 ? `${data}ms` : `${(data / 1000).toFixed(2)}s`;
                    return `<span class="font-weight-bold">${duration || 'N/A'}</span>`;
                }
            },
            {
                data: 'sessionId',
                title: 'Action',
                orderable: false,
                render: function (data, type, row) {
                    return `
                        <button 
                            class="btn btn-sm btn-outline-primary export-btn" 
                            data-session="${row.sessionId || ''}"
                        >
                            Export
                        </button>
                    `;
                }
            }
        ];

        // Initialize server-side DataTable
        tableRef.current = initializeServerSideDataTable({
            tableSelector: '#logs-data-table',
            ajaxUrl: '/logs/csv-upload',
            ajaxMethod: 'GET',
            columns: columns,
            ajaxParams: {},
            axiosInstance: axiosInstance,
            dispatch: dispatch,
            loadingActionType: LOGS_LOADING,
            dom: "<'row mb-3'<'col-sm-12 col-md-6'l><'col-sm-12 col-md-6 d-flex justify-content-end align-items-center'<'search-container'f>>>" +
                 "<'row'<'col-sm-12'tr>>" +
                 "<'row'<'col-sm-12 col-md-5'i><'col-sm-12 col-md-7'p>>",
            pageLength: 10,
            lengthMenu: [[5, 10, 25, 50, -1], [5, 10, 25, 50, 'All']],
            order: [[0, 'desc']], // Sort by Date/Time column (index 0) in descending order
            onDataLoaded: (data, metadata) => {
                // Optional: Handle data if needed
            },
            restoreTablePage: restoreTablePage,
            initCompleteCallback: function (settings, json, api) {
                // Attach event listeners for actions
                $(settings.nTable).off('click', '.export-btn').on('click', '.export-btn', function () {
                    const sessionId = $(this).data('session');
                    if (sessionId) {
                        handleExport(sessionId);
                    } else {
                        console.error("Session ID is missing!");
                    }
                });
            }
        });

        return () => {
            if (tableRef.current) {
                tableRef.current.destroy();
                tableRef.current = null;
            }
        };
    }, []); // Only run once on mount

    return (
        <Row>
            <Col sm={12} className="btn-page">
                <Card className="event-list">
                    <Card.Body>
                        <Table striped hover responsive id="logs-data-table">
                            <thead>
                                <tr>
                                    <th>Date/Time</th>
                                    <th>File Name</th>
                                    <th>Status</th>
                                    <th>Records</th>
                                    <th>Users Created</th>
                                    <th>Emails Sent</th>
                                    <th>Duration</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                        </Table>
                    </Card.Body>
                </Card>
            </Col>
        </Row>
    );
};

export default LogsPage;
