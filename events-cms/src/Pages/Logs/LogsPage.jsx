import * as React from 'react';
import { useEffect, useState, useCallback } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Table from 'react-bootstrap/Table';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import * as $ from 'jquery';
import { getLogs, clearLogsError } from '../../store/actions/logsActions';
import '../../assets/css/event.css';

// @ts-ignore
$.DataTable = require('datatables.net-bs');

function logsTable(data, handleRefresh, handleViewDetails) {
    console.log('logsTable called with data:', data);
    console.log('Data length:', data?.length);

    let tableZero = '#logs-data-table';
    $.fn.dataTable.ext.errMode = 'throw';

    // Preserve the current page
    let currentPage = 0;
    if ($.fn.DataTable.isDataTable(tableZero)) {
        currentPage = $(tableZero).DataTable().page();
        $(tableZero).DataTable().clear().destroy();
    }

    $(tableZero).DataTable({
        data: data || [],
        order: [[0, 'desc']], // Sort by date descending
        searching: true,
        searchDelay: 500,
        pageLength: 5,
        lengthMenu: [
            [5, 10, 25, 50, -1],
            [5, 10, 25, 50, 'All']
        ],
        pagingType: 'full_numbers',
        dom:
            "<'row mb-3'<'col-sm-12 col-md-6'l><'col-sm-12 col-md-6 d-flex justify-content-end align-items-center'<'search-container'f><'refresh-button ml-2'>>>" +
            "<'row'<'col-sm-12'tr>>" +
            "<'row'<'col-sm-12 col-md-5'i><'col-sm-12 col-md-7'p>>",
        columns: [
            {
                data: 'createdAt',
                title: 'Date/Time',
                render: function (data, type, row) {
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
                    return `
                        <div class="font-weight-bold">${data}</div>
                      
                    `;
                }
            },
            {
                data: 'status',
                title: 'Status',
                render: function (data, type, row) {
                    const variants = {
                        completed: 'success',
                        processing: 'warning',
                        failed: 'danger',
                        partial: 'info'
                    };
                    const variant = variants[data] || 'secondary';
                    return `<span class="badge badge-${variant}">${data.toUpperCase()}</span>`;
                }
            },
            {
                data: 'recordsProcessed',
                title: 'Records',
                render: function (data, type, row) {
                    let html = `<div class="font-weight-bold">${data}/${row.totalRecords}</div>`;
                    if (row.recordsSkipped > 0) {
                        html += `<small class="text-warning">+${row.recordsSkipped} skipped</small>`;
                    }
                    return html;
                }
            },
            {
                data: 'newUsersCreated',
                title: 'Users Created',
                render: function (data, type, row) {
                    return `<span class="text-success font-weight-bold">${data}</span>`;
                }
            },
            {
                data: 'emailsSent',
                title: 'Emails Sent',
                render: function (data, type, row) {
                    let html = `<span class="text-info font-weight-bold">${data}</span>`;
                    if (row.emailsFailed > 0) {
                        html += `<div class="text-danger small">${row.emailsFailed} failed</div>`;
                    }
                    return html;
                }
            },
            {
                data: 'processingTimeMs',
                title: 'Duration',
                render: function (data, type, row) {
                    const duration = data < 1000 ? `${data}ms` : `${(data / 1000).toFixed(2)}s`;
                    return `<span class="font-weight-bold">${duration}</span>`;
                }
            },
        
        ],
        initComplete: function (settings, json) {
            // Add refresh button
            if (!$('#refreshBtn').length) {
                $('.refresh-button').html(`
                    <button class="btn btn-primary d-flex align-items-center ml-2" id="refreshBtn">
                        <i class="fas fa-sync-alt mr-1"></i>
                        Refresh
                    </button>
                `);

                $('#refreshBtn').on('click', handleRefresh);
            }
        }
    });

    // Restore the page
    $(tableZero).DataTable().page(currentPage).draw(false);

    // Attach event listeners for actions
    $(document).on('click', '.view-btn', function () {
        const logId = $(this).data('id');

        const logData = data.find((log) => log.id === logId);

        if (logData) {
            handleViewDetails(logData);
        } else {
            console.error('Log data not found for ID:', logId);
        }
    });

    return $(tableZero).DataTable();
}

const LogsPage = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    // Redux state
    const { logs, pagination, loading, error } = useSelector((state) => {
        console.log('Redux state.logs:', state.logs);
        return state.logs;
    });

    const [currentTable, setCurrentTable] = useState(null);

    const handleLogClick = useCallback(
        (log) => {
            console.log('handleLogClick called with log:', log);
            navigate(`/logs/${log.sessionId}`);
        },
        [navigate]
    );

    const handleRefreshLogs = useCallback(() => {
        dispatch(
            getLogs({
                page: 1,
                limit: 1000
            })
        );
    }, [dispatch]);

    const destroyTable = useCallback(() => {
        if (currentTable) {
            $('#logs-data-table').off('click', '.view-btn');
            currentTable.destroy();
            setCurrentTable(null);
        }
    }, [currentTable]);

    useEffect(() => {
        console.log('Fetching logs data...');
        dispatch(
            getLogs({
                page: 1,
                limit: 1000 // Get all logs for DataTables
            })
        );
    }, [dispatch]);

    // Clear error and destroy table when component unmounts
    useEffect(() => {
        return () => {
            dispatch(clearLogsError());
            if (currentTable) {
                $('#logs-data-table').off('click', '.view-btn');
                currentTable.destroy();
            }
        };
    }, [dispatch, currentTable]);

    // Initialize table when logs data changes
    useEffect(() => {
        console.log('Logs data changed:', logs);
        console.log('Logs length:', logs?.length);

        if (logs && logs.length >= 0) {
            // Destroy existing table first
            if (currentTable) {
                $('#logs-data-table').off('click', '.view-btn');
                currentTable.destroy();
            }

            // Create new table
            console.log('Creating table with logs:', logs);
            const table = logsTable(logs, handleRefreshLogs, handleLogClick);
            setCurrentTable(table);
        }
    }, [logs, handleRefreshLogs, handleLogClick]);

    console.log('Rendering LogsPage - loading:', loading, 'error:', error, 'logs:', logs);

    if (loading) {
        return (
            <div className="text-center py-5">
                <div className="spinner-border" role="status">
                    <span className="sr-only">Loading...</span>
                </div>
                <p className="mt-3">Loading logs...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="alert alert-danger" role="alert">
                Error loading logs: {error}
            </div>
        );
    }

    return (
        <>
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
                                      
                                    </tr>
                                </thead>
                            </Table>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </>
    );
};

export default LogsPage;
