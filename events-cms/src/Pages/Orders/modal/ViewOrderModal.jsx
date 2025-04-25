import React from 'react';
import { Modal, Button, Row, Col, Card, Container } from 'react-bootstrap';
import { API_URL } from '../../../configs/env';

function ViewOrderModal({ show, handleClose, orderData }) {
    if (!orderData) return null;

    const renderOrderItems = () => {
        if (!orderData.orderItems?.length) {
            return <p>No events in this order.</p>;
        }

        return orderData.orderItems.map(({ id, event }) => (
            <Card key={id} className="mb-3">
                <Card.Body>
                    <Row className="align-items-center flex-md-row flex-column">
                        <Col md={4} className="text-center mb-3 mb-md-0">
                            {event.image && (
                                <img
                                    src={`${API_URL}/${event.image}`}
                                    alt={event.name}
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
                            <p className="mb-2"><strong>Name:</strong> {event.name}</p>
                            <p className="mb-2">
                                <strong>Date:</strong> {event.startDate} {event.startTime} to {event.endDate} {event.endTime}
                            </p>
                            <p className="mb-2"><strong>Type:</strong> {event.type || 'N/A'}</p>
                            <p className="mb-2"><strong>Description:</strong> {event.description}</p>
                            <p className="mb-2"><strong>Location:</strong> {event.location || 'N/A'}</p>
                            <p className="mb-2"><strong>Venue:</strong> {event.venue || 'N/A'}</p>
                            <p className="mb-2"><strong>Country:</strong> {event.country || 'N/A'}</p>
                            <p className="mb-2"><strong>Price:</strong> {event.price} {event.currency}</p>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>
        ));
    };

    return (
        <Modal show={show} onHide={handleClose} size="lg">
            <Modal.Header style={{ backgroundColor: '#4680ff', color: '#fff' }}>
                <Modal.Title>View Order</Modal.Title>
            </Modal.Header>

            <Modal.Body style={{ backgroundColor: '#f8f9fa', padding: 20 }}>
                <Container>

                    {/* Order & Customer Info (One Line) */}
                    <Card className="mb-3">
                        <Card.Body>
                            <Card.Title>Customer Details & Orders</Card.Title>
                            <hr />
                            <Row className="align-items-center">
                            <Col md={6}>
                                    <p className="mb-1"><strong>Customer:</strong> {orderData.user.firstName} {orderData.user.lastName}</p>
                                    <p className="mb-1"><strong>Mobile:</strong> {orderData.user.mobile}</p>
                                    <p className="mb-1"><strong>Email:</strong> {orderData.user.email}</p>
                                </Col>
                                <Col md={6}>
                                    <p className="mb-1"><strong>Order No:</strong> {orderData.orderNo}</p>
                                    <p className="mb-1"><strong>Status:</strong> {orderData.status}</p>
                                    <p className="mb-1"><strong>Payment:</strong> {orderData.paymentMethod}</p>
                                    <p className="mb-1"><strong>Total Price:</strong> {orderData.price}</p>
                                </Col>
                               
                            </Row>
                        </Card.Body>
                    </Card>

                    {/* Ordered Events */}
                    <Card className="mb-3">
                        <Card.Body>
                            <Card.Title>Ordered Events</Card.Title>
                            <hr />
                            {renderOrderItems()}
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

export default ViewOrderModal;
