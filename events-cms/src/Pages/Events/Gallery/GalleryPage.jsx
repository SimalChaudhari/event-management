import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
    Card, 
    Row, 
    Col, 
    Badge, 
    Button, 
    Spinner,
    Form,
    InputGroup,
    Pagination,
    Nav,
    Tab,
    Modal,
    Image
} from 'react-bootstrap';
import { 
    FaImages, 
    FaFileAlt, 
    FaSearch, 
    FaDownload,
    FaEye,
    FaTimes,
    FaChevronLeft,
    FaChevronRight,
    FaExpand,
    FaCompress,
    FaFilePdf,
    FaTrash
} from 'react-icons/fa';
import { galleryList, removeEventImage, removeEventDocument } from '../../../store/actions/eventActions';
import DeleteConfirmationModal from '../../../components/modal/DeleteConfirmationModal';
import axiosInstance from '../../../configs/axiosInstance';
import '../../../assets/css/gallery.css';

const GalleryPage = () => {
    const dispatch = useDispatch();
    const { galleryList: galleryData } = useSelector(state => state.event);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredData, setFilteredData] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(12);
    const [activeTab, setActiveTab] = useState('all');
    const [selectedImage, setSelectedImage] = useState(null);
    const [showImageModal, setShowImageModal] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [allImages, setAllImages] = useState([]);
    const [allDocuments, setAllDocuments] = useState([]);
    const [deletingImage, setDeletingImage] = useState(null);
    const [deletingDocument, setDeletingDocument] = useState(null);
    
    // Delete confirmation modal states
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteType, setDeleteType] = useState(null); // 'image' or 'document'
    const [deleteItem, setDeleteItem] = useState(null);
    const [deleteIndex, setDeleteIndex] = useState(null);

    useEffect(() => {
        loadGalleryData();
    }, []);

    useEffect(() => {
        filterGalleryData();
        setCurrentPage(1);
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
            filtered = filtered.filter(event => 
                event.eventName.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Filter by tab
        if (activeTab === 'images') {
            filtered = filtered.filter(event => event.images && event.images.length > 0);
        } else if (activeTab === 'documents') {
            filtered = filtered.filter(event => event.documents && event.documents.length > 0);
        }

        setFilteredData(filtered);

        // Prepare all images and documents for global view
        const images = [];
        const documents = [];
        
        filtered.forEach(event => {
            if (event.images) {
                event.images.forEach(img => {
                    images.push({
                        ...img,
                        eventName: event.eventName,
                        eventId: event.eventId
                    });
                });
            }
            if (event.documents) {
                event.documents.forEach(doc => {
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
                    
                    // Check if current page will be empty after deletion
                    const imagesPerPage = 12;
                    const totalImagesAfterDelete = newAllImages.length;
                    const maxPages = Math.ceil(totalImagesAfterDelete / imagesPerPage);
                    
                    // If current page is greater than max pages, go to last page
                    if (currentPage > maxPages && maxPages > 0) {
                        setCurrentPage(maxPages);
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
                    
                    // Check if current page will be empty after deletion
                    const documentsPerPage = 12;
                    const totalDocumentsAfterDelete = newAllDocuments.length;
                    const maxPages = Math.ceil(totalDocumentsAfterDelete / documentsPerPage);
                    
                    // If current page is greater than max pages, go to last page
                    if (currentPage > maxPages && maxPages > 0) {
                        setCurrentPage(maxPages);
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
        setDeleteIndex(null);
    };

    const handleCancelDelete = () => {
        setShowDeleteModal(false);
        setDeleteType(null);
        setDeleteItem(null);
        setDeleteIndex(null);
    };

    // Pagination logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);


    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Helper function to generate pagination items
    const getPaginationItems = (currentPage, totalPages) => {
        const items = [];
        const maxVisible = 5; // Maximum visible page numbers
        
        if (totalPages <= maxVisible) {
            // Show all pages if total is small
            for (let i = 1; i <= totalPages; i++) {
                items.push(i);
            }
        } else {
            // Always show first page
            items.push(1);
            
            if (currentPage <= 3) {
                // Show first 3 pages + ellipsis + last page
                items.push(2, 3);
                if (totalPages > 4) {
                    items.push('...');
                }
                items.push(totalPages);
            } else if (currentPage >= totalPages - 2) {
                // Show first page + ellipsis + last 3 pages
                items.push('...');
                items.push(totalPages - 2, totalPages - 1, totalPages);
            } else {
                // Show first page + ellipsis + current page + ellipsis + last page
                items.push('...');
                items.push(currentPage);
                items.push('...');
                items.push(totalPages);
            }
        }
        
        return items;
    };

    const renderImageGrid = () => {
        // Group images by event
        const imagesByEvent = {};
        
        allImages.forEach(image => {
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
                                                {deletingImage === image.path ? (
                                                    <Spinner animation="border" size="sm" />
                                                ) : (
                                                    <FaTrash />
                                                )}
                                            </Button>
                                        </div>
                                    </Card>
                                </Col>
                            ))}
                        </Row>
                    </div>
                ))}

                {/* Single DataTables Style Pagination for Images */}
                {totalEventPages > 1 && (
                    <div className="datatable-pagination-container mt-4">
                        <div className="row">
                            <div className="col-sm-12 col-md-5">
                                <div className="dataTables_info">
                                    Showing {indexOfFirstEvent + 1} to {Math.min(indexOfLastEvent, eventEntries.length)} of {eventEntries.length} events
                                </div>
                            </div>
                            <div className="col-sm-12 col-md-7">
                                <div className="dataTables_paginate paging_simple_numbers">
                                    <ul className="pagination">
                                        <li className={`paginate_button previous ${currentPage === 1 ? 'disabled' : ''}`}>
                                            <button 
                                                className="page-link" 
                                                onClick={() => handlePageChange(currentPage - 1)}
                                                disabled={currentPage === 1}
                                            >
                                                Previous
                                            </button>
                                        </li>
                                        
                                        {getPaginationItems(currentPage, totalEventPages).map((item, index) => (
                                            <li key={index} className={`paginate_button ${item === currentPage ? 'active' : ''} ${item === '...' ? 'disabled' : ''}`}>
                                                <button 
                                                    className="page-link"
                                                    onClick={() => item !== '...' ? handlePageChange(item) : null}
                                                    disabled={item === '...'}
                                                    style={item === '...' ? { cursor: 'default', border: 'none', background: 'transparent' } : {}}
                                                >
                                                    {item}
                                                </button>
                                            </li>
                                        ))}

                                        <li className={`paginate_button next ${currentPage === totalEventPages ? 'disabled' : ''}`}>
                                            <button 
                                                className="page-link" 
                                                onClick={() => handlePageChange(currentPage + 1)}
                                                disabled={currentPage === totalEventPages}
                                            >
                                                Next
                                            </button>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const renderDocumentList = () => {
        // Group documents by event
        const documentsByEvent = {};
        
        allDocuments.forEach(document => {
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

                {/* Single DataTables Style Pagination for Documents */}
                {totalEventPages > 1 && (
                    <div className="datatable-pagination-container mt-4">
                        <div className="row">
                            <div className="col-sm-12 col-md-5">
                                <div className="dataTables_info">
                                    Showing {indexOfFirstEvent + 1} to {Math.min(indexOfLastEvent, eventEntries.length)} of {eventEntries.length} events
                                </div>
                            </div>
                            <div className="col-sm-12 col-md-7">
                                <div className="dataTables_paginate paging_simple_numbers">
                                    <ul className="pagination">
                                        <li className={`paginate_button previous ${currentPage === 1 ? 'disabled' : ''}`}>
                                            <button 
                                                className="page-link" 
                                                onClick={() => handlePageChange(currentPage - 1)}
                                                disabled={currentPage === 1}
                                            >
                                                Previous
                                            </button>
                                        </li>
                                        
                                        {getPaginationItems(currentPage, totalEventPages).map((item, index) => (
                                            <li key={index} className={`paginate_button ${item === currentPage ? 'active' : ''} ${item === '...' ? 'disabled' : ''}`}>
                                                <button 
                                                    className="page-link"
                                                    onClick={() => item !== '...' ? handlePageChange(item) : null}
                                                    disabled={item === '...'}
                                                    style={item === '...' ? { cursor: 'default', border: 'none', background: 'transparent' } : {}}
                                                >
                                                    {item}
                                                </button>
                                            </li>
                                        ))}

                                        <li className={`paginate_button next ${currentPage === totalEventPages ? 'disabled' : ''}`}>
                                            <button 
                                                className="page-link" 
                                                onClick={() => handlePageChange(currentPage + 1)}
                                                disabled={currentPage === totalEventPages}
                                            >
                                                Next
                                            </button>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const renderEventCards = () => {
        return (
            <div>
                <Row>
                    {currentItems.map(renderSimpleCard)}
                </Row>

                {/* DataTables Style Pagination for All Events */}
                {totalPages > 1 && (
                    <div className="datatable-pagination-container mt-4">
                        <div className="row">
                            <div className="col-sm-12 col-md-5">
                                <div className="dataTables_info">
                                    Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredData.length)} of {filteredData.length} events
                                </div>
                            </div>
                            <div className="col-sm-12 col-md-7">
                                <div className="dataTables_paginate paging_simple_numbers">
                                    <ul className="pagination">
                                        <li className={`paginate_button previous ${currentPage === 1 ? 'disabled' : ''}`}>
                                            <button 
                                                className="page-link" 
                                                onClick={() => handlePageChange(currentPage - 1)}
                                                disabled={currentPage === 1}
                                            >
                                                Previous
                                            </button>
                                        </li>
                                        
                                        {getPaginationItems(currentPage, totalPages).map((item, index) => (
                                            <li key={index} className={`paginate_button ${item === currentPage ? 'active' : ''} ${item === '...' ? 'disabled' : ''}`}>
                                                <button 
                                                    className="page-link"
                                                    onClick={() => item !== '...' ? handlePageChange(item) : null}
                                                    disabled={item === '...'}
                                                    style={item === '...' ? { cursor: 'default', border: 'none', background: 'transparent' } : {}}
                                                >
                                                    {item}
                                                </button>
                                            </li>
                                        ))}

                                        <li className={`paginate_button next ${currentPage === totalPages ? 'disabled' : ''}`}>
                                            <button 
                                                className="page-link" 
                                                onClick={() => handlePageChange(currentPage + 1)}
                                                disabled={currentPage === totalPages}
                                            >
                                                Next
                                            </button>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const renderSimpleCard = (event) => {
        const hasImages = event.images && event.images.length > 0;
        const hasDocuments = event.documents && event.documents.length > 0;
        const defaultImage = hasImages ? event.images[0].path : null;

        const handleEventClick = () => {
            // When event is clicked, show images and documents for this event
            const eventImages = hasImages ? event.images.map(img => ({
                ...img,
                eventName: event.name,
                eventId: event.id
            })) : [];
            
            const eventDocuments = hasDocuments ? event.documents.map(doc => ({
                ...doc,
                eventName: event.name,
                eventId: event.id
            })) : [];

            setAllImages(eventImages);
            setAllDocuments(eventDocuments);
            
            // Switch to images tab if images exist, otherwise documents tab
            if (hasImages) {
                setActiveTab('images');
            } else if (hasDocuments) {
                setActiveTab('documents');
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
                                <div className="stat-item"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    const eventImages = event.images.map(img => ({
                                        ...img,
                                        eventName: event.eventName,
                                        eventId: event.id
                                    }));
                                    setAllImages(eventImages);
                                    setActiveTab('images');
                                }}
                                >
                                    <FaImages className="stat-icon" />
                                    <span>{event.images.length}</span>
                                </div>
                            )}
                            {hasDocuments && (
                                <div className="stat-item"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    const eventDocuments = event.documents.map(doc => ({
                                        ...doc,
                                        eventName: event.eventName,
                                        eventId: event.id
                                    }));
                                    setAllDocuments(eventDocuments);
                                    setActiveTab('documents');
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
                        const eventImages = event.images.map(img => ({
                            ...img,
                            eventName: event.name,
                            eventId: event.id
                        }));
                        setAllImages(eventImages);
                        setActiveTab('images');
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
                        const eventDocuments = event.documents.map(doc => ({
                            ...doc,
                            eventName: event.name,
                            eventId: event.id
                        }));
                        setAllDocuments(eventDocuments);
                        setActiveTab('documents');
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
                                    onChange={(e) => setSearchTerm(e.target.value)}
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
                        <Nav.Link 
                            active={activeTab === 'all'}
                            onClick={() => setActiveTab('all')}
                        >
                            <FaImages className="me-3" />
                            All Events ({filteredData.length})
                        </Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                        <Nav.Link 
                            active={activeTab === 'images'}
                            onClick={() => setActiveTab('images')}
                        >
                            <FaImages className="me-3" />
                            All Images ({allImages.length})
                        </Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                        <Nav.Link 
                            active={activeTab === 'documents'}
                            onClick={() => setActiveTab('documents')}
                        >
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
            <Modal
                show={showImageModal}
                onHide={handleImageModalClose}
                size="xl"
                centered
                style={{ backgroundColor: 'rgba(0,0,0,0.95)' }}
            >
                <Modal.Body
                    style={{
                        padding: 0,
                        backgroundColor: 'transparent',
                        position: 'relative',
                        minHeight: '90vh'
                    }}
                >
                    {/* Close Button */}
                    <Button
                        variant="light"
                        size="sm"
                        onClick={handleImageModalClose}
                        style={{
                            position: 'fixed',
                            top: '20px',
                            right: '20px',
                            borderRadius: '50%',
                            width: '40px',
                            height: '40px',
                            zIndex: 1000,
                            backgroundColor: 'rgba(0,0,0,0.7)',
                            border: 'none',
                            color: 'white'
                        }}
                    >
                        <FaTimes />
                    </Button>

                    {/* Download Button */}
                    <Button
                        variant="light"
                        size="sm"
                        onClick={() => {
                            if (selectedImage) {
                                const link = document.createElement('a');
                                link.href = `${process.env.REACT_APP_API_URL}/${selectedImage.path}`;
                                link.download = `gallery-image.jpg`;
                                link.click();
                            }
                        }}
                        style={{
                            position: 'fixed',
                            top: '20px',
                            left: '20px',
                            borderRadius: '50%',
                            width: '40px',
                            height: '40px',
                            zIndex: 1000,
                            backgroundColor: 'rgba(0,0,0,0.7)',
                            border: 'none',
                            color: 'white'
                        }}
                    >
                        <FaDownload />
                    </Button>

                    {/* Navigation Buttons */}
                    <Button
                        variant="light"
                        size="sm"
                        onClick={handlePreviousImage}
                        disabled={allImages.length <= 1}
                        style={{
                            position: 'fixed',
                            top: '50%',
                            left: '20px',
                            transform: 'translateY(-50%)',
                            borderRadius: '50%',
                            width: '50px',
                            height: '50px',
                            zIndex: 1000,
                            backgroundColor: 'rgba(0,0,0,0.7)',
                            border: 'none',
                            color: 'white'
                        }}
                    >
                        <FaChevronLeft />
                    </Button>

                    <Button
                        variant="light"
                        size="sm"
                        onClick={handleNextImage}
                        disabled={allImages.length <= 1}
                        style={{
                            position: 'fixed',
                            top: '50%',
                            right: '20px',
                            transform: 'translateY(-50%)',
                            borderRadius: '50%',
                            width: '50px',
                            height: '50px',
                            zIndex: 1000,
                            backgroundColor: 'rgba(0,0,0,0.7)',
                            border: 'none',
                            color: 'white'
                        }}
                    >
                        <FaChevronRight />
                    </Button>

                    {/* Image Counter */}
                    <div
                        style={{
                            position: 'fixed',
                            bottom: '20px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            backgroundColor: 'rgba(0,0,0,0.7)',
                            color: 'white',
                            padding: '8px 16px',
                            borderRadius: '20px',
                            fontSize: '14px',
                            fontWeight: 'bold',
                            zIndex: 1000
                        }}
                    >
                        {currentImageIndex + 1} / {allImages.length}
                    </div>

                    {/* Image Container */}
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            minHeight: '90vh',
                            padding: '60px 80px 80px 80px'
                        }}
                    >
                        {selectedImage && (
                            <img
                                src={`${process.env.REACT_APP_API_URL}/${selectedImage.path}`}
                                alt={`${selectedImage.eventName} - Image`}
                                style={{
                                    maxWidth: '100%',
                                    maxHeight: '100%',
                                    objectFit: 'contain',
                                    borderRadius: '8px',
                                    background: 'white',
                                    padding: '20px',
                                    boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                                    border: '1px solid rgba(255,255,255,0.1)'
                                }}
                                onError={(e) => {
                                    console.error('Gallery image failed to load:', selectedImage.path);
                                    e.target.style.display = 'none';
                                }}
                            />
                        )}
                    </div>
                </Modal.Body>
            </Modal>

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