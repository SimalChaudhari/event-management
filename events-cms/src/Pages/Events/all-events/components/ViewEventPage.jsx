import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Row, Col, Card, Badge, Nav, Tab, Container, Modal } from 'react-bootstrap';
import { useDispatch } from 'react-redux';
import { eventById } from '../../../../store/actions/eventActions';
import { API_URL, DUMMY_PATH_USER } from '../../../../configs/env';
import DateTimeFormatter from '../../../../components/dateTime/DateTimeFormatter';

// Google Maps API Key
const GOOGLE_API_KEY = 'AIzaSyAh43XIafkwl_7xaqeES90e8FQWqhN4DEc';

// Google Maps Component
const GoogleMap = ({ latitude, longitude, eventName, location }) => {
    const [mapLoaded, setMapLoaded] = useState(false);

    useEffect(() => {
        // Load Google Maps script
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_API_KEY}&libraries=places`;
        script.async = true;
        script.defer = true;
        script.onload = () => setMapLoaded(true);
        document.head.appendChild(script);

        return () => {
            document.head.removeChild(script);
        };
    }, []);

    useEffect(() => {
        if (mapLoaded && latitude && longitude) {
            const map = new window.google.maps.Map(document.getElementById('map'), {
                center: { lat: parseFloat(latitude), lng: parseFloat(longitude) },
                zoom: 15,
                mapTypeId: window.google.maps.MapTypeId.ROADMAP,
                styles: [
                    {
                        featureType: 'poi',
                        elementType: 'labels',
                        stylers: [{ visibility: 'off' }]
                    }
                ]
            });

            // Add marker
            new window.google.maps.Marker({
                position: { lat: parseFloat(latitude), lng: parseFloat(longitude) },
                map: map,
                title: eventName || 'Event Location',
                animation: window.google.maps.Animation.DROP
            });

            // Add info window
            const infoWindow = new window.google.maps.InfoWindow({
                content: `
                    <div style="padding: 10px; max-width: 200px;">
                        <h6 style="margin: 0 0 5px 0; color: #333;">${eventName || 'Event Location'}</h6>
                        <p style="margin: 0; color: #666; font-size: 12px;">${location || 'Event Venue'}</p>
                    </div>
                `
            });

            // Show info window by default
            infoWindow.open(
                map,
                new window.google.maps.Marker({
                    position: { lat: parseFloat(latitude), lng: parseFloat(longitude) },
                    map: map
                })
            );
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
        <div
            id="map"
            style={{
                height: '300px',
                width: '100%',
                borderRadius: '8px',
                border: '1px solid #e9ecef',
                overflow: 'hidden'
            }}
        >
            {!mapLoaded && (
                <div
                    style={{
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: '#f8f9fa'
                    }}
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
                    </Badge>
                ))}
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

    const renderSpeakers = () => {
        if (!eventData?.speakers?.length) {
            return <p>No speakers listed.</p>;
        }

        return (
            <div className="speakers-grid">
                {eventData.speakers.map((speaker) => (
                    <div key={speaker.id} className="speaker-card">
                        <div className="speaker-header">
                            <div className="speaker-image" onClick={() => handleSpeakerImageClick(speaker.speakerProfile)}>
                                <img
                                    src={speaker.speakerProfile ? `${API_URL}/${speaker.speakerProfile}` : DUMMY_PATH_USER}
                                    alt="speaker"
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

    // Render simple image grid for UI
    const renderImageGrid = () => {
        if (!eventData?.images || eventData.images.length === 0) {
            return <p>No images available.</p>;
        }

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
                            onClick={() => handleEventImageClick(index)}
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
                {eventData.documents.map((doc, index) => {
                    let documentSrc = `${API_URL}/${doc?.document?.replace(/\\/g, '/')}`;

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
                                    {typeof doc === 'string' ? doc.split('/').pop() : doc.name}
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

    // Render floor plan
    const renderFloorPlan = () => {
        if (!eventData?.floorPlan) {
            return <p>No floor plan available.</p>;
        }

        const floorPlanSrc = getImageSrc(eventData.floorPlan);

        return (
            <div style={{ textAlign: 'center' }}>
                <h5>Event Floor Plan</h5>
                <hr />
                <div
                    style={{
                        border: '2px solid #ddd',
                        borderRadius: '8px',
                        padding: '10px',
                        backgroundColor: '#f8f9fa'
                    }}
                >
                    <img
                        src={floorPlanSrc}
                        alt="Event Floor Plan"
                        style={{
                            maxWidth: '100%',
                            height: 'auto',
                            borderRadius: '4px'
                        }}
                        onError={(e) => {
                            console.error('Floor plan failed to load:', floorPlanSrc);
                            e.target.style.display = 'none';
                        }}
                    />
                </div>
                <Button variant="outline-primary" size="sm" className="mt-3" onClick={() => window.open(floorPlanSrc, '_blank')}>
                    <i className="fas fa-external-link-alt me-2"></i>
                    Open in New Tab
                </Button>
            </div>
        );
    };

    // Render galleries
    const renderGalleries = () => {
        if (!eventData?.galleries?.length) {
            return <p>No galleries available.</p>;
        }

        return (
            <div>
                {eventData.galleries.map((gallery, galleryIndex) => (
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
                                            style={{
                                                width: '100%',
                                                height: '150px',
                                                objectFit: 'cover'
                                            }}
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
        if (!eventData?.exhibitorsData?.exhibitors?.length) {
            return <p>No exhibitors available.</p>;
        }

        return (
            <div>
                {eventData.exhibitorsData.exhibitorDescription && (
                    <div className="mb-4">
                        <h6>Exhibitor Description</h6>
                        <p style={{ textAlign: 'justify', lineHeight: '1.6' }}>{eventData.exhibitorsData.exhibitorDescription}</p>
                        <hr />
                    </div>
                )}

                <div className="exhibitors-grid">
                    {eventData.exhibitorsData.exhibitors.map((exhibitor) => (
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
                                                    style={{
                                                        width: '100%',
                                                        height: '80px',
                                                        objectFit: 'cover',
                                                        borderRadius: '4px'
                                                    }}
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
        if (!eventData?.eventStamps) {
            return <p>No event stamps available.</p>;
        }

        return (
            <div>
                <h5>Event Stamps</h5>
                <hr />

                {eventData.eventStamps.images?.length > 0 && (
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
                            {eventData.eventStamps.images.map((image, index) => {
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
                                            style={{
                                                width: '100%',
                                                height: '150px',
                                                objectFit: 'cover'
                                            }}
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

                {eventData.eventStamps.description && (
                    <div className="mb-3 mt-3">
                        <h6>Description</h6>
                        <p style={{ textAlign: 'justify', lineHeight: '1.6' }}>{eventData.eventStamps.description}</p>
                    </div>
                )}
            </div>
        );
    };

    // Update the Location Tab to include map
    const renderLocationTab = () => (
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
                        <i className="fas fa-map-marker-alt text-primary mb-2" style={{ fontSize: '1.5rem' }}></i>
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
                        <i className="fas fa-dollar-sign text-success mb-2" style={{ fontSize: '1.5rem' }}></i>
                        <h6 className="mb-1" style={{ color: '#495057', fontSize: '0.9rem' }}>
                            Price
                        </h6>
                        <p className="mb-0" style={{ fontSize: '0.95rem', fontWeight: '500', color: '#28a745' }}>
                            {eventData.price} {eventData.currency}
                        </p>
                    </div>
                </Col>
            </Row>

            {/* Coordinates Section with Map */}
            {(eventData?.latitude || eventData?.longitude) && (
                <Row className="mt-4">
                    <Col xs={12}>
                        <h6>Event Location</h6>
                        <div className="mb-3">
                            <GoogleMap
                                latitude={eventData.latitude}
                                longitude={eventData.longitude}
                                eventName={eventData.name}
                                location={eventData.location}
                            />
                        </div>

                        {/* Coordinates Display */}
                        <div className="d-flex gap-3">
                            {eventData.latitude && (
                                <div className="text-center p-2" style={{ backgroundColor: '#f8f9fa', borderRadius: '6px', flex: 1 }}>
                                    <i className="fas fa-location-arrow text-primary"></i>
                                    <span className="ms-2">Latitude: {eventData.latitude}</span>
                                </div>
                            )}
                            {eventData.longitude && (
                                <div className="text-center p-2" style={{ backgroundColor: '#f8f9fa', borderRadius: '6px', flex: 1 }}>
                                    <i className="fas fa-location-arrow text-primary"></i>
                                    <span className="ms-2">Longitude: {eventData.longitude}</span>
                                </div>
                            )}
                        </div>

                        {/* Directions Button */}
                        <div className="mt-3 text-center">
                            <Button
                                variant="outline-primary"
                                size="sm"
                                onClick={() => {
                                    const url = `https://www.google.com/maps/dir/?api=1&destination=${eventData.latitude},${eventData.longitude}`;
                                    window.open(url, '_blank');
                                }}
                            >
                                <i className="fas fa-directions me-2"></i>
                                Get Directions
                            </Button>
                        </div>
                    </Col>
                </Row>
            )}
        </div>
    );

    return (
        <>
            <Container fluid className="mt-4">
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
                                    {eventData?.floorPlan && (
                                        <Nav.Item>
                                            <Nav.Link eventKey="floorplan">
                                                <i className="fas fa-map me-2" style={{ color: '#4680ff', marginRight: 6 }}></i>
                                                Floor Plan
                                            </Nav.Link>
                                        </Nav.Item>
                                    )}
                                    {eventData?.galleries?.length > 0 && (
                                        <Nav.Item>
                                            <Nav.Link eventKey="gallery">
                                                <i className="fas fa-photo-video me-2" style={{ color: '#4680ff', marginRight: 6 }}></i>
                                                Gallery
                                            </Nav.Link>
                                        </Nav.Item>
                                    )}
                                    {eventData?.exhibitorsData?.exhibitors?.length > 0 && (
                                        <Nav.Item>
                                            <Nav.Link eventKey="exhibitors">
                                                <i className="fas fa-store me-2" style={{ color: '#4680ff', marginRight: 6 }}></i>
                                                Exhibitors
                                            </Nav.Link>
                                        </Nav.Item>
                                    )}
                                    {eventData?.eventStamps && (
                                        <Nav.Item>
                                            <Nav.Link eventKey="stamps">
                                                <i className="fas fa-stamp me-2" style={{ color: '#4680ff', marginRight: 6 }}></i>
                                                Event Stamps
                                            </Nav.Link>
                                        </Nav.Item>
                                    )}
                                </Nav>
                            </Col>
                        </Row>

                        <Tab.Content>
                            {/* Details Tab */}
                            <Tab.Pane eventKey="details">
                                <div
                                    className="p-4"
                                    style={{ padding: '25px', background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)' }}
                                >
                                    <Row className="g-4">
                                        <Col md={6}>
                                            {/* Event Basic Details Card */}
                                            <div
                                                style={{
                                                    background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
                                                    borderRadius: '15px',
                                                    padding: '25px',
                                                    boxShadow: '0 8px 25px rgba(0,0,0,0.08)',
                                                    border: '1px solid rgba(70, 128, 255, 0.1)',
                                                    height: '100%'
                                                }}
                                            >
                                                <h6
                                                    style={{
                                                        color: '#4680ff',
                                                        fontWeight: '600',
                                                        marginBottom: '20px',
                                                        fontSize: '1.1rem',
                                                        borderBottom: '2px solid #e9ecef',
                                                        paddingBottom: '10px'
                                                    }}
                                                >
                                                    Basic Details
                                                </h6>

                                                <div className="info-item mb-3">
                                                    <div
                                                        style={{
                                                            fontSize: '0.85rem',
                                                            color: '#6c757d',
                                                            fontWeight: '500',

                                                            letterSpacing: '0.5px',
                                                            marginBottom: '5px'
                                                        }}
                                                    >
                                                        Event Name
                                                    </div>
                                                    <div
                                                        style={{
                                                            fontSize: '1.1rem',
                                                            color: '#2c3e50',
                                                            fontWeight: '600',
                                                            lineHeight: '1.4'
                                                        }}
                                                    >
                                                        {eventData.name}
                                                    </div>
                                                </div>

                                                <div className="info-item mb-3">
                                                    <div
                                                        style={{
                                                            fontSize: '0.85rem',
                                                            color: '#6c757d',
                                                            fontWeight: '500',

                                                            letterSpacing: '0.5px',
                                                            marginBottom: '5px'
                                                        }}
                                                    >
                                                        Event Type
                                                    </div>
                                                    <div
                                                        style={{
                                                            display: 'inline-block',
                                                            padding: '6px 12px',
                                                            backgroundColor: eventData.type ? '#e8f4fd' : '#f8f9fa',
                                                            color: eventData.type ? '#0066cc' : '#6c757d',
                                                            borderRadius: '20px',
                                                            fontSize: '0.9rem',
                                                            fontWeight: '500',
                                                            border: `1px solid ${eventData.type ? '#b3d9ff' : '#e9ecef'}`
                                                        }}
                                                    >
                                                        {eventData.type || 'N/A'}
                                                    </div>
                                                </div>

                                                <div className="info-item mb-3">
                                                    <div
                                                        style={{
                                                            fontSize: '0.85rem',
                                                            color: '#6c757d',
                                                            fontWeight: '500',

                                                            letterSpacing: '0.5px',
                                                            marginBottom: '5px'
                                                        }}
                                                    >
                                                        Start Date & Time
                                                    </div>
                                                    <div
                                                        style={{
                                                            padding: '10px 15px',
                                                            backgroundColor: '#e8f5e8',
                                                            borderLeft: '4px solid #28a745',
                                                            borderRadius: '0 8px 8px 0',
                                                            fontSize: '1rem',
                                                            color: '#155724',
                                                            fontWeight: '500'
                                                        }}
                                                    >
                                                        <DateTimeFormatter date={eventData.startDate} time={eventData.startTime} />
                                                    </div>
                                                </div>

                                                <div className="info-item mb-3">
                                                    <div
                                                        style={{
                                                            fontSize: '0.85rem',
                                                            color: '#6c757d',
                                                            fontWeight: '500',

                                                            letterSpacing: '0.5px',
                                                            marginBottom: '5px'
                                                        }}
                                                    >
                                                        End Date & Time
                                                    </div>
                                                    <div
                                                        style={{
                                                            padding: '10px 15px',
                                                            backgroundColor: '#fff3cd',
                                                            borderLeft: '4px solid #ffc107',
                                                            borderRadius: '0 8px 8px 0',
                                                            fontSize: '1rem',
                                                            color: '#856404',
                                                            fontWeight: '500'
                                                        }}
                                                    >
                                                        <DateTimeFormatter date={eventData.endDate} time={eventData.endTime} />
                                                    </div>
                                                </div>
                                            </div>
                                        </Col>

                                        <Col md={6}>
                                            {/* Event Description & Categories Card */}
                                            <div
                                                style={{
                                                    background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
                                                    borderRadius: '15px',
                                                    padding: '25px',
                                                    boxShadow: '0 8px 25px rgba(0,0,0,0.08)',
                                                    border: '1px solid rgba(70, 128, 255, 0.1)',
                                                    height: '100%'
                                                }}
                                            >
                                                <h6
                                                    style={{
                                                        color: '#4680ff',
                                                        fontWeight: '600',
                                                        marginBottom: '20px',
                                                        fontSize: '1.1rem',
                                                        borderBottom: '2px solid #e9ecef',
                                                        paddingBottom: '10px'
                                                    }}
                                                >
                                                    Categories & Description
                                                </h6>

                                                <div className="info-item">
                                                    <div
                                                        style={{
                                                            fontSize: '0.85rem',
                                                            color: '#6c757d',
                                                            fontWeight: '500',

                                                            letterSpacing: '0.5px',
                                                            marginBottom: '15px'
                                                        }}
                                                    >
                                                        Categories
                                                    </div>
                                                    <div
                                                        style={{
                                                            padding: '15px',
                                                            backgroundColor: '#f8f9fa',
                                                            borderRadius: '10px',
                                                            border: '1px solid #e9ecef',
                                                            minHeight: '80px'
                                                        }}
                                                    >
                                                        {renderCategories()}
                                                    </div>
                                                </div>

                                                <div className="info-item mb-4 mt-3">
                                                    <div
                                                        style={{
                                                            fontSize: '0.85rem',
                                                            color: '#6c757d',
                                                            fontWeight: '500',
                                                            letterSpacing: '0.5px',
                                                            marginBottom: '10px'
                                                        }}
                                                    >
                                                        Event Description
                                                    </div>
                                                    <div
                                                        style={{
                                                            backgroundColor: '#f8f9fa',
                                                            padding: '15px',

                                                            fontSize: '0.95rem',
                                                            color: '#495057',
                                                            lineHeight: '1.6',

                                                            fontStyle: eventData.description ? 'normal' : 'italic'
                                                        }}
                                                    >
                                                        {eventData.description || 'No description available'}
                                                    </div>
                                                </div>
                                            </div>
                                        </Col>
                                    </Row>
                                </div>
                            </Tab.Pane>

                            {/* Location & Pricing Tab */}
                            <Tab.Pane eventKey="location">{renderLocationTab()}</Tab.Pane>

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

                            {/* Floor Plan Tab */}
                            {eventData?.floorPlan && (
                                <Tab.Pane eventKey="floorplan">
                                    <div className="p-3">{renderFloorPlan()}</div>
                                </Tab.Pane>
                            )}

                            {/* Gallery Tab */}
                            {eventData?.galleries?.length > 0 && (
                                <Tab.Pane eventKey="gallery">
                                    <div className="p-3">{renderGalleries()}</div>
                                </Tab.Pane>
                            )}

                            {/* Exhibitors Tab */}
                            {eventData?.exhibitorsData?.exhibitors?.length > 0 && (
                                <Tab.Pane eventKey="exhibitors">
                                    <div className="p-3">{renderExhibitors()}</div>
                                </Tab.Pane>
                            )}

                            {/* Event Stamps Tab */}
                            {eventData?.eventStamps && (
                                <Tab.Pane eventKey="stamps">
                                    <div className="p-3">{renderEventStamps()}</div>
                                </Tab.Pane>
                            )}
                        </Tab.Content>
                    </Tab.Container>
                </div>
            </Container>

            {/* Event Images Modal */}
            <Modal
                show={showEventImageModal}
                onHide={() => setShowEventImageModal(false)}
                size="xl"
                centered
                style={{ backgroundColor: 'rgba(0,0,0,0.95)' }}
            >
                <Modal.Body>
                    {/* Close Button */}
                    <Button
                        variant="light"
                        size="sm"
                        onClick={() => setShowEventImageModal(false)}
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
                            link.href = getImageSrc(eventImages[currentEventImageIndex]);
                            link.download = `event-image-${currentEventImageIndex + 1}.jpg`;
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

                    {/* Navigation Arrows */}
                    {eventImages.length > 1 && (
                        <>
                            <Button
                                variant="light"
                                size="lg"
                                onClick={goToPreviousEventImage}
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
                                onClick={goToNextEventImage}
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

                    {/* Image Counter */}
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
                        {currentEventImageIndex + 1} / {eventImages.length}
                    </div>

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
                            src={getImageSrc(eventImages[currentEventImageIndex])}
                            alt={`Event Image ${currentEventImageIndex + 1}`}
                            style={{
                                maxWidth: '100%',
                                maxHeight: '100%',
                                objectFit: 'contain',
                                borderRadius: '8px'
                            }}
                            onError={(e) => {
                                console.error('Modal image failed to load:', getImageSrc(eventImages[currentEventImageIndex]));
                                e.target.style.display = 'none';
                            }}
                        />
                    </div>
                </Modal.Body>
            </Modal>

            {/* Gallery Images Modal */}
            <Modal
                show={showGalleryImageModal}
                onHide={() => setShowGalleryImageModal(false)}
                size="xl"
                centered
                style={{ backgroundColor: 'rgba(0,0,0,0.95)' }}
            >
                <Modal.Body>
                    {/* Close Button */}
                    <Button
                        variant="light"
                        size="sm"
                        onClick={() => setShowGalleryImageModal(false)}
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
                            link.href = getImageSrc(galleryImages[currentGalleryImageIndex]);
                            link.download = `${currentGalleryTitle}-image-${currentGalleryImageIndex + 1}.jpg`;
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

                    {/* Gallery Title */}
                    <div
                        style={{
                            position: 'fixed',
                            top: '20px',
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
                        {currentGalleryTitle}
                    </div>

                    {/* Navigation Arrows */}
                    {galleryImages.length > 1 && (
                        <>
                            <Button
                                variant="light"
                                size="lg"
                                onClick={goToPreviousGalleryImage}
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
                                onClick={goToNextGalleryImage}
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

                    {/* Image Counter */}
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
                        {currentGalleryImageIndex + 1} / {galleryImages.length}
                    </div>

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
                            src={getImageSrc(galleryImages[currentGalleryImageIndex])}
                            alt={`Gallery Image ${currentGalleryImageIndex + 1}`}
                            style={{
                                maxWidth: '100%',
                                maxHeight: '100%',
                                objectFit: 'contain',
                                borderRadius: '8px'
                            }}
                            onError={(e) => {
                                console.error('Gallery modal image failed to load:', getImageSrc(galleryImages[currentGalleryImageIndex]));
                                e.target.style.display = 'none';
                            }}
                        />
                    </div>
                </Modal.Body>
            </Modal>

            {/* Stamp Images Modal */}
            <Modal
                show={showStampImageModal}
                onHide={() => setShowStampImageModal(false)}
                size="xl"
                centered
                style={{ backgroundColor: 'rgba(0,0,0,0.95)' }}
            >
                <Modal.Body>
                    {/* Close Button */}
                    <Button
                        variant="light"
                        size="sm"
                        onClick={() => setShowStampImageModal(false)}
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
                            link.href = getImageSrc(stampImages[currentStampImageIndex]);
                            link.download = `event-stamp-${currentStampImageIndex + 1}.jpg`;
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

                    {/* Navigation Arrows */}
                    {stampImages.length > 1 && (
                        <>
                            <Button
                                variant="light"
                                size="lg"
                                onClick={goToPreviousStampImage}
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
                                onClick={goToNextStampImage}
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

                    {/* Image Counter */}
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
                        {currentStampImageIndex + 1} / {stampImages.length}
                    </div>

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
                            src={getImageSrc(stampImages[currentStampImageIndex])}
                            alt={`Event Stamp ${currentStampImageIndex + 1}`}
                            style={{
                                maxWidth: '100%',
                                maxHeight: '100%',
                                objectFit: 'contain',
                                borderRadius: '8px'
                            }}
                            onError={(e) => {
                                console.error('Stamp modal image failed to load:', getImageSrc(stampImages[currentStampImageIndex]));
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
        </>
    );
};

export default ViewEventPage;
