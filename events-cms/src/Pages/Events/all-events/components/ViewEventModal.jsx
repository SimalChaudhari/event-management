import React, { useState } from 'react';
import { Modal, Button, Row, Col, Card, Container, Badge } from 'react-bootstrap';
import { API_URL, DUMMY_PATH_USER } from '../../../../configs/env';

function ViewEventModal({ show, handleClose, eventData }) {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [showImageModal, setShowImageModal] = useState(false);
    const [showSpeakerImageModal, setShowSpeakerImageModal] = useState(false);
    const [currentSpeakerImage, setCurrentSpeakerImage] = useState('');

    const [showEventMainImageModal, setShowEventMainImageModal] = useState(false);
    const [currentEventMainImage, setCurrentEventMainImage] = useState('');

    if (!eventData) return null;

    // Speaker image zoom  function
    const handleSpeakerImageClick = (speakerProfile) => {
        if(speakerProfile){
            setCurrentSpeakerImage(speakerProfile);
            setShowSpeakerImageModal(true);
        }else{
            setShowSpeakerImageModal(false);
        }
    };

    // Event main image zoom function
    const handleEventMainImageClick = (imagePath) => {
        setCurrentEventMainImage(imagePath);
        setShowEventMainImageModal(true);
    };

    const renderSpeakers = () => {
        if (!eventData?.speakersData?.length) {
            return <p>No speakers listed.</p>;
        }

        const speakers = eventData.speakersData;
        const colWidth = speakers.length === 1 ? 12 : 6; 

    
        const rows = [];
        for (let i = 0; i < speakers.length; i += 2) {
            rows.push(
                <Row key={i}>
                    {[0, 1].map((j) => {
                        const speaker = speakers[i + j];
                        if (!speaker) return null;
                        return (
                            <Col xs={12} md={colWidth} key={speaker.id} className="mb-4 d-flex">
                                <Card
                                    style={{
                                        width: '100%',
                                        borderRadius: 18,
                                        boxShadow: '0 4px 16px rgba(70,128,255,0.10)',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'stretch',
                                        overflow: 'visible'
                                    }}
                                    className="w-100 h-100"
                                >
                                    <Card.Body className="d-flex flex-column justify-content-between" style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 12 }}>
                                            <div
                                                style={{
                                                    width: 110,
                                                    height: 110,
                                                    borderRadius: '50%',
                                                    overflow: 'hidden',
                                                    border: '3px solid #4680ff',
                                                    boxShadow: '0 2px 8px rgba(70,128,255,0.10)',
                                                    marginTop: -60,
                                                    background: '#fff',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    transition: 'transform 0.2s'
                                                }}
                                                onClick={() => handleSpeakerImageClick(speaker.speakerProfile)}
                                                onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.06)')}
                                                onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                                            >
                                                <img
                                                    src={speaker.speakerProfile ? `${API_URL}/${speaker.speakerProfile}` : DUMMY_PATH_USER}
                                                    alt={speaker.name}
                                                    style={{
                                                        width: '100%',
                                                        height: '100%',
                                                        objectFit: 'cover'
                                                    }}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <Card.Title style={{ fontWeight: 700, fontSize: 20, textAlign: 'left' }}>{speaker.name}</Card.Title>
                                            <div style={{ fontSize: 15, color: '#4680ff', marginBottom: 8, textAlign: 'left' }}>
                                                {speaker.position}
                                            </div>
                                            <div style={{ fontSize: 15, marginBottom: 6, textAlign: 'left', display: 'flex', alignItems: 'center' }}>
                                                <i className="fas fa-building" style={{ marginRight: 8, fontSize: 18, color: '#4680ff' }}></i>
                                                <span>{speaker.companyName}</span>
                                            </div>
                                            <div style={{ fontSize: 15, marginBottom: 6, textAlign: 'left', display: 'flex', alignItems: 'center' }}>
                                            <i className="fas fa-mobile" style={{ marginRight: 8, fontSize: 18, color: '#28a745' }}></i>
                                            <span>{speaker.mobile}</span>
                                            </div>
                                            <div style={{ fontSize: 15, marginBottom: 6, textAlign: 'left', display: 'flex', alignItems: 'center' }}>
                                                <i className="fas fa-envelope" style={{ marginRight: 8, fontSize: 18, color: '#ff9800' }}></i>
                                                <span>{speaker.email}</span>
                                            </div>
                                            <div style={{ fontSize: 15, marginBottom: 6, textAlign: 'left', display: 'flex', alignItems: 'center' }}>
                                                <i className="fas fa-map-marker-alt" style={{ marginRight: 8, fontSize: 18, color: '#e91e63' }}></i>
                                                <span>{speaker.location}</span>
                                            </div>
                                            <div style={{ fontSize: 13, color: '#666', marginTop: 8, textAlign: 'left', wordBreak: 'break-word' }}>
                                                {speaker.description}
                                            </div>
                                        </div>
                                        <div className="mt-3" style={{ textAlign: 'left' }}>
                                            <Button
                                                variant="outline-primary"
                                                size="sm"
                                                style={{ borderRadius: 20, fontWeight: 500 }}
                                                onClick={() => alert(`Contact: ${speaker.email}`)}
                                            >
                                                Contact
                                            </Button>
                                        </div>
                                    </Card.Body>
                                </Card>
                            </Col>
                        );
                    })}
                </Row>
            );
        }

        return <>{rows}</>;
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
                                backgroundColor: '#f8f9fa'
                            }}
                        >
                            <div style={{ marginRight: '12px' }}>
                                <i className="fas fa-file-pdf fa-2x text-danger"></i>
                            </div>

                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 'bold', fontSize: '14px' }}>
                                    {typeof document === 'string' ? document.split('/').pop() : document.name}
                                </div>
                                <div style={{ fontSize: '12px', color: '#666' }}>Document {index + 1}</div>
                            </div>

                            <Button
                                size="sm"
                                variant="outline-primary"
                                onClick={() => window.open(documentSrc, '_blank')}
                                style={{ marginLeft: '10px' }}
                            >
                                <i className="fas fa-eye"></i> View
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

                <Modal.Body style={{ backgroundColor: '#f8f9fa', padding: 20 }}>
                    <Container>
                        {/* Event Info */}
                        <Card className="mb-3">
                            <Card.Body>
                                <Card.Title>Event Information</Card.Title>
                                <hr />
                                <Row className="align-items-center flex-md-row flex-column">
                                    <Col md={4} className="text-center mb-3 mb-md-0">
                                        {eventData.images && eventData.images.length > 0 && (
                                            <div style={{ position: 'relative', display: 'inline-block' }}>
                                                <img
                                                    src={`${API_URL}/${eventData.images[0].replace(/\\/g, '/')}`}
                                                    alt="Event"
                                                    style={{
                                                        width: '100%',
                                                        maxWidth: '220px',
                                                        height: '180px',
                                                        objectFit: 'cover',
                                                        borderRadius: '16px',
                                                        border: '3px solid #4680ff',
                                                        boxShadow: '0 4px 16px rgba(70,128,255,0.15)',
                                                        cursor: 'pointer',
                                                        transition: 'transform 0.2s'
                                                    }}
                                                    onClick={() => handleEventMainImageClick(eventData.images[0])}
                                                    onMouseEnter={(e) => (e.target.style.transform = 'scale(1.04)')}
                                                    onMouseLeave={(e) => (e.target.style.transform = 'scale(1)')}
                                                />

                                                {/* Zoom Icon for Event Main Image */}
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
                                                        cursor: 'pointer',
                                                        transition: 'all 0.2s ease',
                                                        zIndex: 10
                                                    }}

                                                    onClick={() => handleEventMainImageClick(eventData.images[0])}
                                                >
                                                    <i className="fas fa-search-plus"></i>
                                                </div>
                                            </div>
                                        )}
                                    </Col>
                                    <Col md={8}>
                                        <p className="mb-2">
                                            <strong>Name:</strong> {eventData.name}
                                        </p>
                                        <p className="mb-2">
                                            <strong>Date:</strong> {eventData.startDate} {eventData.startTime} to {eventData.endDate}{' '}
                                            {eventData.endTime}
                                        </p>
                                        <p className="mb-2">
                                            <strong>Type:</strong> {eventData.type || 'N/A'}
                                        </p>
                                        <p className="mb-2">
                                            <strong>Description:</strong> {eventData.description}
                                        </p>
                                    </Col>
                                </Row>
                            </Card.Body>
                        </Card>

                        {/* Location Info */}
                        <Card className="mb-3">
                            <Card.Body>
                                <Card.Title>Location & Pricing</Card.Title>
                                <hr />
                                <Row>
                                    <Col xs={12} md={3} className="mb-3">
                                        <div className="text-center p-3" style={{
                                            backgroundColor: '#f8f9fa',
                                            borderRadius: '8px',
                                            border: '1px solid #e9ecef'
                                        }}>
                                            <i className="fas fa-map-marker-alt text-primary mb-2" style={{ fontSize: '1.5rem' }}></i>
                                            <h6 className="mb-1" style={{ color: '#495057', fontSize: '0.9rem' }}>Location</h6>
                                            <p className="mb-0" style={{ fontSize: '0.95rem', fontWeight: '500' }}>
                                                {eventData.location || 'N/A'}
                                            </p>
                                        </div>
                                    </Col>
                                    <Col xs={12} md={3} className="mb-3">
                                        <div className="text-center p-3" style={{
                                            backgroundColor: '#f8f9fa',
                                            borderRadius: '8px',
                                            border: '1px solid #e9ecef'
                                        }}>
                                            <i className="fas fa-building text-primary mb-2" style={{ fontSize: '1.5rem' }}></i>
                                            <h6 className="mb-1" style={{ color: '#495057', fontSize: '0.9rem' }}>Venue</h6>
                                            <p className="mb-0" style={{ fontSize: '0.95rem', fontWeight: '500' }}>
                                                {eventData.venue || 'N/A'}
                                            </p>
                                        </div>
                                    </Col>
                                    <Col xs={12} md={3} className="mb-3">
                                        <div className="text-center p-3" style={{
                                            backgroundColor: '#f8f9fa',
                                            borderRadius: '8px',
                                            border: '1px solid #e9ecef'
                                        }}>
                                            <i className="fas fa-flag text-primary mb-2" style={{ fontSize: '1.5rem' }}></i>
                                            <h6 className="mb-1" style={{ color: '#495057', fontSize: '0.9rem' }}>Country</h6>
                                            <p className="mb-0" style={{ fontSize: '0.95rem', fontWeight: '500' }}>
                                                {eventData.country || 'N/A'}
                                            </p>
                                        </div>
                                    </Col>
                                    <Col xs={12} md={3} className="mb-3">
                                        <div className="text-center p-3" style={{
                                            backgroundColor: '#f8f9fa',
                                            borderRadius: '8px',
                                            border: '1px solid #e9ecef'
                                        }}>
                                            <i className="fas fa-dollar-sign text-success mb-2" style={{ fontSize: '1.5rem' }}></i>
                                            <h6 className="mb-1" style={{ color: '#495057', fontSize: '0.9rem' }}>Price</h6>
                                            <p className="mb-0" style={{ fontSize: '0.95rem', fontWeight: '500', color: '#28a745' }}>
                                                {eventData.price} {eventData.currency}
                                            </p>
                                        </div>
                                    </Col>
                                </Row>
                            </Card.Body>
                        </Card>

                        {/* Images Section */}
                        <Card className="mb-3">
                            <Card.Body>
                                <Card.Title>
                                    Event Images <Badge bg="info">{eventData?.images?.length || 0}</Badge>
                                </Card.Title>
                                <hr />
                                {renderImageGrid()}
                            </Card.Body>
                        </Card>

                        {/* Documents Section */}
                        <Card className="mb-3">
                            <Card.Body>
                                <Card.Title>
                                    Event Documents <Badge bg="info">{eventData?.documents?.length || 0}</Badge>
                                </Card.Title>
                                <hr />
                                {renderDocuments()}
                            </Card.Body>
                        </Card>

                        {/* Speakers Info */}
                        <Card className="mb-3">
                            <Card.Body>
                                <Card.Title>Speakers Details</Card.Title>
                                <hr />
                                {renderSpeakers()}
                            </Card.Body>
                        </Card>
                    </Container>
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
                <Modal.Body
                    style={{
                        padding: 0,
                        backgroundColor: 'transparent',
                        position: 'relative',
                        minHeight: '90vh'
                    }}
                >
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
