import React from 'react';
import { Modal, Button, Row, Col, Card, Container } from 'react-bootstrap';
import { API_URL } from '../../../../configs/env';

function ViewEventModal({ show, handleClose, eventData }) {
    if (!eventData) return null;

    const renderSpeakers = () => {
        if (!eventData?.speakersData?.length) {
            return <p>No speakers listed.</p>;
        }

        return eventData.speakersData.map((speaker) => (
            <Row key={speaker.id} className="mb-3">
                <Col xs={12} md={3} className="text-center mb-3 mb-md-0">
                    {speaker.speakerProfile && (
                        <img
                            src={`${API_URL}/${speaker.speakerProfile}`}
                            alt={speaker.name}
                            style={{
                                width: 100,
                                height: 100,
                                objectFit: 'cover',
                                borderRadius: '10%',
                                border: '2px solid #4680ff'
                            }}
                        />
                    )}
                </Col>
                <Col xs={12} md={9}>
                    <p className="mb-2"><strong>Name:</strong> {speaker.name}</p>
                    <p className="mb-2"><strong>Company:</strong> {speaker.companyName}</p>
                    <p className="mb-2"><strong>Position:</strong> {speaker.position}</p>
                    <p className="mb-2"><strong>Mobile:</strong> {speaker.mobile}</p>
                    <p className="mb-2"><strong>Email:</strong> {speaker.email}</p>
                    <p className="mb-2"><strong>Location:</strong> {speaker.location}</p>
                    <p className="mb-2"><strong>Description:</strong> {speaker.description}</p>
                </Col>
            </Row>
        ));
    };

    return (
        <Modal show={show} onHide={handleClose} size="lg">
            <Modal.Header style={{ backgroundColor: '#4680ff', color: '#fff' }}>
                <Modal.Title>View Event</Modal.Title>
            </Modal.Header>

            <Modal.Body style={{ backgroundColor: '#f8f9fa', padding: 20 }}>
                <Container>

                    {/* Event Info */}
                    <Card className="mb-3">
                        <Card.Body>
                            <Card.Title>Event Information</Card.Title>
                            <hr />
                            <Row className="align-items-center flex-md-row flex-column">
                                <Col md={4} className="text-center mb-3 mb-md-0">
                                    {eventData.image && (
                                        <img
                                            src={`${API_URL}/${eventData.image}`}
                                            alt="Event"
                                            style={{
                                                width: '100%',
                                                height: '100%',
                                                maxWidth: '200px',
                                                maxHeight: '200px',
                                                objectFit: 'cover',
                                                borderRadius: '10%',
                                                border: '3px solid #4680ff'
                                            }}
                                        />
                                    )}
                                </Col>
                                <Col md={8}>
                                    <p className="mb-2"><strong>Name:</strong> {eventData.name}</p>
                                    <p className="mb-2">
                                        <strong>Date:</strong> {eventData.startDate} {eventData.startTime} to {eventData.endDate} {eventData.endTime}
                                    </p>
                                    <p className="mb-2"><strong>Type:</strong> {eventData.type || 'N/A'}</p>
                                    <p className="mb-2"><strong>Description:</strong> {eventData.description}</p>
                                </Col>
                            </Row>
                        </Card.Body>
                    </Card>

                    {/* Location Info */}
                    <Card className="mb-3">
                        <Card.Body>
                            <Card.Title>Location & Pricing</Card.Title>
                            <hr />
                            <Row>
                                <Col xs={6} md={3} className="text-start">
                                    <Card.Text className="mb-2">
                                        <strong>Location:</strong><br />
                                        {eventData.location || 'N/A'}
                                    </Card.Text>
                                </Col>
                                <Col xs={6} md={3} className="text-start">
                                    <Card.Text className="mb-2">
                                        <strong>Venue:</strong><br />
                                        {eventData.venue || 'N/A'}
                                    </Card.Text>
                                </Col>
                                <Col xs={6} md={3} className="text-start">
                                    <Card.Text className="mb-2">
                                        <strong>Country:</strong><br />
                                        {eventData.country || 'N/A'}
                                    </Card.Text>
                                </Col>
                                <Col xs={6} md={3} className="text-start">
                                    <Card.Text className="mb-2">
                                        <strong>Price:</strong><br />
                                        {eventData.price} {eventData.currency}
                                    </Card.Text>
                                </Col>
                            </Row>
                        </Card.Body>
                    </Card>

                    {/* Speakers Info */}
                    <Card className="mb-3">
                        <Card.Body>
                            <Card.Title>Speakers Details</Card.Title>
                            <hr />
                            {renderSpeakers()}
                        </Card.Body>
                    </Card>
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
