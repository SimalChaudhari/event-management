import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Row, Col, Card, Badge, Button, Tab, Nav, Alert, Container, Modal } from 'react-bootstrap';
import { 
    exhibitorById, 
    deleteExhibitorFlyer, 
    deleteExhibitorDocument, 
    deleteExhibitorEventImage,
    downloadFlyer,
    downloadAllFlyers,
    downloadDocument,
    downloadAllDocuments,
    downloadEventImage,
    downloadAllEventImages
} from '../../store/actions/exhibitorsActions';
import { EXHIBITOR_PATHS } from '../../utils/constants';
import { API_URL } from '../../configs/env';
import NoDataFound from '../../components/NoDataFound';
import { formatPhoneDisplay } from '../../utils/phoneFormatter';
import EventStaffComponent from '../../components/events/EventStaffComponent';
import DeleteConfirmationModal from '../../components/modal/DeleteConfirmationModal';

const ViewExhibitorPage = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();
    const { id } = useParams();

    // Get current exhibitor page from URL for preserving it
    const [exhibitorPageFromUrl, setExhibitorPageFromUrl] = useState(null);
    
    useEffect(() => {
        // Capture page parameter from URL when component mounts or URL changes
        const urlParams = new URLSearchParams(window.location.search || location.search);
        const pageParam = urlParams.get('page');
        if (pageParam) {
            setExhibitorPageFromUrl(pageParam);
        } else {
            // Also check location.state as fallback
            if (location.state?.page) {
                setExhibitorPageFromUrl(location.state.page);
            }
        }
    }, [location.search, location.state]);

    // Custom handleBack that uses the captured page parameter
    const handleBack = useCallback(() => {
        // Priority: captured page from state > URL > location.state > null
        const urlParams = new URLSearchParams(window.location.search || location.search);
        const pageFromUrl = urlParams.get('page');
        const currentPage = exhibitorPageFromUrl || pageFromUrl || location.state?.page;
        
        if (currentPage) {
            navigate(`${EXHIBITOR_PATHS.LIST_EXHIBITORS}?page=${currentPage}`);
        } else {
            navigate(EXHIBITOR_PATHS.LIST_EXHIBITORS);
        }
    }, [navigate, exhibitorPageFromUrl, location.search, location.state]);

    const handleBackNavigation = useMemo(() => {
        return handleBack;
    }, [location.search, navigate, handleBack]);

    // Get exhibitor data from Redux store
    const { exhibitorById: exhibitorData, loading, error } = useSelector((state) => state.exhibitor);
    const exhibitor = exhibitorData?.data;

    // Image modal states for zoomable functionality
    const [showImageModal, setShowImageModal] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [currentImageType, setCurrentImageType] = useState('');
    const [currentImages, setCurrentImages] = useState([]);

    // Confirmation modal states
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [confirmAction, setConfirmAction] = useState(null);
    const [confirmMessage, setConfirmMessage] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);
    
    // Store delete parameters
    const [deleteParams, setDeleteParams] = useState({ type: null, id: null });
    
    // Track active tab to preserve it after deletion
    const [activeTab, setActiveTab] = useState('flyers');

    useEffect(() => {
        if (id) {
            loadExhibitorData();
        }
    }, [id]);

    const loadExhibitorData = async () => {
        try {
            await dispatch(exhibitorById(id));
        } catch (error) {
            // Failed to load exhibitor data
        }
    };


    // InfoCard component for consistent styling similar to EventBasicComponent
    const InfoCard = ({ title, icon, children, borderColor = '#4680ff', className = '' }) => (
        <div
            className={`mb-4 ${className}`}
            style={{
                backgroundColor: '#fff',
                borderRadius: '8px',
                padding: '20px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                border: '1px solid #e9ecef',
                borderLeft: `4px solid ${borderColor}`
            }}
        >
            <div style={{ padding: '24px' }}>
                <h5
                    style={{
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
                    }}
                >
                    <span style={{ fontSize: '20px' }}>{icon}</span>
                    {title}
                </h5>
                {children}
            </div>
        </div>
    );

    const InfoField = ({ label, value, icon = null }) => (
        <div className="mb-3">
            <div
                style={{
                    fontSize: '1rem',
                    fontWeight: '600',
                    color: '#495057',
                    marginBottom: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                }}
            >
                {icon && <span style={{ fontSize: '16px' }}>{icon}</span>}
                {label}:
            </div>
            <div
                style={{
                    fontSize: '15px',
                    color: '#2c3e50',
                    fontWeight: '500',
                    backgroundColor: '#f8f9fa',
                    padding: '10px 15px',
                    borderRadius: '8px',
                    border: '1px solid #e9ecef'
                }}
            >
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
        setCurrentImageIndex((prevIndex) => (prevIndex === 0 ? currentImages.length - 1 : prevIndex - 1));
    };

    const goToNextImage = () => {
        setCurrentImageIndex((prevIndex) => (prevIndex === currentImages.length - 1 ? 0 : prevIndex + 1));
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
                backButtonPath={exhibitorPageFromUrl ? `${EXHIBITOR_PATHS.LIST_EXHIBITORS}?page=${exhibitorPageFromUrl}` : EXHIBITOR_PATHS.LIST_EXHIBITORS}
            />
        );
    }

    // Render flyers section

    // Handle delete flyer
    const handleDeleteFlyer = (flyerId, e) => {
        e.preventDefault();
        e.stopPropagation();
        if (isDeleting || showConfirmModal) return; // Prevent multiple clicks
        
        setConfirmMessage('Are you sure you want to delete this flyer?');
        setDeleteParams({ type: 'flyer', id: flyerId });
        setConfirmAction(null); // Clear any previous action
        setShowConfirmModal(true);
    };

    // Handle delete document
    const handleDeleteDocument = (documentId, e) => {
        e.preventDefault();
        e.stopPropagation();
        if (isDeleting || showConfirmModal) return; // Prevent multiple clicks
        
        setConfirmMessage('Are you sure you want to delete this document?');
        setDeleteParams({ type: 'document', id: documentId });
        setConfirmAction(null); // Clear any previous action
        setShowConfirmModal(true);
    };

    // Handle delete event image
    const handleDeleteEventImage = (eventImageId, e) => {
        e.preventDefault();
        e.stopPropagation();
        if (isDeleting || showConfirmModal) return; // Prevent multiple clicks
        
        setConfirmMessage('Are you sure you want to delete this event image?');
        setDeleteParams({ type: 'eventImage', id: eventImageId });
        setConfirmAction(null); // Clear any previous action
        setShowConfirmModal(true);
    };

    // Handle confirmation - ONLY called when user clicks Delete button
    const handleConfirm = async () => {
        if (isDeleting || !deleteParams.type || !deleteParams.id) return;
        
        setIsDeleting(true);
        try {
            // Execute delete based on type - ONLY happens here
            if (deleteParams.type === 'flyer') {
                await dispatch(deleteExhibitorFlyer(id, deleteParams.id));
            } else if (deleteParams.type === 'document') {
                await dispatch(deleteExhibitorDocument(id, deleteParams.id));
            } else if (deleteParams.type === 'eventImage') {
                await dispatch(deleteExhibitorEventImage(id, deleteParams.id));
            }
        } catch (error) {
            // Delete error
        } finally {
            setIsDeleting(false);
            setShowConfirmModal(false);
            setConfirmAction(null);
            setConfirmMessage('');
            setDeleteParams({ type: null, id: null });
        }
    };

    // Handle cancel
    const handleCancel = () => {
        if (!isDeleting) {
            setShowConfirmModal(false);
            setConfirmAction(null);
            setConfirmMessage('');
            setDeleteParams({ type: null, id: null });
        }
    };

    // Render flyers section
    const renderFlyers = () => {
        if (!exhibitor.flyers || exhibitor.flyers.length === 0) {
            return <p className="text-muted">No flyers available.</p>;
        }

        return (
            <div>
                <div className="d-flex justify-content-between align-items-center mb-3">
                    <h6 style={{ margin: 0 }}>Flyers ({exhibitor.flyers.length})</h6>
                    <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => downloadAllFlyers(id)}
                        style={{ fontSize: '12px' }}
                    >
                        <i className="fas fa-download me-1"></i>
                        Download All (ZIP)
                    </Button>
                </div>
                <Row>
                    {exhibitor.flyers.map((flyer, index) => (
                        <Col md={4} lg={3} key={`flyer-${index}-${flyer.id || 'no-id'}`} className="mb-3">
                            <Card>
                                <div style={{ position: 'relative' }}>
                                    <Card.Img
                                        variant="top"
                                        src={`${API_URL}/${flyer.flyer || flyer}`}
                                        style={{ height: '200px', objectFit: 'cover', cursor: 'pointer' }}
                                        onClick={() => handleFlyerImageClick(index)}
                                        onError={(e) => {
                                            e.target.src = '/assets/images/placeholder.jpg';
                                        }}
                                    />
                                    <div
                                        style={{
                                            position: 'absolute',
                                            top: '8px',
                                            right: '8px',
                                            display: 'flex',
                                            gap: '4px'
                                        }}
                                    >
                                        <Button
                                            variant="light"
                                            size="sm"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                downloadFlyer(id, flyer.id);
                                            }}
                                            style={{
                                                padding: '4px 8px',
                                                borderRadius: '4px',
                                                fontSize: '11px'
                                            }}
                                            title="Download"
                                        >
                                            <i className="fas fa-download"></i>
                                        </Button>
                                        <Button
                                            variant="danger"
                                            size="sm"
                                            onClick={(e) => handleDeleteFlyer(flyer.id, e)}
                                            style={{
                                                padding: '4px 8px',
                                                borderRadius: '4px',
                                                fontSize: '11px'
                                            }}
                                            title="Delete"
                                        >
                                            <i className="fas fa-trash"></i>
                                        </Button>
                                    </div>
                                </div>
                                <Card.Body className="p-2">
                                    <div
                                        style={{
                                            fontSize: '14px',
                                            fontWeight: 'bold',
                                            color: '#495057',
                                            textAlign: 'center'
                                        }}
                                    >
                                        {flyer.name || `Flyer ${index + 1}`}
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                    ))}
                </Row>
            </div>
        );
    };

    // Render event images section
    const renderEventImages = () => {
        if (!exhibitor.eventImages || exhibitor.eventImages.length === 0) {
            return <p className="text-muted">No event images available.</p>;
        }

        return (
            <div>
                <div className="d-flex justify-content-between align-items-center mb-3">
                    <h6 style={{ margin: 0 }}>Event Images ({exhibitor.eventImages.length})</h6>
                    <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => downloadAllEventImages(id)}
                        style={{ fontSize: '12px' }}
                    >
                        <i className="fas fa-download me-1"></i>
                        Download All (ZIP)
                    </Button>
                </div>
                <Row>
                    {exhibitor.eventImages.map((eventImage, index) => (
                        <Col md={4} lg={3} key={`eventImage-${index}-${eventImage.id || 'no-id'}`} className="mb-3">
                            <Card>
                                <div style={{ position: 'relative' }}>
                                    <Card.Img
                                        variant="top"
                                        src={`${API_URL}/${eventImage.eventImage || eventImage}`}
                                        style={{ height: '200px', objectFit: 'cover', cursor: 'pointer' }}
                                        onClick={() => handleEventImageClick(index)}
                                        onError={(e) => {
                                            e.target.src = '/assets/images/placeholder.jpg';
                                        }}
                                    />
                                    <div
                                        style={{
                                            position: 'absolute',
                                            top: '8px',
                                            right: '8px',
                                            display: 'flex',
                                            gap: '4px'
                                        }}
                                    >
                                        <Button
                                            variant="light"
                                            size="sm"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                downloadEventImage(id, eventImage.id);
                                            }}
                                            style={{
                                                padding: '4px 8px',
                                                borderRadius: '4px',
                                                fontSize: '11px'
                                            }}
                                            title="Download"
                                        >
                                            <i className="fas fa-download"></i>
                                        </Button>
                                        <Button
                                            variant="danger"
                                            size="sm"
                                            onClick={(e) => handleDeleteEventImage(eventImage.id, e)}
                                            style={{
                                                padding: '4px 8px',
                                                borderRadius: '4px',
                                                fontSize: '11px'
                                            }}
                                            title="Delete"
                                        >
                                            <i className="fas fa-trash"></i>
                                        </Button>
                                    </div>
                                </div>
                                <Card.Body className="p-2">
                                    <div
                                        style={{
                                            fontSize: '14px',
                                            fontWeight: 'bold',
                                            color: '#495057',
                                            textAlign: 'center'
                                        }}
                                    >
                                        {eventImage.name || `Event Image ${index + 1}`}
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                    ))}
                </Row>
            </div>
        );
    };

    // Render booth banner section
    const renderBoothBanner = () => {
        if (!exhibitor.boothBanner || exhibitor.boothBanner.length === 0) {
            return <p className="text-muted">No booth banner items available.</p>;
        }

        return (
            <Row>
                {exhibitor.boothBanner.map((banner, index) => {
                    // Handle both formats: {id, value} or direct string
                    const bannerValue =
                        typeof banner === 'object' && banner.value
                            ? banner.value
                            : typeof banner === 'string'
                            ? banner
                            : banner.banner || '';
                    const isLink = bannerValue && (bannerValue.startsWith('http://') || bannerValue.startsWith('https://'));
                    const isVideo =
                        bannerValue && (bannerValue.includes('.mp4') || bannerValue.includes('.mpeg') || bannerValue.includes('.mov'));
                    const bannerUrl = isLink ? bannerValue : `${API_URL}/${bannerValue.replace(/\\/g, '/')}`;

                    return (
                        <Col md={4} lg={3} key={`boothBanner-${index}-${banner.id || bannerValue || 'no-id'}`} className="mb-3">
                            <Card>
                                {isLink ? (
                                    <Card.Body className="text-center p-4">
                                        <i className="fas fa-link fa-3x text-primary mb-3"></i>
                                        <Card.Title className="h6">External Link</Card.Title>
                                        <Button
                                            variant="outline-primary"
                                            size="sm"
                                            href={bannerUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            <i className="fas fa-external-link-alt me-1"></i>
                                            Open Link
                                        </Button>
                                    </Card.Body>
                                ) : isVideo ? (
                                    <>
                                        <video
                                            src={bannerUrl}
                                            style={{ height: '200px', objectFit: 'cover', width: '100%' }}
                                            controls
                                            onError={(e) => {
                                                e.target.style.display = 'none';
                                            }}
                                        />
                                        <Card.Body className="p-2">
                                            <div
                                                style={{
                                                    fontSize: '14px',
                                                    fontWeight: 'bold',
                                                    color: '#495057',
                                                    textAlign: 'center'
                                                }}
                                            >
                                                Video {index + 1}
                                            </div>
                                        </Card.Body>
                                    </>
                                ) : (
                                    <>
                                        <Card.Img
                                            variant="top"
                                            src={bannerUrl}
                                            style={{ height: '200px', objectFit: 'cover', cursor: 'pointer' }}
                                            onClick={() => {
                                                const bannerImages = exhibitor.boothBanner
                                                    .map((b) => (typeof b === 'object' && b.value ? b.value : b))
                                                    .filter((b) => !b.startsWith('http'));
                                                setCurrentImages(bannerImages);
                                                setCurrentImageIndex(index);
                                                setCurrentImageType('boothBanner');
                                                setShowImageModal(true);
                                            }}
                                            onError={(e) => {
                                                e.target.src = '/assets/images/placeholder.jpg';
                                            }}
                                        />
                                        <Card.Body className="p-2">
                                            <div
                                                style={{
                                                    fontSize: '14px',
                                                    fontWeight: 'bold',
                                                    color: '#495057',
                                                    textAlign: 'center'
                                                }}
                                            >
                                                Banner {index + 1}
                                            </div>
                                        </Card.Body>
                                    </>
                                )}
                            </Card>
                        </Col>
                    );
                })}
            </Row>
        );
    };

    // Render documents section
    const renderDocuments = () => {
        if (!exhibitor.documents || exhibitor.documents.length === 0) {
            return <p className="text-muted">No documents available.</p>;
        }

        return (
            <div>
                <div className="d-flex justify-content-between align-items-center mb-3">
                    <h6 style={{ margin: 0 }}>Documents ({exhibitor.documents.length})</h6>
                    <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => downloadAllDocuments(id)}
                        style={{ fontSize: '12px' }}
                    >
                        <i className="fas fa-download me-1"></i>
                        Download All (ZIP)
                    </Button>
                </div>
                <div className="documents-list">
                    {exhibitor.documents.map((doc, index) => (
                        <div
                            key={`document-${index}-${doc.id || 'no-id'}`}
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
                                <div
                                    style={{
                                        backgroundColor: '#dc3545',
                                        borderRadius: '4px',
                                        padding: '8px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        minWidth: '32px',
                                        height: '32px'
                                    }}
                                >
                                    <i className="fas fa-file-pdf" style={{ color: 'white', fontSize: '14px' }}></i>
                                </div>

                                {/* Document Name */}
                                <div>
                                    <div
                                        style={{
                                            fontSize: '14px',
                                            fontWeight: '500',
                                            color: '#212529',
                                            marginBottom: '2px'
                                        }}
                                    >
                                        {doc.name || `Document ${index + 1}`}
                                    </div>
                                    <div
                                        style={{
                                            fontSize: '12px',
                                            color: '#6c757d'
                                        }}
                                    >
                                        PDF Document
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <Button
                                    variant="outline-primary"
                                    size="sm"
                                    onClick={() => downloadDocument(id, doc.id)}
                                    style={{
                                        fontSize: '12px',
                                        padding: '6px 12px',
                                        borderRadius: '20px',
                                        fontWeight: '500'
                                    }}
                                >
                                    <i className="fas fa-download" style={{ marginRight: '6px' }}></i>
                                    Download
                                </Button>
                                <Button
                                    variant="outline-info"
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
                                <Button
                                    variant="outline-danger"
                                    size="sm"
                                    onClick={(e) => handleDeleteDocument(doc.id, e)}
                                    style={{
                                        fontSize: '12px',
                                        padding: '6px 12px',
                                        borderRadius: '20px',
                                        fontWeight: '500'
                                    }}
                                >
                                    <i className="fas fa-trash"></i>
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

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
        } else if (currentImageType === 'boothBanner') {
            imageSrc = getImageSrc(currentImage);
            imageTitle = `Booth Banner ${currentImageIndex + 1}`;
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
                <div
                    style={{
                        backgroundColor: '#fff',
                        borderRadius: '8px',
                        padding: '20px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        marginBottom: '24px',
                        borderTop: '4px solid #3498db'
                    }}
                >
                    <div className="d-flex justify-content-between align-items-center">
                        <div>
                            <h4
                                style={{
                                    margin: 0,
                                    color: '#2c3e50',
                                    fontWeight: '600'
                                }}
                            >
                                🏢 Exhibitor Profile
                            </h4>
                            <p
                                style={{
                                    margin: '8px 0 0 0',
                                    color: '#6c757d',
                                    fontSize: '14px'
                                }}
                            >
                                View detailed exhibitor information and related data
                            </p>
                        </div>
                        <Button
                            variant="outline-secondary"
                            onClick={handleBackNavigation}
                            style={{
                                borderRadius: '8px',
                                padding: '8px 16px',
                                border: '1px solid #dee2e6',
                                fontWeight: '500'
                            }}
                        >
                            <i className="fas fa-arrow-left me-2" style={{ marginRight: '10px' }}></i>
                            Back
                        </Button>
                    </div>
                </div>
            </div>

            {/* Company Information & Details - Single Card with Logo */}
            <div className="mb-3">
                <div
                    style={{
                        backgroundColor: '#fff',
                        border: '1px solid #e9ecef',
                        borderLeft: '4px solid #3498db',
                        borderRadius: '8px',
                        padding: '20px'
                    }}
                >
                    <h6
                        style={{
                            color: '#495057',
                            fontSize: '14px',
                            fontWeight: '600',
                            marginBottom: '20px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            borderBottom: '2px solid #3498db',
                            paddingBottom: '8px'
                        }}
                    >
                        Company Information & Details
                    </h6>

                    <Row>
                        {/* Left Column - Logo */}
                        <Col lg={3} md={12} className="mb-3">
                            <div className="text-center">
                                <div
                                    style={{
                                        fontSize: '12px',
                                        fontWeight: '500',
                                        color: '#6c757d',
                                        marginBottom: '10px'
                                    }}
                                >
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
                                    <div
                                        style={{
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
                                        }}
                                    >
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
                                <div
                                    className="d-flex justify-content-between align-items-center mb-2 py-2"
                                    style={{
                                        borderBottom: '1px solid #f1f1f1'
                                    }}
                                >
                                    <span style={{ fontWeight: 'bold', color: '#495057', minWidth: '100px', fontSize: '14px' }}>
                                        Company Name:
                                    </span>
                                    <span style={{ color: '#212529', textAlign: 'right', flex: 1, fontWeight: 'bold', fontSize: '15px' }}>
                                        {exhibitor.companyName}
                                    </span>
                                </div>

                                <div
                                    className="d-flex justify-content-between align-items-center mb-2 py-2"
                                    style={{
                                        borderBottom: '1px solid #f1f1f1'
                                    }}
                                >
                                    <span style={{ fontWeight: 'bold', color: '#495057', minWidth: '100px', fontSize: '14px' }}>
                                        Email:
                                    </span>
                                    <span style={{ color: '#212529', textAlign: 'right', flex: 1, fontWeight: 'bold', fontSize: '15px' }}>
                                        {exhibitor.email}
                                    </span>
                                </div>

                                <div
                                    className="d-flex justify-content-between align-items-center mb-2 py-2"
                                    style={{
                                        borderBottom: '1px solid #f1f1f1'
                                    }}
                                >
                                    <span style={{ fontWeight: 'bold', color: '#495057', minWidth: '100px', fontSize: '14px' }}>
                                        Mobile:
                                    </span>
                                    <span style={{ color: '#212529', textAlign: 'right', flex: 1, fontWeight: 'bold', fontSize: '15px' }}>
                                        {formatPhoneDisplay(exhibitor.mobile)}
                                    </span>
                                </div>

                                <div className="d-flex justify-content-between align-items-center py-2">
                                    <span style={{ fontWeight: 'bold', color: '#495057', minWidth: '100px', fontSize: '14px' }}>
                                        Created:
                                    </span>
                                    <span style={{ color: '#212529', textAlign: 'right', flex: 1, fontSize: '14px', fontWeight: 'bold' }}>
                                        {new Date(exhibitor.createdAt).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                        </Col>

                        {/* Right Column - Company Details */}
                        <Col lg={5} md={12} className="mb-3">
                            <div style={{ fontSize: '15px', lineHeight: '1.6' }}>
                                <div
                                    className="d-flex justify-content-between align-items-center mb-2 py-2"
                                    style={{
                                        borderBottom: '1px solid #f1f1f1'
                                    }}
                                >
                                    <span style={{ fontWeight: 'bold', color: '#495057', minWidth: '120px', fontSize: '14px' }}>
                                        Booth Number:
                                    </span>
                                    <span style={{ color: '#212529', textAlign: 'right', flex: 1, fontWeight: 'bold', fontSize: '15px' }}>
                                        {exhibitor.bothNumber || 'Not provided'}
                                    </span>
                                </div>

                                <div
                                    className="d-flex justify-content-between align-items-center mb-2 py-2"
                                    style={{
                                        borderBottom: '1px solid #f1f1f1'
                                    }}
                                >
                                    <span style={{ fontWeight: 'bold', color: '#495057', minWidth: '100px', fontSize: '14px' }}>
                                        UEN Number:
                                    </span>
                                    <span style={{ color: '#212529', textAlign: 'right', flex: 1, fontWeight: 'bold', fontSize: '15px' }}>
                                        {exhibitor.uen || 'Not provided'}
                                    </span>
                                </div>

                                <div
                                    className="d-flex justify-content-between align-items-center mb-2 py-2"
                                    style={{
                                        borderBottom: '1px solid #f1f1f1'
                                    }}
                                >
                                    <span style={{ fontWeight: 'bold', color: '#495057', minWidth: '120px', fontSize: '14px' }}>
                                        Status:
                                    </span>
                                    <Badge
                                        bg={exhibitor.isActive ? 'success' : 'danger'}
                                        style={{ fontSize: '12px', padding: '4px 10px', fontWeight: 'bold' }}
                                    >
                                        {exhibitor.isActive ? 'Active' : 'Inactive'}
                                    </Badge>
                                </div>

                                <div className="d-flex justify-content-between align-items-center py-2">
                                    <span style={{ fontWeight: 'bold', color: '#495057', minWidth: '120px', fontSize: '14px' }}>
                                        Last Updated:
                                    </span>
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
                            <div
                                style={{
                                    borderTop: '1px solid #e9ecef',
                                    paddingTop: '15px'
                                }}
                            >
                                <div
                                    style={{
                                        fontWeight: 'bold',
                                        color: '#495057',
                                        marginBottom: '10px',
                                        fontSize: '14px'
                                    }}
                                >
                                    Company Description:
                                </div>
                                <div
                                    style={{
                                        color: exhibitor.companyDescription ? '#212529' : '#6c757d',
                                        fontStyle: exhibitor.companyDescription ? 'normal' : 'italic',
                                        fontSize: '14px',
                                        lineHeight: '1.6',
                                        padding: '12px',
                                        backgroundColor: '#f8f9fa',
                                        borderRadius: '6px',
                                        border: '1px solid #e9ecef',
                                        fontWeight: exhibitor.companyDescription ? '400' : 'normal'
                                    }}
                                    dangerouslySetInnerHTML={{
                                        __html: exhibitor.companyDescription || '<em>No description provided</em>'
                                    }}
                                />
                            </div>
                        </Col>
                    </Row>

                    {/* Website - Full Width Below */}
                    {exhibitor.website && (
                        <Row className="mt-3">
                            <Col xs={12}>
                                <div
                                    style={{
                                        borderTop: '1px solid #e9ecef',
                                        paddingTop: '15px'
                                    }}
                                >
                                    <div
                                        style={{
                                            fontWeight: 'bold',
                                            color: '#495057',
                                            marginBottom: '10px',
                                            fontSize: '14px'
                                        }}
                                    >
                                        Website:
                                    </div>
                                    <div
                                        style={{
                                            color: '#212529',
                                            fontSize: '14px',
                                            lineHeight: '1.6',
                                            padding: '12px',
                                            backgroundColor: '#f8f9fa',
                                            borderRadius: '6px',
                                            border: '1px solid #e9ecef',
                                            fontWeight: '400'
                                        }}
                                    >
                                        <a
                                            href={exhibitor.website.startsWith('http') ? exhibitor.website : `https://${exhibitor.website}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{ color: '#007bff', textDecoration: 'none' }}
                                        >
                                            {exhibitor.website}
                                            <i className="fas fa-external-link-alt ms-2" style={{ fontSize: '12px' }}></i>
                                        </a>
                                    </div>
                                </div>
                            </Col>
                        </Row>
                    )}

                    {/* Social Media - Full Width Below */}
                    {exhibitor.socialMedia && Array.isArray(exhibitor.socialMedia) && exhibitor.socialMedia.length > 0 && (
                        <Row className="mt-3">
                            <Col xs={12}>
                                <div
                                    style={{
                                        borderTop: '1px solid #e9ecef',
                                        paddingTop: '15px'
                                    }}
                                >
                                    <div
                                        style={{
                                            fontWeight: 'bold',
                                            color: '#495057',
                                            marginBottom: '15px',
                                            fontSize: '14px'
                                        }}
                                    >
                                        Social Media:
                                    </div>
                                    <div
                                        style={{
                                            display: 'flex',
                                            flexWrap: 'wrap',
                                            gap: '15px'
                                        }}
                                    >
                                        {exhibitor.socialMedia.map((item, index) => {
                                            if (!item.link) return null;

                                            // Get icon based on platform name (case-insensitive)
                                            const getPlatformIcon = (platform) => {
                                                if (!platform) return 'fas fa-link';
                                                const platformLower = platform.toLowerCase();
                                                if (platformLower.includes('facebook')) return 'fab fa-facebook';
                                                if (platformLower.includes('instagram')) return 'fab fa-instagram';
                                                if (platformLower.includes('linkedin')) return 'fab fa-linkedin';
                                                if (platformLower.includes('twitter')) return 'fab fa-twitter';
                                                if (platformLower.includes('youtube')) return 'fab fa-youtube';
                                                if (platformLower.includes('tiktok')) return 'fab fa-tiktok';
                                                if (platformLower.includes('whatsapp')) return 'fab fa-whatsapp';
                                                if (platformLower.includes('telegram')) return 'fab fa-telegram';
                                                if (platformLower.includes('snapchat')) return 'fab fa-snapchat';
                                                if (platformLower.includes('pinterest')) return 'fab fa-pinterest';
                                                return 'fas fa-link';
                                            };

                                            const getPlatformColor = (platform) => {
                                                if (!platform) return '#6c757d';
                                                const platformLower = platform.toLowerCase();
                                                if (platformLower.includes('facebook')) return '#1877f2';
                                                if (platformLower.includes('instagram')) return '#e4405f';
                                                if (platformLower.includes('linkedin')) return '#0077b5';
                                                if (platformLower.includes('twitter')) return '#1da1f2';
                                                if (platformLower.includes('youtube')) return '#ff0000';
                                                if (platformLower.includes('tiktok')) return '#000000';
                                                if (platformLower.includes('whatsapp')) return '#25d366';
                                                if (platformLower.includes('telegram')) return '#0088cc';
                                                if (platformLower.includes('snapchat')) return '#fffc00';
                                                if (platformLower.includes('pinterest')) return '#bd081c';
                                                return '#6c757d';
                                            };

                                            return (
                                                <div
                                                    key={`socialMedia-${index}-${item.platform || item.link || 'no-id'}`}
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '8px',
                                                        padding: '10px 15px',
                                                        backgroundColor: '#f8f9fa',
                                                        borderRadius: '8px',
                                                        border: '1px solid #e9ecef'
                                                    }}
                                                >
                                                    {item.icon ? (
                                                        <img
                                                            src={
                                                                item.icon.startsWith('http')
                                                                    ? item.icon
                                                                    : `${API_URL}/${item.icon.replace(/\\/g, '/')}`
                                                            }
                                                            alt={item.platform || 'Social Media'}
                                                            style={{ width: '24px', height: '24px', objectFit: 'contain' }}
                                                            onError={(e) => {
                                                                e.target.style.display = 'none';
                                                                e.target.nextElementSibling.style.display = 'flex';
                                                            }}
                                                        />
                                                    ) : null}
                                                    <div
                                                        style={{
                                                            display: item.icon ? 'none' : 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center'
                                                        }}
                                                    >
                                                        <i
                                                            className={getPlatformIcon(item.platform)}
                                                            style={{ fontSize: '20px', color: getPlatformColor(item.platform) }}
                                                        ></i>
                                                    </div>
                                                    <a
                                                        href={item.link.startsWith('http') ? item.link : `https://${item.link}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        style={{ color: '#007bff', textDecoration: 'none', fontSize: '14px', gap: '8px' }}
                                                    >
                                                        {item.platform || 'Link'}
                                                    </a>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </Col>
                        </Row>
                    )}

                </div>
            </div>

            {/* Additional Resources Section */}
            <InfoCard title="Additional Resources" icon="📁" borderColor="#e74c3c">
                <Tab.Container activeKey={activeTab} onSelect={setActiveTab}>
                    <Nav
                        variant="pills"
                        className="mb-4"
                        style={{
                            borderBottom: '2px solid #e74c3c',
                            paddingBottom: '12px',
                            gap: '15px'
                        }}
                    >
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
                        {exhibitor.boothBanner && exhibitor.boothBanner.length > 0 && (
                            <Nav.Item>
                                <Nav.Link
                                    eventKey="boothBanner"
                                    style={{
                                        borderRadius: '8px',
                                        fontWeight: '500',
                                        border: '1px solid #dee2e6',
                                        fontSize: '14px',
                                        padding: '8px 16px'
                                    }}
                                >
                                    🎨 Booth Banner ({exhibitor.boothBanner.length})
                                </Nav.Link>
                            </Nav.Item>
                        )}
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
                        <Tab.Pane eventKey="flyers">
                            <div
                                style={{
                                    backgroundColor: '#fff',
                                    padding: '20px',
                                    borderRadius: '8px',
                                    border: '1px solid #e9ecef',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                }}
                            >
                                {renderFlyers()}
                            </div>
                        </Tab.Pane>
                        <Tab.Pane eventKey="images">
                            <div
                                style={{
                                    backgroundColor: '#fff',
                                    padding: '20px',
                                    borderRadius: '8px',
                                    border: '1px solid #e9ecef',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                }}
                            >
                                {renderEventImages()}
                            </div>
                        </Tab.Pane>
                        <Tab.Pane eventKey="documents">
                            <div
                                style={{
                                    backgroundColor: '#fff',
                                    padding: '20px',
                                    borderRadius: '8px',
                                    border: '1px solid #e9ecef',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                }}
                            >
                                {renderDocuments()}
                            </div>
                        </Tab.Pane>
                        {exhibitor.boothBanner && exhibitor.boothBanner.length > 0 && (
                            <Tab.Pane eventKey="boothBanner">
                                <div
                                    style={{
                                        backgroundColor: '#fff',
                                        padding: '20px',
                                        borderRadius: '8px',
                                        border: '1px solid #e9ecef',
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                    }}
                                >
                                    {renderBoothBanner()}
                                </div>
                            </Tab.Pane>
                        )}
                        {exhibitor.eventStaff && exhibitor.eventStaff.length > 0 && (
                            <Tab.Pane eventKey="eventStaff">
                                <div
                                    style={{
                                        backgroundColor: '#fff',
                                        padding: '20px',
                                        borderRadius: '8px',
                                        border: '1px solid #e9ecef',
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                    }}
                                >
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

            {/* Confirmation Modal */}
            <DeleteConfirmationModal
                show={showConfirmModal}
                onHide={handleCancel}
                onConfirm={handleConfirm}
                title="Confirm Delete"
                message={confirmMessage}
                isLoading={isDeleting}
            />
        </div>
    );
};

export default ViewExhibitorPage;
