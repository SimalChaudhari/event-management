import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Row, Col, Card, Container, Badge } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import { speakerById } from '../../store/actions/speakerActions';
import { API_URL } from '../../configs/env';
import NoDataFound from '../../components/NoDataFound';
import { SPEAKER_PATHS } from '../../utils/constants';
import { formatPhoneDisplay } from '../../utils/phoneFormatter';
import ImageViewModal from '../../components/modal/ImageViewModal';

const ViewSpeakerPage = () => {
    const { id } = useParams();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { speakerByID } = useSelector(state => state.speaker);
    const [showProfileImageModal, setShowProfileImageModal] = useState(false);

    useEffect(() => {
        if (id) {
            dispatch(speakerById(id));
        }
    }, [id, dispatch]);

    if (!speakerByID) {
        return (
            <NoDataFound
                title="Speaker Not Found"
                message="The speaker you're looking for doesn't exist or has been removed."
                icon="fas fa-user-slash"
                variant="warning"
                size="medium"
                showBackButton={true}
                backButtonText="Back"
                backButtonPath={SPEAKER_PATHS.LIST_SPEAKERS}
            />
        );
    }

    const speakerData = speakerByID;

    const handleProfileImageClick = () => {
        if (speakerData.profilePicture) {
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
                                Speaker Profile
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
                                {speakerData.profilePicture ? (
                                    <div style={{ position: 'relative', display: 'inline-block' }}>
                                        <img
                                            src={`${API_URL}/${speakerData.profilePicture.replace(/\\/g, '/')}`}
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
                                        value={`${speakerData.firstName || ''} ${speakerData.lastName || ''}`.trim() || speakerData.name}
                                        icon="feather icon-user"
                                        colSize={6}
                                    />
                                    <InfoField 
                                        label="Email Address" 
                                        value={speakerData.email}
                                        icon="feather icon-mail"
                                        colSize={6}
                                    />
                                    <InfoField 
                                        label="Mobile Number" 
                                        value={formatPhoneDisplay(speakerData.mobile)}
                                        icon="feather icon-phone"
                                        colSize={6}
                                    />
                                    {speakerData.location && (
                                        <InfoField 
                                            label="Location" 
                                            value={speakerData.location}
                                            icon="feather icon-map-pin"
                                            colSize={6}
                                        />
                                    )}
                                </Row>
                            </Col>

                            {/* Professional Information */}
                            <Col xs={12} className="mt-4" style={{ overflow: 'hidden', width: '100%', maxWidth: '100%' }}>
                                <h5 style={{ 
                                    fontSize: '16px', 
                                    fontWeight: '600', 
                                    color: '#000000',
                                    marginBottom: '16px',
                                    paddingBottom: '8px',
                                    borderBottom: '2px solid #4680ff'
                                }}>
                                    <i className="feather icon-briefcase mr-2" style={{ color: '#4680ff' }}></i>
                                    Professional Information
                                </h5>
                                <Row>
                                    {speakerData.position && (
                                        <InfoField 
                                            label="Position" 
                                            value={speakerData.position}
                                            icon="feather icon-award"
                                            colSize={6}
                                        />
                                    )}
                                    {speakerData.companyName && (
                                        <InfoField 
                                            label="Company" 
                                            value={speakerData.companyName}
                                            icon="feather icon-briefcase"
                                            colSize={6}
                                        />
                                    )}
                                </Row>
                            </Col>

                            {/* About Speaker */}
                            {speakerData.description && (
                                <Col xs={12} className="mt-4" style={{ overflow: 'hidden', width: '100%', maxWidth: '100%' }}>
                                    <h5 style={{ 
                                        fontSize: '16px', 
                                        fontWeight: '600', 
                                        color: '#000000',
                                        marginBottom: '16px',
                                        paddingBottom: '8px',
                                        borderBottom: '2px solid #4680ff'
                                    }}>
                                        <i className="feather icon-file-text mr-2" style={{ color: '#4680ff' }}></i>
                                        About Speaker
                                    </h5>
                                    <div style={{ 
                                        padding: '12px',
                                        color: '#000000',
                                        lineHeight: '1.6',
                                        fontSize: '14px'
                                    }}
                                        dangerouslySetInnerHTML={{ __html: speakerData.description }}
                                    />
                                </Col>
                            )}

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
                                    <Col xs={12} sm={12} md={6} className="mb-2" style={{ overflow: 'hidden' }}>
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
                                                    <span>Status:</span>
                                                </div>
                                                <div style={{ 
                                                    width: '100%',
                                                    lineHeight: '1.5'
                                                }}>
                                                    <Badge 
                                                        bg={speakerData.isVerify ? 'success' : 'secondary'}
                                                        style={{ 
                                                            fontSize: '12px', 
                                                            padding: '6px 12px',
                                                            fontWeight: '600'
                                                        }}
                                                    >
                                                        {speakerData.isVerify ? 'Active' : 'Inactive'}
                                                    </Badge>
                                                </div>
                                            </div>
                                            {/* Desktop: Label and value side by side */}
                                            <div className="d-none d-md-flex align-items-center" style={{ width: '100%', minWidth: 0 }}>
                                                <div style={{ 
                                                    minWidth: '140px',
                                                    maxWidth: '140px',
                                                    fontSize: '13px', 
                                                    fontWeight: '600', 
                                                    color: '#4680ff',
                                                    marginRight: '12px',
                                                    flexShrink: 0
                                                }}>
                                                    <span>Status:</span>
                                                </div>
                                                <div style={{ 
                                                    flex: 1,
                                                    minWidth: 0
                                                }}>
                                                    <Badge 
                                                        bg={speakerData.isVerify ? 'success' : 'secondary'}
                                                        style={{ 
                                                            fontSize: '12px', 
                                                            padding: '6px 12px',
                                                            fontWeight: '600'
                                                        }}
                                                    >
                                                        {speakerData.isVerify ? 'Active' : 'Inactive'}
                                                    </Badge>
                                                </div>
                                            </div>
                                        </div>
                                    </Col>
                                    {speakerData.linkedinProfile && (
                                        <InfoField 
                                            label="LinkedIn Profile" 
                                            value={speakerData.linkedinProfile}
                                            icon="fab fa-linkedin"
                                            colSize={6}
                                        />
                                    )}
                                    {speakerData.countryCurrency && (
                                        <InfoField 
                                            label="Country Currency" 
                                            value={speakerData.countryCurrency}
                                            icon="feather icon-dollar-sign"
                                            colSize={6}
                                        />
                                    )}
                                    {speakerData.createdAt && (
                                        <InfoField 
                                            label="Account Created" 
                                            value={new Date(speakerData.createdAt).toLocaleString()}
                                            icon="feather icon-user-plus"
                                            colSize={6}
                                        />
                                    )}
                                    {speakerData.updatedAt && (
                                        <InfoField 
                                            label="Last Updated" 
                                            value={new Date(speakerData.updatedAt).toLocaleString()}
                                            icon="feather icon-edit"
                                            colSize={6}
                                        />
                                    )}
                                </Row>
                            </Col>

                            {/* Address Information */}
                            {speakerData.addresses && Array.isArray(speakerData.addresses) && speakerData.addresses.length > 0 && (
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
                                    {speakerData.addresses.map((address, index) => (
                                        <div key={address.id || index} className={index > 0 ? "mt-4" : ""}>
                                            {speakerData.addresses.length > 1 && (
                                                <div style={{
                                                    marginBottom: '16px',
                                                    paddingBottom: '12px',
                                                    borderBottom: '1px solid #dee2e6',
                                                    display: 'flex',
                                                    alignItems: 'center',
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
                                                </div>
                                            )}
                                            
                                            <Row>
                                                {address.street && (
                                                    <InfoField 
                                                        label="Street Address" 
                                                        value={address.street}
                                                        icon="feather icon-map-pin"
                                                        colSize={12}
                                                    />
                                                )}
                                                {address.city && (
                                                    <InfoField 
                                                        label="City" 
                                                        value={address.city}
                                                        icon="feather icon-map-pin"
                                                        colSize={6}
                                                    />
                                                )}
                                                {address.state && (
                                                    <InfoField 
                                                        label="State" 
                                                        value={address.state}
                                                        icon="feather icon-map-pin"
                                                        colSize={6}
                                                    />
                                                )}
                                                {address.country && (
                                                    <InfoField 
                                                        label="Country" 
                                                        value={address.country}
                                                        icon="feather icon-globe"
                                                        colSize={6}
                                                    />
                                                )}
                                                {address.postalCode && (
                                                    <InfoField 
                                                        label="Postal Code" 
                                                        value={address.postalCode}
                                                        icon="feather icon-map-pin"
                                                        colSize={6}
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
                                {speakerData.profilePicture ? (
                                    <div style={{ position: 'relative', display: 'inline-block' }}>
                                        <img
                                            src={`${API_URL}/${speakerData.profilePicture.replace(/\\/g, '/')}`}
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
                                        value={`${speakerData.firstName || ''} ${speakerData.lastName || ''}`.trim() || speakerData.name}
                                        icon="feather icon-user"
                                        colSize={6}
                                    />
                                    <InfoField 
                                        label="Email Address" 
                                        value={speakerData.email}
                                        icon="feather icon-mail"
                                        colSize={6}
                                    />
                                    <InfoField 
                                        label="Mobile Number" 
                                        value={formatPhoneDisplay(speakerData.mobile)}
                                        icon="feather icon-phone"
                                        colSize={6}
                                    />
                                    {speakerData.location && (
                                        <InfoField 
                                            label="Location" 
                                            value={speakerData.location}
                                            icon="feather icon-map-pin"
                                            colSize={6}
                                        />
                                    )}
                                </Row>
                            </Col>

                            {/* Professional Information */}
                            <Col xs={12} className="mt-4" style={{ overflow: 'hidden', width: '100%', maxWidth: '100%' }}>
                                <h5 style={{ 
                                    fontSize: '16px', 
                                    fontWeight: '600', 
                                    color: '#000000',
                                    marginBottom: '16px',
                                    paddingBottom: '8px',
                                    borderBottom: '2px solid #4680ff'
                                }}>
                                    <i className="feather icon-briefcase mr-2" style={{ color: '#4680ff' }}></i>
                                    Professional Information
                                </h5>
                                <Row>
                                    {speakerData.position && (
                                        <InfoField 
                                            label="Position" 
                                            value={speakerData.position}
                                            icon="feather icon-award"
                                            colSize={6}
                                        />
                                    )}
                                    {speakerData.companyName && (
                                        <InfoField 
                                            label="Company" 
                                            value={speakerData.companyName}
                                            icon="feather icon-briefcase"
                                            colSize={6}
                                        />
                                    )}
                                </Row>
                            </Col>

                            {/* About Speaker */}
                            {speakerData.description && (
                                <Col xs={12} className="mt-4" style={{ overflow: 'hidden', width: '100%', maxWidth: '100%' }}>
                                    <h5 style={{ 
                                        fontSize: '16px', 
                                        fontWeight: '600', 
                                        color: '#000000',
                                        marginBottom: '16px',
                                        paddingBottom: '8px',
                                        borderBottom: '2px solid #4680ff'
                                    }}>
                                        <i className="feather icon-file-text mr-2" style={{ color: '#4680ff' }}></i>
                                        About Speaker
                                    </h5>
                                    <div style={{ 
                                        padding: '12px',
                                        color: '#000000',
                                        lineHeight: '1.6',
                                        fontSize: '14px'
                                    }}
                                        dangerouslySetInnerHTML={{ __html: speakerData.description }}
                                    />
                                </Col>
                            )}

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
                                    <Col xs={12} sm={12} md={6} className="mb-2" style={{ overflow: 'hidden' }}>
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
                                                    <span>Status:</span>
                                                </div>
                                                <div style={{ 
                                                    width: '100%',
                                                    lineHeight: '1.5'
                                                }}>
                                                    <Badge 
                                                        bg={speakerData.isVerify ? 'success' : 'secondary'}
                                                        style={{ 
                                                            fontSize: '12px', 
                                                            padding: '6px 12px',
                                                            fontWeight: '600'
                                                        }}
                                                    >
                                                        {speakerData.isVerify ? 'Active' : 'Inactive'}
                                                    </Badge>
                                                </div>
                                            </div>
                                            {/* Desktop: Label and value side by side */}
                                            <div className="d-none d-md-flex align-items-center" style={{ width: '100%', minWidth: 0 }}>
                                                <div style={{ 
                                                    minWidth: '140px',
                                                    maxWidth: '140px',
                                                    fontSize: '13px', 
                                                    fontWeight: '600', 
                                                    color: '#4680ff',
                                                    marginRight: '12px',
                                                    flexShrink: 0
                                                }}>
                                                    <span>Status:</span>
                                                </div>
                                                <div style={{ 
                                                    flex: 1,
                                                    minWidth: 0
                                                }}>
                                                    <Badge 
                                                        bg={speakerData.isVerify ? 'success' : 'secondary'}
                                                        style={{ 
                                                            fontSize: '12px', 
                                                            padding: '6px 12px',
                                                            fontWeight: '600'
                                                        }}
                                                    >
                                                        {speakerData.isVerify ? 'Active' : 'Inactive'}
                                                    </Badge>
                                                </div>
                                            </div>
                                        </div>
                                    </Col>
                                    {speakerData.linkedinProfile && (
                                        <InfoField 
                                            label="LinkedIn Profile" 
                                            value={speakerData.linkedinProfile}
                                            icon="fab fa-linkedin"
                                            colSize={6}
                                        />
                                    )}
                                    {speakerData.countryCurrency && (
                                        <InfoField 
                                            label="Country Currency" 
                                            value={speakerData.countryCurrency}
                                            icon="feather icon-dollar-sign"
                                            colSize={6}
                                        />
                                    )}
                                    {speakerData.createdAt && (
                                        <InfoField 
                                            label="Account Created" 
                                            value={new Date(speakerData.createdAt).toLocaleString()}
                                            icon="feather icon-user-plus"
                                            colSize={6}
                                        />
                                    )}
                                    {speakerData.updatedAt && (
                                        <InfoField 
                                            label="Last Updated" 
                                            value={new Date(speakerData.updatedAt).toLocaleString()}
                                            icon="feather icon-edit"
                                            colSize={6}
                                        />
                                    )}
                                </Row>
                            </Col>

                            {/* Address Information */}
                            {speakerData.addresses && Array.isArray(speakerData.addresses) && speakerData.addresses.length > 0 && (
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
                                    {speakerData.addresses.map((address, index) => (
                                        <div key={address.id || index} className={index > 0 ? "mt-4" : ""}>
                                            {speakerData.addresses.length > 1 && (
                                                <div style={{
                                                    marginBottom: '16px',
                                                    paddingBottom: '12px',
                                                    borderBottom: '1px solid #dee2e6',
                                                    display: 'flex',
                                                    alignItems: 'center',
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
                                                </div>
                                            )}
                                            
                                            <Row>
                                                {address.street && (
                                                    <InfoField 
                                                        label="Street Address" 
                                                        value={address.street}
                                                        icon="feather icon-map-pin"
                                                        colSize={12}
                                                    />
                                                )}
                                                {address.city && (
                                                    <InfoField 
                                                        label="City" 
                                                        value={address.city}
                                                        icon="feather icon-map-pin"
                                                        colSize={6}
                                                    />
                                                )}
                                                {address.state && (
                                                    <InfoField 
                                                        label="State" 
                                                        value={address.state}
                                                        icon="feather icon-map-pin"
                                                        colSize={6}
                                                    />
                                                )}
                                                {address.country && (
                                                    <InfoField 
                                                        label="Country" 
                                                        value={address.country}
                                                        icon="feather icon-globe"
                                                        colSize={6}
                                                    />
                                                )}
                                                {address.postalCode && (
                                                    <InfoField 
                                                        label="Postal Code" 
                                                        value={address.postalCode}
                                                        icon="feather icon-map-pin"
                                                        colSize={6}
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
            {speakerData.profilePicture && (
                <ImageViewModal
                    show={showProfileImageModal}
                    onHide={() => setShowProfileImageModal(false)}
                    imageSrc={`${API_URL}/${speakerData.profilePicture.replace(/\\/g, '/')}`}
                    imageAlt="Speaker Profile"
                    downloadFileName="speaker-profile.jpg"
                />
            )}
        </>
    );
};

export default ViewSpeakerPage;
