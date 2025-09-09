import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Row, Col, Card, Badge, Nav, Tab, Container, Modal } from 'react-bootstrap';
import { useDispatch } from 'react-redux';
import { eventById } from '../../../../store/actions/eventActions';
import { API_URL, DUMMY_PATH_USER } from '../../../../configs/env';
import DateTimeFormatter from '../../../../components/dateTime/DateTimeFormatter';
import { EXHIBITOR_PATHS } from '../../../../utils/constants';
import EventBasicComponent from '../../../../components/events/EventBasicComponent';
import EventLocationComponent from '../../../../components/events/EventLocationComponent';
import EventSpeakersComponent from '../../../../components/events/EventSpeakersComponent';
import ImageModalComponent from '../../../../components/events/ImageModalComponent';
import EventImageGridComponent from '../../../../components/events/EventImageGridComponent';
import EventDocumentsComponent from '../../../../components/events/EventDocumentsComponent';
import EventFloorPlanComponent from '../../../../components/events/EventFloorPlanComponent';
import EventGalleriesComponent from '../../../../components/events/EventGalleriesComponent';
import EventStampsComponent from '../../../../components/events/EventStampsComponent';
import EventSurveyComponent from '../../../../components/events/EventSurveyComponent';
import EventExhibitorsComponent from '../../../../components/events/EventExhibitorsComponent';

