import React, { useState } from 'react';
import { Modal, Button, Card, Row, Col, Container, Badge } from 'react-bootstrap';
import { API_URL, DUMMY_PATH_USER } from '../../../../configs/env';

const RegisterEventModal = ({ show, onHide, eventData }) => {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [showImageModal, setShowImageModal] = useState(false);
    const [currentSpeakerImage, setCurrentSpeakerImage] = useState('');
    const [showSpeakerImageModal, setShowSpeakerImageModal] = useState(false);
    const [currentEventMainImage, setCurrentEventMainImage] = useState('');
    const [showEventMainImageModal, setShowEventMainImageModal] = useState(false);
    
    console.log(eventData);
    if (!eventData) return null;

    const regDate = new Date(eventData.createdAt).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    // Format time utility function
    const formatTime = (time) => {
        if (!time) return '';
        const [hours, minutes] = time.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const hour12 = hour % 12 || 12;
        return `${hour12}:${minutes} ${ampm}`;
    };

    // Calculate duration
    const calculateDuration = (startDate, endDate) => {
        const diffTime = Math.abs(new Date(endDate) - new Date(startDate));
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
            return '1 day';
        } else if (diffDays === 0) {
            return 'Same day';
        } else {
            return `${diffDays} days`;
        }
    };

    // Get event status
    const getEventStatus = () => {
        const eventDate = new Date(eventData.event?.startDate);
        const today = new Date();
        const daysUntilEvent = Math.ceil((eventDate - today) / (1000 * 60 * 60 * 24));

        if (daysUntilEvent < 0) {
            return { class: 'badge-light-secondary', text: `${Math.abs(daysUntilEvent)} days ago` };
        } else if (daysUntilEvent === 0) {
            return { class: 'badge-light-success', text: 'Today' };
        } else if (daysUntilEvent === 1) {
            return { class: 'badge-light-danger', text: 'Tomorrow' };
        } else if (daysUntilEvent <= 3) {
            return { class: 'badge-light-danger', text: `in ${daysUntilEvent} days` };
        } else if (daysUntilEvent <= 7) {
            return { class: 'badge-light-warning', text: `in ${daysUntilEvent} days` };
        } else {
            return { class: 'badge-light-info', text: `in ${daysUntilEvent} days` };
        }
    };

    // Get user type badge style
    const getUserTypeStyle = () => {
        const type = eventData.type?.toLowerCase();
        if (type === 'exhibitor') {
            return {
                backgroundColor: 'rgb(162, 209, 231)',
                color: 'rgb(14, 13, 13)',
                fontWeight: '500'
            };
        } else if (type === 'attendee') {
            return {
                backgroundColor: 'rgb(223, 228, 165)',
                color: 'rgb(14, 13, 13)',
                fontWeight: '500'
            };
        }
        return {};
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
        const images = eventData.event?.images || [];
        setCurrentImageIndex((prevIndex) => 
            prevIndex === 0 ? images.length - 1 : prevIndex - 1
        );
    };

    const goToNextImage = () => {
        const images = eventData.event?.images || [];
        setCurrentImageIndex((prevIndex) => 
            prevIndex === images.length - 1 ? 0 : prevIndex + 1
        );
    };

    // Speaker image zoom function
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

    // Render image grid
    const renderImageGrid = () => {
        const images = eventData.event?.images || [];
        if (!images || images.length === 0) {
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
                {images.map((image, index) => {
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
        const documents = eventData.event?.documents || [];
        if (!documents || documents.length === 0) {
            return <p>No documents available.</p>;
        }

        return (
            <div style={{ 
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                marginTop: '15px'
            }}>
                {documents.map((document, index) => {
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

    const renderSpeakers = () => {
        if (!eventData?.event?.speakers?.length) {
            return <p>No speakers listed.</p>;
        }

        const speakers = eventData.event.speakers;
        const colWidth = speakers.length === 1 ? 12 : 6; // 1 है तो full, 2 या ज्यादा है तो 6-6

        // हर लाइन में 2 कार्ड
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

    const eventStatus = getEventStatus();
    const userTypeStyle = getUserTypeStyle();

    return (
        <>
            <Modal show={show} onHide={onHide} size="xl">
                <Modal.Header style={{ backgroundColor: '#4680ff', color: '#fff' }}>
                    <Modal.Title>Registered Event Details</Modal.Title>
                </Modal.Header>
                <Modal.Body style={{ backgroundColor: '#f8f9fa', padding: 20 }}>
                    <Container>
                        {/* Registration Info */}
                        <Card className="mb-3">
                            <Card.Body>
                                <Card.Title>Registration Information</Card.Title>
                                <hr />
                                <Row>
                                    <Col md={6}>
                                        <p className="mb-2">
                                            <strong>Registered By:</strong> {eventData.user?.firstName} {eventData.user?.lastName}
                                        </p>
                                        <p className="mb-2">
                                            <strong>Email:</strong> {eventData.user?.email}
                                        </p>
                                        <p className="mb-2">
                                            <strong>Mobile:</strong> {eventData.user?.mobile || 'N/A'}
                                        </p>
                                        <p className="mb-2">
                                            <strong>Registration Date:</strong> {regDate}
                                        </p>
                                    </Col>
                                    <Col md={6}>
                                        <p className="mb-2">
                                            <strong>User Type:</strong>
                                            <span 
                                                className="badge ml-2" 
                                                style={userTypeStyle}
                                            >
                                                {eventData.type || 'N/A'}
                                            </span>
                                        </p>
                                        <p className="mb-2">
                                            <strong>Registration Status:</strong>
                                            <Badge 
                                                bg={eventData.status === 'Success' ? 'success' : 
                                                    eventData.status === 'Withdraw' ? 'danger' : 'warning'}
                                                className="ml-2"
                                            >
                                                {eventData.status}
                                            </Badge>
                                        </p>
                                        {eventData.isCreatedByAdmin && (
                                            <p className="mb-2">
                                                <strong>Created By:</strong>
                                                <Badge bg="danger" className="ml-2">
                                                    <i className="fas fa-shield mr-1"></i>Admin
                                                </Badge>
                                            </p>
                                        )}
                                    </Col>
                                </Row>
                            </Card.Body>
                        </Card>

                        {/* Event Info */}
                        <Card className="mb-3">
                            <Card.Body>
                                <Card.Title>Event Information</Card.Title>
                                <hr />
                                <Row className="align-items-center flex-md-row flex-column">
                                    <Col md={4} className="text-center mb-3 mb-md-0">
                                        {eventData.event?.images && eventData.event.images.length > 0 && (
                                            <div style={{ position: 'relative', display: 'inline-block' }}>
                                                <img
                                                    src={getImageSrc(eventData.event.images[0])}
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
                                                    onClick={() => handleEventMainImageClick(eventData.event.images[0])}
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
                                                    onClick={() => handleEventMainImageClick(eventData.event.images[0])}
                                                >
                                                    <i className="fas fa-search-plus"></i>
                                                </div>
                                            </div>
                                        )}
                                    </Col>
                                    <Col md={8}>
                                        <p className="mb-2">
                                            <strong>Name:</strong> {eventData.event?.name}
                                        </p>
                                        <p className="mb-2">
                                            <strong>Date:</strong> {eventData.event?.startDate} {eventData.event?.startTime} to {eventData.event?.endDate}{' '}
                                            {eventData.event?.endTime}
                                        </p>
                                        <p className="mb-2">
                                            <strong>Type:</strong> {eventData.event?.type || 'N/A'}
                                        </p>
                                        <p className="mb-2">
                                            <strong>Description:</strong> {eventData.event?.description}
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
                                                {eventData.event?.location || 'N/A'}
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
                                                {eventData.event?.venue || 'N/A'}
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
                                                {eventData.event?.country || 'N/A'}
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
                                                {eventData.event?.price} {eventData.event?.currency}
                                            </p>
                                        </div>
                                    </Col>
                                </Row>
                            </Card.Body>
                        </Card>

                        {/* Event Schedule */}
                        <Card className="mb-3">
                            <Card.Body>
                                <Card.Title>Event Schedule</Card.Title>
                                <hr />
                                <Row>
                                    <Col md={8}>
                                        <div className="event-schedule-inline">
                                            <div className="schedule-time">
                                                <i className="fas fa-calendar text-primary mr-2"></i>
                                                <span className="date-range">
                                                    {new Date(eventData.event?.startDate).toLocaleDateString('en-GB', {
                                                        day: '2-digit',
                                                        month: 'short',
                                                        year: 'numeric'
                                                    })} {formatTime(eventData.event?.startTime)}
                                                    <i className="fas fa-arrow-right mx-2"></i>
                                                    {new Date(eventData.event?.endDate).toLocaleDateString('en-GB', {
                                                        day: '2-digit',
                                                        month: 'short',
                                                        year: 'numeric'
                                                    })} {formatTime(eventData.event?.endTime)}
                                                </span>
                                            </div>
                                            <div className="duration-badge mt-2">
                                                <Badge bg="info">{calculateDuration(eventData.event?.startDate, eventData.event?.endDate)}</Badge>
                                            </div>
                                        </div>
                                    </Col>
                                    <Col md={4}>
                                        <div className="text-end">
                                            <Badge bg="success">
                                                <i className="fas fa-map-marker-alt mr-1"></i>
                                                {eventData.event?.venue || 'N/A'}, {eventData.event?.country || 'N/A'}
                                            </Badge>
                                        </div>
                                    </Col>
                                </Row>
                            </Card.Body>
                        </Card>

                        {/* Images Section */}
                        <Card className="mb-3">
                            <Card.Body>
                                <Card.Title>
                                    Event Images <Badge bg="info">{eventData.event?.images?.length || 0}</Badge>
                                </Card.Title>
                                <hr />
                                {renderImageGrid()}
                            </Card.Body>
                        </Card>

                        {/* Documents Section */}
                        <Card className="mb-3">
                            <Card.Body>
                                <Card.Title>
                                    Event Documents <Badge bg="info">{eventData.event?.documents?.length || 0}</Badge>
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

                        {/* Order Info */}
                        {eventData?.order && (
                            <Card className="mb-3">
                                <Card.Body>
                                    <Card.Title>Order Details</Card.Title>
                                    <hr />
                                    <Row>
                                        <Col xs={6} md={4} className="text-start">
                                            <Card.Text className="mb-2">
                                                <strong>Order Number:</strong>
                                                <br />
                                                {eventData.order?.orderNo || 'N/A'}
                                            </Card.Text>
                                        </Col>
                                        <Col xs={6} md={4} className="text-start">
                                            <Card.Text className="mb-2">
                                                <strong>Payment Status:</strong>
                                                <br />
                                                <Badge 
                                                    bg={eventData.order?.status === 'Success' ? 'success' : 
                                                        eventData.order?.status === 'Withdraw' ? 'danger' : 'warning'}
                                                >
                                                    {eventData.order?.status || 'N/A'}
                                                </Badge>
                                            </Card.Text>
                                        </Col>
                                        <Col xs={6} md={4} className="text-start">
                                            <Card.Text className="mb-2">
                                                <strong>Amount Paid:</strong>
                                                <br />
                                                {eventData.order.price || 'N/A'} {eventData.order.currency || ''}
                                            </Card.Text>
                                        </Col>
                                        <Col xs={6} md={4} className="text-start mt-2">
                                            <Card.Text className="mb-2">
                                                <strong>Payment Method:</strong>
                                                <br />
                                                {eventData.order.paymentMethod || 'N/A'}
                                            </Card.Text>
                                        </Col>
                                        <Col xs={6} md={4} className="text-start">
                                            <Card.Text className="mb-2">
                                                <strong>Transaction Date:</strong>
                                                <br />
                                                {regDate ? regDate : 'N/A'}
                                            </Card.Text>
                                        </Col>
                                        <Col xs={6} md={4} className="text-start">
                                            <Card.Text className="mb-2">
                                                <strong>Receipt/Invoice:</strong>
                                                <br />
                                                <div className="mt-2">
                                                    {eventData.receiptUrl && (
                                                        <Button
                                                            size="sm"
                                                            variant="info"
                                                            className="mr-2"
                                                            onClick={() => window.open(eventData.receiptUrl, '_blank')}
                                                        >
                                                            <i className="fas fa-download"></i> Receipt
                                                        </Button>
                                                    )}
                                                    {eventData.invoiceUrl && (
                                                        <Button
                                                            size="sm"
                                                            variant="primary"
                                                            onClick={() => window.open(eventData.invoiceUrl, '_blank')}
                                                        >
                                                            <i className="fas fa-file-text"></i> Invoice
                                                        </Button>
                                                    )}
                                                </div>
                                            </Card.Text>
                                        </Col>
                                    </Row>
                                </Card.Body>
                            </Card>
                        )}
                    </Container>
                </Modal.Body>
                <Modal.Footer style={{ backgroundColor: '#f8f9fa' }}>
                    <Button variant="secondary" onClick={onHide}>
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
                            const images = eventData.event?.images || [];
                            const link = document.createElement('a');
                            link.href = getImageSrc(images[currentImageIndex]);
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
                    {eventData.event?.images && eventData.event.images.length > 1 && (
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
                        {currentImageIndex + 1} / {eventData.event?.images?.length || 0}
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
                            src={getImageSrc(eventData.event?.images?.[currentImageIndex])}
                            alt={`Event Image ${currentImageIndex + 1}`}
                            style={{ 
                                maxWidth: '100%', 
                                maxHeight: '100%', 
                                objectFit: 'contain',
                                borderRadius: '8px'
                            }}
                            onError={(e) => {
                                console.error('Modal image failed to load:', getImageSrc(eventData.event?.images?.[currentImageIndex]));
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
};

export default RegisterEventModal;
