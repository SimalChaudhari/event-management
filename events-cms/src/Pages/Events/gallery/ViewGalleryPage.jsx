import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Row, Col, Card, Container, Nav, Tab, Modal, Alert } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import { getAllGalleries, getGalleryById } from '../../../store/actions/galleryActions';
import { EVENT_PATHS } from '../../../utils/constants';

const ViewGalleryPage = () => {
    const { id } = useParams();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [galleryData, setGalleryData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('images');
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
        navigate(EVENT_PATHS.ADD_GALLERY);
        return null;
    }
    // Image zoom function
    const handleImageClick = (imagePath) => {
        setCurrentImage(imagePath);
        setShowImageModal(true);
    };

    const tabStyle = {
        border: 'none',
        backgroundColor: 'transparent',
        color: '#6c757d',
        fontWeight: '500',
        padding: '12px 20px',
        borderRadius: '8px 8px 0 0',
        marginRight: '5px',
        transition: 'all 0.3s ease',
        fontSize: '14px'
    };

    const activeTabStyle = {
        ...tabStyle,
        backgroundColor: '#4680ff',
        color: 'white',
        fontWeight: '600'
    };

    return (
        <>
            <Container fluid className="mt-4">
                <div
                    className="mb-3"
                    style={{ backgroundColor: '#fff', borderRadius: '8px', padding: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
                >
                    <div className="d-flex justify-content-between align-items-center">
                        <h4 className="card-title">View Gallery</h4>
                        <Button variant="secondary" onClick={() => navigate('/media-manager/gallery')}>
                            <i style={{ marginRight: '10px' }} className="fas fa-arrow-left me-2"></i>
                            Back
                        </Button>
                    </div>
                </div>

                <div style={{ backgroundColor: '#fff', borderRadius: '8px', padding: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                    {/* Gallery Basic Info */}
                    <Card className="mb-4">
                        <Card.Body>
                            <Card.Title>
                                <i className="feather icon-image mr-2"></i>
                                Gallery Information
                            </Card.Title>
                            <hr />
                            <Row>
                                <Col xs={12} md={6} className="mb-3">
                                    <strong>Gallery Title:</strong><br />
                                    <span className="text-muted">{galleryData.title}</span>
                                </Col>
                             
                                <Col xs={12} md={6} className="mb-3">
                                    <strong>Total Images:</strong><br />
                                    <span className="badge badge-light-info">
                                        {galleryData.galleryImages?.length || 0} images
                                    </span>
                                </Col>
                                <Col xs={12} md={6} className="mb-3">
                                    <strong>Created Date:</strong><br />
                                    <span className="text-muted">
                                        {new Date(galleryData.createdAt).toLocaleDateString()}
                                    </span>
                                </Col>
                            </Row>
                            <hr />
                            <div className="d-flex gap-2">
                                <Button 
                                    variant="warning" 
                                    size="sm"
                                    onClick={() => navigate(`${EVENT_PATHS.EDIT_GALLERY}/${galleryData.id}`)}
                                >
                                    <i className="feather icon-edit mr-1"></i>
                                    Edit Gallery
                                </Button>
                            </div>
                        </Card.Body>
                    </Card>

                    {/* Tab Navigation */}
                    <div className="mb-4">
                        <Nav 
                            variant="tabs" 
                            className="flex-column flex-sm-row"
                            style={{
                                borderBottom: '2px solid #e9ecef',
                                gap: '5px'
                            }}
                        >
                            <Nav.Item>
                                <Nav.Link
                                    active={activeTab === 'images'}
                                    onClick={() => setActiveTab('images')}
                                    style={activeTab === 'images' ? activeTabStyle : tabStyle}
                                    className="text-center"
                                >
                                    <i className="feather icon-image mr-2"></i>
                                    <span>Gallery Images ({galleryData.galleryImages?.length || 0})</span>
                                </Nav.Link>
                            </Nav.Item>
                            <Nav.Item>
                                <Nav.Link
                                    active={activeTab === 'details'}
                                    onClick={() => setActiveTab('details')}
                                    style={activeTab === 'details' ? activeTabStyle : tabStyle}
                                    className="text-center"
                                >
                                    <i className="feather icon-info mr-2"></i>
                                    <span>Details</span>
                                </Nav.Link>
                            </Nav.Item>
                        </Nav>
                    </div>

                    {/* Tab Content */}
                    <Tab.Content>
                        {/* Images Tab */}
                        {activeTab === 'images' && (
                            <Tab.Pane active>
                                <Card>
                                    <Card.Body>
                                        <Card.Title>
                                            <i className="feather icon-image mr-2"></i>
                                            Gallery Images
                                        </Card.Title>
                                        <hr />
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
                                                                    border: '2px solid #4680ff',
                                                                    cursor: 'pointer',
                                                                    transition: 'transform 0.2s'
                                                                }}
                                                                onClick={() => handleImageClick(imagePath)}
                                                                onMouseEnter={(e) => (e.target.style.transform = 'scale(1.02)')}
                                                                onMouseLeave={(e) => (e.target.style.transform = 'scale(1)')}
                                                            />
                                                            <div
                                                                style={{
                                                                    position: 'absolute',
                                                                    top: '10px',
                                                                    right: '10px',
                                                                    backgroundColor: 'rgba(0,0,0,0.7)',
                                                                    color: 'white',
                                                                    padding: '5px 8px',
                                                                    borderRadius: '4px',
                                                                    fontSize: '12px',
                                                                    cursor: 'pointer'
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
                                                <p>Edit the gallery to add some images</p>
                                            </Alert>
                                        )}
                                    </Card.Body>
                                </Card>
                            </Tab.Pane>
                        )}

                        {/* Details Tab */}
                        {activeTab === 'details' && (
                            <Tab.Pane active>
                                <Card>
                                    <Card.Body>
                                        <Card.Title>
                                            <i className="feather icon-info mr-2"></i>
                                            Gallery Details
                                        </Card.Title>
                                        <hr />
                                        <Row>
                                            <Col xs={12} md={6} className="mb-3">
                                                <strong>Gallery ID:</strong><br />
                                                <span className="text-muted">{galleryData.id}</span>
                                            </Col>
                                            <Col xs={12} md={6} className="mb-3">
                                                <strong>Event ID:</strong><br />
                                                <span className="text-muted">{galleryData.eventId}</span>
                                            </Col>
                                            <Col xs={12} md={6} className="mb-3">
                                                <strong>Created:</strong><br />
                                                <span className="text-muted">
                                                    {new Date(galleryData.createdAt).toLocaleString()}
                                                </span>
                                            </Col>
                                            <Col xs={12} md={6} className="mb-3">
                                                <strong>Last Updated:</strong><br />
                                                <span className="text-muted">
                                                    {new Date(galleryData.updatedAt).toLocaleString()}
                                                </span>
                                            </Col>
                                        </Row>
                                    </Card.Body>
                                </Card>
                            </Tab.Pane>
                        )}
                    </Tab.Content>
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