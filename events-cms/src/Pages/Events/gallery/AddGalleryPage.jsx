import React, { useState, useEffect } from 'react';
import { Button, Row, Col, Card, Container, Alert, Badge } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { 
    createOrUpdateGallery, 
    getAllGalleries,
    getGalleryById,
    deleteGalleryImage
} from '../../../store/actions/galleryActions';
import { API_URL } from '../../../configs/env';
import { toast } from 'react-toastify';

const AddGalleryPage = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { id } = useParams(); // Edit mode के लिए
    const [formData, setFormData] = useState({
        title: '',
        eventId: id,
        galleryImages: []
    });
    const [loading, setLoading] = useState(false);
    const [imagePreviewUrls, setImagePreviewUrls] = useState([]);
  
    const [deletingImage, setDeletingImage] = useState(null);

    // Load edit data if id exists
    useEffect(() => {
        if (id) {
            const loadGalleryData = async () => {
                try {
                    const response = await dispatch(getGalleryById(id));
                    if (response?.data) {
                        const gallery = response.data;
                        
                        // Handle images
                        let imagesData = [];
                        let previewUrls = [];
                        if (gallery.galleryImages) {
                            if (Array.isArray(gallery.galleryImages)) {
                                imagesData = gallery.galleryImages;
                                previewUrls = gallery.galleryImages.map((img) => {
                                    if (typeof img === 'string') {
                                        if (img.startsWith('http')) {
                                            return img;
                                        }
                                        return `${API_URL}/${img.replace(/\\/g, '/')}`;
                                    }
                                    return img;
                                });
                            }
                        }

                        setFormData({
                            title: gallery.title || '',
                            eventId: gallery.eventId || id,
                            galleryImages: imagesData
                        });
                        
                        setImagePreviewUrls(previewUrls);
                    }
                } catch (error) {
                    console.error('Error loading gallery data:', error);
              
                }
            };
            loadGalleryData();
        }
    }, [id, dispatch]);


    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    const handleFileChange = (e) => {
        const newFiles = Array.from(e.target.files);
        
        // Validate files
        const validFiles = newFiles.filter((file) => {
            const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
            const isValidType = allowedImageTypes.includes(file.type);
            const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB

            if (!isValidType) {
                toast.error(`${file.name} is not a valid image file. Allowed types: JPEG, JPG, PNG, GIF.`);
            }
            if (!isValidSize) {
                toast.error(`${file.name} is too large. Maximum size is 10MB.`);
            }

            return isValidType && isValidSize;
        });

        if (validFiles.length > 0) {
            const newPreviewUrls = validFiles.map((file) => URL.createObjectURL(file));

            setFormData((prev) => ({
                ...prev,
                galleryImages: [...prev.galleryImages, ...validFiles]
            }));

            setImagePreviewUrls((prev) => [...prev, ...newPreviewUrls]);
        }
    };

    // Drag and drop handlers
    const handleDragOver = (e) => {
        e.preventDefault();
    };

    const handleDrop = (e) => {
        e.preventDefault();
        const files = Array.from(e.dataTransfer.files);
        
        // Validate files
        const validFiles = files.filter((file) => {
            const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
            const isValidType = allowedImageTypes.includes(file.type);
            const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB

            if (!isValidType) {
                toast.error(`${file.name} is not a valid image file. Allowed types: JPEG, JPG, PNG, GIF.`);
            }
            if (!isValidSize) {
                toast.error(`${file.name} is too large. Maximum size is 10MB.`);
            }

            return isValidType && isValidSize;
        });

        if (validFiles.length > 0) {
            const newPreviewUrls = validFiles.map((file) => URL.createObjectURL(file));

            setFormData((prev) => ({
                ...prev,
                galleryImages: [...prev.galleryImages, ...validFiles]
            }));

            setImagePreviewUrls((prev) => [...prev, ...newPreviewUrls]);
        }
    };

    // Image removal function - Updated to use API for existing images
    const handleRemoveImage = async (indexToRemove) => {
        const imageToRemove = formData.galleryImages[indexToRemove];

        // If it's an existing image (string), use API to delete
        if (typeof imageToRemove === 'string' && id) {
            setDeletingImage(indexToRemove);
            try {
                const updatedGallery = await dispatch(deleteGalleryImage(id, imageToRemove));
                if (updatedGallery) {
                    // Update form data with new image list
                    setFormData((prev) => ({
                        ...prev,
                        galleryImages: updatedGallery.galleryImages || []
                    }));

                    // Update preview URLs
                    const newPreviewUrls = (updatedGallery.galleryImages || []).map((img) => {
                        if (typeof img === 'string') {
                            if (img.startsWith('http')) {
                                return img;
                            }
                            return `${API_URL}/${img.replace(/\\/g, '/')}`;
                        }
                        return img;
                    });
                    setImagePreviewUrls(newPreviewUrls);
                }
            } catch (error) {
                toast.error('Failed to delete image');
            } finally {
                setDeletingImage(null);
            }
        } else {
            // If it's a new file (File object), just remove from state
            if (imageToRemove instanceof File) {
                URL.revokeObjectURL(imagePreviewUrls[indexToRemove]);
            }

            setFormData((prev) => ({
                ...prev,
                galleryImages: prev.galleryImages.filter((_, index) => index !== indexToRemove)
            }));

            setImagePreviewUrls((prev) => prev.filter((_, index) => index !== indexToRemove));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
     

        try {
            const submitData = new FormData();
            submitData.append('title', formData.title);
            // Add ID for edit mode
            if (id) {
                submitData.append('id', id);
            }

            // Handle images
            if (formData.galleryImages.length > 0) {
                formData.galleryImages.forEach((image) => {
                    if (image instanceof File) {
                        // New files
                        submitData.append('galleryImages', image);
                    }
                });

                // For edit mode, also send existing images
                if (id) {
                    formData.galleryImages.forEach((image) => {
                        if (typeof image === 'string') {
                            submitData.append('originalImages', image);
                        }
                    });
                }
            }
//test
            const response = await dispatch(createOrUpdateGallery(submitData,id));
            if (response) {
               
                    navigate('/media-manager/gallery');
             
            }
        } catch (error) {
            console.log('An error occurred while saving gallery');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        navigate('/media-manager/gallery');
    };

    // Cleanup preview URLs
    useEffect(() => {
        return () => {
            imagePreviewUrls.forEach(url => {
                if (url.startsWith('blob:')) {
                    URL.revokeObjectURL(url);
                }
            });
        };
    }, []);

    return (
        <Container fluid>
            <div className="row">
                <div className="col-12">
                    <div className="card">
                        <div className="card-header">
                            <div className="d-flex justify-content-between align-items-center">
                                <h4 className="card-title">{id ? 'Edit Gallery' : 'Add Gallery'}</h4>
                                <Button 
                                    variant="secondary" 
                                    onClick={handleCancel}
                                >
                                    <i style={{marginRight: '10px'}} className="fas fa-arrow-left me-2"></i>
                                    Back
                                </Button>
                            </div>
                        </div>
                        <div className="card-body">
                            <form onSubmit={handleSubmit}>
                                <Row>
                                    <Col sm={6}>
                                        <div className="form-group fill">
                                            <label className="floating-label" htmlFor="title">
                                                Gallery Title *
                                            </label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                name="title"
                                                value={formData.title}
                                                onChange={handleInputChange}
                                                placeholder="Enter gallery title"
                                                required
                                            />
                                        </div>
                                    </Col>

                                

                                    <Col sm={12}>
                                        <div className="form-group fill">
                                            <Badge bg="info">
                                                <span>Gallery Images {!id && '*'}</span> {formData.galleryImages.length}/20
                                            </Badge>

                                            {/* Drag and Drop Zone */}
                                            <div
                                                className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center mt-2"
                                                onDragOver={handleDragOver}
                                                onDrop={handleDrop}
                                                style={{
                                                    border: '2px dashed #ccc',
                                                    borderRadius: '8px',
                                                    padding: '20px',
                                                    textAlign: 'center',
                                                    backgroundColor: '#f9f9f9',
                                                    marginBottom: '10px',
                                                    minHeight: '120px',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    justifyContent: 'center',
                                                    alignItems: 'center'
                                                }}
                                            >
                                                <div className="mb-3">
                                                    <i className="fas fa-cloud-upload-alt fa-3x text-muted"></i>
                                                </div>
                                                <p
                                                    className="text-muted mb-2"
                                                    style={{
                                                        fontSize: '14px',
                                                        lineHeight: '1.4',
                                                        maxWidth: '100%',
                                                        wordWrap: 'break-word'
                                                    }}
                                                >
                                                    Drag and drop images here, or click to select files
                                                </p>
                                                <p
                                                    className="text-muted small"
                                                    style={{
                                                        fontSize: '12px',
                                                        lineHeight: '1.3',
                                                        maxWidth: '100%',
                                                        wordWrap: 'break-word'
                                                    }}
                                                >
                                                    Supported formats: JPG, PNG, GIF. Max size: 10MB per image. Max 20 images.
                                                </p>
                                                <input
                                                    type="file"
                                                    className="form-control"
                                                    name="galleryImages"
                                                    onChange={handleFileChange}
                                                    accept="image/*"
                                                    multiple
                                                    style={{ display: 'none' }}
                                                    id="galleryImageInput"
                                                />
                                                <Button
                                                    variant="outline-primary"
                                                    onClick={() => document.getElementById('galleryImageInput').click()}
                                                    style={{ marginTop: '10px' }}
                                                >
                                                    Choose Images
                                                </Button>
                                            </div>

                                            {/* Image Preview Grid */}
                                            {formData.galleryImages && formData.galleryImages.length > 0 && (
                                                <div className="mt-3">
                                                    <h6
                                                        style={{
                                                            fontSize: '16px',
                                                            fontWeight: '600',
                                                            marginBottom: '15px',
                                                            color: '#333'
                                                        }}
                                                    >
                                                        Selected Images ({formData.galleryImages.length})
                                                    </h6>
                                                    <div
                                                        style={{
                                                            display: 'grid',
                                                            gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                                                            gap: '15px',
                                                            marginTop: '10px'
                                                        }}
                                                    >
                                                        {formData.galleryImages.map((image, index) => {
                                                            let imageSrc = '';
                                                            let isExistingImage = false;

                                                            if (typeof image === 'string') {
                                                                isExistingImage = true;
                                                                if (image.startsWith('http')) {
                                                                    imageSrc = image;
                                                                } else {
                                                                    imageSrc = `${API_URL}/${image.replace(/\\/g, '/')}`;
                                                                }
                                                            } else if (image instanceof File) {
                                                                imageSrc = imagePreviewUrls[index] || URL.createObjectURL(image);
                                                            } else {
                                                                imageSrc = imagePreviewUrls[index] || '';
                                                            }

                                                            return (
                                                                <div
                                                                    key={index}
                                                                    style={{
                                                                        position: 'relative',
                                                                        borderRadius: '8px',
                                                                        overflow: 'hidden',
                                                                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                                                        transition: 'transform 0.2s ease',
                                                                        cursor: 'pointer',
                                                                        opacity: deletingImage === index ? 0.5 : 1
                                                                    }}
                                                                    onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.02)')}
                                                                    onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                                                                >
                                                                    <img
                                                                        src={imageSrc}
                                                                        alt={`Gallery ${index + 1}`}
                                                                        style={{
                                                                            width: '100%',
                                                                            height: '140px',
                                                                            objectFit: 'cover',
                                                                            display: 'block'
                                                                        }}
                                                                        onError={(e) => {
                                                                            console.error('Image failed to load:', imageSrc);
                                                                            e.target.style.display = 'none';
                                                                        }}
                                                                    />

                                                                    {/* Loading overlay for deleting */}
                                                                    {deletingImage === index && (
                                                                        <div
                                                                            style={{
                                                                                position: 'absolute',
                                                                                top: '0',
                                                                                left: '0',
                                                                                right: '0',
                                                                                bottom: '0',
                                                                                backgroundColor: 'rgba(0,0,0,0.7)',
                                                                                display: 'flex',
                                                                                alignItems: 'center',
                                                                                justifyContent: 'center',
                                                                                color: 'white'
                                                                            }}
                                                                        >
                                                                            <div style={{ textAlign: 'center' }}>
                                                                                <div className="spinner-border spinner-border-sm mb-2" role="status"></div>
                                                                                <div style={{ fontSize: '12px' }}>Deleting...</div>
                                                                            </div>
                                                                        </div>
                                                                    )}

                                                                    {/* Image Controls */}
                                                                    <div
                                                                        style={{
                                                                            position: 'absolute',
                                                                            top: '8px',
                                                                            right: '8px',
                                                                            display: 'flex',
                                                                            gap: '4px'
                                                                        }}
                                                                    >
                                                                        <Button
                                                                            size="sm"
                                                                            variant="danger"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                handleRemoveImage(index);
                                                                            }}
                                                                            disabled={deletingImage === index}
                                                                            style={{
                                                                                padding: '4px 8px',
                                                                                fontSize: '12px',
                                                                                borderRadius: '50%',
                                                                                width: '28px',
                                                                                height: '28px',
                                                                                display: 'flex',
                                                                                alignItems: 'center',
                                                                                justifyContent: 'center'
                                                                            }}
                                                                        >
                                                                            ×
                                                                        </Button>
                                                                    </div>

                                                                    {/* Image Info */}
                                                                    <div
                                                                        style={{
                                                                            position: 'absolute',
                                                                            bottom: '0',
                                                                            left: '0',
                                                                            right: '0',
                                                                            backgroundColor: 'rgba(0,0,0,0.8)',
                                                                            color: 'white',
                                                                            padding: '6px 8px',
                                                                            fontSize: '11px',
                                                                            textAlign: 'center',
                                                                            whiteSpace: 'nowrap',
                                                                            overflow: 'hidden',
                                                                            textOverflow: 'ellipsis'
                                                                        }}
                                                                    >
                                                                        {isExistingImage
                                                                            ? 'Existing'
                                                                            : `${(image.size / 1024 / 1024).toFixed(1)}MB`}
                                                                    </div>

                                                                    {/* Image Index Badge */}
                                                                    <div
                                                                        style={{
                                                                            position: 'absolute',
                                                                            top: '8px',
                                                                            left: '8px',
                                                                            backgroundColor: 'rgba(0,0,0,0.8)',
                                                                            color: 'white',
                                                                            padding: '4px 8px',
                                                                            borderRadius: '12px',
                                                                            fontSize: '11px',
                                                                            fontWeight: 'bold',
                                                                            minWidth: '20px',
                                                                            textAlign: 'center'
                                                                        }}
                                                                    >
                                                                        {index + 1}
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>

                                                    {/* Instructions */}
                                                    {formData.galleryImages.length > 0 && (
                                                        <div
                                                            className="mt-3"
                                                            style={{
                                                                padding: '10px',
                                                                backgroundColor: '#f8f9fa',
                                                                borderRadius: '6px',
                                                                border: '1px solid #e9ecef'
                                                            }}
                                                        >
                                                            <small
                                                                className="text-muted"
                                                                style={{
                                                                    fontSize: '12px',
                                                                    lineHeight: '1.4',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    gap: '6px'
                                                                }}
                                                            >
                                                                <span>💡</span>
                                                                <span>
                                                                    {id 
                                                                        ? 'Existing images will be updated, new images will be added. Click ✕ to remove.'
                                                                        : 'First image will be the gallery thumbnail. Click ✕ to remove images.'
                                                                    }
                                                                </span>
                                                            </small>
                                                        </div>
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
                                                    !formData.eventId ||
                                                    (!id && formData.galleryImages.length === 0) ||
                                                    deletingImage !== null
                                                }
                                            >
                                                {loading ? (
                                                    <>
                                                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                                        {id ? 'Updating...' : 'Creating...'}
                                                    </>
                                                ) : (
                                                    id ? 'Update Gallery' : 'Create Gallery'
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

export default AddGalleryPage; 