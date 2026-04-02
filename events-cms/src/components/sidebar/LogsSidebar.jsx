import React, { useState, useEffect } from 'react';
import { Card, Table, Badge, Button, Alert, Spinner, Form, Row, Col } from 'react-bootstrap';
import { useSelector, useDispatch } from 'react-redux';
import axios from 'axios';

const LogsSidebar = ({ show, onHide, onLogSelect }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);
  const [selectedLog, setSelectedLog] = useState(null);
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    status: '',
    adminId: ''
  });

  const token = useSelector(state => state.auth.token);

  useEffect(() => {
    if (show) {
      fetchLogs();
    }
  }, [show, currentPage, filters]);

  const fetchLogs = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10'
      });

      // Add filters
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.append('dateTo', filters.dateTo);
      if (filters.status) params.append('status', filters.status);
      if (filters.adminId) params.append('adminId', filters.adminId);

      const response = await axios.get(`/api/logs/csv-upload?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setLogs(response.data.logs);
      setTotalPages(response.data.totalPages);
      setTotalLogs(response.data.total);
    } catch (error) {
      setError('Failed to fetch logs');
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
    }
  };

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
    return new Date(dateString).toLocaleString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (ms) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const handleLogClick = (log) => {
    setSelectedLog(log);
    if (onLogSelect) {
      onLogSelect(log);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
    setCurrentPage(1); // Reset to first page when filtering
  };

  const clearFilters = () => {
    setFilters({
      dateFrom: '',
      dateTo: '',
      status: '',
      adminId: ''
    });
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  if (!show) return null;

  return (
    <div className="logs-sidebar">
      <Card className="h-100">
        <Card.Header className="bg-primary text-white">
          <div className="d-flex justify-content-between align-items-center">
            <h6 className="mb-0">
              <i className="feather icon-file-text mr-2"></i>
              CSV Upload Logs
            </h6>
            <Button variant="outline-light" size="sm" onClick={onHide}>
              <i className="feather icon-x"></i>
            </Button>
          </div>
        </Card.Header>

        <Card.Body className="p-0">
          {/* Filters */}
          <div className="p-3 border-bottom">
            <h6 className="mb-3">Filters</h6>
            
            <Row>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="small">From Date</Form.Label>
                  <Form.Control
                    type="date"
                    size="sm"
                    value={filters.dateFrom}
                    onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="small">To Date</Form.Label>
                  <Form.Control
                    type="date"
                    size="sm"
                    value={filters.dateTo}
                    onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="small">Status</Form.Label>
                  <Form.Control
                    as="select"
                    size="sm"
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                  >
                    <option value="">All Status</option>
                    <option value="completed">Completed</option>
                    <option value="processing">Processing</option>
                    <option value="failed">Failed</option>
                    <option value="partial">Partial</option>
                  </Form.Control>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="small">Admin ID</Form.Label>
                  <Form.Control
                    type="text"
                    size="sm"
                    placeholder="Admin ID"
                    value={filters.adminId}
                    onChange={(e) => handleFilterChange('adminId', e.target.value)}
                  />
                </Form.Group>
              </Col>
            </Row>

            <div className="d-flex justify-content-between mt-2">
              <Button variant="outline-secondary" size="sm" onClick={clearFilters}>
                Clear Filters
              </Button>
              <Button variant="primary" size="sm" onClick={fetchLogs}>
                <i className="feather icon-refresh-cw mr-1"></i>
                Refresh
              </Button>
            </div>
          </div>

          {/* Logs Table */}
          <div className="p-3">
            {loading && (
              <div className="text-center py-3">
                <Spinner animation="border" size="sm" />
                <p className="mt-2 text-muted small">Loading logs...</p>
              </div>
            )}

            {error && (
              <Alert variant="danger" className="py-2">
                <small>{error}</small>
              </Alert>
            )}

            {!loading && !error && (
              <>
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <small className="text-muted">Total: {totalLogs} logs</small>
                  <small className="text-muted">Page {currentPage} of {totalPages}</small>
                </div>

                <div className="table-responsive" style={{maxHeight: '400px', overflowY: 'auto'}}>
                  <Table striped hover size="sm">
                    <thead className="bg-light sticky-top">
                      <tr>
                        <th className="small">Date/Time</th>
                        <th className="small">Status</th>
                        <th className="small">Records</th>
                        <th className="small">Users</th>
                        <th className="small">Emails</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs.map((log) => (
                        <tr 
                          key={log.id} 
                          className={`cursor-pointer ${selectedLog?.id === log.id ? 'table-primary' : ''}`}
                          onClick={() => handleLogClick(log)}
                          style={{cursor: 'pointer'}}
                        >
                          <td className="small">
                            <div className="text-muted">{formatDate(log.createdAt)}</div>
                            <div className="text-muted" style={{fontSize: '0.7rem'}}>
                              {log.fileName}
                            </div>
                          </td>
                          <td>{getStatusBadge(log.status)}</td>
                          <td className="small">
                            <div>{log.recordsProcessed}/{log.totalRecords}</div>
                            <div className="text-muted" style={{fontSize: '0.7rem'}}>
                              {formatDuration(log.processingTimeMs)}
                            </div>
                          </td>
                          <td className="small">
                            <div className="text-success">{log.newUsersCreated}</div>
                            {log.recordsSkipped > 0 && (
                              <div className="text-warning" style={{fontSize: '0.7rem'}}>
                                +{log.recordsSkipped} skipped
                              </div>
                            )}
                          </td>
                          <td className="small">
                            <div className="text-info">{log.emailsSent}</div>
                            {log.emailsFailed > 0 && (
                              <div className="text-danger" style={{fontSize: '0.7rem'}}>
                                {log.emailsFailed} failed
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>

                {logs.length === 0 && (
                  <div className="text-center py-4">
                    <i className="feather icon-file-text text-muted" style={{fontSize: '2rem'}}></i>
                    <p className="text-muted mt-2 small">No logs found</p>
                  </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="d-flex justify-content-center mt-3">
                    <div className="btn-group" role="group">
                      <Button 
                        variant="outline-secondary" 
                        size="sm"
                        disabled={currentPage === 1}
                        onClick={() => handlePageChange(currentPage - 1)}
                      >
                        <i className="feather icon-chevron-left"></i>
                      </Button>
                      
                      {[...Array(Math.min(5, totalPages))].map((_, index) => {
                        const pageNum = currentPage <= 3 ? index + 1 : currentPage - 2 + index;
                        if (pageNum > totalPages) return null;
                        
                        return (
                          <Button
                            key={pageNum}
                            variant={currentPage === pageNum ? "primary" : "outline-secondary"}
                            size="sm"
                            onClick={() => handlePageChange(pageNum)}
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                      
                      <Button 
                        variant="outline-secondary" 
                        size="sm"
                        disabled={currentPage === totalPages}
                        onClick={() => handlePageChange(currentPage + 1)}
                      >
                        <i className="feather icon-chevron-right"></i>
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </Card.Body>
      </Card>
    </div>
  );
};

export default LogsSidebar;

