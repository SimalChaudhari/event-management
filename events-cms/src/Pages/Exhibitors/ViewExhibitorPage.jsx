import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { Row, Col, Card, Badge, Button, Tab, Nav, Alert, Container, Modal } from 'react-bootstrap';
import { exhibitorById } from '../../store/actions/exhibitorsActions';
import { EXHIBITOR_PATHS } from '../../utils/constants';
import { API_URL } from '../../configs/env';
import NoDataFound from '../../components/NoDataFound';
import { formatPhoneDisplay } from '../../utils/phoneFormatter';
import EventStaffComponent from '../../components/events/EventStaffComponent';

const ViewExhibitorPage = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { id } = useParams();

    // Get exhibitor data from Redux store
    const { exhibitorById: exhibitorData, loading, error } = useSelector(state => state.exhibitor);
    const exhibitor = exhibitorData?.data;

    // Image modal states for zoomable functionality
    const [showImageModal, setShowImageModal] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [currentImageType, setCurrentImageType] = useState('');
    const [currentImages, setCurrentImages] = useState([]);

    useEffect(() => {
        if (id) {
            loadExhibitorData();
        }
    }, [id]);

    const loadExhibitorData = async () => {
        try {
            await dispatch(exhibitorById(id));
        } catch (error) {
            console.error('Failed to load exhibitor data:', error);
        }
    };

    const handleBack = () => {
        navigate(EXHIBITOR_PATHS.LIST_EXHIBITORS);
    };

    // InfoCard component for consistent styling similar to EventBasicComponent
    const InfoCard = ({ title, icon, children, borderColor = "#4680ff", className = "" }) => (
        <div className={`mb-4 ${className}`} style={{ 
            backgroundColor: '#fff', 
            borderRadius: '8px', 
            padding: '20px', 
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            border: '1px solid #e9ecef',
            borderLeft: `4px solid ${borderColor}`
        }}>
            <div style={{ padding: '24px' }}>
                <h5 style={{ 
                    fontSize: '18px', 
                    fontWeight: '600', 
                    color: '#2c3e50',
                    marginBottom: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    borderBottom: `2px solid ${borderColor}`,
                    paddingBottom: '8px',
                    position: 'relative'
                }}>
                    <span style={{ fontSize: '20px' }}>{icon}</span>
                    {title}
                </h5>
                {children}
            </div>
        </div>
    );

    const InfoField = ({ label, value, icon = null }) => (
        <div className="mb-3">
            <div style={{ 
                fontSize: '1rem', 
                fontWeight: '600', 
                color: '#495057',
                marginBottom: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
            }}>
                {icon && <span style={{ fontSize: '16px' }}>{icon}</span>}
                {label}:
            </div>
            <div style={{ 
                fontSize: '15px', 
                color: '#2c3e50',
                fontWeight: '500',
                backgroundColor: '#f8f9fa',
                padding: '10px 15px',
                borderRadius: '8px',
                border: '1px solid #e9ecef'
            }}>
                {value || 'N/A'}
            </div>
        </div>
    );

    // Image modal functions for zoomable functionality
    const getImageSrc = (image) => {
        if (typeof image === 'string') {
            if (image.startsWith('http')) {
                return image;
            }
            return `${API_URL}/${image.replace(/\\/g, '/')}`;
        }
        if (image && image.flyer) {
            return `${API_URL}/${image.flyer.replace(/\\/g, '/')}`;
        }
        if (image && image.eventImage) {
            return `${API_URL}/${image.eventImage.replace(/\\/g, '/')}`;
        }
        if (image && image.image) {
            return `${API_URL}/${image.image.replace(/\\/g, '/')}`;
        }
        return image;
    };

    const goToPreviousImage = () => {
        setCurrentImageIndex((prevIndex) => 
            prevIndex === 0 ? currentImages.length - 1 : prevIndex - 1
        );
    };

    const goToNextImage = () => {
        setCurrentImageIndex((prevIndex) => 
            prevIndex === currentImages.length - 1 ? 0 : prevIndex + 1
        );
    };

    const handleFlyerImageClick = (index) => {
        setCurrentImages(exhibitor.flyers || []);
        setCurrentImageIndex(index);
        setCurrentImageType('flyers');
        setShowImageModal(true);
    };

    const handleEventImageClick = (index) => {
        setCurrentImages(exhibitor.eventImages || []);
        setCurrentImageIndex(index);
        setCurrentImageType('eventImages');
        setShowImageModal(true);
    };

    const handleOfferImageClick = (offerIndex) => {
        const offersWithImages = exhibitor.promotionalOffers.filter(offer => offer.image);
        setCurrentImages(offersWithImages);
        setCurrentImageIndex(offerIndex);
        setCurrentImageType('offers');
        setShowImageModal(true);
    };


    // No exhibitor found
        if (!exhibitor) {
            return (
                <NoDataFound
                    title="Exhibitor Not Found"
                    message="The exhibitor you're looking for doesn't exist or has been removed."
                    icon="fas fa-building-slash"
                    variant="warning"
                    size="medium"
                    showBackButton={true}
                    backButtonText="Back"
                    backButtonPath={`${EXHIBITOR_PATHS.LIST_EXHIBITORS}`}
                />
            );
        }
    

    // Render promotional offers section
    const renderPromotionalOffers = () => {
        if (!exhibitor.promotionalOffers || exhibitor.promotionalOffers.length === 0) {
            return <p className="text-muted">No promotional offers available.</p>;
        }

        return (
            <Row>
                {exhibitor.promotionalOffers.map((offer, index) => (
                    <Col md={6} lg={4} key={offer.id} className="mb-3">
                        <Card className="h-100">
                            {offer.image && (
                                <Card.Img 
                                    variant="top" 
                                    src={`${API_URL}/${offer.image}`}
                                    style={{ height: '200px', objectFit: 'cover', cursor: 'pointer' }}
                                    onClick={() => handleOfferImageClick(index)}
                                    onError={(e) => {
                                        e.target.src = '/assets/images/placeholder.jpg';
                                    }}
                                />
                            )}
                            <Card.Body>
                                <Card.Title className="h6">{offer.title}</Card.Title>
                                <Card.Text className="small text-muted">{offer.description}</Card.Text>
                                <div className="d-flex justify-content-between align-items-center">
                                    <small className="text-muted">Valid until: {new Date(offer.validDate).toLocaleDateString()}</small>
                                    <Badge variant={offer.isActive ? 'success' : 'danger'}>{offer.isActive ? 'Active' : 'Inactive'}</Badge>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                ))}
            </Row>
        );
    };

    // Render flyers section
    const renderFlyers = () => {
        if (!exhibitor.flyers || exhibitor.flyers.length === 0) {
            return <p className="text-muted">No flyers available.</p>;
        }

        return (
            <Row>
                {exhibitor.flyers.map((flyer, index) => (
                    <Col md={4} lg={3} key={index} className="mb-3">
                        <Card style={{ cursor: 'pointer' }} onClick={() => handleFlyerImageClick(index)}>
                            <Card.Img 
                                variant="top" 
                                src={`${API_URL}/${flyer.flyer || flyer}`}
                                style={{ height: '200px', objectFit: 'cover' }}
                                onError={(e) => {
                                    e.target.src = '/assets/images/placeholder.jpg';
                                }}
                            />
                            <Card.Body className="p-2">
                                <div style={{ 
                                    fontSize: '14px', 
                                    fontWeight: 'bold', 
                                    color: '#495057',
                                    textAlign: 'center'
                                }}>
                                    {flyer.name || `Flyer ${index + 1}`}
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                ))}
            </Row>
        );
    };

    // Render event images section
    const renderEventImages = () => {
        if (!exhibitor.eventImages || exhibitor.eventImages.length === 0) {
            return <p className="text-muted">No event images available.</p>;
        }

        return (
            <Row>
                {exhibitor.eventImages.map((eventImage, index) => (
                    <Col md={4} lg={3} key={index} className="mb-3">
                        <Card style={{ cursor: 'pointer' }} onClick={() => handleEventImageClick(index)}>
                            <Card.Img 
                                variant="top" 
                                src={`${API_URL}/${eventImage.eventImage || eventImage}`}
                                style={{ height: '200px', objectFit: 'cover' }}
                                onError={(e) => {
                                    e.target.src = '/assets/images/placeholder.jpg';
                                }}
                            />
                            <Card.Body className="p-2">
                                <div style={{ 
                                    fontSize: '14px', 
                                    fontWeight: 'bold', 
                                    color: '#495057',
                                    textAlign: 'center'
                                }}>
                                    {eventImage.name || `Event Image ${index + 1}`}
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                ))}
            </Row>
        );
    };

    // Render documents section
    const renderDocuments = () => {
        if (!exhibitor.documents || exhibitor.documents.length === 0) {
            return <p className="text-muted">No documents available.</p>;
        }

        return (
            <div className="documents-list">
                {exhibitor.documents.map((doc, index) => (
                    <div 
                        key={index} 
                        style={{
                            backgroundColor: '#f8f9fa',
                            border: '1px solid #e9ecef',
                            borderRadius: '8px',
                            padding: '12px 16px',
                            marginBottom: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            {/* PDF Icon */}
                            <div style={{
                                backgroundColor: '#dc3545',
                                borderRadius: '4px',
                                padding: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                minWidth: '32px',
                                height: '32px'
                            }}>
                                <i className="fas fa-file-pdf" style={{ color: 'white', fontSize: '14px' }}></i>
                            </div>
                            
                            {/* Document Name */}
                            <div>
                                <div style={{
                                    fontSize: '14px',
                                    fontWeight: '500',
                                    color: '#212529',
                                    marginBottom: '2px'
                                }}>
                                    {doc.name || `Document ${index + 1}`}
                                </div>
                                <div style={{
                                    fontSize: '12px',
                                    color: '#6c757d'
                                }}>
                                    PDF Document
                                </div>
                            </div>
                        </div>
                        
                        {/* View Button */}
                        <Button 
                            variant="outline-primary" 
                            size="sm"
                            href={`${API_URL}/${doc.document || doc}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                                fontSize: '12px',
                                padding: '6px 12px',
                                borderRadius: '20px',
                                fontWeight: '500'
                            }}
                        >
                            <i className="fas fa-eye" style={{ marginRight: '6px' }}></i>
                            View
                        </Button>
                    </div>
                ))}
            </div>
        );
    };

    // Render exhibitor statistics
    const renderExhibitorStats = () => (
        <div className="exhibitor-stats">
            <div className="text-center p-3 bg-light rounded">
                <div className="row text-center">
                    <div className="col-3">
                        <h6 className="mb-0">{exhibitor.promotionalOffers?.length || 0}</h6>
                        <small className="text-muted">Offers</small>
                    </div>
                    <div className="col-3">
                        <h6 className="mb-0">{exhibitor.documents?.length || 0}</h6>
                        <small className="text-muted">Documents</small>
                    </div>
                    <div className="col-3">
                        <h6 className="mb-0">{exhibitor.flyers?.length || 0}</h6>
                        <small className="text-muted">Flyers</small>
                    </div>
                    <div className="col-3">
                        <h6 className="mb-0">{exhibitor.eventImages?.length || 0}</h6>
                        <small className="text-muted">Images</small>
                    </div>
                </div>
            </div>
        </div>
    );

    // Render image modal for zoom functionality
    const renderImageModal = () => {
        if (!currentImages || currentImages.length === 0) return null;

        const currentImage = currentImages[currentImageIndex];
        let imageSrc = '';
        let imageTitle = '';

        if (currentImageType === 'flyers') {
            imageSrc = getImageSrc(currentImage);
            imageTitle = currentImage.name || `Flyer ${currentImageIndex + 1}`;
        } else if (currentImageType === 'eventImages') {
            imageSrc = getImageSrc(currentImage);
            imageTitle = currentImage.name || `Event Image ${currentImageIndex + 1}`;
        } else if (currentImageType === 'offers') {
            imageSrc = getImageSrc(currentImage);
            imageTitle = currentImage.title || `Promotional Offer ${currentImageIndex + 1}`;
        } else if (currentImageType === 'logo') {
            imageSrc = getImageSrc(currentImage);
            imageTitle = 'Company Logo';
        }

        return (
            <Modal
                show={showImageModal}
                onHide={() => setShowImageModal(false)}
                size="xl"
                centered
                style={{ backgroundColor: 'rgba(0,0,0,0.95)' }}
            >
                <Modal.Body>
                    {/* Close button */}
                    <Button
                        variant="light"
                        size="sm"
                        onClick={() => setShowImageModal(false)}
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

                    {/* Download button */}
                    <Button
                        variant="light"
                        size="sm"
                        onClick={() => {
                            const link = document.createElement('a');
                            link.href = imageSrc;
                            link.download = `${currentImageType}-${currentImageIndex + 1}.jpg`;
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

                    {/* Navigation arrows */}
                    {currentImages.length > 1 && (
                        <>
                            <Button
                                variant="light"
                                size="lg"
                                onClick={goToPreviousImage}
                                style={{
                                    position: 'fixed',
                                    left: '20px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    borderRadius: '50%',
                                    width: '50px',
                                    height: '50px',
                                    zIndex: 1000,
                                    backgroundColor: 'rgba(0,0,0,0.7)',
                                    border: 'none',
                                    color: 'white'
                                }}
                            >
                                <i className="fas fa-chevron-left"></i>
                            </Button>

                            <Button
                                variant="light"
                                size="lg"
                                onClick={goToNextImage}
                                style={{
                                    position: 'fixed',
                                    right: '20px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    borderRadius: '50%',
                                    width: '50px',
                                    height: '50px',
                                    zIndex: 1000,
                                    backgroundColor: 'rgba(0,0,0,0.7)',
                                    border: 'none',
                                    color: 'white'
                                }}
                            >
                                <i className="fas fa-chevron-right"></i>
                            </Button>
                        </>
                    )}

                    {/* Image counter */}
                    <div
                        style={{
                            position: 'fixed',
                            bottom: '20px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            backgroundColor: 'rgba(0,0,0,0.7)',
                            color: 'white',
                            padding: '8px 16px',
                            borderRadius: '20px',
                            fontSize: '14px',
                            fontWeight: 'bold',
                            zIndex: 1000
                        }}
                    >
                        {currentImageIndex + 1} / {currentImages.length}
                    </div>

                    {/* Image container */}
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
                            src={imageSrc}
                            alt={imageTitle}
                            style={{
                                maxWidth: '100%',
                                maxHeight: '100%',
                                objectFit: 'contain',
                                borderRadius: '8px'
                            }}
                            onError={(e) => {
                                console.error('Modal image failed to load:', imageSrc);
                                e.target.style.display = 'none';
                            }}
                        />
                    </div>
                </Modal.Body>
            </Modal>
        );
    };

    return (
        <div className="p-2 bg-light">
            {/* Header Section */}
            <div className="mb-4">
                <div style={{ 
                    backgroundColor: '#fff', 
                    borderRadius: '8px', 
                    padding: '20px', 
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    marginBottom: '24px',
                    borderTop: '4px solid #3498db'
                }}>
                    <div className="d-flex justify-content-between align-items-center">
                        <div>
                            <h4 style={{ 
                                margin: 0, 
                                color: '#2c3e50',
                                fontWeight: '600'
                            }}>
                                🏢 Exhibitor Profile
                            </h4>
                            <p style={{ 
                                margin: '8px 0 0 0', 
                                color: '#6c757d',
                                fontSize: '14px'
                            }}>
                                View detailed exhibitor information and related data
                            </p>
                        </div>
                        <Button 
                            variant="outline-secondary" 
                            onClick={handleBack}
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
            </div>

            {/* Statistics Section - First */}
            <InfoCard title="Statistics" icon="📊" borderColor="#9b59b6">
                <Row className="text-center">
                    <Col lg={3} md={6} className="mb-3">
                        <div style={{
                            backgroundColor: '#fff',
                            padding: '20px',
                            borderRadius: '8px',
                            border: '1px solid #e9ecef',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                        }}>
                            <h4 style={{ color: '#3498db', marginBottom: '10px' }}>
                                {exhibitor.flyers?.length || 0}
                            </h4>
                            <small className="text-muted">🖼️ Flyers</small>
                        </div>
                    </Col>
                    <Col lg={3} md={6} className="mb-3">
                        <div style={{
                            backgroundColor: '#fff',
                            padding: '20px',
                            borderRadius: '8px',
                            border: '1px solid #e9ecef',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                        }}>
                            <h4 style={{ color: '#27ae60', marginBottom: '10px' }}>
                                {exhibitor.eventImages?.length || 0}
                            </h4>
                            <small className="text-muted">📸 Images</small>
                        </div>
                    </Col>
                    <Col lg={3} md={6} className="mb-3">
                        <div style={{
                            backgroundColor: '#fff',
                            padding: '20px',
                            borderRadius: '8px',
                            border: '1px solid #e9ecef',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                        }}>
                            <h4 style={{ color: '#f39c12', marginBottom: '10px' }}>
                                {exhibitor.documents?.length || 0}
                            </h4>
                            <small className="text-muted">📁 Documents</small>
                        </div>
                    </Col>
                    <Col lg={3} md={6} className="mb-3">
                        <div style={{
                            backgroundColor: '#fff',
                            padding: '20px',
                            borderRadius: '8px',
                            border: '1px solid #e9ecef',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                        }}>
                            <h4 style={{ color: '#e74c3c', marginBottom: '10px' }}>
                                {exhibitor.promotionalOffers?.length || 0}
                            </h4>
                            <small className="text-muted">🎁 Offers</small>
                        </div>
                    </Col>
                </Row>
            </InfoCard>

            {/* Company Information & Details - Single Card with Logo */}
            <div className="mb-3">
                <div style={{
                    backgroundColor: '#fff',
                    border: '1px solid #e9ecef', 
                    borderLeft: '4px solid #3498db',
                    borderRadius: '8px',
                    padding: '20px'
                }}>
                    <h6 style={{
                        color: '#495057',
                        fontSize: '14px',
                        fontWeight: '600',
                        marginBottom: '20px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        borderBottom: '2px solid #3498db',
                        paddingBottom: '8px'
                    }}>
                        Company Information & Details
                    </h6>
                    
                    <Row>
                        {/* Left Column - Logo */}
                        <Col lg={3} md={12} className="mb-3">
                            <div className="text-center">
                                <div style={{ 
                                    fontSize: '12px', 
                                    fontWeight: '500', 
                                    color: '#6c757d',
                                    marginBottom: '10px'
                                }}>
                                    Company Logo
                                </div>
                                {exhibitor.logo ? (
                                    <img 
                                        src={`${API_URL}/${exhibitor.logo.replace(/\\/g, '/')}`}
                                        alt="Company Logo"
                                        style={{
                                            maxWidth: '140px',
                                            maxHeight: '100px',
                                            objectFit: 'contain',
                                            borderRadius: '6px',
                                            border: '1px solid #dee2e6',
                                            backgroundColor: '#f8f9fa',
                                            padding: '8px',
                                            cursor: 'pointer'
                                        }}
                                        onClick={() => {
                                            setCurrentImages([exhibitor.logo]);
                                            setCurrentImageIndex(0);
                                            setCurrentImageType('logo');
                                            setShowImageModal(true);
                                        }}
                                        onError={(e) => {
                                            e.target.style.display = 'none';
                                        }}
                                    />
                                ) : (
                                    <div style={{
                                        width: '140px',
                                        height: '100px',
                                        backgroundColor: '#f8f9fa',
                                        borderRadius: '6px',
                                        border: '1px dashed #ced4da',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        margin: '0 auto',
                                        color: '#adb5bd',
                                        fontSize: '11px'
                                    }}>
                                        <div style={{ textAlign: 'center' }}>
                                            <i className="fas fa-image mb-1" style={{ fontSize: '20px' }}></i>
                                            <br />
                                            No Logo
                                        </div>
                                    </div>
                                )}
                            </div>
                        </Col>

                        {/* Middle Column - Contact Information */}
                        <Col lg={4} md={12} className="mb-3">
                            <div style={{ fontSize: '15px', lineHeight: '1.6' }}>
                                <div className="d-flex justify-content-between align-items-center mb-2 py-2" style={{
                                    borderBottom: '1px solid #f1f1f1'
                                }}>
                                    <span style={{ fontWeight: 'bold', color: '#495057', minWidth: '100px', fontSize: '14px' }}>Company Name:</span>
                                    <span style={{ color: '#212529', textAlign: 'right', flex: 1, fontWeight: 'bold', fontSize: '15px' }}>{exhibitor.companyName}</span>
                                </div>
                                
                                <div className="d-flex justify-content-between align-items-center mb-2 py-2" style={{
                                    borderBottom: '1px solid #f1f1f1'
                                }}>
                                    <span style={{ fontWeight: 'bold', color: '#495057', minWidth: '100px', fontSize: '14px' }}>Email:</span>
                                    <span style={{ color: '#212529', textAlign: 'right', flex: 1, fontWeight: 'bold', fontSize: '15px' }}>{exhibitor.email}</span>
                                </div>
                                
                                <div className="d-flex justify-content-between align-items-center mb-2 py-2" style={{
                                    borderBottom: '1px solid #f1f1f1'
                                }}>
                                    <span style={{ fontWeight: 'bold', color: '#495057', minWidth: '100px', fontSize: '14px' }}>Mobile:</span>
                                    <span style={{ color: '#212529', textAlign: 'right', flex: 1, fontWeight: 'bold', fontSize: '15px' }}>{formatPhoneDisplay(exhibitor.mobile)}</span>
                                </div>
                                
                                <div className="d-flex justify-content-between align-items-center py-2">
                                    <span style={{ fontWeight: 'bold', color: '#495057', minWidth: '100px', fontSize: '14px' }}>Created:</span>
                                    <span style={{ color: '#212529', textAlign: 'right', flex: 1, fontSize: '14px', fontWeight: 'bold' }}>
                                        {new Date(exhibitor.createdAt).toLocaleDateString()}
                                    </span>
                                </div>
                                
                              
                            </div>
                        </Col>

                        {/* Right Column - Company Details */}
                        <Col lg={5} md={12} className="mb-3">
                            <div style={{ fontSize: '15px', lineHeight: '1.6' }}>
                                <div className="d-flex justify-content-between align-items-center mb-2 py-2" style={{
                                    borderBottom: '1px solid #f1f1f1'
                                }}>
                                    <span style={{ fontWeight: 'bold', color: '#495057', minWidth: '120px', fontSize: '14px' }}>Booth Number:</span>
                                    <span style={{ color: '#212529', textAlign: 'right', flex: 1, fontWeight: 'bold', fontSize: '15px' }}>{exhibitor.bothNumber || 'Not provided'}</span>
                                </div>

                                <div className="d-flex justify-content-between align-items-center mb-2 py-2" style={{
                                    borderBottom: '1px solid #f1f1f1'
                                }}>
                                    <span style={{ fontWeight: 'bold', color: '#495057', minWidth: '100px', fontSize: '14px' }}>UEN Number:</span>
                                    <span style={{ color: '#212529', textAlign: 'right', flex: 1, fontWeight: 'bold', fontSize: '15px' }}>{exhibitor.uen || 'Not provided'}</span>
                                </div>
                                
                                <div className="d-flex justify-content-between align-items-center mb-2 py-2" style={{
                                    borderBottom: '1px solid #f1f1f1'
                                }}>
                                    <span style={{ fontWeight: 'bold', color: '#495057', minWidth: '120px', fontSize: '14px' }}>Status:</span>
                                    <Badge 
                                        bg={exhibitor.isActive ? 'success' : 'danger'} 
                                        style={{ fontSize: '12px', padding: '4px 10px', fontWeight: 'bold' }}
                                    >
                                        {exhibitor.isActive ? 'Active' : 'Inactive'}
                                    </Badge>
                                </div>

                      
                                
                                <div className="d-flex justify-content-between align-items-center py-2">
                                    <span style={{ fontWeight: 'bold', color: '#495057', minWidth: '120px', fontSize: '14px' }}>Last Updated:</span>
                                    <span style={{ color: '#212529', textAlign: 'right', flex: 1, fontSize: '14px', fontWeight: 'bold' }}>
                                        {new Date(exhibitor.updatedAt).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                        </Col>
                    </Row>

                    {/* Company Description - Full Width Below */}
                    <Row className="mt-3">
                        <Col xs={12}>
                            <div style={{ 
                                borderTop: '1px solid #e9ecef',
                                paddingTop: '15px'
                            }}>
                                <div style={{ 
                                    fontWeight: 'bold', 
                                    color: '#495057', 
                                    marginBottom: '10px',
                                    fontSize: '14px'
                                }}>
                                    Company Description:
                                </div>
                                <div style={{
                                    color: exhibitor.companyDescription ? '#212529' : '#6c757d',
                                    fontStyle: exhibitor.companyDescription ? 'normal' : 'italic',
                                    fontSize: '14px',
                                    lineHeight: '1.6',
                                    padding: '12px',
                                    backgroundColor: '#f8f9fa',
                                    borderRadius: '6px',
                                    border: '1px solid #e9ecef',
                                    fontWeight: exhibitor.companyDescription ? '400' : 'normal'
                                }}>
                                    {exhibitor.companyDescription || 'No description provided'}
                                </div>
                            </div>
                        </Col>
                    </Row>
                </div>
            </div>

            {/* Additional Resources Section */}
            <InfoCard title="Additional Resources" icon="📁" borderColor="#e74c3c">
                <Tab.Container defaultActiveKey="offers">
                    <Nav variant="pills" className="mb-4" style={{ 
                        borderBottom: '2px solid #e74c3c',
                        paddingBottom: '12px',
                        gap: '15px'
                    }}>
                        <Nav.Item>
                            <Nav.Link 
                                eventKey="offers"
                                style={{
                                    borderRadius: '8px',
                                    fontWeight: '500',
                                    border: '1px solid #dee2e6',
                                    fontSize: '14px',
                                    padding: '8px 16px'
                                }}
                            >
                                🎁 Promotional Offers ({exhibitor.promotionalOffers?.length || 0})
                            </Nav.Link>
                        </Nav.Item>
                        <Nav.Item>
                            <Nav.Link 
                                eventKey="flyers"
                                style={{
                                    borderRadius: '8px',
                                    fontWeight: '500',
                                    border: '1px solid #dee2e6',
                                    fontSize: '14px',
                                    padding: '8px 16px'
                                }}
                            >
                                🖼️ Flyers ({exhibitor.flyers?.length || 0})
                            </Nav.Link>
                        </Nav.Item>
                        <Nav.Item>
                            <Nav.Link 
                                eventKey="images"
                                style={{
                                    borderRadius: '8px',
                                    fontWeight: '500',
                                    border: '1px solid #dee2e6',
                                    fontSize: '14px',
                                    padding: '8px 16px'
                                }}
                            >
                                📸 Event Images ({exhibitor.eventImages?.length || 0})
                            </Nav.Link>
                        </Nav.Item>
                        <Nav.Item>
                            <Nav.Link 
                                eventKey="documents"
                                style={{
                                    borderRadius: '8px',
                                    fontWeight: '500',
                                    border: '1px solid #dee2e6',
                                    fontSize: '14px',
                                    padding: '8px 16px'
                                }}
                            >
                                📁 Documents ({exhibitor.documents?.length || 0})
                            </Nav.Link>
                        </Nav.Item>
                        {exhibitor.eventStaff && exhibitor.eventStaff.length > 0 && (
                            <Nav.Item>
                                <Nav.Link 
                                    eventKey="eventStaff"
                                    style={{
                                        borderRadius: '8px',
                                        fontWeight: '500',
                                        border: '1px solid #dee2e6',
                                        fontSize: '14px',
                                        padding: '8px 16px'
                                    }}
                                >
                                    👥 Event Staff ({exhibitor.eventStaff.length})
                                </Nav.Link>
                            </Nav.Item>
                        )}
                    </Nav>

                    <Tab.Content style={{ marginTop: '20px' }}>
                        <Tab.Pane eventKey="offers">
                            <div style={{
                                backgroundColor: '#fff',
                                padding: '20px',
                                borderRadius: '8px',
                                border: '1px solid #e9ecef',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                            }}>
                                {renderPromotionalOffers()}
                            </div>
                        </Tab.Pane>
                        <Tab.Pane eventKey="flyers">
                            <div style={{
                                backgroundColor: '#fff',
                                padding: '20px',
                                borderRadius: '8px',
                                border: '1px solid #e9ecef',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                            }}>
                                {renderFlyers()}
                            </div>
                        </Tab.Pane>
                        <Tab.Pane eventKey="images">
                            <div style={{
                                backgroundColor: '#fff',
                                padding: '20px',
                                borderRadius: '8px',
                                border: '1px solid #e9ecef',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                            }}>
                                {renderEventImages()}
                            </div>
                        </Tab.Pane>
                        <Tab.Pane eventKey="documents">
                            <div style={{
                                backgroundColor: '#fff',
                                padding: '20px',
                                borderRadius: '8px',
                                border: '1px solid #e9ecef',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                            }}>
                                {renderDocuments()}
                            </div>
                        </Tab.Pane>
                        {exhibitor.eventStaff && exhibitor.eventStaff.length > 0 && (
                            <Tab.Pane eventKey="eventStaff">
                                <div style={{
                                    backgroundColor: '#fff',
                                    padding: '20px',
                                    borderRadius: '8px',
                                    border: '1px solid #e9ecef',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                }}>
                                    <p className="text-muted mb-3" style={{ fontSize: '14px' }}>
                                        Users who have switched to exhibitor role for this company using booth code.
                                    </p>
                                    <EventStaffComponent eventStaff={exhibitor.eventStaff} showTitle={false} />
                                </div>
                            </Tab.Pane>
                        )}
                    </Tab.Content>
                </Tab.Container>
            </InfoCard>

            {/* Image Zoom Modal */}
            {renderImageModal()}
        </div>
    );
};

export default ViewExhibitorPage;