const ViewEventPage = () => {
    const { id } = useParams();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [eventData, setEventData] = useState(null);
    const [loading, setLoading] = useState(true);

    // Separate modal states for different image types
    const [showEventImageModal, setShowEventImageModal] = useState(false);
    const [currentEventImageIndex, setCurrentEventImageIndex] = useState(0);
    const [eventImages, setEventImages] = useState([]);

    const [showGalleryImageModal, setShowGalleryImageModal] = useState(false);
    const [currentGalleryImageIndex, setCurrentGalleryImageIndex] = useState(0);
    const [galleryImages, setGalleryImages] = useState([]);
    const [currentGalleryTitle, setCurrentGalleryTitle] = useState('');

    const [showStampImageModal, setShowStampImageModal] = useState(false);
    const [currentStampImageIndex, setCurrentStampImageIndex] = useState(0);
    const [stampImages, setStampImages] = useState([]);

    const [showSpeakerImageModal, setShowSpeakerImageModal] = useState(false);
    const [currentSpeakerImage, setCurrentSpeakerImage] = useState('');

    const [activeTab, setActiveTab] = useState('offers');

    useEffect(() => {
        dispatch(eventById(id)).then((res) => {
            console.log(res?.data);
            setEventData(res?.data);
            setLoading(false);
        });
    }, [id, dispatch]);

    if (loading) return <div>Loading...</div>;
    if (!eventData) return <div>No event found.</div>;

    // Helper functions
    const handleSpeakerImageClick = (speakerProfile) => {
        if (speakerProfile) {
            setCurrentSpeakerImage(speakerProfile);
            setShowSpeakerImageModal(true);
        } else {
            setShowSpeakerImageModal(false);
        }
    };

    const renderCategories = () => {
        if (!eventData?.categories?.length) {
            return <p>No categories listed.</p>;
        }
        return (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {eventData?.categories?.map((category, index) => (
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
                        {category.description}
                    </Badge>
                ))}

                <div></div>
            </div>
        );
    };

    const renderEventStats = () => (
        <Row>
            <Col xs={6} md={3} className="mb-3">
                <div
                    className="text-center p-3"
                    style={{ backgroundColor: '#f8f9fa', borderRadius: '8px', border: '1px solid #e9ecef', padding: '20px' }}
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
                    style={{ backgroundColor: '#f8f9fa', borderRadius: '8px', border: '1px solid #e9ecef', padding: '20px' }}
                >
                    <i className="fas fa-microphone text-primary mb-2" style={{ fontSize: '1.5rem' }}></i>
                    <h6 className="mb-1" style={{ color: '#495057', fontSize: '0.9rem' }}>
                        Speakers
                    </h6>
                    <p className="mb-0" style={{ fontSize: '0.95rem', fontWeight: '500' }}>
                        {eventData.speakers?.length || 0}
                    </p>
                </div>
            </Col>
            <Col xs={6} md={3} className="mb-3">
                <div
                    className="text-center p-3"
                    style={{ backgroundColor: '#f8f9fa', borderRadius: '8px', border: '1px solid #e9ecef', padding: '20px' }}
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
                    style={{ backgroundColor: '#f8f9fa', borderRadius: '8px', border: '1px solid #e9ecef', padding: '20px' }}
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
            {eventData?.galleries?.length > 0 && (
                <Col xs={6} md={3} className="mb-3">
                    <div
                        className="text-center p-3"
                        style={{ backgroundColor: '#f8f9fa', borderRadius: '8px', border: '1px solid #e9ecef', padding: '20px' }}
                    >
                        <i className="fas fa-photo-video text-primary mb-2" style={{ fontSize: '1.5rem' }}></i>
                        <h6 className="mb-1" style={{ color: '#495057', fontSize: '0.9rem' }}>
                            Galleries
                        </h6>
                        <p className="mb-0" style={{ fontSize: '0.95rem', fontWeight: '500' }}>
                            {eventData.galleries.length}
                        </p>
                    </div>
                </Col>
            )}
            {eventData?.exhibitorsData?.exhibitors?.length > 0 && (
                <Col xs={6} md={3} className="mb-3">
                    <div
                        className="text-center p-3"
                        style={{ backgroundColor: '#f8f9fa', borderRadius: '8px', border: '1px solid #e9ecef', padding: '20px' }}
                    >
                        <i className="fas fa-store text-primary mb-2" style={{ fontSize: '1.5rem' }}></i>
                        <h6 className="mb-1" style={{ color: '#495057', fontSize: '0.9rem' }}>
                            Exhibitors
                        </h6>
                        <p className="mb-0" style={{ fontSize: '0.95rem', fontWeight: '500' }}>
                            {eventData.exhibitorsData.exhibitors.length}
                        </p>
                    </div>
                </Col>
            )}
        </Row>
    );

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

    // Navigation functions for event images modal
    const goToPreviousEventImage = () => {
        setCurrentEventImageIndex((prevIndex) => (prevIndex === 0 ? eventImages.length - 1 : prevIndex - 1));
    };

    const goToNextEventImage = () => {
        setCurrentEventImageIndex((prevIndex) => (prevIndex === eventImages.length - 1 ? 0 : prevIndex + 1));
    };

    // Navigation functions for gallery images modal
    const goToPreviousGalleryImage = () => {
        setCurrentGalleryImageIndex((prevIndex) => (prevIndex === 0 ? galleryImages.length - 1 : prevIndex - 1));
    };

    const goToNextGalleryImage = () => {
        setCurrentGalleryImageIndex((prevIndex) => (prevIndex === galleryImages.length - 1 ? 0 : prevIndex + 1));
    };

    // Navigation functions for stamp images modal
    const goToPreviousStampImage = () => {
        setCurrentStampImageIndex((prevIndex) => (prevIndex === 0 ? stampImages.length - 1 : prevIndex - 1));
    };

    const goToNextStampImage = () => {
        setCurrentStampImageIndex((prevIndex) => (prevIndex === stampImages.length - 1 ? 0 : prevIndex + 1));
    };

    // Handle event image click
    const handleEventImageClick = (index) => {
        setEventImages(eventData.images);
        setCurrentEventImageIndex(index);
        setShowEventImageModal(true);
    };

    // Handle gallery image click
    const handleGalleryImageClick = (galleryImages, galleryTitle, index) => {
        setGalleryImages(galleryImages);
        setCurrentGalleryTitle(galleryTitle);
        setCurrentGalleryImageIndex(index);
        setShowGalleryImageModal(true);
    };

    // Handle stamp image click
    const handleStampImageClick = (index) => {
        setStampImages(eventData.eventStamps.images);
        setCurrentStampImageIndex(index);
        setShowStampImageModal(true);
    };

    // 12-hour AM/PM format helper
    const formatTime = (timeStr) => {
        if (!timeStr) return '';
        const [hour, minute] = timeStr.split(':');
        const date = new Date();
        date.setHours(hour, minute);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    };

    return (
        <>
            <div className="mt-4">
                <div
                    className="mb-3"
                    style={{ backgroundColor: '#fff', borderRadius: '8px', padding: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
                >
                    <div className="d-flex justify-content-between align-items-center">
                        <h4 className="card-title">View</h4>
                        <Button variant="secondary" onClick={() => navigate('/events/event-list')}>
                            <i style={{ marginRight: '10px' }} className="fas fa-arrow-left me-2"></i>
                            Back
                        </Button>
                    </div>
                    <hr />
                    {renderEventStats()}
                </div>

                <div style={{ backgroundColor: '#fff', borderRadius: '8px', padding: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
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
                                <EventBasicComponent eventData={eventData} />
                            </Tab.Pane>

                            {/* Location & Pricing Tab */}
                            <Tab.Pane eventKey="location">
                                <EventLocationComponent eventData={eventData} />
                            </Tab.Pane>

                            {/* Speakers Tab */}
                            <Tab.Pane eventKey="speakers">
                                <EventSpeakersComponent speakers={eventData?.speakers} handleSpeakerImageClick={handleSpeakerImageClick} />
                            </Tab.Pane>

                            {/* Media Tab */}
                            <Tab.Pane eventKey="media">
                                <div className="p-3" style={{ padding: '20px' }}>
                                    <Row>
                                        <Col md={6}>
                                            <EventImageGridComponent
                                                images={eventData?.images}
                                                getImageSrc={getImageSrc}
                                                handleEventImageClick={handleEventImageClick}
                                            />
                                        </Col>
                                        <Col md={6} className="section-speakers">
                                            <EventDocumentsComponent documents={eventData?.documents} />
                                        </Col>
                                    </Row>
                                </div>
                            </Tab.Pane>

                            {/* Floor Plan Tab */}

                            <Tab.Pane eventKey="floorplan">
                                <EventFloorPlanComponent floorPlan={eventData?.floorPlan} getImageSrc={getImageSrc} />
                            </Tab.Pane>

                            {/* Gallery Tab */}

                            <Tab.Pane eventKey="gallery">
                                <div className="p-3">
                                    <EventGalleriesComponent
                                        galleries={eventData?.galleries}
                                        getImageSrc={getImageSrc}
                                        handleGalleryImageClick={handleGalleryImageClick}
                                    />
                                </div>
                            </Tab.Pane>

                            {/* Exhibitors Tab */}

                            <Tab.Pane eventKey="exhibitors">
                                <EventExhibitorsComponent exhibitors={eventData?.exhibitors} getImageSrc={getImageSrc} />
                            </Tab.Pane>

                            {/* Event Stamps Tab */}

                            <Tab.Pane eventKey="stamps">
                                <div className="p-3">
                                    <EventStampsComponent
                                        eventStamps={eventData?.eventStamps}
                                        getImageSrc={getImageSrc}
                                        handleStampImageClick={handleStampImageClick}
                                    />
                                </div>
                            </Tab.Pane>

                            {/* Survey Tab */}

                            <Tab.Pane eventKey="survey">
                                <div className="p-3">
                                    <EventSurveyComponent surveyDetails={eventData?.surveyDetails} formatTime={formatTime} />
                                </div>
                            </Tab.Pane>
                        </Tab.Content>
                    </Tab.Container>
                </div>
            </div>

            <ImageModalComponent
                show={showEventImageModal}
                onHide={() => setShowEventImageModal(false)}
                imageSrc={getImageSrc(eventImages[currentEventImageIndex])}
                imageAlt={`Event Image ${currentEventImageIndex + 1}`}
                downloadFileName={`event-image-${currentEventImageIndex + 1}.jpg`}
                currentIndex={currentEventImageIndex}
                totalImages={eventImages.length}
                onPrevious={goToPreviousEventImage}
                onNext={goToNextEventImage}
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
        </>
    );
};

export default ViewEventPage;
