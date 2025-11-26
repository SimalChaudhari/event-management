import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Button, Row, Col, Card, Badge, Nav, Tab, Container, Modal, Form } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import { eventById, updateEventTabVisibility } from '../../../../store/actions/eventActions';
import { API_URL, DUMMY_PATH_USER } from '../../../../configs/env';
import DateTimeFormatter from '../../../../components/dateTime/DateTimeFormatter';
import { EVENT_PATHS, EXHIBITOR_PATHS } from '../../../../utils/constants';
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
import EventProgrammeComponent from '../../../../components/events/EventProgrammeComponent';
import EventEngagementComponent from '../../../../components/events/EventEngagementComponent';

const ViewEventPage = () => {
    const { id } = useParams();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();
    const [eventData, setEventData] = useState(null);
    const [loading, setLoading] = useState(true);

    // Get user role from Redux state
    const { authUser } = useSelector((state) => state.auth);
    const isAdmin = authUser?.role === 'admin';

    // Get current event page from URL for passing to speaker component
    // This should be read once when component mounts to preserve it
    const [eventPageFromUrl, setEventPageFromUrl] = useState(null);
    // Track if we're viewing an upcoming event - capture this on mount
    const [isUpcomingEventPage, setIsUpcomingEventPage] = useState(false);
    
    useEffect(() => {
        // Capture page parameter from URL when component mounts or URL changes
        // This ensures we preserve the page number even if the URL query params change
        const urlParams = new URLSearchParams(window.location.search || location.search);
        const pageParam = urlParams.get('page');
        if (pageParam) {
            setEventPageFromUrl(pageParam);
        } else {
            // Also check location.state as fallback
            if (location.state?.page) {
                setEventPageFromUrl(location.state.page);
            }
        }

        // Detect if this is an upcoming event page - check pathname
        // Use window.location.pathname for the most reliable check
        // React Router's location.pathname might not always be accurate
        const pathname = window.location.pathname || location.pathname;
        
        // Check multiple ways to detect upcoming event:
        // 1. Check if pathname includes '/upcoming/view-upcoming-event'
        // 2. Check if pathname starts with '/upcoming/view-upcoming-event/'
        // 3. Check if pathname starts with '/upcoming/'
        // 4. Check query parameter or state
        const isUpcoming = 
            pathname && (
                pathname.includes('/upcoming/view-upcoming-event') || 
                pathname.startsWith('/upcoming/view-upcoming-event/') ||
                pathname.indexOf('/upcoming/') === 0
            ) ||
            urlParams.get('fromUpcoming') === 'true' ||
            location.state?.fromUpcoming === true;
        
        setIsUpcomingEventPage(isUpcoming);
    }, [location.search, location.state, location.pathname]);

    // Custom handleBack that uses the captured page parameter
    // This ensures we always have the page number even if URL changes
    // Also detects if we're viewing an upcoming event to navigate back to upcoming events list
    const handleBack = useCallback(() => {
        // Use the captured state for upcoming event detection (primary check)
        // This is the most reliable since it was captured on mount
        // Also double-check pathname as fallback
        const pathname = window.location.pathname || location.pathname;
        const isUpcoming = isUpcomingEventPage || 
                          (pathname && (
                              pathname.includes('/upcoming/view-upcoming-event') ||
                              pathname.startsWith('/upcoming/view-upcoming-event/') ||
                              pathname.indexOf('/upcoming/') === 0
                          ));
        
        // Priority: captured page from state > URL > location.state > null
        // We prioritize the captured state because it was set when the component mounted
        // and might be more reliable than the current URL
        const urlParams = new URLSearchParams(window.location.search || location.search);
        const pageFromUrl = urlParams.get('page');
        const currentPage = eventPageFromUrl || pageFromUrl || location.state?.page;
        
        // Navigate back to the appropriate list based on the event type
        if (isUpcoming) {
            // Navigate back to upcoming events list
            if (currentPage) {
                navigate(`${EVENT_PATHS.UPCOMING_EVENTS}?page=${currentPage}`);
            } else {
                navigate(EVENT_PATHS.UPCOMING_EVENTS);
            }
        } else {
            // Navigate back to regular events list
            if (currentPage) {
                navigate(`${EVENT_PATHS.LIST_EVENTS}?page=${currentPage}`);
            } else {
                navigate(EVENT_PATHS.LIST_EVENTS);
            }
        }
    }, [navigate, eventPageFromUrl, isUpcomingEventPage, location.search, location.state, location.pathname]);

    // Get current event page from URL for passing to speaker component
    const getEventPage = () => {
        const urlParams = new URLSearchParams(window.location.search || location.search);
        return urlParams.get('page') || eventPageFromUrl;
    };

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

    // Tab visibility management
    const [showTabVisibilityModal, setShowTabVisibilityModal] = useState(false);
    const [tabVisibilitySettings, setTabVisibilitySettings] = useState({
        speakers: true,
        documents: true,
        floorplan: true,
        gallery: true,
        stamps: true,
        survey: true,
        exhibitors: true,
        categories: true,
        agenda: true,
        programme: true,
        engagement: true,
        adminInfo: true
    });
    const [isUpdatingTabVisibility, setIsUpdatingTabVisibility] = useState(false);

    useEffect(() => {
        dispatch(eventById(id)).then((res) => {
            setEventData(res?.data);

            // Initialize tab visibility settings from event data
            if (res?.data?.tabVisibility) {
                setTabVisibilitySettings({
                    speakers: res.data.tabVisibility.speakers !== false,
                    documents: res.data.tabVisibility.documents !== false,
                    floorplan: res.data.tabVisibility.floorplan !== false,
                    gallery: res.data.tabVisibility.gallery !== false,
                    stamps: res.data.tabVisibility.stamps !== false,
                    survey: res.data.tabVisibility.survey !== false,
                    exhibitors: res.data.tabVisibility.exhibitors !== false,
                    categories: res.data.tabVisibility.categories !== false,
                    agenda: res.data.tabVisibility.agenda !== false,
                    programme: res.data.tabVisibility.programme !== false,
                    engagement: res.data.tabVisibility.engagement !== false,
                    adminInfo: res.data.tabVisibility.adminInfo !== false
                });
            }

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

    const renderEventStats = () => (
        <Row>
            <Col xs={6} md={3} className="mb-4">
                <div
                    className="text-center p-3"
                    style={{ backgroundColor: '#f8f9fa', borderRadius: '8px', border: '1px solid #e9ecef', padding: '20px' }}
                >
                    <i className="fas fa-users text-primary mb-2" style={{ fontSize: '1.5rem' }}></i>
                    <h6 className="mb-1" style={{ color: '#495057', fontSize: '0.9rem' }}>
                        Registered Participants
                    </h6>
                    <p className="mb-0" style={{ fontSize: '0.95rem', fontWeight: '500', color: '#28a745' }}>
                        {eventData.attendanceCount || 0}
                    </p>
                </div>
            </Col>
            <Col xs={6} md={3} className="mb-4">
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
            <Col xs={6} md={3} className="mb-4">
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
            <Col xs={6} md={3} className="mb-4">
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
                <Col xs={6} md={3} className="mb-4">
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
            {(eventData?.exhibitors?.exhibitors?.length > 0 || eventData?.exhibitorsData?.exhibitors?.length > 0) && (
                <Col xs={6} md={3} className="mb-4">
                    <div
                        className="text-center p-3"
                        style={{ backgroundColor: '#f8f9fa', borderRadius: '8px', border: '1px solid #e9ecef', padding: '20px' }}
                    >
                        <i className="fas fa-store text-primary mb-2" style={{ fontSize: '1.5rem' }}></i>
                        <h6 className="mb-1" style={{ color: '#495057', fontSize: '0.9rem' }}>
                            Exhibitors
                        </h6>
                        <p className="mb-0" style={{ fontSize: '0.95rem', fontWeight: '500' }}>
                            {(eventData.exhibitors?.exhibitors || eventData.exhibitorsData?.exhibitors)?.length || 0}
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

    // Helper function to determine if a tab should be visible
    const isTabVisible = (tabKey) => {
        // Admins can see all tabs regardless of restrictions
        if (isAdmin) {
            return true;
        }

        // For regular users, check tab visibility settings
        // If no tabVisibility settings exist, show all tabs (backward compatibility)
        if (!eventData?.tabVisibility) {
            return true;
        }

        // Check if the specific tab is disabled
        // Use both eventData.tabVisibility and tabVisibilitySettings for immediate updates
        const eventTabVisibility = eventData.tabVisibility[tabKey];
        const settingsTabVisibility = tabVisibilitySettings[tabKey];

        // If settings have been updated but eventData hasn't been refreshed yet, use settings
        if (settingsTabVisibility !== undefined) {
            return settingsTabVisibility !== false;
        }

        return eventTabVisibility !== false;
    };

    // Check if tab has any data to display
    const hasTabData = (tabKey) => {
        if (!eventData) return false;

        switch (tabKey) {
            case 'gallery':
                return eventData.galleries && eventData.galleries.length > 0;
            case 'survey':
                return eventData.surveys && eventData.surveys.length > 0;
            case 'exhibitors':
                // Check for both structures: exhibitors (getEventById) or exhibitorsData (getAllEvents)
                const exhibitorsObj = eventData.exhibitors || eventData.exhibitorsData;
                return exhibitorsObj && exhibitorsObj.exhibitors && exhibitorsObj.exhibitors.length > 0;
            case 'speakers':
                return eventData.speakers && eventData.speakers.length > 0;
            case 'media':
                return (eventData.images && eventData.images.length > 0) || (eventData.documents && eventData.documents.length > 0);
            case 'documents':
                return eventData.documents && eventData.documents.length > 0;
            case 'floorplan':
                return eventData.floorPlan && eventData.floorPlan.length > 0;
            case 'stamps':
                return eventData.eventStamps && eventData.eventStamps.length > 0;
            case 'categories':
                return eventData.categories && eventData.categories.length > 0;
            case 'agenda':
                return eventData.eventAgendas && eventData.eventAgendas.length > 0;
            case 'programme':
                return eventData.programmeTracks && eventData.programmeTracks.length > 0;
            case 'adminInfo':
                return eventData.adminInfo || eventData.isCreatedByAdmin;
            default:
                return true; // For details, location tabs that always have data
        }
    };

    // Tab visibility management functions
    const handleTabVisibilityChange = (tabKey, isVisible) => {
        setTabVisibilitySettings((prev) => ({
            ...prev,
            [tabKey]: isVisible
        }));
    };

    const handleUpdateTabVisibility = async () => {
        setIsUpdatingTabVisibility(true);
        try {
            const success = await dispatch(updateEventTabVisibility(id, tabVisibilitySettings));

            if (success) {
                // Update local event data state
                setEventData((prev) => ({
                    ...prev,
                    tabVisibility: tabVisibilitySettings
                }));

                // Close modal
                setShowTabVisibilityModal(false);
            }
        } catch (error) {
            console.error('Error updating tab visibility:', error);
        } finally {
            setIsUpdatingTabVisibility(false);
        }
    };

    return (
        <>
            <div className="mt-4">
                <div
                    className="mb-4"
                    style={{ backgroundColor: '#fff', borderRadius: '8px', padding: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
                >
                    <div className="d-flex justify-content-between align-items-center">
                        <h4 className="card-title">View</h4>
                        <div className="d-flex">
                            {/* Always show button for testing - change back to {isAdmin && ( after testing */}
                            <Button
                                variant="outline-primary"
                                onClick={() => setShowTabVisibilityModal(true)}
                                size="sm"
                                style={{ marginRight: '10px' }}
                            >
                                <i className="fas fa-cog" style={{ marginRight: '8px' }}></i>
                                Manage Tabs
                            </Button>

                            <div className="d-flex gap-2">
                                <Button 
                                    variant="primary" 
                                    onClick={() => navigate(`/events/attendance/${id}`)}
                                    style={{ marginRight: '8px' }}
                                >
                                    <i className="fas fa-clipboard-check" style={{ marginRight: '8px' }}></i>
                                    Attendance Tracking
                                </Button>
                                <Button variant="secondary" onClick={handleBack}>
                                    <i className="fas fa-arrow-left" style={{ marginRight: '8px' }}></i>
                                    Back
                                </Button>
                            </div>
                        </div>
                    </div>
                    <hr />
                    {renderEventStats()}
                </div>

                <div style={{ backgroundColor: '#fff', borderRadius: '8px', padding: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                    <Tab.Container id="event-tabs" defaultActiveKey="details">
                        <Row>
                            <Col sm={12}>
                                <Nav variant="tabs" className="mb-4">
                                    {/* Details Tab */}
                                    <Nav.Item>
                                        <Nav.Link eventKey="details">
                                            <i className="fas fa-info-circle" style={{ marginRight: '8px', color: '#4680ff' }}></i>
                                            Details
                                        </Nav.Link>
                                    </Nav.Item>

                                    {/* Location Tab */}
                                    <Nav.Item>
                                        <Nav.Link eventKey="location">
                                            <i className="fas fa-map-marker-alt" style={{ marginRight: '8px', color: '#4680ff' }}></i>
                                            Location
                                        </Nav.Link>
                                    </Nav.Item>

                                    {/* Images Tab */}
                                    <Nav.Item>
                                        <Nav.Link eventKey="images">
                                            <i className="fas fa-images" style={{ marginRight: '8px', color: '#4680ff' }}></i>
                                            Images
                                        </Nav.Link>
                                    </Nav.Item>

                                    {/* Speakers Tab */}
                                    {isTabVisible('speakers') && (
                                        <Nav.Item>
                                            <Nav.Link eventKey="speakers">
                                                <i className="fas fa-microphone" style={{ marginRight: '8px', color: '#4680ff' }}></i>
                                                Speakers
                                                {isAdmin && eventData?.tabVisibility?.speakers === false && (
                                                    <Badge bg="warning" className="ms-2" style={{ fontSize: '10px' }}>
                                                        Restricted
                                                    </Badge>
                                                )}
                                            </Nav.Link>
                                        </Nav.Item>
                                    )}

                                    {/* Documents Tab */}
                                    {isTabVisible('documents') && (
                                        <Nav.Item>
                                            <Nav.Link eventKey="documents">
                                                <i className="fas fa-file-alt" style={{ marginRight: '8px', color: '#4680ff' }}></i>
                                                Documents
                                                {isAdmin && eventData?.tabVisibility?.documents === false && (
                                                    <Badge bg="warning" className="ms-2" style={{ fontSize: '10px' }}>
                                                        Restricted
                                                    </Badge>
                                                )}
                                            </Nav.Link>
                                        </Nav.Item>
                                    )}

                                    {/* Floor Plan Tab */}
                                    {isTabVisible('floorplan') && (
                                        <Nav.Item>
                                            <Nav.Link eventKey="floorplan">
                                                <i className="fas fa-map" style={{ marginRight: '8px', color: '#4680ff' }}></i>
                                                Floor Plan
                                                {isAdmin && eventData?.tabVisibility?.floorplan === false && (
                                                    <Badge bg="warning" className="ms-2" style={{ fontSize: '10px' }}>
                                                        Restricted
                                                    </Badge>
                                                )}
                                            </Nav.Link>
                                        </Nav.Item>
                                    )}

                                    {/* Gallery Tab */}
                                    {isTabVisible('gallery') && (
                                        <Nav.Item>
                                            <Nav.Link eventKey="gallery">
                                                <i className="fas fa-photo-video" style={{ marginRight: '8px', color: '#4680ff' }}></i>
                                                Gallery
                                                {isAdmin && eventData?.tabVisibility?.gallery === false && (
                                                    <Badge bg="warning" className="ms-2" style={{ fontSize: '10px' }}>
                                                        Restricted
                                                    </Badge>
                                                )}
                                                {!hasTabData('gallery') && (
                                                    <Badge bg="secondary" className="ms-2" style={{ fontSize: '10px' }}>
                                                        No Data
                                                    </Badge>
                                                )}
                                            </Nav.Link>
                                        </Nav.Item>
                                    )}

                                    {/* Event Stamps Tab */}
                                    {isTabVisible('stamps') && (
                                        <Nav.Item>
                                            <Nav.Link eventKey="stamps">
                                                <i className="fas fa-stamp" style={{ marginRight: '8px', color: '#4680ff' }}></i>
                                                Event Stamps
                                                {isAdmin && eventData?.tabVisibility?.stamps === false && (
                                                    <Badge bg="warning" className="ms-2" style={{ fontSize: '10px' }}>
                                                        Restricted
                                                    </Badge>
                                                )}
                                            </Nav.Link>
                                        </Nav.Item>
                                    )}

                                    {/* Survey Tab */}
                                    {isTabVisible('survey') && (
                                        <Nav.Item>
                                            <Nav.Link eventKey="survey">
                                                <i className="fas fa-poll" style={{ marginRight: '8px', color: '#4680ff' }}></i>
                                                Survey
                                                {isAdmin && eventData?.tabVisibility?.survey === false && (
                                                    <Badge bg="warning" className="ms-2" style={{ fontSize: '10px' }}>
                                                        Restricted
                                                    </Badge>
                                                )}
                                            </Nav.Link>
                                        </Nav.Item>
                                    )}

                                    {/* Exhibitors Tab */}
                                    {isTabVisible('exhibitors') && (
                                        <Nav.Item>
                                            <Nav.Link eventKey="exhibitors">
                                                <i className="fas fa-store" style={{ marginRight: '8px', color: '#4680ff' }}></i>
                                                Exhibitors
                                                {isAdmin && eventData?.tabVisibility?.exhibitors === false && (
                                                    <Badge bg="warning" className="ms-2" style={{ fontSize: '10px' }}>
                                                        Restricted
                                                    </Badge>
                                                )}
                                            </Nav.Link>
                                        </Nav.Item>
                                    )}

                                    {/* Programme Tab */}
                                    {isTabVisible('programme') && (
                                        <Nav.Item>
                                            <Nav.Link eventKey="programme">
                                                <i className="fas fa-calendar-check" style={{ marginRight: '8px', color: '#4680ff' }}></i>
                                                Programme
                                                {isAdmin && eventData?.tabVisibility?.programme === false && (
                                                    <Badge bg="warning" className="ms-2" style={{ fontSize: '10px' }}>
                                                        Restricted
                                                    </Badge>
                                                )}
                                            </Nav.Link>
                                        </Nav.Item>
                                    )}

                                    {/* Engagement Tab */}
                                    {isTabVisible('engagement') && (
                                        <Nav.Item>
                                            <Nav.Link eventKey="engagement">
                                                <i className="fas fa-users" style={{ marginRight: '8px', color: '#4680ff' }}></i>
                                                Engagement
                                                {isAdmin && eventData?.tabVisibility?.engagement === false && (
                                                    <Badge bg="warning" className="ms-2" style={{ fontSize: '10px' }}>
                                                        Restricted
                                                    </Badge>
                                                )}
                                            </Nav.Link>
                                        </Nav.Item>
                                    )}

                                    {/* Categories Tab */}
                                    {/* {isTabVisible('categories') && (
                                        <Nav.Item>
                                            <Nav.Link eventKey="categories">
                                                <i className="fas fa-tags" style={{ marginRight: '8px', color: '#4680ff' }}></i>
                                                Categories
                                                {isAdmin && eventData?.tabVisibility?.categories === false && (
                                                    <Badge bg="warning" className="ms-2" style={{ fontSize: '10px' }}>
                                                        Restricted
                                                    </Badge>
                                                )}
                                            </Nav.Link>
                                        </Nav.Item>
                                    )} */}
                                </Nav>
                            </Col>
                        </Row>

                        <Tab.Content>
                            {/* Details Tab */}
                            <Tab.Pane eventKey="details">
                                <div className="p-3">
                                    <EventBasicComponent eventData={eventData} formatTime={formatTime} />
                                </div>
                            </Tab.Pane>

                            {/* Location Tab */}
                            <Tab.Pane eventKey="location">
                                <div className="p-3">
                                    <EventLocationComponent eventData={eventData} />
                                </div>
                            </Tab.Pane>

                            {/* Images Tab */}
                            <Tab.Pane eventKey="images">
                                <div className="p-3">
                                    <EventImageGridComponent
                                        images={eventData?.images}
                                        getImageSrc={getImageSrc}
                                        handleEventImageClick={handleEventImageClick}
                                    />
                                </div>
                            </Tab.Pane>

                            {/* Speakers Tab */}
                            {isTabVisible('speakers') && (
                                <Tab.Pane eventKey="speakers">
                                    <EventSpeakersComponent
                                        speakers={eventData?.speakers}
                                        handleSpeakerImageClick={handleSpeakerImageClick}
                                        eventId={id}
                                        eventPage={getEventPage()}
                                    />
                                </Tab.Pane>
                            )}

                            {/* Documents Tab */}
                            {isTabVisible('documents') && (
                                <Tab.Pane eventKey="documents">
                                    <div className="p-3" style={{ padding: '20px' }}>
                                        <EventDocumentsComponent documents={eventData?.documents} />
                                    </div>
                                </Tab.Pane>
                            )}

                            {/* Floor Plan Tab */}
                            {isTabVisible('floorplan') && (
                                <Tab.Pane eventKey="floorplan">
                                    <EventFloorPlanComponent floorPlan={eventData?.floorPlan} getImageSrc={getImageSrc} />
                                </Tab.Pane>
                            )}

                            {/* Gallery Tab */}
                            {isTabVisible('gallery') && (
                                <Tab.Pane eventKey="gallery">
                                    <div className="p-3">
                                        {hasTabData('gallery') ? (
                                            <EventGalleriesComponent
                                                galleries={eventData?.galleries}
                                                getImageSrc={getImageSrc}
                                                handleGalleryImageClick={handleGalleryImageClick}
                                            />
                                        ) : (
                                            <div className="text-center py-5">
                                                <i className="fas fa-images fa-3x text-muted mb-4"></i>
                                                <h5 className="text-muted">No Gallery Data Available</h5>
                                                <p className="text-muted">This tab has been disabled or contains no data.</p>
                                            </div>
                                        )}
                                    </div>
                                </Tab.Pane>
                            )}

                            {/* Exhibitors Tab */}
                            {isTabVisible('exhibitors') && (
                                <Tab.Pane eventKey="exhibitors">
                                    {hasTabData('exhibitors') ? (
                                        <EventExhibitorsComponent
                                            exhibitors={eventData?.exhibitors || eventData?.exhibitorsData}
                                            getImageSrc={getImageSrc}
                                        />
                                    ) : (
                                        <div className="text-center py-5">
                                            <i className="fas fa-building fa-3x text-muted mb-4"></i>
                                            <h5 className="text-muted">No Exhibitors Data Available</h5>
                                            <p className="text-muted">This tab has been disabled or contains no data.</p>
                                        </div>
                                    )}
                                </Tab.Pane>
                            )}

                            {/* Event Stamps Tab */}
                            {isTabVisible('stamps') && (
                                <Tab.Pane eventKey="stamps">
                                    <div className="p-3">
                                        <EventStampsComponent
                                            eventStamps={eventData?.eventStamps}
                                            getImageSrc={getImageSrc}
                                            handleStampImageClick={handleStampImageClick}
                                        />
                                    </div>
                                </Tab.Pane>
                            )}

                            {/* Survey Tab */}
                            {isTabVisible('survey') && (
                                <Tab.Pane eventKey="survey">
                                    <div className="p-3">
                                        <EventSurveyComponent surveyDetails={eventData?.surveyDetails} formatTime={formatTime} />
                                    </div>
                                </Tab.Pane>
                            )}

                            {/* Categories Tab */}
                            {/* {isTabVisible('categories') && (
                                <Tab.Pane eventKey="categories">
                                    <div className="p-3">
                                        <h5 className="mb-4">Event Categories</h5>
                                        {renderCategories()}
                                    </div>
                                </Tab.Pane>
                            )} */}

                            {/* Programme Tab */}
                            {isTabVisible('programme') && (
                                <Tab.Pane eventKey="programme">
                                    <div className="p-3">
                                        <EventProgrammeComponent 
                                            programmeTracks={eventData?.programmeTracks}
                                            formatTime={formatTime}
                                        />
                                    </div>
                                </Tab.Pane>
                            )}

                            {/* Engagement Tab */}
                            {isTabVisible('engagement') && (
                                <Tab.Pane eventKey="engagement">
                                    <div className="p-3">
                                        <EventEngagementComponent 
                                            engagements={eventData?.engagements}
                                            formatTime={formatTime}
                                        />
                                    </div>
                                </Tab.Pane>
                            )}
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

            {/* Tab Visibility Management Modal */}
            <Modal show={showTabVisibilityModal} onHide={() => setShowTabVisibilityModal(false)} size="lg" centered>
                <Modal.Header className="border-0 pb-0">
                    <Modal.Title>Manage Event Tab Visibility</Modal.Title>
                </Modal.Header>
                <Modal.Body className="pt-4">
                    <div className="mb-4">
                        <p className="text-muted mb-0">
                            Control which tabs are visible to users on the frontend. Disabled tabs will be hidden from the event view.
                        </p>
                    </div>

                    <Row className="g-4">
                        <Col md={6}>
                            {/* Left Column - 5 tabs */}
                            <Form.Group className="mb-4">
                                <Form.Check
                                    type="checkbox"
                                    id="speakers-tab"
                                    label="Speakers Tab"
                                    checked={tabVisibilitySettings.speakers}
                                    onChange={(e) => handleTabVisibilityChange('speakers', e.target.checked)}
                                />
                            </Form.Group>

                            <Form.Group className="mb-4">
                                <Form.Check
                                    type="checkbox"
                                    id="documents-tab"
                                    label="Documents Tab"
                                    checked={tabVisibilitySettings.documents}
                                    onChange={(e) => handleTabVisibilityChange('documents', e.target.checked)}
                                />
                            </Form.Group>

                            <Form.Group className="mb-4">
                                <Form.Check
                                    type="checkbox"
                                    id="floorplan-tab"
                                    label="Floor Plan Tab"
                                    checked={tabVisibilitySettings.floorplan}
                                    onChange={(e) => handleTabVisibilityChange('floorplan', e.target.checked)}
                                />
                            </Form.Group>

                            <Form.Group className="mb-4">
                                <Form.Check
                                    type="checkbox"
                                    id="gallery-tab"
                                    label="Gallery Tab"
                                    checked={tabVisibilitySettings.gallery}
                                    onChange={(e) => handleTabVisibilityChange('gallery', e.target.checked)}
                                />
                            </Form.Group>

                            <Form.Group className="mb-4">
                                <Form.Check
                                    type="checkbox"
                                    id="stamps-tab"
                                    label="Event Stamps Tab"
                                    checked={tabVisibilitySettings.stamps}
                                    onChange={(e) => handleTabVisibilityChange('stamps', e.target.checked)}
                                />
                            </Form.Group>
                        </Col>

                        <Col md={6}>
                            {/* Right Column - 5 tabs */}
                            <Form.Group className="mb-4">
                                <Form.Check
                                    type="checkbox"
                                    id="survey-tab"
                                    label="Survey Tab"
                                    checked={tabVisibilitySettings.survey}
                                    onChange={(e) => handleTabVisibilityChange('survey', e.target.checked)}
                                />
                            </Form.Group>

                            <Form.Group className="mb-4">
                                <Form.Check
                                    type="checkbox"
                                    id="exhibitors-tab"
                                    label="Exhibitors Tab"
                                    checked={tabVisibilitySettings.exhibitors}
                                    onChange={(e) => handleTabVisibilityChange('exhibitors', e.target.checked)}
                                />
                            </Form.Group>

                            {/* <Form.Group className="mb-4">
                                <Form.Check
                                    type="checkbox"
                                    id="categories-tab"
                                    label="Categories Tab"
                                    checked={tabVisibilitySettings.categories}
                                    onChange={(e) => handleTabVisibilityChange('categories', e.target.checked)}
                                />
                            </Form.Group> */}

                            <Form.Group className="mb-4">
                                <Form.Check
                                    type="checkbox"
                                    id="programme-tab"
                                    label="Programme Tab"
                                    checked={tabVisibilitySettings.programme}
                                    onChange={(e) => handleTabVisibilityChange('programme', e.target.checked)}
                                />
                            </Form.Group>

                            <Form.Group className="mb-4">
                                <Form.Check
                                    type="checkbox"
                                    id="engagement-tab"
                                    label="Engagement Tab"
                                    checked={tabVisibilitySettings.engagement}
                                    onChange={(e) => handleTabVisibilityChange('engagement', e.target.checked)}
                                />
                            </Form.Group>

                            <Form.Group className="mb-4">
                                <Form.Check
                                    type="checkbox"
                                    id="admin-info-tab"
                                    label="Admin Info Tab"
                                    checked={tabVisibilitySettings.adminInfo}
                                    onChange={(e) => handleTabVisibilityChange('adminInfo', e.target.checked)}
                                />
                            </Form.Group>

                            <Form.Group className="mb-4">
                                <Form.Check
                                    type="checkbox"
                                    id="agenda-tab"
                                    label="Agenda Tab"
                                    checked={tabVisibilitySettings.agenda}
                                    onChange={(e) => handleTabVisibilityChange('agenda', e.target.checked)}
                                />
                            </Form.Group>
                        </Col>
                    </Row>
                </Modal.Body>
                <Modal.Footer className="border-0 pt-0 d-flex justify-content-between">
                    <Button variant="danger" onClick={() => setShowTabVisibilityModal(false)} className="px-4">
                        Cancel
                    </Button>
                    <Button variant="primary" onClick={handleUpdateTabVisibility} disabled={isUpdatingTabVisibility} className="px-4">
                        {isUpdatingTabVisibility ? (
                            <>
                                <i className="fas fa-spinner fa-spin me-2"></i>
                                Updating...
                            </>
                        ) : (
                            'Save'
                        )}
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );
};

export default ViewEventPage;
