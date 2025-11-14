import * as React from 'react';
import { useEffect, useCallback, useRef } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Table from 'react-bootstrap/Table';
import { useSelector, useDispatch } from 'react-redux';
import * as $ from 'jquery';
import { getLogs, clearLogsError, exportLogRecipients } from '../../store/actions/logsActions';
import '../../assets/css/event.css';
import usePersistedTablePage from '../../hooks/usePersistedTablePage';

// @ts-ignore
$.DataTable = require('datatables.net-bs');


function logsTable(
    data,
    handleRefresh,
    handleExport,
    restoreTablePage
) {
    console.log('logsTable called with data:', data);
    console.log('Data length:', data?.length);

    let tableZero = '#logs-data-table';
    $.fn.dataTable.ext.errMode = 'throw';

    const existingTable = $.fn.DataTable.isDataTable(tableZero) ? $(tableZero).DataTable() : null;
    if (existingTable) {
        existingTable.destroy();
    }

    const normalizedData = Array.isArray(data)
        ? data.map((log) => ({
              ...log,
              id: log?.id || log?.sessionId || log?.createdAt || ''
          }))
        : [];

    const dataTableInstance = $(tableZero).DataTable({
        data: normalizedData,
        rowId: 'id',
        order: [[0, 'desc']], // Sort by date descending
        searching: true,
        searchDelay: 500,
        pageLength: 5,
        lengthMenu: [
            [5, 10, 25, 50, -1],
            [5, 10, 25, 50, 'All']
        ],
        pagingType: 'full_numbers',
        paging: true,
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
            {
                data: 'sessionId',
                title: 'Action',
                render: function (data, type, row) {
                    return `
                        <button 
                            class="btn btn-sm btn-outline-primary export-btn" 
                            data-session="${row.sessionId}"
                        >
                            Export
                        </button>
                    `;
                }
            }
            
        
        ],
        initComplete: function () {
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

            if (typeof restoreTablePage === 'function') {
                const api = this.api();
                restoreTablePage(api);
            }
        }
    });

    const tableSelector = `${tableZero} tbody`;
    $(tableSelector).off('click', '.export-btn').on('click', '.export-btn', function () {
        const sessionId = $(this).data('session');
    
        if (!sessionId) {
            console.error("Session ID is missing!");
            return;
        }
    
        handleExport(sessionId);
    });

    return dataTableInstance;
}

const LogsPage = () => {
    const dispatch = useDispatch();

    // Redux state
    const { logs, error } = useSelector((state) => {
        console.log('Redux state.logs:', state.logs);
        return state.logs;
    });

    const tableRef = useRef(null);
    const { restoreTablePage, checkAndAdjustPage } = usePersistedTablePage();

    const handleRefreshLogs = useCallback(() => {
        dispatch(getLogs());
    }, [dispatch]);

    const handleExport = useCallback(
        (sessionId) => {
            dispatch(exportLogRecipients(sessionId));
        },
        [dispatch]
    );
    

    const destroyTable = useCallback(() => {
        if (tableRef.current) {
            tableRef.current.off('page.dt');
            const tableSelector = '#logs-data-table tbody';
            $(tableSelector).off('click', '.export-btn');
            $(tableSelector).off('click', '.view-btn');
            tableRef.current.destroy();
            tableRef.current = null;
        }
    }, []);
    

    useEffect(() => {
        console.log('Fetching logs data...');
        dispatch(getLogs());
    }, [dispatch]);

    // Clear error and destroy table when component unmounts
    useEffect(() => {
        return () => {
            dispatch(clearLogsError());
            destroyTable();
        };
    }, [dispatch, destroyTable]);

    // Initialize table when logs data changes
    useEffect(() => {
        console.log('Logs data changed:', logs);
        console.log('Logs length:', logs?.length);

        if (logs && logs.length >= 0) {
            destroyTable();

            console.log('Creating table with logs:', logs);
            const table = logsTable(logs, handleRefreshLogs, handleExport, restoreTablePage);
            tableRef.current = table;
            if (table && typeof checkAndAdjustPage === 'function') {
                checkAndAdjustPage(table);
            }
        }
    }, [logs, handleRefreshLogs, handleExport, destroyTable, restoreTablePage, checkAndAdjustPage]);

    console.log('Rendering LogsPage - error:', error, 'logs:', logs);

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
                                        <th>Action</th>
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
