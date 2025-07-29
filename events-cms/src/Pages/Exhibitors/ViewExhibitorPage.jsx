import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Row, Col, Card, Badge, Button, Tab, Nav, Alert } from 'react-bootstrap';
import { exhibitorById } from '../../store/actions/exhibitorsActions';
import { EXHIBITOR_PATHS } from '../../utils/constants';
import { API_URL } from '../../configs/env';
import { formatDateTimeForTable } from '../../components/dateTime/dateTimeUtils';

const ViewExhibitorPage = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const exhibitorId = searchParams.get('id');

    const [exhibitor, setExhibitor] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (exhibitorId) {
            loadExhibitorData();
        } else {
            setError('Exhibitor ID not found');
            setLoading(false);
        }
    }, [exhibitorId]);

    const loadExhibitorData = async () => {
        try {
            setLoading(true);
            const response = await dispatch(exhibitorById(exhibitorId));
            if (response && response.data) {
                setExhibitor(response.data);
            } else {
                setError('Exhibitor not found');
            }
        } catch (error) {
            setError('Failed to load exhibitor data');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = () => {
        navigate(`${EXHIBITOR_PATHS.EDIT_EXHIBITOR}?id=${exhibitorId}`);
    };

    const handleBack = () => {
        navigate(EXHIBITOR_PATHS.LIST_EXHIBITORS);
    };

    if (loading) {
        return (
            <div className="text-center p-5">
                <div className="spinner-border" role="status">
                    <span className="sr-only">Loading...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <Row>
                <Col sm={12}>
                    <Alert variant="danger">{error}</Alert>
                    <Button variant="secondary" onClick={handleBack}>
                        Back to Exhibitors
                    </Button>
                </Col>
            </Row>
        );
    }

    if (!exhibitor) {
        return (
            <Row>
                <Col sm={12}>
                    <Alert variant="warning">Exhibitor not found</Alert>
                    <Button variant="secondary" onClick={handleBack}>
                        Back to Exhibitors
                    </Button>
                </Col>
            </Row>
        );
    }

    const renderPromotionalOffers = () => {
        if (!exhibitor.promotionalOffers || exhibitor.promotionalOffers.length === 0) {
            return <p className="text-muted">No promotional offers available.</p>;
        }

        return (
            <Row>
                {exhibitor.promotionalOffers.map((offer) => (
                    <Col md={6} lg={4} key={offer.id} className="mb-3">
                        <Card className="h-100">
                            {offer.image && (
                                <Card.Img 
                                    variant="top" 
                                    src={`${API_URL}/${offer.image}`}
                                    style={{ height: '200px', objectFit: 'cover' }}
                                    onError={(e) => {
                                        e.target.src = '/assets/images/placeholder.jpg';
                                    }}
                                />
                            )}
                            <Card.Body>
                                <Card.Title className="h6">{offer.title}</Card.Title>
                                <Card.Text className="small text-muted">
                                    {offer.description}
                                </Card.Text>
                                <div className="d-flex justify-content-between align-items-center">
                                    <small className="text-muted">
                                        Valid until: {new Date(offer.validDate).toLocaleDateString()}
                                    </small>
                                    <Badge variant={offer.isActive ? 'success' : 'danger'}>
                                        {offer.isActive ? 'Active' : 'Inactive'}
                                    </Badge>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                ))}
            </Row>
        );
    };

    const renderDocuments = () => {
        if (!exhibitor.documents || exhibitor.documents.length === 0) {
            return <p className="text-muted">No documents available.</p>;
        }

        return (
            <div className="documents-list">
                {exhibitor.documents.map((doc, index) => (
                    <Card key={index} className="mb-2">
                        <Card.Body className="py-2">
                            <div className="d-flex justify-content-between align-items-center">
                                <div>
                                    <h6 className="mb-0">{doc.name}</h6>
                                    <small className="text-muted">Document {index + 1}</small>
                                </div>
                                <div>
                                    <Button 
                                        variant="outline-primary" 
                                        size="sm"
                                        href={`${API_URL}/${doc.document}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        <i className="feather icon-download me-1"></i>
                                        Download
                                    </Button>
                                </div>
                            </div>
                        </Card.Body>
                    </Card>
                ))}
            </div>
        );
    };

    const renderImages = (images, title) => {
        if (!images || images.length === 0) {
            return <p className="text-muted">No {title.toLowerCase()} available.</p>;
        }

        return (
            <Row>
                {images.map((image, index) => (
                    <Col md={4} lg={3} key={index} className="mb-3">
                        <Card>
                            <Card.Img 
                                variant="top" 
                                src={`${API_URL}/${image}`}
                                style={{ height: '200px', objectFit: 'cover' }}
                                onError={(e) => {
                                    e.target.src = '/assets/images/placeholder.jpg';
                                }}
                            />
                            <Card.Body className="p-2">
                                <small className="text-muted">{title} {index + 1}</small>
                            </Card.Body>
                        </Card>
                    </Col>
                ))}
            </Row>
        );
    };

    return (
        <Row>
            <Col sm={12}>
                <Card>
                    <Card.Header>
                        <div className="d-flex justify-content-between align-items-center">
                            <div>
                                <Card.Title as="h5">Exhibitor Details</Card.Title>
                                <p className="text-muted mb-0">View exhibitor information and related data</p>
                            </div>
                            <div>
                                <Button variant="outline-secondary" onClick={handleBack} className="me-2">
                                    <i className="feather icon-arrow-left me-1"></i>
                                    Back
                                </Button>
                                <Button variant="primary" onClick={handleEdit}>
                                    <i className="feather icon-edit me-1"></i>
                                    Edit
                                </Button>
                            </div>
                        </div>
                    </Card.Header>
                    <Card.Body>
                        {/* Basic Information */}
                        <Row className="mb-4">
                            <Col md={8}>
                                <div className="exhibitor-basic-info">
                                    <div className="d-flex align-items-center mb-3">
                                        {exhibitor.eventImages && exhibitor.eventImages.length > 0 && (
                                            <img 
                                                src={`${API_URL}/${exhibitor.eventImages[0]}`}
                                                alt="Exhibitor"
                                                className="img-thumbnail me-3"
                                                style={{ width: '80px', height: '80px', objectFit: 'cover' }}
                                                onError={(e) => {
                                                    e.target.src = '/assets/images/user/avatar-1.jpg';
                                                }}
                                            />
                                        )}
                                        <div>
                                            <h4 className="mb-1">{exhibitor.name}</h4>
                                            <p className="text-muted mb-1">{exhibitor.companyName}</p>
                                            <Badge variant={exhibitor.isActive ? 'success' : 'danger'}>
                                                {exhibitor.isActive ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>
                            </Col>
                            <Col md={4}>
                                <div className="exhibitor-stats">
                                    <div className="text-center p-3 bg-light rounded">
                                        <div className="row text-center">
                                            <div className="col-4">
                                                <h6 className="mb-0">{exhibitor.promotionalOffers?.length || 0}</h6>
                                                <small className="text-muted">Offers</small>
                                            </div>
                                            <div className="col-4">
                                                <h6 className="mb-0">{exhibitor.documents?.length || 0}</h6>
                                                <small className="text-muted">Documents</small>
                                            </div>
                                            <div className="col-4">
                                                <h6 className="mb-0">{exhibitor.flyers?.length || 0}</h6>
                                                <small className="text-muted">Flyers</small>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Col>
                        </Row>

                        {/* Contact Information */}
                        <Row className="mb-4">
                            <Col md={6}>
                                <Card className="bg-light">
                                    <Card.Body>
                                        <h6 className="card-title">Contact Information</h6>
                                        <div className="contact-details">
                                            <p><strong>Email:</strong> {exhibitor.email}</p>
                                            <p><strong>Mobile:</strong> {exhibitor.mobile}</p>
                                            <p><strong>Username:</strong> {exhibitor.userName}</p>
                                            <p><strong>Address:</strong> {exhibitor.address || 'Not provided'}</p>
                                        </div>
                                    </Card.Body>
                                </Card>
                            </Col>
                            <Col md={6}>
                                <Card className="bg-light">
                                    <Card.Body>
                                        <h6 className="card-title">Additional Information</h6>
                                        <div className="additional-details">
                                            <p><strong>Created:</strong> {formatDateTimeForTable(exhibitor.createdAt)}</p>
                                            <p><strong>Last Updated:</strong> {formatDateTimeForTable(exhibitor.updatedAt)}</p>
                                            <p><strong>Company Description:</strong></p>
                                            <p className="text-muted small">
                                                {exhibitor.companyDescription || 'No description provided'}
                                            </p>
                                        </div>
                                    </Card.Body>
                                </Card>
                            </Col>
                        </Row>

                        {/* Tabs for additional content */}
                        <Tab.Container defaultActiveKey="offers">
                            <Nav variant="tabs" className="mb-3">
                                <Nav.Item>
                                    <Nav.Link eventKey="offers">
                                        Promotional Offers ({exhibitor.promotionalOffers?.length || 0})
                                    </Nav.Link>
                                </Nav.Item>
                                <Nav.Item>
                                    <Nav.Link eventKey="flyers">
                                        Flyers ({exhibitor.flyers?.length || 0})
                                    </Nav.Link>
                                </Nav.Item>
                                <Nav.Item>
                                    <Nav.Link eventKey="images">
                                        Event Images ({exhibitor.eventImages?.length || 0})
                                    </Nav.Link>
                                </Nav.Item>
                                <Nav.Item>
                                    <Nav.Link eventKey="documents">
                                        Documents ({exhibitor.documents?.length || 0})
                                    </Nav.Link>
                                </Nav.Item>
                            </Nav>

                            <Tab.Content>
                                <Tab.Pane eventKey="offers">
                                    {renderPromotionalOffers()}
                                </Tab.Pane>
                                <Tab.Pane eventKey="flyers">
                                    {renderImages(exhibitor.flyers, 'Flyer')}
                                </Tab.Pane>
                                <Tab.Pane eventKey="images">
                                    {renderImages(exhibitor.eventImages, 'Event Image')}
                                </Tab.Pane>
                                <Tab.Pane eventKey="documents">
                                    {renderDocuments()}
                                </Tab.Pane>
                            </Tab.Content>
                        </Tab.Container>
                    </Card.Body>
                </Card>
            </Col>
        </Row>
    );
};

export default ViewExhibitorPage;