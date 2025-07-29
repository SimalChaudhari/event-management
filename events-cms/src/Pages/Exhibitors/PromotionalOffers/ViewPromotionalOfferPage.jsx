import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Row, Col, Card, Container, Nav, Tab, Modal, Alert } from 'react-bootstrap';
import { useDispatch } from 'react-redux';
import { getPromotionalOfferById } from '../../../store/actions/promotionalOfferActions';
import { EXHIBITOR_PATHS } from '../../../utils/constants';
import { API_URL } from '../../../configs/env';

const ViewPromotionalOfferPage = () => {
    const { id } = useParams();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [offerData, setOfferData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('details');
    // For image modal
    const [showImageModal, setShowImageModal] = useState(false);
    const [currentImage, setCurrentImage] = useState('');

    useEffect(() => {
        const loadData = async () => {
            try {
                const response = await dispatch(getPromotionalOfferById(id));
                setOfferData(response.data);
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
    if (!offerData) {
        navigate(EXHIBITOR_PATHS.LIST_EXHIBITORS);
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

    const goBackToOffers = () => {
        navigate(`${EXHIBITOR_PATHS.PROMOTIONAL_OFFERS}?exhibitorId=${offerData.exhibitorId}`);
    };

    return (
        <>
            <Container fluid className="mt-4">
                <div
                    className="mb-3"
                    style={{ backgroundColor: '#fff', borderRadius: '8px', padding: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
                >
                    <div className="d-flex justify-content-between align-items-center">
                        <h4 className="card-title">
                            <i className="feather icon-gift mr-2"></i>
                            View Promotional Offer
                        </h4>
                        <Button variant="secondary" onClick={goBackToOffers}>
                            <i style={{ marginRight: '10px' }} className="fas fa-arrow-left me-2"></i>
                            Back to Offers
                        </Button>
                    </div>
                </div>

                <div style={{ backgroundColor: '#fff', borderRadius: '8px', padding: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                    {/* Offer Basic Info */}
                    <Card className="mb-4">
                        <Card.Body>
                            <Card.Title>
                                <i className="feather icon-info mr-2"></i>
                                Offer Information
                            </Card.Title>
                            <hr />
                            <Row>
                                <Col xs={12} md={6} className="mb-3">
                                    <strong>Offer Title:</strong><br />
                                    <span className="text-muted">{offerData.title}</span>
                                </Col>
                                <Col xs={12} md={6} className="mb-3">
                                    <strong>Company:</strong><br />
                                    <span className="text-muted">{offerData.companyName}</span>
                                </Col>
                                <Col xs={12} md={6} className="mb-3">
                                    <strong>Valid Date:</strong><br />
                                    <span className="badge badge-light-info">{offerData.validDate}</span>
                                </Col>
                                <Col xs={12} md={6} className="mb-3">
                                    <strong>Status:</strong><br />
                                    <span className={`badge ${offerData.isActive ? 'badge-light-success' : 'badge-light-danger'}`}>
                                        {offerData.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                </Col>
                                <Col xs={12} className="mb-3">
                                    <strong>Description:</strong><br />
                                    <span className="text-muted">{offerData.description}</span>
                                </Col>
                            </Row>
                            <hr />
                            <div className="d-flex gap-2">
                                <Button 
                                    variant="warning" 
                                    size="sm"
                                    onClick={() => navigate(`${EXHIBITOR_PATHS.EDIT_PROMOTIONAL_OFFER}/${offerData.id}`)}
                                >
                                    <i className="feather icon-edit mr-1"></i>
                                    Edit Offer
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
                                    active={activeTab === 'details'}
                                    onClick={() => setActiveTab('details')}
                                    style={activeTab === 'details' ? activeTabStyle : tabStyle}
                                    className="text-center"
                                >
                                    <i className="feather icon-info mr-2"></i>
                                    <span>Offer Details</span>
                                </Nav.Link>
                            </Nav.Item>
                            <Nav.Item>
                                <Nav.Link
                                    active={activeTab === 'image'}
                                    onClick={() => setActiveTab('image')}
                                    style={activeTab === 'image' ? activeTabStyle : tabStyle}
                                    className="text-center"
                                >
                                    <i className="feather icon-image mr-2"></i>
                                    <span>Offer Image</span>
                                </Nav.Link>
                            </Nav.Item>
                            <Nav.Item>
                                <Nav.Link
                                    active={activeTab === 'exhibitor'}
                                    onClick={() => setActiveTab('exhibitor')}
                                    style={activeTab === 'exhibitor' ? activeTabStyle : tabStyle}
                                    className="text-center"
                                >
                                    <i className="feather icon-user mr-2"></i>
                                    <span>Exhibitor Info</span>
                                </Nav.Link>
                            </Nav.Item>
                        </Nav>
                    </div>

                    {/* Tab Content */}
                    <Tab.Content>
                        {/* Details Tab */}
                        {activeTab === 'details' && (
                            <Tab.Pane active>
                                <Card>
                                    <Card.Body>
                                        <Card.Title>
                                            <i className="feather icon-info mr-2"></i>
                                            Detailed Information
                                        </Card.Title>
                                        <hr />
                                        <Row>
                                            <Col xs={12} md={6} className="mb-3">
                                                <strong>Offer ID:</strong><br />
                                                <span className="text-muted">{offerData.id}</span>
                                            </Col>
                                            <Col xs={12} md={6} className="mb-3">
                                                <strong>Exhibitor ID:</strong><br />
                                                <span className="text-muted">{offerData.exhibitorId}</span>
                                            </Col>
                                            <Col xs={12} md={6} className="mb-3">
                                                <strong>Created:</strong><br />
                                                <span className="text-muted">
                                                    {new Date(offerData.createdAt).toLocaleString()}
                                                </span>
                                            </Col>
                                            <Col xs={12} md={6} className="mb-3">
                                                <strong>Last Updated:</strong><br />
                                                <span className="text-muted">
                                                    {new Date(offerData.updatedAt).toLocaleString()}
                                                </span>
                                            </Col>
                                        </Row>
                                    </Card.Body>
                                </Card>
                            </Tab.Pane>
                        )}

                        {/* Image Tab */}
                        {activeTab === 'image' && (
                            <Tab.Pane active>
                                <Card>
                                    <Card.Body>
                                        <Card.Title>
                                            <i className="feather icon-image mr-2"></i>
                                            Offer Image
                                        </Card.Title>
                                        <hr />
                                        {offerData.image ? (
                                            <div className="text-center">
                                                <img 
                                                    src={`${API_URL}/${offerData.image}`} 
                                                    alt="Offer" 
                                                    style={{
                                                        maxWidth: '100%',
                                                        maxHeight: '400px',
                                                        objectFit: 'contain',
                                                        borderRadius: '8px',
                                                        border: '2px solid #4680ff',
                                                        cursor: 'pointer',
                                                        transition: 'transform 0.2s'
                                                    }}
                                                    onClick={() => handleImageClick(offerData.image)}
                                                    onMouseEnter={(e) => (e.target.style.transform = 'scale(1.02)')}
                                                    onMouseLeave={(e) => (e.target.style.transform = 'scale(1)')}
                                                />
                                                <div className="mt-3">
                                                    <Button 
                                                        variant="outline-primary"
                                                        onClick={() => handleImageClick(offerData.image)}
                                                    >
                                                        <i className="fas fa-search-plus mr-2"></i>
                                                        View Full Size
                                                    </Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <Alert variant="info" className="text-center">
                                                <i className="fas fa-info-circle fa-2x mb-3"></i>
                                                <h5>No image available</h5>
                                                <p>This offer doesn't have an image</p>
                                            </Alert>
                                        )}
                                    </Card.Body>
                                </Card>
                            </Tab.Pane>
                        )}

                        {/* Exhibitor Tab */}
                        {activeTab === 'exhibitor' && (
                            <Tab.Pane active>
                                <Card>
                                    <Card.Body>
                                        <Card.Title>
                                            <i className="feather icon-user mr-2"></i>
                                            Exhibitor Information
                                        </Card.Title>
                                        <hr />
                                        {offerData.exhibitor ? (
                                            <Row>
                                                <Col xs={12} md={6} className="mb-3">
                                                    <strong>Exhibitor Name:</strong><br />
                                                    <span className="text-muted">{offerData.exhibitor.name}</span>
                                                </Col>
                                                <Col xs={12} md={6} className="mb-3">
                                                    <strong>Email:</strong><br />
                                                    <span className="text-muted">{offerData.exhibitor.email}</span>
                                                </Col>
                                                <Col xs={12} md={6} className="mb-3">
                                                    <strong>Mobile:</strong><br />
                                                    <span className="text-muted">{offerData.exhibitor.mobile}</span>
                                                </Col>
                                                <Col xs={12} md={6} className="mb-3">
                                                    <strong>Address:</strong><br />
                                                    <span className="text-muted">{offerData.exhibitor.address}</span>
                                                </Col>
                                            </Row>
                                        ) : (
                                            <Alert variant="warning">
                                                Exhibitor information not available
                                            </Alert>
                                        )}
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
                            link.href = `${API_URL}/${currentImage}`;
                            link.download = `offer-image.jpg`;
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
                            src={`${API_URL}/${currentImage}`}
                            alt="Offer"
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

export default ViewPromotionalOfferPage; 