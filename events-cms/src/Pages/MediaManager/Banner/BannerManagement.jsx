import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Button, Form, Alert, Badge, Modal } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import 'bootstrap/dist/css/bootstrap.min.css';
import './BannerManagement.css';
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
    updateBannerHyperlink,
    reorderBanners,
    reorderBannerEvents
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

    const handleBannerOrderDragStart = (e, sortIndex, type) => {
        e.stopPropagation();
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData(
            'text/plain',
            JSON.stringify({ sortIndex, type }),
        );
    };

    const handleBannerOrderDragOver = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleBannerOrderDrop = async (e, dropIndex, type) => {
        e.preventDefault();
        e.stopPropagation();
        let payload;
        try {
            payload = JSON.parse(e.dataTransfer.getData('text/plain'));
        } catch {
            return;
        }
        const { sortIndex: fromIndex, type: fromType } = payload;
        if (fromType !== type || fromIndex === dropIndex) return;

        const urls =
            type === 'event'
                ? [...(bannerEvents?.imageUrls || [])]
                : [...(banners?.imageUrls || [])];
        if (!urls.length) return;

        const next = [...urls];
        const [moved] = next.splice(fromIndex, 1);
        next.splice(dropIndex, 0, moved);

        if (type === 'event') {
            await dispatch(reorderBannerEvents(next));
        } else {
            await dispatch(reorderBanners(next));
        }
    };

    const renderBannerCard = (banner, type, sortIndex) => (
        <Col
            key={`${type}-${banner.imageUrl}`}
            xs={12}
            sm={6}
            md={6}
            lg={4}
            xl={3}
            className="mb-4"
            onDragOver={handleBannerOrderDragOver}
            onDrop={(e) => handleBannerOrderDrop(e, sortIndex, type)}
        >
            <Card className="h-100 shadow-sm border-0 banner-card">
                <div className="position-relative">
                    <div
                        className="banner-drag-handle"
                        draggable
                        onDragStart={(e) =>
                            handleBannerOrderDragStart(e, sortIndex, type)
                        }
                        title="Drag to reorder"
                        role="button"
                        aria-label="Drag to reorder banner"
                    >
                        <i className="fas fa-grip-vertical" />
                    </div>
                    <Card.Img 
                        variant="top" 
                        src={`${process.env.REACT_APP_API_URL}/${banner.imageUrl}`} 
                        className="banner-image banner-image-responsive"
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
                <Card.Body className="d-flex flex-column banner-card-body">
                    <div className="d-flex flex-wrap justify-content-between align-items-start gap-2 mb-3 banner-card-title-row">
                        <Card.Text className="mb-0 flex-grow-1 min-w-0 banner-card-title" as="div">
                            {banner.filename || 'Banner Image'}
                        </Card.Text>
                        <Button
                            variant="outline-danger"
                            size="sm"
                            className="banner-remove-compact flex-shrink-0"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteBanner(banner.imageUrl, type);
                            }}
                            disabled={loading}
                            title="Remove this banner"
                            aria-label="Remove this banner"
                        >
                            <i className="fas fa-trash-alt" aria-hidden />
                        </Button>
                    </div>

                    {/* Click-through URL */}
                    <div className="banner-link-section">
                        <div className="banner-link-section-head">
                            <span className="banner-link-section-title">
                                <i className="fas fa-link" aria-hidden />
                                Click-through URL
                            </span>
                            {editingHyperlink !== banner.imageUrl && (
                                <>
                                    {banner.hyperlink ? (
                                        <Button
                                            variant="light"
                                            size="sm"
                                            className="banner-link-head-btn"
                                            onClick={() =>
                                                handleEditHyperlink(
                                                    banner.imageUrl,
                                                    banner.hyperlink,
                                                )
                                            }
                                            title="Edit URL"
                                        >
                                            <i className="fas fa-edit" aria-hidden />
                                            <span>Edit</span>
                                        </Button>
                                    ) : (
                                        <Button
                                            variant="light"
                                            size="sm"
                                            className="banner-link-head-btn banner-link-head-btn-add"
                                            onClick={() =>
                                                handleEditHyperlink(banner.imageUrl, '')
                                            }
                                            title="Add URL"
                                        >
                                            <i className="fas fa-plus" aria-hidden />
                                            <span>Add URL</span>
                                        </Button>
                                    )}
                                </>
                            )}
                        </div>
                        <div className="banner-link-section-body">
                            {editingHyperlink === banner.imageUrl ? (
                                <div className="banner-link-edit">
                                    <Form.Label
                                        htmlFor={`banner-url-${type}-${sortIndex}`}
                                        className="banner-link-field-label"
                                    >
                                        Destination URL
                                    </Form.Label>
                                    <Form.Control
                                        id={`banner-url-${type}-${sortIndex}`}
                                        type="url"
                                        size="sm"
                                        placeholder="https://example.com/page"
                                        value={tempHyperlink}
                                        onChange={(e) =>
                                            setTempHyperlink(e.target.value)
                                        }
                                        className="banner-link-field-control"
                                    />
                                    <p className="banner-link-field-hint">
                                        Opens in a new tab when attendees tap this
                                        banner (optional).
                                    </p>
                                    <div className="banner-link-edit-actions">
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            onClick={handleCancelEdit}
                                            disabled={loading}
                                            className="banner-link-action-btn"
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            size="sm"
                                            onClick={() =>
                                                handleSaveHyperlink(
                                                    banner.imageUrl,
                                                    type,
                                                )
                                            }
                                            disabled={loading}
                                            className="banner-link-action-btn banner-link-save-btn"
                                        >
                                            {loading ? (
                                                <>
                                                    <span
                                                        className="spinner-border spinner-border-sm me-1"
                                                        role="status"
                                                    />
                                                    Saving
                                                </>
                                            ) : (
                                                <>
                                                    <i
                                                        className="fas fa-check me-1"
                                                        aria-hidden
                                                    />
                                                    Save
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            ) : banner.hyperlink ? (
                                <a
                                    href={banner.hyperlink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="banner-link-display"
                                    title={banner.hyperlink}
                                >
                                    <span className="banner-link-display-text">
                                        {banner.hyperlink}
                                    </span>
                                    <span className="banner-link-display-meta">
                                        <i
                                            className="fas fa-external-link-alt"
                                            aria-hidden
                                        />
                                        Open
                                    </span>
                                </a>
                            ) : (
                                <div className="banner-link-empty">
                                    <i
                                        className="fas fa-mouse-pointer banner-link-empty-icon"
                                        aria-hidden
                                    />
                                    <p className="banner-link-empty-title">
                                        No destination URL
                                    </p>
                                    <p className="banner-link-empty-text">
                                        Add a link if this banner should open a
                                        page when tapped.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </Card.Body>
            </Card>
        </Col>
    );

    return (
        <div className="banner-management-page">
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
                <Card.Header className="text-white py-3 banner-list-card-header" style={{ backgroundColor: '#71C0BB' }}>
                    <div className="d-flex flex-column flex-md-row align-items-stretch align-items-md-center justify-content-between gap-3">
                        <div className="banner-list-header-copy flex-grow-1 min-w-0">
                            <h5 className="banner-list-header-title text-white mb-2">
                                Event (Home) Banners
                            </h5>
                            <p className="banner-list-header-desc text-white mb-0">
                                Manage your home page banners. Drag the grip icon on a card to reorder.
                            </p>
                        </div>
                        <div
                            className={`banner-header-actions-row${
                                (bannerEvents?.imageUrls?.length || 0) > 0
                                    ? ' banner-header-actions-row--pair'
                                    : ''
                            }`}
                        >
                            <div
                                className="banner-header-tile banner-header-tile-stat"
                                role="status"
                            >
                                <span className="banner-header-tile-value">
                                    {bannerEvents?.imageUrls?.length || 0}
                                </span>
                                <span className="banner-header-tile-label">
                                    Banners
                                </span>
                            </div>
                            {(bannerEvents?.imageUrls?.length || 0) > 0 && (
                                <Button
                                    type="button"
                                    variant="danger"
                                    className="banner-header-tile banner-header-tile-clear"
                                    onClick={() => handleClearAll('event')}
                                >
                                    <i
                                        className="fas fa-trash-alt banner-header-tile-icon"
                                        aria-hidden
                                    />
                                    <span className="banner-header-clear-text">
                                        Clear all
                                    </span>
                                </Button>
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
                                }, 'event', index)
                            )}
                        </Row>
                    )}
                </Card.Body>
            </Card>

            {/* Login Page Banners Section */}
            <Card className="border-0 shadow">
                <Card.Header className="text-white py-3 banner-list-card-header" style={{ backgroundColor: '#71C0BB' }}>
                    <div className="d-flex flex-column flex-md-row align-items-stretch align-items-md-center justify-content-between gap-3">
                        <div className="banner-list-header-copy flex-grow-1 min-w-0">
                            <h5 className="banner-list-header-title text-white mb-2">
                                Login Page Banners
                            </h5>
                            <p className="banner-list-header-desc text-white mb-0">
                                Manage your login page banners. Drag the grip icon on a card to reorder.
                            </p>
                        </div>
                        <div
                            className={`banner-header-actions-row${
                                banners?.imageUrls?.length > 0
                                    ? ' banner-header-actions-row--pair'
                                    : ''
                            }`}
                        >
                            <div
                                className="banner-header-tile banner-header-tile-stat"
                                role="status"
                            >
                                <span className="banner-header-tile-value">
                                    {banners?.imageUrls?.length || 0}
                                </span>
                                <span className="banner-header-tile-label">
                                    Banners
                                </span>
                            </div>
                            {banners?.imageUrls && banners.imageUrls.length > 0 && (
                                <Button
                                    type="button"
                                    variant="danger"
                                    className="banner-header-tile banner-header-tile-clear"
                                    onClick={() => handleClearAll('home')}
                                >
                                    <i
                                        className="fas fa-trash-alt banner-header-tile-icon"
                                        aria-hidden
                                    />
                                    <span className="banner-header-clear-text">
                                        Clear all
                                    </span>
                                </Button>
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
                                }, 'home', index)
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
                contentClassName="bg-dark border-0 banner-mgmt-modal-lightbox"
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
                contentClassName="banner-mgmt-modal-shell"
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
                contentClassName="banner-mgmt-modal-shell"
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
        </div>
    );
};

export default BannerManagement;
