import React from 'react';
import { Modal, Button, Row, Col, Card, Container } from 'react-bootstrap';
import { API_URL, DUMMY_PATH } from '../../../configs/env';

const ViewSpeakerModal = ({ show, handleClose, speakerData }) => {
    if (!speakerData) return null;

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const imageUrl = speakerData.speakerProfile ? `${API_URL}/${speakerData.speakerProfile}` : DUMMY_PATH;

    return (
        <Modal show={show} onHide={handleClose} size="lg">
            <Modal.Header style={{ backgroundColor: '#4680ff', color: '#fff' }}>
                <Modal.Title>
                    <i className="feather icon-user mr-2"></i>
                    Speaker Details
                </Modal.Title>
            </Modal.Header>
            <Modal.Body style={{ backgroundColor: '#f8f9fa', padding: 20 }}>
                <Container>
                    
                    {/* Speaker Info */}
                    <Card className="mb-3">
                        <Card.Body>
                            <Card.Title>Speaker Information</Card.Title>
                            <hr />
                            <Row className="align-items-center flex-md-row flex-column">
                                <Col md={4} className="text-center mb-3 mb-md-0">
                                    <img 
                                        src={imageUrl} 
                                        alt="speaker" 
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
                                </Col>
                                <Col md={8}>
                                    <p className="mb-2"><strong>Name:</strong> {speakerData.name}</p>
                                    <p className="mb-2"><strong>Email:</strong> {speakerData.email || 'N/A'}</p>
                                    <p className="mb-2"><strong>Mobile:</strong> {speakerData.mobile || 'N/A'}</p>
                                </Col>
                            </Row>
                        </Card.Body>
                    </Card>

                    {/* Professional Info */}
                    <Card className="mb-3">
                        <Card.Body>
                            <Card.Title>Professional Details</Card.Title>
                            <hr />
                            <Row>
                                <Col xs={6} md={6} className="text-start">
                                    <Card.Text className="mb-2">
                                        <strong>Position:</strong><br />
                                        {speakerData.position || 'N/A'}
                                    </Card.Text>
                                </Col>
                                <Col xs={6} md={6} className="text-start">
                                    <Card.Text className="mb-2">
                                        <strong>Company:</strong><br />
                                        {speakerData.companyName || 'N/A'}
                                    </Card.Text>
                                </Col>
                            </Row>
                        </Card.Body>
                    </Card>

                    {/* Location Info */}
                    <Card className="mb-3">
                        <Card.Body>
                            <Card.Title>Location Details</Card.Title>
                            <hr />
                            <Row>
                                <Col xs={12} className="text-start">
                                    <Card.Text className="mb-2">
                                        <strong>Location:</strong><br />
                                        {speakerData.location || 'N/A'}
                                    </Card.Text>
                                </Col>
                            </Row>
                        </Card.Body>
                    </Card>

                    {/* Timestamp Info */}
                    <Card className="mb-3">
                        <Card.Body>
                            <Card.Title>Timestamps</Card.Title>
                            <hr />
                            <Row>
                                <Col xs={6} className="text-start">
                                    <Card.Text className="mb-2">
                                        <strong>Created:</strong><br />
                                        {formatDate(speakerData.createdAt)}
                                    </Card.Text>
                                </Col>
                                <Col xs={6} className="text-start">
                                    <Card.Text className="mb-2">
                                        <strong>Updated:</strong><br />
                                        {formatDate(speakerData.updatedAt)}
                                    </Card.Text>
                                </Col>
                            </Row>
                        </Card.Body>
                    </Card>

                    {/* Description */}
                    {speakerData.description && (
                        <Card className="mb-3">
                            <Card.Body>
                                <Card.Title>Description</Card.Title>
                                <hr />
                                <Row>
                                    <Col xs={12} className="text-start">
                                        <Card.Text className="mb-2">
                                            {speakerData.description}
                                        </Card.Text>
                                    </Col>
                                </Row>
                            </Card.Body>
                        </Card>
                    )}
                </Container>
            </Modal.Body>
            <Modal.Footer style={{ backgroundColor: '#f8f9fa' }}>
                <Button variant="secondary" onClick={handleClose}>
                    <i className="feather icon-x mr-1"></i>
                    Close
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default ViewSpeakerModal; 