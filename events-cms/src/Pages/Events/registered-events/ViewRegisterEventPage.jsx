import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Row, Col, Card, Badge, Nav, Tab, Container, Modal } from 'react-bootstrap';
import { useDispatch } from 'react-redux';
import { registerEventById } from '../../../store/actions/eventActions';
import { API_URL, DUMMY_PATH_USER } from '../../../configs/env';
import DateTimeFormatter from '../../../components/dateTime/DateTimeFormatter';
import { EVENT_PATHS } from '../../../utils/constants';
import EventBasicComponent from '../../../components/events/EventBasicComponent';
import EventLocationComponent from '../../../components/events/EventLocationComponent';
import EventSpeakersComponent from '../../../components/events/EventSpeakersComponent';
import ImageModalComponent from '../../../components/events/ImageModalComponent';
import EventImageGridComponent from '../../../components/events/EventImageGridComponent';
import EventDocumentsComponent from '../../../components/events/EventDocumentsComponent';
import EventFloorPlanComponent from '../../../components/events/EventFloorPlanComponent';
import EventGalleriesComponent from '../../../components/events/EventGalleriesComponent';
import EventStampsComponent from '../../../components/events/EventStampsComponent';
import EventSurveyComponent from '../../../components/events/EventSurveyComponent';
import EventExhibitorsComponent from '../../../components/events/EventExhibitorsComponent';

// Google Maps API Key
const GOOGLE_API_KEY = 'AIzaSyAh43XIafkwl_7xaqeES90e8FQWqhN4DEc';

