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

    const InfoField = ({ label, value, icon = null, colSize = 6 }) => (
        <Col xs={12} sm={12} md={colSize} className="mb-2" style={{ overflow: 'hidden' }}>
            <div style={{ 
                padding: '8px 12px',
                borderBottom: '1px solid #e9ecef',
                width: '100%',
                maxWidth: '100%',
                boxSizing: 'border-box'
            }}
            className="px-md-3 px-0 py-md-2 py-0"
            >
                {/* Mobile & Tablet: Label on top */}
                <div className="d-block d-md-none">
                    <div style={{ 
                        fontSize: '13px', 
                        fontWeight: '600', 
                        color: '#4680ff',
                        marginBottom: '4px',
                        wordBreak: 'break-word',
                        overflowWrap: 'break-word'
                    }}>
                        <span>{label}:</span>
                    </div>
                    <div style={{ 
                        fontSize: '14px', 
                        color: '#000000',
                        fontWeight: '400',
                        wordBreak: 'break-word',
                        overflowWrap: 'break-word',
                        width: '100%',
                        lineHeight: '1.5'
                    }}>
                        {value || 'N/A'}
                    </div>
                </div>
                {/* Desktop: Label and value side by side */}
                <div className="d-none d-md-flex align-items-start" style={{ width: '100%', minWidth: 0 }}>
                    <div style={{ 
                        minWidth: '140px',
                        maxWidth: '140px',
                        fontSize: '13px', 
                        fontWeight: '600', 
                        color: '#4680ff',
                        marginRight: '12px',
                        flexShrink: 0
                    }}>
                        <span style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>{label}:</span>
                    </div>
                    <div style={{ 
                        fontSize: '14px', 
                        color: '#000000',
                        fontWeight: '400',
                        flex: 1,
                        minWidth: 0,
                        wordBreak: 'break-word',
                        overflowWrap: 'break-word',
                        overflow: 'hidden'
                    }}>
                        {value || 'N/A'}
                    </div>
                </div>
            </div>
        </Col>
    );

    return (
        <>
            <Container fluid className="mt-4" style={{ overflowX: 'hidden', width: '100%', maxWidth: '100%', paddingLeft: '0', paddingRight: '0' }}>
                {/* Header */}
                <div style={{ 
                    backgroundColor: '#fff', 
                    borderRadius: '8px', 
                    padding: '20px', 
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    marginBottom: '24px',
                    borderTop: '4px solid #4680ff'
                }}>
                    <div className="d-flex justify-content-between align-items-center flex-wrap">
                        <div style={{ flex: '1', minWidth: '200px' }}>
                            <h4 style={{ 
                                margin: 0, 
                                color: '#000000',
                                fontWeight: '600',
                                fontSize: 'clamp(18px, 4vw, 24px)',
                                wordBreak: 'break-word'
                            }}>
                                <i className="feather icon-user mr-2" style={{ color: '#4680ff', fontSize: 'clamp(16px, 3.5vw, 20px)' }}></i>
                                User Profile
                            </h4>
                         
                        </div>
                        <Button 
                            variant="outline-secondary" 
                            onClick={() => navigate(-1)}
                            className="mt-2 mt-md-0"
                            style={{ 
                                borderRadius: '8px',
                                padding: 'clamp(6px, 1.5vw, 8px) clamp(12px, 3vw, 16px)',
                                border: '1px solid #dee2e6',
                                fontWeight: '500',
                                fontSize: 'clamp(12px, 2.5vw, 14px)',
                                whiteSpace: 'nowrap'
                            }}
                        >
                            <i className="fas fa-arrow-left me-2" style={{marginRight: '10px', fontSize: 'clamp(12px, 2.5vw, 14px)'}}></i>
                            Back
                        </Button>
                    </div>
                </div>

                {/* Main Content Card */}
                <div>
                    {/* Desktop: Card wrapper */}
                    <div className="d-none d-md-block">
                        <Card style={{ 
                            backgroundColor: '#fff', 
                            borderRadius: '8px', 
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                            border: '1px solid #e9ecef',
                            overflow: 'hidden'
                        }}>
                            <Card.Body style={{ padding: '24px', overflow: 'hidden', width: '100%', maxWidth: '100%' }}>
                                <Row style={{ margin: 0, width: '100%', maxWidth: '100%' }}>
                            {/* Profile Image */}
                            <Col xs={12} className="text-center mb-4">
                                {userData.profilePicture ? (
                                    <div style={{ position: 'relative', display: 'inline-block' }}>
                                        <img
                                            src={`${API_URL}/${userData.profilePicture.replace(/\\/g, '/')}`}
                                            alt="Profile"
                                            style={{
                                                width: '120px',
                                                height: '120px',
                                                objectFit: 'cover',
                                                borderRadius: '50%',
                                                border: '3px solid #4680ff',
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
                                                bottom: '5px',
                                                right: '5px',
                                                backgroundColor: '#4680ff',
                                                color: 'white',
                                                padding: '4px',
                                                borderRadius: '50%',
                                                fontSize: '10px',
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
                                            width: '120px',
                                            height: '120px',
                                            backgroundColor: '#f8f9fa',
                                            borderRadius: '50%',
                                            border: '3px solid #4680ff',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            margin: '0 auto',
                                            boxShadow: '0 4px 12px rgba(70, 128, 255, 0.2)'
                                        }}
                                    >
                                        <i className="feather icon-user" style={{ fontSize: '50px', color: '#000000' }}></i>
                                    </div>
                                )}
                            </Col>

                            {/* Personal Information */}
                            <Col xs={12} style={{ overflow: 'hidden', width: '100%', maxWidth: '100%' }}>
                                <h5 style={{ 
                                    fontSize: '16px', 
                                    fontWeight: '600', 
                                    color: '#000000',
                                    marginBottom: '16px',
                                    paddingBottom: '8px',
                                    borderBottom: '2px solid #4680ff'
                                }}>
                                    <i className="feather icon-user mr-2" style={{ color: '#4680ff' }}></i>
                                    Personal Information
                                </h5>
                                <Row>
                                    <InfoField 
                                        label="Full Name" 
                                        value={`${userData.salutation ? userData.salutation + ' ' : ''}${userData.firstName} ${userData.lastName}`}
                                        icon="feather icon-user"
                                        colSize={6}
                                    />
                                    <InfoField 
                                        label="Email" 
                                        value={userData.email}
                                        icon="feather icon-mail"
                                        colSize={6}
                                    />
                                    <InfoField 
                                        label="Mobile Number" 
                                        value={formatPhoneDisplay(userData.mobile)}
                                        icon="feather icon-phone"
                                        colSize={6}
                                    />
                                    {userData.salutation && (
                                        <InfoField 
                                            label="Salutation" 
                                            value={userData.salutation}
                                            icon="feather icon-user"
                                            colSize={6}
                                        />
                                    )}
                                    {userData.company && (
                                        <InfoField 
                                            label="Company" 
                                            value={userData.company}
                                            icon="feather icon-briefcase"
                                            colSize={6}
                                        />
                                    )}
                                    {userData.designation && (
                                        <InfoField 
                                            label="Designation" 
                                            value={userData.designation}
                                            icon="feather icon-award"
                                            colSize={6}
                                        />
                                    )}
                                    {userData.industry && (
                                        <InfoField 
                                            label="Industry" 
                                            value={userData.industry}
                                            icon="feather icon-trending-up"
                                            colSize={6}
                                        />
                                    )}
                                </Row>
                            </Col>

                            {/* Account Details */}
                            <Col xs={12} className="mt-4" style={{ overflow: 'hidden', width: '100%', maxWidth: '100%' }}>
                                <h5 style={{ 
                                    fontSize: '16px', 
                                    fontWeight: '600', 
                                    color: '#000000',
                                    marginBottom: '16px',
                                    paddingBottom: '8px',
                                    borderBottom: '2px solid #4680ff'
                                }}>
                                    <i className="feather icon-settings mr-2" style={{ color: '#4680ff' }}></i>
                                    Account Details
                                </h5>
                                <Row>
                                    <InfoField 
                                        label="User Role" 
                                        value={userData.role}
                                        icon="feather icon-shield"
                                        colSize={6}
                                    />
                                    <InfoField 
                                        label="Account Verified" 
                                        value={userData.isVerify ? 'Yes' : 'No'}
                                        icon="feather icon-check-circle"
                                        colSize={6}
                                    />
                                    <InfoField 
                                        label="Terms Accepted" 
                                        value={userData.acceptTerms ? 'Yes' : 'No'}
                                        icon="feather icon-file-text"
                                        colSize={6}
                                    />
                                    <InfoField 
                                        label="Authentication Provider" 
                                        value={userData.authProvider}
                                        icon="feather icon-lock"
                                        colSize={6}
                                    />
                                    {userData.socialId && (
                                        <InfoField 
                                            label="Social ID" 
                                            value={userData.socialId}
                                            icon="feather icon-link"
                                            colSize={6}
                                        />
                                    )}
                                    {userData.linkedinProfile && (
                                        <InfoField 
                                            label="LinkedIn Profile" 
                                            value={userData.linkedinProfile}
                                            icon="fab fa-linkedin"
                                            colSize={6}
                                        />
                                    )}
                                    {userData.countryCurrency && (
                                        <InfoField 
                                            label="Country Currency" 
                                            value={userData.countryCurrency}
                                            icon="feather icon-dollar-sign"
                                            colSize={6}
                                        />
                                    )}
                                    <InfoField 
                                        label="Account Created" 
                                        value={new Date(userData.createdAt).toLocaleString()}
                                        icon="feather icon-user-plus"
                                        colSize={6}
                                    />
                                    <InfoField 
                                        label="Last Updated" 
                                        value={new Date(userData.updatedAt).toLocaleString()}
                                        icon="feather icon-edit"
                                        colSize={6}
                                    />
                                </Row>
                            </Col>

                            {/* Address Information */}
                            {userData.addresses && Array.isArray(userData.addresses) && userData.addresses.length > 0 && (
                                <Col xs={12} className="mt-4" style={{ overflow: 'hidden', width: '100%', maxWidth: '100%' }}>
                                    <h5 style={{ 
                                        fontSize: '16px', 
                                        fontWeight: '600', 
                                        color: '#000000',
                                        marginBottom: '16px',
                                        paddingBottom: '8px',
                                        borderBottom: '2px solid #4680ff'
                                    }}>
                                        <i className="feather icon-map-pin mr-2" style={{ color: '#4680ff' }}></i>
                                        Address Information
                                    </h5>
                                    {userData.addresses.map((address, index) => (
                                        <div key={address.id} className={index > 0 ? "mt-4" : ""}>
                                            {/* Address Header - Only show if multiple addresses */}
                                            {userData.addresses.length > 1 && (
                                                <div style={{
                                                    marginBottom: '16px',
                                                    paddingBottom: '12px',
                                                    borderBottom: '1px solid #dee2e6',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    flexWrap: 'wrap',
                                                    gap: '8px'
                                                }}>
                                                    <div style={{
                                                        fontSize: '15px',
                                                        fontWeight: '600',
                                                        color: '#000000',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '8px'
                                                    }}>
                                                        <i className="feather icon-map-pin" style={{ color: '#4680ff', fontSize: '16px' }}></i>
                                                        <span>Address {index + 1}</span>
                                                    </div>
                                                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                                        {address.isDefault && (
                                                            <Badge bg="primary" style={{ fontSize: '11px', padding: '4px 8px' }}>
                                                                Default
                                                            </Badge>
                                                        )}
                                                        {address.type && (
                                                            <Badge bg="secondary" style={{ fontSize: '11px', padding: '4px 8px' }}>
                                                                {address.type}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                            
                                            <Row>
                                                {/* Street Address - Full Width */}
                                                {address.street && (
                                                    <InfoField 
                                                        label="Street Address" 
                                                        value={address.street}
                                                        icon="feather icon-map-pin"
                                                        colSize={12}
                                                    />
                                                )}
                                                
                                                {/* City - Two Column Grid */}
                                                {address.city && (
                                                    <InfoField 
                                                        label="City" 
                                                        value={address.city}
                                                        icon="feather icon-map-pin"
                                                        colSize={6}
                                                    />
                                                )}
                                                
                                                {/* State - Two Column Grid */}
                                                {address.state && (
                                                    <InfoField 
                                                        label="State" 
                                                        value={address.state}
                                                        icon="feather icon-map-pin"
                                                        colSize={6}
                                                    />
                                                )}
                                                
                                                {/* Country - Two Column Grid */}
                                                {address.country && (
                                                    <InfoField 
                                                        label="Country" 
                                                        value={address.country}
                                                        icon="feather icon-globe"
                                                        colSize={6}
                                                    />
                                                )}
                                                
                                                {/* Postal Code - Two Column Grid */}
                                                {address.postalCode && (
                                                    <InfoField 
                                                        label="Postal Code" 
                                                        value={address.postalCode}
                                                        icon="feather icon-map-pin"
                                                        colSize={6}
                                                    />
                                                )}
                                                
                                                {/* Apartment/Unit - Two Column Grid */}
                                                {address.apartment && (
                                                    <InfoField 
                                                        label="Apartment/Unit" 
                                                        value={address.apartment}
                                                        icon="feather icon-home"
                                                        colSize={6}
                                                    />
                                                )}
                                                
                                                {/* Landmark - Two Column Grid */}
                                                {address.landmark && (
                                                    <InfoField 
                                                        label="Landmark" 
                                                        value={address.landmark}
                                                        icon="feather icon-navigation"
                                                        colSize={6}
                                                    />
                                                )}
                                                
                                                {/* Address Label - Two Column Grid */}
                                                {address.label && (
                                                    <InfoField 
                                                        label="Address Label" 
                                                        value={address.label}
                                                        icon="feather icon-tag"
                                                        colSize={6}
                                                    />
                                                )}
                                                
                                                {/* Delivery Instructions - Full Width */}
                                                {address.instructions && (
                                                    <InfoField 
                                                        label="Delivery Instructions" 
                                                        value={address.instructions}
                                                        icon="feather icon-message-square"
                                                        colSize={12}
                                                    />
                                                )}
                                            </Row>
                                        </div>
                                    ))}
                                </Col>
                            )}
                        </Row>
                            </Card.Body>
                        </Card>
                    </div>
                    {/* Mobile: No card, just white background */}
                    <div className="d-block d-md-none" style={{ backgroundColor: '#fff', overflow: 'hidden', width: '100%', maxWidth: '100%' }}>
                        <Row style={{ margin: 0, width: '100%', maxWidth: '100%' }}>
                            {/* Profile Image */}
                            <Col xs={12} className="text-center mb-4">
                                {userData.profilePicture ? (
                                    <div style={{ position: 'relative', display: 'inline-block' }}>
                                        <img
                                            src={`${API_URL}/${userData.profilePicture.replace(/\\/g, '/')}`}
                                            alt="Profile"
                                            style={{
                                                width: '120px',
                                                height: '120px',
                                                objectFit: 'cover',
                                                borderRadius: '50%',
                                                border: '3px solid #4680ff',
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
                                                bottom: '5px',
                                                right: '5px',
                                                backgroundColor: '#4680ff',
                                                color: 'white',
                                                padding: '4px',
                                                borderRadius: '50%',
                                                fontSize: '10px',
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
                                            width: '120px',
                                            height: '120px',
                                            backgroundColor: '#f8f9fa',
                                            borderRadius: '50%',
                                            border: '3px solid #4680ff',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            margin: '0 auto',
                                            boxShadow: '0 4px 12px rgba(70, 128, 255, 0.2)'
                                        }}
                                    >
                                        <i className="feather icon-user" style={{ fontSize: '50px', color: '#000000' }}></i>
                                    </div>
                                )}
                            </Col>

                            {/* Personal Information */}
                            <Col xs={12} style={{ overflow: 'hidden', width: '100%', maxWidth: '100%' }}>
                                <h5 style={{ 
                                    fontSize: '16px', 
                                    fontWeight: '600', 
                                    color: '#000000',
                                    marginBottom: '16px',
                                    paddingBottom: '8px',
                                    borderBottom: '2px solid #4680ff'
                                }}>
                                    <i className="feather icon-user mr-2" style={{ color: '#4680ff' }}></i>
                                    Personal Information
                                </h5>
                                <Row>
                                    <InfoField 
                                        label="Full Name" 
                                        value={`${userData.salutation ? userData.salutation + ' ' : ''}${userData.firstName} ${userData.lastName}`}
                                        icon="feather icon-user"
                                        colSize={6}
                                    />
                                    <InfoField 
                                        label="Email Address" 
                                        value={userData.email}
                                        icon="feather icon-mail"
                                        colSize={6}
                                    />
                                    <InfoField 
                                        label="Mobile Number" 
                                        value={formatPhoneDisplay(userData.mobile)}
                                        icon="feather icon-phone"
                                        colSize={6}
                                    />
                                    {userData.salutation && (
                                        <InfoField 
                                            label="Salutation" 
                                            value={userData.salutation}
                                            icon="feather icon-user"
                                            colSize={6}
                                        />
                                    )}
                                    {userData.company && (
                                        <InfoField 
                                            label="Company" 
                                            value={userData.company}
                                            icon="feather icon-briefcase"
                                            colSize={6}
                                        />
                                    )}
                                    {userData.designation && (
                                        <InfoField 
                                            label="Designation" 
                                            value={userData.designation}
                                            icon="feather icon-award"
                                            colSize={6}
                                        />
                                    )}
                                    {userData.industry && (
                                        <InfoField 
                                            label="Industry" 
                                            value={userData.industry}
                                            icon="feather icon-trending-up"
                                            colSize={6}
                                        />
                                    )}
                                </Row>
                            </Col>

                            {/* Account Details */}
                            <Col xs={12} className="mt-4" style={{ overflow: 'hidden', width: '100%', maxWidth: '100%' }}>
                                <h5 style={{ 
                                    fontSize: '16px', 
                                    fontWeight: '600', 
                                    color: '#000000',
                                    marginBottom: '16px',
                                    paddingBottom: '8px',
                                    borderBottom: '2px solid #4680ff'
                                }}>
                                    <i className="feather icon-settings mr-2" style={{ color: '#4680ff' }}></i>
                                    Account Details
                                </h5>
                                <Row>
                                    <InfoField 
                                        label="User Role" 
                                        value={userData.role}
                                        icon="feather icon-shield"
                                        colSize={6}
                                    />
                                    <InfoField 
                                        label="Account Verified" 
                                        value={userData.isVerify ? 'Yes' : 'No'}
                                        icon="feather icon-check-circle"
                                        colSize={6}
                                    />
                                    <InfoField 
                                        label="Terms Accepted" 
                                        value={userData.acceptTerms ? 'Yes' : 'No'}
                                        icon="feather icon-file-text"
                                        colSize={6}
                                    />
                                    <InfoField 
                                        label="Authentication Provider" 
                                        value={userData.authProvider}
                                        icon="feather icon-lock"
                                        colSize={6}
                                    />
                                    {userData.socialId && (
                                        <InfoField 
                                            label="Social ID" 
                                            value={userData.socialId}
                                            icon="feather icon-link"
                                            colSize={6}
                                        />
                                    )}
                                    {userData.linkedinProfile && (
                                        <InfoField 
                                            label="LinkedIn Profile" 
                                            value={userData.linkedinProfile}
                                            icon="fab fa-linkedin"
                                            colSize={6}
                                        />
                                    )}
                                    {userData.countryCurrency && (
                                        <InfoField 
                                            label="Country Currency" 
                                            value={userData.countryCurrency}
                                            icon="feather icon-dollar-sign"
                                            colSize={6}
                                        />
                                    )}
                                    <InfoField 
                                        label="Account Created" 
                                        value={new Date(userData.createdAt).toLocaleString()}
                                        icon="feather icon-user-plus"
                                        colSize={6}
                                    />
                                    <InfoField 
                                        label="Last Updated" 
                                        value={new Date(userData.updatedAt).toLocaleString()}
                                        icon="feather icon-edit"
                                        colSize={6}
                                    />
                                </Row>
                            </Col>

                            {/* Address Information */}
                            {userData.addresses && Array.isArray(userData.addresses) && userData.addresses.length > 0 && (
                                <Col xs={12} className="mt-4" style={{ overflow: 'hidden', width: '100%', maxWidth: '100%' }}>
                                    <h5 style={{ 
                                        fontSize: '16px', 
                                        fontWeight: '600', 
                                        color: '#000000',
                                        marginBottom: '16px',
                                        paddingBottom: '8px',
                                        borderBottom: '2px solid #4680ff'
                                    }}>
                                        <i className="feather icon-map-pin mr-2" style={{ color: '#4680ff' }}></i>
                                        Address Information
                                    </h5>
                                    {userData.addresses.map((address, index) => (
                                        <div key={address.id} className={index > 0 ? "mt-4" : ""}>
                                            {/* Address Header - Only show if multiple addresses */}
                                            {userData.addresses.length > 1 && (
                                                <div style={{
                                                    marginBottom: '16px',
                                                    paddingBottom: '12px',
                                                    borderBottom: '1px solid #dee2e6',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    flexWrap: 'wrap',
                                                    gap: '8px'
                                                }}>
                                                    <div style={{
                                                        fontSize: '15px',
                                                        fontWeight: '600',
                                                        color: '#000000',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '8px'
                                                    }}>
                                                        <i className="feather icon-map-pin" style={{ color: '#4680ff', fontSize: '16px' }}></i>
                                                        <span>Address {index + 1}</span>
                                                    </div>
                                                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                                        {address.isDefault && (
                                                            <Badge bg="primary" style={{ fontSize: '11px', padding: '4px 8px' }}>
                                                                Default
                                                            </Badge>
                                                        )}
                                                        {address.type && (
                                                            <Badge bg="secondary" style={{ fontSize: '11px', padding: '4px 8px' }}>
                                                                {address.type}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                            
                                            <Row>
                                                {/* Street Address - Full Width */}
                                                {address.street && (
                                                    <InfoField 
                                                        label="Street Address" 
                                                        value={address.street}
                                                        icon="feather icon-map-pin"
                                                        colSize={12}
                                                    />
                                                )}
                                                
                                                {/* City - Two Column Grid */}
                                                {address.city && (
                                                    <InfoField 
                                                        label="City" 
                                                        value={address.city}
                                                        icon="feather icon-map-pin"
                                                        colSize={6}
                                                    />
                                                )}
                                                
                                                {/* State - Two Column Grid */}
                                                {address.state && (
                                                    <InfoField 
                                                        label="State" 
                                                        value={address.state}
                                                        icon="feather icon-map-pin"
                                                        colSize={6}
                                                    />
                                                )}
                                                
                                                {/* Country - Two Column Grid */}
                                                {address.country && (
                                                    <InfoField 
                                                        label="Country" 
                                                        value={address.country}
                                                        icon="feather icon-globe"
                                                        colSize={6}
                                                    />
                                                )}
                                                
                                                {/* Postal Code - Two Column Grid */}
                                                {address.postalCode && (
                                                    <InfoField 
                                                        label="Postal Code" 
                                                        value={address.postalCode}
                                                        icon="feather icon-map-pin"
                                                        colSize={6}
                                                    />
                                                )}
                                                
                                                {/* Apartment/Unit - Two Column Grid */}
                                                {address.apartment && (
                                                    <InfoField 
                                                        label="Apartment/Unit" 
                                                        value={address.apartment}
                                                        icon="feather icon-home"
                                                        colSize={6}
                                                    />
                                                )}
                                                
                                                {/* Landmark - Two Column Grid */}
                                                {address.landmark && (
                                                    <InfoField 
                                                        label="Landmark" 
                                                        value={address.landmark}
                                                        icon="feather icon-navigation"
                                                        colSize={6}
                                                    />
                                                )}
                                                
                                                {/* Address Label - Two Column Grid */}
                                                {address.label && (
                                                    <InfoField 
                                                        label="Address Label" 
                                                        value={address.label}
                                                        icon="feather icon-tag"
                                                        colSize={6}
                                                    />
                                                )}
                                                
                                                {/* Delivery Instructions - Full Width */}
                                                {address.instructions && (
                                                    <InfoField 
                                                        label="Delivery Instructions" 
                                                        value={address.instructions}
                                                        icon="feather icon-message-square"
                                                        colSize={12}
                                                    />
                                                )}
                                            </Row>
                                        </div>
                                    ))}
                                </Col>
                            )}
                        </Row>
                    </div>
                </div>
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