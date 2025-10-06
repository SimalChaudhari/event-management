import React, { useState, useEffect } from 'react';
import { Modal, Table, Badge, Button, Alert, Spinner, Pagination } from 'react-bootstrap';
import { useSelector, useDispatch } from 'react-redux';
import { getLogs, getLogById, clearLogsError } from '../../store/actions/logsActions';

const CsvLogViewerModal = ({ show, onHide }) => {
  const dispatch = useDispatch();
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedLog, setSelectedLog] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  // Redux state
  const { 
    logs, 
    pagination, 
    loading, 
    error 
  } = useSelector(state => state.logs);

  useEffect(() => {
    if (show) {
      dispatch(getLogs({
        page: currentPage,
        limit: 20
      }));
    }
  }, [show, currentPage, dispatch]);

  // Clear error when modal closes
  useEffect(() => {
    if (!show) {
      dispatch(clearLogsError());
    }
  }, [show, dispatch]);

  const getStatusBadge = (status) => {
    const variants = {
      completed: 'success',
      processing: 'warning',
      failed: 'danger',
      partial: 'info'
    };
    return <Badge variant={variants[status] || 'secondary'}>{status.toUpperCase()}</Badge>;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const formatDuration = (ms) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const viewLogDetails = async (log) => {
    const logDetails = await dispatch(getLogById(log.sessionId));
    if (logDetails) {
      setSelectedLog(logDetails);
      setShowDetails(true);
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    dispatch(getLogs({
      page,
      limit: 20
    }));
  };

  return (
    <>
      <Modal show={show} onHide={onHide} size="xl" centered>
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="feather icon-file-text mr-2"></i>
            CSV Upload Logs
          </Modal.Title>
        </Modal.Header>
        
        <Modal.Body>
          {loading && (
            <div className="text-center py-4">
              <Spinner animation="border" />
              <p className="mt-2 text-muted">Loading logs...</p>
            </div>
          )}

          {error && (
            <Alert variant="danger">{error}</Alert>
          )}

          {!loading && !error && (
            <>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="mb-0">Total Logs: {pagination.total}</h6>
                <Button variant="outline-primary" size="sm" onClick={() => dispatch(getLogs({ page: currentPage, limit: 20 }))}>
                  <i className="feather icon-refresh-cw mr-1"></i>
                  Refresh
                </Button>
              </div>

              <div className="table-responsive">
                <Table striped hover>
                  <thead>
                    <tr>
                      <th>Session ID</th>
                      <th>File Name</th>
                      <th>Status</th>
                      <th>Records</th>
                      <th>Users Created</th>
                      <th>Emails Sent</th>
                      <th>Duration</th>
                      <th>Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => (
                      <tr key={log.id}>
                        <td>
                          <code className="small">{log.sessionId.substring(0, 8)}...</code>
                        </td>
                        <td>{log.fileName}</td>
                        <td>{getStatusBadge(log.status)}</td>
                        <td>
                          <span className="text-muted">{log.recordsProcessed}</span>
                          <span className="text-muted">/{log.totalRecords}</span>
                        </td>
                        <td>
                          <span className="text-success font-weight-bold">{log.newUsersCreated}</span>
                        </td>
                        <td>
                          <span className="text-info font-weight-bold">{log.emailsSent}</span>
                          {log.emailsFailed > 0 && (
                            <span className="text-danger ml-1">({log.emailsFailed} failed)</span>
                          )}
                        </td>
                        <td>{formatDuration(log.processingTimeMs)}</td>
                        <td className="small text-muted">{formatDate(log.createdAt)}</td>
                        <td>
                          <Button 
                            variant="outline-primary" 
                            size="sm"
                            onClick={() => viewLogDetails(log)}
                          >
                            <i className="feather icon-eye mr-1"></i>
                            View
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>

              {pagination.totalPages > 1 && (
                <div className="d-flex justify-content-center mt-3">
                  <Pagination>
                    <Pagination.Prev 
                      disabled={currentPage === 1}
                      onClick={() => handlePageChange(currentPage - 1)}
                    />
                    {[...Array(pagination.totalPages)].map((_, index) => (
                      <Pagination.Item
                        key={index + 1}
                        active={currentPage === index + 1}
                        onClick={() => handlePageChange(index + 1)}
                      >
                        {index + 1}
                      </Pagination.Item>
                    ))}
                    <Pagination.Next 
                      disabled={currentPage === pagination.totalPages}
                      onClick={() => handlePageChange(currentPage + 1)}
                    />
                  </Pagination>
                </div>
              )}
            </>
          )}
        </Modal.Body>
      </Modal>

      {/* Log Details Modal */}
      <Modal show={showDetails} onHide={() => setShowDetails(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="feather icon-info mr-2"></i>
            Log Details
          </Modal.Title>
        </Modal.Header>
        
        <Modal.Body>
          {selectedLog && (
            <div>
              <div className="row mb-3">
                <div className="col-md-6">
                  <strong>Session ID:</strong>
                  <br />
                  <code className="small">{selectedLog.sessionId}</code>
                </div>
                <div className="col-md-6">
                  <strong>Status:</strong>
                  <br />
                  {getStatusBadge(selectedLog.status)}
                </div>
              </div>

              <div className="row mb-3">
                <div className="col-md-6">
                  <strong>File Name:</strong>
                  <br />
                  {selectedLog.fileName}
                </div>
                <div className="col-md-6">
                  <strong>Processing Time:</strong>
                  <br />
                  {formatDuration(selectedLog.processingTimeMs)}
                </div>
              </div>

              <div className="row mb-3">
                <div className="col-md-4">
                  <strong>Total Records:</strong>
                  <br />
                  <span className="font-weight-bold">{selectedLog.totalRecords}</span>
                </div>
                <div className="col-md-4">
                  <strong>Processed:</strong>
                  <br />
                  <span className="text-success font-weight-bold">{selectedLog.recordsProcessed}</span>
                </div>
                <div className="col-md-4">
                  <strong>Skipped:</strong>
                  <br />
                  <span className="text-warning font-weight-bold">{selectedLog.recordsSkipped}</span>
                </div>
              </div>

              <div className="row mb-3">
                <div className="col-md-4">
                  <strong>New Users:</strong>
                  <br />
                  <span className="text-success font-weight-bold">{selectedLog.newUsersCreated}</span>
                </div>
                <div className="col-md-4">
                  <strong>Updated Users:</strong>
                  <br />
                  <span className="text-info font-weight-bold">{selectedLog.existingUsersUpdated}</span>
                </div>
                <div className="col-md-4">
                  <strong>Passwords:</strong>
                  <br />
                  <span className="text-primary font-weight-bold">{selectedLog.passwordsGenerated}</span>
                </div>
              </div>

              <div className="row mb-3">
                <div className="col-md-4">
                  <strong>Emails Total:</strong>
                  <br />
                  <span className="font-weight-bold">{selectedLog.emailsTotal}</span>
                </div>
                <div className="col-md-4">
                  <strong>Emails Sent:</strong>
                  <br />
                  <span className="text-success font-weight-bold">{selectedLog.emailsSent}</span>
                </div>
                <div className="col-md-4">
                  <strong>Emails Failed:</strong>
                  <br />
                  <span className="text-danger font-weight-bold">{selectedLog.emailsFailed}</span>
                </div>
              </div>

              {selectedLog.summary && (
                <div className="mb-3">
                  <strong>Summary:</strong>
                  <br />
                  <div className="bg-light p-2 rounded small">
                    {selectedLog.summary}
                  </div>
                </div>
              )}

              <div className="mb-3">
                <strong>Created At:</strong>
                <br />
                <span className="text-muted">{formatDate(selectedLog.createdAt)}</span>
              </div>
            </div>
          )}
        </Modal.Body>
        
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDetails(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default CsvLogViewerModal;