// Google Maps Component
const GoogleMap = ({ latitude, longitude, eventName, location }) => {
    const [mapLoaded, setMapLoaded] = useState(false);

    useEffect(() => {
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_API_KEY}&libraries=places`;
        script.async = true;
        script.defer = true;
        script.onload = () => setMapLoaded(true);
        document.head.appendChild(script);

        return () => {
            if (document.head.contains(script)) {
                document.head.removeChild(script);
            }
        };
    }, []);

    useEffect(() => {
        if (mapLoaded && latitude && longitude) {
            const map = new window.google.maps.Map(document.getElementById('map'), {
                center: { lat: parseFloat(latitude), lng: parseFloat(longitude) },
                zoom: 15,
                mapTypeId: window.google.maps.MapTypeId.ROADMAP
            });

            new window.google.maps.Marker({
                position: { lat: parseFloat(latitude), lng: parseFloat(longitude) },
                map: map,
                title: eventName || 'Event Location',
                animation: window.google.maps.Animation.DROP
            });
        }
    }, [mapLoaded, latitude, longitude, eventName, location]);

    if (!latitude || !longitude) {
        return (
            <div
                style={{
                    height: '300px',
                    backgroundColor: '#f8f9fa',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '8px',
                    border: '1px solid #e9ecef'
                }}
            >
                <div className="text-center">
                    <i className="fas fa-map-marker-alt text-muted" style={{ fontSize: '3rem', marginBottom: '10px' }}></i>
                    <p className="text-muted mb-0">No coordinates available</p>
                </div>
            </div>
        );
    }

    return (
        <div id="map" style={{ height: '300px', width: '100%', borderRadius: '8px', border: '1px solid #e9ecef', overflow: 'hidden' }}>
            {!mapLoaded && (
                <div
                    style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8f9fa' }}
                >
                    <div className="text-center">
                        <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">Loading...</span>
                        </div>
                        <p className="mt-2 mb-0 text-muted">Loading map...</p>
                    </div>
                </div>
            )}
        </div>
    );
};

const ViewRegisterEventPage = () => {
    const { id } = useParams();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [eventData, setEventData] = useState(null);
    console.log(eventData, 'eventData');
    const [loading, setLoading] = useState(true);

    // For image modals
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [showImageModal, setShowImageModal] = useState(false);
    const [showSpeakerImageModal, setShowSpeakerImageModal] = useState(false);
    const [currentSpeakerImage, setCurrentSpeakerImage] = useState('');
    const [showEventMainImageModal, setShowEventMainImageModal] = useState(false);
    const [currentEventMainImage, setCurrentEventMainImage] = useState('');

    // Gallery modal states
    const [showGalleryImageModal, setShowGalleryImageModal] = useState(false);
    const [currentGalleryImageIndex, setCurrentGalleryImageIndex] = useState(0);
    const [galleryImages, setGalleryImages] = useState([]);
    const [currentGalleryTitle, setCurrentGalleryTitle] = useState('');

    // Event stamps modal states
    const [showStampImageModal, setShowStampImageModal] = useState(false);
    const [currentStampImageIndex, setCurrentStampImageIndex] = useState(0);
    const [stampImages, setStampImages] = useState([]);

    useEffect(() => {
        const loadRegisterEventData = async () => {
            try {
                const response = await dispatch(registerEventById(id));
                if (response) {
                    setEventData(response.data);
                }
                setLoading(false);
            } catch (error) {
                console.error('Error loading register event data:', error);
                setLoading(false);
            }
        };

        if (id) {
            loadRegisterEventData();
        }
    }, [id, dispatch]);

    if (loading) return <div>Loading...</div>;
    if (!eventData) return <div>No register event found.</div>;

    const regDate = new Date(eventData.createdAt).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

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
        if (!eventData?.event?.categories?.length) {
            return <p>No categories listed.</p>;
        }

        return (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {eventData.event.categories.map((category, index) => (
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
                            {eventData.event?.attendanceCount || 0}
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
                            {eventData.event?.speakers?.length || 0}
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
                            {eventData.event?.images?.length || 0}
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
                            {eventData.event?.documents?.length || 0}
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
        setCurrentImageIndex((prevIndex) => (prevIndex === 0 ? eventData.event.images.length - 1 : prevIndex - 1));
    };

    const goToNextImage = () => {
        setCurrentImageIndex((prevIndex) => (prevIndex === eventData.event.images.length - 1 ? 0 : prevIndex + 1));
    };

    const handleImageClick = (index) => {
        setCurrentImageIndex(index);
        setShowImageModal(true);
    };

    // Render galleries
    const renderGalleries = () => {
        if (!eventData?.event?.galleries?.length) {
            return <p>No galleries available.</p>;
        }

        return (
            <div>
                {eventData.event.galleries.map((gallery, galleryIndex) => (
                    <div key={gallery.id} className="mb-4">
                        <h5>
                            {gallery.title} <Badge bg="info">{gallery.galleryImages?.length || 0}</Badge>
                        </h5>
                        <hr />
                        <div
                            style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                                gap: '10px',
                                marginTop: '10px'
                            }}
                        >
                            {gallery.galleryImages?.map((image, index) => {
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
                                        onClick={() => handleGalleryImageClick(gallery.galleryImages, gallery.title, index)}
                                    >
                                        <img
                                            src={imageSrc}
                                            alt={`Gallery ${galleryIndex + 1} - Image ${index + 1}`}
                                            style={{ width: '100%', height: '150px', objectFit: 'cover' }}
                                            onError={(e) => {
                                                console.error('Gallery image failed to load:', imageSrc);
                                                e.target.style.display = 'none';
                                            }}
                                        />
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
                    </div>
                ))}
            </div>
        );
    };

    // Render exhibitors
    const renderExhibitors = () => {
        if (!eventData?.event?.exhibitorsData?.exhibitors?.length) {
            return <p>No exhibitors available.</p>;
        }

        return (
            <div>
                {eventData.event.exhibitorsData.exhibitorDescription && (
                    <div className="mb-4">
                        <h6>Exhibitor Description</h6>
                        <p style={{ textAlign: 'justify', lineHeight: '1.6' }}>{eventData.event.exhibitorsData.exhibitorDescription}</p>
                        <hr />
                    </div>
                )}

                <div className="exhibitors-grid">
                    {eventData.event.exhibitorsData.exhibitors.map((exhibitor) => (
                        <div key={exhibitor.id} className="exhibitor-card mb-4">
                            <div className="exhibitor-header">
                                <h6 className="exhibitor-name">{exhibitor.name}</h6>
                                <p className="exhibitor-company">{exhibitor.companyName}</p>
                            </div>

                            <div className="exhibitor-info">
                                {exhibitor.companyDescription && <p className="exhibitor-description">{exhibitor.companyDescription}</p>}

                                <div className="exhibitor-contact">
                                    {exhibitor.email && (
                                        <div className="contact-item">
                                            <i className="fas fa-envelope"></i>
                                            <span>{exhibitor.email}</span>
                                        </div>
                                    )}

                                    {exhibitor.mobile && (
                                        <div className="contact-item">
                                            <i className="fas fa-mobile"></i>
                                            <span>{exhibitor.mobile}</span>
                                        </div>
                                    )}

                                    {exhibitor.address && (
                                        <div className="contact-item">
                                            <i className="fas fa-map-marker-alt"></i>
                                            <span>{exhibitor.address}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Exhibitor Images */}
                                {exhibitor.eventImages?.length > 0 && (
                                    <div className="mt-3">
                                        <h6>Event Images</h6>
                                        <div
                                            style={{
                                                display: 'grid',
                                                gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
                                                gap: '8px'
                                            }}
                                        >
                                            {exhibitor.eventImages.map((image, index) => (
                                                <img
                                                    key={index}
                                                    src={getImageSrc(image)}
                                                    alt={`Exhibitor ${index + 1}`}
                                                    style={{ width: '100%', height: '80px', objectFit: 'cover', borderRadius: '4px' }}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Promotional Offers */}
                                {exhibitor.promotionalOffers?.length > 0 && (
                                    <div className="mt-3">
                                        <h6>Promotional Offers</h6>
                                        {exhibitor.promotionalOffers.map((offer) => (
                                            <div key={offer.id} className="offer-card mb-2">
                                                <div className="d-flex align-items-center">
                                                    {offer.image && (
                                                        <img
                                                            src={getImageSrc(offer.image)}
                                                            alt={offer.title}
                                                            style={{
                                                                width: '50px',
                                                                height: '50px',
                                                                objectFit: 'cover',
                                                                borderRadius: '4px',
                                                                marginRight: '10px'
                                                            }}
                                                        />
                                                    )}
                                                    <div>
                                                        <h6 className="mb-1">{offer.title}</h6>
                                                        <p className="mb-1 small">{offer.description}</p>
                                                        <small className="text-muted">
                                                            Valid until: {new Date(offer.validDate).toLocaleDateString()}
                                                        </small>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    // Render event stamps
    const renderEventStamps = () => {
        if (!eventData?.event?.eventStamps) {
            return <p>No event stamps available.</p>;
        }

        return (
            <div>
                <h5>Event Stamps</h5>
                <hr />

                {eventData.event.eventStamps.images?.length > 0 && (
                    <div>
                        <h6>Stamp Images</h6>
                        <div
                            style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                                gap: '10px',
                                marginTop: '10px'
                            }}
                        >
                            {eventData.event.eventStamps.images.map((image, index) => {
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
                                        onClick={() => handleStampImageClick(index)}
                                    >
                                        <img
                                            src={imageSrc}
                                            alt={`Event Stamp ${index + 1}`}
                                            style={{ width: '100%', height: '150px', objectFit: 'cover' }}
                                            onError={(e) => {
                                                console.error('Stamp image failed to load:', imageSrc);
                                                e.target.style.display = 'none';
                                            }}
                                        />
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
                    </div>
                )}

                {eventData.event.eventStamps.description && (
                    <div className="mb-3 mt-3">
                        <h6>Description</h6>
                        <p style={{ textAlign: 'justify', lineHeight: '1.6' }}> {eventData.event.eventStamps.description}</p>
                    </div>
                )}
            </div>
        );
    };

    // Gallery navigation functions
    const goToPreviousGalleryImage = () => {
        setCurrentGalleryImageIndex((prevIndex) => (prevIndex === 0 ? galleryImages.length - 1 : prevIndex - 1));
    };

    const goToNextGalleryImage = () => {
        setCurrentGalleryImageIndex((prevIndex) => (prevIndex === galleryImages.length - 1 ? 0 : prevIndex + 1));
    };

    // Handle gallery image click
    const handleGalleryImageClick = (galleryImages, galleryTitle, index) => {
        setGalleryImages(galleryImages);
        setCurrentGalleryTitle(galleryTitle);
        setCurrentGalleryImageIndex(index);
        setShowGalleryImageModal(true);
    };

    // Stamp navigation functions
    const goToPreviousStampImage = () => {
        setCurrentStampImageIndex((prevIndex) => (prevIndex === 0 ? stampImages.length - 1 : prevIndex - 1));
    };

    const goToNextStampImage = () => {
        setCurrentStampImageIndex((prevIndex) => (prevIndex === stampImages.length - 1 ? 0 : prevIndex + 1));
    };

    // Handle stamp image click
    const handleStampImageClick = (index) => {
        setStampImages(eventData.event.eventStamps.images);
        setCurrentStampImageIndex(index);
        setShowStampImageModal(true);
    };

    // Helper function to format time
    const formatTime = (timeStr) => {
        if (!timeStr) return '';
        const [hour, minute] = timeStr.split(':');
        const date = new Date();
        date.setHours(hour, minute);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    };

    return (
        <>
            <Container fluid className="mt-4">
                <div
                    className="mb-3"
                    style={{ backgroundColor: '#fff', borderRadius: '8px', padding: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
                >
                    <div className="d-flex justify-content-between align-items-center">
                        <h4 className="card-title">View</h4>
                        <Button variant="secondary" onClick={() => navigate(EVENT_PATHS.REGISTERED_EVENTS)}>
                            <i style={{ marginRight: '10px' }} className="fas fa-arrow-left me-2"></i>
                            Back
                        </Button>
                    </div>
                    <hr />
                    {renderEventStats()}
                </div>

                <div style={{ backgroundColor: '#fff', borderRadius: '8px', padding: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                    {/* Registration Info */}
                    <div
                        className="mb-3"
                        style={{
                            backgroundColor: '#f8f9fa',
                            borderRadius: '8px',
                            padding: '20px',
                            border: '1px solid #e9ecef'
                        }}
                    >
                        <h5>Registration Information</h5>
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
                                        style={{
                                            backgroundColor: eventData.type === 'exhibitor' ? 'rgb(162, 209, 231)' : 'rgb(223, 228, 165)',
                                            color: 'rgb(14, 13, 13)',
                                            fontWeight: '500'
                                        }}
                                    >
                                        {eventData.type || 'N/A'}
                                    </span>
                                </p>
                                <p className="mb-2">
                                    <strong>Registration Status:</strong>
                                    <Badge
                                        bg={
                                            eventData.status === 'Success'
                                                ? 'success'
                                                : eventData.status === 'Withdraw'
                                                ? 'danger'
                                                : 'warning'
                                        }
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
                    </div>

                    {/* Tabbed Content */}
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
                                            <i className="fas fa-map-marker-alt me-2" style={{ color: '#4680ff', marginRight: 6 }}></i>
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

                                    <Nav.Item>
                                        <Nav.Link eventKey="floorplan">
                                            <i className="fas fa-map me-2" style={{ color: '#4680ff', marginRight: 6 }}></i>
                                            Floor Plan
                                        </Nav.Link>
                                    </Nav.Item>

                                    <Nav.Item>
                                        <Nav.Link eventKey="gallery">
                                            <i className="fas fa-photo-video me-2" style={{ color: '#4680ff', marginRight: 6 }}></i>
                                            Gallery
                                        </Nav.Link>
                                    </Nav.Item>

                                    <Nav.Item>
                                        <Nav.Link eventKey="stamps">
                                            <i className="fas fa-stamp me-2" style={{ color: '#4680ff', marginRight: 6 }}></i>
                                            Event Stamps
                                        </Nav.Link>
                                    </Nav.Item>

                                    <Nav.Item>
                                        <Nav.Link eventKey="survey">
                                            <i className="fas fa-poll me-2" style={{ color: '#4680ff', marginRight: 6 }}></i>
                                            Survey
                                        </Nav.Link>
                                    </Nav.Item>

                                    <Nav.Item>
                                        <Nav.Link eventKey="exhibitors">
                                            <i className="fas fa-store me-2" style={{ color: '#4680ff', marginRight: 6 }}></i>
                                            Exhibitors
                                        </Nav.Link>
                                    </Nav.Item>
                                </Nav>
                            </Col>
                        </Row>

                        <Tab.Content>
                            {/* Details Tab */}
                            <Tab.Pane eventKey="details">
                                <EventBasicComponent eventData={eventData?.event} />
                            </Tab.Pane>

                            {/* Location & Pricing Tab */}
                            <Tab.Pane eventKey="location">
                                <EventLocationComponent eventData={eventData?.event} />
                            </Tab.Pane>

                            {/* Speakers Tab */}
                            <Tab.Pane eventKey="speakers">
                                <EventSpeakersComponent
                                    speakers={eventData?.event?.speakers}
                                    handleSpeakerImageClick={handleSpeakerImageClick}
                                />
                            </Tab.Pane>

                            {/* Media Tab */}
                            <Tab.Pane eventKey="media">
                                <div className="p-3" style={{ padding: '20px' }}>
                                    <Row>
                                        <Col md={6}>
                                            <h5>
                                                Event Images <Badge bg="info">{eventData?.event?.images?.length || 0}</Badge>
                                            </h5>
                                            <hr />
                                            <EventImageGridComponent
                                                images={eventData?.event?.images}
                                                getImageSrc={getImageSrc}
                                                handleEventImageClick={handleImageClick}
                                            />
                                        </Col>
                                        <Col md={6} className="section-speakers">
                                            <h5>
                                                Event Documents <Badge bg="info">{eventData?.event?.documents?.length || 0}</Badge>
                                            </h5>
                                            <hr />
                                            <EventDocumentsComponent documents={eventData?.event?.documents} />
                                        </Col>
                                    </Row>
                                </div>
                            </Tab.Pane>

                            {/* Floor Plan Tab */}
                            <Tab.Pane eventKey="floorplan">
                                <div className="p-3">
                                    <EventFloorPlanComponent floorPlan={eventData?.event?.floorPlan} getImageSrc={getImageSrc} />
                                </div>
                            </Tab.Pane>

                            {/* Gallery Tab */}

                            <Tab.Pane eventKey="gallery">
                                <div className="p-3">
                                    <EventGalleriesComponent
                                        galleries={eventData?.event?.galleries}
                                        getImageSrc={getImageSrc}
                                        handleGalleryImageClick={handleGalleryImageClick}
                                    />
                                </div>
                            </Tab.Pane>

                            {/* Exhibitors Tab */}

                            <Tab.Pane eventKey="exhibitors">
                                <div className="p-3">
                                    <EventExhibitorsComponent exhibitors={eventData?.event?.exhibitorsData} getImageSrc={getImageSrc} />
                                </div>
                            </Tab.Pane>

                            {/* Event Stamps Tab */}

                            <Tab.Pane eventKey="stamps">
                                <div className="p-3">
                                    <EventStampsComponent
                                        eventStamps={eventData?.event?.eventStamps}
                                        getImageSrc={getImageSrc}
                                        handleStampImageClick={handleStampImageClick}
                                    />
                                </div>
                            </Tab.Pane>

                            {/* Survey Tab */}
                            <Tab.Pane eventKey="survey">
                                <EventSurveyComponent surveyDetails={eventData?.event?.surveyDetails} formatTime={formatTime} />
                            </Tab.Pane>
                        </Tab.Content>
                    </Tab.Container>

                    {/* Order Info */}
                    {eventData?.order && (
                        <div
                            className="mb-3 mt-4"
                            style={{
                                backgroundColor: '#f8f9fa',
                                borderRadius: '8px',
                                padding: '20px',
                                border: '1px solid #e9ecef'
                            }}
                        >
                            <h5>Order Details</h5>
                            <hr />
                            <Row>
                                <Col xs={6} md={4} className="text-start">
                                    <p className="mb-2">
                                        <strong>Order Number:</strong>
                                        <br />
                                        {eventData.order?.orderNo || 'N/A'}
                                    </p>
                                </Col>
                                <Col xs={6} md={4} className="text-start">
                                    <p className="mb-2">
                                        <strong>Payment Status:</strong>
                                        <br />
                                        <Badge
                                            bg={
                                                eventData.order?.status === 'Success'
                                                    ? 'success'
                                                    : eventData.order?.status === 'Withdraw'
                                                    ? 'danger'
                                                    : 'warning'
                                            }
                                        >
                                            {eventData.order?.status || 'N/A'}
                                        </Badge>
                                    </p>
                                </Col>
                                <Col xs={6} md={4} className="text-start">
                                    <p className="mb-2">
                                        <strong>Amount Paid:</strong>
                                        <br />
                                        {eventData.order.price || 'N/A'} {eventData.order.currency || ''}
                                    </p>
                                </Col>
                                <Col xs={6} md={4} className="text-start mt-2">
                                    <p className="mb-2">
                                        <strong>Payment Method:</strong>
                                        <br />
                                        {eventData.order.paymentMethod || 'N/A'}
                                    </p>
                                </Col>
                                <Col xs={6} md={4} className="text-start">
                                    <p className="mb-2">
                                        <strong>Transaction Date:</strong>
                                        <br />
                                        {regDate ? regDate : 'N/A'}
                                    </p>
                                </Col>
                                <Col xs={6} md={4} className="text-start">
                                    <p className="mb-2">
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
                                    </p>
                                </Col>
                            </Row>
                        </div>
                    )}
                </div>
            </Container>
            {/* Image Modal */}
            <ImageModalComponent
                show={showImageModal}
                onHide={() => setShowImageModal(false)}
                imageSrc={getImageSrc(eventData.event.images[currentImageIndex])}
                imageAlt={`Event Image ${currentImageIndex + 1}`}
                downloadFileName={`event-image-${currentImageIndex + 1}.jpg`}
                currentIndex={currentImageIndex}
                totalImages={eventData?.event?.images?.length}
                onPrevious={goToPreviousImage}
                onNext={goToNextImage}
            />

            {/* Speaker Image Modal */}
            <ImageModalComponent
                show={showSpeakerImageModal}
                onHide={() => setShowSpeakerImageModal(false)}
                imageSrc={`${API_URL}/${currentSpeakerImage}`}
                imageAlt="Speaker Profile"
                downloadFileName="speaker-profile.jpg"
                currentIndex={0}
                totalImages={1}
            />

            {/* Event Main Image Modal */}
            <ImageModalComponent
                show={showEventMainImageModal}
                onHide={() => setShowEventMainImageModal(false)}
                imageSrc={`${API_URL}/${currentEventMainImage.replace(/\\/g, '/')}`}
                imageAlt="Event Main Image"
                downloadFileName="event-main-image.jpg"
                currentIndex={0}
                totalImages={1}
            />

            {/* Gallery Images Modal */}
            <ImageModalComponent
                show={showGalleryImageModal}
                onHide={() => setShowGalleryImageModal(false)}
                imageSrc={getImageSrc(galleryImages[currentGalleryImageIndex])}
                imageAlt={`Gallery Image ${currentGalleryImageIndex + 1}`}
                downloadFileName={`${currentGalleryTitle}-image-${currentGalleryImageIndex + 1}.jpg`}
                currentIndex={currentGalleryImageIndex}
                totalImages={galleryImages.length}
                onPrevious={goToPreviousGalleryImage}
                onNext={goToNextGalleryImage}
                title={currentGalleryTitle}
            />

            {/* Stamp Images Modal */}
            <ImageModalComponent
                show={showStampImageModal}
                onHide={() => setShowStampImageModal(false)}
                imageSrc={getImageSrc(stampImages[currentStampImageIndex])}
                imageAlt={`Event Stamp ${currentStampImageIndex + 1}`}
                downloadFileName={`event-stamp-${currentStampImageIndex + 1}.jpg`}
                currentIndex={currentStampImageIndex}
                totalImages={stampImages.length}
                onPrevious={goToPreviousStampImage}
                onNext={goToNextStampImage}
            />
        </>
    );
};

export default ViewRegisterEventPage;
