import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Button, Row, Col, Card, Badge, Tab, Nav } from 'react-bootstrap';
import { getTracksByEvent, getAllTracks } from '../../store/actions/programmeActions';
import { PROGRAMME_PATHS } from '../../utils/constants';

const ViewTrackPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const location = useLocation();

    const queryParams = new URLSearchParams(location.search);
    const eventIdFromUrl = queryParams.get('eventId');

    const { tracks, loading } = useSelector((state) => state.programme);
    const [track, setTrack] = useState(null);
    const [showFullDescription, setShowFullDescription] = useState(false);

    useEffect(() => {
        if (eventIdFromUrl) {
            dispatch(getTracksByEvent(eventIdFromUrl));
        } else {
            dispatch(getAllTracks());
        }
    }, [dispatch, eventIdFromUrl]);

    useEffect(() => {
        console.log('Tracks from Redux:', tracks);
        console.log('Track ID from URL:', id);
        if (tracks && tracks.length > 0) {
            const foundTrack = tracks.find(t => t.id === id);
            console.log('Found Track:', foundTrack);
            setTrack(foundTrack);
        }
    }, [tracks, id]);


    // InfoCard component for consistent styling
    const InfoCard = ({ title, icon, children, borderColor = "#4680ff", className = "" }) => (
        <div className={`mb-4 ${className}`} style={{ 
            backgroundColor: '#fff', 
            borderRadius: '8px', 
            padding: '20px', 
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            border: '1px solid #e9ecef',
            borderLeft: `4px solid ${borderColor}`
        }}>
            <div style={{ padding: '24px' }}>
                <h5 style={{ 
                    fontSize: '18px', 
                    fontWeight: '600', 
                    color: '#2c3e50',
                    marginBottom: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    borderBottom: `2px solid ${borderColor}`,
                    paddingBottom: '8px',
                    position: 'relative'
                }}>
                    <span style={{ fontSize: '20px' }}>{icon}</span>
                    {title}
                </h5>
                {children}
            </div>
        </div>
    );

    if (loading) {
        return (
            <div className="p-2 bg-light">
                <div className="text-center py-5">
                    <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
                        <span className="sr-only">Loading...</span>
                    </div>
                    <p className="mt-3 text-muted h5">Loading track details...</p>
                </div>
            </div>
        );
    }


    return (
        <div className="p-2 bg-light">
            {/* Header Section */}
            <div className="mb-4">
                <div style={{ 
                    backgroundColor: '#fff', 
                    borderRadius: '8px', 
                    padding: '20px', 
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    marginBottom: '24px',
                    borderTop: '4px solid #3498db'
                }}>
                    <div className="d-flex justify-content-between align-items-center">
                        <div>
                            <h4 style={{ 
                                margin: 0, 
                                color: '#2c3e50',
                                fontWeight: '600'
                            }}>
                                📂 Track Profile
                            </h4>
                            <p style={{ 
                                margin: '8px 0 0 0', 
                                color: '#6c757d',
                                fontSize: '14px'
                            }}>
                                View detailed track information and related data
                            </p>
                        </div>
                        <Button 
                            variant="secondary" 
                            onClick={() => navigate(PROGRAMME_PATHS.LIST_PROGRAMMES)}
                            style={{ 
                                padding: '8px 16px',
                                fontWeight: '500'
                            }}
                        >
                            <i className="feather icon-arrow-left mr-2"></i>
                            Back
                        </Button>
                    </div>
                </div>
            </div>

            {track ? (
                <InfoCard title="Track Information" icon="📋" borderColor="#e74c3c">
                    <div style={{
                        backgroundColor: '#fff',
                        padding: '20px',
                        borderRadius: '8px',
                        border: '1px solid #e9ecef',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}>
                        <Row>
                            <Col md={6}>
                                <div className="mb-4">
                                    <div className="d-flex align-items-center mb-2">
                                        <i className="feather icon-folder text-primary mr-2"></i>
                                        <label className="text-muted small mb-0">Track Name</label>
                                    </div>
                                    <h5 className="text-dark font-weight-bold mb-0">{track.title}</h5>
                                </div>
                            </Col>
                            <Col md={6}>
                                <div className="mb-4">
                                    <div className="d-flex align-items-center mb-2">
                                        <i className="feather icon-check-circle text-success mr-2"></i>
                                        <label className="text-muted small mb-0">Status</label>
                                    </div>
                                    <Badge 
                                        bg="success" 
                                        style={{ fontSize: '14px', padding: '6px 12px', fontWeight: 'bold' }}
                                    >
                                        <i className="feather icon-check mr-1"></i>
                                        Active
                                    </Badge>
                                </div>
                            </Col>
                            {track.description && (
                                <Col md={12}>
                                    <div className="mb-4">
                                        <div className="d-flex align-items-center mb-2">
                                            <i className="feather icon-file-text text-info mr-2"></i>
                                            <label className="text-muted small mb-0">Description</label>
                                        </div>
                                        <div className="bg-light p-3 rounded">
                                            <p className="text-dark mb-0" style={{
                                                fontSize: '14px',
                                                lineHeight: '1.6',
                                                textAlign: 'justify'
                                            }}>
                                                {showFullDescription || track.description.length <= 150
                                                    ? track.description 
                                                    : (
                                                        <>
                                                            {track.description.substring(0, 150)}...
                                                            <span 
                                                                onClick={() => setShowFullDescription(!showFullDescription)}
                                                                style={{
                                                                    color: '#007bff',
                                                                    textDecoration: 'underline',
                                                                    cursor: 'pointer',
                                                                    fontSize: '14px',
                                                                    fontWeight: '500',
                                                                    marginLeft: '5px'
                                                                }}
                                                            >
                                                                Read More
                                                            </span>
                                                        </>
                                                    )}
                                                {showFullDescription && track.description.length > 150 && (
                                                    <span 
                                                        onClick={() => setShowFullDescription(!showFullDescription)}
                                                        style={{
                                                            color: '#007bff',
                                                            textDecoration: 'underline',
                                                            cursor: 'pointer',
                                                            fontSize: '14px',
                                                            fontWeight: '500',
                                                            marginLeft: '5px'
                                                        }}
                                                    >
                                                        Show Less
                                                    </span>
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                </Col>
                            )}
                            <Col md={6}>
                                <div className="mb-3">
                                    <div className="d-flex align-items-center mb-2">
                                        <i className="feather icon-calendar text-warning mr-2"></i>
                                        <label className="text-muted small mb-0">Created At</label>
                                    </div>
                                    <div className="bg-light p-2 rounded">
                                        <span className="text-dark font-weight-medium">
                                            {track.createdAt ? new Date(track.createdAt).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            }) : 'N/A'}
                                        </span>
                                    </div>
                                </div>
                            </Col>
                            <Col md={6}>
                                <div className="mb-3">
                                    <div className="d-flex align-items-center mb-2">
                                        <i className="feather icon-clock text-danger mr-2"></i>
                                        <label className="text-muted small mb-0">Updated At</label>
                                    </div>
                                    <div className="bg-light p-2 rounded">
                                        <span className="text-dark font-weight-medium">
                                            {track.updatedAt ? new Date(track.updatedAt).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            }) : 'N/A'}
                                        </span>
                                    </div>
                                </div>
                            </Col>
                        </Row>
                    </div>
                </InfoCard>
            ) : (
                <div className="text-center py-5">
                    <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
                        <span className="sr-only">Loading...</span>
                    </div>
                    <p className="mt-3 text-muted h5">Loading track details...</p>
                </div>
            )}
        </div>
    );
};

export default ViewTrackPage;

