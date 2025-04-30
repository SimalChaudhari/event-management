import React from 'react';
import { Modal, Button, Row, Col, Card, Container } from 'react-bootstrap';

function ViewWithdrawalModal({ show, handleClose, withdrawalData }) {
    if (!withdrawalData) return null;

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
                            <Row className="align-items-center">
                                <Col md={6}>
                                    <p className="mb-1">
                                        <strong>User:</strong> {withdrawalData.user.firstName} {withdrawalData.user.lastName}
                                    </p>
                                    <p className="mb-1">
                                        <strong>Mobile:</strong> {withdrawalData.user.mobile || 'N/A'}
                                    </p>
                                    <p className="mb-1">
                                        <strong>Email:</strong> {withdrawalData.user.email}
                                    </p>
                                </Col>
                                <Col md={6}>
                                    <p className="mb-1">
                                        <strong>Request No:</strong> {withdrawalData.requestNo}
                                    </p>
                                    <p className="mb-1">
                                        <strong>Status:</strong> {withdrawalData.status}
                                    </p>
                                    <p className="mb-1">
                                        <strong>Method:</strong> {withdrawalData.method}
                                    </p>
                                    <p className="mb-1">
                                        <strong>Amount:</strong> ${parseFloat(withdrawalData.amount).toFixed(2)}
                                    </p>
                                </Col>
                            </Row>
                        </Card.Body>
                    </Card>

                    {/* Optional Note Section */}
                    {withdrawalData.note && (
                        <Card className="mb-3">
                            <Card.Body>
                                <Card.Title>Note</Card.Title>
                                <hr />
                                <p>{withdrawalData.note}</p>
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
