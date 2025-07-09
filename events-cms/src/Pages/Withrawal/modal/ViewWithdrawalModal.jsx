import React, { useState } from 'react';
import { Modal, Button, Row, Col, Card, Container, Badge } from 'react-bootstrap';
import { API_URL } from '../../../configs/env';

function ViewWithdrawalModal({ show, handleClose, withdrawalData }) {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [showImageModal, setShowImageModal] = useState(false);
    const [currentEventIndex, setCurrentEventIndex] = useState(0);
    
    if (!withdrawalData) return null;

    const { reason, comment, status, request_at, reviewed_at, document, order } = withdrawalData;
    const user = order?.user;

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
    const getEventStatus = (event) => {
        const eventDate = new Date(event?.startDate);
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

    // Get withdrawal status badge
    const getWithdrawalStatusBadge = (status) => {
        let bgColor = 'secondary';
        if (status?.toLowerCase() === 'approved') {
            bgColor = 'success';
        } else if (status?.toLowerCase() === 'rejected') {
            bgColor = 'danger';
        } else if (status?.toLowerCase() === 'pending') {
            bgColor = 'warning';
        }
        return bgColor;
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
        const currentEvent = order?.orderItems[currentEventIndex]?.event;
        const images = currentEvent?.images || [];
        setCurrentImageIndex((prevIndex) => 
            prevIndex === 0 ? images.length - 1 : prevIndex - 1
        );
    };

    const goToNextImage = () => {
        const currentEvent = order?.orderItems[currentEventIndex]?.event;
        const images = currentEvent?.images || [];
        setCurrentImageIndex((prevIndex) => 
            prevIndex === images.length - 1 ? 0 : prevIndex + 1
        );
    };

    // Render image grid for an event
    const renderImageGrid = (event) => {
        const images = event?.images || [];
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

    // Render documents for an event
    const renderDocuments = (event) => {
        const documents = event?.documents || [];
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

    // Render speakers for an event
    const renderSpeakers = (event) => {
        if (!event?.speakers?.length) {
            return <p>No speakers listed.</p>;
        }

        return event.speakers.map((speaker) => (
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
                    <p className="mb-2">
                        <strong>Name:</strong> {speaker.name}
                    </p>
                    <p className="mb-2">
                        <strong>Company:</strong> {speaker.companyName}
                    </p>
                    <p className="mb-2">
                        <strong>Position:</strong> {speaker.position}
                    </p>
                    <p className="mb-2">
                        <strong>Mobile:</strong> {speaker.mobile}
                    </p>
                    <p className="mb-2">
                        <strong>Email:</strong> {speaker.email}
                    </p>
                    <p className="mb-2">
                        <strong>Location:</strong> {speaker.location}
                    </p>
                    <p className="mb-2">
                        <strong>Description:</strong> {speaker.description}
                    </p>
                </Col>
            </Row>
        ));
    };

    const renderOrderItems = () => {
        if (!order?.orderItems?.length) {
            return <p>No events in this order.</p>;
        }

        return order.orderItems.map(({ id, event }, index) => {
            const eventStatus = getEventStatus(event);
            
            return (
                <div key={id} className="mb-4 p-3 border rounded" style={{ backgroundColor: '#f8f9fa' }}>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <h5 className="mb-0">Event {index + 1}: {event.name}</h5>
                    </div>
                    
                    <Row className="align-items-center mb-3">
                        <Col md={4} className="text-center mb-3 mb-md-0">
                            {event.images && event.images.length > 0 && (
                                <img
                                    src={getImageSrc(event.images[0])}
                                    alt={event.name}
                                    style={{
                                        width: '100%',
                                        maxWidth: '200px',
                                        height: '200px',
                                        objectFit: 'cover',
                                        borderRadius: '10%',
                                        border: '3px solid #4680ff'
                                    }}
                                />
                            )}
                        </Col>
                        <Col md={8}>
                            <p className="mb-2">
                                <Badge className={eventStatus.class}>{eventStatus.text}</Badge>
                                <Badge bg="secondary" className="ml-2">{event.type}</Badge>
                            </p>
                            <p className="mb-2"><strong>Description:</strong> {event.description}</p>
                            <p className="mb-2">
                                <strong>Schedule:</strong> {new Date(event.startDate).toLocaleDateString('en-GB')} {formatTime(event.startTime)} to {new Date(event.endDate).toLocaleDateString('en-GB')} {formatTime(event.endTime)}
                            </p>
                            <p className="mb-2"><strong>Duration:</strong> {calculateDuration(event.startDate, event.endDate)}</p>
                            <p className="mb-2"><strong>Location:</strong> {event.location || 'N/A'}</p>
                            <p className="mb-2"><strong>Venue:</strong> {event.venue || 'N/A'}, {event.country || 'N/A'}</p>
                            <p className="mb-2"><strong>Price:</strong> {event.price} {event.currency}</p>
                        </Col>
                    </Row>

                    {/* Images Section */}
                    <div className="mb-3">
                        <h6>Event Images <Badge bg="info">{event.images?.length || 0}</Badge></h6>
                        <hr />
                        {renderImageGrid(event)}
                    </div>

                    {/* Documents Section */}
                    <div className="mb-3">
                        <h6>Event Documents <Badge bg="info">{event.documents?.length || 0}</Badge></h6>
                        <hr />
                        {renderDocuments(event)}
                    </div>

                    {/* Speakers Section */}
                    <div className="mb-3">
                        <h6>Speakers Details</h6>
                        <hr />
                        {renderSpeakers(event)}
                    </div>
                </div>
            );
        });
    };

    return (
        <>
            <Modal show={show} onHide={handleClose} size="xl">
                <Modal.Header style={{ backgroundColor: '#4680ff', color: '#fff' }}>
                    <Modal.Title>View Withdrawal Request</Modal.Title>
                </Modal.Header>

                <Modal.Body style={{ backgroundColor: '#f8f9fa', padding: 20 }}>
                    <Container>
                        {/* Withdrawal & User Info */}
                        <div className="mb-4 p-3 border rounded" style={{ backgroundColor: '#fff' }}>
                            <h5 className="mb-3">Withdrawal & User Information</h5>
                            <Row>
                                <Col md={6}>
                                    <p className="mb-2"><strong>User:</strong> {user?.firstName} {user?.lastName}</p>
                                    <p className="mb-2"><strong>Email:</strong> {user?.email}</p>
                                    <p className="mb-2"><strong>Mobile:</strong> {user?.mobile || 'N/A'}</p>
                                    <p className="mb-2"><strong>Reason:</strong> {reason}</p>
                                    <p className="mb-2"><strong>Comment:</strong> {comment}</p>
                                </Col>
                                <Col md={6}>
                                    <p className="mb-2">
                                        <strong>Status:</strong>
                                        <Badge bg={getWithdrawalStatusBadge(status)} className="ml-2">
                                            {status}
                                        </Badge>
                                    </p>
                                    <p className="mb-2"><strong>Requested At:</strong> {new Date(request_at).toLocaleString()}</p>
                                    <p className="mb-2"><strong>Reviewed At:</strong> {reviewed_at ? new Date(reviewed_at).toLocaleString() : 'Pending'}</p>
                                    <p className="mb-2"><strong>Order No:</strong> {order?.orderNo}</p>
                                    <p className="mb-2"><strong>Payment Method:</strong> {order?.paymentMethod}</p>
                                    <p className="mb-2"><strong>Total Price:</strong> ${parseFloat(order?.price).toFixed(2)}</p>
                                </Col>
                            </Row>
                        </div>

                        {/* Attached Document */}
                        {document && (
                            <div className="mb-4 p-3 border rounded" style={{ backgroundColor: '#fff' }}>
                                <h5 className="mb-3">Attached Document</h5>
                                <hr />
                                {document.endsWith('.pdf') ? (
                                    <embed
                                        src={`${API_URL}/${document}`}
                                        type="application/pdf"
                                        width="100%"
                                        height="600px"
                                    />
                                ) : (
                                    <img
                                        src={`${API_URL}/${document}`}
                                        alt="Withdrawal Document"
                                        style={{ maxWidth: '100%', borderRadius: '8px' }}
                                    />
                                )}
                            </div>
                        )}

                        {/* Event Details */}
                        <div className="mb-4">
                            <h5 className="mb-3">Event Details <Badge bg="info">{order?.orderItems?.length || 0}</Badge></h5>
                            {renderOrderItems()}
                        </div>
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
                            const currentEvent = order?.orderItems[currentEventIndex]?.event;
                            const images = currentEvent?.images || [];
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
                    {(() => {
                        const currentEvent = order?.orderItems[currentEventIndex]?.event;
                        const images = currentEvent?.images || [];
                        return images.length > 1 && (
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
                        );
                    })()}
                    
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
                        {(() => {
                            const currentEvent = order?.orderItems[currentEventIndex]?.event;
                            const images = currentEvent?.images || [];
                            return `${currentImageIndex + 1} / ${images.length}`;
                        })()}
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
                            src={(() => {
                                const currentEvent = order?.orderItems[currentEventIndex]?.event;
                                const images = currentEvent?.images || [];
                                return getImageSrc(images[currentImageIndex]);
                            })()}
                            alt={`Event Image ${currentImageIndex + 1}`}
                            style={{ 
                                maxWidth: '100%', 
                                maxHeight: '100%', 
                                objectFit: 'contain',
                                borderRadius: '8px'
                            }}
                            onError={(e) => {
                                console.error('Modal image failed to load');
                                e.target.style.display = 'none';
                            }}
                        />
                    </div>
                </Modal.Body>
            </Modal>
        </>
    );
}

export default ViewWithdrawalModal;
