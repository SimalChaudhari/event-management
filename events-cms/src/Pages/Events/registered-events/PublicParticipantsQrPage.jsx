import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Container,
  Row,
  Col,
  Card,
  Table,
  Form,
  InputGroup,
  Button,
  Spinner,
  Modal,
  Alert,
  Badge,
} from 'react-bootstrap';
import { toast } from 'react-toastify';
import publicAxiosInstance from '../../../configs/publicAxiosInstance.jsx';

const QR_CODE_SIZE = 220;
const buildQrCodeUrl = (value) =>
  `https://api.qrserver.com/v1/create-qr-code/?size=${QR_CODE_SIZE}x${QR_CODE_SIZE}&data=${encodeURIComponent(
    value,
  )}`;

const PublicParticipantsQrPage = () => {
  const { eventId } = useParams();
  const [participants, setParticipants] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState(null);
  const [showQrModal, setShowQrModal] = useState(false);

  const fetchParticipants = useCallback(
    async (term = '') => {
      if (!eventId) {
        return;
      }

      const params = term ? { search: term.trim() } : undefined;

      try {
        if (term) {
          setIsSearching(true);
        } else {
          setLoading(true);
        }

        const response = await publicAxiosInstance.get(
          `/public/events/${eventId}/participants`,
          { params },
        );

        const responseData = response?.data;
        const items = responseData?.data || [];
        const metadataTotal = responseData?.metadata?.total;

        setParticipants(items);
        setTotalCount(
          typeof metadataTotal === 'number' ? metadataTotal : items.length,
        );
      } catch (error) {
        console.error('Failed to load participants', error);
        toast.error('Unable to load participants. Please try again later.');
      } finally {
        setLoading(false);
        setIsSearching(false);
      }
    },
    [eventId],
  );

  useEffect(() => {
    fetchParticipants('');
  }, [fetchParticipants]);

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchParticipants(searchTerm);
    }, 400);

    return () => clearTimeout(handler);
  }, [searchTerm, fetchParticipants]);

  const handleOpenQrModal = useCallback((participant) => {
    setSelectedParticipant(participant);
    setShowQrModal(true);
  }, []);

  const handleCloseQrModal = useCallback(() => {
    setShowQrModal(false);
    setSelectedParticipant(null);
  }, []);

  const tableContent = useMemo(() => {
    if (loading && !isSearching) {
      return (
        <tr>
          <td colSpan={7} className="text-center py-5">
            <Spinner animation="border" role="status" variant="primary" />
            <div className="mt-3 text-muted">Fetching participants...</div>
          </td>
        </tr>
      );
    }

    if (!participants.length) {
      return (
        <tr>
          <td colSpan={7} className="text-center py-5">
            <div className="text-muted">
              No participants found. Adjust your search criteria or try again later.
            </div>
          </td>
        </tr>
      );
    }

    return participants.map((participant, index) => {
      const fullName = `${participant.firstName || ''} ${participant.lastName || ''}`.trim() || 'N/A';
      const registeredDate = participant.createdAt
        ? new Date(participant.createdAt).toLocaleString()
        : 'N/A';

      const typeVariant =
        participant.type?.toLowerCase() === 'exhibitor'
          ? 'info'
          : participant.type?.toLowerCase() === 'attendee'
          ? 'success'
          : 'secondary';

      return (
        <tr key={participant.registrationId}>
          <td className="text-center text-muted">{index + 1}</td>
          <td>
            <div className="font-weight-semibold">{fullName}</div>
            <div className="small text-muted">{participant.email || 'N/A'}</div>
          </td>
          <td>
            <div>{participant.company || 'N/A'}</div>
            <div className="small text-muted">{participant.designation || 'N/A'}</div>
          </td>
          <td>
            <Badge variant={typeVariant} className="px-3 py-2 text-uppercase">
              {participant.type || 'N/A'}
            </Badge>
          </td>
          <td className="text-muted small">{registeredDate}</td>
          <td className="text-center">
            <span className="badge badge-light py-2 px-3 text-monospace">
              {participant.participantUid || '—'}
            </span>
          </td>
          <td className="text-right">
            <Button
              variant="outline-primary"
              size="sm"
              className="d-inline-flex align-items-center"
              onClick={() => handleOpenQrModal(participant)}
            >
              <i className="feather icon-smartphone mr-2" />
              Generate QR
            </Button>
          </td>
        </tr>
      );
    });
  }, [handleOpenQrModal, isSearching, loading, participants]);

  return (
    <Container fluid className="py-5" style={{ minHeight: '100vh', backgroundColor: '#f8f9fb' }}>
      <Row className="justify-content-between align-items-center mb-4">
        <Col md="auto">
          <div className="d-flex align-items-center mb-2">
            <span
              className="badge badge-primary mr-2"
              style={{ fontSize: '0.9rem', padding: '0.35rem 0.75rem' }}
            >
              Live Event Check-in
            </span>
            <span className="text-muted">Event ID: {eventId}</span>
          </div>
          <h2 className="mb-2" style={{ fontWeight: 600, color: '#2c3e50' }}>
            Participant QR Directory
          </h2>
          <p className="text-muted mb-0" style={{ maxWidth: 520 }}>
            Share this secure page with on-site staff to quickly verify attendees. Use search to locate
            participants and generate their individual QR codes for scanning.
          </p>
        </Col>
       
      </Row>

      <Card className="shadow-sm">
        <Card.Header className="bg-white border-0 py-3">
          <Row className="align-items-center">
            <Col md={6}>
              <div className="text-muted text-uppercase mb-1" style={{ letterSpacing: '0.08em' }}>
                Participant Overview
              </div>
              <div className="d-flex align-items-baseline">
                <h4 className="mb-0 mr-3" style={{ fontWeight: 600 }}>
                  {totalCount}
                </h4>
                <span className="text-muted">total registrations</span>
              </div>
            </Col>
            <Col md={6} className="mt-3 mt-md-0">
              <Form>
                <InputGroup className="align-items-stretch">
                  <InputGroup.Text className="bg-light border-right-0">
                    <i className="feather icon-search" />
                  </InputGroup.Text>
                  <Form.Control
                    type="search"
                    placeholder="Search by attendee name, email or company"
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    className="border-left-0 shadow-none"
                  />
                  <Button
                    variant="primary"
                    onClick={() => fetchParticipants(searchTerm)}
                    disabled={isSearching}
                    className="d-flex align-items-center"
                  >
                    {isSearching ? (
                      <>
                        <Spinner animation="border" size="sm" className="mr-2" />
                        Searching...
                      </>
                    ) : (
                      <>
                        <i className="feather icon-sliders mr-2" />
                        Apply Filter
                      </>
                    )}
                  </Button>
                </InputGroup>
              </Form>
            </Col>
          </Row>
        </Card.Header>
        <Card.Body className="p-0">
          <div className="table-responsive">
            <Table hover borderless className="mb-0 align-middle">
              <thead className="bg-light">
                <tr>
                  <th className="text-center text-muted small" style={{ width: 60 }}>
                    #
                  </th>
                    <th>Participant</th>
                    <th>Organisation</th>
                    <th>Type</th>
                    <th className="text-muted small">Registered On</th>
                    <th className="text-center">UID</th>
                    <th className="text-right" style={{ width: 160 }}>
                      Actions
                    </th>
                </tr>
              </thead>
              <tbody>{tableContent}</tbody>
            </Table>
          </div>
        </Card.Body>
      </Card>

      <Modal show={showQrModal} onHide={handleCloseQrModal} centered size="md">
        <Modal.Header  className="border-0 pb-0">
          <div>
            <div className="text-uppercase text-muted small" style={{ letterSpacing: '0.08em' }}>
              Participant QR Code
            </div>
            <Modal.Title style={{ fontWeight: 600 }}>
              {selectedParticipant
                ? `${selectedParticipant.firstName || ''} ${selectedParticipant.lastName || ''}`.trim() || 'N/A'
                : 'Attendee'}
            </Modal.Title>
          </div>
        </Modal.Header>
        <Modal.Body className="text-center pt-4">
          {selectedParticipant?.participantUid ? (
            <div className="d-flex flex-column align-items-center">
              <div
                className="shadow rounded p-3 mb-3"
                style={{ backgroundColor: '#f4f6fb', display: 'inline-block' }}
              >
                <img
                  src={buildQrCodeUrl(selectedParticipant.participantUid)}
                  alt="Participant QR code"
                  width={QR_CODE_SIZE}
                  height={QR_CODE_SIZE}
                />
              </div>
              <div className="text-center">
                <div className="text-muted small mb-2">
                  Present this QR code at the registration counter for verification.
                </div>
                <div className="text-muted small">
                  UID:&nbsp;
                  <span className="font-weight-semibold text-monospace">
                    {selectedParticipant.participantUid}
                  </span>
                </div>
                <div className="text-muted small mt-2">
                  {selectedParticipant.email || 'Email not provided'}
                </div>
              </div>
            </div>
          ) : (
            <Alert variant="warning" className="mb-0">
              UID not available for this participant. Please verify their registration details.
            </Alert>
          )}
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0">
          <Button variant="outline-secondary" onClick={handleCloseQrModal}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default PublicParticipantsQrPage;
