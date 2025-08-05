import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { Row, Col, Card, Badge, Button, Tab, Nav, Alert, Container, Modal } from 'react-bootstrap';
import { exhibitorById } from '../../store/actions/exhibitorsActions';
import { EXHIBITOR_PATHS } from '../../utils/constants';
import { API_URL } from '../../configs/env';

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

    const handleEdit = () => {
        navigate(`${EXHIBITOR_PATHS.ADD_EXHIBITOR}/${id}`);
    };

    const handleBack = () => {
        navigate(EXHIBITOR_PATHS.LIST_EXHIBITORS);
    };

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

    // Loading state
    if (loading) {
        return (
            <div className="text-center p-5">
                <div className="spinner-border" role="status">
                    <span className="sr-only">Loading...</span>
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <Container fluid>
                <Row>
                    <Col sm={12}>
                        <Alert variant="danger">{error}</Alert>
                        <Button variant="secondary" onClick={handleBack}>
                            <i className="fas fa-arrow-left me-2"></i>
                            Back to Exhibitors
                        </Button>
                    </Col>
                </Row>
            </Container>
        );
    }

    // No exhibitor found
    if (!exhibitor) {
        return (
            <Container fluid>
                <Row>
                    <Col sm={12}>
                        <Alert variant="warning">Exhibitor not found</Alert>
                        <Button variant="secondary" onClick={handleBack}>
                            <i className="fas fa-arrow-left me-2"></i>
                            Back to Exhibitors
                        </Button>
                    </Col>
                </Row>
            </Container>
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
                                <small className="text-muted">{flyer.name || `Flyer ${index + 1}`}</small>
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
                                <small className="text-muted">{eventImage.name || `Event Image ${index + 1}`}</small>
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
                    <Card key={index} className="mb-2">
                        <Card.Body className="py-2">
                            <div className="d-flex justify-content-between align-items-center">
                                <div>
                                    <h6 className="mb-0">{doc.name || `Document ${index + 1}`}</h6>
                                    <small className="text-muted">Document {index + 1}</small>
                                </div>
                                <div>
                                    <Button 
                                        variant="outline-primary" 
                                        size="sm"
                                        href={`${API_URL}/${doc.document || doc}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        <i style={{ marginRight: '10px' }} className="feather icon-download me-1"></i>
                                        Download
                                    </Button>
                                </div>
                            </div>
                        </Card.Body>
                    </Card>
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
        <Container fluid>
            <div className="row">
                <div className="col-12">
                    <div className="card">
                        <div className="card-header">
                            <div className="d-flex justify-content-between align-items-center">
                                <div>
                                    <h4 className="card-title">Exhibitor Details</h4>
                                    <p className="text-muted mb-0">View exhibitor information and related data</p>
                                </div>
                                <div>
                                    <Button variant="secondary" onClick={handleBack} className="me-2">
                                        <i style={{ marginRight: '10px' }} className="fas fa-arrow-left me-2"></i>
                                        Back
                                    </Button>
                                 
                                </div>
                            </div>
                        </div>
                        <div className="card-body">
                            {/* Basic Information */}
                            <Row className="mb-4">
                                <Col md={8}>
                                    <div className="exhibitor-basic-info">
                                        <div className="d-flex align-items-center mb-3">
                                            {exhibitor.eventImages && exhibitor.eventImages.length > 0 && (
                                                <img 
                                                    src={`${API_URL}/${exhibitor.eventImages[0].eventImage || exhibitor.eventImages[0]}`}
                                                    alt="Exhibitor"
                                                    className="img-thumbnail me-3"
                                                    style={{ 
                                                        width: '80px', 
                                                        height: '80px', 
                                                        objectFit: 'cover',
                                                        cursor: 'pointer'
                                                    }}
                                                    onClick={() => handleEventImageClick(0)}
                                                    onError={(e) => {
                                                        e.target.src = '/assets/images/user/avatar-1.jpg';
                                                    }}
                                                />
                                            )}
                                            <div className='m-1'>
                                                <h4 className="mb-1">{exhibitor.name}</h4>
                                                <p className="text-muted mb-1">{exhibitor.companyName}</p>
                                                <Badge variant={exhibitor.isActive ? 'success' : 'danger'}>
                                                    {exhibitor.isActive ? 'Active' : 'Inactive'}
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>
                                </Col>
                                <Col md={4}>{renderExhibitorStats()}</Col>
                            </Row>

                            {/* Contact Information */}
                            <Row className="mb-4">
                                <Col md={6}>
                                    <Card className="bg-light">
                                        <Card.Body>
                                            <h6 className="card-title">Contact Information</h6>
                                            <hr />
                                            <div className="contact-details">
                                                <p><strong>Email:</strong> {exhibitor.email}</p>
                                                <p><strong>Mobile:</strong> {exhibitor.mobile}</p>
                                                <p><strong>Username:</strong> {exhibitor.userName}</p>
                                                <p><strong>Address:</strong> {exhibitor.address || 'Not provided'}</p>
                                            </div>
                                        </Card.Body>
                                    </Card>
                                </Col>
                                <Col md={6}>
                                    <Card className="bg-light">
                                        <Card.Body>
                                            <h6 className="card-title">Additional Information</h6>
                                            <hr />
                                            <div className="additional-details">
                                                <p><strong>Company Description:</strong></p>
                                                <p className="text-muted small">
                                                    {exhibitor.companyDescription || 'No description provided'}
                                                </p>
                                                <p><strong>Created:</strong> {exhibitor.createdAt ? exhibitor.createdAt : 'N/A'}</p>
                                                <p><strong>Last Updated:</strong> {exhibitor.updatedAt ? exhibitor.updatedAt : 'N/A'}</p>
                                            </div>
                                        </Card.Body>
                                    </Card>
                                </Col>
                            </Row>

                            {/* Tabs for additional content */}
                            <Tab.Container defaultActiveKey="offers">
                                <Nav variant="tabs" className="mb-3">
                                    <Nav.Item>
                                        <Nav.Link eventKey="offers">
                                            Promotional Offers ({exhibitor.promotionalOffers?.length || 0})
                                        </Nav.Link>
                                    </Nav.Item>
                                    <Nav.Item>
                                        <Nav.Link eventKey="flyers">Flyers ({exhibitor.flyers?.length || 0})</Nav.Link>
                                    </Nav.Item>
                                    <Nav.Item>
                                        <Nav.Link eventKey="images">Event Images ({exhibitor.eventImages?.length || 0})</Nav.Link>
                                    </Nav.Item>
                                    <Nav.Item>
                                        <Nav.Link eventKey="documents">Documents ({exhibitor.documents?.length || 0})</Nav.Link>
                                    </Nav.Item>
                                </Nav>

                                <Tab.Content>
                                    <Tab.Pane eventKey="offers">{renderPromotionalOffers()}</Tab.Pane>
                                    <Tab.Pane eventKey="flyers">{renderFlyers()}</Tab.Pane>
                                    <Tab.Pane eventKey="images">{renderEventImages()}</Tab.Pane>
                                    <Tab.Pane eventKey="documents">{renderDocuments()}</Tab.Pane>
                                </Tab.Content>
                            </Tab.Container>
                        </div>
                    </div>
                </div>
            </div>

            {/* Image Zoom Modal */}
            {renderImageModal()}
        </Container>
    );
};

export default ViewExhibitorPage;
