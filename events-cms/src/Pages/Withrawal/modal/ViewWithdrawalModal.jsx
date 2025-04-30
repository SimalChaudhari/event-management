import React from 'react';
import { Modal, Button, Row, Col, Card, Container, Image } from 'react-bootstrap';
import { API_URL } from '../../../configs/env';

function ViewWithdrawalModal({ show, handleClose, withdrawalData }) {
    if (!withdrawalData) return null;

    const {
        reason,
        comment,
        status,
        request_at,
        reviewed_at,
        document,
        order,
    } = withdrawalData;

    const user = order?.user;

    const renderOrderItems = () => {
        if (!order?.orderItems?.length) {
            return <p>No events in this order.</p>;
        }

        return order.orderItems.map(({ id, event }) => (
            <Card key={id} className="mb-3">
                <Card.Body>
                    <Row className="align-items-center flex-md-row flex-column">
                        <Col md={4} className="text-center mb-3 mb-md-0">
                            {event.image && (
                                <Image
                                    src={`${API_URL}/${event.image}`}
                                    alt={event.name}
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        maxWidth: '200px',
                                        maxHeight: '200px',
                                        objectFit: 'cover',
                                        borderRadius: '10%',
                                        border: '3px solid #4680ff',
                                    }}
                                />
                            )}
                        </Col>
                        <Col md={8}>
                            <p className="mb-2"><strong>Name:</strong> {event.name}</p>
                            <p className="mb-2"><strong>Date:</strong> {event.startDate} {event.startTime} to {event.endDate} {event.endTime}</p>
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
                <Modal.Title>View Withdrawal Request</Modal.Title>
            </Modal.Header>

            <Modal.Body style={{ backgroundColor: '#f8f9fa', padding: 20 }}>
                <Container>

                    {/* User & Request Details */}
                    <Card className="mb-3">
                        <Card.Body>
                            <Card.Title>User & Request Details</Card.Title>
                            <hr />
                            <Row>
                                <Col md={6}>
                                    <p><strong>User:</strong> {user?.firstName} {user?.lastName}</p>
                                    <p><strong>Mobile:</strong> {user?.mobile}</p>
                                    <p><strong>Email:</strong> {user?.email}</p>
                                    <p><strong>Reason:</strong> {reason}</p>
                                    <p><strong>Comment:</strong> {comment}</p>
                                </Col>
                                <Col md={6}>
                                    <p><strong>Status:</strong> {status}</p>
                                    <p><strong>Requested At:</strong> {new Date(request_at).toLocaleString()}</p>
                                    <p><strong>Reviewed At:</strong> {reviewed_at ? new Date(reviewed_at).toLocaleString() : 'Pending'}</p>
                                    <p><strong>Order No:</strong> {order?.orderNo}</p>
                                    <p><strong>Payment Method:</strong> {order?.paymentMethod}</p>
                                    <p><strong>Total Price:</strong> ${parseFloat(order?.price).toFixed(2)}</p>
                                </Col>
                            </Row>
                        </Card.Body>
                    </Card>

                    {/* Document */}
                    {document && (
                        <Card className="mb-3">
                            <Card.Body>
                                <Card.Title>Attached Document</Card.Title>
                                <hr />
                                <Image src={`/${document}`} fluid rounded alt="Withdrawal Document" />
                            </Card.Body>
                        </Card>
                    )}

                    {/* Event Details */}
                    {order?.orderItems?.length > 0 && (
                        <Card className="mb-3">
                            <Card.Body>
                                <Card.Title>Event Details</Card.Title>
                                <hr />
                                {renderOrderItems()}
                            </Card.Body>
                        </Card>
                    )}

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

export default ViewWithdrawalModal;
