import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Card, Row, Col, Button, Spinner, Form, InputGroup, Nav } from 'react-bootstrap';
import { FaImages, FaFileAlt, FaSearch, FaEye, FaFilePdf, FaTrash } from 'react-icons/fa';
import { useSearchParams } from 'react-router-dom';
import { galleryList, removeEventImage, removeEventDocument } from '../../../store/actions/eventActions';
import DeleteConfirmationModal from '../../../components/modal/DeleteConfirmationModal';
import '../../../assets/css/gallery.css';
import ImageModal from '../../../components/gallery/modal/ImageModal';
import PaginationsComponent from '../../../components/gallery/pagination/Pagination';

const GalleryPage = () => {
    const dispatch = useDispatch();
    const { galleryList: galleryData } = useSelector((state) => state.event);
    const [searchParams, setSearchParams] = useSearchParams();
    
    // Get initial values from URL params
    const initialTab = searchParams.get('tab') || 'all';
    const initialPage = parseInt(searchParams.get('page')) || 1;
    const initialSearch = searchParams.get('search') || '';
    
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState(initialSearch);
    const [filteredData, setFilteredData] = useState([]);
    const [currentPage, setCurrentPage] = useState(initialPage);
    const [itemsPerPage, setItemsPerPage] = useState(12);
    const [activeTab, setActiveTab] = useState(initialTab);
    const [selectedImage, setSelectedImage] = useState(null);
    const [showImageModal, setShowImageModal] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [allImages, setAllImages] = useState([]);
    const [allDocuments, setAllDocuments] = useState([]);
    const [deletingImage, setDeletingImage] = useState(null);
    const [deletingDocument, setDeletingDocument] = useState(null);

    // Delete confirmation modal states
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteType, setDeleteType] = useState(null);
    const [deleteItem, setDeleteItem] = useState(null);

    // Function to update URL params
    const updateURLParams = (newParams) => {
        const currentParams = new URLSearchParams(searchParams);
        Object.entries(newParams).forEach(([key, value]) => {
            if (value) {
                currentParams.set(key, value);
            } else {
                currentParams.delete(key);
            }
        });
        setSearchParams(currentParams);
    };

    // Update URL when tab changes
    const handleTabChange = (newTab) => {
        setActiveTab(newTab);
        setCurrentPage(1);
        updateURLParams({ tab: newTab, page: '1' });
    };

    // Update URL when page changes
    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
        updateURLParams({ page: pageNumber.toString() });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Update URL when search changes
    const handleSearchChange = (newSearchTerm) => {
        setSearchTerm(newSearchTerm);
        setCurrentPage(1);
        updateURLParams({ 
            search: newSearchTerm || null, 
            page: '1' 
        });
    };

    useEffect(() => {
        loadGalleryData();
    }, []);

    useEffect(() => {
        filterGalleryData();
    }, [galleryData, searchTerm, activeTab]);

    const loadGalleryData = async () => {
        setLoading(true);
        try {
            await dispatch(galleryList());
        } catch (error) {
            console.error('Error loading gallery data:', error);
        } finally {
            setLoading(false);
        }
    };

    const filterGalleryData = () => {
        if (!galleryData || !galleryData.data) return;

        let filtered = galleryData.data;

        if (searchTerm) {
            filtered = filtered.filter((event) => event.eventName.toLowerCase().includes(searchTerm.toLowerCase()));
        }

        // Filter by tab
        if (activeTab === 'images') {
            filtered = filtered.filter((event) => event.images && event.images.length > 0);
        } else if (activeTab === 'documents') {
            filtered = filtered.filter((event) => event.documents && event.documents.length > 0);
        }

        setFilteredData(filtered);

        // Prepare all images and documents for global view
        const images = [];
        const documents = [];

        filtered.forEach((event) => {
            if (event.images) {
                event.images.forEach((img) => {
                    images.push({
                        ...img,
                        eventName: event.eventName,
                        eventId: event.eventId
                    });
                });
            }
            if (event.documents) {
                event.documents.forEach((doc) => {
                    documents.push({
                        ...doc,
                        eventName: event.eventName,
                        eventId: event.eventId
                    });
                });
            }
        });

        setAllImages(images);
        setAllDocuments(documents);
    };

    const handleDocumentOpen = (documentPath) => {
        const fullUrl = `${process.env.REACT_APP_API_URL}/${documentPath}`;
        window.open(fullUrl, '_blank');
    };

    const handleImageClick = (image, index) => {
        setSelectedImage(image);
        setCurrentImageIndex(index);
        setShowImageModal(true);
    };

    const handleImageModalClose = () => {
        setShowImageModal(false);
        setSelectedImage(null);
    };

    const handlePreviousImage = () => {
        const newIndex = currentImageIndex > 0 ? currentImageIndex - 1 : allImages.length - 1;
        setCurrentImageIndex(newIndex);
        setSelectedImage(allImages[newIndex]);
    };

    const handleNextImage = () => {
        const newIndex = currentImageIndex < allImages.length - 1 ? currentImageIndex + 1 : 0;
        setCurrentImageIndex(newIndex);
        setSelectedImage(allImages[newIndex]);
    };

    const handleDeleteImage = async (eventId, imagePath, imageIndex) => {
        setDeleteType('image');
        setDeleteItem({ eventId, imagePath, imageIndex });
        setShowDeleteModal(true);
    };

    const handleDeleteDocument = async (eventId, documentPath, documentIndex) => {
        setDeleteType('document');
        setDeleteItem({ eventId, documentPath, documentIndex });
        setShowDeleteModal(true);
    };

    const handleConfirmDelete = async () => {
        if (!deleteItem) return;

        const { eventId, imagePath, documentPath, imageIndex, documentIndex } = deleteItem;

        if (deleteType === 'image') {
            setDeletingImage(imagePath);
            try {
                const updatedImages = await dispatch(removeEventImage(eventId, imagePath));
                if (updatedImages) {
                    // Update the local state
                    const newAllImages = [...allImages];
                    newAllImages.splice(imageIndex, 1);
                    setAllImages(newAllImages);

                    // Recalculate pagination based on current tab
                    if (activeTab === 'images') {
                        // For images tab, we group by events and show 3 events per page
                        const imagesByEvent = {};
                        newAllImages.forEach((image) => {
                            const eventName = image.eventName || 'Unknown Event';
                            if (!imagesByEvent[eventName]) {
                                imagesByEvent[eventName] = [];
                            }
                            imagesByEvent[eventName].push(image);
                        });
                        const eventEntries = Object.entries(imagesByEvent);
                        const eventsPerPage = 3;
                        const maxPages = Math.ceil(eventEntries.length / eventsPerPage);

                        // If current page is greater than max pages, go to last page
                        if (currentPage > maxPages && maxPages > 0) {
                            const newPage = maxPages;
                            setCurrentPage(newPage);
                            updateURLParams({ page: newPage.toString() });
                        }
                    } else {
                        // For other tabs, use itemsPerPage
                        const maxPages = Math.ceil(newAllImages.length / itemsPerPage);
                        if (currentPage > maxPages && maxPages > 0) {
                            const newPage = maxPages;
                            setCurrentPage(newPage);
                            updateURLParams({ page: newPage.toString() });
                        }
                    }

                    // Reload gallery data to sync with backend
                    await loadGalleryData();
                }
            } catch (error) {
                console.error('Error deleting image:', error);
            } finally {
                setDeletingImage(null);
            }
        } else if (deleteType === 'document') {
            setDeletingDocument(documentPath);
            try {
                const updatedDocuments = await dispatch(removeEventDocument(eventId, documentPath));
                if (updatedDocuments) {
                    // Update the local state
                    const newAllDocuments = [...allDocuments];
                    newAllDocuments.splice(documentIndex, 1);
                    setAllDocuments(newAllDocuments);

                    // Recalculate pagination based on current tab
                    if (activeTab === 'documents') {
                        // For documents tab, we group by events and show 3 events per page
                        const documentsByEvent = {};
                        newAllDocuments.forEach((document) => {
                            const eventName = document.eventName || 'Unknown Event';
                            if (!documentsByEvent[eventName]) {
                                documentsByEvent[eventName] = [];
                            }
                            documentsByEvent[eventName].push(document);
                        });
                        const eventEntries = Object.entries(documentsByEvent);
                        const eventsPerPage = 3;
                        const maxPages = Math.ceil(eventEntries.length / eventsPerPage);

                        // If current page is greater than max pages, go to last page
                        if (currentPage > maxPages && maxPages > 0) {
                            const newPage = maxPages;
                            setCurrentPage(newPage);
                            updateURLParams({ page: newPage.toString() });
                        }
                    } else {
                        // For other tabs, use itemsPerPage
                        const maxPages = Math.ceil(newAllDocuments.length / itemsPerPage);
                        if (currentPage > maxPages && maxPages > 0) {
                            const newPage = maxPages;
                            setCurrentPage(newPage);
                            updateURLParams({ page: newPage.toString() });
                        }
                    }

                    // Reload gallery data to sync with backend
                    await loadGalleryData();
                }
            } catch (error) {
                console.error('Error deleting document:', error);
            } finally {
                setDeletingDocument(null);
            }
        }

        // Close modal and reset states
        setShowDeleteModal(false);
        setDeleteType(null);
        setDeleteItem(null);
    };

    const handleCancelDelete = () => {
        setShowDeleteModal(false);
        setDeleteType(null);
        setDeleteItem(null);
    };

    // Pagination logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);

    const renderImageGrid = () => {
        // Group images by event
        const imagesByEvent = {};

        allImages.forEach((image) => {
            const eventName = image.eventName || 'Unknown Event';
            if (!imagesByEvent[eventName]) {
                imagesByEvent[eventName] = [];
            }
            imagesByEvent[eventName].push(image);
        });

        // Convert to array for pagination
        const eventEntries = Object.entries(imagesByEvent);

        // Pagination logic for events
        const eventsPerPage = 3; // Show 3 events per page
        const indexOfLastEvent = currentPage * eventsPerPage;
        const indexOfFirstEvent = indexOfLastEvent - eventsPerPage;
        const currentEvents = eventEntries.slice(indexOfFirstEvent, indexOfLastEvent);
        const totalEventPages = Math.ceil(eventEntries.length / eventsPerPage);

        return (
            <div>
                {currentEvents.map(([eventName, images], eventIndex) => (
                    <div key={eventIndex} className="mb-4">
                        {/* Event Name Header */}
                        <div className="event-images-header mb-3">
                            <h5 className="text-primary mb-0">
                                <FaImages className="me-2" />
                                {eventName}
                            </h5>
                            <small className="text-muted">
                                {images.length} image{images.length > 1 ? 's' : ''}
                            </small>
                        </div>

                        {/* Images Grid */}
                        <Row>
                            {images.map((image, index) => (
                                <Col key={`${image.eventId}-${index}`} lg={3} md={4} sm={6} xs={12} className="mb-3">
                                    <Card className="image-card">
                                        <div className="image-container-wrapper">
                                            <div className="image-container" onClick={() => handleImageClick(image, index)}>
                                                <img
                                                    src={`${process.env.REACT_APP_API_URL}/${image.path}`}
                                                    alt={`${image.eventName} - Image ${index + 1}`}
                                                    className="gallery-image"
                                                    loading="lazy"
                                                />
                                                <div className="image-overlay">
                                                    <FaEye className="zoom-icon" />
                                                </div>
                                            </div>

                                            {/* Delete Button - Positioned absolutely */}
                                            <Button
                                                variant="danger"
                                                size="sm"
                                                className="delete-btn-image"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteImage(image.eventId, image.path, index);
                                                }}
                                                disabled={deletingImage === image.path}
                                            >
                                                {deletingImage === image.path ? <Spinner animation="border" size="sm" /> : <FaTrash />}
                                            </Button>
                                        </div>
                                    </Card>
                                </Col>
                            ))}
                        </Row>
                    </div>
                ))}

                {/* Use reusable Pagination component */}
                <PaginationsComponent
                    currentPage={currentPage}
                    totalPages={totalEventPages}
                    onPageChange={handlePageChange}
                    totalItems={eventEntries.length}
                    itemsPerPage={eventsPerPage}
                    indexOfFirstItem={indexOfFirstEvent}
                    indexOfLastItem={indexOfLastEvent}
                    showInfo={true}
                    className="mt-4"
                />
            </div>
        );
    };

    const renderDocumentList = () => {
        // Group documents by event
        const documentsByEvent = {};

        allDocuments.forEach((document) => {
            const eventName = document.eventName || 'Unknown Event';
            if (!documentsByEvent[eventName]) {
                documentsByEvent[eventName] = [];
            }
            documentsByEvent[eventName].push(document);
        });

        // Convert to array for pagination
        const eventEntries = Object.entries(documentsByEvent);

        // Pagination logic for events
        const eventsPerPage = 3; // Show 3 events per page
        const indexOfLastEvent = currentPage * eventsPerPage;
        const indexOfFirstEvent = indexOfLastEvent - eventsPerPage;
        const currentEvents = eventEntries.slice(indexOfFirstEvent, indexOfLastEvent);
        const totalEventPages = Math.ceil(eventEntries.length / eventsPerPage);

        return (
            <div>
                {currentEvents.map(([eventName, documents], eventIndex) => (
                    <div key={eventIndex} className="mb-4">
                        {/* Event Name Header */}
                        <div className="event-documents-header mb-3">
                            <h5 className="text-primary mb-0">
                                <FaFileAlt className="me-2" />
                                {eventName}
                            </h5>
                            <small className="text-muted">
                                {documents.length} document{documents.length > 1 ? 's' : ''}
                            </small>
                        </div>

                        {/* Documents Grid */}
                        <Row>
                            {documents.map((document, index) => {
                                const fileName = document.originalName || document.name || 'Document';
                                const displayName = fileName.split('.')[0] || fileName;

                                return (
                                    <Col key={`${document.eventId}-${index}`} lg={2} md={3} sm={4} xs={6} className="mb-3">
                                        <Card className="document-card h-100 bg-white p-3 rounded-3">
                                            <div className="document-container-wrapper">
                                                <div className="card-image-container" onClick={() => handleDocumentOpen(document.path)}>
                                                    <div className="pdf-preview-container">
                                                        <div className="pdf-document-preview">
                                                            <div className="pdf-page">
                                                                <div className="pdf-header">
                                                                    <div className="pdf-title">{displayName}</div>
                                                                </div>
                                                                <div className="pdf-content">
                                                                    <div className="pdf-line"></div>
                                                                    <div className="pdf-line medium"></div>
                                                                    <div className="pdf-line"></div>
                                                                    <div className="pdf-line short"></div>
                                                                    <div className="pdf-line medium"></div>
                                                                    <div className="pdf-line short"></div>
                                                                </div>
                                                                <div className="pdf-footer">
                                                                    <FaFilePdf size={14} className="text-danger" />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="image-overlay">
                                                        <FaEye className="zoom-icon" />
                                                    </div>
                                                </div>

                                                {/* Delete Button - Positioned absolutely */}
                                                <Button
                                                    variant="danger"
                                                    size="sm"
                                                    className="delete-btn-document"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDeleteDocument(document.eventId, document.path, index);
                                                    }}
                                                    disabled={deletingDocument === document.path}
                                                >
                                                    {deletingDocument === document.path ? (
                                                        <Spinner animation="border" size="sm" />
                                                    ) : (
                                                        <FaTrash />
                                                    )}
                                                </Button>
                                            </div>

                                            <Card.Body className="p-2">
                                                <h6 className="card-title mb-1 text-truncate" title={fileName}>
                                                    {fileName}
                                                </h6>
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                );
                            })}
                        </Row>
                    </div>
                ))}

                {/* Use reusable Pagination component */}
                <PaginationsComponent
                    currentPage={currentPage}
                    totalPages={totalEventPages}
                    onPageChange={handlePageChange}
                    totalItems={eventEntries.length}
                    itemsPerPage={eventsPerPage}
                    indexOfFirstItem={indexOfFirstEvent}
                    indexOfLastItem={indexOfLastEvent}
                    showInfo={true}
                    className="mt-4"
                />
            </div>
        );
    };

    const renderEventCards = () => {
        return (
            <div>
                <Row>{currentItems.map(renderSimpleCard)}</Row>

                {/* Use reusable Pagination component */}
                <PaginationsComponent
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                    totalItems={filteredData.length}
                    itemsPerPage={itemsPerPage}
                    indexOfFirstItem={indexOfFirstItem}
                    indexOfLastItem={indexOfLastItem}
                    showInfo={true}
                    className="mt-4"
                />
            </div>
        );
    };

    const renderSimpleCard = (event) => {
        const hasImages = event.images && event.images.length > 0;
        const hasDocuments = event.documents && event.documents.length > 0;
        const defaultImage = hasImages ? event.images[0].path : null;

        const handleEventClick = () => {
            // When event is clicked, show images and documents for this event
            const eventImages = hasImages
                ? event.images.map((img) => ({
                      ...img,
                      eventName: event.name,
                      eventId: event.id
                  }))
                : [];

            const eventDocuments = hasDocuments
                ? event.documents.map((doc) => ({
                      ...doc,
                      eventName: event.name,
                      eventId: event.id
                  }))
                : [];

            setAllImages(eventImages);
            setAllDocuments(eventDocuments);

            // Switch to images tab if images exist, otherwise documents tab
            if (hasImages) {
                handleTabChange('images');
            } else if (hasDocuments) {
                handleTabChange('documents');
            }
        };

        const handleImageClick = (e, imagePath) => {
            e.stopPropagation(); // Prevent event card click
            const imageData = {
                path: imagePath,
                eventName: event.name,
                eventId: event.id
            };
            setSelectedImage(imageData);
            setCurrentImageIndex(0);
            setShowImageModal(true);
        };

        return (
            <Col key={event.eventId} xl={2} lg={3} md={4} sm={4} xs={12} className="mb-3">
                <Card className="simple-card h-100 bg-white p-3 rounded-3" onClick={handleEventClick}>
                    <div className="card-image-container">
                        {defaultImage ? (
                            <img
                                src={`${process.env.REACT_APP_API_URL}/${defaultImage}`}
                                alt={event.name}
                                className="card-image"
                                loading="lazy"
                                onClick={(e) => handleImageClick(e, defaultImage)}
                            />
                        ) : (
                            <div className="no-image-placeholder">
                                <FaImages />
                            </div>
                        )}
                    </div>

                    <Card.Body className="p-2">
                        <h6 className="card-title mb-1 text-truncate" title={event.eventName}>
                            {event.eventName}
                        </h6>

                        <div className="media-stats">
                            {hasImages && (
                                <div
                                    className="stat-item"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        const eventImages = event.images.map((img) => ({
                                            ...img,
                                            eventName: event.eventName,
                                            eventId: event.id
                                        }));
                                        setAllImages(eventImages);
                                        handleTabChange('images');
                                    }}
                                >
                                    <FaImages className="stat-icon" />
                                    <span>{event.images.length}</span>
                                </div>
                            )}
                            {hasDocuments && (
                                <div
                                    className="stat-item"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        const eventDocuments = event.documents.map((doc) => ({
                                            ...doc,
                                            eventName: event.eventName,
                                            eventId: event.id
                                        }));
                                        setAllDocuments(eventDocuments);
                                        handleTabChange('documents');
                                    }}
                                >
                                    <FaFileAlt className="stat-icon" />
                                    <span>{event.documents.length}</span>
                                </div>
                            )}
                        </div>
                    </Card.Body>

                    <Card.Footer className="p-2">
                        <div className="media-stats">
                            {hasImages && (
                                <div className="me-2 flex-fill">
                                    <Button
                                        variant="outline-primary"
                                        size="sm"
                                        className="w-100"
                                        title="View Images"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            const eventImages = event.images.map((img) => ({
                                                ...img,
                                                eventName: event.name,
                                                eventId: event.id
                                            }));
                                            setAllImages(eventImages);
                                            handleTabChange('images');
                                        }}
                                    >
                                        <FaImages />
                                    </Button>
                                </div>
                            )}
                            {hasDocuments && (
                                <div className="flex-fill">
                                    <Button
                                        variant="outline-secondary"
                                        size="sm"
                                        className="w-100"
                                        title="View Documents"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            const eventDocuments = event.documents.map((doc) => ({
                                                ...doc,
                                                eventName: event.name,
                                                eventId: event.id
                                            }));
                                            setAllDocuments(eventDocuments);
                                            handleTabChange('documents');
                                        }}
                                    >
                                        <FaFileAlt />
                                    </Button>
                                </div>
                            )}
                        </div>
                    </Card.Footer>
                </Card>
            </Col>
        );
    };

    if (loading) {
        return (
            <div className="text-center py-5">
                <Spinner animation="border" role="status">
                    <span className="visually-hidden">Loading...</span>
                </Spinner>
            </div>
        );
    }

    return (
        <div className="gallery-page bg-white p-5 rounded-3">
            <div className="mb-4">
                <Row className="align-items-center">
                    <Col md={6}>
                        <h4 className="mb-0 text-primary">
                            <FaImages className="me-3" />
                            Gallery
                        </h4>
                    </Col>
                    <Col md={6} className="d-flex justify-content-end">
                        <div className="search-container">
                            <InputGroup className="search-input-group">
                                <InputGroup.Text className="search-icon">
                                    <FaSearch />
                                </InputGroup.Text>
                                <Form.Control
                                    type="text"
                                    placeholder="Search events..."
                                    value={searchTerm}
                                    onChange={(e) => handleSearchChange(e.target.value)}
                                    className="search-input"
                                />
                            </InputGroup>
                        </div>
                    </Col>
                </Row>
            </div>

            {/* Gallery Tabs */}
            <div className="gallery-tabs mb-4">
                <Nav variant="tabs" className="custom-tabs">
                    <Nav.Item>
                        <Nav.Link active={activeTab === 'all'} onClick={() => handleTabChange('all')}>
                            <FaImages className="me-3" />
                            All Events ({filteredData.length})
                        </Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                        <Nav.Link active={activeTab === 'images'} onClick={() => handleTabChange('images')}>
                            <FaImages className="me-3" />
                            All Images ({allImages.length})
                        </Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                        <Nav.Link active={activeTab === 'documents'} onClick={() => handleTabChange('documents')}>
                            <FaFileAlt className="me-3" />
                            All Documents ({allDocuments.length})
                        </Nav.Link>
                    </Nav.Item>
                </Nav>
            </div>

            {/* Content based on active tab */}
            {filteredData.length === 0 ? (
                <div className="text-center py-5">
                    <FaImages style={{ fontSize: '3rem', color: '#ccc' }} />
                    <h5 className="mt-3">No events found</h5>
                    <p className="text-muted">Try adjusting your search criteria.</p>
                </div>
            ) : (
                <>
                    {activeTab === 'images' && renderImageGrid()}
                    {activeTab === 'documents' && renderDocumentList()}
                    {activeTab === 'all' && renderEventCards()}
                </>
            )}

            {/* Image Modal */}
            <ImageModal
                show={showImageModal}
                onHide={handleImageModalClose}
                selectedImage={selectedImage}
                currentImageIndex={currentImageIndex}
                totalImages={allImages.length}
                onPrevious={handlePreviousImage}
                onNext={handleNextImage}
                apiUrl={process.env.REACT_APP_API_URL}
            />

            {/* Delete Confirmation Modal */}
            <DeleteConfirmationModal
                show={showDeleteModal}
                onHide={handleCancelDelete}
                onConfirm={handleConfirmDelete}
                title={deleteType === 'image' ? 'Delete Image' : 'Delete Document'}
                isLoading={deletingImage !== null || deletingDocument !== null}
            />
        </div>
    );
};

export default GalleryPage;
