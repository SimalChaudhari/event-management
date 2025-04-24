import React from 'react';
import { Modal, Button, Card, Row, Col, Container } from 'react-bootstrap';

const RegisterEventModal = ({ show, onHide, eventData }) => {
  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header style={{ backgroundColor: '#4680ff', color: '#fff' }}>
        <Modal.Title>Registered Event Details</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Container>
          {/* Event Info */}
          <Card className="mb-3">
            <Card.Body>
              <Card.Title>Event Info</Card.Title>
              <hr />
              <Row>
                <Col md={6}>
                  <p><strong>Title:</strong> {eventData?.event?.title || 'N/A'}</p>
                  <p><strong>Type:</strong> {eventData?.event?.type || 'N/A'}</p>
                  <p><strong>Category:</strong> {eventData?.event?.category || 'N/A'}</p>
                  <p><strong>Mode:</strong> {eventData?.event?.mode || 'N/A'}</p>
                </Col>
                <Col md={6}>
                  <p><strong>Start Date:</strong> {eventData?.event?.startDate ? new Date(eventData.event.startDate).toLocaleString() : 'N/A'}</p>
                  <p><strong>End Date:</strong> {eventData?.event?.endDate ? new Date(eventData.event.endDate).toLocaleString() : 'N/A'}</p>
                  <p><strong>Status:</strong> {eventData?.event?.status || 'N/A'}</p>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {/* Location & Pricing */}
          <Card className="mb-3">
            <Card.Body>
              <Card.Title>Location & Pricing</Card.Title>
              <hr />
              <Row>
                <Col md={6}>
                  <p><strong>Country:</strong> {eventData?.event?.country || 'N/A'}</p>
                  <p><strong>State:</strong> {eventData?.event?.state || 'N/A'}</p>
                  <p><strong>City:</strong> {eventData?.event?.city || 'N/A'}</p>
                  <p><strong>Location:</strong> {eventData?.event?.location || 'N/A'}</p>
                </Col>
                <Col md={6}>
                  <p><strong>Fee:</strong> {eventData?.event?.fee || 'N/A'} {eventData?.event?.currency || ''}</p>
                  <p><strong>Available Seats:</strong> {eventData?.event?.totalSeats || 'N/A'}</p>
                  <p><strong>Booked Seats:</strong> {eventData?.event?.bookedSeats || 'N/A'}</p>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {/* Speakers */}
          <Card className="mb-3">
            <Card.Body>
              <Card.Title>Speakers Details</Card.Title>
              <hr />
              {eventData?.event?.speakers && eventData.event.speakers.length > 0 ? (
                eventData.event.speakers.map((speaker, index) => (
                  <div key={index}>
                    <p><strong>Name:</strong> {speaker.name}</p>
                    <p><strong>Designation:</strong> {speaker.designation}</p>
                    <p><strong>Company:</strong> {speaker.company}</p>
                    {index < eventData.event.speakers.length - 1 && <hr />}
                  </div>
                ))
              ) : (
                <p>No speaker information available.</p>
              )}
            </Card.Body>
          </Card>

          {/* Order Info */}
          {eventData?.order && (
            <Card className="mb-3">
              <Card.Body>
                <Card.Title>Order Details</Card.Title>
                <hr />
                <Row>
                  <Col md={6}>
                    <p><strong>Order ID:</strong> {eventData.order.id || 'N/A'}</p>
                    <p><strong>Payment Status:</strong> {eventData.order.paymentStatus || 'N/A'}</p>
                    <p><strong>Amount Paid:</strong> {eventData.order.amount || 'N/A'} {eventData.order.currency || ''}</p>
                  </Col>
                  <Col md={6}>
                    <p><strong>Payment Method:</strong> {eventData.order.paymentMethod || 'N/A'}</p>
                    <p><strong>Transaction Date:</strong> {eventData.order.createdAt ? new Date(eventData.order.createdAt).toLocaleString() : 'N/A'}</p>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          )}
        </Container>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>Close</Button>
      </Modal.Footer>
    </Modal>
  );
};

export default RegisterEventModal;
