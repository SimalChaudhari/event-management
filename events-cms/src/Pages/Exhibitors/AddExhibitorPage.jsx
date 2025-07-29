import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Row, Col, Card, Form, Button, Alert } from 'react-bootstrap';
import { createExhibitor, updateExhibitor, exhibitorById } from '../../store/actions/exhibitorsActions';
import { EXHIBITOR_PATHS } from '../../utils/constants';

const AddExhibitorPage = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const exhibitorId = searchParams.get('id');
    const isEditMode = Boolean(exhibitorId);

    const [formData, setFormData] = useState({
        name: '',
        userName: '',
        email: '',
        mobile: '',
        address: '',
        companyName: '',
        companyDescription: '',
        isActive: true
    });

    const [files, setFiles] = useState({
        flyers: [],
        eventImages: [],
        documents: []
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isEditMode && exhibitorId) {
            loadExhibitorData();
        }
    }, [isEditMode, exhibitorId]);

    const loadExhibitorData = async () => {
        try {
            setLoading(true);
            const response = await dispatch(exhibitorById(exhibitorId));
            if (response && response.data) {
                const exhibitor = response.data;
                setFormData({
                    name: exhibitor.name || '',
                    userName: exhibitor.userName || '',
                    email: exhibitor.email || '',
                    mobile: exhibitor.mobile || '',
                    address: exhibitor.address || '',
                    companyName: exhibitor.companyName || '',
                    companyDescription: exhibitor.companyDescription || '',
                    isActive: exhibitor.isActive !== undefined ? exhibitor.isActive : true
                });
            }
        } catch (error) {
            setError('Failed to load exhibitor data');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleFileChange = (e, fileType) => {
        const selectedFiles = Array.from(e.target.files);
        setFiles(prev => ({
            ...prev,
            [fileType]: selectedFiles
        }));
    };

    const validateForm = () => {
        if (!formData.name.trim()) {
            setError('Name is required');
            return false;
        }
        if (!formData.email.trim()) {
            setError('Email is required');
            return false;
        }
        if (!formData.mobile.trim()) {
            setError('Mobile number is required');
            return false;
        }
        if (!formData.companyName.trim()) {
            setError('Company name is required');
            return false;
        }
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!validateForm()) {
            return;
        }

        try {
            setLoading(true);
            
            const submitData = new FormData();
            
            // Add text fields
            Object.keys(formData).forEach(key => {
                submitData.append(key, formData[key]);
            });

            // Add files
            files.flyers.forEach(file => {
                submitData.append('flyers', file);
            });
            
            files.eventImages.forEach(file => {
                submitData.append('eventImages', file);
            });
            
            files.documents.forEach((file, index) => {
                submitData.append('documents', file);
                submitData.append(`documentNames`, `Document ${index + 1}`);
            });

            let success;
            if (isEditMode) {
                success = await dispatch(updateExhibitor(exhibitorId, submitData));
            } else {
                success = await dispatch(createExhibitor(submitData));
            }

            if (success) {
                navigate(EXHIBITOR_PATHS.LIST_EXHIBITORS);
            }
        } catch (error) {
            setError('Failed to save exhibitor');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        navigate(EXHIBITOR_PATHS.LIST_EXHIBITORS);
    };

    if (loading && isEditMode) {
        return (
            <div className="text-center p-5">
                <div className="spinner-border" role="status">
                    <span className="sr-only">Loading...</span>
                </div>
            </div>
        );
    }

    return (
        <Row>
            <Col sm={12}>
                <Card>
                    <Card.Header>
                        <Card.Title as="h5">
                            {isEditMode ? 'Edit Exhibitor' : 'Add New Exhibitor'}
                        </Card.Title>
                    </Card.Header>
                    <Card.Body>
                        {error && (
                            <Alert variant="danger" dismissible onClose={() => setError('')}>
                                {error}
                            </Alert>
                        )}

                        <Form onSubmit={handleSubmit}>
                            <Row>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Name <span className="text-danger">*</span></Form.Label>
                                        <Form.Control
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleInputChange}
                                            placeholder="Enter exhibitor name"
                                            required
                                        />
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Username <span className="text-danger">*</span></Form.Label>
                                        <Form.Control
                                            type="text"
                                            name="userName"
                                            value={formData.userName}
                                            onChange={handleInputChange}
                                            placeholder="Enter username"
                                            required
                                        />
                                    </Form.Group>
                                </Col>
                            </Row>

                            <Row>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Email <span className="text-danger">*</span></Form.Label>
                                        <Form.Control
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleInputChange}
                                            placeholder="Enter email address"
                                            required
                                        />
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Mobile <span className="text-danger">*</span></Form.Label>
                                        <Form.Control
                                            type="tel"
                                            name="mobile"
                                            value={formData.mobile}
                                            onChange={handleInputChange}
                                            placeholder="Enter mobile number"
                                            required
                                        />
                                    </Form.Group>
                                </Col>
                            </Row>

                            <Row>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Company Name <span className="text-danger">*</span></Form.Label>
                                        <Form.Control
                                            type="text"
                                            name="companyName"
                                            value={formData.companyName}
                                            onChange={handleInputChange}
                                            placeholder="Enter company name"
                                            required
                                        />
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Status</Form.Label>
                                        <Form.Check
                                            type="checkbox"
                                            name="isActive"
                                            checked={formData.isActive}
                                            onChange={handleInputChange}
                                            label="Active"
                                        />
                                    </Form.Group>
                                </Col>
                            </Row>

                            <Row>
                                <Col md={12}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Address</Form.Label>
                                        <Form.Control
                                            as="textarea"
                                            rows={3}
                                            name="address"
                                            value={formData.address}
                                            onChange={handleInputChange}
                                            placeholder="Enter complete address"
                                        />
                                    </Form.Group>
                                </Col>
                            </Row>

                            <Row>
                                <Col md={12}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Company Description</Form.Label>
                                        <Form.Control
                                            as="textarea"
                                            rows={4}
                                            name="companyDescription"
                                            value={formData.companyDescription}
                                            onChange={handleInputChange}
                                            placeholder="Enter company description"
                                        />
                                    </Form.Group>
                                </Col>
                            </Row>

                            <Row>
                                <Col md={4}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Flyers</Form.Label>
                                        <Form.Control
                                            type="file"
                                            multiple
                                            accept="image/*"
                                            onChange={(e) => handleFileChange(e, 'flyers')}
                                        />
                                        <Form.Text className="text-muted">
                                            Upload promotional flyers (images only)
                                        </Form.Text>
                                    </Form.Group>
                                </Col>
                                <Col md={4}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Event Images</Form.Label>
                                        <Form.Control
                                            type="file"
                                            multiple
                                            accept="image/*"
                                            onChange={(e) => handleFileChange(e, 'eventImages')}
                                        />
                                        <Form.Text className="text-muted">
                                            Upload event related images
                                        </Form.Text>
                                    </Form.Group>
                                </Col>
                                <Col md={4}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Documents</Form.Label>
                                        <Form.Control
                                            type="file"
                                            multiple
                                            accept=".pdf,.doc,.docx"
                                            onChange={(e) => handleFileChange(e, 'documents')}
                                        />
                                        <Form.Text className="text-muted">
                                            Upload documents (PDF, DOC, DOCX)
                                        </Form.Text>
                                    </Form.Group>
                                </Col>
                            </Row>

                            <div className="d-flex justify-content-end gap-2">
                                <Button 
                                    variant="secondary" 
                                    onClick={handleCancel}
                                    disabled={loading}
                                >
                                    Cancel
                                </Button>
                                <Button 
                                    variant="primary" 
                                    type="submit"
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                            {isEditMode ? 'Updating...' : 'Creating...'}
                                        </>
                                    ) : (
                                        isEditMode ? 'Update Exhibitor' : 'Create Exhibitor'
                                    )}
                                </Button>
                            </div>
                        </Form>
                    </Card.Body>
                </Card>
            </Col>
        </Row>
    );
};

export default AddExhibitorPage;