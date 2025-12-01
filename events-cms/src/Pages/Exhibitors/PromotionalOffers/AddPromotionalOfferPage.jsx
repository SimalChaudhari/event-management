import React, { useState, useEffect } from 'react';
import { Button, Row, Col, Card, Container, Alert, Badge, Form } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { 
    createOrUpdatePromotionalOffer, 
    createPromotionalOffer, 
    getPromotionalOfferById,
    updatePromotionalOffer
} from '../../../store/actions/promotionalOfferActions';
import { exhibitorById } from '../../../store/actions/exhibitorsActions';
import { API_URL } from '../../../configs/env';
import { toast } from 'react-toastify';
import { EXHIBITOR_PATHS } from '../../../utils/constants';
import SettingsEditor from '../../../App/components/CkEditor/SettingsEditor';

const AddPromotionalOfferPage = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { id } = useParams(); // Edit mode 
    const [searchParams] = useSearchParams();
    const exhibitorId = searchParams.get('exhibitorId');
    
    // Get exhibitor from Redux if available
    const { exhibitorById: exhibitorData } = useSelector((state) => state.exhibitor);
    
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        validDate: '',
        exhibitorBoothId: exhibitorId || '', // Changed from exhibitorId to exhibitorBoothId
        companyName: '',
        image: null
    });
    const [loading, setLoading] = useState(false);
    const [exhibitor, setExhibitor] = useState(null);
    const [imagePreview, setImagePreview] = useState('');

    // Load edit data if id exists
    useEffect(() => {
        if (id) {
            const loadOfferData = async () => {
                try {
                    const response = await dispatch(getPromotionalOfferById(id));
                    if (response?.data) {
                        const offer = response.data;
                        
                        setFormData({
                            title: offer.title || '',
                            description: offer.description || '',
                            validDate: offer.validDate ? offer.validDate.split('T')[0] : '', // Parse date properly
                            exhibitorBoothId: offer.exhibitorId || '', // Changed from exhibitorId to exhibitorBoothId (using exhibitorId from response)
                            companyName: offer.companyName || '',
                            image: null // Don't populate file input
                        });
                        
                        // Set image preview if exists
                        if (offer.image) {
                            setImagePreview(`${API_URL}/${offer.image}`);
                        }
                    }
                } catch (error) {
                    console.error('Error loading offer data:', error);
                }
            };
            loadOfferData();
        }
    }, [id, dispatch]);

    // Load exhibitor data - only fetch if not already in Redux
    useEffect(() => {
        if (exhibitorId) {
            // Check if exhibitor already exists in Redux
            const currentExhibitor = exhibitorData?.data || exhibitorData;
            if (currentExhibitor && currentExhibitor.id === exhibitorId) {
                // Use exhibitor from Redux
                setExhibitor(currentExhibitor);
                setFormData(prev => ({
                    ...prev,
                    companyName: currentExhibitor.companyName || ''
                }));
            } else {
                // Fetch exhibitor if not in Redux
                dispatch(exhibitorById(exhibitorId)).then((data) => {
                    if (data?.data) {
                        setExhibitor(data.data);
                        setFormData(prev => ({
                            ...prev,
                            companyName: data.data.companyName || ''
                        }));
                    }
                });
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [exhibitorId, dispatch]); // Only run when exhibitorId changes

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        
        if (file) {
            // Validate file
            const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
            const isValidType = allowedTypes.includes(file.type);
            const isValidSize = file.size <= 5 * 1024 * 1024; // 5MB

            if (!isValidType) {
                toast.error('Invalid file type. Allowed types: JPEG, JPG, PNG, GIF.');
                return;
            }
            if (!isValidSize) {
                toast.error('File too large. Maximum size is 5MB.');
                return;
            }

            setFormData((prev) => ({
                ...prev,
                image: file
            }));

            // Create preview
            const reader = new FileReader();
            reader.onload = (e) => {
                setImagePreview(e.target.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const submitData = new FormData();
            submitData.append('title', formData.title);
            submitData.append('description', formData.description);
            submitData.append('validDate', formData.validDate);
            submitData.append('exhibitorBoothId', formData.exhibitorBoothId); // Changed from exhibitorId to exhibitorBoothId
            submitData.append('companyName', formData.companyName);

            if (formData.image) {
                submitData.append('image', formData.image);
            }
            
            // Handle existing image for edit mode
            if (id && !formData.image && imagePreview) {
                // If editing and no new image selected, keep existing image
                const existingImagePath = imagePreview.replace(`${API_URL}/`, '');
                submitData.append('originalImage', existingImagePath);
            }
            
            let response;
            if (id) {
                response = await dispatch(updatePromotionalOffer(id, submitData));
            } else {
                response = await dispatch(createPromotionalOffer(submitData));
            }
            
            if (response) {
                navigate(`${EXHIBITOR_PATHS.PROMOTIONAL_OFFERS}?exhibitorId=${formData.exhibitorBoothId}`);
            }
        } catch (error) {
            console.log('An error occurred while saving promotional offer');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        if (formData.exhibitorBoothId) {
            navigate(`${EXHIBITOR_PATHS.PROMOTIONAL_OFFERS}?exhibitorId=${formData.exhibitorBoothId}`);
        } else {
            navigate(EXHIBITOR_PATHS.LIST_EXHIBITORS);
        }
    };

    return (
        <Container fluid>
            <div className="row">
                <div className="col-12">
                    <div className="card">
                        <div className="card-header">
                            <div className="d-flex justify-content-between align-items-center">
                                <h4 className="card-title">
                                    <i className="feather icon-gift mr-2"></i>
                                    {id ? 'Edit Promotional Offer' : 'Add Promotional Offer'}
                                </h4>
                                <Button variant="secondary" onClick={handleCancel}>
                                    <i style={{marginRight: '10px'}} className="fas fa-arrow-left me-2"></i>
                                    Back
                                </Button>
                            </div>
                        </div>
                        <div className="card-body">
                            {exhibitor && (
                                <Alert variant="info" className="mb-4">
                                    <strong>Exhibitor:</strong> {exhibitor.name} | 
                                    <strong> Company:</strong> {exhibitor.companyName} | 
                                    <strong> Email:</strong> {exhibitor.email}
                                </Alert>
                            )}
                            
                            <form onSubmit={handleSubmit}>
                                <Row>
                                    <Col md={6}>
                                        <div className="form-group fill">
                                            <label className="floating-label" htmlFor="title">
                                                Offer Title <span style={{ color: 'red' }}>*</span>
                                            </label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                name="title"
                                                value={formData.title}
                                                onChange={handleInputChange}
                                                placeholder="Enter offer title"
                                                required
                                            />
                                        </div>
                                    </Col>
                                    
                                    <Col md={6}>
                                        <div className="form-group fill">
                                            <label className="floating-label" htmlFor="validDate">
                                                Valid Date <span style={{ color: 'red' }}>*</span>
                                            </label>
                                            <input
                                                type="date"
                                                className="form-control"
                                                name="validDate"
                                                value={formData.validDate}
                                                onChange={handleInputChange}
                                                placeholder="Select valid date"
                                                required
                                                min={new Date().toISOString().split('T')[0]}
                                            />
                                        </div>
                                    </Col>

                                    <Col sm={12}>
                                        <div className="form-group fill">
                                            <label className="floating-label" htmlFor="description">
                                                Description 
                                            </label>
                                            <hr style={{ margin: '10px 0 15px 0', borderTop: '1px solid #dee2e6' }} />
                                            <SettingsEditor
                                                data={formData.description || ''}
                                                onChange={(event, editor) => {
                                                    setFormData((prev) => ({
                                                        ...prev,
                                                        description: editor.getData()
                                                    }));
                                                }}
                                                placeholder="Enter offer description..."
                                            />
                                        </div>
                                    </Col>

                                    <Col sm={12}>
                                        <div className="form-group fill">
                                            <Badge bg="info">
                                                <span>Offer Image</span>
                                            </Badge>

                                            {/* File Upload */}
                                            <div
                                                className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center mt-2"
                                                style={{
                                                    border: '2px dashed #ccc',
                                                    borderRadius: '8px',
                                                    padding: '20px',
                                                    textAlign: 'center',
                                                    backgroundColor: '#f9f9f9',
                                                    marginBottom: '10px'
                                                }}
                                            >
                                                <div className="mb-3">
                                                    <i className="fas fa-image fa-3x text-muted"></i>
                                                </div>
                                                <p className="text-muted mb-2">
                                                    Click to select an image for the offer
                                                </p>
                                                <p className="text-muted small">
                                                    Supported formats: JPG, PNG, GIF. Max size: 5MB.
                                                </p>
                                                <input
                                                    type="file"
                                                    className="form-control"
                                                    name="image"
                                                    onChange={handleFileChange}
                                                    accept="image/*"
                                                    style={{ display: 'none' }}
                                                    id="imageInput"
                                                />
                                                <Button
                                                    variant="outline-primary"
                                                    onClick={() => document.getElementById('imageInput').click()}
                                                    style={{ marginTop: '10px' }}
                                                >
                                                    Choose Image
                                                </Button>
                                            </div>

                                            {/* Image Preview */}
                                            {imagePreview && (
                                                <div className="mt-3">
                                                    <h6>Image Preview:</h6>
                                                    <div style={{ position: 'relative', display: 'inline-block' }}>
                                                        <img
                                                            src={imagePreview}
                                                            alt="Preview"
                                                            style={{
                                                                width: '200px',
                                                                height: '150px',
                                                                objectFit: 'cover',
                                                                borderRadius: '8px',
                                                                border: '2px solid #ddd'
                                                            }}
                                                        />
                                                        <Button
                                                            size="sm"
                                                            variant="danger"
                                                            onClick={() => {
                                                                setImagePreview('');
                                                                setFormData(prev => ({ ...prev, image: null }));
                                                                document.getElementById('imageInput').value = '';
                                                            }}
                                                            style={{
                                                                position: 'absolute',
                                                                top: '5px',
                                                                right: '5px',
                                                                borderRadius: '50%',
                                                                width: '25px',
                                                                height: '25px',
                                                                padding: '0',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center'
                                                            }}
                                                        >
                                                            ×
                                                        </Button>
                                                    </div>
                                                    {id && !formData.image && (
                                                        <small className="text-muted d-block mt-2">
                                                            Current image will be kept if no new image is selected
                                                        </small>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </Col>
                                </Row>
                                
                                {/* Form Actions */}
                                <div className="row mt-4">
                                    <div className="col-12">
                                        <div className="d-flex justify-content-between gap-2">
                                            <Button 
                                                variant="danger" 
                                                onClick={handleCancel}
                                                disabled={loading}
                                            >
                                                Cancel
                                            </Button>
                                            <Button
                                                variant="primary"
                                                type="submit"
                                                disabled={
                                                    loading ||
                                                    !formData.title.trim() ||
                                                    // !formData.description.trim() ||
                                                    !formData.validDate.trim()
                                                }
                                            >
                                                {loading ? (
                                                    <>
                                                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                                        {id ? 'Updating...' : 'Creating...'}
                                                    </>
                                                ) : (
                                                    id ? 'Update Offer' : 'Create Offer'
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </Container>
    );
};

export default AddPromotionalOfferPage; 