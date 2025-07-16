import React, { useState } from 'react';
import { Modal, Button, Row, Col, Card, Badge, Nav, Tab } from 'react-bootstrap';
import { API_URL, DUMMY_PATH_USER } from '../../../../configs/env';
import DateTimeFormatter from '../../../../components/dateTime/DateTimeFormatter';

function ViewEventModal({ show, handleClose, eventData }) {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [showImageModal, setShowImageModal] = useState(false);
    const [showSpeakerImageModal, setShowSpeakerImageModal] = useState(false);
    const [currentSpeakerImage, setCurrentSpeakerImage] = useState('');
    const [showEventMainImageModal, setShowEventMainImageModal] = useState(false);
    const [currentEventMainImage, setCurrentEventMainImage] = useState('');

    if (!eventData) return null;

    // Speaker image zoom function
    const handleSpeakerImageClick = (speakerProfile) => {
        if (speakerProfile) {
            setCurrentSpeakerImage(speakerProfile);
            setShowSpeakerImageModal(true);
        } else {
            setShowSpeakerImageModal(false);
        }
    };

    // Event main image zoom function
    const handleEventMainImageClick = (imagePath) => {
        setCurrentEventMainImage(imagePath);
        setShowEventMainImageModal(true);
    };

    // Render categories
    const renderCategories = () => {
        if (!eventData?.categoriesData?.length) {
            return <p>No categories listed.</p>;
        }

        return (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {eventData.categoriesData.map((category, index) => (
                    <Badge
                        key={category.id}
                        bg="success"
                        style={{
                            fontSize: '14px',
                            padding: '8px 16px',
                            borderRadius: '20px',
                            backgroundColor: '#FFF'
                        }}
                    >
                        <i className="fas fa-tag me-2" style={{ color: '#000', marginRight: 6 }}></i>
                        {category.name}
                    </Badge>
                ))}
            </div>
        );
    };

    // Render event statistics
    const renderEventStats = () => {
        return (
            <Row>
                <Col xs={6} md={3} className="mb-3">
                    <div
                        className="text-center p-3"
                        style={{
                            backgroundColor: '#f8f9fa',
                            borderRadius: '8px',
                            border: '1px solid #e9ecef',
                            padding: '20px'
                        }}
                    >
                        <i className="fas fa-users text-primary mb-2" style={{ fontSize: '1.5rem' }}></i>
                        <h6 className="mb-1" style={{ color: '#495057', fontSize: '0.9rem' }}>
                            Attendance
                        </h6>
                        <p className="mb-0" style={{ fontSize: '0.95rem', fontWeight: '500', color: '#28a745' }}>
                            {eventData.attendanceCount || 0}
                        </p>
                    </div>
                </Col>
                <Col xs={6} md={3} className="mb-3">
                    <div
                        className="text-center p-3"
                        style={{
                            backgroundColor: '#f8f9fa',
                            borderRadius: '8px',
                            border: '1px solid #e9ecef',
                            padding: '20px'
                        }}
                    >
                        <i className="fas fa-microphone text-primary mb-2" style={{ fontSize: '1.5rem' }}></i>
                        <h6 className="mb-1" style={{ color: '#495057', fontSize: '0.9rem' }}>
                            Speakers
                        </h6>
                        <p className="mb-0" style={{ fontSize: '0.95rem', fontWeight: '500' }}>
                            {eventData.speakersData?.length || 0}
                        </p>
                    </div>
                </Col>
                <Col xs={6} md={3} className="mb-3">
                    <div
                        className="text-center p-3"
                        style={{
                            backgroundColor: '#f8f9fa',
                            borderRadius: '8px',
                            border: '1px solid #e9ecef',
                            padding: '20px'
                        }}
                    >
                        <i className="fas fa-images text-primary mb-2" style={{ fontSize: '1.5rem' }}></i>
                        <h6 className="mb-1" style={{ color: '#495057', fontSize: '0.9rem' }}>
                            Images
                        </h6>
                        <p className="mb-0" style={{ fontSize: '0.95rem', fontWeight: '500' }}>
                            {eventData.images?.length || 0}
                        </p>
                    </div>
                </Col>
                <Col xs={6} md={3} className="mb-3">
                    <div
                        className="text-center p-3"
                        style={{
                            backgroundColor: '#f8f9fa',
                            borderRadius: '8px',
                            border: '1px solid #e9ecef',
                            padding: '20px'
                        }}
                    >
                        <i className="fas fa-file-pdf text-primary mb-2" style={{ fontSize: '1.5rem' }}></i>
                        <h6 className="mb-1" style={{ color: '#495057', fontSize: '0.9rem' }}>
                            Documents
                        </h6>
                        <p className="mb-0" style={{ fontSize: '0.95rem', fontWeight: '500' }}>
                            {eventData.documents?.length || 0}
                        </p>
                    </div>
                </Col>
            </Row>
        );
    };

    const renderSpeakers = () => {
        if (!eventData?.speakersData?.length) {
            return <p>No speakers listed.</p>;
        }

        return (
            <div className="speakers-grid">
                {eventData.speakersData.map((speaker) => (
                    <div key={speaker.id} className="speaker-card">
                        <div className="speaker-header">
                            <div className="speaker-image" onClick={() => handleSpeakerImageClick(speaker.speakerProfile)}>
                                <img
                                    src={speaker.speakerProfile ? `${API_URL}/${speaker.speakerProfile}` : DUMMY_PATH_USER}
                                    alt={speaker.name}
                                />
                            </div>

                            <div className="speaker-info">
                                <h6 className="speaker-name">{speaker.name}</h6>
                                <p className="speaker-position">{speaker.position}</p>
                            </div>
                        </div>

                        {speaker.companyName && (
                            <div className="speaker-company">
                                <i className="fas fa-building"></i>
                                <span>{speaker.companyName}</span>
                            </div>
                        )}

                        <div className="speaker-contact">
                            {speaker.mobile && (
                                <div className="contact-item">
                                    <i className="fas fa-mobile"></i>
                                    <span>{speaker.mobile}</span>
                                </div>
                            )}

                            {speaker.email && (
                                <div className="contact-item">
                                    <i className="fas fa-envelope"></i>
                                    <span>{speaker.email}</span>
                                </div>
                            )}

                            {speaker.location && (
                                <div className="contact-item">
                                    <i className="fas fa-map-marker-alt"></i>
                                    <span>{speaker.location}</span>
                                </div>
                            )}
                        </div>

                        {speaker.description && <div className="speaker-description">{speaker.description}</div>}
                    </div>
                ))}
            </div>
        );
    };

    // Get image source
    const getImageSrc = (image) => {
        if (typeof image === 'string') {
            if (image.startsWith('http')) {
                return image;
            } else {
                return `${API_URL}/${image.replace(/\\/g, '/')}`;
            }
        }
        return '';
    };

    // Navigation functions for modal
    const goToPreviousImage = () => {
        setCurrentImageIndex((prevIndex) => (prevIndex === 0 ? eventData.images.length - 1 : prevIndex - 1));
    };

    const goToNextImage = () => {
        setCurrentImageIndex((prevIndex) => (prevIndex === eventData.images.length - 1 ? 0 : prevIndex + 1));
    };

    // Render simple image grid for UI
    const renderImageGrid = () => {
        if (!eventData?.images || eventData.images.length === 0) {
            return <p>No images available.</p>;
        }

        const handleImageClick = (index) => {
            setCurrentImageIndex(index);
            setShowImageModal(true);
        };

        return (
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                    gap: '10px',
                    marginTop: '10px'
                }}
            >
                {eventData.images.map((image, index) => {
                    const imageSrc = getImageSrc(image);

                    return (
                        <div
                            key={index}
                            style={{
                                position: 'relative',
                                cursor: 'pointer',
                                borderRadius: '8px',
                                overflow: 'hidden',
                                border: '2px solid #ddd',
                                transition: 'transform 0.2s ease, border-color 0.2s ease'
                            }}
                            onClick={() => handleImageClick(index)}
                        >
                            <img
                                src={imageSrc}
                                alt={`Event ${index + 1}`}
                                style={{
                                    width: '100%',
                                    height: '120px',
                                    objectFit: 'cover'
                                }}
                                onError={(e) => {
                                    console.error('Image failed to load:', imageSrc);
                                    e.target.style.display = 'none';
                                }}
                            />

                            {/* Image Index Badge */}
                            <div
                                style={{
                                    position: 'absolute',
                                    top: '5px',
                                    left: '5px',
                                    backgroundColor: 'rgba(0,0,0,0.7)',
                                    color: 'white',
                                    padding: '2px 6px',
                                    borderRadius: '4px',
                                    fontSize: '10px',
                                    fontWeight: 'bold'
                                }}
                            >
                                {index + 1}
                            </div>

                            {/* Zoom Icon */}
                            <div
                                style={{
                                    position: 'absolute',
                                    top: '5px',
                                    right: '5px',
                                    backgroundColor: 'rgba(0,0,0,0.7)',
                                    color: 'white',
                                    padding: '2px 6px',
                                    borderRadius: '50%',
                                    fontSize: '10px'
                                }}
                            >
                                <i className="fas fa-search-plus"></i>
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    // Render documents
    const renderDocuments = () => {
        if (!eventData?.documents || eventData.documents.length === 0) {
            return <p>No documents available.</p>;
        }

        return (
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    marginTop: '15px'
                }}
            >
                {eventData.documents.map((document, index) => {
                    let documentSrc = '';

                    if (typeof document === 'string') {
                        if (document.startsWith('http')) {
                            documentSrc = document;
                        } else {
                            documentSrc = `${API_URL}/${document.replace(/\\/g, '/')}`;
                        }
                    }

                    return (
                        <div
                            key={index}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                padding: '12px',
                                border: '1px solid #ddd',
                                borderRadius: '8px',
                                backgroundColor: '#f8f9fa',
                                gap: '12px'
                            }}
                        >
                            <div style={{ flexShrink: 0 }}>
                                <i
                                    className="fas fa-file-pdf text-danger"
                                    style={{
                                        fontSize: '1.5rem'
                                    }}
                                ></i>
                            </div>

                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div
                                    style={{
                                        fontWeight: 'bold',
                                        fontSize: '14px',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap'
                                    }}
                                >
                                    {typeof document === 'string' ? document.split('/').pop() : document.name}
                                </div>
                                <div
                                    style={{
                                        fontSize: '12px',
                                        color: '#666'
                                    }}
                                >
                                    Document {index + 1}
                                </div>
                            </div>

                            <Button
                                size="sm"
                                variant="outline-primary"
                                onClick={() => window.open(documentSrc, '_blank')}
                                style={{
                                    marginLeft: 'auto',
                                    fontSize: '12px',
                                    padding: '6px 12px',
                                    borderRadius: '6px'
                                }}
                            >
                                <i className="fas fa-eye" style={{ marginRight: '4px' }}></i>
                                View
                            </Button>
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <>
            <Modal show={show} onHide={handleClose} size="xl">
                <Modal.Header style={{ backgroundColor: '#4680ff', color: '#fff' }}>
                    <Modal.Title>View Event</Modal.Title>
                </Modal.Header>

                <Modal.Body
                    style={{
                        backgroundColor: '#f8f9fa',
                        padding: '20px'
                    }}
                >
                    <div className="lg:container-fluid">
                        {/* Event Statistics */}
                        <div
                            className="mb-3"
                            style={{
                                backgroundColor: '#fff',
                                borderRadius: '8px',
                                padding: '20px',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                            }}
                        >
                            <h5>Event Statistics</h5>
                            <hr />
                            {renderEventStats()}
                        </div>

                        {/* Tabbed Content */}
                        <div
                            style={{
                                backgroundColor: '#fff',
                                borderRadius: '8px',
                                padding: '20px',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                            }}
                        >
                            <Tab.Container id="event-tabs" defaultActiveKey="details">
                                <Row>
                                    <Col sm={12}>
                                        <Nav variant="tabs" className="mb-3">
                                            <Nav.Item>
                                                <Nav.Link eventKey="details">
                                                    <i className="fas fa-info-circle me-2" style={{ color: '#4680ff', marginRight: 6 }}></i>
                                                    Details
                                                </Nav.Link>
                                            </Nav.Item>
                                            <Nav.Item>
                                                <Nav.Link eventKey="location">
                                                    <i
                                                        className="fas fa-map-marker-alt me-2"
                                                        style={{ color: '#4680ff', marginRight: 6 }}
                                                    ></i>
                                                    Location & Pricing
                                                </Nav.Link>
                                            </Nav.Item>
                                            <Nav.Item>
                                                <Nav.Link eventKey="speakers">
                                                    <i className="fas fa-microphone me-2" style={{ color: '#4680ff', marginRight: 6 }}></i>
                                                    Speakers
                                                </Nav.Link>
                                            </Nav.Item>
                                            <Nav.Item>
                                                <Nav.Link eventKey="media">
                                                    <i className="fas fa-images me-2" style={{ color: '#4680ff', marginRight: 6 }}></i>
                                                    Media
                                                </Nav.Link>
                                            </Nav.Item>
                                        </Nav>
                                    </Col>
                                </Row>

                                <Tab.Content>
                                    {/* Details Tab */}
                                    <Tab.Pane eventKey="details">
                                        <div className="p-3" style={{ padding: '10px' }}>
                                            <h5>Event Information</h5>
                                            <hr />
                                            <Row>
                                                <Col md={6}>
                                                    <p>
                                                        <strong>Event Name:</strong> {eventData.name}
                                                    </p>
                                                    <p>
                                                        <strong>Event Type:</strong> {eventData.type || 'N/A'}
                                                    </p>
                                                    <p>
                                                        <strong>Start Date:</strong> <DateTimeFormatter date={eventData.startDate} time={eventData.startTime} />
                                                    </p>
                                                    <p>
                                                        <strong>End Date:</strong> <DateTimeFormatter date={eventData.endDate} time={eventData.endTime} />
                                                    </p>
                                                </Col>
                                                <Col md={6}>
                                                    <p>
                                                        <strong>Categories:</strong>
                                                    </p>
                                                    {renderCategories()}
                                                    <p className="mt-3">
                                                        <strong>Description:</strong>
                                                    </p>
                                                    <p
                                                        style={{
                                                            textAlign: 'justify',
                                                            lineHeight: '1.5'
                                                        }}
                                                    >
                                                        {eventData.description}
                                                    </p>
                                                </Col>
                                            </Row>
                                        </div>
                                    </Tab.Pane>

                                    {/* Location & Pricing Tab */}
                                    <Tab.Pane eventKey="location">
                                        <div className="p-3" style={{ padding: '20px' }}>
                                            <h5>Location & Pricing Information</h5>
                                            <hr />
                                            <Row>
                                                <Col xs={12} md={3} className="mb-3">
                                                    <div
                                                        className="text-center p-3"
                                                        style={{
                                                            backgroundColor: '#f8f9fa',
                                                            borderRadius: '8px',
                                                            border: '1px solid #e9ecef',
                                                            padding: '20px'
                                                        }}
                                                    >
                                                        <i
                                                            className="fas fa-map-marker-alt text-primary mb-2"
                                                            style={{ fontSize: '1.5rem' }}
                                                        ></i>
                                                        <h6 className="mb-1" style={{ color: '#495057', fontSize: '0.9rem' }}>
                                                            Location
                                                        </h6>
                                                        <p className="mb-0" style={{ fontSize: '0.95rem', fontWeight: '500' }}>
                                                            {eventData.location || 'N/A'}
                                                        </p>
                                                    </div>
                                                </Col>
                                                <Col xs={12} md={3} className="mb-3">
                                                    <div
                                                        className="text-center p-3"
                                                        style={{
                                                            backgroundColor: '#f8f9fa',
                                                            borderRadius: '8px',
                                                            border: '1px solid #e9ecef',
                                                            padding: '20px'
                                                        }}
                                                    >
                                                        <i className="fas fa-building text-primary mb-2" style={{ fontSize: '1.5rem' }}></i>
                                                        <h6 className="mb-1" style={{ color: '#495057', fontSize: '0.9rem' }}>
                                                            Venue
                                                        </h6>
                                                        <p className="mb-0" style={{ fontSize: '0.95rem', fontWeight: '500' }}>
                                                            {eventData.venue || 'N/A'}
                                                        </p>
                                                    </div>
                                                </Col>
                                                <Col xs={12} md={3} className="mb-3">
                                                    <div
                                                        className="text-center p-3"
                                                        style={{
                                                            backgroundColor: '#f8f9fa',
                                                            borderRadius: '8px',
                                                            border: '1px solid #e9ecef',
                                                            padding: '20px'
                                                        }}
                                                    >
                                                        <i className="fas fa-flag text-primary mb-2" style={{ fontSize: '1.5rem' }}></i>
                                                        <h6 className="mb-1" style={{ color: '#495057', fontSize: '0.9rem' }}>
                                                            Country
                                                        </h6>
                                                        <p className="mb-0" style={{ fontSize: '0.95rem', fontWeight: '500' }}>
                                                            {eventData.country || 'N/A'}
                                                        </p>
                                                    </div>
                                                </Col>
                                                <Col xs={12} md={3} className="mb-3">
                                                    <div
                                                        className="text-center p-3"
                                                        style={{
                                                            backgroundColor: '#f8f9fa',
                                                            borderRadius: '8px',
                                                            border: '1px solid #e9ecef',
                                                            padding: '20px'
                                                        }}
                                                    >
                                                        <i
                                                            className="fas fa-dollar-sign text-success mb-2"
                                                            style={{ fontSize: '1.5rem' }}
                                                        ></i>
                                                        <h6 className="mb-1" style={{ color: '#495057', fontSize: '0.9rem' }}>
                                                            Price
                                                        </h6>
                                                        <p
                                                            className="mb-0"
                                                            style={{ fontSize: '0.95rem', fontWeight: '500', color: '#28a745' }}
                                                        >
                                                            {eventData.price} {eventData.currency}
                                                        </p>
                                                    </div>
                                                </Col>
                                            </Row>
                                        </div>
                                    </Tab.Pane>

                                    {/* Speakers Tab */}
                                    <Tab.Pane eventKey="speakers">
                                        <div className="p-3">
                                            <h5>Speakers Details</h5>
                                            <hr />
                                            {renderSpeakers()}
                                        </div>
                                    </Tab.Pane>

                                    {/* Media Tab */}
                                    <Tab.Pane eventKey="media">
                                        <div className="p-3" style={{ padding: '20px' }}>
                                            <Row>
                                                <Col md={6}>
                                                    <h5>
                                                        Event Images <Badge bg="info">{eventData?.images?.length || 0}</Badge>
                                                    </h5>
                                                    <hr />
                                                    {renderImageGrid()}
                                                </Col>
                                                <Col md={6} className="section-speakers">
                                                    <h5>
                                                        Event Documents <Badge bg="info">{eventData?.documents?.length || 0}</Badge>
                                                    </h5>
                                                    <hr />
                                                    {renderDocuments()}
                                                </Col>
                                            </Row>
                                        </div>
                                    </Tab.Pane>
                                </Tab.Content>
                            </Tab.Container>
                        </div>
                    </div>
                </Modal.Body>

                <Modal.Footer style={{ backgroundColor: '#f8f9fa' }}>
                    <Button variant="secondary" onClick={handleClose}>
                        Close
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Existing Image Modal */}
            <Modal
                show={showImageModal}
                onHide={() => setShowImageModal(false)}
                size="xl"
                centered
                style={{ backgroundColor: 'rgba(0,0,0,0.95)' }}
            >
                <Modal.Body>
                    {/* Fixed Position Controls - Always visible */}

                    {/* Close Button - Fixed Top Right */}
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

                    {/* Download Button - Fixed Top Left */}
                    <Button
                        variant="light"
                        size="sm"
                        onClick={() => {
                            const link = document.createElement('a');
                            link.href = getImageSrc(eventData.images[currentImageIndex]);
                            link.download = `event-image-${currentImageIndex + 1}.jpg`;
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

                    {/* Navigation Arrows - Fixed Left/Right Center */}
                    {eventData.images.length > 1 && (
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

                    {/* Image Counter - Fixed Bottom Center */}
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
                        {currentImageIndex + 1} / {eventData.images.length}
                    </div>

                    {/* Image Container - Centered */}
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            minHeight: '90vh',
                            padding: '60px 80px 80px 80px' // Top, Right, Bottom, Left padding to avoid controls
                        }}
                    >
                        <img
                            src={getImageSrc(eventData.images[currentImageIndex])}
                            alt={`Event Image ${currentImageIndex + 1}`}
                            style={{
                                maxWidth: '100%',
                                maxHeight: '100%',
                                objectFit: 'contain',
                                borderRadius: '8px'
                            }}
                            onError={(e) => {
                                console.error('Modal image failed to load:', getImageSrc(eventData.images[currentImageIndex]));
                                e.target.style.display = 'none';
                            }}
                        />
                    </div>
                </Modal.Body>
            </Modal>

            {/* Speaker Image Modal */}
            <Modal
                show={showSpeakerImageModal}
                onHide={() => setShowSpeakerImageModal(false)}
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
                        onClick={() => setShowSpeakerImageModal(false)}
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
                            link.href = `${API_URL}/${currentSpeakerImage}`;
                            link.download = `speaker-profile.jpg`;
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
                            src={`${API_URL}/${currentSpeakerImage}`}
                            alt="Speaker Profile"
                            style={{
                                maxWidth: '100%',
                                maxHeight: '100%',
                                objectFit: 'contain',
                                borderRadius: '8px'
                            }}
                            onError={(e) => {
                                console.error('Speaker image failed to load:', currentSpeakerImage);
                                e.target.style.display = 'none';
                            }}
                        />
                    </div>
                </Modal.Body>
            </Modal>

            {/* Event Main Image Modal */}
            <Modal
                show={showEventMainImageModal}
                onHide={() => setShowEventMainImageModal(false)}
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
                        onClick={() => setShowEventMainImageModal(false)}
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
                            link.href = `${API_URL}/${currentEventMainImage.replace(/\\/g, '/')}`;
                            link.download = `event-main-image.jpg`;
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
                            src={`${API_URL}/${currentEventMainImage.replace(/\\/g, '/')}`}
                            alt="Event Main Image"
                            style={{
                                maxWidth: '100%',
                                maxHeight: '100%',
                                objectFit: 'contain',
                                borderRadius: '8px'
                            }}
                            onError={(e) => {
                                console.error('Event main image failed to load:', currentEventMainImage);
                                e.target.style.display = 'none';
                            }}
                        />
                    </div>
                </Modal.Body>
            </Modal>
        </>
    );
}

export default ViewEventModal;
