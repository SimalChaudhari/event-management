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
      <Modal.Body style={{ backgroundColor: '#f8f9fa', padding: '20px' }}>
        <Container>
          <Row className="text-center mb-4">
            <Col>
              {userData.profilePicture && (
                <img
                  src={`${API_URL}/${userData.profilePicture.replace(/\\/g, '/')}`}
                  alt="Profile"
                  style={{ width: '150px', height: '150px', borderRadius: '10%', border: '3px solid #4680ff' }}
                />
              )}
            </Col>
          </Row>
          <Row>
            <Col md={6}>
              <Card className="mb-3">
                <Card.Body>
                  <Card.Title>Basic Information</Card.Title>
                  <hr style={{ margin: '10px 0' }} />
                  <Card.Text><strong>First Name:</strong> {userData.firstName}</Card.Text>
                  <Card.Text><strong>Last Name:</strong> {userData.lastName}</Card.Text>
                  <Card.Text><strong>Email:</strong> {userData.email}</Card.Text>
                  <Card.Text><strong>Mobile:</strong> {userData.mobile}</Card.Text>
                </Card.Body>
              </Card>
            </Col>
            <Col md={6}>
              <Card className="mb-3">
                <Card.Body>
                  <Card.Title>Address</Card.Title>
                  <hr style={{ margin: '10px 0' }} />
                  <Card.Text><strong>Address:</strong> {userData.address}</Card.Text>
                  <Card.Text><strong>City:</strong> {userData.city}</Card.Text>
                  <Card.Text><strong>State:</strong> {userData.state}</Card.Text>
                  <Card.Text><strong>Postal Code:</strong> {userData.postalCode}</Card.Text>
                </Card.Body>
              </Card>
            </Col>
          </Row>
          <Row>
            <Col md={12}>
              <Card className="mb-3">
                <Card.Body>
                  <Card.Title>Membership</Card.Title>
                  <hr style={{ margin: '10px 0' }} />
                  <Card.Text><strong>Member:</strong> {userData.isMember ? 'Yes' : 'No'}</Card.Text>
                  <Card.Text><strong>Biometric Enabled:</strong> {userData.biometricEnabled ? 'Yes' : 'No'}</Card.Text>
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

export default ViewUserModal;