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
                    {/* Tabbed Content */}
                    <Tab.Container id="event-tabs" defaultActiveKey="registration">
                        <Row>
                            <Col sm={12}>
                                <Nav variant="tabs" className="mb-3">
                                    <Nav.Item>
                                        <Nav.Link eventKey="registration">
                                            <i className="fas fa-user-check me-2" style={{ color: '#4680ff', marginRight: 6 }}></i>
                                            Registration Information
                                        </Nav.Link>
                                    </Nav.Item>
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
                            {/* Registration Information Tab */}
                            <Tab.Pane eventKey="registration">
                                <div className="p-2 bg-light">
                                    {/* User Information Section */}
                                    <div
                                        className="mb-4"
                                        style={{
                                            backgroundColor: '#fff',
                                            borderRadius: '8px',
                                            padding: '20px',
                                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                            border: '1px solid #e9ecef',
                                            borderLeft: '4px solid #3498db'
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
                                                    borderBottom: '2px solid #3498db',
                                                    paddingBottom: '8px'
                                                }}
                                            >
                                                <i className="fas fa-user-circle" style={{ fontSize: '20px', color: '#3498db' }}></i>
                                                User Information
                                            </h5>
                                            <Row>
                                                <Col lg={6} md={12}>
                                                    <div style={{ fontSize: '15px', lineHeight: '1.6' }}>
                                                        <div className="mb-2 py-2" style={{ borderBottom: '1px solid #f1f1f1' }}>
                                                            <div className="info-field-container">
                                                                <div className="field-label" style={{ fontWeight: 'bold', color: '#495057', fontSize: '14px' }}>
                                                                    <i className="fas fa-user" style={{ marginRight: '8px', color: '#007bff' }}></i>
                                                                    Registered By:
                                                                </div>
                                                                <div className="field-value" style={{ color: '#2c3e50', fontSize: '14px', fontWeight: '500' }}>
                                                                    {eventData.user?.firstName} {eventData.user?.lastName}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        
                                                        <div className="mb-2 py-2" style={{ borderBottom: '1px solid #f1f1f1' }}>
                                                            <div className="info-field-container">
                                                                <div className="field-label" style={{ fontWeight: 'bold', color: '#495057', fontSize: '14px' }}>
                                                                    <i className="fas fa-envelope" style={{ marginRight: '8px', color: '#17a2b8' }}></i>
                                                                    Email:
                                                                </div>
                                                                <div className="field-value" style={{ color: '#2c3e50', fontSize: '14px', fontWeight: '500' }}>
                                                                    {eventData.user?.email}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        
                                                        <div className="mb-2 py-2" style={{ borderBottom: '1px solid #f1f1f1' }}>
                                                            <div className="info-field-container">
                                                                <div className="field-label" style={{ fontWeight: 'bold', color: '#495057', fontSize: '14px' }}>
                                                                    <i className="fas fa-phone" style={{ marginRight: '8px', color: '#28a745' }}></i>
                                                                    Mobile:
                                                                </div>
                                                                <div className="field-value" style={{ color: '#2c3e50', fontSize: '14px', fontWeight: '500' }}>
                                                                    {eventData.user?.mobile || 'N/A'}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </Col>
                                                
                                                <Col lg={6} md={12}>
                                                    <div style={{ fontSize: '15px', lineHeight: '1.6' }}>
                                                        <div className="mb-2 py-2" style={{ borderBottom: '1px solid #f1f1f1' }}>
                                                            <div className="info-field-container">
                                                                <div className="field-label" style={{ fontWeight: 'bold', color: '#495057', fontSize: '14px' }}>
                                                                    <i className="fas fa-calendar-alt" style={{ marginRight: '8px', color: '#fd7e14' }}></i>
                                                                    Registration Date:
                                                                </div>
                                                                <div className="field-value" style={{ color: '#2c3e50', fontSize: '14px', fontWeight: '500' }}>
                                                                    {regDate}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        
                                                        <div className="mb-2 py-2" style={{ borderBottom: '1px solid #f1f1f1' }}>
                                                            <div className="info-field-container">
                                                                <div className="field-label" style={{ fontWeight: 'bold', color: '#495057', fontSize: '14px' }}>
                                                                    <i className="fas fa-tag" style={{ marginRight: '8px', color: '#6f42c1' }}></i>
                                                                    User Type:
                                                                </div>
                                                                <div className="field-value">
                                                                    <Badge bg="secondary" className="px-3 py-1">
                                                                        {eventData.type || 'N/A'}
                                                                    </Badge>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        
                                                        {eventData.isCreatedByAdmin && (
                                                            <div className="mb-2 py-2" style={{ borderBottom: '1px solid #f1f1f1' }}>
                                                                <div className="info-field-container">
                                                                    <div className="field-label" style={{ fontWeight: 'bold', color: '#495057', fontSize: '14px' }}>
                                                                        <i className="fas fa-shield-alt" style={{ marginRight: '8px', color: '#dc3545' }}></i>
                                                                        Created By:
                                                                    </div>
                                                                    <div className="field-value">
                                                                        <Badge bg="danger" className="px-3 py-1">
                                                                            Admin
                                                                        </Badge>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </Col>
                                            </Row>
                                        </div>
                                    </div>

                                    {/* Registration Status Section */}
                                    <div
                                        className="mb-4"
                                        style={{
                                            backgroundColor: '#fff',
                                            borderRadius: '8px',
                                            padding: '20px',
                                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                            border: '1px solid #e9ecef',
                                            borderLeft: '4px solid #28a745'
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
                                                    borderBottom: '2px solid #28a745',
                                                    paddingBottom: '8px'
                                                }}
                                            >
                                                <i className="fas fa-clipboard-check" style={{ fontSize: '20px', color: '#28a745' }}></i>
                                                Registration Status
                                            </h5>
                                            <Row>
                                                <Col lg={12} md={12}>
                                                    <div style={{ fontSize: '15px', lineHeight: '1.6' }}>
                                                        <div className="mb-2 py-2" style={{ borderBottom: '1px solid #f1f1f1' }}>
                                                            <div className="info-field-container">
                                                                <div className="field-label" style={{ fontWeight: 'bold', color: '#495057', fontSize: '14px' }}>
                                                                    <i 
                                                                        className={`fas ${eventData.status === 'Success' ? 'fa-check-circle' : eventData.status === 'Withdraw' ? 'fa-times-circle' : 'fa-clock'}`} 
                                                                        style={{ 
                                                                            marginRight: '8px', 
                                                                            color: eventData.status === 'Success' ? '#28a745' : eventData.status === 'Withdraw' ? '#dc3545' : '#ffc107'
                                                                        }}
                                                                    ></i>
                                                                    Registration Status:
                                                                </div>
                                                                <div className="field-value">
                                                                    <Badge
                                                                        bg={
                                                                            eventData.status === 'Success'
                                                                                ? 'success'
                                                                                : eventData.status === 'Withdraw'
                                                                                ? 'danger'
                                                                                : 'warning'
                                                                        }
                                                                        className="px-3 py-2"
                                                                        style={{ fontSize: '14px' }}
                                                                    >
                                                                        {eventData.status}
                                                                    </Badge>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </Col>
                                            </Row>
                                        </div>
                                    </div>

                                    {/* Custom CSS for Responsive Behavior */}
                                    <style jsx>{`
                                        /* Desktop: side-by-side layout */
                                        .info-field-container {
                                            display: flex;
                                            justify-content: space-between;
                                            align-items: center;
                                        }

                                        .field-label {
                                            min-width: 140px;
                                        }

                                        .field-value {
                                            text-align: right;
                                            flex: 1;
                                        }

                                        /* Mobile: stacked layout */
                                        @media (max-width: 768px) {
                                            .info-field-container {
                                                display: block !important;
                                                text-align: left !important;
                                            }

                                            .field-label {
                                                margin-bottom: 5px;
                                            }

                                            .field-value {
                                                text-align: left !important;
                                                margin-left: 20px;
                                            }
                                        }
                                    `}</style>
                                </div>
                            </Tab.Pane>

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
