import React, { useState } from 'react';
import { Modal, Button, Row, Col, Card, Container, Badge } from 'react-bootstrap';
import { API_URL } from '../../../../configs/env';

function ViewEventModal({ show, handleClose, eventData }) {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [showImageModal, setShowImageModal] = useState(false);
    
    if (!eventData) return null;

    const renderSpeakers = () => {
        if (!eventData?.speakersData?.length) {
            return <p>No speakers listed.</p>;
        }

        return eventData.speakersData.map((speaker) => (
            <Row key={speaker.id} className="mb-3">
                <Col xs={12} md={3} className="text-center mb-3 mb-md-0">
                    {speaker.speakerProfile && (
                        <img
                            src={`${API_URL}/${speaker.speakerProfile}`}
                            alt={speaker.name}
                            style={{
                                width: 100,
                                height: 100,
                                objectFit: 'cover',
                                borderRadius: '10%',
                                border: '2px solid #4680ff'
                            }}
                        />
                    )}
                </Col>
                <Col xs={12} md={9}>
                    <p className="mb-2"><strong>Name:</strong> {speaker.name}</p>
                    <p className="mb-2"><strong>Company:</strong> {speaker.companyName}</p>
                    <p className="mb-2"><strong>Position:</strong> {speaker.position}</p>
                    <p className="mb-2"><strong>Mobile:</strong> {speaker.mobile}</p>
                    <p className="mb-2"><strong>Email:</strong> {speaker.email}</p>
                    <p className="mb-2"><strong>Location:</strong> {speaker.location}</p>
                    <p className="mb-2"><strong>Description:</strong> {speaker.description}</p>
                </Col>
            </Row>
        ));
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
        setCurrentImageIndex((prevIndex) => 
            prevIndex === 0 ? eventData.images.length - 1 : prevIndex - 1
        );
    };

    const goToNextImage = () => {
        setCurrentImageIndex((prevIndex) => 
            prevIndex === eventData.images.length - 1 ? 0 : prevIndex + 1
        );
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
            <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                gap: '10px',
                marginTop: '10px'
            }}>
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
                            onMouseEnter={(e) => {
                                e.target.style.transform = 'scale(1.05)';
                                e.target.style.borderColor = '#4680ff';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.transform = 'scale(1)';
                                e.target.style.borderColor = '#ddd';
                            }}
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
                            <div style={{
                                position: 'absolute',
                                top: '5px',
                                left: '5px',
                                backgroundColor: 'rgba(0,0,0,0.7)',
                                color: 'white',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                fontSize: '10px',
                                fontWeight: 'bold'
                            }}>
                                {index + 1}
                            </div>
                            
                            {/* Zoom Icon */}
                            <div style={{
                                position: 'absolute',
                                top: '5px',
                                right: '5px',
                                backgroundColor: 'rgba(0,0,0,0.7)',
                                color: 'white',
                                padding: '2px 6px',
                                borderRadius: '50%',
                                fontSize: '10px'
                            }}>
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
            <div style={{ 
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                marginTop: '15px'
            }}>
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
                        <div key={index} style={{ 
                            display: 'flex', 
                            alignItems: 'center',
                            padding: '12px',
                            border: '1px solid #ddd',
                            borderRadius: '8px',
                            backgroundColor: '#f8f9fa'
                        }}>
                            <div style={{ marginRight: '12px' }}>
                                <i className="fas fa-file-pdf fa-2x text-danger"></i>
                            </div>
                            
                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 'bold', fontSize: '14px' }}>
                                    {typeof document === 'string' ? document.split('/').pop() : document.name}
                                </div>
                                <div style={{ fontSize: '12px', color: '#666' }}>
                                    Document {index + 1}
                                </div>
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
                                            <img
                                                src={`${API_URL}/${eventData.images[0].replace(/\\/g, '/')}`}
                                                alt="Event"
                                                style={{
                                                    width: '100%',
                                                    height: '100%',
                                                    maxWidth: '200px',
                                                    maxHeight: '200px',
                                                    objectFit: 'cover',
                                                    borderRadius: '10%',
                                                    border: '3px solid #4680ff'
                                                }}
                                            />
                                        )}
                                    </Col>
                                    <Col md={8}>
                                        <p className="mb-2"><strong>Name:</strong> {eventData.name}</p>
                                        <p className="mb-2">
                                            <strong>Date:</strong> {eventData.startDate} {eventData.startTime} to {eventData.endDate} {eventData.endTime}
                                        </p>
                                        <p className="mb-2"><strong>Type:</strong> {eventData.type || 'N/A'}</p>
                                        <p className="mb-2"><strong>Description:</strong> {eventData.description}</p>
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
                                    <Col xs={6} md={3} className="text-start">
                                        <Card.Text className="mb-2">
                                            <strong>Location:</strong><br />
                                            {eventData.location || 'N/A'}
                                        </Card.Text>
                                    </Col>
                                    <Col xs={6} md={3} className="text-start">
                                        <Card.Text className="mb-2">
                                            <strong>Venue:</strong><br />
                                            {eventData.venue || 'N/A'}
                                        </Card.Text>
                                    </Col>
                                    <Col xs={6} md={3} className="text-start">
                                        <Card.Text className="mb-2">
                                            <strong>Country:</strong><br />
                                            {eventData.country || 'N/A'}
                                        </Card.Text>
                                    </Col>
                                    <Col xs={6} md={3} className="text-start">
                                        <Card.Text className="mb-2">
                                            <strong>Price:</strong><br />
                                            {eventData.price} {eventData.currency}
                                        </Card.Text>
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

            {/* Full Screen Image Modal with Navigation */}
            <Modal 
                show={showImageModal} 
                onHide={() => setShowImageModal(false)} 
                size="xl"
                centered
                style={{ backgroundColor: 'rgba(0,0,0,0.95)' }}
            >
                <Modal.Body style={{ 
                    padding: 0, 
                    backgroundColor: 'transparent',
                    position: 'relative',
                    minHeight: '90vh'
                }}>
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
                    <div style={{
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
                    }}>
                        {currentImageIndex + 1} / {eventData.images.length}
                    </div>
                    
                    {/* Image Container - Centered */}
                    <div style={{ 
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        minHeight: '90vh',
                        padding: '60px 80px 80px 80px' // Top, Right, Bottom, Left padding to avoid controls
                    }}>
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
        </>
    );
}

export default ViewEventModal;
