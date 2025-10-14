import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Row, Col, Card, Container, Nav, Tab, Modal } from 'react-bootstrap';
import { useDispatch } from 'react-redux';
import { speakerById } from '../../store/actions/speakerActions';
import { API_URL, DUMMY_PATH } from '../../configs/env';
import { SPEAKER_PATHS } from '../../utils/constants';
import { formatPhoneDisplay } from '../../utils/phoneFormatter';

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

    const imageUrl = speakerData.profilePicture ? `${API_URL}/${speakerData.profilePicture}` : DUMMY_PATH;

    // Speaker image zoom function
    const handleSpeakerImageClick = (profilePicture) => {
        if (profilePicture) {
            setCurrentSpeakerImage(profilePicture);
            setShowSpeakerImageModal(true);
        } else {
            setShowSpeakerImageModal(false);
        }
    };

    return (
        <>
            <Container fluid className="mt-4">
                {/* Header */}
                <div
                    className="mb-3"
                    style={{ backgroundColor: '#fff', borderRadius: '8px', padding: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
                >
                    <div className="d-flex justify-content-between align-items-center">
                        <h4 className="card-title">Speaker Details</h4>
                        <Button variant="secondary" onClick={() => navigate(SPEAKER_PATHS.LIST_SPEAKERS)}>
                            <i style={{ marginRight: '10px' }} className="fas fa-arrow-left me-2"></i>
                            Back
                        </Button>
                    </div>
                </div>

                {/* Product-like Layout */}
                <div style={{ backgroundColor: '#fff', borderRadius: '8px', padding: '30px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                    <Row>
                        {/* Left Side - Image */}
                        <Col lg={5} md={6} className="mb-4">
                            <div className="text-center">
                                {speakerData.profilePicture && (
                                    <div style={{ position: 'relative', display: 'inline-block' }}>
                                        <img 
                                            src={imageUrl} 
                                            alt="speaker" 
                                            style={{
                                                width: '100%',
                                                maxWidth: '400px',
                                                height: '400px',
                                                objectFit: 'cover',
                                                borderRadius: '12px',
                                                border: '2px solid #e9ecef',
                                                cursor: 'pointer',
                                                transition: 'transform 0.2s, box-shadow 0.2s'
                                            }}
                                            onClick={() => handleSpeakerImageClick(speakerData.profilePicture)}
                                            onMouseEnter={(e) => {
                                                e.target.style.transform = 'scale(1.02)';
                                                e.target.style.boxShadow = '0 8px 25px rgba(0,0,0,0.15)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.target.style.transform = 'scale(1)';
                                                e.target.style.boxShadow = 'none';
                                            }}
                                        />
                                        <div
                                            style={{
                                                position: 'absolute',
                                                top: '15px',
                                                right: '15px',
                                                backgroundColor: 'rgba(0,0,0,0.7)',
                                                color: 'white',
                                                padding: '8px',
                                                borderRadius: '50%',
                                                fontSize: '14px',
                                                cursor: 'pointer',
                                                transition: 'background-color 0.2s'
                                            }}
                                            onClick={() => handleSpeakerImageClick(speakerData.profilePicture)}
                                            onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(0,0,0,0.9)'}
                                            onMouseLeave={(e) => e.target.style.backgroundColor = 'rgba(0,0,0,0.7)'}
                                        >
                                            <i className="fas fa-search-plus"></i>
                                        </div>
                                    </div>
                                )}
                                {!speakerData.profilePicture && (
                                    <img 
                                        src={imageUrl} 
                                        alt="speaker" 
                                        style={{
                                            width: '100%',
                                            maxWidth: '400px',
                                            height: '400px',
                                            objectFit: 'cover',
                                            borderRadius: '12px',
                                            border: '2px solid #e9ecef'
                                        }} 
                                    />
                                )}
                                
                                {/* Thumbnail */}
                                <div className="mt-3">
                                    <img 
                                        src={imageUrl} 
                                        alt="speaker thumbnail" 
                                        style={{
                                            width: '80px',
                                            height: '80px',
                                            objectFit: 'cover',
                                            borderRadius: '8px',
                                            border: '2px solid #e9ecef'
                                        }} 
                                    />
                                </div>
                                
                                {/* Navigation indicator */}
                                <div className="mt-2 text-muted" style={{ fontSize: '14px' }}>
                                    1/1
                                </div>
                            </div>
                        </Col>

                        {/* Right Side - Details */}
                        <Col lg={7} md={6}>
                            {/* Speaker Title and Basic Info */}
                            <div className="mb-4">
                                <h2 style={{ color: '#333', marginBottom: '10px', fontWeight: '600' }}>
                                    {speakerData.name}
                                </h2>
                                <p style={{ color: '#666', fontSize: '16px', marginBottom: '15px' }}>
                                    {speakerData.position || 'Speaker'} at {speakerData.companyName || 'N/A'}
                                </p>
                                
                                {/* Contact Info */}
                                <div className="mb-4">
                                    <div className="mb-2">
                                        <i className="fas fa-envelope mr-2" style={{ color: '#4680ff' }}></i>
                                        <span style={{ color: '#666' }}>{speakerData.email || 'N/A'}</span>
                                    </div>
                                    <div className="mb-2">
                                        <i className="fa fa-address-card mr-2" style={{ color: '#4680ff' }}></i>
                                        <span style={{ color: '#666' }}>{formatPhoneDisplay(speakerData.mobile)}</span>
                                    </div>
                                    {speakerData.location && (
                                        <div className="mb-2">
                                            <i className="fas fa-map-marker-alt mr-2" style={{ color: '#4680ff' }}></i>
                                            <span style={{ color: '#666' }}>{speakerData.location}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Detailed Information Sections */}
                            <div>
                                {/* Professional Details */}
                                <div className="mb-4 mt-5">
                                    <h5 style={{ color: '#333', borderBottom: '2px solid #e9ecef', paddingBottom: '8px', marginBottom: '15px' }}>
                                        <i className="fas fa-briefcase mr-2" style={{ color: '#4680ff' }}></i>
                                        Professional Information
                                    </h5>
                                    <Row>
                                        <Col xs={12} md={6} className="mb-3">
                                            <strong style={{ color: '#333' }}>Position:</strong><br />
                                            <span style={{ color: '#666' }}>{speakerData.position || 'N/A'}</span>
                                        </Col>
                                        <Col xs={12} md={6} className="mb-3">
                                            <strong style={{ color: '#333' }}>Company:</strong><br />
                                            <span style={{ color: '#666' }}>{speakerData.companyName || 'N/A'}</span>
                                        </Col>
                                    </Row>
                                </div>

                                {/* Location Details */}
                                {speakerData.location && (
                                    <div className="mb-4">
                                        <h5 style={{ color: '#333', borderBottom: '2px solid #e9ecef', paddingBottom: '8px', marginBottom: '15px' }}>
                                            <i className="fas fa-map-marker-alt mr-2" style={{ color: '#4680ff' }}></i>
                                            Location Details
                                        </h5>
                                        <div>
                                            <strong style={{ color: '#333' }}>Location:</strong><br />
                                            <span style={{ color: '#666' }}>{speakerData.location}</span>
                                        </div>
                                    </div>
                                )}

                                {/* Description */}
                                {speakerData.description && (
                                    <div className="mb-4">
                                        <h5 style={{ color: '#333', borderBottom: '2px solid #e9ecef', paddingBottom: '8px', marginBottom: '15px' }}>
                                            <i className="fas fa-sticky-note mr-2" style={{ color: '#4680ff' }}></i>
                                            About Speaker
                                        </h5>
                                        <p style={{ color: '#666', lineHeight: '1.6', marginBottom: '0' }}>
                                            {speakerData.description}
                                        </p>
                                    </div>
                                )}

                                {/* Additional Information */}
                                <div>
                                    <h5 style={{ color: '#333', borderBottom: '2px solid #e9ecef', paddingBottom: '8px', marginBottom: '15px' }}>
                                        <i className="fas fa-info-circle mr-2" style={{ color: '#4680ff' }}></i>
                                        Additional Information
                                    </h5>
                                    <Row>
                                        <Col xs={12} md={6} className="mb-3">
                                            <strong style={{ color: '#333' }}>Status:</strong><br />
                                            <span style={{ color: '#28a745' }}>{speakerData.isVerify ? 'Active' : 'Inactive'}</span>
                                        </Col>
                                       
                                    </Row>
                                </div>
                            </div>
                        </Col>
                    </Row>
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