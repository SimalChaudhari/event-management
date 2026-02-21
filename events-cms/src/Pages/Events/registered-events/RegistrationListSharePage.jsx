import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import {
  Container,
  Row,
  Col,
  Card,
  Table,
  Spinner,
  Alert,
  Badge,
  Form,
  InputGroup,
  Button,
} from 'react-bootstrap';
import publicAxiosInstance from '../../../configs/publicAxiosInstance';
import { API_URL } from '../../../configs/env';

const RegistrationListSharePage = () => {
  const { shareToken } = useParams();
  const navigate = useNavigate();
  const [eventName, setEventName] = useState('');
  const [eventId, setEventId] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isLive, setIsLive] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [showUpdatedBadge, setShowUpdatedBadge] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState(null);
  const socketRef = useRef(null);

  const handleCopyId = useCallback((id) => {
    if (!id) return;
    const str = String(id);
    navigator.clipboard.writeText(str).then(() => {
      setCopiedId(str);
      setTimeout(() => setCopiedId(null), 2000);
    });
  }, []);

  const filteredParticipants = participants.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.trim().toLowerCase();
    const name = [p.firstName, p.lastName].filter(Boolean).join(' ').toLowerCase();
    const email = (p.email || '').toLowerCase();
    const id = (p.id ? String(p.id) : '').toLowerCase();
    return name.includes(q) || email.includes(q) || id.includes(q);
  });

  const fetchData = useCallback(async (isSilentRefresh = false) => {
    if (!shareToken) {
      setError('Invalid link');
      setLoading(false);
      return;
    }
    if (!isSilentRefresh) setLoading(true);
    setError(null);
    try {
      const response = await publicAxiosInstance.get(
        `/public/events/share/${shareToken}/participants`
      );
      const data = response?.data?.data;
      if (data) {
        setEventId(data.eventId ?? null);
        setEventName(data.eventName || '');
        setParticipants(data.participants || []);
        setLastUpdated(new Date());
        if (isSilentRefresh) {
          setShowUpdatedBadge(true);
          setTimeout(() => setShowUpdatedBadge(false), 3000);
        }
      } else {
        setError('No data received');
      }
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        'Unable to load registration list. Link may be invalid or expired.';
      setError(msg);
      setParticipants([]);
    } finally {
      setLoading(false);
    }
  }, [shareToken]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!eventId) return;

    const socket = io(`${API_URL}/registration-share`, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setIsLive(true);
      socket.emit('join_event', { eventId });
    });

    socket.on('disconnect', () => {
      setIsLive(false);
    });

    socket.on('attendance_updated', () => {
      fetchData(true);
    });

    socket.on('participants_updated', () => {
      fetchData(true);
    });

    return () => {
      setIsLive(false);
      if (socketRef.current) {
        socketRef.current.emit('leave_event', { eventId });
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [eventId, fetchData]);

  if (loading) {
    return (
      <Container fluid className="py-5 text-center">
        <Spinner animation="border" variant="primary" />
        <div className="mt-3 text-muted">Loading registration list...</div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container fluid className="py-5">
        <Alert variant="danger">
          <strong>Error:</strong> {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Container fluid className="py-4" style={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
      <Row className="justify-content-center">
        <Col lg={10} xl={8}>
          <Card className="shadow-sm">
            <Card.Header
              className="py-3 d-flex align-items-center justify-content-between flex-wrap"
              style={{ backgroundColor: '#0d9488', color: 'white' }}
            >
              <div className="d-flex align-items-center flex-wrap">
                <div>
                <h5 className="mb-0 d-flex align-items-center">
                  <i className="feather icon-users mr-2"></i>
                  Registration List
                  {isLive && (
                    <span
                      className="ml-2 d-inline-flex align-items-center px-2 py-0 rounded"
                      style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        backgroundColor: 'rgba(255,255,255,0.25)',
                        letterSpacing: '0.5px',
                      }}
                    >
                      <span
                        className="mr-1"
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          backgroundColor: '#90EE90',
                          boxShadow: '0 0 6px #90EE90',
                        }}
                      />
                      LIVE
                    </span>
                  )}
                  {showUpdatedBadge && (
                    <span
                      className="ml-2 badge badge-success"
                      style={{ fontSize: '10px', fontWeight: 600 }}
                    >
                      Updated
                    </span>
                  )}
                </h5>
                {eventName && (
                  <small className="d-block mt-1" style={{ opacity: 0.9 }}>
                    {eventName}
                  </small>
                )}
                </div>
                <Button
                  variant="outline-light"
                  size="sm"
                  className="ml-3 mt-2 mt-md-0"
                  onClick={() => navigate(`/events/registrations/share/${shareToken}/check-in`)}
                >
                  <i className="feather icon-user-check mr-1"></i>
                  Check-in by scan
                </Button>
              </div>
            </Card.Header>
            <Card.Body className="p-0">
              <div
                className="px-3 py-3 border-bottom"
                style={{ backgroundColor: '#f0fdfa' }}
              >
                <Row>
                  <Col xs="12" lg="6" className="ml-lg-auto">
                    <InputGroup
                      size="sm"
                      className="shadow-sm"
                      style={{ borderRadius: '8px', overflow: 'hidden' }}
                    >
                      <Form.Control
                        className="border-right-0"
                        placeholder="Search by ID, name or email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && e.target.blur()}
                        aria-label="Search participants"
                        style={{
                          borderColor: '#99f6e4',
                          backgroundColor: '#fff',
                          fontSize: '0.9rem',
                          paddingLeft: '14px',
                          paddingRight: '12px',
                          minHeight: '40px',
                        }}
                      />
                      {searchQuery && (
                        <Button
                          variant="outline-secondary"
                          size="sm"
                          className="border border-right-0"
                          onClick={() => setSearchQuery('')}
                          aria-label="Clear search"
                          style={{
                            minHeight: '40px',
                            borderColor: '#99f6e4',
                            backgroundColor: '#fff',
                            color: '#0f766e',
                            fontSize: '0.85rem',
                            paddingLeft: '10px',
                            paddingRight: '10px',
                          }}
                        >
                          <i className="feather icon-x" style={{ fontSize: '16px' }}></i>
                        </Button>
                      )}
                      <Button
                        variant="primary"
                        size="sm"
                        className="d-flex align-items-center justify-content-center px-3"
                        style={{
                          minHeight: '40px',
                          backgroundColor: '#0d9488',
                          borderColor: '#0d9488',
                          fontWeight: 600,
                          fontSize: '0.875rem',
                          letterSpacing: '0.3px',
                        }}
                        aria-label="Search"
                      >
                        <i className="feather icon-search mr-1" style={{ fontSize: '15px' }}></i>
                        <span className="d-none d-sm-inline ml-1">Search</span>
                      </Button>
                    </InputGroup>
                  </Col>
                </Row>
                {searchQuery && (
                  <small className="text-muted mt-1 d-block">
                    Showing results for &quot;{searchQuery}&quot;
                  </small>
                )}
              </div>

              <div className="d-none d-md-block">
                <Table hover className="mb-0">
                  <thead className="bg-light">
                    <tr>
                      <th className="text-center" style={{ width: 50 }}>#</th>
                      <th style={{ width: 90 }}>ID</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th className="text-center">Attendance Status</th>
                      <th className="text-center">Check-in Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredParticipants.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center text-muted py-4">
                          {participants.length === 0
                            ? 'No participants in this list.'
                            : 'No matches for your search.'}
                        </td>
                      </tr>
                    ) : (
                      filteredParticipants.map((p, index) => (
                        <tr key={p.id || `${p.email}-${index}`}>
                          <td className="text-center text-muted">{index + 1}</td>
                          <td className="text-muted small" style={{ fontSize: '0.8rem' }}>
                            {p.id ? (
                              <span
                                role="button"
                                tabIndex={0}
                                title={String(p.id)}
                                onClick={() => handleCopyId(p.id)}
                                onKeyDown={(e) => e.key === 'Enter' && handleCopyId(p.id)}
                                style={{
                                  cursor: 'pointer',
                                  textDecoration: 'underline',
                                  textUnderlineOffset: 2,
                                  fontFamily: 'monospace',
                                }}
                              >
                                {copiedId === String(p.id) ? 'Copied!' : String(p.id).slice(0, 8)}
                              </span>
                            ) : (
                              '—'
                            )}
                          </td>
                          <td>
                            <strong>
                              {[p.firstName, p.lastName].filter(Boolean).join(' ') || '—'}
                            </strong>
                          </td>
                          <td>{p.email || '—'}</td>
                          <td className="text-center">
                            {p.attendanceStatus === 'Attended' ? (
                              <span
                                className="badge badge-success px-3 py-2"
                                style={{
                                  fontSize: '12px',
                                  fontWeight: 600,
                                  borderRadius: '999px',
                                  backgroundColor: '#059669',
                                  boxShadow: '0 0 0 2px rgba(5,150,105,0.3)',
                                }}
                              >
                                <i className="feather icon-check-circle mr-1" style={{ fontSize: '14px' }}></i>
                                Attended
                              </span>
                            ) : (
                              <span
                                className="badge px-3 py-2"
                                style={{
                                  fontSize: '12px',
                                  fontWeight: 600,
                                  borderRadius: '999px',
                                  backgroundColor: '#fef3c7',
                                  color: '#b45309',
                                  border: '1px solid #fcd34d',
                                }}
                              >
                                <i className="feather icon-clock mr-1" style={{ fontSize: '12px' }}></i>
                                Not Attended
                              </span>
                            )}
                          </td>
                          <td className="text-center text-muted small">
                            {p.checkInTime
                              ? new Date(p.checkInTime).toLocaleString(undefined, {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : '—'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </Table>
              </div>

              <div className="d-md-none p-2">
                {filteredParticipants.length === 0 ? (
                  <div className="text-center text-muted py-4">
                    {participants.length === 0
                      ? 'No participants in this list.'
                      : 'No matches for your search.'}
                  </div>
                ) : (
                  filteredParticipants.map((p, index) => (
                    <div
                      key={p.id || `${p.email}-${index}`}
                      className="border rounded p-3 mb-2 bg-white"
                    >
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <strong className="text-dark">
                          {[p.firstName, p.lastName].filter(Boolean).join(' ') || '—'}
                        </strong>
                        <span className="text-muted small">#{index + 1}</span>
                      </div>
                      <div className="small" style={{ fontSize: '0.85rem' }}>
                        {p.id && (
                          <div className="d-flex align-items-center mb-2">
                            <span className="text-muted mr-2" style={{ fontSize: '0.8rem', minWidth: 52, flexShrink: 0 }}>ID</span>
                            <span
                              role="button"
                              tabIndex={0}
                              title={String(p.id)}
                              onClick={() => handleCopyId(p.id)}
                              onKeyDown={(e) => e.key === 'Enter' && handleCopyId(p.id)}
                              style={{
                                fontSize: '0.8rem',
                                fontFamily: 'monospace',
                                cursor: 'pointer',
                                textDecoration: 'underline',
                                textUnderlineOffset: 2,
                              }}
                            >
                              {copiedId === String(p.id) ? 'Copied!' : String(p.id).slice(0, 8)}
                            </span>
                          </div>
                        )}
                        <div className="d-flex align-items-start mb-2">
                          <span className="text-muted mr-2" style={{ fontSize: '0.8rem', minWidth: 52, flexShrink: 0 }}>Email</span>
                          <span className="text-break">{p.email || '—'}</span>
                        </div>
                        <div className="d-flex align-items-center mb-2">
                          <span className="text-muted mr-2" style={{ fontSize: '0.8rem', minWidth: 52, flexShrink: 0 }}>Status</span>
                          {p.attendanceStatus === 'Attended' ? (
                            <span
                              className="badge badge-success d-inline-flex align-items-center"
                              style={{
                                fontSize: '11px',
                                fontWeight: 600,
                                borderRadius: '999px',
                                backgroundColor: '#059669',
                                boxShadow: '0 0 0 1px rgba(5,150,105,0.25)',
                                padding: '4px 10px',
                              }}
                            >
                              <i className="feather icon-check-circle mr-1" style={{ fontSize: '12px', flexShrink: 0 }}></i>
                              Attended
                            </span>
                          ) : (
                            <span
                              className="badge d-inline-flex align-items-center"
                              style={{
                                fontSize: '11px',
                                fontWeight: 600,
                                borderRadius: '999px',
                                backgroundColor: '#fef3c7',
                                color: '#b45309',
                                border: '1px solid #fcd34d',
                                padding: '4px 10px',
                              }}
                            >
                              <i className="feather icon-clock mr-1" style={{ fontSize: '11px', flexShrink: 0 }}></i>
                              Not Attended
                            </span>
                          )}
                        </div>
                        <div className="d-flex align-items-center">
                          <span className="text-muted mr-2" style={{ fontSize: '0.8rem', minWidth: 52, flexShrink: 0 }}>Check-in</span>
                          <span style={{ fontSize: '0.8rem' }}>
                            {p.checkInTime
                              ? new Date(p.checkInTime).toLocaleString(undefined, {
                                  day: '2-digit',
                                  month: 'short',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : '—'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card.Body>
            <Card.Footer className="text-muted small py-2 d-flex justify-content-between align-items-center flex-wrap">
              <span>
                {searchQuery.trim()
                  ? `${filteredParticipants.length} of ${participants.length} participant(s)`
                  : `${participants.length} participant(s)`}
                {lastUpdated && (
                  <span className="ml-2">
                    · Last updated {lastUpdated.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                )}
              </span>
              {isLive && (
                <span className="text-success" style={{ fontSize: '11px' }}>
                  <span className="mr-1">●</span> Live updates on
                </span>
              )}
            </Card.Footer>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default RegistrationListSharePage;
