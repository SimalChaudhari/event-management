import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Button, Row, Col, Container, Badge } from 'react-bootstrap';
import { toast } from 'react-toastify';
import axiosInstance from '../../../configs/axiosInstance';
import { SETTINGS_PATHS } from '../../../utils/constants';
import useTableNavigation from '../../../hooks/useTableNavigation';

const ViewEmailTemplatePage = () => {
    const { id } = useParams();
    const [templateData, setTemplateData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [previewData, setPreviewData] = useState(null);
    const { handleBack, handleEdit } = useTableNavigation({
        tableRef: null,
        listPath: SETTINGS_PATHS.EMAIL_TEMPLATES,
        viewPath: SETTINGS_PATHS.VIEW_EMAIL_TEMPLATE,
        editPath: SETTINGS_PATHS.EDIT_EMAIL_TEMPLATE,
        addPath: SETTINGS_PATHS.ADD_EMAIL_TEMPLATE
    });

    useEffect(() => {
        const loadTemplateData = async () => {
            try {
                const response = await axiosInstance.get(`/email-templates/${id}`);
                if (response?.data?.success && response.data.data) {
                    setTemplateData(response.data.data);
                }
                setLoading(false);
            } catch (error) {
                toast.error('Failed to load template data');
                console.error(error);
                setLoading(false);
            }
        };

        if (id) {
            loadTemplateData();
        }
    }, [id]);

    const handlePreview = async () => {
        try {
            const sampleVariables = {
                userName: 'John Doe',
                firstName: 'John',
                lastName: 'Doe',
                email: 'john.doe@example.com',
                otp: '123456',
                eventName: 'Tech Conference 2024',
                password: 'TempPass123!'
            };

            const response = await axiosInstance.post('/email-templates/render', {
                templateId: id,
                variables: sampleVariables
            });

            if (response.data.success) {
                setPreviewData({
                    subject: response.data.data.subject,
                    body: response.data.data.body
                });
            }
        } catch (error) {
            toast.error('Failed to preview template');
            console.error(error);
        }
    };

    const getTypeBadgeVariant = (type) => {
        const variants = {
            welcome: 'success',
            'password-reset': 'warning',
            'event-registration': 'info',
            'event-reminder': 'primary',
            notification: 'secondary',
            custom: 'dark'
        };
        return variants[type] || 'dark';
    };

    const formatType = (type) => {
        return type.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) return <div>Loading...</div>;
    if (!templateData) return <div>No template found.</div>;

    return (
        <Container fluid className="mt-4">
            <div className="row">
                <div className="col-12">
                    <div className="card">
                        <div className="card-header">
                            <div className="d-flex justify-content-between align-items-center">
                                <h4 className="card-title">View Email Template</h4>
                                <div className="d-flex gap-2">
                                    <Button variant="info" onClick={() => handleEdit({ id })}>
                                        <i className="feather icon-edit mr-1" />
                                        Edit
                                    </Button>
                                    <Button variant="secondary" onClick={handleBack}>
                                        <i style={{ marginRight: '10px' }} className="fas fa-arrow-left me-2"></i>
                                        Back
                                    </Button>
                                </div>
                            </div>
                        </div>
                        <div className="card-body">
                            <Row>
                                <Col md={6}>
                                    <div className="form-group">
                                        <label className="font-weight-bold">Template Name:</label>
                                        <p>{templateData.name}</p>
                                    </div>
                                </Col>
                                <Col md={6}>
                                    <div className="form-group">
                                        <label className="font-weight-bold">Type:</label>
                                        <p>
                                            <Badge variant={getTypeBadgeVariant(templateData.type)}>
                                                {formatType(templateData.type)}
                                            </Badge>
                                        </p>
                                    </div>
                                </Col>
                                <Col md={6}>
                                    <div className="form-group">
                                        <label className="font-weight-bold">Status:</label>
                                        <p>
                                            <Badge variant={templateData.isActive ? 'success' : 'secondary'}>
                                                {templateData.isActive ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </p>
                                    </div>
                                </Col>
                                <Col md={6}>
                                    <div className="form-group">
                                        <label className="font-weight-bold">Created Date:</label>
                                        <p>{formatDate(templateData.createdAt)}</p>
                                    </div>
                                </Col>
                                <Col md={12}>
                                    <div className="form-group">
                                        <label className="font-weight-bold">Subject:</label>
                                        <p>{templateData.subject}</p>
                                    </div>
                                </Col>
                                <Col md={12}>
                                    <div className="form-group">
                                        <label className="font-weight-bold">Email Body:</label>
                                        <div 
                                            style={{
                                                border: '1px solid #ddd',
                                                borderRadius: '8px',
                                                padding: '20px',
                                                backgroundColor: '#f9f9f9',
                                                minHeight: '200px',
                                                maxHeight: '600px',
                                                overflow: 'auto'
                                            }}
                                            dangerouslySetInnerHTML={{ __html: templateData.body }}
                                        />
                                    </div>
                                </Col>
                                {templateData.variables && (
                                    <Col md={12}>
                                        <div className="form-group">
                                            <label className="font-weight-bold">Available Variables:</label>
                                            <pre style={{ 
                                                backgroundColor: '#f8f9fa', 
                                                padding: '15px', 
                                                borderRadius: '5px',
                                                overflow: 'auto'
                                            }}>
                                                {JSON.stringify(JSON.parse(templateData.variables || '{}'), null, 2)}
                                            </pre>
                                        </div>
                                    </Col>
                                )}
                                <Col md={12}>
                                    <div className="d-flex gap-2 mt-3">
                                        <Button variant="primary" onClick={handlePreview}>
                                            <i className="feather icon-eye mr-1" />
                                            Preview with Sample Data
                                        </Button>
                                    </div>
                                </Col>
                            </Row>

                            {previewData && (
                                <Row className="mt-4">
                                    <Col md={12}>
                                        <div className="card">
                                            <div className="card-header">
                                                <h5>Preview</h5>
                                            </div>
                                            <div className="card-body">
                                                <div className="mb-3">
                                                    <strong>Subject:</strong> {previewData.subject}
                                                </div>
                                                <div 
                                                    style={{
                                                        border: '1px solid #ddd',
                                                        borderRadius: '8px',
                                                        padding: '20px',
                                                        backgroundColor: '#f9f9f9',
                                                        maxHeight: '600px',
                                                        overflow: 'auto'
                                                    }}
                                                    dangerouslySetInnerHTML={{ __html: previewData.body }}
                                                />
                                            </div>
                                        </div>
                                    </Col>
                                </Row>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </Container>
    );
};

export default ViewEmailTemplatePage;

