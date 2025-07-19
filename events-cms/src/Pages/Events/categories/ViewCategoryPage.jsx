import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Row, Col, Card, Container, Badge } from 'react-bootstrap';
import { useDispatch } from 'react-redux';
import { categoryById } from '../../../store/actions/categoryActions';

const ViewCategoryPage = () => {
    const { id } = useParams();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [categoryData, setCategoryData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadCategoryData = async () => {
            try {
                const response = await dispatch(categoryById(id));
                if (response?.data) {
                    setCategoryData(response.data);
                }
                setLoading(false);
            } catch (error) {
                console.error('Error loading category data:', error);
                setLoading(false);
            }
        };
        
        if (id) {
            loadCategoryData();
        }
    }, [id, dispatch]);

    if (loading) return <div>Loading...</div>;
    if (!categoryData) return <div>No category found.</div>;

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <Container fluid className="mt-4">
            <div
                className="mb-3"
                style={{ backgroundColor: '#fff', borderRadius: '8px', padding: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
            >
                <div className="d-flex justify-content-between align-items-center">
                    <h4 className="card-title">View Category</h4>
                    <Button variant="secondary" onClick={() => navigate('/categories')}>
                        <i style={{ marginRight: '10px' }} className="fas fa-arrow-left me-2"></i>
                        Back to Categories
                    </Button>
                </div>
            </div>

            <div style={{ backgroundColor: '#fff', borderRadius: '8px', padding: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                <Row>
                    <Col md={12}>
                        <div className="mb-4">
                            <h6 className="text-primary mb-2">
                                <i className="feather icon-folder mr-2"></i>
                                Category Name
                            </h6>
                            <div className="p-3 bg-light rounded">
                                <p className="mb-0">{categoryData.name}</p>
                            </div>
                        </div>
                    </Col>

                    <Col md={12}>
                        <div className="mb-4">
                            <h6 className="text-primary mb-2">
                                <i className="feather icon-file-text mr-2"></i>
                                Description
                            </h6>
                            <div className="p-3 bg-light rounded">
                                {categoryData.description ? (
                                    <p className="mb-0">{categoryData.description}</p>
                                ) : (
                                    <p className="mb-0 text-muted font-italic">
                                        No description provided
                                    </p>
                                )}
                            </div>
                        </div>
                    </Col>

                    <Col md={6}>
                        <div className="mb-3">
                            <h6 className="text-primary mb-2">
                                <i className="feather icon-calendar mr-2"></i>
                                Created
                            </h6>
                            <p className="mb-0">{formatDate(categoryData.createdAt)}</p>
                        </div>
                    </Col>

                    <Col md={6}>
                        <div className="mb-3">
                            <h6 className="text-primary mb-2">
                                <i className="feather icon-edit mr-2"></i>
                                Updated
                            </h6>
                            <p className="mb-0">{formatDate(categoryData.updatedAt)}</p>
                        </div>
                    </Col>
                </Row>

                {/* Additional Information */}
                <Row className="mt-4">
                    <Col md={12}>
                        <Card>
                            <Card.Body>
                                <Card.Title>
                                    <i className="feather icon-info mr-2"></i>
                                    Category Information
                                </Card.Title>
                                <hr />
                                <Row>
                                    <Col md={6}>
                                        <div className="text-center p-3">
                                            <div
                                                style={{
                                                    backgroundColor: '#f8f9fa',
                                                    borderRadius: '8px',
                                                    border: '1px solid #e9ecef',
                                                    padding: '20px'
                                                }}
                                            >
                                                <i className="fas fa-tag text-primary mb-2" style={{ fontSize: '1.5rem' }}></i>
                                                <h6 className="mb-1" style={{ color: '#495057', fontSize: '0.9rem' }}>
                                                    Category ID
                                                </h6>
                                                <p className="mb-0" style={{ fontSize: '0.95rem', fontWeight: '500' }}>
                                                    {categoryData.id}
                                                </p>
                                            </div>
                                        </div>
                                    </Col>
                                    <Col md={6}>
                                        <div className="text-center p-3">
                                            <div
                                                style={{
                                                    backgroundColor: '#f8f9fa',
                                                    borderRadius: '8px',
                                                    border: '1px solid #e9ecef',
                                                    padding: '20px'
                                                }}
                                            >
                                                <i className="fas fa-calendar text-primary mb-2" style={{ fontSize: '1.5rem' }}></i>
                                                <h6 className="mb-1" style={{ color: '#495057', fontSize: '0.9rem' }}>
                                                    Status
                                                </h6>
                                                <p className="mb-0" style={{ fontSize: '0.95rem', fontWeight: '500' }}>
                                                    <Badge bg="success">Active</Badge>
                                                </p>
                                            </div>
                                        </div>
                                    </Col>
                                </Row>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </div>
        </Container>
    );
};

export default ViewCategoryPage; 