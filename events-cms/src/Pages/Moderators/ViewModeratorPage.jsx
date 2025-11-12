import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Button, Row, Col, Badge, Card } from 'react-bootstrap';
import { getModeratorById } from '../../store/actions/moderatorActions';
import DateTimeFormatter from '../../components/dateTime/DateTimeFormatter';

const ViewModeratorPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const { selectedModerator, loading } = useSelector((state) => state.moderator);

    useEffect(() => {
        if (id) {
            dispatch(getModeratorById(id));
        }
    }, [dispatch, id]);

    if (loading) {
        return (
            <div className="p-2 bg-light">
                <div className="text-center py-5">
                    <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
                        <span className="sr-only">Loading...</span>
                    </div>
                    <p className="mt-3 text-muted h5">Loading moderator details...</p>
                </div>
            </div>
        );
    }

    if (!selectedModerator) {
        return (
            <div className="p-2 bg-light">
                <div className="text-center py-5">
                    <i className="feather icon-alert-circle" style={{ fontSize: '48px', color: '#dc3545' }}></i>
                    <h4 className="mt-3">Moderator Not Found</h4>
                    <p className="text-muted">The moderator you're looking for doesn't exist.</p>
                    <Button variant="primary" onClick={() => navigate('/moderators')}>
                        Back to List
                    </Button>
                </div>
            </div>
        );
    }

    const InfoCard = ({ title, icon, children, borderColor = "#4680ff" }) => (
        <div className="mb-4" style={{ 
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
                    paddingBottom: '8px'
                }}>
                    <span style={{ fontSize: '20px' }}>{icon}</span>
                    {title}
                </h5>
                {children}
            </div>
        </div>
    );

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
                    borderTop: '4px solid #4680ff'
                }}>
                    <div className="d-flex justify-content-between align-items-center">
                        <div>
                            <h4 style={{ margin: 0, color: '#2c3e50', fontWeight: '600' }}>
                                👤 Moderator Profile
                            </h4>
                            <p style={{ margin: '8px 0 0 0', color: '#6c757d', fontSize: '14px' }}>
                                View moderator information and event assignments
                            </p>
                        </div>
                        <div>
                            <Button 
                                variant="secondary" 
                                onClick={() => navigate('/moderators')}
                                style={{ padding: '8px 16px', fontWeight: '500' }}
                            >
                                <i className="feather icon-arrow-left mr-2"></i>
                                Back
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Moderator Information Card */}
            <InfoCard title="Moderator Information" icon="📋" borderColor="#4680ff">
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
                                    <i className="feather icon-user text-primary mr-2"></i>
                                    <label className="text-muted small mb-0">Name</label>
                                </div>
                                <h5 className="text-dark font-weight-bold mb-0">{selectedModerator.firstName} {selectedModerator.lastName}</h5>
                            </div>
                        </Col>
                        <Col md={6}>
                            <div className="mb-4">
                                <div className="d-flex align-items-center mb-2">
                                    <i className="feather icon-mail text-info mr-2"></i>
                                    <label className="text-muted small mb-0">Email</label>
                                </div>
                                <div className="bg-light p-2 rounded">
                                    <span className="text-dark font-weight-medium">{selectedModerator.email}</span>
                                </div>
                            </div>
                        </Col>
                        <Col md={6}>
                            <div className="mb-4">
                                <div className="d-flex align-items-center mb-2">
                                    <i className="feather icon-phone text-success mr-2"></i>
                                    <label className="text-muted small mb-0">Mobile</label>
                                </div>
                                <div className="bg-light p-2 rounded">
                                    <span className="text-dark font-weight-medium">{selectedModerator.mobile || 'N/A'}</span>
                                </div>
                            </div>
                        </Col>
                      
                        <Col md={6}>
                            <div className="mb-4">
                                <div className="d-flex align-items-center mb-2">
                                    <i className="feather icon-calendar text-warning mr-2"></i>
                                    <label className="text-muted small mb-0">Created Date</label>
                                </div>
                                <div className="bg-light p-2 rounded">
                                    <span className="text-dark font-weight-medium">
                                        <DateTimeFormatter date={selectedModerator.createdAt} />
                                    </span>
                                </div>
                            </div>
                        </Col>
            
                    </Row>
                </div>
            </InfoCard>

            {/* Assigned Events Card */}
            {selectedModerator.assignments && selectedModerator.assignments.length > 0 && (
                <InfoCard title="Assigned Events" icon="📅" borderColor="#28a745">
                    <div style={{
                        backgroundColor: '#fff',
                        padding: '20px',
                        borderRadius: '8px',
                        border: '1px solid #e9ecef',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}>
                        {selectedModerator.assignments.map((assignment, index) => (
                            <div key={assignment.id} className={`mb-3 pb-3 ${index < selectedModerator.assignments.length - 1 ? 'border-bottom' : ''}`}>
                                <div className="d-flex justify-content-between align-items-center">
                                    <div>
                                        <h6 className="text-primary font-weight-bold mb-1">
                                            {assignment.event?.name || 'Unknown Event'}
                                        </h6>
                                        {assignment.track && (
                                            <p className="text-info mb-1">
                                                <i className="feather icon-layers mr-1"></i>
                                                Track: {assignment.track.title}
                                            </p>
                                        )}
                                        {assignment.sessions && assignment.sessions.length > 0 && (
                                            <div className="mb-2">
                                                <small className="text-muted d-block mb-1">
                                                    <i className="feather icon-play mr-1"></i>
                                                    Sessions ({assignment.sessions.length}):
                                                </small>
                                                <div className="d-flex flex-wrap gap-1">
                                                    {assignment.sessions.map((sessionItem, sessionIndex) => (
                                                        <Badge key={sessionIndex} variant="secondary" className="mr-1 mb-1">
                                                            {sessionItem.session?.title || 'Unknown Session'}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        <small className="text-muted">
                                            <i className="feather icon-calendar mr-1"></i>
                                            Assigned on: <DateTimeFormatter date={assignment.createdAt} />
                                        </small>
                                    </div>
                                    <Button
                                        variant="outline-primary"
                                        size="sm"
                                        onClick={() => navigate(`${EVENT_PATHS.VIEW_EVENT}/${assignment.event?.id}`)}
                                    >
                                        <i className="feather icon-eye mr-1"></i>
                                        View
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </InfoCard>
            )}
        </div>
    );
};

export default ViewModeratorPage;

