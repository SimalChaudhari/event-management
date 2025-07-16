import React, { useState } from 'react';
import { Modal, Button, Row, Col, Card, Container, Badge, Nav, Tab } from 'react-bootstrap';
import { API_URL } from '../../../configs/env';
import '../../../assets/css/speakers.css';
import DateTimeFormatter from '../../../components/dateTime/DateTimeFormatter';

function ViewWithdrawalModal({ show, handleClose, withdrawalData }) {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [showImageModal, setShowImageModal] = useState(false);
    const [currentEventIndex, setCurrentEventIndex] = useState(0);
    const [showSpeakerImageModal, setShowSpeakerImageModal] = useState(false);
    const [currentSpeakerImage, setCurrentSpeakerImage] = useState('');

    if (!withdrawalData) return null;

    const { reason, comment, status, request_at, reviewed_at, document, order } = withdrawalData;
    const user = order?.user;

    // Speaker image zoom function
    const handleSpeakerImageClick = (speakerProfile) => {
        if (speakerProfile) {
            setCurrentSpeakerImage(speakerProfile);
            setShowSpeakerImageModal(true);
        } else {
            setShowSpeakerImageModal(false);
        }
    };

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

    // Render withdrawal statistics
    const renderWithdrawalStats = () => {
        return (
            <Row>
                <Col xs={12} md={4} lg={3} className="mb-3">
                    <div
                        className="text-center p-3"
                        style={{
                            backgroundColor: '#f8f9fa',
                            borderRadius: '8px',
                            border: '1px solid #e9ecef',
                            padding: '20px'
                        }}
                    >
                        <i className="fas fa-money-bill-wave text-primary mb-2" style={{ fontSize: '1.5rem' }}></i>
                        <h6 className="mb-1" style={{ color: '#495057', fontSize: '0.9rem' }}>
                            Request Amount
                        </h6>
                        <p className="mb-0" style={{ fontSize: '0.95rem', fontWeight: '500', color: '#28a745' }}>
                            ${parseFloat(order?.price).toFixed(2)}
                        </p>
                    </div>
                </Col>
                <Col xs={12} md={4} lg={3} className="mb-3">
                    <div
                        className="text-center p-3"
                        style={{
                            backgroundColor: '#f8f9fa',
                            borderRadius: '8px',
                            border: '1px solid #e9ecef',
                            padding: '20px'
                        }}
                    >
                        <i className="fas fa-calendar text-primary mb-2" style={{ fontSize: '1.5rem' }}></i>
                        <h6 className="mb-1" style={{ color: '#495057', fontSize: '0.9rem' }}>
                            Request Date
                        </h6>
                        <p className="mb-0" style={{ fontSize: '0.95rem', fontWeight: '500' }}>
                            <DateTimeFormatter 
                                date={request_at} 
                                // time={request_at}
                                showDay={true}
                            />
                        </p>
                    </div>
                </Col>
                <Col xs={12} md={4} lg={3} className="mb-3">
                    <div
                        className="text-center p-3"
                        style={{
                            backgroundColor: '#f8f9fa',
                            borderRadius: '8px',
                            border: '1px solid #e9ecef',
                            padding: '20px'
                        }}
                    >
                        <i className="fas fa-shopping-cart text-primary mb-2" style={{ fontSize: '1.5rem' }}></i>
                        <h6 className="mb-1" style={{ color: '#495057', fontSize: '0.9rem' }}>
                            Order Items
                        </h6>
                        <p className="mb-0" style={{ fontSize: '0.95rem', fontWeight: '500' }}>
                            {order?.orderItems?.length || 0}
                        </p>
                    </div>
                </Col>
                <Col xs={12} md={4} lg={3} className="mb-3">
                    <div
                        className="text-center p-3"
                        style={{
                            backgroundColor: '#f8f9fa',
                            borderRadius: '8px',
                            border: '1px solid #e9ecef',
                            padding: '20px'
                        }}
                    >
                        <i className="fas fa-credit-card text-primary mb-2" style={{ fontSize: '1.5rem' }}></i>
                        <h6 className="mb-1" style={{ color: '#495057', fontSize: '0.9rem' }}>
                            Payment Method
                        </h6>
                        <p className="mb-0" style={{ fontSize: '0.95rem', fontWeight: '500' }}>
                            {order?.paymentMethod || 'N/A'}
                        </p>
                    </div>
                </Col>
            </Row>
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
        const currentEvent = order?.orderItems[currentEventIndex]?.event;
        const images = currentEvent?.images || [];
        setCurrentImageIndex((prevIndex) => (prevIndex === 0 ? images.length - 1 : prevIndex - 1));
    };

    const goToNextImage = () => {
        const currentEvent = order?.orderItems[currentEventIndex]?.event;
        const images = currentEvent?.images || [];
        setCurrentImageIndex((prevIndex) => (prevIndex === images.length - 1 ? 0 : prevIndex + 1));
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
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                    gap: '10px',
                    marginTop: '10px'
                }}
            >
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

    // Render documents for an event
    const renderDocuments = (event) => {
        const documents = event?.documents || [];
        if (!documents || documents.length === 0) {
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
                                <i className="fas fa-file-pdf text-danger" style={{ fontSize: '1.5rem' }}></i>
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
                                <div style={{ fontSize: '12px', color: '#666' }}>Document {index + 1}</div>
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

    // Render categories for an event
    const renderCategories = (event) => {
        if (!event?.categories?.length) {
            return <p>No categories listed.</p>;
        }

        return (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {event.categories.map((category, index) => (
                    <Badge
                        bg="success"
                        key={category.id}
                        style={{
                            fontSize: '14px',
                            padding: '8px 16px',
                            borderRadius: '20px',
                            backgroundColor: '#FFF'
                        }}
                    >
                        {index + 1}. {category.name}
                    </Badge>
                ))}
            </div>
        );
    };

    // Render speakers for an event
    const renderSpeakers = (event) => {
        if (!event?.speakers?.length) {
            return <p>No speakers listed.</p>;
        }

        return (
            <div className="speakers-grid">
                {event.speakers.map((speaker) => (
                    <div key={speaker.id} className="speaker-card">
                        <div className="speaker-header">
                            <div className="speaker-image" onClick={() => handleSpeakerImageClick(speaker.speakerProfile)}>
                                <img
                                    src={speaker.speakerProfile ? `${API_URL}/${speaker.speakerProfile}` : '/dummy-user.jpg'}
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

    // Simple Event Details Cards with better spacing
    const renderEventDetailsCards = (event) => {
        return (
            <Row className="mb-4">
                {/* Basic Info Cards */}
                <Col md={4} className="mb-3">
                    <div
                        style={{
                            backgroundColor: '#f8f9fa',
                            padding: '15px',
                            borderRadius: '8px',
                            border: '1px solid #e9ecef',
                            height: '100%'
                        }}
                    >
                        <div className="d-flex align-items-center mb-2">
                            <i className="fas fa-calendar me-3" style={{ fontSize: '16px', marginRight: '10px', color: '#6c757d' }}></i>
                            <h6 className="mb-0" style={{ fontSize: '14px', fontWeight: '600', color: '#495057' }}>
                                Schedule
                            </h6>
                        </div>
                        <p className="mb-0" style={{ fontSize: '13px', color: '#6c757d' }}>
                            {new Date(event.startDate).toLocaleDateString('en-GB')} {formatTime(event.startTime)}
                        </p>
                    </div>
                </Col>

                <Col md={4} className="mb-3">
                    <div
                        style={{
                            backgroundColor: '#f8f9fa',
                            padding: '15px',
                            borderRadius: '8px',
                            border: '1px solid #e9ecef',
                            height: '100%'
                        }}
                    >
                        <div className="d-flex align-items-center mb-2">
                            <i
                                className="fas fa-map-marker-alt me-3"
                                style={{ fontSize: '16px', marginRight: '10px', color: '#6c757d' }}
                            ></i>
                            <h6 className="mb-0" style={{ fontSize: '14px', fontWeight: '600', color: '#495057' }}>
                                Location
                            </h6>
                        </div>
                        <p className="mb-0" style={{ fontSize: '13px', color: '#6c757d' }}>
                            {event.location || 'N/A'}
                        </p>
                    </div>
                </Col>

                <Col md={4} className="mb-3">
                    <div
                        style={{
                            backgroundColor: '#f8f9fa',
                            padding: '15px',
                            borderRadius: '8px',
                            border: '1px solid #e9ecef',
                            height: '100%'
                        }}
                    >
                        <div className="d-flex align-items-center mb-2">
                            <i className="fas fa-dollar-sign me-3" style={{ fontSize: '16px', marginRight: '10px', color: '#6c757d' }}></i>
                            <h6 className="mb-0" style={{ fontSize: '14px', fontWeight: '600', color: '#495057' }}>
                                Price
                            </h6>
                        </div>
                        <p className="mb-0" style={{ fontSize: '13px', fontWeight: '600', color: '#28a745' }}>
                            {event.price} {event.currency}
                        </p>
                    </div>
                </Col>

                {/* Description Card - Full Width */}
                <Col md={12} className="mb-3">
                    <div
                        style={{
                            backgroundColor: '#f8f9fa',
                            padding: '15px',
                            borderRadius: '8px',
                            border: '1px solid #e9ecef'
                        }}
                    >
                        <div className="d-flex align-items-center mb-2">
                            <i className="fas fa-info-circle me-3" style={{ fontSize: '16px', marginRight: '10px', color: '#6c757d' }}></i>
                            <h6 className="mb-0" style={{ fontSize: '14px', fontWeight: '600', color: '#495057' }}>
                                Description
                            </h6>
                        </div>
                        <p className="mb-0" style={{ fontSize: '13px', lineHeight: '1.4', color: '#6c757d' }}>
                            {event.description}
                        </p>
                    </div>
                </Col>
            </Row>
        );
    };

    const renderOrderItems = () => {
        if (!order?.orderItems?.length) {
            return <p>No events in this order.</p>;
        }

        return order.orderItems.map(({ id, event }, index) => {
            return (
                <div
                    key={id}
                    className="mb-4 p-4 border rounded"
                    style={{
                        backgroundColor: '#fff',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                        borderRadius: '12px'
                    }}
                >
                    {/* Event Header */}
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <div className="d-flex align-items-center">
                            <div
                                className="me-3"
                                style={{
                                    width: '50px',
                                    height: '50px',
                                    backgroundColor: '#4680ff',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'white',
                                    fontWeight: 'bold',
                                    fontSize: '18px',
                                    marginRight: '10px'
                                }}
                            >
                                {index + 1}
                            </div>
                            <div>
                                <h5 className="mb-1" style={{ color: '#2c3e50', fontWeight: '600' }}>
                                    {event.name}
                                </h5>
                                <div className="d-flex align-items-center gap-2">
                                    <Badge bg="success" style={{ fontSize: '12px' }}>
                                        {event.type}
                                    </Badge>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Simple Event Details */}
                    <div className="mb-4">{renderEventDetailsCards(event)}</div>

                    {/* Event Tabs */}
                    <div className="mb-3">
                        <Tab.Container id={`event-tabs-${index}`} defaultActiveKey="categories">
                            <Row>
                                <Col sm={12}>
                                    <Nav
                                        variant="tabs"
                                        className="mb-3"
                                        style={{
                                            borderBottom: '2px solid #e9ecef',
                                            backgroundColor: '#f8f9fa',
                                            borderRadius: '8px 8px 0 0'
                                        }}
                                    >
                                        <Nav.Item>
                                            <Nav.Link
                                                eventKey="categories"
                                                style={{
                                                    border: 'none',
                                                    borderRadius: '8px 8px 0 0',
                                                    fontWeight: '500'
                                                }}
                                            >
                                                <i className="fas fa-tags me-2" style={{ color: '#4680ff', marginRight: '8px' }}></i>
                                                Categories{' '}
                                                <Badge bg="info" style={{ fontSize: '10px', marginLeft: '8px' }}>
                                                    {event.categories?.length || 0}
                                                </Badge>
                                            </Nav.Link>
                                        </Nav.Item>

                                        <Nav.Item>
                                            <Nav.Link
                                                eventKey="speakers"
                                                style={{
                                                    border: 'none',
                                                    borderRadius: '8px 8px 0 0',
                                                    fontWeight: '500'
                                                }}
                                            >
                                                <i className="fas fa-microphone me-2" style={{ color: '#4680ff', marginRight: '8px' }}></i>
                                                Speakers{' '}
                                                <Badge bg="info" style={{ fontSize: '10px', marginLeft: '8px' }}>
                                                    {event.speakers?.length || 0}
                                                </Badge>
                                            </Nav.Link>
                                        </Nav.Item>

                                        <Nav.Item>
                                            <Nav.Link
                                                eventKey="media"
                                                style={{
                                                    border: 'none',
                                                    borderRadius: '8px 8px 0 0',
                                                    fontWeight: '500'
                                                }}
                                            >
                                                <i className="fas fa-images me-2" style={{ color: '#4680ff', marginRight: '8px' }}></i>
                                                Media{' '}
                                                <Badge bg="info" style={{ fontSize: '10px', marginLeft: '8px' }}>
                                                    {(event.images?.length || 0) + (event.documents?.length || 0)}
                                                </Badge>
                                            </Nav.Link>
                                        </Nav.Item>
                                    </Nav>
                                </Col>
                            </Row>

                            <Tab.Content
                                style={{
                                    backgroundColor: '#fff',
                                    border: '1px solid #e9ecef',
                                    borderTop: 'none',
                                    borderRadius: '0 0 8px 8px',
                                    padding: '20px'
                                }}
                            >
                                {/* Speakers Tab */}
                                <Tab.Pane eventKey="speakers">
                                    <div>
                                        <h6 className="mb-3" style={{ color: '#495057', fontWeight: '600' }}>
                                            <i className="fas fa-microphone me-2" style={{ color: '#4680ff', marginRight: '8px' }}></i>
                                            Event Speakers{' '}
                                            <Badge bg="info" style={{ fontSize: '10px', marginLeft: '8px' }}>
                                                {event.speakers?.length || 0}
                                            </Badge>
                                        </h6>
                                        <hr />
                                        {renderSpeakers(event)}
                                    </div>
                                </Tab.Pane>

                                {/* Categories Tab */}
                                <Tab.Pane eventKey="categories">
                                    <div>{renderCategories(event)}</div>
                                </Tab.Pane>

                                {/* Media Tab */}
                                <Tab.Pane eventKey="media">
                                    <div>
                                        <Row>
                                            <Col md={6}>
                                                <h6 className="mb-3" style={{ color: '#495057', fontWeight: '600' }}>
                                                    <i className="fas fa-images me-2" style={{ color: '#4680ff', marginRight: '8px' }}></i>
                                                    Event Images{' '}
                                                    <Badge bg="info" style={{ fontSize: '10px', marginLeft: '8px' }}>
                                                        {event.images?.length || 0}
                                                    </Badge>
                                                </h6>
                                                <hr />
                                                {renderImageGrid(event)}
                                            </Col>
                                            <Col md={6} className="section-speakers">
                                                <h6 className="mb-3" style={{ color: '#495057', fontWeight: '600' }}>
                                                    <i
                                                        className="fas fa-file-alt me-2"
                                                        style={{ color: '#4680ff', marginRight: '8px' }}
                                                    ></i>
                                                    Event Documents{' '}
                                                    <Badge bg="info" style={{ fontSize: '10px', marginLeft: '8px' }}>
                                                        {event.documents?.length || 0}
                                                    </Badge>
                                                </h6>
                                                <hr />
                                                {renderDocuments(event)}
                                            </Col>
                                        </Row>
                                    </div>
                                </Tab.Pane>
                            </Tab.Content>
                        </Tab.Container>
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
                    <div className="lg:container-fluid">
                        {/* Withdrawal Statistics */}
                        <div
                            className="mb-3"
                            style={{
                                backgroundColor: '#fff',
                                borderRadius: '8px',
                                padding: '20px',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                            }}
                        >
                            <h5>Withdrawal Statistics</h5>
                            <hr />
                            {renderWithdrawalStats()}
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
                            <Tab.Container id="withdrawal-tabs" defaultActiveKey="customer">
                                <Row>
                                    <Col sm={12}>
                                        <Nav variant="tabs" className="mb-3">
                                            <Nav.Item>
                                                <Nav.Link eventKey="customer">
                                                    <i className="fas fa-user me-2" style={{ color: '#4680ff', marginRight: '8px' }}></i>
                                                    Customer Info
                                                </Nav.Link>
                                            </Nav.Item>
                                            <Nav.Item>
                                                <Nav.Link eventKey="withdrawal">
                                                    <i
                                                        className="fas fa-money-bill-wave me-2"
                                                        style={{ color: '#4680ff', marginRight: '8px' }}
                                                    ></i>
                                                    Withdrawal Details
                                                </Nav.Link>
                                            </Nav.Item>
                                            <Nav.Item>
                                                <Nav.Link eventKey="events">
                                                    <i
                                                        className="fas fa-calendar me-2"
                                                        style={{ color: '#4680ff', marginRight: '8px' }}
                                                    ></i>
                                                    Events
                                                </Nav.Link>
                                            </Nav.Item>
                                        </Nav>
                                    </Col>
                                </Row>

                                <Tab.Content>
                                    {/* Customer Info Tab */}
                                    <Tab.Pane eventKey="customer">
                                        <div className="p-3" style={{ padding: '10px' }}>
                                            <h5>Customer Information</h5>
                                            <hr />
                                            <Row>
                                                <Col md={6}>
                                                    <p>
                                                        <strong>Customer Name:</strong> {user?.firstName} {user?.lastName}
                                                    </p>
                                                    <p>
                                                        <strong>Email:</strong> {user?.email}
                                                    </p>
                                                    <p>
                                                        <strong>Mobile:</strong> {user?.mobile || 'N/A'}
                                                    </p>
                                                </Col>
                                                <Col md={6}>
                                                    <p>
                                                        <strong>Request Date:</strong> {new Date(request_at).toLocaleDateString('en-GB')}
                                                    </p>
                                                    <p>
                                                        <strong>Request Time:</strong> {new Date(request_at).toLocaleTimeString('en-GB')}
                                                    </p>
                                                    <p>
                                                        <strong>Customer ID:</strong> {user?.id}
                                                    </p>
                                                </Col>
                                            </Row>
                                        </div>
                                    </Tab.Pane>

                                    {/* Withdrawal Details Tab */}
                                    <Tab.Pane eventKey="withdrawal">
                                        <div className="p-3" style={{ padding: '20px' }}>
                                            <h5>Withdrawal Information</h5>
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
                                                        <i className="fas fa-hashtag text-primary mb-2" style={{ fontSize: '1.5rem' }}></i>
                                                        <h6 className="mb-1" style={{ color: '#495057', fontSize: '0.9rem' }}>
                                                            Order Number
                                                        </h6>
                                                        <p className="mb-0" style={{ fontSize: '0.95rem', fontWeight: '500' }}>
                                                            {order?.orderNo}
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
                                                            className="fas fa-info-circle text-primary mb-2"
                                                            style={{ fontSize: '1.5rem' }}
                                                        ></i>
                                                        <h6 className="mb-1" style={{ color: '#495057', fontSize: '0.9rem' }}>
                                                            Status
                                                        </h6>
                                                        <p className="mb-0" style={{ fontSize: '0.95rem', fontWeight: '500' }}>
                                                            <Badge bg={getWithdrawalStatusBadge(status)}>{status}</Badge>
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
                                                            className="fas fa-credit-card text-primary mb-2"
                                                            style={{ fontSize: '1.5rem' }}
                                                        ></i>
                                                        <h6 className="mb-1" style={{ color: '#495057', fontSize: '0.9rem' }}>
                                                            Payment Method
                                                        </h6>
                                                        <p className="mb-0" style={{ fontSize: '0.95rem', fontWeight: '500' }}>
                                                            {order?.paymentMethod || 'N/A'}
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
                                                            Request Amount
                                                        </h6>
                                                        <p
                                                            className="mb-0"
                                                            style={{ fontSize: '0.95rem', fontWeight: '500', color: '#28a745' }}
                                                        >
                                                            ${parseFloat(order?.price).toFixed(2)}
                                                        </p>
                                                    </div>
                                                </Col>
                                            </Row>

                                            {/* Reason and Comment Section */}
                                            <Row className="mt-4">
                                                <Col md={6}>
                                                    <div
                                                        style={{
                                                            backgroundColor: '#f8f9fa',
                                                            padding: '20px',
                                                            borderRadius: '8px',
                                                            border: '1px solid #e9ecef'
                                                        }}
                                                    >
                                                        <h6 className="mb-3" style={{ color: '#495057', fontWeight: '600' }}>
                                                            <i
                                                                className="fas fa-question-circle me-2"
                                                                style={{ color: '#4680ff', marginRight: '8px' }}
                                                            ></i>
                                                            Withdrawal Reason
                                                        </h6>
                                                        <p className="mb-0" style={{ fontSize: '14px', color: '#6c757d' }}>
                                                            {reason}
                                                        </p>
                                                    </div>
                                                </Col>
                                                <Col md={6}>
                                                    <div
                                                        style={{
                                                            backgroundColor: '#f8f9fa',
                                                            padding: '20px',
                                                            borderRadius: '8px',
                                                            border: '1px solid #e9ecef'
                                                        }}
                                                    >
                                                        <h6 className="mb-3" style={{ color: '#495057', fontWeight: '600' }}>
                                                            <i
                                                                className="fas fa-comment me-2"
                                                                style={{ color: '#4680ff', marginRight: '8px' }}
                                                            ></i>
                                                            Additional Comment
                                                        </h6>
                                                        <p className="mb-0" style={{ fontSize: '14px', color: '#6c757d' }}>
                                                            {comment || 'No additional comment provided.'}
                                                        </p>
                                                    </div>
                                                </Col>
                                            </Row>

                                            {/* Timeline Section */}
                                            <Row className="mt-4">
                                                <Col md={12}>
                                                    <div
                                                        style={{
                                                            backgroundColor: '#f8f9fa',
                                                            padding: '20px',
                                                            borderRadius: '8px',
                                                            border: '1px solid #e9ecef'
                                                        }}
                                                    >
                                                        <h6 className="mb-3" style={{ color: '#495057', fontWeight: '600' }}>
                                                            <i
                                                                className="fas fa-clock me-2"
                                                                style={{ color: '#4680ff', marginRight: '8px' }}
                                                            ></i>
                                                            Request Timeline
                                                        </h6>
                                                        <div className="d-flex justify-content-between align-items-center">
                                                            <div>
                                                                <strong>Requested At:</strong> 
                                                                <DateTimeFormatter 
                                                                    date={request_at} 
                                                                    time={request_at}
                                                                    showDay={true}
                                                                />
                                                            </div>
                                                            <div>
                                                                <strong>Reviewed At:</strong>{' '}
                                                                {reviewed_at ? (
                                                                    <DateTimeFormatter
                                                                        date={reviewed_at}
                                                                        time={reviewed_at}
                                                                        showDay={true}
                                                                    />
                                                                ) : (
                                                                    'Pending'
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </Col>
                                            </Row>
                                        </div>
                                    </Tab.Pane>

                                    {/* Events Tab */}
                                    <Tab.Pane eventKey="events">
                                        <div className="p-3">
                                            <h5>
                                                Ordered Events <Badge bg="info">{order?.orderItems?.length || 0}</Badge>
                                            </h5>
                                            <hr />
                                            {renderOrderItems()}
                                        </div>
                                    </Tab.Pane>
                                </Tab.Content>
                            </Tab.Container>
                        </div>

                        {/* Attached Document */}
                        {document && (
                            <div
                                className="mb-4"
                                style={{
                                    backgroundColor: '#fff',
                                    borderRadius: '8px',
                                    padding: '20px',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                }}
                            >
                                <h5 className="mb-3">Attached Document</h5>
                                <hr />
                                {document.endsWith('.pdf') ? (
                                    <embed src={`${API_URL}/${document}`} type="application/pdf" width="100%" height="600px" />
                                ) : (
                                    <img
                                        src={`${API_URL}/${document}`}
                                        alt="Withdrawal Document"
                                        style={{ maxWidth: '100%', borderRadius: '8px' }}
                                    />
                                )}
                            </div>
                        )}
                    </div>
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
                        return (
                            images.length > 1 && (
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
                            )
                        );
                    })()}

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
                        {(() => {
                            const currentEvent = order?.orderItems[currentEventIndex]?.event;
                            const images = currentEvent?.images || [];
                            return `${currentImageIndex + 1} / ${images.length}`;
                        })()}
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
