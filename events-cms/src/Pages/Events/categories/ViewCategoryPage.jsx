import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Row, Col, Card, Container, Badge } from 'react-bootstrap';
import { useDispatch } from 'react-redux';
import { categoryById } from '../../../store/actions/categoryActions';
import { EVENT_PATHS } from '../../../utils/constants';
import NoDataFound from '../../../components/NoDataFound';
import useTableNavigation from '../../../hooks/useTableNavigation';

const ViewCategoryPage = () => {
    const { id } = useParams();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [categoryData, setCategoryData] = useState(null);
    const [loading, setLoading] = useState(true);
    const { handleBack } = useTableNavigation({
        tableRef: null,
        listPath: EVENT_PATHS.CATEGORIES,
        viewPath: EVENT_PATHS.VIEW_CATEGORY,
        editPath: EVENT_PATHS.EDIT_CATEGORY,
        addPath: EVENT_PATHS.ADD_CATEGORY
    });

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

    if (loading) {
        return <div>Loading...</div>;
    }

    if (!categoryData) {
        return (
            <NoDataFound
                title="Category Not Found"
                message="The category you're looking for doesn't exist or has been removed."
                icon="fas fa-folder-slash"
                variant="warning"
                size="medium"
                showBackButton={true}
                backButtonText="Back"
                backButtonPath={EVENT_PATHS.CATEGORIES}
            />
        );
    }

    const InfoField = ({ label, value, icon = null, colSize = 6 }) => (
        <Col xs={12} sm={12} md={colSize} className="mb-2" style={{ overflow: 'hidden' }}>
            <div style={{ 
                padding: '8px 12px',
                borderBottom: '1px solid #e9ecef',
                width: '100%',
                maxWidth: '100%',
                boxSizing: 'border-box',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
            }}>
                {icon && (
                    <i 
                        className={icon} 
                        style={{ 
                            fontSize: '14px', 
                            flexShrink: 0,
                            width: '16px',
                            textAlign: 'center',
                            color: '#4680ff'
                        }}
                    ></i>
                )}
                <span style={{ 
                    fontSize: '13px', 
                    fontWeight: '600', 
                    color: '#000000',
                    minWidth: '120px',
                    flexShrink: 0
                }}>
                    {label}:
                </span>
                <span style={{ 
                    fontSize: '14px', 
                    color: '#000000',
                    fontWeight: '400',
                    flex: 1,
                    wordBreak: 'break-word',
                    overflowWrap: 'break-word'
                }}>
                    {value || 'N/A'}
                </span>
            </div>
        </Col>
    );

    return (
        <>
            <Container fluid className="mt-4" style={{ overflowX: 'hidden', width: '100%', maxWidth: '100%' }}>
                {/* Header */}
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
                            <h4 style={{ 
                                margin: 0, 
                                color: '#000000',
                                fontWeight: '600'
                            }}>
                                <i className="feather icon-folder mr-2" style={{ color: '#4680ff' }}></i>
                                Category Profile
                            </h4>
                            <p style={{ 
                                margin: '8px 0 0 0', 
                                color: '#000000',
                                fontSize: '14px'
                            }}>
                                View detailed information about this category
                            </p>
                        </div>
                        <Button 
                            variant="outline-secondary" 
                            onClick={() => handleBack()}
                            style={{ 
                                borderRadius: '8px',
                                padding: '8px 16px',
                                border: '1px solid #dee2e6',
                                fontWeight: '500'
                            }}
                        >
                            <i className="fas fa-arrow-left me-2" style={{marginRight: '10px'}}></i>
                            Back
                        </Button>
                    </div>
                </div>

                {/* Main Content Card */}
                <Card style={{ 
                    backgroundColor: '#fff', 
                    borderRadius: '8px', 
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    border: '1px solid #e9ecef',
                    overflow: 'hidden'
                }}>
                    <Card.Body style={{ padding: '24px', overflow: 'hidden', width: '100%', maxWidth: '100%' }}>
                        <Row style={{ margin: 0, width: '100%', maxWidth: '100%' }}>
                            {/* Category Information */}
                            <Col xs={12} style={{ overflow: 'hidden', width: '100%', maxWidth: '100%' }}>
                                <h5 style={{ 
                                    fontSize: '16px', 
                                    fontWeight: '600', 
                                    color: '#000000',
                                    marginBottom: '16px',
                                    paddingBottom: '8px',
                                    borderBottom: '2px solid #4680ff'
                                }}>
                                    <i className="feather icon-folder mr-2" style={{ color: '#4680ff' }}></i>
                                    Category Information
                                </h5>
                                <Row>
                                    <InfoField 
                                        label="Category Name" 
                                        value={categoryData.name}
                                        icon="feather icon-folder"
                                        colSize={12}
                                    />
                                    <Col xs={12} sm={12} md={12} className="mb-2" style={{ overflow: 'hidden' }}>
                                        <div style={{ 
                                            padding: '8px 12px',
                                            borderBottom: '1px solid #e9ecef',
                                            width: '100%',
                                            maxWidth: '100%',
                                            boxSizing: 'border-box',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px'
                                        }}>
                                            <i 
                                                className="feather icon-check-circle" 
                                                style={{ 
                                                    fontSize: '14px', 
                                                    flexShrink: 0,
                                                    width: '16px',
                                                    textAlign: 'center',
                                                    color: '#4680ff'
                                                }}
                                            ></i>
                                            <span style={{ 
                                                fontSize: '13px', 
                                                fontWeight: '600', 
                                                color: '#000000',
                                                minWidth: '120px',
                                                flexShrink: 0
                                            }}>
                                                Status:
                                            </span>
                                            <Badge 
                                                bg={categoryData.status === 'active' ? 'success' : 'secondary'}
                                                style={{ 
                                                    fontSize: '12px', 
                                                    padding: '6px 12px',
                                                    fontWeight: '600'
                                                }}
                                            >
                                                {categoryData.status ? categoryData.status.charAt(0).toUpperCase() + categoryData.status.slice(1) : 'N/A'}
                                            </Badge>
                                        </div>
                                    </Col>
                                </Row>
                            </Col>

                            {/* Description */}
                            {categoryData.description && (
                                <Col xs={12} className="mt-4" style={{ overflow: 'hidden', width: '100%', maxWidth: '100%' }}>
                                    <h5 style={{ 
                                        fontSize: '16px', 
                                        fontWeight: '600', 
                                        color: '#000000',
                                        marginBottom: '16px',
                                        paddingBottom: '8px',
                                        borderBottom: '2px solid #4680ff'
                                    }}>
                                        <i className="feather icon-file-text mr-2" style={{ color: '#4680ff' }}></i>
                                        Description
                                    </h5>
                                    <div style={{ 
                                        padding: '12px',
                                        color: '#000000',
                                        lineHeight: '1.6',
                                        fontSize: '14px'
                                    }}>
                                        {categoryData.description}
                                    </div>
                                </Col>
                            )}

                            {/* Account Details */}
                            <Col xs={12} className="mt-4" style={{ overflow: 'hidden', width: '100%', maxWidth: '100%' }}>
                                <h5 style={{ 
                                    fontSize: '16px', 
                                    fontWeight: '600', 
                                    color: '#000000',
                                    marginBottom: '16px',
                                    paddingBottom: '8px',
                                    borderBottom: '2px solid #4680ff'
                                }}>
                                    <i className="feather icon-settings mr-2" style={{ color: '#4680ff' }}></i>
                                    Additional Details
                                </h5>
                                <Row>
                                    {categoryData.createdAt && (
                                        <InfoField 
                                            label="Created At" 
                                            value={new Date(categoryData.createdAt).toLocaleString()}
                                            icon="feather icon-user-plus"
                                            colSize={12}
                                        />
                                    )}
                                    {categoryData.updatedAt && (
                                        <InfoField 
                                            label="Last Updated" 
                                            value={new Date(categoryData.updatedAt).toLocaleString()}
                                            icon="feather icon-edit"
                                            colSize={12}
                                        />
                                    )}
                                </Row>
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>
            </Container>
        </>
    );
};

export default ViewCategoryPage;
