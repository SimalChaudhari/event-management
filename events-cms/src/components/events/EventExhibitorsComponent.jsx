import React, { useState } from 'react';
import { Button, Badge, Row, Col } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { EXHIBITOR_PATHS } from '../../utils/constants';
import StandardComponentTemplate from '../StandardComponentTemplate';
import ImageModalComponent from './ImageModalComponent';

/**
 * EventExhibitorsComponent - Component to display event exhibitors
 * @param {Object} exhibitors - Exhibitors data object
 * @param {Function} getImageSrc - Function to get image source URL
 */
const EventExhibitorsComponent = ({ exhibitors, getImageSrc }) => {
    // console.log("exhibitors",exhibitors);
    console.log("exhibitors",exhibitors?.exhibitors?.length);
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
            <StandardComponentTemplate 
                title="Event Exhibitors" 
                // icon="fas fa-building"
                borderColor="orange"
            >
                <div className="text-center py-4">
                    <i className="fas fa-store fa-2x text-muted mb-2"></i>
                    <p className="text-muted">No exhibitors available.</p>
                </div>
            </StandardComponentTemplate>
        );
    }

    // Render exhibitor description
    const renderExhibitorDescription = () => {
        if (!exhibitors.exhibitorDescription) {
            return null;
        }

        return (
            <div className="mb-4">
                <h6>Exhibitor Description:</h6>
                <hr />
                <p style={{ textAlign: 'justify',fontSize: '14px', lineHeight: '1.6' }}>
                    {exhibitors.exhibitorDescription}
                </p>
            
            </div>
        );
    };

    // Get colorful icons based on icon class
    const getIconColor = (iconClass) => {
        const colorMap = {
            'fas fa-building': '#007bff', // Blue for building
            'fas fa-image': '#28a745', // Green for image
            'fas fa-toggle-on': '#ffc107', // Yellow for toggle
            'fas fa-eye': '#17a2b8', // Teal for view
            'fas fa-sticky-note': '#6c757d', // Gray for description
            'fas fa-envelope': '#dc3545', // Red for email
            'fas fa-phone': '#28a745', // Green for phone
            'fas fa-id-card': '#6f42c1' // Purple for UEN
        };
        return colorMap[iconClass] || '#495057';
    };

    // InfoField component for consistent styling
    const InfoField = ({ label, value, iconClass = null }) => (
        <div
            className="info-field-container mb-2 py-2"
            style={{
                borderBottom: '1px solid #f1f1f1'
            }}
        >
            <span className="field-label" style={{ fontWeight: 'bold', color: '#495057', fontSize: '14px' }}>
                {iconClass && <i className={iconClass} style={{ marginRight: '8px', color: getIconColor(iconClass) }}></i>}
                {label}:
            </span>
            <span className="field-value" style={{ color: '#212529', fontWeight: 'normal', fontSize: '15px' }}>
                {value}
            </span>
        </div>
    );

    // Render individual exhibitor
    const renderExhibitor = (exhibitor) => (
        <div key={exhibitor.id} className="mb-5">
            <div className="card border-0 shadow-sm">
                <div className="card-body p-4">
                    <Row>
                        {/* Left Column - Logo Image (Shows first) */}
                        <Col lg={4} md={5} className="mb-3">
                            {/* Logo Label */}
                            <div className="mb-2 py-2" style={{ borderBottom: '1px solid #f1f1f1' }}>
                                <div style={{ fontWeight: 'bold', color: '#495057', fontSize: '14px', marginBottom: '8px' }}>
                                    <i className="fas fa-image" style={{ marginRight: '8px', color: getIconColor('fas fa-image') }}></i>
                                    Logo:
                                </div>
                                {/* Logo Image */}
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
                                                e.currentTarget.style.borderColor = '#007bff';
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
                        </Col>

                        {/* Right Column - Company Info */}
                        <Col lg={8} md={7}>
                            {/* Company Name */}
                            <InfoField 
                                label="Company Name" 
                                value={exhibitor.companyName || 'N/A'} 
                                iconClass="fas fa-building" 
                            />

                        

                            {/* Email */}
                            <InfoField 
                                label="Email" 
                                value={exhibitor.email || 'N/A'} 
                                iconClass="fas fa-envelope" 
                            />

                            {/* Mobile */}
                            <InfoField 
                                label="Mobile" 
                                value={exhibitor.mobile || 'N/A'} 
                                iconClass="fa fa-address-card" 
                            />

                            {/* UEN */}
                            <InfoField 
                                label="UEN" 
                                value={exhibitor.uen || 'N/A'} 
                                iconClass="fas fa-id-card" 
                            />

                         
                            {/* View More Button */}
                            <div className="mt-3 d-flex justify-content-end">
                                <Button
                                    variant="outline-primary"
                                    size="sm"
                                    onClick={() => navigate(`${EXHIBITOR_PATHS.VIEW_EXHIBITOR}/${exhibitor.id}`)}
                                    style={{
                                        borderRadius: '8px',
                                        padding: '8px 16px',
                                        fontSize: '14px',
                                        fontWeight: '500',
                                        transition: 'none'
                                    }}
                                    className="no-hover"
                                >
                                    <i className="fas fa-eye me-2" style={{ marginRight: 5, color: getIconColor('fas fa-eye') }}></i>
                                    View More
                                </Button>
                            </div>
                        </Col>
                    </Row>
                </div>
            </div>
        </div>
    );

    return (
        <StandardComponentTemplate 
            title="Event Exhibitors" 
            // icon="fas fa-building"
            borderColor="orange"
        >
          

            {/* Exhibitors List */}
            <div>
                {exhibitors.exhibitors.map(renderExhibitor)}
            </div>

              {/* Exhibitor Description */}
              {renderExhibitorDescription()}

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
                    // title={selectedImage.title}
                />

                
            )}

            {/* CSS to disable hover effects on View More button */}
            <style jsx>{`
                .no-hover:hover {
                    background-color: transparent !important;
                    border-color: #007bff !important;
                    color: #007bff !important;
                    transform: none !important;
                    box-shadow: none !important;
                }
                .no-hover:focus {
                    background-color: transparent !important;
                    border-color: #007bff !important;
                    color: #007bff !important;
                    box-shadow: none !important;
                }
                .no-hover:active {
                    background-color: transparent !important;
                    border-color: #007bff !important;
                    color: #007bff !important;
                    box-shadow: none !important;
                }
            `}</style>
        </StandardComponentTemplate>
    );
};

export default EventExhibitorsComponent;