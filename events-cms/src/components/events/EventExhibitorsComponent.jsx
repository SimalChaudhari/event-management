import React, { useState } from 'react';
import { Button, Badge, Row, Col, Card } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { EXHIBITOR_PATHS } from '../../utils/constants';
import ImageModalComponent from './ImageModalComponent';
import EventStaffComponent from './EventStaffComponent';
import { ExpandableDescription } from '../ExpandableDescription';

/**
 * EventExhibitorsComponent - Component to display event exhibitors
 * @param {Object} exhibitors - Exhibitors data object
 * @param {Function} getImageSrc - Function to get image source URL
 */
const EventExhibitorsComponent = ({ exhibitors, getImageSrc }) => {
    // Get user role from Redux state to check if admin
    const { authUser } = useSelector((state) => state.auth);
    // const isAdmin = authUser?.role === 'admin';
    const navigate = useNavigate();
    const [showModal, setShowModal] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);

    // Handle logo click to open zoom modal
    const handleLogoClick = (imageSrc, exhibitorName, companyName) => {
        // Use companyName as fallback if exhibitorName is undefined
        const displayName = exhibitorName || companyName || 'Exhibitor';
        const safeFileName = displayName.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');
        
        setSelectedImage({
            src: imageSrc,
            alt: `${displayName} Logo`,
            title: `${displayName} Logo`,
            downloadFileName: `${safeFileName}_logo.jpg`
        });
        setShowModal(true);
    };

    // Close modal
    const handleCloseModal = () => {
        setShowModal(false);
        setSelectedImage(null);
    };

    // Check if exhibitors are available
    if (!exhibitors?.exhibitors?.length) {
        return (
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
                        <Card.Body style={{ padding: '24px' }}>
                            <h5 className="mb-3 pb-2" style={{ 
                                fontSize: '16px', 
                                fontWeight: '600', 
                                color: '#000000',
                                borderBottom: '2px solid #4680ff'
                            }}>
                                <i className="fas fa-building mr-2" style={{ color: '#4680ff' }}></i>
                                Event Exhibitors
                            </h5>
                            <div className="text-center py-4">
                                <i className="fas fa-store fa-2x text-muted mb-2"></i>
                                <p className="text-muted">No exhibitors available.</p>
                            </div>
                        </Card.Body>
                    </Card>
                </div>
                {/* Mobile: No card wrapper, minimal padding */}
                <div className="d-block d-md-none px-2 py-2">
                    <h5 className="mb-3 pb-2" style={{ 
                        fontSize: '16px', 
                        fontWeight: '600', 
                        color: '#000000',
                        borderBottom: '2px solid #4680ff'
                    }}>
                        <i className="fas fa-building mr-2" style={{ color: '#4680ff' }}></i>
                        Event Exhibitors
                    </h5>
                    <div className="text-center py-4">
                        <i className="fas fa-store fa-2x text-muted mb-2"></i>
                        <p className="text-muted">No exhibitors available.</p>
                    </div>
                </div>
            </div>
        );
    }

    // Render exhibitor description
    const renderExhibitorDescription = () => {
        if (!exhibitors.exhibitorDescription) {
            return null;
        }

        return (
            <Col xs={12} className="mt-md-4 mt-3 p-0" style={{ overflow: 'hidden', width: '100%', maxWidth: '100%' }}>
                <h5 className="mb-md-3 mb-3 pb-md-2 pb-2" style={{ 
                    fontSize: '16px', 
                    fontWeight: '600', 
                    color: '#000000',
                    borderBottom: '2px solid #4680ff'
                }}>
                    <i className="fas fa-sticky-note mr-2" style={{ color: '#4680ff' }}></i>
                    Exhibitor Description
                </h5>
                <Row>
                    <Col xs={12} sm={12} md={12} className="mb-2" style={{ overflow: 'hidden' }}>
                        <div style={{ 
                            padding: '8px 12px',
                            borderBottom: '1px solid #e9ecef',
                            backgroundColor: '#f8f9fa',
                            borderRadius: '4px',
                            width: '100%',
                            maxWidth: '100%',
                            boxSizing: 'border-box'
                        }}
                        className="px-md-3 px-2 py-md-2 py-2"
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
                                    <span>Description:</span>
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
                                    <ExpandableDescription text={exhibitors.exhibitorDescription} maxLines={2} />
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
                                    <span style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>Description:</span>
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
                                    <ExpandableDescription text={exhibitors.exhibitorDescription} maxLines={2} />
                                </div>
                            </div>
                        </div>
                    </Col>
                </Row>
            </Col>
        );
    };

    // InfoField component matching EventBasicComponent pattern - responsive design
    const InfoField = ({ label, value, icon = null, colSize = 6 }) => (
        <Col xs={12} sm={12} md={colSize} className="mb-2" style={{ overflow: 'hidden' }}>
            <div style={{ 
                padding: '8px 12px',
                borderBottom: '1px solid #e9ecef',
                width: '100%',
                maxWidth: '100%',
                boxSizing: 'border-box'
            }}
            className="px-md-3 px-2 py-md-2 py-2"
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
                        {icon && <i className={icon} style={{ marginRight: '8px', color: '#4680ff' }}></i>}
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
                        {icon && <i className={icon} style={{ marginRight: '8px', color: '#4680ff' }}></i>}
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

    // Render individual exhibitor
    const renderExhibitor = (exhibitor) => (
        <div key={exhibitor.id} className="mb-4">
            <Card style={{ 
                backgroundColor: '#fff', 
                borderRadius: '8px', 
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                border: '1px solid #e9ecef',
                overflow: 'hidden'
            }}>
                <Card.Body>
                    <Row>
                        {/* Left Column - Logo Image */}
                        <Col xs={12} md={4} lg={4} className="mb-3 mb-md-0">
                            <div style={{ 
                                padding: '8px 12px',
                                borderBottom: '1px solid #e9ecef',
                                width: '100%',
                                maxWidth: '100%',
                                boxSizing: 'border-box'
                            }}
                            className="px-md-3 px-2 py-md-2 py-2"
                            >
                                {/* Mobile & Tablet: Label on top */}
                                <div className="d-block d-md-none">
                                    <div style={{ 
                                        fontSize: '13px', 
                                        fontWeight: '600', 
                                        color: '#4680ff',
                                        marginBottom: '8px',
                                        wordBreak: 'break-word',
                                        overflowWrap: 'break-word'
                                    }}>
                                        <i className="fas fa-image" style={{ marginRight: '8px', color: '#4680ff' }}></i>
                                        <span>Logo:</span>
                                    </div>
                                    <div>
                                        {exhibitor.logo && getImageSrc(exhibitor.logo) ? (
                                            <div
                                                style={{
                                                    position: 'relative',
                                                    cursor: 'pointer',
                                                    borderRadius: '8px',
                                                    overflow: 'hidden',
                                                    border: '2px solid #ddd',
                                                    transition: 'transform 0.2s ease, border-color 0.2s ease',
                                                    width: '100%',
                                                    aspectRatio: '1',
                                                    maxWidth: '180px'
                                                }}
                                                onClick={() => handleLogoClick(getImageSrc(exhibitor.logo), exhibitor.name, exhibitor.companyName)}
                                                onMouseOver={(e) => {
                                                    e.currentTarget.style.transform = 'scale(1.02)';
                                                    e.currentTarget.style.borderColor = '#4680ff';
                                                }}
                                                onMouseOut={(e) => {
                                                    e.currentTarget.style.transform = 'scale(1)';
                                                    e.currentTarget.style.borderColor = '#ddd';
                                                }}
                                            >
                                                <img
                                                    src={getImageSrc(exhibitor.logo)}
                                                    alt={exhibitor.companyName || 'Exhibitor Logo'}
                                                    style={{
                                                        width: '100%',
                                                        height: '100%',
                                                        objectFit: 'cover'
                                                    }}
                                                />
                                                {/* Zoom Icon */}
                                                <div
                                                    style={{
                                                        position: 'absolute',
                                                        top: '8px',
                                                        right: '8px',
                                                        backgroundColor: 'rgba(0,0,0,0.7)',
                                                        color: 'white',
                                                        padding: '4px 6px',
                                                        borderRadius: '50%',
                                                        fontSize: '12px'
                                                    }}
                                                >
                                                    <i className="fas fa-search-plus"></i>
                                                </div>
                                            </div>
                                        ) : (
                                            <div
                                                style={{
                                                    position: 'relative',
                                                    cursor: 'default',
                                                    borderRadius: '8px',
                                                    overflow: 'hidden',
                                                    border: '2px dashed #ccc',
                                                    width: '100%',
                                                    aspectRatio: '1',
                                                    maxWidth: '180px',
                                                    backgroundColor: '#f8f9fa',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center'
                                                }}
                                            >
                                                <div style={{ textAlign: 'center', color: '#6c757d' }}>
                                                    <i className="fas fa-image" style={{ fontSize: '24px', marginBottom: '8px' }}></i>
                                                    <div style={{ fontSize: '12px' }}>No Logo Available</div>
                                                </div>
                                            </div>
                                        )}
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
                                        <i className="fas fa-image" style={{ marginRight: '8px', color: '#4680ff' }}></i>
                                        <span style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>Logo:</span>
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        {exhibitor.logo && getImageSrc(exhibitor.logo) ? (
                                            <div
                                                style={{
                                                    position: 'relative',
                                                    cursor: 'pointer',
                                                    borderRadius: '8px',
                                                    overflow: 'hidden',
                                                    border: '2px solid #ddd',
                                                    transition: 'transform 0.2s ease, border-color 0.2s ease',
                                                    width: '100%',
                                                    aspectRatio: '1',
                                                    maxWidth: '180px'
                                                }}
                                                onClick={() => handleLogoClick(getImageSrc(exhibitor.logo), exhibitor.name, exhibitor.companyName)}
                                                onMouseOver={(e) => {
                                                    e.currentTarget.style.transform = 'scale(1.02)';
                                                    e.currentTarget.style.borderColor = '#4680ff';
                                                }}
                                                onMouseOut={(e) => {
                                                    e.currentTarget.style.transform = 'scale(1)';
                                                    e.currentTarget.style.borderColor = '#ddd';
                                                }}
                                            >
                                                <img
                                                    src={getImageSrc(exhibitor.logo)}
                                                    alt={exhibitor.companyName || 'Exhibitor Logo'}
                                                    style={{
                                                        width: '100%',
                                                        height: '100%',
                                                        objectFit: 'cover'
                                                    }}
                                                />
                                                {/* Zoom Icon */}
                                                <div
                                                    style={{
                                                        position: 'absolute',
                                                        top: '8px',
                                                        right: '8px',
                                                        backgroundColor: 'rgba(0,0,0,0.7)',
                                                        color: 'white',
                                                        padding: '4px 6px',
                                                        borderRadius: '50%',
                                                        fontSize: '12px'
                                                    }}
                                                >
                                                    <i className="fas fa-search-plus"></i>
                                                </div>
                                            </div>
                                        ) : (
                                            <div
                                                style={{
                                                    position: 'relative',
                                                    cursor: 'default',
                                                    borderRadius: '8px',
                                                    overflow: 'hidden',
                                                    border: '2px dashed #ccc',
                                                    width: '100%',
                                                    aspectRatio: '1',
                                                    maxWidth: '180px',
                                                    backgroundColor: '#f8f9fa',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center'
                                                }}
                                            >
                                                <div style={{ textAlign: 'center', color: '#6c757d' }}>
                                                    <i className="fas fa-image" style={{ fontSize: '24px', marginBottom: '8px' }}></i>
                                                    <div style={{ fontSize: '12px' }}>No Logo Available</div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </Col>

                        {/* Right Column - Company Info */}
                        <Col xs={12} md={8} lg={8}>
                            <Row>
                                <InfoField 
                                    label="Company Name" 
                                    value={exhibitor.companyName || 'N/A'} 
                                    icon="fas fa-building"
                                    colSize={12}
                                />
                                <InfoField 
                                    label="Email" 
                                    value={exhibitor.email || 'N/A'} 
                                    icon="fas fa-envelope"
                                    colSize={12}
                                />
                                <InfoField 
                                    label="Mobile" 
                                    value={exhibitor.mobile || 'N/A'} 
                                    icon="fas fa-phone"
                                    colSize={12}
                                />
                                <InfoField 
                                    label="UEN" 
                                    value={exhibitor.uen || 'N/A'} 
                                    icon="fas fa-id-card"
                                    colSize={12}
                                />
                                {exhibitor.boothCode && (
                                    <InfoField 
                                        label="Booth Code" 
                                        value={
                                            <Badge 
                                                bg="success" 
                                                style={{ 
                                                    fontSize: '14px', 
                                                    padding: '6px 12px',
                                                    fontWeight: '600',
                                                    letterSpacing: '1px'
                                                }}
                                            >
                                                {exhibitor.boothCode}
                                            </Badge>
                                        } 
                                        icon="fas fa-qrcode"
                                        colSize={12}
                                    />
                                )}
                            </Row>
                        </Col>
                    </Row>

                    {/* Event Staff Section - Full Width */}
                    {exhibitor.eventStaff && exhibitor.eventStaff.length > 0 && (
                        <div className="mt-4 pt-4" style={{ 
                            borderTop: '2px solid #e9ecef',
                            backgroundColor: '#f8f9fa',
                            marginLeft: '-24px',
                            marginRight: '-24px',
                            paddingLeft: '24px',
                            paddingRight: '24px',
                            paddingBottom: '16px',
                            borderRadius: '0 0 8px 8px',
                            width: 'calc(100% + 48px)'
                        }}>
                            <div className="mb-3">
                                <h6 style={{ 
                                    fontSize: '16px', 
                                    fontWeight: '600', 
                                    color: '#000000',
                                    marginBottom: '16px',
                                    display: 'flex',
                                    flexWrap: 'wrap',
                                    alignItems: 'center',
                                    gap: '8px',
                                    borderBottom: '2px solid #4680ff',
                                    paddingBottom: '8px',
                                    width: '100%',
                                    maxWidth: '100%',
                                    boxSizing: 'border-box'
                                }}>
                                    <div style={{ 
                                        display: 'flex', 
                                        alignItems: 'center',
                                        flexShrink: 0,
                                        minWidth: 0
                                    }}>
                                        <i className="fas fa-users mr-2" style={{ color: '#4680ff', flexShrink: 0 }}></i>
                                        <span style={{ 
                                            wordBreak: 'break-word',
                                            overflowWrap: 'break-word',
                                            whiteSpace: 'nowrap'
                                        }}>Event Staff</span>
                                    </div>
                                    <Badge 
                                        bg="info" 
                                        style={{ 
                                            fontSize: '12px',
                                            padding: '4px 10px',
                                            borderRadius: '12px',
                                            fontWeight: '600',
                                            flexShrink: 0,
                                            whiteSpace: 'nowrap'
                                        }}
                                    >
                                        {exhibitor.eventStaff.length} {exhibitor.eventStaff.length === 1 ? 'Member' : 'Members'}
                                    </Badge>
                                </h6>
                            </div>
                            <EventStaffComponent eventStaff={exhibitor.eventStaff} showTitle={false} />
                        </div>
                    )}

                    {/* View More Button - Below Event Staff */}
                    <div className="mt-4 d-flex justify-content-end">
                        <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() => navigate(`${EXHIBITOR_PATHS.VIEW_EXHIBITOR}/${exhibitor.id}`)}
                            style={{
                                borderRadius: '8px',
                                padding: '8px 16px',
                                fontSize: '14px',
                                fontWeight: '500',
                                transition: 'none',
                                borderColor: '#4680ff',
                                color: '#4680ff'
                            }}
                            className="no-hover"
                        >
                            <i className="fas fa-eye me-2"></i>
                            View More
                        </Button>
                    </div>
                </Card.Body>
            </Card>
        </div>
    );

    const content = (
        <Row className="m-0" style={{ width: '100%', maxWidth: '100%' }}>
            {/* Exhibitors List */}
            <Col xs={12} className="p-0" style={{ overflow: 'hidden', width: '100%', maxWidth: '100%' }}>
                <h5 className="mb-md-3 mb-3 pb-md-2 pb-2" style={{ 
                    fontSize: '16px', 
                    fontWeight: '600', 
                    color: '#000000',
                    borderBottom: '2px solid #4680ff'
                }}>
                    <i className="fas fa-building mr-2" style={{ color: '#4680ff' }}></i>
                    Event Exhibitors
                </h5>
                <div>
                    {exhibitors.exhibitors.map(renderExhibitor)}
                </div>
            </Col>

            {/* Exhibitor Description */}
            {renderExhibitorDescription()}
        </Row>
    );

    return (
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
                        {content}
                    </Card.Body>
                </Card>
            </div>
            {/* Mobile: No card wrapper, minimal padding */}
            <div className="d-block d-md-none">
                {content}
            </div>

            {/* Image Modal for Logo Zoom */}
            {selectedImage && (
                <ImageModalComponent
                    show={showModal}
                    onHide={handleCloseModal}
                    imageSrc={selectedImage.src}
                    imageAlt={selectedImage.alt}
                    downloadFileName={selectedImage.downloadFileName}
                    currentIndex={0}
                    totalImages={1}
                />
            )}

            {/* CSS to disable hover effects on View More button */}
            <style jsx>{`
                .no-hover:hover {
                    background-color: transparent !important;
                    border-color: #4680ff !important;
                    color: #4680ff !important;
                    transform: none !important;
                    box-shadow: none !important;
                }
                .no-hover:focus {
                    background-color: transparent !important;
                    border-color: #4680ff !important;
                    color: #4680ff !important;
                    box-shadow: none !important;
                }
                .no-hover:active {
                    background-color: transparent !important;
                    border-color: #4680ff !important;
                    color: #4680ff !important;
                    box-shadow: none !important;
                }
            `}</style>
        </div>
    );
};

export default EventExhibitorsComponent;