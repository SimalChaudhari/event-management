import React from 'react';
import { Modal, Button, Row, Col, Card, Container } from 'react-bootstrap';
// import { API_URL } from '../../../configs/env';

function ViewEventModal({ show, handleClose, eventData }) {
  if (!eventData) return null;

  return (
    <Modal show={show} onHide={handleClose} size="lg">
      <Modal.Header style={{ backgroundColor: '#4680ff', color: '#fff' }}>
        <Modal.Title>View Event</Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ backgroundColor: '#f8f9fa', padding: '20px' }}>
        <Container>
          <Row className="text-center mb-4">
            <Col>
              {eventData.image && (
                <img
                  src={eventData.image}
                  alt="Event"
                  style={{ width: '150px', height: '150px', borderRadius: '10%', border: '3px solid #4680ff' }}
                />
              )}
            </Col>
          </Row>
          <Row>
            <Col md={12}>
              <Card className="mb-3">
                <Card.Body>
                  <Card.Title>Event Information</Card.Title>
                  <hr style={{ margin: '10px 0' }} />
                  <Card.Text><strong>Name:</strong> {eventData.name}</Card.Text>
                  <Card.Text><strong>Description:</strong> {eventData.description}</Card.Text>
                  <Card.Text><strong>Start Date:</strong> {eventData.startDate}</Card.Text>
                  <Card.Text><strong>Start Time:</strong> {eventData.startTime}</Card.Text>
                  <Card.Text><strong>End Date:</strong> {eventData.endDate}</Card.Text>
                  <Card.Text><strong>End Time:</strong> {eventData.endTime}</Card.Text>
                </Card.Body>
              </Card>
            </Col>
            <Col md={12}>
              <Card className="mb-3">
                <Card.Body>
                  <Card.Title>Location & Pricing</Card.Title>
                  <hr style={{ margin: '10px 0' }} />
                  <Card.Text><strong>Location:</strong> {eventData.location}</Card.Text>
                  <Card.Text><strong>Type:</strong> {eventData.type}</Card.Text>
                  <Card.Text><strong>Price:</strong> {eventData.price} {eventData.currency}</Card.Text>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </Modal.Body>
      <Modal.Footer style={{ backgroundColor: '#f8f9fa' }}>
        <Button variant="secondary" onClick={handleClose}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default ViewEventModal;