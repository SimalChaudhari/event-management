import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Button, Form, Alert, Badge, Modal } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import 'bootstrap/dist/css/bootstrap.min.css';
import { 
    getBanners, 
    getBannerEvents, 
    uploadBanners, 
    uploadBannerEvents,
    deleteBannerImage,
    deleteBannerEventImage,
    clearAllBanners,
    clearAllBannerEvents,
    updateBannerEventHyperlink,
    updateBannerHyperlink
} from '../../../store/actions/bannerActions';

const BannerManagement = () => {
    const dispatch = useDispatch();
    const { banners, bannerEvents, loading, error } = useSelector(state => state.banner);
    
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [bannerType, setBannerType] = useState('event');
    const [dragActive, setDragActive] = useState(false);
    const [showImageModal, setShowImageModal] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);
    const [showClearModal, setShowClearModal] = useState(false);
    const [clearType, setClearType] = useState('');
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteItem, setDeleteItem] = useState(null);
    // State for hyperlinks - array for both home and event banners
    const [hyperlinks, setHyperlinks] = useState([]); // Array of hyperlinks for both banner types
    // State for editing hyperlinks
    const [editingHyperlink, setEditingHyperlink] = useState(null);
    const [tempHyperlink, setTempHyperlink] = useState('');

    // Load data on component mount
    useEffect(() => {
        dispatch(getBanners());
        dispatch(getBannerEvents());
    }, [dispatch]);

    const handleFileSelect = (event) => {
        const files = Array.from(event.target.files);
        const newFiles = [...selectedFiles, ...files];
        setSelectedFiles(newFiles);
        // Initialize hyperlinks array to match files length
        setHyperlinks(prev => [...prev, ...new Array(files.length).fill('')]);
    };

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const files = Array.from(e.dataTransfer.files).filter(file => file.type.startsWith('image/'));
            const newFiles = [...selectedFiles, ...files];
            setSelectedFiles(newFiles);
            // Initialize hyperlinks array to match files length
            setHyperlinks(prev => [...prev, ...new Array(files.length).fill('')]);
        }
    };

    const removeFile = (index) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
        setHyperlinks(prev => prev.filter((_, i) => i !== index));
    };

    const handleImageClick = (imageUrl, filename) => {
        setSelectedImage({ imageUrl, filename });
        setShowImageModal(true);
    };

    const handleUpload = async () => {
        if (selectedFiles.length === 0) {
            alert('Please select at least one image');
            return;
        }

        const success = bannerType === 'event' 
            ? await dispatch(uploadBannerEvents(selectedFiles, hyperlinks))
            : await dispatch(uploadBanners(selectedFiles, hyperlinks));

        if (success) {
            setSelectedFiles([]);
            setHyperlinks([]);
            setBannerType('event');
            dispatch(getBanners());
            dispatch(getBannerEvents());
        }
    };

    const handleDeleteBanner = async (imageUrl, type) => {
        setDeleteItem({ imageUrl, type });
        setShowDeleteModal(true);
    };

    const confirmDeleteBanner = async () => {
        if (!deleteItem) return;

        const success = deleteItem.type === 'event' 
            ? await dispatch(deleteBannerEventImage(deleteItem.imageUrl))
            : await dispatch(deleteBannerImage(deleteItem.imageUrl));

        if (success) {
            dispatch(getBanners());
            dispatch(getBannerEvents());
            setShowDeleteModal(false);
            setDeleteItem(null);
        }
    };

    const handleClearAll = (type) => {
        setClearType(type);
        setShowClearModal(true);
    };

    const confirmClearAll = async () => {
        const success = clearType === 'event' 
            ? await dispatch(clearAllBannerEvents())
            : await dispatch(clearAllBanners());

        if (success) {
            setShowClearModal(false);
            setClearType('');
        }
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const handleEditHyperlink = (imageUrl, currentHyperlink) => {
        setEditingHyperlink(imageUrl);
        setTempHyperlink(currentHyperlink || '');
    };

    const handleSaveHyperlink = async (imageUrl, type) => {
        if (editingHyperlink === imageUrl) {
            // Ensure we send the relative path (remove API URL prefix if present)
            const normalizedImageUrl = imageUrl.replace(/^.*\/uploads\//, 'uploads/');
            const success = type === 'event' 
                ? await dispatch(updateBannerEventHyperlink(normalizedImageUrl, tempHyperlink))
                : await dispatch(updateBannerHyperlink(normalizedImageUrl, tempHyperlink));
            if (success) {
                setEditingHyperlink(null);
                setTempHyperlink('');
                dispatch(getBannerEvents());
                dispatch(getBanners());
            }
        }
    };

    const handleCancelEdit = () => {
        setEditingHyperlink(null);
        setTempHyperlink('');
    };

    const renderBannerCard = (banner, type) => (
        <Col key={banner.id} md={4} lg={3} className="mb-4">
            <Card className="h-100 shadow-sm border-0 banner-card">
                <div className="position-relative">
                    <Card.Img 
                        variant="top" 
                        src={`${process.env.REACT_APP_API_URL}/${banner.imageUrl}`} 
                        style={{ height: '180px', objectFit: 'cover' }}
                        className="banner-image"
                        onClick={() => handleImageClick(banner.imageUrl, banner.filename)}
                    />
                    <div className="banner-overlay">
                        <Button
                            variant="light"
                            size="sm"
                            className="zoom-btn"
                            onClick={() => handleImageClick(banner.imageUrl, banner.filename)}
                        >
                            <i className="fas fa-search-plus"></i>
                        </Button>
                    </div>
                    <Badge 
                        bg={type === 'event' ? 'success' : 'info'} 
                        className="position-absolute top-0 start-0 m-2"
                    >
                        {type === 'event' ? 'Event(Home)' : 'Login Page'}
                    </Badge>
                </div>
                <Card.Body className="d-flex flex-column">
                    <Card.Text className="text-muted small mb-2 text-truncate">
                        {banner.filename || 'Banner Image'}
                    </Card.Text>
                    
                    {/* Editable Hyperlink Section */}
                    <div className="mb-2 p-2" style={{ backgroundColor: '#f8f9fa', borderRadius: '8px', border: '1px solid #dee2e6' }}>
                        {editingHyperlink === banner.imageUrl ? (
                            <div className="d-flex flex-column gap-2">
                                <Form.Label className="small fw-bold mb-0 d-flex align-items-center">
                                    <i className="fas fa-link text-primary" style={{ marginRight: '6px' }}></i>
                                    Hyperlink URL
                                </Form.Label>
                                <Form.Control
                                    type="url"
                                    size="sm"
                                    placeholder="https://example.com"
                                    value={tempHyperlink}
                                    onChange={(e) => setTempHyperlink(e.target.value)}
                                    className="border-primary"
                                />
                                <Form.Text className="text-muted small mb-0 d-flex align-items-center">
                                    <i className="fas fa-info-circle" style={{ marginRight: '6px' }}></i>
                                    This link will open when the banner is clicked
                                </Form.Text>
                                <div className="d-flex gap-2 mt-1">
                                    <Button
                                        variant="success"
                                        size="sm"
                                        onClick={() => handleSaveHyperlink(banner.imageUrl, type)}
                                        disabled={loading}
                                        className="flex-fill"
                                    >
                                        <i className="fas fa-check" style={{ marginRight: '8px' }}></i>
                                        Save Link
                                    </Button>
                                    <Button
                                        variant="outline-secondary"
                                        size="sm"
                                        onClick={handleCancelEdit}
                                        className="flex-fill"
                                    >
                                        <i className="fas fa-times" style={{ marginRight: '8px' }}></i>
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="d-flex flex-column gap-2">
                                <div className="d-flex align-items-center justify-content-between">
                                    <Form.Label className="small fw-bold mb-0 d-flex align-items-center">
                                        <i className="fas fa-link" style={{ marginRight: '6px' }}></i>
                                        Hyperlink
                                    </Form.Label>
                                    {banner.hyperlink ? (
                                        <Button
                                            variant="outline-primary"
                                            size="sm"
                                            onClick={() => handleEditHyperlink(banner.imageUrl, banner.hyperlink)}
                                            title="Edit hyperlink"
                                        >
                                            <i className="fas fa-edit" style={{ marginRight: '8px' }}></i>
                                            Edit
                                        </Button>
                                    ) : (
                                        <Button
                                            variant="outline-success"
                                            size="sm"
                                            onClick={() => handleEditHyperlink(banner.imageUrl, '')}
                                            title="Add hyperlink"
                                        >
                                            <i className="fas fa-plus" style={{ marginRight: '8px' }}></i>
                                            Add Link
                                        </Button>
                                    )}
                                </div>
                                {banner.hyperlink ? (
                                    <div className="p-2 bg-white rounded border">
                                        <a 
                                            href={banner.hyperlink} 
                                            target="_blank" 
                                            rel="noopener noreferrer" 
                                            className="text-decoration-none text-primary small d-flex align-items-center"
                                            title={banner.hyperlink}
                                        >
                                            <i className="fas fa-external-link-alt" style={{ marginRight: '8px' }}></i>
                                            <span className="text-truncate">{banner.hyperlink}</span>
                                        </a>
                                    </div>
                                ) : (
                                    <div className="p-2 bg-light rounded text-muted small text-center">
                                        <i className="fas fa-link-slash" style={{ marginRight: '6px' }}></i>
                                        No hyperlink set
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    
                    <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => handleDeleteBanner(banner.imageUrl, type)}
                        className="mt-auto"
                        disabled={loading}
                    >
                        <i className="fas fa-trash me-1" style={{ marginRight: '8px' }}></i>
                        Delete
                    </Button>
                </Card.Body>
            </Card>
        </Col>
    );

    return (
        <div style={{ background: '#fff', borderRadius: 10, padding: 24 }}>
            {error && (
                <Alert variant="danger" className="mb-4">
                    {error}
                </Alert>
            )}

            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <p className="text-muted mb-0">Upload and manage your event and home banners</p>
                </div>
            </div>
            
            {/* Upload Section */}
            <Card className="mb-4 border-0 shadow">
                <Card.Header className="text-white py-3" style={{ backgroundColor: '#71C0BB' }}>
                    <div className="d-flex align-items-center">
                        <div>
                            <h5 className="mb-1">Upload New Banners</h5>
                            <small className="opacity-75">
                                Select multiple images for {bannerType === 'home' ? 'login page' : 'event(home)'} banners
                            </small>
                        </div>
                    </div>
                </Card.Header>
                <Card.Body className="p-4"> 
                    <Row className="g-4">
                        {/* Banner Type Selection */}
                        <Col lg={4}>
                            <div className="upload-section">
                                <label className="form-label fw-bold mb-3">
                                    Banner Type : 
                                </label>
                                <div className="banner-type-selector">
                                    <div 
                                        className={`banner-type-option ${bannerType === 'event' ? 'active' : ''}`}
                                        onClick={() => {
                                            setBannerType('event');
                                            setSelectedFiles([]);
                                            setHyperlinks([]);
                                        }}
                                    >
                                        <div className="banner-type-icon">
                                            <i className="fas fa-calendar-alt"></i>
                                        </div>
                                        <div className="banner-type-content">
                                            <h6 className="mb-1">Event(Home) Banners</h6>
                                            <small className="text-muted">Multiple images for home pages</small>
                                        </div>
                                        {bannerType === 'event' && (
                                            <div className="banner-type-check">
                                                <i className="fas fa-check"></i>
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div 
                                        className={`banner-type-option ${bannerType === 'home' ? 'active' : ''}`}
                                        onClick={() => {
                                            setBannerType('home');
                                            setSelectedFiles([]);
                                            setHyperlinks([]);
                                        }}
                                    >
                                        <div className="banner-type-icon">
                                            <i className="fas fa-home"></i>
                                        </div>
                                        <div className="banner-type-content">
                                            <h6 className="mb-1">Login Page Banners</h6>
                                            <small className="text-muted">Multiple images for login page</small>
                                        </div>
                                        {bannerType === 'home' && (
                                            <div className="banner-type-check">
                                                <i className="fas fa-check"></i>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </Col>

                        {/* File Upload Area */}
                        <Col lg={8}>
                            <div className="upload-section">
                                <label className="form-label fw-bold mb-3">
                                    Select Images :
                                </label>
                                
                                {/* Drag & Drop Zone */}
                                <div 
                                    className={`upload-zone ${dragActive ? 'drag-active' : ''} ${selectedFiles.length > 0 ? 'has-files' : ''}`}
                                    onDragEnter={handleDrag}
                                    onDragLeave={handleDrag}
                                    onDragOver={handleDrag}
                                    onDrop={handleDrop}
                                >
                                    {selectedFiles.length === 0 ? (
                                        <>
                                            <input
                                                type="file"
                                                multiple
                                                accept="image/*"
                                                onChange={handleFileSelect}
                                                className="file-input"
                                                id="file-upload"
                                            />
                                            <div className="upload-placeholder">
                                                <div className="upload-icon">
                                                    <i className="fas fa-cloud-upload-alt"></i>
                                                </div>
                                                <h5 className="mt-3 mb-2">
                                                    Drop images here or click to browse
                                                </h5>
                                                <p className="text-muted mb-0">
                                                    Supports JPG, PNG (Multiple images)
                                                </p>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="selected-files">
                                            <div className="selected-files-header">
                                                <h6 className="mb-0">
                                                    <i className="fas fa-check-circle text-success me-2" style={{ marginRight: '4px' }}></i>
                                                    {selectedFiles.length} file(s) selected
                                                </h6>
                                                <Button
                                                    variant="outline-danger"
                                                    size="sm"
                                                    onClick={() => {
                                                        setSelectedFiles([]);
                                                        setHyperlinks([]);
                                                    }}
                                                >
                                                    <i className="fas fa-times me-1" style={{ marginRight: '4px' }}></i>
                                                    Clear All
                                                </Button>
                                            </div>
                                            <div className="files-grid">
                                                {selectedFiles.map((file, index) => (
                                                    <div key={index} className="file-preview">
                                                        <div className="file-preview-image">
                                                            <img 
                                                                src={URL.createObjectURL(file)} 
                                                                alt={file.name}
                                                            />
                                                        </div>
                                                        <div className="file-preview-info">
                                                            <div className="file-name">{file.name}</div>
                                                            <div className="file-size">{formatFileSize(file.size)}</div>
                                                        </div>
                                                        {/* Hyperlink input for all banners */}
                                                        <div className="file-hyperlink-input">
                                                            <Form.Label className="small fw-bold mb-1 d-flex align-items-center">
                                                                <i className="fas fa-link" style={{ marginRight: '6px' }}></i>
                                                                Hyperlink (Optional)
                                                            </Form.Label>
                                                            <Form.Control
                                                                type="url"
                                                                size="sm"
                                                                placeholder="https://example.com"
                                                                value={hyperlinks[index] || ''}
                                                                onChange={(e) => {
                                                                    const newHyperlinks = [...hyperlinks];
                                                                    newHyperlinks[index] = e.target.value;
                                                                    setHyperlinks(newHyperlinks);
                                                                }}
                                                                className="mt-1"
                                                            />
                                                            <Form.Text className="text-muted small">
                                                                Link opens when banner is clicked
                                                            </Form.Text>
                                                        </div>
                                                        <Button
                                                            variant="outline-danger"
                                                            size="sm"
                                                            className="file-remove"
                                                            onClick={() => removeFile(index)}
                                                        >
                                                            <i className="fas fa-times"></i>
                                                        </Button>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="add-more-files">
                                                <Button
                                                    variant="outline-primary"
                                                    size="sm"
                                                    onClick={() => document.getElementById('file-upload-more').click()}
                                                >
                                                    <i className="fas fa-plus me-1" style={{ marginRight: '4px' }}></i>
                                                    Add More Files
                                                </Button>
                                                <input
                                                    type="file"
                                                    multiple
                                                    accept="image/*"
                                                    onChange={handleFileSelect}
                                                    className="file-input-hidden"
                                                    id="file-upload-more"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Col>
                    </Row>

                    {/* Upload Button */}
                    <div className="upload-actions mt-4">
                        <Button
                            variant="primary"
                            size="lg"
                            onClick={handleUpload}
                            disabled={loading || selectedFiles.length === 0}
                            className="upload-btn"
                        >
                            {loading ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                    Uploading {selectedFiles.length} file(s)...
                                </>
                            ) : (
                                <>
                                    <i className="fas fa-upload" style={{ marginRight: '4px' }}></i>
                                    Upload {bannerType === 'home' ? 'Login Page' : 'Event(Home)'} Banner
                                </>
                            )}
                        </Button>
                    </div>
                </Card.Body>
            </Card>

            {/* Event(Home) Banners Section */}
            <Card className="mb-4 border-0 shadow">
                <Card.Header className="text-white py-3" style={{ backgroundColor: '#71C0BB' }}>
                    <div className="d-flex justify-content-between align-items-center">
                        <div className="d-flex align-items-center">
                            <div>
                                <h5 className="mb-1">Event(Home) Banners</h5>
                                <small className="opacity-75">Manage your home page banners</small>
                            </div>
                        </div>
                        <div className="d-flex align-items-center" style={{ gap: '0.2rem' }}>
                            <Badge bg="light" text="dark" className="fs-6" style={{ cursor: 'pointer' }}>
                                {bannerEvents?.imageUrls?.length || 0} banners
                            </Badge>
                            {bannerEvents?.imageUrls?.length > 0 && (
                                <Badge bg="light" text="danger" className="fs-6" onClick={() => handleClearAll('event')} style={{ cursor: 'pointer' }}>                     
                                    <i className="fas fa-trash me-1" style={{ marginRight: '8px' }}></i>
                                    Clear All
                                </Badge>
                            )}
                        </div>
                    </div>
                </Card.Header>
                <Card.Body className="p-4">
                    {!bannerEvents || bannerEvents.imageUrls?.length === 0 ? (
                        <div className="text-center py-5">
                            <div className="empty-state">
                                <i className="fas fa-home fa-3x text-muted mb-3"></i>
                                <h5 className="text-muted">No Event(Home) Banners</h5>
                                <p className="text-muted mb-0">Upload some home banners to get started</p>
                            </div>
                        </div>
                    ) : (
                        <Row>
                            {bannerEvents.imageUrls?.map((imageUrl, index) => 
                                renderBannerCard({ 
                                    id: index, 
                                    imageUrl, 
                                    filename: `Event(Home) Banner ${index + 1}`,
                                    hyperlink: bannerEvents.hyperlinks && bannerEvents.hyperlinks[index] 
                                        ? bannerEvents.hyperlinks[index] 
                                        : undefined
                                }, 'event')
                            )}
                        </Row>
                    )}
                </Card.Body>
            </Card>

            {/* Login Page Banners Section */}
            <Card className="border-0 shadow">
                <Card.Header className="text-white py-3" style={{ backgroundColor: '#71C0BB' }}>
                    <div className="d-flex justify-content-between align-items-center">
                        <div className="d-flex align-items-center">
                            <div>
                                <h5 className="mb-1">Login Page Banners</h5>
                                <small className="opacity-75">Manage your login page banners</small>
                            </div>
                        </div>
                        <div className="d-flex align-items-center" style={{ gap: '0.2rem' }}>
                            <Badge bg="light" text="dark" className="fs-6" style={{ cursor: 'pointer' }}>
                                {banners?.imageUrls?.length || 0} banners
                            </Badge>
                            {banners?.imageUrls && banners.imageUrls.length > 0 && (
                                <Badge bg="light" text="danger" className="fs-6" onClick={() => handleClearAll('home')} style={{ cursor: 'pointer' }}>
                                    <i className="fas fa-trash me-1" style={{ marginRight: '8px' }}></i>
                                    Clear All
                                </Badge>
                            )}
                        </div>
                    </div>
                </Card.Header>
                <Card.Body className="p-4">
                    {!banners || !banners.imageUrls || banners.imageUrls.length === 0 ? (
                        <div className="text-center py-5">
                            <div className="empty-state">
                                <i className="fas fa-sign-in-alt fa-3x text-muted mb-3"></i>
                                <h5 className="text-muted">No Login Page Banners</h5>
                                <p className="text-muted mb-0">Upload some login page banners to get started</p>
                            </div>
                        </div>
                    ) : (
                        <Row>
                            {banners.imageUrls.map((imageUrl, index) => 
                                renderBannerCard({ 
                                    id: index, 
                                    imageUrl, 
                                    filename: `Login Page Banner ${index + 1}`,
                                    hyperlink: banners.hyperlinks && banners.hyperlinks[index] 
                                        ? banners.hyperlinks[index] 
                                        : undefined
                                }, 'home')
                            )}
                        </Row>
                    )}
                </Card.Body>
            </Card>

            {/* Image Zoom Modal - Event Images Style */}
            <Modal 
                show={showImageModal} 
                onHide={() => setShowImageModal(false)}
                size="xl"
                centered
                contentClassName="bg-dark border-0"
            >
                <Modal.Body className="p-0 position-relative" style={{ minHeight: '90vh', backgroundColor: 'rgba(0,0,0,0.95)' }}>
                    {/* Close Button */}
                    <Button
                        variant="light"
                        size="sm"
                        onClick={() => setShowImageModal(false)}
                        className="position-fixed"
                        style={{
                            top: '20px',
                            right: '20px',
                            borderRadius: '50%',
                            width: '40px',
                            height: '40px',
                            zIndex: 1000,
                            backgroundColor: 'rgba(0,0,0,0.7)',
                            border: 'none',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        <i className="fas fa-times"></i>
                    </Button>

                    {/* Image Container */}
                    <div
                        className="d-flex justify-content-center align-items-center"
                        style={{
                            minHeight: '90vh',
                            padding: '60px 80px 80px 80px'
                        }}
                    >
                    {selectedImage && (
                        <img 
                            src={`${process.env.REACT_APP_API_URL}/${selectedImage.imageUrl}`} 
                            alt={selectedImage.filename}
                            style={{ 
                                    maxWidth: '100%',
                                    maxHeight: 'calc(100vh - 160px)',
                                    objectFit: 'contain',
                                    borderRadius: '8px',
                                    background: 'white',
                                    padding: '20px',
                                    boxShadow: '0 8px 32px rgba(0,0,0,0.5)'
                                }}
                                onError={(e) => {
                                    console.error('Banner image failed to load:', selectedImage.imageUrl);
                                    e.target.style.display = 'none';
                                }}
                            />
                        )}
                    </div>

                    {/* Image Info Footer */}
                    {selectedImage && (
                        <div
                            className="position-fixed text-white text-center"
                            style={{
                                bottom: '20px',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                backgroundColor: 'rgba(0,0,0,0.7)',
                                padding: '8px 20px',
                                borderRadius: '20px',
                                fontSize: '14px',
                                fontWeight: 'bold',
                                zIndex: 1000
                            }}
                        >
                            <i className="fas fa-image" style={{ marginRight: '8px' }}></i>
                            {selectedImage.filename || 'Banner Image'}
                        </div>
                    )}
                </Modal.Body>
            </Modal>

            {/* Clear All Confirmation Modal */}
            <Modal 
                show={showClearModal} 
                onHide={() => setShowClearModal(false)}
                centered
            >
                <Modal.Header>
                    <Modal.Title>
                        <i className="fas fa-exclamation-triangle text-warning me-2" style={{ marginRight: '8px' }}></i>
                        Confirm Clear All
                    </Modal.Title>
                    {/* Custom Close Button */}
                    <button
                        type="button"
                        className="custom-close-btn"
                        aria-label="Close"
                        onClick={() => setShowClearModal(false)}
                        style={{
                            background: 'none',
                            border: 'none',
                            fontSize: '1.8rem',
                            fontWeight: 'bold',
                            color: '#333',
                            position: 'absolute',
                            top: '10px',
                            right: '24px',
                            cursor: 'pointer',
                            zIndex: 10
                        }}
                    >
                        &times;
                    </button>
                </Modal.Header>
                <Modal.Body className="py-3 px-4">
                    <p className="mb-1">Are you sure you want to clear all {clearType === 'event' ? 'event(home)' : 'login page'} banners?</p>
                    <p className="text-muted small mb-0">This action cannot be undone.</p>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowClearModal(false)}>
                        Cancel
                    </Button>
                    <Button variant="danger" onClick={confirmClearAll} disabled={loading}>
                        {loading ? (
                            <>
                                <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                Clearing...
                            </>
                        ) : (
                            'Clear All'
                        )}
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Single Delete Confirmation Modal */}
            <Modal 
                show={showDeleteModal} 
                onHide={() => setShowDeleteModal(false)}
                centered
            >
                <Modal.Header>
                    <Modal.Title>
                        <i className="fas fa-exclamation-triangle text-warning me-2" style={{ marginRight: '8px' }}></i>
                        Confirm Delete
                    </Modal.Title>
                    {/* Custom Close Button */}
                    <button
                        type="button"
                        className="custom-close-btn"
                        aria-label="Close"
                        onClick={() => setShowDeleteModal(false)}
                        style={{
                            background: 'none',
                            border: 'none',
                            fontSize: '1.8rem',
                            fontWeight: 'bold',
                            color: '#333',
                            position: 'absolute',
                            top: '10px',
                            right: '24px',
                            cursor: 'pointer',
                            zIndex: 10
                        }}
                    >
                        &times;
                    </button>
                </Modal.Header>
                <Modal.Body className="py-3 px-4">
                    <p className="mb-1">Are you sure you want to delete this banner?</p>
                    <p className="text-muted small mb-0">This action cannot be undone.</p>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
                        Cancel
                    </Button>
                    <Button variant="danger" onClick={confirmDeleteBanner} disabled={loading}>
                        {loading ? (
                            <>
                                <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                Deleting...
                            </>
                        ) : (
                            'Delete'
                        )}
                    </Button>
                </Modal.Footer>
            </Modal>

            <style jsx>{`
                .bg-gradient-primary {
                    background: #71C0BB;
                }
                
                .bg-gradient-success {
                    background: #71C0BB;
                }
                
                .bg-gradient-info {
                    background: #71C0BB;
                }

                .upload-section {
                    height: 100%;
                }

                .banner-type-selector {
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                }

                .banner-type-option {
                    display: flex;
                    align-items: center;
                    padding: 20px;
                    border: 2px solid #e9ecef;
                    border-radius: 12px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    position: relative;
                }

                .banner-type-option:hover {
                    border-color: #007bff;
                    background-color: #f8f9fa;
                }

                .banner-type-option.active {
                    border-color: #007bff;
                    background-color: #e7f3ff;
                }

                .banner-type-icon {
                    width: 56px;
                    height: 56px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-size: 24px;
                    margin-right: 20px;
                }

                .banner-type-content {
                    flex: 1;
                }

                .banner-type-content h6 {
                    margin-bottom: 4px;
                    font-weight: 600;
                }

                .banner-type-content small {
                    font-size: 13px;
                }

                .banner-type-check {
                    width: 28px;
                    height: 28px;
                    background: #007bff;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-size: 14px;
                }

                .upload-zone {
                    border: 2px dashed #dee2e6;
                    border-radius: 12px;
                    padding: 40px;
                    text-align: center;
                    transition: all 0.3s ease;
                    min-height: 200px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    position: relative;
                }

                .upload-zone:hover {
                    border-color: #007bff;
                    background-color: #f8f9fa;
                }

                .upload-zone.drag-active {
                    border-color: #007bff;
                    background-color: #e7f3ff;
                }

                .upload-zone.has-files {
                    padding: 20px;
                    min-height: auto;
                }

                .file-input {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    opacity: 0;
                    cursor: pointer;
                    pointer-events: auto;
                }

                .file-input-hidden {
                    position: absolute;
                    top: -9999px;
                    left: -9999px;
                    opacity: 0;
                    pointer-events: none;
                }

                .upload-placeholder {
                    pointer-events: none;
                }

                .upload-icon {
                    font-size: 48px;
                    color: #6c757d;
                    margin-bottom: 16px;
                }

                .selected-files {
                    width: 100%;
                    pointer-events: auto;
                }

                .selected-files-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 16px;
                    padding-bottom: 12px;
                    border-bottom: 1px solid #dee2e6;
                    pointer-events: auto;
                }

                .files-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
                    gap: 12px;
                    pointer-events: auto;
                    margin-bottom: 16px;
                }

                .add-more-files {
                    text-align: center;
                    padding-top: 16px;
                    border-top: 1px solid #dee2e6;
                }

                .file-preview {
                    position: relative;
                    border: 1px solid #dee2e6;
                    border-radius: 8px;
                    overflow: hidden;
                    background: white;
                }

                .file-preview-image {
                    width: 100%;
                    height: 120px;
                    overflow: hidden;
                }

                .file-preview-image img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }

                .file-preview-info {
                    padding: 8px 12px;
                }

                .file-name {
                    font-size: 12px;
                    font-weight: 500;
                    color: #495057;
                    margin-bottom: 2px;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .file-size {
                    font-size: 11px;
                    color: #6c757d;
                }

                .file-hyperlink-input {
                    padding: 8px 12px;
                    background-color: #f8f9fa;
                    border-top: 1px solid #dee2e6;
                }

                .file-hyperlink-input .form-control {
                    font-size: 12px;
                    padding: 6px 10px;
                    border-radius: 6px;
                }

                .file-hyperlink-input label {
                    color: #495057;
                    font-size: 12px;
                }

                .file-hyperlink-input .form-text {
                    font-size: 11px;
                    margin-top: 4px;
                }

                .file-remove {
                    position: absolute;
                    top: 4px;
                    right: 4px;
                    width: 24px;
                    height: 24px;
                    border-radius: 50%;
                    padding: 0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 10px;
                }

                .upload-actions {
                    text-align: center;
                }

                .upload-btn {
                    padding: 12px 32px;
                    font-weight: 600;
                    border-radius: 8px;
                }

                .empty-state {
                    padding: 40px 20px;
                }

                .card {
                    border-radius: 12px;
                    overflow: hidden;
                }

                .card-header {
                    border-bottom: none;
                }

                .badge {
                    padding: 8px 16px;
                    border-radius: 20px;
                }

                .banner-card {
                    transition: transform 0.2s ease;
                }

                .banner-card:hover {
                    transform: translateY(-2px);
                }

                .banner-image {
                    cursor: pointer;
                    transition: all 0.3s ease;
                }

                .banner-image:hover {
                    opacity: 0.8;
                }

                .banner-overlay {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.5);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    opacity: 0;
                    transition: opacity 0.3s ease;
                }

                .banner-card:hover .banner-overlay {
                    opacity: 1;
                }

                .zoom-btn {
                    border-radius: 50%;
                    width: 40px;
                    height: 40px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 14px;
                }

                .modal-content {
                    border-radius: 12px;
                    overflow: hidden;
                }

                .modal-header {
                    border-bottom: 1px solid #dee2e6;
                    padding: 20px 24px;
                }

                .modal-body {
                    padding: 0;
                }
            `}</style>
        </div>
    );
};

export default BannerManagement;
