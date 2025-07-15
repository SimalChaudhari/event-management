import React, { useState } from 'react';
import { Modal, Button, Row, Col, Card, Container, Nav } from 'react-bootstrap';
import { API_URL } from '../../../configs/env';

function ViewUserModal({ show, handleClose, userData }) {
  const [activeTab, setActiveTab] = useState('personal');
  const [showProfileImageModal, setShowProfileImageModal] = useState(false);

  if (!userData) return null;

  const tabStyle = {
    border: 'none',
    backgroundColor: 'transparent',
    color: '#6c757d',
    fontWeight: '500',
    padding: '12px 20px',
    borderRadius: '8px 8px 0 0',
    marginRight: '5px',
    transition: 'all 0.3s ease',
    fontSize: '14px'
  };

  const activeTabStyle = {
    ...tabStyle,
    backgroundColor: '#4680ff',
    color: 'white',
    fontWeight: '600'
  };

  const handleProfileImageClick = () => {
    if (userData.profilePicture) {
      setShowProfileImageModal(true);
    }
  };

  return (
    <>
      <Modal show={show} onHide={handleClose} size="lg">
        <Modal.Header style={{ backgroundColor: '#4680ff', color: '#fff' }}>
          <Modal.Title>
            <i className="feather icon-user mr-2"></i>
            User Details
          </Modal.Title>
        </Modal.Header>

        <Modal.Body style={{ backgroundColor: '#f8f9fa', padding: 20 }}>
          <Container fluid>
            
            {/* User Profile Image and Basic Info */}
            <Card className="mb-4">
              <Card.Body>
                <Card.Title>
                  <i className="feather icon-user mr-2"></i>
                  Personal Information
                </Card.Title>
                <hr />
                <Row className="align-items-center">
                  <Col xs={12} md={4} className="text-center mb-3 mb-md-0">
                    {userData.profilePicture && (
                      <div style={{ position: 'relative', display: 'inline-block' }}>
                        <img
                          src={`${API_URL}/${userData.profilePicture.replace(/\\/g, '/')}`}
                          alt="Profile"
                          style={{
                            width: '100%',
                            maxWidth: '200px',
                            height: '200px',
                            objectFit: 'cover',
                            borderRadius: '10%',
                            border: '3px solid #4680ff',
                            cursor: 'pointer',
                            transition: 'transform 0.2s'
                          }}
                          onClick={handleProfileImageClick}
                          onMouseEnter={(e) => (e.target.style.transform = 'scale(1.04)')}
                          onMouseLeave={(e) => (e.target.style.transform = 'scale(1)')}
                        />
                        <div
                          style={{
                            position: 'absolute',
                            top: '10px',
                            right: '10px',
                            backgroundColor: 'rgba(0,0,0,0.7)',
                            color: 'white',
                            padding: '5px',
                            borderRadius: '50%',
                            fontSize: '12px',
                            cursor: 'pointer'
                          }}
                          onClick={handleProfileImageClick}
                        >
                          <i className="fas fa-search-plus"></i>
                        </div>
                      </div>
                    )}
                    {!userData.profilePicture && (
                      <div
                        style={{
                          width: '200px',
                          height: '200px',
                          backgroundColor: '#e9ecef',
                          borderRadius: '10%',
                          border: '3px solid #4680ff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          margin: '0 auto'
                        }}
                      >
                        <i className="feather icon-user" style={{ fontSize: '60px', color: '#6c757d' }}></i>
                      </div>
                    )}
                  </Col>
                  <Col xs={12} md={8}>
                    <div className="row">
                      <div className="col-12 mb-2">
                        <strong>Full Name:</strong> {userData.firstName} {userData.lastName}
                      </div>
                      <div className="col-12 mb-2">
                        <strong>Email:</strong> {userData.email}
                      </div>
                      <div className="col-12 mb-2">
                        <strong>Mobile:</strong> {userData.mobile || 'N/A'}
                      </div>
                    </div>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            {/* Responsive Tab Navigation */}
            <div className="mb-4">
              <Nav 
                variant="tabs" 
                className="flex-column flex-sm-row"
                style={{
                  borderBottom: '2px solid #e9ecef',
                  gap: '5px'
                }}
              >
                <Nav.Item>
                  <Nav.Link
                    active={activeTab === 'personal'}
                    onClick={() => setActiveTab('personal')}
                    style={activeTab === 'personal' ? activeTabStyle : tabStyle}
                    className="text-center"
                  >
                    <i className="feather icon-user mr-2"></i>
                    <span className="d-none d-sm-inline">Personal</span>
                    <span className="d-sm-none">Personal</span>
                  </Nav.Link>
                </Nav.Item>
                
                {(userData.address || userData.city || userData.state || userData.postalCode) && (
                  <Nav.Item>
                    <Nav.Link
                      active={activeTab === 'address'}
                      onClick={() => setActiveTab('address')}
                      style={activeTab === 'address' ? activeTabStyle : tabStyle}
                      className="text-center"
                    >
                      <i className="feather icon-map-pin mr-2"></i>
                      <span className="d-none d-sm-inline">Address</span>
                      <span className="d-sm-none">Address</span>
                    </Nav.Link>
                  </Nav.Item>
                )}

                {(userData.isMember !== undefined || userData.biometricEnabled !== undefined) && (
                  <Nav.Item>
                    <Nav.Link
                      active={activeTab === 'membership'}
                      onClick={() => setActiveTab('membership')}
                      style={activeTab === 'membership' ? activeTabStyle : tabStyle}
                      className="text-center"
                    >
                      <i className="feather icon-shield mr-2"></i>
                      <span className="d-none d-sm-inline">Membership</span>
                      <span className="d-sm-none">Member</span>
                    </Nav.Link>
                  </Nav.Item>
                )}
              </Nav>
            </div>

            {/* Tab Content */}
            <div>
              {/* Personal Tab */}
              {activeTab === 'personal' && (
                <Card>
                  <Card.Body>
                    <Card.Title>
                      <i className="feather icon-user mr-2"></i>
                      Personal Details
                    </Card.Title>
                    <hr />
                    <Row>
                      <Col xs={12} md={6} className="mb-3">
                        <strong>First Name:</strong><br />
                        <span className="text-muted">{userData.firstName || 'N/A'}</span>
                      </Col>
                      <Col xs={12} md={6} className="mb-3">
                        <strong>Last Name:</strong><br />
                        <span className="text-muted">{userData.lastName || 'N/A'}</span>
                      </Col>
                      <Col xs={12} md={6} className="mb-3">
                        <strong>Email:</strong><br />
                        <span className="text-muted">{userData.email || 'N/A'}</span>
                      </Col>
                      <Col xs={12} md={6} className="mb-3">
                        <strong>Mobile:</strong><br />
                        <span className="text-muted">{userData.mobile || 'N/A'}</span>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
              )}

              {/* Address Tab */}
              {activeTab === 'address' && (userData.address || userData.city || userData.state || userData.postalCode) && (
                <Card>
                  <Card.Body>
                    <Card.Title>
                      <i className="feather icon-map-pin mr-2"></i>
                      Address Details
                    </Card.Title>
                    <hr />
                    <Row>
                      <Col xs={12} className="mb-3">
                        <strong>Address:</strong><br />
                        <span className="text-muted">{userData.address || 'N/A'}</span>
                      </Col>
                      <Col xs={12} md={6} className="mb-3">
                        <strong>City:</strong><br />
                        <span className="text-muted">{userData.city || 'N/A'}</span>
                      </Col>
                      <Col xs={12} md={6} className="mb-3">
                        <strong>State:</strong><br />
                        <span className="text-muted">{userData.state || 'N/A'}</span>
                      </Col>
                      <Col xs={12} md={6} className="mb-3">
                        <strong>Postal Code:</strong><br />
                        <span className="text-muted">{userData.postalCode || 'N/A'}</span>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
              )}

              {/* Membership Tab */}
              {activeTab === 'membership' && (userData.isMember !== undefined || userData.biometricEnabled !== undefined) && (
                <Card>
                  <Card.Body>
                    <Card.Title>
                      <i className="feather icon-shield mr-2"></i>
                      Membership Details
                    </Card.Title>
                    <hr />
                    <Row>
                      <Col xs={12} md={6} className="mb-3">
                        <strong>Member Status:</strong><br />
                        <span className={`badge ${userData.isMember ? 'bg-success' : 'bg-secondary'}`}>
                          {userData.isMember ? 'Active Member' : 'Not a Member'}
                        </span>
                      </Col>
                      <Col xs={12} md={6} className="mb-3">
                        <strong>Biometric Access:</strong><br />
                        <span className={`badge ${userData.biometricEnabled ? 'bg-success' : 'bg-warning'}`}>
                          {userData.biometricEnabled ? 'Enabled' : 'Disabled'}
                        </span>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
              )}
            </div>
          </Container>
        </Modal.Body>

        <Modal.Footer style={{ backgroundColor: '#f8f9fa' }}>
          <Button variant="secondary" onClick={handleClose}>
            <i className="feather icon-x mr-1"></i>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Profile Image Modal */}
      {userData.profilePicture && (
        <Modal
          show={showProfileImageModal}
          onHide={() => setShowProfileImageModal(false)}
          size="xl"
          centered
          style={{ backgroundColor: 'rgba(0,0,0,0.95)' }}
        >
          <Modal.Body
            style={{
              padding: 0,
              backgroundColor: 'transparent',
              position: 'relative',
              minHeight: '90vh'
            }}
          >
            {/* Close Button */}
            <Button
              variant="light"
              size="sm"
              onClick={() => setShowProfileImageModal(false)}
              style={{
                position: 'fixed',
                top: '20px',
                right: '20px',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                zIndex: 1000,
                backgroundColor: 'rgba(0,0,0,0.7)',
                border: 'none',
                color: 'white'
              }}
            >
              <i className="fas fa-times"></i>
            </Button>

            {/* Download Button */}
            <Button
              variant="light"
              size="sm"
              onClick={() => {
                const link = document.createElement('a');
                link.href = `${API_URL}/${userData.profilePicture.replace(/\\/g, '/')}`;
                link.download = `user-profile.jpg`;
                link.click();
              }}
              style={{
                position: 'fixed',
                top: '20px',
                left: '20px',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                zIndex: 1000,
                backgroundColor: 'rgba(0,0,0,0.7)',
                border: 'none',
                color: 'white'
              }}
            >
              <i className="fas fa-download"></i>
            </Button>

            {/* Image Container */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '90vh',
                padding: '60px 80px 80px 80px'
              }}
            >
              <img
                src={`${API_URL}/${userData.profilePicture.replace(/\\/g, '/')}`}
                alt="User Profile"
                style={{
                  maxWidth: '100%',
                  maxHeight: '100%',
                  objectFit: 'contain',
                  borderRadius: '8px'
                }}
                onError={(e) => {
                  console.error('User profile image failed to load:', userData.profilePicture);
                  e.target.style.display = 'none';
                }}
              />
            </div>
          </Modal.Body>
        </Modal>
      )}
    </>
  );
}

export default ViewUserModal;