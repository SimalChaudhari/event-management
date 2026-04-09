import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Button, Form, Alert, Spinner, Image, Modal } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import { getLogo, updateLogo, deleteLogo, clearLogoError } from '../../../store/actions/settingsActions';
import { API_URL, DUMMY_PATH } from '../../../configs/env';
import ImageViewModal from '../../../components/modal/ImageViewModal';

const LogoManagement = () => {
    const dispatch = useDispatch();
    const { logo, logoLoading, logoError } = useSelector((state) => state.settings);
    
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [hyperlink, setHyperlink] = useState('');
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showImageModal, setShowImageModal] = useState(false);
    const [selectedImageUrl, setSelectedImageUrl] = useState('');

    useEffect(() => {
        dispatch(getLogo());
    }, [dispatch]);

    useEffect(() => {
        if (logo && logo.imageUrl) {
            setPreviewUrl(`${API_URL}/${logo.imageUrl}`);
            setHyperlink(logo.hyperlink || '');
        }
    }, [logo]);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                alert('Please select an image file');
                return;
            }
            
            // Validate file size (max 10MB)
            if (file.size > 10 * 1024 * 1024) {
                alert('File size must be less than 10MB');
                return;
            }

            setSelectedFile(file);
            
            // Create preview URL
            const reader = new FileReader();
            reader.onload = (e) => {
                setPreviewUrl(e.target.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!selectedFile) {
            alert('Please select a file to upload');
            return;
        }

        const formData = new FormData();
        formData.append('image', selectedFile);
        if (hyperlink.trim()) {
            formData.append('hyperlink', hyperlink.trim());
        }

        const success = await dispatch(updateLogo(formData));
        if (success) {
            // Reset form
            setSelectedFile(null);
            setHyperlink('');
            // No need to call getLogo() again - Redux action already updated the state
        }
    };

    const handleDeleteClick = () => {
        setShowDeleteModal(true);
    };

    const handleDeleteConfirm = async () => {
        const success = await dispatch(deleteLogo());
        if (success) {
            // Reset form and preview
            setSelectedFile(null);
            setPreviewUrl(null);
            setHyperlink('');
            // No need to call getLogo() again - Redux action already updated the state
        }
        setShowDeleteModal(false);
    };

    const handleDeleteCancel = () => {
        setShowDeleteModal(false);
    };

    const handleClearError = () => {
        dispatch(clearLogoError());
    };

    const handleImageClick = () => {
        if (previewUrl && previewUrl !== DUMMY_PATH) {
            setSelectedImageUrl(previewUrl);
            setShowImageModal(true);
        }
    };

    if (logoLoading) {
        return (
            <div className="text-center py-5">
                <Spinner animation="border" role="status">
                    <span className="sr-only">Loading...</span>
                </Spinner>
                <p className="mt-3">Loading logo...</p>
            </div>
        );
    }

    return (
        <div className="container-fluid">
            <Row>
                <Col sm={12}>
                    <Card>
                        <Card.Header>
                            <h4 className="card-title mb-0">Logo Management</h4>
                        </Card.Header>
                        <Card.Body>
                            {logoError && (
                                <Alert variant="danger" dismissible onClose={handleClearError}>
                                    {logoError}
                                </Alert>
                            )}

                            <Row>
                                <Col md={6}>
                                    <Form onSubmit={handleSubmit}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Upload Logo</Form.Label>
                                            <Form.Control
                                                type="file"
                                                accept="image/*"
                                                onChange={handleFileChange}
                                                required
                                            />
                                            <Form.Text className="text-muted">
                                                Supported formats: JPG, PNG, GIF. Max size: 10MB
                                            </Form.Text>
                                        </Form.Group>

                                        <Form.Group className="mb-3">
                                            <Form.Label>Hyperlink (Optional)</Form.Label>
                                            <Form.Control
                                                type="url"
                                                placeholder="https://example.com"
                                                value={hyperlink}
                                                onChange={(e) => setHyperlink(e.target.value)}
                                            />
                                            <Form.Text className="text-muted">
                                                URL to redirect when logo is clicked
                                            </Form.Text>
                                        </Form.Group>

                                        <Button 
                                            type="submit" 
                                            variant="primary" 
                                            disabled={!selectedFile || logoLoading}
                                        >
                                            {logoLoading ? (
                                                <>
                                                    <Spinner size="sm" className="mr-2" />
                                                    Uploading...
                                                </>
                                            ) : (
                                                'Upload Logo'
                                            )}
                                        </Button>
                                    </Form>
                                </Col>

                                <Col md={6}>
                                    <div className="logo-preview">
                                        <h5>Current Logo</h5>
                                        {previewUrl ? (
                                            <div className="text-center">
                                                <div className="position-relative d-inline-block">
                                                    <Image
                                                        src={previewUrl}
                                                        alt="Logo Preview"
                                                        style={{ 
                                                            maxWidth: '300px', 
                                                            maxHeight: '200px',
                                                            objectFit: 'contain',
                                                            cursor: 'pointer',
                                                            transition: 'opacity 0.2s'
                                                        }}
                                                        className="img-thumbnail mb-3"
                                                        onClick={handleImageClick}
                                                        onMouseOver={(e) => e.currentTarget.style.opacity = '0.8'}
                                                        onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
                                                        title="Click to view full size"
                                                    />
                                                    {/* Only show delete button if there's an actual uploaded logo, not just a preview */}
                                                    {logo && logo.imageUrl && (
                                                        <Button 
                                                            variant="danger" 
                                                            size="sm" 
                                                            onClick={handleDeleteClick}
                                                            disabled={logoLoading}
                                                            className="position-absolute"
                                                            style={{ top: '10px', right: '10px' }}
                                                            title="Delete Logo"
                                                        >
                                                            <i className="fas fa-trash-alt"></i>
                                                        </Button>
                                                    )}
                                                </div>
                                                {logo && logo.hyperlink && (
                                                    <p className="text-muted">
                                                        <strong>Hyperlink:</strong> {logo.hyperlink}
                                                    </p>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="text-center text-muted">
                                                <i className="fas fa-image fa-3x mb-3"></i>
                                                <p>No logo uploaded</p>
                                            </div>
                                        )}
                                    </div>
                                </Col>
                            </Row>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Delete Confirmation Modal */}
            <Modal show={showDeleteModal} onHide={handleDeleteCancel} centered>
                <Modal.Header>
                    <Modal.Title>
                        <i className="fas fa-exclamation-triangle text-warning mr-2"></i>
                        Confirm Delete
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p>Are you sure you want to delete the current logo?</p>
                    <p className="text-muted mb-0">This action cannot be undone.</p>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleDeleteCancel} disabled={logoLoading}>
                        Cancel
                    </Button>
                    <Button variant="danger" onClick={handleDeleteConfirm} disabled={logoLoading}>
                        {logoLoading ? (
                            <>
                                <Spinner size="sm" className="mr-2" />
                                Deleting...
                            </>
                        ) : (
                            <>
                                <i className="fas fa-trash-alt mr-1"></i>
                                Delete Logo
                            </>
                        )}
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Logo Image Modal */}
            <ImageViewModal
                show={showImageModal}
                onHide={() => setShowImageModal(false)}
                imageSrc={selectedImageUrl}
                imageAlt="Logo Image"
                downloadFileName={`logo-${Date.now()}.jpg`}
            />
        </div>
    );
};

export default LogoManagement;
