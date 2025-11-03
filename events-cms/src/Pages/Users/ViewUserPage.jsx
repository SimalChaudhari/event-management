import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Row, Col, Card, Container, Modal, Badge } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import { userById } from '../../store/actions/userActions';
import { API_URL } from '../../configs/env';
import NoDataFound from '../../components/NoDataFound';
import { USER_PATHS } from '../../utils/constants';
import { formatPhoneDisplay } from '../../utils/phoneFormatter';

const ViewUserPage = () => {
    const { id } = useParams();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { userByID } = useSelector(state => state.user);
    const [showProfileImageModal, setShowProfileImageModal] = useState(false);

    useEffect(() => {
        if (id) {
            dispatch(userById(id));
        }
    }, [id, dispatch]);

    if (!userByID) {
        return (
            <NoDataFound
                title="User Not Found"
                message="The user you're looking for doesn't exist or has been removed."
                icon="fas fa-user-slash"
                variant="warning"
                size="medium"
                showBackButton={true}
                backButtonText="Back"
                backButtonPath={`${USER_PATHS.LIST_USERS}`}
            />
        );
    }

    const userData = userByID;

    const handleProfileImageClick = () => {
        if (userData.profilePicture) {
            setShowProfileImageModal(true);
        }
    };

    const InfoCard = ({ title, icon, children, className = "" }) => (
        <Card className={`mb-4 ${className}`} style={{ 
            backgroundColor: '#fff', 
            borderRadius: '8px', 
            padding: '20px', 
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            border: '1px solid #e9ecef',
            borderLeft: '4px solid #4680ff'
        }}>
            <Card.Body style={{ padding: '24px' }}>
                <Card.Title style={{ 
                    fontSize: '18px', 
                    fontWeight: '600', 
                    color: '#2c3e50',
                    marginBottom: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                }}>
                    <i className={icon} style={{ color: '#4680ff' }}></i>
                    {title}
                </Card.Title>
                <hr style={{ margin: '0 0 20px 0', borderTop: '2px solid #4680ff', opacity: '0.8' }} />
                {children}
            </Card.Body>
        </Card>
    );

    const InfoField = ({ label, value, icon = null }) => (
        <div className="mb-3" style={{ 
            padding: '12px 16px',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px',
            border: '1px solid #e9ecef'
        }}>
            <div style={{ 
                fontSize: '13px', 
                fontWeight: '600', 
                color: '#6c757d',
                marginBottom: '4px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
            }}>
                {icon && <i className={icon} style={{ fontSize: '12px' }}></i>}
                {label}
            </div>
            <div style={{ 
                fontSize: '15px', 
                color: '#2c3e50',
                fontWeight: '500'
            }}>
                {value || 'N/A'}
            </div>
        </div>
    );

    return (
        <>
            <Container fluid className="mt-4">
                {/* Header */}
                <div style={{ 
                    backgroundColor: '#fff', 
                    borderRadius: '8px', 
                    padding: '20px', 
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    marginBottom: '24px',
                    borderTop: '4px solid #4680ff'
                }}>
                    <div className="d-flex justify-content-between align-items-center">
                        <div>
                            <h4 style={{ 
                                margin: 0, 
                                color: '#2c3e50',
                                fontWeight: '600'
                            }}>
                                <i className="feather icon-user mr-2" style={{ color: '#4680ff' }}></i>
                                User Profile
                            </h4>
                            <p style={{ 
                                margin: '8px 0 0 0', 
                                color: '#6c757d',
                                fontSize: '14px'
                            }}>
                                View detailed information about this user
                            </p>
                        </div>
                        <Button 
                            variant="outline-secondary" 
                            onClick={() => navigate('/users')}
                            style={{ 
                                borderRadius: '8px',
                                padding: '8px 16px',
                                border: '1px solid #dee2e6',
                                fontWeight: '500'
                            }}
                        >
                            <i className="fas fa-arrow-left me-2" style={{marginRight: '10px'}}></i>
                            Back
                        </Button>
                    </div>
                </div>

                <Row>
                    {/* Left Column - Profile Image and Basic Info */}
                    <Col lg={4} md={12} className="mb-4">
                        <InfoCard title="Profile Information" icon="feather icon-user">
                            <div className="text-center mb-4">
                                {userData.profilePicture ? (
                                    <div style={{ position: 'relative', display: 'inline-block' }}>
                                        <img
                                            src={`${API_URL}/${userData.profilePicture.replace(/\\/g, '/')}`}
                                            alt="Profile"
                                            style={{
                                                width: '180px',
                                                height: '180px',
                                                objectFit: 'cover',
                                                borderRadius: '50%',
                                                border: '4px solid #4680ff',
                                                cursor: 'pointer',
                                                transition: 'transform 0.2s, box-shadow 0.2s',
                                                boxShadow: '0 4px 12px rgba(70, 128, 255, 0.2)'
                                            }}
                                            onClick={handleProfileImageClick}
                                            onMouseEnter={(e) => {
                                                e.target.style.transform = 'scale(1.05)';
                                                e.target.style.boxShadow = '0 6px 20px rgba(70, 128, 255, 0.3)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.target.style.transform = 'scale(1)';
                                                e.target.style.boxShadow = '0 4px 12px rgba(70, 128, 255, 0.2)';
                                            }}
                                        />
                                        <div
                                            style={{
                                                position: 'absolute',
                                                bottom: '10px',
                                                right: '10px',
                                                backgroundColor: '#4680ff',
                                                color: 'white',
                                                padding: '6px',
                                                borderRadius: '50%',
                                                fontSize: '12px',
                                                cursor: 'pointer',
                                                boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                                            }}
                                            onClick={handleProfileImageClick}
                                        >
                                            <i className="fas fa-search-plus"></i>
                                        </div>
                                    </div>
                                ) : (
                                    <div
                                        style={{
                                            width: '180px',
                                            height: '180px',
                                            backgroundColor: '#f8f9fa',
                                            borderRadius: '50%',
                                            border: '4px solid #4680ff',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            margin: '0 auto',
                                            boxShadow: '0 4px 12px rgba(70, 128, 255, 0.2)'
                                        }}
                                    >
                                        <i className="feather icon-user" style={{ fontSize: '60px', color: '#6c757d' }}></i>
                                    </div>
                                )}
                            </div>

                            <InfoField 
                                label="Full Name" 
                                value={`${userData.salutation ? userData.salutation + ' ' : ''}${userData.firstName} ${userData.lastName}`}
                                icon="feather icon-user"
                            />

                            
                            <InfoField 
                                label="Email Address" 
                                value={userData.email}
                                icon="feather icon-mail"
                            />
                            <InfoField 
                                label="Mobile Number" 
                                value={formatPhoneDisplay(userData.mobile)}
                                icon="feather icon-phone"
                            />
                            {userData.salutation && (
                                <InfoField 
                                    label="Salutation" 
                                    value={userData.salutation}
                                    icon="feather icon-user"
                                />
                            )}
                            {userData.company && (
                                <InfoField 
                                    label="Company" 
                                    value={userData.company}
                                    icon="feather icon-briefcase"
                                />
                            )}
                            {userData.designation && (
                                <InfoField 
                                    label="Designation" 
                                    value={userData.designation}
                                    icon="feather icon-award"
                                />
                            )}
                            {userData.industry && (
                                <InfoField 
                                    label="Industry" 
                                    value={userData.industry}
                                    icon="feather icon-trending-up"
                                />
                            )}
                        </InfoCard>
                    </Col>

                    {/* Right Column - Detailed Information */}
                    <Col lg={8} md={12}>
                        {/* Account Details */}
                        <InfoCard title="Account Details" icon="feather icon-settings">
                            <Row>
                                <Col xs={12} md={6}>
                                    <InfoField 
                                        label="User Role" 
                                        value={userData.role}
                                        icon="feather icon-shield"
                                    />
                                </Col>
                                <Col xs={12} md={6}>
                                    <InfoField 
                                        label="Account Verified" 
                                        value={userData.isVerify ? 'Yes' : 'No'}
                                        icon="feather icon-check-circle"
                                    />
                                </Col>
                                <Col xs={12} md={6}>
                                    <InfoField 
                                        label="Terms Accepted" 
                                        value={userData.acceptTerms ? 'Yes' : 'No'}
                                        icon="feather icon-file-text"
                                    />
                                </Col>
                                <Col xs={12} md={6}>
                                    <InfoField 
                                        label="Authentication Provider" 
                                        value={userData.authProvider}
                                        icon="feather icon-lock"
                                    />
                                </Col>
                                {userData.socialId && (
                                    <Col xs={12} md={6}>
                                        <InfoField 
                                            label="Social ID" 
                                            value={userData.socialId}
                                            icon="feather icon-link"
                                        />
                                    </Col>
                                )}
                                {userData.linkedinProfile && (
                                    <Col xs={12} md={6}>
                                        <InfoField 
                                            label="LinkedIn Profile" 
                                            value={userData.linkedinProfile}
                                            icon="fab fa-linkedin"
                                        />
                                    </Col>
                                )}
                                {userData.countryCurrency && (
                                    <Col xs={12} md={6}>
                                        <InfoField 
                                            label="Country Currency" 
                                            value={userData.countryCurrency}
                                            icon="feather icon-dollar-sign"
                                        />
                                    </Col>
                                )}
                            </Row>
                        </InfoCard>

                        {/* Account History Card */}
                        <InfoCard title="Account History" icon="feather icon-clock">
                            <Row>
                                <Col xs={12} md={6}>
                                    <InfoField 
                                        label="Account Created" 
                                        value={new Date(userData.createdAt).toLocaleString()}
                                        icon="feather icon-user-plus"
                                    />
                                </Col>
                                <Col xs={12} md={6}>
                                    <InfoField 
                                        label="Last Updated" 
                                        value={new Date(userData.updatedAt).toLocaleString()}
                                        icon="feather icon-edit"
                                    />
                                </Col>
                              
                            </Row>
                        </InfoCard>
                    </Col>

                    <Col xs={12}>
                        {/* Address Details - Show all addresses */}
                        {userData.addresses && Array.isArray(userData.addresses) && userData.addresses.length > 0 && (
                            <InfoCard title="Address Information" icon="feather icon-map-pin">
                                {userData.addresses.map((address, index) => (
                                    <div key={address.id} className="mb-4">
                                        {userData.addresses.length > 1 && (
                                            <div style={{
                                                backgroundColor: '#e9ecef',
                                                padding: '8px 12px',
                                                borderRadius: '6px',
                                                marginBottom: '12px',
                                                fontSize: '14px',
                                                fontWeight: '600',
                                                color: '#495057',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                borderLeft: '3px solid #4680ff'
                                            }}>
                                                <span>Address {index + 1}</span>
                                                <div>
                                                    {address.isDefault && (
                                                        <Badge bg="primary" style={{ fontSize: '10px', marginRight: '6px' }}>
                                                            Default
                                                        </Badge>
                                                    )}
                                                    <Badge bg="secondary" style={{ fontSize: '10px' }}>
                                                        {address.type}
                                                    </Badge>
                                                </div>
                                            </div>
                                        )}
                                        <Row>
                                            <Col xs={12} md={4}>
                                                <InfoField 
                                                    label="Street Address" 
                                                    value={address.street}
                                                    icon="feather icon-map-pin"
                                                />
                                            </Col>
                                            {address.apartment && (
                                                <Col xs={12} md={4}>
                                                    <InfoField 
                                                        label="Apartment/Unit" 
                                                        value={address.apartment}
                                                        icon="feather icon-home"
                                                    />
                                                </Col>
                                            )}
                                            {address.landmark && (
                                                <Col xs={12} md={4}>
                                                    <InfoField 
                                                        label="Landmark" 
                                                        value={address.landmark}
                                                        icon="feather icon-navigation"
                                                    />
                                                </Col>
                                            )}
                                            <Col xs={12} md={4}>
                                                <InfoField 
                                                    label="City" 
                                                    value={address.city}
                                                    icon="feather icon-map-pin"
                                                />
                                            </Col>
                                            <Col xs={12} md={4}>
                                                <InfoField 
                                                    label="State" 
                                                    value={address.state}
                                                    icon="feather icon-map-pin"
                                                />
                                            </Col>
                                            <Col xs={12} md={4}>
                                                <InfoField 
                                                    label="Postal Code" 
                                                    value={address.postalCode}
                                                    icon="feather icon-map-pin"
                                                />
                                            </Col>
                                            <Col xs={12} md={4}>
                                                <InfoField 
                                                    label="Country" 
                                                    value={address.country}
                                                    icon="feather icon-globe"
                                                />
                                            </Col>
                                            {address.label && (
                                                <Col xs={12} md={4}>
                                                    <InfoField 
                                                        label="Address Label" 
                                                        value={address.label}
                                                        icon="feather icon-tag"
                                                    />
                                                </Col>
                                            )}
                                            {address.instructions && (
                                                <Col xs={12}>
                                                    <InfoField 
                                                        label="Delivery Instructions" 
                                                        value={address.instructions}
                                                        icon="feather icon-message-square"
                                                    />
                                                </Col>
                                            )}
                                        </Row>
                                        {index < userData.addresses.length - 1 && (
                                            <hr style={{ margin: '20px 0', opacity: '0.3' }} />
                                        )}
                                    </div>
                                ))}
                            </InfoCard>
                        )}
                    </Col>
                </Row>
            </Container>

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
};

export default ViewUserPage; 