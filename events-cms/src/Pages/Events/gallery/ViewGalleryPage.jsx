import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Row, Col, Card, Container, Modal, Alert, Badge } from 'react-bootstrap';
import { useDispatch } from 'react-redux';
import { getGalleryById } from '../../../store/actions/galleryActions';
import { MEDIA_MANAGER_PATHS, EVENT_PATHS } from '../../../utils/constants';

const ViewGalleryPage = () => {
    const { id } = useParams();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [galleryData, setGalleryData] = useState(null);
    const [loading, setLoading] = useState(true);
    // For image modal
    const [showImageModal, setShowImageModal] = useState(false);
    const [currentImage, setCurrentImage] = useState('');

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
                padding: '20px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                border: '1px solid #e9ecef',
                borderLeft: `4px solid ${borderColor}`
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
                        borderBottom: `2px solid ${borderColor}`,
                        paddingBottom: '8px'
                    }}
                >
                    <i className={iconClass} style={{ fontSize: '20px', color: getIconColor(iconClass) }}></i>
                    {title}
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
                justifyContent: 'space-between',
                alignItems: 'center'
            }}
        >
            <span className="field-label" style={{ fontWeight: 'bold', color: '#495057', fontSize: '14px', minWidth: '140px' }}>
                {iconClass && <i className={iconClass} style={{ marginRight: '8px', color: getIconColor(iconClass) }}></i>}
                {label}:
            </span>
            <span className="field-value" style={{ color: '#212529', fontWeight: 'normal', fontSize: '15px', textAlign: 'right', flex: 1 }}>
                {value}
            </span>
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
                        <h4 className="card-title">View Gallery</h4>
                        <div className="d-flex gap-2">
                            <Button variant="primary" onClick={() => navigate(`${EVENT_PATHS.EDIT_GALLERY}?galleryId=${id}&eventId=${galleryData.eventId}`)}>
                                <i style={{ marginRight: '10px' }} className="fas fa-edit me-2"></i>
                                Edit Gallery
                            </Button>
                            <Button variant="secondary" onClick={() => navigate(MEDIA_MANAGER_PATHS.GALLERY)}>
                                <i style={{ marginRight: '10px' }} className="fas fa-arrow-left me-2"></i>
                                Back
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="p-2 bg-light">
                    {/* Gallery Information Section */}
                    <InfoCard title="Gallery Information" iconClass="fas fa-image" borderColor="#3498db">
                        <Row>
                            <Col lg={6} md={12}>
                                <div style={{ fontSize: '15px', lineHeight: '1.6' }}>
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
                                            <Badge bg="info" className="px-3 py-1">
                                                {galleryData.galleryImages?.length || 0} images
                                            </Badge>
                                        } 
                                        iconClass="fas fa-images" 
                                    />
                                </div>
                            </Col>
                            <Col lg={6} md={12}>
                                <div style={{ fontSize: '15px', lineHeight: '1.6' }}>
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
                            <Row>
                                {galleryData.galleryImages.map((imagePath, index) => (
                                    <Col lg={3} md={4} sm={6} xs={12} key={index} className="mb-3">
                                        <div style={{ position: 'relative' }}>
                                            <img 
                                                src={`${process.env.REACT_APP_API_URL}/${imagePath}`} 
                                                alt="Gallery" 
                                                style={{
                                                    width: '100%',
                                                    height: '200px',
                                                    objectFit: 'cover',
                                                    borderRadius: '8px',
                                                    border: '2px solid #28a745',
                                                    cursor: 'pointer',
                                                    transition: 'transform 0.2s',
                                                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                                                }}
                                                onClick={() => handleImageClick(imagePath)}
                                                onMouseEnter={(e) => {
                                                    e.target.style.transform = 'scale(1.05)';
                                                    e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.25)';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.target.style.transform = 'scale(1)';
                                                    e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
                                                }}
                                            />
                                            <div
                                                style={{
                                                    position: 'absolute',
                                                    top: '10px',
                                                    right: '10px',
                                                    backgroundColor: 'rgba(0,0,0,0.7)',
                                                    color: 'white',
                                                    padding: '8px 10px',
                                                    borderRadius: '50%',
                                                    fontSize: '14px',
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
                            <Alert variant="info" className="text-center">
                                <i className="fas fa-info-circle fa-2x mb-3"></i>
                                <h5>No images in this gallery</h5>
                                <p className="text-muted">This gallery doesn't have any images yet</p>
                            </Alert>
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
                            link.href = `${process.env.REACT_APP_API_URL}/${currentImage}`;
                            link.download = `gallery-image.jpg`;
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