import React from 'react';
import { Modal, Button, Row, Col, Card, Container } from 'react-bootstrap';
import { API_URL } from '../../../configs/env';

function ViewUserModal({ show, handleClose, userData }) {
  if (!userData) return null;

  return (
    <Modal show={show} onHide={handleClose} size="lg">
      <Modal.Header style={{ backgroundColor: '#4680ff', color: '#fff' }}>
        <Modal.Title>View User</Modal.Title>
      </Modal.Header>

      <Modal.Body style={{ backgroundColor: '#f8f9fa', padding: 20 }}>
        <Container>
          
          {/* User Info */}
          <Card className="mb-3">
            <Card.Body>
              <Card.Title>User Information</Card.Title>
              <hr />
              <Row className="align-items-center flex-md-row flex-column">
                <Col md={4} className="text-center mb-3 mb-md-0">
                  {userData.profilePicture && (
                    <img
                      src={`${API_URL}/${userData.profilePicture.replace(/\\/g, '/')}`}
                      alt="Profile"
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
                  <p className="mb-2"><strong>Name:</strong> {userData.firstName} {userData.lastName}</p>
                  <p className="mb-2"><strong>Email:</strong> {userData.email}</p>
                  <p className="mb-2"><strong>Mobile:</strong> {userData.mobile}</p>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {/* Address Info */}
          <Card className="mb-3">
            <Card.Body>
              <Card.Title>Address Details</Card.Title>
              <hr />
              <Row>
                <Col xs={6} md={3} className="text-start">
                  <Card.Text className="mb-2">
                    <strong>Address:</strong><br />
                    {userData.address || 'N/A'}
                  </Card.Text>
                </Col>
                <Col xs={6} md={3} className="text-start">
                  <Card.Text className="mb-2">
                    <strong>City:</strong><br />
                    {userData.city || 'N/A'}
                  </Card.Text>
                </Col>
                <Col xs={6} md={3} className="text-start">
                  <Card.Text className="mb-2">
                    <strong>State:</strong><br />
                    {userData.state || 'N/A'}
                  </Card.Text>
                </Col>
                <Col xs={6} md={3} className="text-start">
                  <Card.Text className="mb-2">
                    <strong>Postal Code:</strong><br />
                    {userData.postalCode || 'N/A'}
                  </Card.Text>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {/* Membership Info */}
          <Card className="mb-3">
            <Card.Body>
              <Card.Title>Membership Details</Card.Title>
              <hr />
              <Row>
                <Col xs={6} className="text-start">
                  <Card.Text className="mb-2">
                    <strong>Member Status:</strong><br />
                    {userData.isMember ? 'Active Member' : 'Not a Member'}
                  </Card.Text>
                </Col>
                <Col xs={6} className="text-start">
                  <Card.Text className="mb-2">
                    <strong>Biometric Access:</strong><br />
                    {userData.biometricEnabled ? 'Enabled' : 'Disabled'}
                  </Card.Text>
                </Col>
              </Row>
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

export default ViewUserModal;