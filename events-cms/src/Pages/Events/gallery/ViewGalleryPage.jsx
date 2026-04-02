import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Row, Col, Card, Modal, Badge } from 'react-bootstrap';
import { useDispatch } from 'react-redux';
import { getGalleryById } from '../../../store/actions/galleryActions';
import { MEDIA_MANAGER_PATHS, EVENT_PATHS } from '../../../utils/constants';
import { DUMMY_PATH_GALLERY, API_URL } from '../../../configs/env';
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
    
    const baseUrl = (API_URL || '').replace(/\/+$/, '');
    const getSingleImageDownloadUrl = (imagePath) =>
        baseUrl ? `${baseUrl}/api/gallery/download/image?path=${encodeURIComponent(imagePath)}` : '#';
    const getAllImagesDownloadUrl = () =>
        baseUrl && id ? `${baseUrl}/api/gallery/download/all/${id}` : '#';

    // Image zoom function
    const handleImageClick = (imagePath) => {
        setCurrentImage(imagePath);
        setShowImageModal(true);
    };

    // InfoField component matching EventBasicComponent pattern - responsive design
    const InfoField = ({ label, value, icon = null, colSize = 6 }) => (
        <Col xs={12} sm={12} md={colSize} className="mb-2" style={{ overflow: 'hidden' }}>
            <div style={{ 
                padding: '8px 12px',
                borderBottom: '1px solid #e9ecef',
                width: '100%',
                maxWidth: '100%',
                boxSizing: 'border-box'
            }}
            className="px-md-3 px-2 py-md-2 py-2"
            >
                {/* Mobile & Tablet: Label on top */}
                <div className="d-block d-md-none">
                    <div style={{ 
                        fontSize: '13px', 
                        fontWeight: '600', 
                        color: '#4680ff',
                        marginBottom: '4px',
                        wordBreak: 'break-word',
                        overflowWrap: 'break-word'
                    }}>
                        <span>{label}:</span>
                    </div>
                    <div style={{ 
                        fontSize: '14px', 
                        color: '#000000',
                        fontWeight: '400',
                        wordBreak: 'break-word',
                        overflowWrap: 'break-word',
                        width: '100%',
                        lineHeight: '1.5'
                    }}>
                        {value || 'N/A'}
                    </div>
                </div>
                {/* Desktop: Label and value side by side */}
                <div className="d-none d-md-flex align-items-start" style={{ width: '100%', minWidth: 0 }}>
                    <div style={{ 
                        minWidth: '140px',
                        maxWidth: '140px',
                        fontSize: '13px', 
                        fontWeight: '600', 
                        color: '#4680ff',
                        marginRight: '12px',
                        flexShrink: 0
                    }}>
                        <span style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>{label}:</span>
                    </div>
                    <div style={{ 
                        fontSize: '14px', 
                        color: '#000000',
                        fontWeight: '400',
                        flex: 1,
                        minWidth: 0,
                        wordBreak: 'break-word',
                        overflowWrap: 'break-word',
                        overflow: 'hidden'
                    }}>
                        {value || 'N/A'}
                    </div>
                </div>
            </div>
        </Col>
    );

    const content = (
        <Row className="m-0" style={{ width: '100%', maxWidth: '100%' }}>
            {/* Gallery Information Section */}
            <Col xs={12} className="mb-md-4 mb-3 p-0" style={{ overflow: 'hidden', width: '100%', maxWidth: '100%' }}>
                <h5 className="mb-md-3 mb-3 pb-md-2 pb-2" style={{ 
                    fontSize: '16px', 
                    fontWeight: '600', 
                    color: '#000000',
                    borderBottom: '2px solid #4680ff'
                }}>
                    <i className="fas fa-image mr-2" style={{ color: '#4680ff' }}></i>
                    Gallery Information
                </h5>
                
                <Row>
                    <InfoField 
                        label="Track Name" 
                        value={galleryData.trackTitle || galleryData.title || 'N/A'} 
                        icon="fas fa-image"
                        colSize={12}
                    />
                    <InfoField 
                        label="Event Name" 
                        value={galleryData.event?.name || 'Unknown Event'} 
                        icon="fas fa-calendar-alt"
                        colSize={6}
                    />
                    <InfoField 
                        label="Total Images" 
                        value={
                            <Badge bg="info" style={{ fontSize: '12px', padding: '6px 12px', fontWeight: '600' }}>
                                {galleryData.galleryImages?.length || 0} images
                            </Badge>
                        } 
                        icon="fas fa-images"
                        colSize={6}
                    />
                    <InfoField 
                        label="Location" 
                        value={galleryData.event?.location || 'N/A'} 
                        icon="fas fa-map-marker-alt"
                        colSize={6}
                    />
                    <InfoField 
                        label="Venue" 
                        value={galleryData.event?.venue || 'N/A'} 
                        icon="fas fa-building"
                        colSize={6}
                    />
                                    <InfoField 
                                        label="Created Date" 
                                        value={new Date(galleryData.createdAt).toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })} 
                                        icon="fas fa-calendar"
                                        colSize={6}
                                    />
                                    {galleryData.galleryImages?.length > 0 && (
                                        <>
                                            <InfoField 
                                                label="Single image download URL" 
                                                value={
                                                    <a href={getSingleImageDownloadUrl(galleryData.galleryImages[0])} target="_blank" rel="noopener noreferrer" style={{ wordBreak: 'break-all', fontSize: '13px' }}>
                                                        {getSingleImageDownloadUrl(galleryData.galleryImages[0])}
                                                    </a>
                                                }
                                                colSize={12}
                                            />
                                            <InfoField 
                                                label="All images download URL" 
                                                value={
                                                    <a href={getAllImagesDownloadUrl()} target="_blank" rel="noopener noreferrer" style={{ wordBreak: 'break-all', fontSize: '13px' }}>
                                                        {getAllImagesDownloadUrl()}
                                                    </a>
                                                }
                                                colSize={12}
                                            />
                                        </>
                                    )}
                                </Row>
            </Col>

            {/* Gallery Images Section */}
            <Col xs={12} className="mb-md-4 mb-3 p-0" style={{ overflow: 'hidden', width: '100%', maxWidth: '100%' }}>
                <h5 className="mb-md-3 mb-3 pb-md-2 pb-2" style={{ 
                    fontSize: '16px', 
                    fontWeight: '600', 
                    color: '#000000',
                    borderBottom: '2px solid #4680ff'
                }}>
                    <i className="fas fa-images mr-2" style={{ color: '#4680ff' }}></i>
                    Gallery Images
                </h5>
                
                {galleryData.galleryImages && galleryData.galleryImages.length > 0 ? (
                    <Row style={{ marginLeft: '-8px', marginRight: '-8px' }}>
                        {galleryData.galleryImages.map((imagePath, index) => (
                            <Col lg={3} md={4} sm={6} xs={12} key={index} style={{ paddingLeft: '8px', paddingRight: '8px', marginBottom: '16px' }}>
                                <div 
                                    style={{ 
                                        position: 'relative',
                                        borderRadius: '8px',
                                        overflow: 'hidden',
                                        cursor: 'pointer',
                                        transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                                    }}
                                    onClick={() => handleImageClick(imagePath)}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = 'scale(1.02)';
                                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = 'scale(1)';
                                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                                    }}
                                >
                                    <ImageWithFallback
                                        src={baseUrl ? `${baseUrl}/${imagePath}` : imagePath}
                                        alt={`Gallery Image ${index + 1}`}
                                        style={{
                                            width: '100%',
                                            height: '220px',
                                            objectFit: 'cover',
                                            display: 'block',
                                            transition: 'transform 0.3s ease'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.target.style.transform = 'scale(1.05)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.target.style.transform = 'scale(1)';
                                        }}
                                    />
                                    <div style={{ position: 'absolute', top: '12px', right: '12px', display: 'flex', gap: '6px', zIndex: 10 }}>
                                        <a
                                            href={getSingleImageDownloadUrl(imagePath)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            download
                                            style={{
                                                backgroundColor: 'rgba(0,0,0,0.75)',
                                                color: 'white',
                                                width: '36px',
                                                height: '36px',
                                                borderRadius: '50%',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: '16px',
                                                transition: 'all 0.3s ease',
                                                textDecoration: 'none'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.backgroundColor = 'rgba(70, 128, 255, 0.9)';
                                                e.currentTarget.style.transform = 'scale(1.1)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.75)';
                                                e.currentTarget.style.transform = 'scale(1)';
                                            }}
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <i className="fas fa-download"></i>
                                        </a>
                                        <div
                                            style={{
                                                backgroundColor: 'rgba(0,0,0,0.75)',
                                                color: 'white',
                                                width: '36px',
                                                height: '36px',
                                                borderRadius: '50%',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: '16px',
                                                cursor: 'pointer',
                                                transition: 'all 0.3s ease'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.backgroundColor = 'rgba(70, 128, 255, 0.9)';
                                                e.currentTarget.style.transform = 'scale(1.1)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.75)';
                                                e.currentTarget.style.transform = 'scale(1)';
                                            }}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleImageClick(imagePath);
                                            }}
                                        >
                                            <i className="fas fa-search-plus"></i>
                                        </div>
                                    </div>
                                </div>
                            </Col>
                        ))}
                    </Row>
                ) : (
                    <Row>
                        <Col xs={12} className="text-center">
                            <div style={{ 
                                position: 'relative', 
                                display: 'inline-block', 
                                maxWidth: '400px', 
                                width: '100%',
                                marginTop: '20px'
                            }}>
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
                                        fontSize: '14px',
                                        fontWeight: '500'
                                    }}
                                >
                                    <i className="fas fa-images me-2"></i>
                                    No images in this gallery
                                </div>
                            </div>
                        </Col>
                    </Row>
                )}
            </Col>
        </Row>
    );

    return (
        <div className="p-2 bg-light">
            {/* Header Section */}
            <div className="mb-md-4 mb-3">
                <div className="d-none d-md-block">
                    <Card style={{ 
                        backgroundColor: '#fff', 
                        borderRadius: '8px', 
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        border: '1px solid #e9ecef',
                        overflow: 'hidden',
                        marginBottom: '24px'
                    }}>
                        <Card.Body style={{ padding: '20px' }}>
                            <div className="d-flex justify-content-between align-items-center">
                                <div>
                                    <h4 style={{ 
                                        margin: 0, 
                                        color: '#2c3e50',
                                        fontWeight: '600'
                                    }}>
                                        <i className="fas fa-images mr-2" style={{ color: '#4680ff' }}></i>
                                        View Gallery
                                    </h4>
                                </div>
                                <div className="d-flex flex-wrap" style={{ gap: '8px' }}>
                                    {galleryData.galleryImages?.length > 0 && (
                                        <Button
                                            variant="outline-primary"
                                            as="a"
                                            href={getAllImagesDownloadUrl()}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{ padding: '8px 16px', fontWeight: '500' }}
                                        >
                                            <i className="fas fa-download mr-2"></i>
                                            Download all
                                        </Button>
                                    )}
                                    <Button 
                                        variant="primary" 
                                        onClick={() => navigate(`${EVENT_PATHS.EDIT_GALLERY}?galleryId=${id}&eventId=${galleryData.eventId}`)}
                                        style={{ padding: '8px 16px', fontWeight: '500' }}
                                    >
                                        <i className="fas fa-edit mr-2"></i>
                                        Edit
                                    </Button>
                                    <Button 
                                        variant="secondary" 
                                        onClick={() => navigate(-1)}
                                        style={{ padding: '8px 16px', fontWeight: '500' }}
                                    >
                                        <i className="fas fa-arrow-left mr-2"></i>
                                        Back
                                    </Button>
                                </div>
                            </div>
                        </Card.Body>
                    </Card>
                </div>
                <div className="d-block d-md-none px-2 py-2">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <div>
                            <h4 style={{ 
                                margin: 0, 
                                color: '#2c3e50',
                                fontWeight: '600',
                                fontSize: '18px'
                            }}>
                                <i className="fas fa-images mr-2" style={{ color: '#4680ff' }}></i>
                                View Gallery
                            </h4>
                        </div>
                        <div className="d-flex flex-wrap" style={{ gap: '8px' }}>
                            {galleryData.galleryImages?.length > 0 && (
                                <Button
                                    variant="outline-primary"
                                    size="sm"
                                    as="a"
                                    href={getAllImagesDownloadUrl()}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{ padding: '6px 12px', fontWeight: '500' }}
                                >
                                    <i className="fas fa-download mr-2"></i>
                                    Download all
                                </Button>
                            )}
                            <Button 
                                variant="primary" 
                                size="sm"
                                onClick={() => navigate(`${EVENT_PATHS.EDIT_GALLERY}?galleryId=${id}&eventId=${galleryData.eventId}`)}
                                style={{ padding: '6px 12px', fontWeight: '500' }}
                            >
                                <i className="fas fa-edit mr-2"></i>
                                Edit
                            </Button>
                            <Button 
                                variant="secondary" 
                                size="sm"
                                onClick={() => navigate(-1)}
                                style={{ padding: '6px 12px', fontWeight: '500' }}
                            >
                                <i className="fas fa-arrow-left mr-2"></i>
                                Back
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Section */}
            <div className="d-none d-md-block">
                <Card style={{ 
                    backgroundColor: '#fff', 
                    borderRadius: '8px', 
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    border: '1px solid #e9ecef',
                    overflow: 'hidden'
                }}>
                    <Card.Body style={{ padding: '24px', overflow: 'hidden', width: '100%', maxWidth: '100%' }}>
                        {content}
                    </Card.Body>
                </Card>
            </div>
            <div className="d-block d-md-none px-2 py-2">
                {content}
            </div>

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
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        <i className="fas fa-times"></i>
                    </Button>

                    {/* Download Button */}
                    <Button
                        variant="light"
                        size="sm"
                        as="a"
                        href={getSingleImageDownloadUrl(currentImage)}
                        target="_blank"
                        rel="noopener noreferrer"
                        download
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
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
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
                            minHeight: '70vh',
                            padding: '60px 40px 40px 40px'
                        }}
                    >
                        <ImageWithFallback
                            src={baseUrl ? `${baseUrl}/${currentImage}` : currentImage}
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
        </div>
    );
};

export default ViewGalleryPage;