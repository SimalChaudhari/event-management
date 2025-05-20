import React from 'react';
import { Modal, Button, Card, Row, Col, Container } from 'react-bootstrap';
import { API_URL } from '../../../../configs/env';

const RegisterEventModal = ({ show, onHide, eventData }) => {
    console.log(eventData);
    if (!eventData) return null;

    const regDate = new Date(eventData.createdAt).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    const renderSpeakers = () => {
        if (!eventData?.event?.speakers?.length) {
            return <p>No speakers listed.</p>;
        }

        return eventData.event?.speakers.map((speaker) => (
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
                    <p className="mb-2">
                        <strong>Name:</strong> {speaker.name}
                    </p>
                    <p className="mb-2">
                        <strong>Company:</strong> {speaker.companyName}
                    </p>
                    <p className="mb-2">
                        <strong>Position:</strong> {speaker.position}
                    </p>
                    <p className="mb-2">
                        <strong>Mobile:</strong> {speaker.mobile}
                    </p>
                    <p className="mb-2">
                        <strong>Email:</strong> {speaker.email}
                    </p>
                    <p className="mb-2">
                        <strong>Location:</strong> {speaker.location}
                    </p>
                    <p className="mb-2">
                        <strong>Description:</strong> {speaker.description}
                    </p>
                </Col>
            </Row>
        ));
    };

    return (
        <Modal show={show} onHide={onHide} size="lg">
            <Modal.Header style={{ backgroundColor: '#4680ff', color: '#fff' }}>
                <Modal.Title>Registered Event Details</Modal.Title>
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
                                    {eventData.event?.image && (
                                        <img
                                            src={`${API_URL}/${eventData.event?.image}`}
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
                                    <p className="mb-2">
                                        <strong>Name:</strong> {eventData.event?.name}
                                    </p>
                                    <p className="mb-2">
                                        <strong>Date:</strong> {eventData.event?.startDate} {eventData.event?.startTime} to{' '}
                                        {eventData.event?.endDate} {eventData.event?.endTime}
                                    </p>
                                    <p className="mb-2">
                                        <strong>Type:</strong> {eventData.event?.type || 'N/A'}
                                    </p>
                                    <p className="mb-2">
                                        <strong>Description:</strong> {eventData.event?.description}
                                    </p>
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
                                        <strong>Location:</strong>
                                        <br />
                                        {eventData.event?.location || 'N/A'}
                                    </Card.Text>
                                </Col>
                                <Col xs={6} md={3} className="text-start">
                                    <Card.Text className="mb-2">
                                        <strong>Venue:</strong>
                                        <br />
                                        {eventData.event?.venue || 'N/A'}
                                    </Card.Text>
                                </Col>
                                <Col xs={6} md={3} className="text-start">
                                    <Card.Text className="mb-2">
                                        <strong>Country:</strong>
                                        <br />
                                        {eventData.event?.country || 'N/A'}
                                    </Card.Text>
                                </Col>
                                <Col xs={6} md={3} className="text-start">
                                    <Card.Text className="mb-2">
                                        <strong>Price:</strong>
                                        <br />
                                        {eventData.event?.price} {eventData.event?.currency}
                                    </Card.Text>
                                </Col>
                            </Row>
                        </Card.Body>
                    </Card>

                    {/* Speakers */}
                    <Card className="mb-3">
                        <Card.Body>
                            <Card.Title>Speakers Details</Card.Title>
                            <hr />
                            {renderSpeakers()}
                        </Card.Body>
                    </Card>

                    {/* Order Info */}
                    {eventData?.order && (
                        <Card className="mb-3">
                            <Card.Body>
                                <Card.Title>Order Details</Card.Title>
                                <hr />
                                <Row>
                                    <Col xs={6} md={4} className="text-start">
                                        <Card.Text className="mb-2">
                                            <strong>Order Number:</strong>
                                            <br />
                                            {eventData.order?.orderNo || 'N/A'}
                                        </Card.Text>
                                    </Col>
                                    <Col xs={6} md={4} className="text-start">
                                        <Card.Text className="mb-2">
                                            <strong>Payment Status:</strong>
                                            <br />
                                            {eventData.order?.status || 'N/A'}
                                        </Card.Text>
                                    </Col>
                                    <Col xs={6} md={4} className="text-start">
                                        <Card.Text className="mb-2">
                                            <strong>Amount Paid:</strong>
                                            <br />
                                            {eventData.order.price || 'N/A'} {eventData.order.currency || ''}
                                        </Card.Text>
                                    </Col>
                                    <Col xs={6} md={4} className="text-start mt-2">
                                        <Card.Text className="mb-2">
                                            <strong>Payment Method:</strong>
                                            <br />
                                            {eventData.order.paymentMethod || 'N/A'}
                                        </Card.Text>
                                    </Col>

                                    <Col xs={6} md={4} className="text-start">
                                        <Card.Text className="mb-2">
                                            <strong>Transaction Date:</strong>
                                            <br />

                                            {regDate ? regDate : 'N/A'}
                                        </Card.Text>
                                    </Col>
                                </Row>
                            </Card.Body>
                        </Card>
                    )}
                </Container>
            </Modal.Body>
            <Modal.Footer style={{ backgroundColor: '#f8f9fa' }}>
                <Button variant="secondary" onClick={onHide}>
                    Close
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default RegisterEventModal;
