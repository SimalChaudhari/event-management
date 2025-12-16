import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Row, Col, Card, Container, Modal, Alert, Badge } from 'react-bootstrap';
import { useDispatch } from 'react-redux';
import { getGalleryById } from '../../../store/actions/galleryActions';
import { MEDIA_MANAGER_PATHS, EVENT_PATHS } from '../../../utils/constants';
import { DUMMY_PATH_GALLERY } from '../../../configs/env';
import ImageWithFallback from '../../../components/common/ImageWithFallback';

const ViewGalleryPage = () => {
    const { id } = useParams();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [galleryData, setGalleryData] = useState(null);
    const [loading, setLoading] = useState(true);
    // For image modal
    const [showImageModal, setShowImageModal] = useState(false);
    const [currentImage, setCurrentImage] = useState('');
    // For responsive design
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        const loadData = async () => {
            try {
                const response = await dispatch(getGalleryById(id));
                setGalleryData(response.data);
                setLoading(false);
            } catch (error) {
                console.error('Error loading data:', error);
                setLoading(false);
            }
        };
        
        if (id) {
            loadData();
        }
    }, [id, dispatch]);


    if (loading) return <div>Loading...</div>;
    if (!galleryData) {
        navigate(MEDIA_MANAGER_PATHS.GALLERY);
        return null;
    }
    
    // Image zoom function
    const handleImageClick = (imagePath) => {
        setCurrentImage(imagePath);
        setShowImageModal(true);
    };

    // Get colorful icons
    const getIconColor = (iconClass) => {
        const colorMap = {
            'fas fa-image': '#007bff',
            'fas fa-calendar': '#28a745',
            'fas fa-calendar-alt': '#dc3545',
            'fas fa-images': '#17a2b8',
            'fas fa-map-marker-alt': '#e74c3c',
            'fas fa-building': '#6f42c1',
            'fas fa-globe': '#17a2b8'
        };
        return colorMap[iconClass] || '#495057';
    };

    // InfoCard component for consistent styling
    const InfoCard = ({ title, iconClass, children, borderColor = '#4680ff' }) => (
        <div
            className="mb-4"
            style={{
                backgroundColor: '#fff',
                borderRadius: '8px',
                padding: isMobile ? '15px' : '20px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                border: '1px solid #e9ecef',
                borderLeft: `4px solid ${borderColor}`
            }}
        >
            <div style={{ padding: isMobile ? '12px' : '24px' }}>
                <h5
                    style={{
                        fontSize: isMobile ? '16px' : '18px',
                        fontWeight: '600',
                        color: '#2c3e50',
                        marginBottom: isMobile ? '15px' : '20px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        borderBottom: `2px solid ${borderColor}`,
                        paddingBottom: '8px',
                        flexWrap: 'wrap'
                    }}
                >
                    <i className={iconClass} style={{ fontSize: isMobile ? '16px' : '20px', color: getIconColor(iconClass) }}></i>
                    <span>{title}</span>
                </h5>
                {children}
            </div>
        </div>
    );

    const InfoField = ({ label, value, iconClass = null }) => (
        <div
            className="info-field-container mb-2 py-2"
            style={{
                borderBottom: '1px solid #f1f1f1',
                display: 'flex',
                flexDirection: isMobile ? 'column' : 'row',
                justifyContent: isMobile ? 'flex-start' : 'space-between',
                alignItems: isMobile ? 'flex-start' : 'center',
                gap: isMobile ? '8px' : '0'
            }}
        >
            <span 
                className="field-label" 
                style={{ 
                    fontWeight: 'bold', 
                    color: '#495057', 
                    fontSize: isMobile ? '13px' : '14px',
                    minWidth: isMobile ? 'auto' : '140px'
                }}
            >
                {iconClass && <i className={iconClass} style={{ marginRight: '8px', color: getIconColor(iconClass) }}></i>}
                {label}:
            </span>
            <span 
                className="field-value" 
                style={{ 
                    color: '#212529', 
                    fontWeight: 'normal', 
                    fontSize: isMobile ? '14px' : '15px', 
                    textAlign: isMobile ? 'left' : 'right', 
                    flex: 1,
                    wordBreak: 'break-word'
                }}
            >
                {value}
            </span>
        </div>
    );

    return (
        <>
            <Container fluid className="mt-4">
                <div
                    className="mb-3"
                    style={{ 
                        backgroundColor: '#fff', 
                        borderRadius: '8px', 
                        padding: isMobile ? '15px' : '20px', 
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)' 
                    }}
                >
                    <div className={`d-flex ${isMobile ? 'flex-column' : 'justify-content-between'} align-items-${isMobile ? 'start' : 'center'} gap-3`}>
                        <h4 
                            className="card-title mb-0"
                            style={{ 
                                fontSize: isMobile ? '18px' : '24px',
                                fontWeight: '600'
                            }}
                        >
                            View Gallery
                        </h4>
                        <div 
                            className='d-flex'
                            style={{ gap: '5px', marginTop: isMobile ? '5PX' : '' }}
                        >
                            <Button 
                                variant="primary" 
                                onClick={() => navigate(`${EVENT_PATHS.EDIT_GALLERY}?galleryId=${id}&eventId=${galleryData.eventId}`)}
                                className={isMobile ? 'flex-fill' : ''}
                                size={isMobile ? 'sm' : undefined}
                                style={{ marginRight: isMobile ? '0' : '5px' }}
                            >
                                <i className="fas fa-edit me-2"></i>
                                Edit
                            </Button>
                            <Button 
                                variant="secondary" 
                                onClick={() => navigate(-1)}
                                className={isMobile ? 'flex-fill' : ''}
                                size={isMobile ? 'sm' : undefined}
                            >
                                <i className="fas fa-arrow-left me-2"></i>
                                Back
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="p-2 bg-light" style={{ padding: isMobile ? '8px' : '16px' }}>
                    {/* Gallery Information Section */}
                    <InfoCard title="Gallery Information" iconClass="fas fa-image" borderColor="#3498db">
                        <Row>
                            <Col lg={6} md={12} className="mb-3 mb-md-0">
                                <div style={{ fontSize: isMobile ? '14px' : '15px', lineHeight: '1.6' }}>
                                    <InfoField 
                                        label="Gallery Title" 
                                        value={galleryData.title} 
                                        iconClass="fas fa-image" 
                                    />
                                    <InfoField 
                                        label="Event Name" 
                                        value={galleryData.event?.name || 'Unknown Event'} 
                                        iconClass="fas fa-calendar-alt" 
                                    />
                                    <InfoField 
                                        label="Total Images" 
                                        value={
                                            <Badge bg="info" className="px-3 py-1" style={{ fontSize: isMobile ? '12px' : '14px' }}>
                                                {galleryData.galleryImages?.length || 0} images
                                            </Badge>
                                        } 
                                        iconClass="fas fa-images" 
                                    />
                                </div>
                            </Col>
                            <Col lg={6} md={12}>
                                <div style={{ fontSize: isMobile ? '14px' : '15px', lineHeight: '1.6' }}>
                                    <InfoField 
                                        label="Location" 
                                        value={galleryData.event?.location || 'N/A'} 
                                        iconClass="fas fa-map-marker-alt" 
                                    />
                                    <InfoField 
                                        label="Venue" 
                                        value={galleryData.event?.venue || 'N/A'} 
                                        iconClass="fas fa-building" 
                                    />
                                    <InfoField 
                                        label="Created Date" 
                                        value={new Date(galleryData.createdAt).toLocaleDateString('en-GB', {
                                            day: '2-digit',
                                            month: 'short',
                                            year: 'numeric'
                                        })} 
                                        iconClass="fas fa-calendar" 
                                    />
                                </div>
                            </Col>
                        </Row>
                    </InfoCard> 

                    {/* Gallery Images Section */}
                    <InfoCard title="Gallery Images" iconClass="fas fa-images" borderColor="#28a745">
                        {galleryData.galleryImages && galleryData.galleryImages.length > 0 ? (
                            <Row className="g-3">
                                {galleryData.galleryImages.map((imagePath, index) => (
                                    <Col lg={3} md={4} sm={6} xs={12} key={index}>
                                        <div style={{ position: 'relative' }}>
                                            <ImageWithFallback
                                                src={`${process.env.REACT_APP_API_URL}/${imagePath}`}
                                                alt={`Gallery Image ${index + 1}`}
                                                onClick={() => handleImageClick(imagePath)}
                                                style={{
                                                    width: '100%',
                                                    height: isMobile ? '180px' : '200px',
                                                    objectFit: 'cover',
                                                    borderRadius: '8px',
                                                    border: '2px solid #28a745',
                                                    cursor: 'pointer',
                                                    transition: 'transform 0.2s',
                                                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                                                }}
                                            />
                                            <div
                                                style={{
                                                    position: 'absolute',
                                                    top: isMobile ? '8px' : '10px',
                                                    right: isMobile ? '8px' : '10px',
                                                    backgroundColor: 'rgba(0,0,0,0.7)',
                                                    color: 'white',
                                                    padding: isMobile ? '6px 8px' : '8px 10px',
                                                    borderRadius: '50%',
                                                    fontSize: isMobile ? '12px' : '14px',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s'
                                                }}
                                                onClick={() => handleImageClick(imagePath)}
                                            >
                                                <i className="fas fa-search-plus"></i>
                                            </div>
                                        </div>
                                    </Col>
                                ))}
                            </Row>
                        ) : (
                            <Row>
                                <Col xs={12} className="text-center">
                                    <div style={{ position: 'relative', display: 'inline-block', maxWidth: '400px', width: '100%' }}>
                                        <ImageWithFallback
                                            src={DUMMY_PATH_GALLERY}
                                            alt="No Gallery Images"
                                            style={{
                                                width: '100%',
                                                height: '300px',
                                                objectFit: 'cover',
                                                borderRadius: '8px',
                                                border: '2px solid #e9ecef',
                                                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                                            }}
                                        />
                                        <div
                                            style={{
                                                position: 'absolute',
                                                bottom: '20px',
                                                left: '50%',
                                                transform: 'translateX(-50%)',
                                                backgroundColor: 'rgba(0,0,0,0.7)',
                                                color: 'white',
                                                padding: '12px 24px',
                                                borderRadius: '8px',
                                                fontSize: '14px'
                                            }}
                                        >
                                            <i className="fas fa-images me-2"></i>
                                            No images in this gallery
                                        </div>
                                    </div>
                                </Col>
                            </Row>
                        )}
                    </InfoCard>
                </div>
            </Container>

            {/* Image Modal */}
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
                    {/* Close Button */}
                    <Button
                        variant="light"
                        size="sm"
                        onClick={() => setShowImageModal(false)}
                        style={{
                            position: 'fixed',
                            top: isMobile ? '10px' : '20px',
                            right: isMobile ? '10px' : '20px',
                            borderRadius: '50%',
                            width: isMobile ? '35px' : '40px',
                            height: isMobile ? '35px' : '40px',
                            zIndex: 1000,
                            backgroundColor: 'rgba(0,0,0,0.7)',
                            border: 'none',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        <i className="fas fa-times" style={{ fontSize: isMobile ? '14px' : '16px' }}></i>
                    </Button>

                    {/* Download Button */}
                    <Button
                        variant="light"
                        size="sm"
                        onClick={() => {
                            const link = document.createElement('a');
                            link.href = `${process.env.REACT_APP_API_URL}/${currentImage}`;
                            link.download = `gallery-image.jpg`;
                            link.click();
                        }}
                        style={{
                            position: 'fixed',
                            top: isMobile ? '10px' : '20px',
                            left: isMobile ? '10px' : '20px',
                            borderRadius: '50%',
                            width: isMobile ? '35px' : '40px',
                            height: isMobile ? '35px' : '40px',
                            zIndex: 1000,
                            backgroundColor: 'rgba(0,0,0,0.7)',
                            border: 'none',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        <i className="fas fa-download" style={{ fontSize: isMobile ? '14px' : '16px' }}></i>
                    </Button>

                    {/* Image Container */}
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            minHeight: isMobile ? '70vh' : '90vh',
                            padding: isMobile ? '40px 20px' : '60px 80px 80px 80px'
                        }}
                    >
                        <ImageWithFallback
                            src={`${process.env.REACT_APP_API_URL}/${currentImage}`}
                            alt="Gallery"
                            style={{
                                maxWidth: '100%',
                                maxHeight: '100%',
                                objectFit: 'contain',
                                borderRadius: '8px'
                            }}
                        />
                    </div>
                </Modal.Body>
            </Modal>
        </>
    );
};

export default ViewGalleryPage;