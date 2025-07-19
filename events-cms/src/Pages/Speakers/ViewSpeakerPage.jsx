import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Row, Col, Card, Container, Nav, Tab, Modal } from 'react-bootstrap';
import { useDispatch } from 'react-redux';
import { speakerById } from '../../store/actions/speakerActions';
import { API_URL, DUMMY_PATH } from '../../configs/env';

const ViewSpeakerPage = () => {
    const { id } = useParams();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [speakerData, setSpeakerData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('professional');

    // For image modal
    const [showSpeakerImageModal, setShowSpeakerImageModal] = useState(false);
    const [currentSpeakerImage, setCurrentSpeakerImage] = useState('');

    useEffect(() => {
        const loadSpeakerData = async () => {
            try {
                const response = await dispatch(speakerById(id));
                if (response?.data) {
                    setSpeakerData(response.data);
                }
                setLoading(false);
            } catch (error) {
                console.error('Error loading speaker data:', error);
                setLoading(false);
            }
        };
        
        if (id) {
            loadSpeakerData();
        }
    }, [id, dispatch]);

    if (loading) return <div>Loading...</div>;
    if (!speakerData) return <div>No speaker found.</div>;

    const imageUrl = speakerData.speakerProfile ? `${API_URL}/${speakerData.speakerProfile}` : DUMMY_PATH;

    // Speaker image zoom function
    const handleSpeakerImageClick = (speakerProfile) => {
        if (speakerProfile) {
            setCurrentSpeakerImage(speakerProfile);
            setShowSpeakerImageModal(true);
        } else {
            setShowSpeakerImageModal(false);
        }
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
                        <h4 className="card-title">View Speaker</h4>
                        <Button variant="secondary" onClick={() => navigate('/speakers')}>
                            <i style={{ marginRight: '10px' }} className="fas fa-arrow-left me-2"></i>
                            Back to Speakers
                        </Button>
                    </div>
                </div>

                <div style={{ backgroundColor: '#fff', borderRadius: '8px', padding: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                    {/* Speaker Image and Basic Info */}
                    <Card className="mb-4">
                        <Card.Body>
                            <Card.Title>
                                <i className="feather icon-user mr-2"></i>
                                Speaker Information
                            </Card.Title>
                            <hr />
                            <Row className="align-items-center">
                                <Col xs={12} md={4} className="text-center mb-3 mb-md-0">
                                    {speakerData.speakerProfile && (
                                        <div style={{ position: 'relative', display: 'inline-block' }}>
                                            <img 
                                                src={imageUrl} 
                                                alt="speaker" 
                                                style={{
                                                    width: '100%',
                                                    maxWidth: '200px',
                                                    height: '200px',
                                                    objectFit: 'cover',
                                                    borderRadius: '10%',
                                                    border: '3px solid #4680ff',
                                                    cursor: 'pointer',
                                                    transition: 'transform 0.2s'
                                                }}
                                                onClick={() => handleSpeakerImageClick(speakerData.speakerProfile)}
                                                onMouseEnter={(e) => (e.target.style.transform = 'scale(1.04)')}
                                                onMouseLeave={(e) => (e.target.style.transform = 'scale(1)')}
                                            />
                                            <div
                                                style={{
                                                    position: 'absolute',
                                                    top: '10px',
                                                    right: '10px',
                                                    backgroundColor: 'rgba(0,0,0,0.7)',
                                                    color: 'white',
                                                    padding: '5px',
                                                    borderRadius: '50%',
                                                    fontSize: '12px',
                                                    cursor: 'pointer'
                                                }}
                                                onClick={() => handleSpeakerImageClick(speakerData.speakerProfile)}
                                            >
                                                <i className="fas fa-search-plus"></i>
                                            </div>
                                        </div>
                                    )}
                                    {!speakerData.speakerProfile && (
                                        <img 
                                            src={imageUrl} 
                                            alt="speaker" 
                                            style={{
                                                width: '100%',
                                                maxWidth: '200px',
                                                height: '200px',
                                                objectFit: 'cover',
                                                borderRadius: '10%',
                                                border: '3px solid #4680ff'
                                            }} 
                                        />
                                    )}
                                </Col>
                                <Col xs={12} md={8}>
                                    <div className="row">
                                        <div className="col-12 mb-2">
                                            <strong>Name:</strong> {speakerData.name}
                                        </div>
                                        <div className="col-12 mb-2">
                                            <strong>Email:</strong> {speakerData.email || 'N/A'}
                                        </div>
                                        <div className="col-12 mb-2">
                                            <strong>Mobile:</strong> {speakerData.mobile || 'N/A'}
                                        </div>
                                    </div>
                                </Col>
                            </Row>
                        </Card.Body>
                    </Card>

                    {/* Responsive Tab Navigation */}
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
                                    active={activeTab === 'professional'}
                                    onClick={() => setActiveTab('professional')}
                                    style={activeTab === 'professional' ? activeTabStyle : tabStyle}
                                    className="text-center"
                                >
                                    <i className="feather icon-briefcase mr-2"></i>
                                    <span className="d-none d-sm-inline">Professional</span>
                                    <span className="d-sm-none">Work</span>
                                </Nav.Link>
                            </Nav.Item>
                            <Nav.Item>
                                <Nav.Link
                                    active={activeTab === 'location'}
                                    onClick={() => setActiveTab('location')}
                                    style={activeTab === 'location' ? activeTabStyle : tabStyle}
                                    className="text-center"
                                >
                                    <i className="feather icon-map-pin mr-2"></i>
                                    <span className="d-none d-sm-inline">Location</span>
                                    <span className="d-sm-none">Location</span>
                                </Nav.Link>
                            </Nav.Item>
                            {speakerData.description && (
                                <Nav.Item>
                                    <Nav.Link
                                        active={activeTab === 'description'}
                                        onClick={() => setActiveTab('description')}
                                        style={activeTab === 'description' ? activeTabStyle : tabStyle}
                                        className="text-center"
                                    >
                                        <i className="feather icon-file-text mr-2"></i>
                                        <span className="d-none d-sm-inline">Description</span>
                                        <span className="d-sm-none">About</span>
                                    </Nav.Link>
                                </Nav.Item>
                            )}
                        </Nav>
                    </div>

                    {/* Tab Content */}
                    <Tab.Content>
                        {/* Professional Tab */}
                        {activeTab === 'professional' && (
                            <Tab.Pane active>
                                <Card>
                                    <Card.Body>
                                        <Card.Title>
                                            <i className="feather icon-briefcase mr-2"></i>
                                            Professional Details
                                        </Card.Title>
                                        <hr />
                                        <Row>
                                            <Col xs={12} md={6} className="mb-3">
                                                <strong>Position:</strong><br />
                                                <span className="text-muted">{speakerData.position || 'N/A'}</span>
                                            </Col>
                                            <Col xs={12} md={6} className="mb-3">
                                                <strong>Company:</strong><br />
                                                <span className="text-muted">{speakerData.companyName || 'N/A'}</span>
                                            </Col>
                                        </Row>
                                    </Card.Body>
                                </Card>
                            </Tab.Pane>
                        )}

                        {/* Location Tab */}
                        {activeTab === 'location' && (
                            <Tab.Pane active>
                                <Card>
                                    <Card.Body>
                                        <Card.Title>
                                            <i className="feather icon-map-pin mr-2"></i>
                                            Location Details
                                        </Card.Title>
                                        <hr />
                                        <Row>
                                            <Col xs={12}>
                                                <strong>Location:</strong><br />
                                                <span className="text-muted">{speakerData.location || 'N/A'}</span>
                                            </Col>
                                        </Row>
                                    </Card.Body>
                                </Card>
                            </Tab.Pane>
                        )}

                        {/* Description Tab */}
                        {activeTab === 'description' && speakerData.description && (
                            <Tab.Pane active>
                                <Card>
                                    <Card.Body>
                                        <Card.Title>
                                            <i className="feather icon-file-text mr-2"></i>
                                            Description
                                        </Card.Title>
                                        <hr />
                                        <Row>
                                            <Col xs={12}>
                                                <p className="text-muted" style={{ lineHeight: '1.6' }}>
                                                    {speakerData.description}
                                                </p>
                                            </Col>
                                        </Row>
                                    </Card.Body>
                                </Card>
                            </Tab.Pane>
                        )}
                    </Tab.Content>
                </div>
            </Container>

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

export default ViewSpeakerPage; 