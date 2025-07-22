import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Row, Col, Card, Container, Badge } from 'react-bootstrap';
import { useDispatch } from 'react-redux';
import { categoryById } from '../../../store/actions/categoryActions';
import { EVENT_PATHS } from '../../../utils/constants';

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
                    <h4 className="card-title">View</h4>
                    <Button variant="secondary" onClick={() => navigate(EVENT_PATHS.CATEGORIES)}>
                        <i style={{ marginRight: '10px' }} className="fas fa-arrow-left me-2"></i>
                        Back
                    </Button>
                </div>
            </div>

            <div style={{ backgroundColor: '#fff', borderRadius: '8px', padding: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                <Row>
                    <Col md={12}>
                        <div className="mb-4">
                            <p className="text-primary mb-2">Category Name</p>
                            <div className="p-3 bg-light rounded">
                                <p className="mb-0">{categoryData.name}</p>
                            </div>
                        </div>
                    </Col>

                    <Col md={12}>
                        <div className="mb-4">
                            <p className="text-primary mb-2">Description</p>
                            <div className="p-3 bg-light rounded">
                                {categoryData.description ? (
                                    <p className="mb-0">{categoryData.description}</p>
                                ) : (
                                    <p className="mb-0 text-muted font-italic">No description provided</p>
                                )}
                            </div>
                        </div>
                    </Col>

                    <Col md={12}>
                        <div className="mb-4">
                            <p className="text-primary mb-2">Status</p>
                            <div className="d-flex align-items-center">
                                <Badge 
                                    bg={categoryData.status === 'active' ? 'success' : 'secondary'}
                                    className="px-3 py-2 fs-6"
                                >
                                    {categoryData.status}
                                </Badge>
                            </div>
                        </div>
                    </Col>

                    <Col md={6}>
                        <div className="mb-3">
                            <p className="text-primary mb-2">Created</p>
                            <p className="mb-0">{formatDate(categoryData.createdAt)}</p>
                        </div>
                    </Col>

                    <Col md={6}>
                        <div className="mb-3">
                            <p className="text-primary mb-2">Updated</p>
                            <p className="mb-0">{formatDate(categoryData.updatedAt)}</p>
                        </div>
                    </Col>
                </Row>
            </div>
        </Container>
    );
};

export default ViewCategoryPage;
