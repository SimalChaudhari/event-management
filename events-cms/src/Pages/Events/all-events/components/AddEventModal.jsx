import React, { useState, useEffect } from 'react';
import { Modal, Button, Row, Col, Card, Badge } from 'react-bootstrap';
import Select from 'react-select';
import { useDispatch } from 'react-redux';
import { FetchEventData } from '../fetchEvents/FetchEventApi';
import { createEvent, editEvent } from '../../../../store/actions/eventActions';
import { API_URL } from '../../../../configs/env';
import axiosInstance from '../../../../configs/axiosInstance';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

import L from 'leaflet'; // Import Leaflet for custom markers
import LocationMarker from './LocationMarker';
import SpeakerFormSidebar from './SpeakerFormSidebar';
import SpeakerFormModal from './SpeakerFormSidebar';
import { createSpeaker } from '../../../../store/actions/speakerActions';
import { removeEventImage, removeEventDocument } from '../../../../store/actions/eventActions';

function AddEventModal({ show, handleClose, editData }) {
    const dispatch = useDispatch();
    const { fetchEvent } = FetchEventData();
    const [tempLatLng, setTempLatLng] = useState(null);
    const [display, setDisplay] = useState(null);

    const [speakerList, setSpeakerList] = useState([]);
    const [countryList, setCountryList] = useState([]);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        startDate: '',
        startTime: '',
        endDate: '',
        endTime: '',
        location: '',
        venue: '',
        country: '',
        images: [], // Changed from null to empty array for multiple images
        documents: [], // Add documents array
        type: 'Physical',
        price: '',
        currency: '',
        speakerIds: [],
        latitude: '', // Added latitude
        longitude: '' // Added longitude
    });
    const [showMapModal, setShowMapModal] = useState(false); // For showing the map modal

    // Add new state for image management
    const [imagePreviewUrls, setImagePreviewUrls] = useState([]);
    const [uploadProgress, setUploadProgress] = useState({});

    // Add new state for document management
    const [documentPreviewUrls, setDocumentPreviewUrls] = useState([]);
    const [documentUploadProgress, setDocumentUploadProgress] = useState({});

    // Add state to track removed files for edit mode
    const [removedImages, setRemovedImages] = useState([]);
    const [removedDocuments, setRemovedDocuments] = useState([]);

    // Fetch user's current location
    const getCurrentLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    setFormData((prev) => ({
                        ...prev,
                        latitude: latitude,
                        longitude: longitude
                    }));
                },
                (error) => {
                    console.error('Error fetching geolocation: ', error);
                    // alert('Unable to fetch your location');
                }
            );
        } else {
            alert('Geolocation is not supported by your browser');
        }
    };

    useEffect(() => {
        getCurrentLocation(); // Automatically fetch current location when the component mounts
    }, []);

    // Add function to handle image removal
    const handleRemoveImage = async (indexToRemove) => {
        const imageToRemove = formData.images[indexToRemove];
        
        if (typeof imageToRemove === 'string' && editData) {
            // Existing image - call backend API to remove
            try {
                const updatedImages = await dispatch(removeEventImage(editData.id, imageToRemove));
                if (updatedImages) {
                    // Update local state with response data
                    setFormData(prev => ({
                        ...prev,
                        images: updatedImages
                    }));
                    
                    // Update preview URLs
                    const newPreviewUrls = updatedImages.map(img => 
                        img.startsWith('http') ? img : `${API_URL}/${img.replace(/\\/g, '/')}`
                    );
                    setImagePreviewUrls(newPreviewUrls);
                }
            } catch (error) {
                console.error('Error removing image:', error);
            }
        } else {
            // New uploaded file - just remove from state
            setFormData(prev => ({
                ...prev,
                images: prev.images.filter((_, index) => index !== indexToRemove)
            }));
            
            setImagePreviewUrls(prev => 
                prev.filter((_, index) => index !== indexToRemove)
            );
        }
    };

    // Add function to handle image reordering
    const handleImageReorder = (fromIndex, toIndex) => {
        const newImages = [...formData.images];
        const [movedImage] = newImages.splice(fromIndex, 1);
        newImages.splice(toIndex, 0, movedImage);
        
        setFormData(prev => ({
            ...prev,
            images: newImages
        }));
        
        // Also reorder preview URLs
        const newPreviewUrls = [...imagePreviewUrls];
        const [movedUrl] = newPreviewUrls.splice(fromIndex, 1);
        newPreviewUrls.splice(toIndex, 0, movedUrl);
        setImagePreviewUrls(newPreviewUrls);
    };

    // Add function to handle document removal
    const handleRemoveDocument = async (indexToRemove) => {
        const documentToRemove = formData.documents[indexToRemove];
        
        if (typeof documentToRemove === 'string' && editData) {
            // Existing document - call backend API to remove
            try {
                const updatedDocuments = await dispatch(removeEventDocument(editData.id, documentToRemove));
                if (updatedDocuments) {
                    // Update local state with response data
                    setFormData(prev => ({
                        ...prev,
                        documents: updatedDocuments
                    }));
                    
                    // Update preview URLs
                    const newPreviewUrls = updatedDocuments.map(doc => 
                        doc.startsWith('http') ? doc : `${API_URL}/${doc.replace(/\\/g, '/')}`
                    );
                    setDocumentPreviewUrls(newPreviewUrls);
                }
            } catch (error) {
                console.error('Error removing document:', error);
            }
        } else {
            // New uploaded file - just remove from state
            setFormData(prev => ({
                ...prev,
                documents: prev.documents.filter((_, index) => index !== indexToRemove)
            }));
            
            setDocumentPreviewUrls(prev => 
                prev.filter((_, index) => index !== indexToRemove)
            );
        }
    };

    // Update handleChange to handle both images and documents
    const handleChange = (e) => {
        const { name, value, type, files } = e.target;
        
        if (type === 'file') {
            const newFiles = Array.from(files);
            
            if (name === 'images') {
                // Handle images - preserve existing images
                const validFiles = newFiles.filter(file => {
                    const isValidType = file.type.startsWith('image/');
                    const isValidSize = file.size <= 5 * 1024 * 1024; // 5MB limit
                    
                    if (!isValidType) {
                        alert(`${file.name} is not a valid image file.`);
                    }
                    if (!isValidSize) {
                        alert(`${file.name} is too large. Maximum size is 5MB.`);
                    }
                    
                    return isValidType && isValidSize;
                });
                
                const newPreviewUrls = validFiles.map(file => URL.createObjectURL(file));
                
                // Preserve existing images and add new ones
                setFormData(prev => ({
                    ...prev,
                    images: [...prev.images, ...validFiles]
                }));
                
                setImagePreviewUrls(prev => [...prev, ...newPreviewUrls]);
            } else if (name === 'documents') {
                // Handle documents - preserve existing documents
                const validFiles = newFiles.filter(file => {
                    const isValidType = file.type === 'application/pdf' || 
                                     file.type === 'application/msword' ||
                                     file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
                                     file.type === 'application/vnd.ms-excel' ||
                                     file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
                    const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB limit
                    
                    if (!isValidType) {
                        alert(`${file.name} is not a valid document file. Supported: PDF, DOC, DOCX, XLS, XLSX`);
                    }
                    if (!isValidSize) {
                        alert(`${file.name} is too large. Maximum size is 10MB.`);
                    }
                    
                    return isValidType && isValidSize;
                });
                
                const newPreviewUrls = validFiles.map(file => URL.createObjectURL(file));
                
                // Preserve existing documents and add new ones
                setFormData(prev => ({
                    ...prev,
                    documents: [...prev.documents, ...validFiles]
                }));
                
                setDocumentPreviewUrls(prev => [...prev, ...newPreviewUrls]);
            }
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    // Add drag and drop functionality
    const handleDragOver = (e) => {
        e.preventDefault();
    };

    const handleDrop = (e) => {
        e.preventDefault();
        const files = Array.from(e.dataTransfer.files);
        
        const validFiles = files.filter(file => {
            const isValidType = file.type.startsWith('image/');
            const isValidSize = file.size <= 5 * 1024 * 1024;
            
            if (!isValidType) {
                alert(`${file.name} is not a valid image file.`);
            }
            if (!isValidSize) {
                alert(`${file.name} is too large. Maximum size is 5MB.`);
            }
            
            return isValidType && isValidSize;
        });
        
        const newPreviewUrls = validFiles.map(file => URL.createObjectURL(file));
        
        // Preserve existing images and add new ones
        setFormData(prev => ({
            ...prev,
            images: [...prev.images, ...validFiles]
        }));
        
        setImagePreviewUrls(prev => [...prev, ...newPreviewUrls]);
    };

    // Add drag and drop functionality for documents
    const handleDocumentDragOver = (e) => {
        e.preventDefault();
    };

    const handleDocumentDrop = (e) => {
        e.preventDefault();
        const files = Array.from(e.dataTransfer.files);
        
        const validFiles = files.filter(file => {
            const isValidType = file.type === 'application/pdf' || 
                             file.type === 'application/msword' ||
                             file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
                             file.type === 'application/vnd.ms-excel' ||
                             file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
            const isValidSize = file.size <= 10 * 1024 * 1024;
            
            if (!isValidType) {
                alert(`${file.name} is not a valid document file.`);
            }
            if (!isValidSize) {
                alert(`${file.name} is too large. Maximum size is 10MB.`);
            }
            
            return isValidType && isValidSize;
        });
        
        const newPreviewUrls = validFiles.map(file => URL.createObjectURL(file));
        
        // Preserve existing documents and add new ones
        setFormData(prev => ({
            ...prev,
            documents: [...prev.documents, ...validFiles]
        }));
        
        setDocumentPreviewUrls(prev => [...prev, ...newPreviewUrls]);
    };

    // Update resetFormData to include removed files tracking
    const resetFormData = () => {
        setFormData({
            name: '',
            description: '',
            startDate: '',
            startTime: '',
            endDate: '',
            endTime: '',
            location: '',
            venue: '',
            country: '',
            images: [],
            documents: [], // Add documents
            type: 'Physical',
            price: '',
            currency: '',
            speakerIds: [],
            latitude: '',
            longitude: ''
        });
        setImagePreviewUrls([]);
        setDocumentPreviewUrls([]); // Add document preview URLs
        setRemovedImages([]); // Reset removed images
        setRemovedDocuments([]); // Reset removed documents
        setUploadProgress({});
        setDocumentUploadProgress({});
    };

    // Load speakers from API
    useEffect(() => {
        const fetchCountry = async () => {
            try {
                const response = await axiosInstance.get('countries');
                if (response) {
                    setCountryList(response.data);
                }
            } catch (error) {
                console.error('Error fetching speakers:', error);
            }
        };
        fetchCountry();
    }, []);

    const fetchSpeakers = async () => {
        try {
            const response = await axiosInstance.get('speakers/get');
            if (response.data.success) {
                setSpeakerList(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching speakers:', error);
        }
    };

    // Load speakers from API
    useEffect(() => {
        fetchSpeakers();
    }, []);

    // Update useEffect for editData to reset removed files tracking
    useEffect(() => {
        if (editData) {
            // Check for both possible speaker data formats
            let speakerIds = [];

            // Check if speakers data exists in either format
            if (editData.speakers) {
                speakerIds = editData.speakers.map((speaker) => speaker.id);
            } else if (editData.speakersData) {
                speakerIds = editData.speakersData.map((speaker) => speaker.id);
            }

            // Handle images for edit mode - FIXED VERSION
            let imagesData = [];
            let previewUrls = [];
            
            if (editData.images) {
                // Handle different image data formats from backend
                if (typeof editData.images === 'string') {
                    // Single image as string
                    imagesData = [editData.images];
                    previewUrls = [`${API_URL}/${editData.images.replace(/\\/g, '/')}`];
                } else if (Array.isArray(editData.images)) {
                    // Multiple images as array
                    imagesData = editData.images;
                    previewUrls = editData.images.map(img => {
                        if (typeof img === 'string') {
                            // If it's already a full URL, use it directly
                            if (img.startsWith('http')) {
                                return img;
                            }
                            // If it's a relative path, construct the full URL
                            return `${API_URL}/${img.replace(/\\/g, '/')}`;
                        }
                        return img;
                    });
                }
            }

            // Handle documents for edit mode
            let documentsData = [];
            let documentPreviewUrls = [];
            
            if (editData.documents) {
                if (typeof editData.documents === 'string') {
                    documentsData = [editData.documents];
                    documentPreviewUrls = [`${API_URL}/${editData.documents.replace(/\\/g, '/')}`];
                } else if (Array.isArray(editData.documents)) {
                    documentsData = editData.documents;
                    documentPreviewUrls = editData.documents.map(doc => {
                        if (typeof doc === 'string') {
                            if (doc.startsWith('http')) {
                                return doc;
                            }
                            return `${API_URL}/${doc.replace(/\\/g, '/')}`;
                        }
                        return doc;
                    });
                }
            }

            // Set form data with proper image handling
            setFormData({
                name: editData.name || '',
                description: editData.description || '',
                startDate: editData.startDate || '',
                startTime: editData.startTime || '',
                endDate: editData.endDate || '',
                endTime: editData.endTime || '',
                location: editData.location || '',
                venue: editData.venue || '',
                latitude: editData.latitude || '',
                longitude: editData.longitude || '',
                country: editData.country || '',
                images: imagesData, // Use processed images data
                documents: documentsData, // Add documents
                type: editData.type || 'Physical',
                price: editData.price || '',
                currency: editData.currency || '',
                speakerIds: speakerIds
            });
            
            setImagePreviewUrls(previewUrls);
            setDocumentPreviewUrls(documentPreviewUrls); // Add document preview URLs
            setRemovedImages([]); // Reset removed images when editing
            setRemovedDocuments([]); // Reset removed documents when editing
        } else {
            resetFormData();
        }
    }, [editData]);

    // 🎯 Handle multi-speaker select
    const handleSpeakerSelect = (selectedOptions) => {
        const selectedIds = selectedOptions.map((option) => option.value);
        setFormData((prev) => ({
            ...prev,
            speakerIds: selectedIds
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const formDataToSend = new FormData();

        const formattedStartTime = formatTime(formData.startTime);
        const formattedEndTime = formatTime(formData.endTime);

        const dataToSend = {
            ...formData,
            startTime: formattedStartTime,
            endTime: formattedEndTime
        };

        if (dataToSend.speakersData) {
            delete dataToSend.speakersData;
        }

        Object.keys(dataToSend).forEach((key) => {
            if (key === 'speakerIds') {
                const speakersArray = Array.isArray(dataToSend.speakerIds) ? dataToSend.speakerIds : [];
                formDataToSend.append('speakerIds', speakersArray.join(','));
            } else if (key === 'images') {
                if (dataToSend[key] && Array.isArray(dataToSend[key])) {
                    dataToSend[key].forEach((file) => {
                        if (file instanceof File) {
                            formDataToSend.append('images', file);
                        }
                    });
                }
            } else if (key === 'documents') {
                if (dataToSend[key] && Array.isArray(dataToSend[key])) {
                    dataToSend[key].forEach((file) => {
                        if (file instanceof File) {
                            formDataToSend.append('documents', file);
                        }
                    });
                }
            } else if (key !== 'speakersData' && dataToSend[key] !== null) {
                formDataToSend.append(key, dataToSend[key]);
            }
        });

        // Handle existing files for edit mode - FIXED VERSION
        if (editData) {
            // Add existing images that are still in formData (not removed)
            if (formData.images && formData.images.length > 0) {
                formData.images.forEach((image) => {
                    if (typeof image === 'string') {
                        // This is an existing image that wasn't removed
                        formDataToSend.append('originalImages', image);
                    }
                });
            }

            // Add existing documents that are still in formData (not removed)
            if (formData.documents && formData.documents.length > 0) {
                formData.documents.forEach((document) => {
                    if (typeof document === 'string') {
                        // This is an existing document that wasn't removed
                        formDataToSend.append('originalDocuments', document);
                    }
                });
            }
        }

        try {
            const success = editData ? await dispatch(editEvent(editData.id, formDataToSend)) : await dispatch(createEvent(formDataToSend));
            if (success) {
                fetchEvent();
                handleClose();
                resetFormData();
            }
        } catch (error) {
            console.error('Error submitting form:', error);
        }
    };

    const formatTime = (time) => {
        if (!time) return '';
        let [hours, minutes] = time.split(':');
        hours = parseInt(hours, 10);
        return `${hours.toString().padStart(2, '0')}:${minutes}`;
    };

    const speakerOptions = speakerList.map((speaker) => ({
        label: speaker.name,
        value: speaker.id
    }));

    const selectedSpeakerOptions = speakerOptions.filter((option) => formData.speakerIds.includes(option.value));

    const [selectedSpeakers, setSelectedSpeakers] = useState([]);
    const [showSidebar, setShowSidebar] = useState(false);
    const [newSpeaker, setNewSpeaker] = useState({
        name: '',
        companyName: '',
        position: '',
        mobile: '',
        email: '',
        location: '',
        description: '',
        speakerProfile: null
    });

    const handleInputChange = (e) => {
        const { name, value, files } = e.target;
        setNewSpeaker((prev) => ({
            ...prev,
            [name]: files ? files[0] : value
        }));
    };

    const handleAddSpeaker = async () => {
        const formDataToSend = new FormData();

        Object.keys(newSpeaker).forEach((key) => {
            if (key === 'speakerProfile' && newSpeaker[key]) {
                formDataToSend.append(key, newSpeaker[key]);
            } else {
                formDataToSend.append(key, newSpeaker[key]);
            }
        });

        try {
            const success = await dispatch(createSpeaker(formDataToSend));
            if (success) {
                fetchSpeakers();
                setNewSpeaker('');
                setShowSidebar(false);
            }
        } catch (error) {
            console.error('Error adding speaker:', error);
        }
    };

    // Component for the map, allowing the user to select a location
    const LocationMap = () => {
        const fetchAddressFromCoordinates = async (lat, lng) => {
            try {
                const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
                const data = await response.json();
                setDisplay(data.display_name);
                return data.address;
            } catch (error) {
                console.error('Reverse geocoding error:', error);
                return '';
            }
        };

        const map = useMapEvents({
            click: async (event) => {
                const { lat, lng } = event.latlng;
                const address = await fetchAddressFromCoordinates(lat, lng);
                setFormData((prev) => ({
                    ...prev,
                    latitude: lat,
                    longitude: lng,
                    location: address?.city || address?.town || address?.village || ''
                }));
                setTempLatLng({ latitude: lat, longitude: lng, address });
            }
        });

        return (
            <>
                <LocationMarker
                    latitude={formData.latitude}
                    longitude={formData.longitude}
                    location={display ? display : formData?.venue}
                />
            </>
        );
    };

    return (
        <Modal show={show} onHide={handleClose} size="lg">
            <form onSubmit={handleSubmit}>
                <Modal.Header>
                    <Modal.Title as="h5">{editData ? 'Edit Event' : 'Add Event'}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Row>
                        <Col sm={6}>
                            <div className="form-group fill">
                                <label className="floating-label" htmlFor="name">
                                    Name
                                </label>
                                <input
                                    type="text"
                                    className="form-control"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder="Event Name"
                                    required
                                />
                            </div>
                        </Col>

                        <Col sm={6}>
                            <div className="form-group fill">
                                <label className="floating-label" htmlFor="price">
                                    Price
                                </label>
                                <input
                                    type="number"
                                    className="form-control"
                                    name="price"
                                    value={formData.price}
                                    onChange={handleChange}
                                    placeholder="Event Price"
                                />
                            </div>
                        </Col>

                        <Col sm={6}>
                            <div className="form-group fill">
                                <label className="floating-label" htmlFor="startDate">
                                    Start Date
                                </label>
                                <input
                                    type="date"
                                    className="form-control"
                                    name="startDate"
                                    value={formData.startDate}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </Col>
                        <Col sm={6}>
                            <div className="form-group fill">
                                <label className="floating-label" htmlFor="startTime">
                                    Start Time
                                </label>
                                <input
                                    type="time"
                                    className="form-control"
                                    name="startTime"
                                    value={formData.startTime}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </Col>
                        <Col sm={6}>
                            <div className="form-group fill">
                                <label className="floating-label" htmlFor="endDate">
                                    End Date
                                </label>
                                <input
                                    type="date"
                                    className="form-control"
                                    name="endDate"
                                    value={formData.endDate}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </Col>
                        <Col sm={6}>
                            <div className="form-group fill">
                                <label className="floating-label" htmlFor="endTime">
                                    End Time
                                </label>
                                <input
                                    type="time"
                                    className="form-control"
                                    name="endTime"
                                    value={formData.endTime}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </Col>

                        {/* Add Latitude and Longitude fields */}
                        <Col sm={6}>
                            <div className="form-group fill">
                                <label className="floating-label" htmlFor="latitude">
                                    Latitude
                                </label>
                                <input
                                    type="number"
                                    // step="any"
                                    className="form-control"
                                    name="latitude"
                                    value={formData.latitude}
                                    onClick={() => setShowMapModal(true)}
                                    onChange={handleChange}
                                    placeholder="Latitude"
                                />
                            </div>
                        </Col>
                        <Col sm={6}>
                            <div className="form-group fill">
                                <label className="floating-label" htmlFor="longitude">
                                    Longitude
                                </label>
                                <input
                                    type="number"
                                    // step="any"
                                    className="form-control"
                                    name="longitude"
                                    value={formData.longitude}
                                    onClick={() => setShowMapModal(true)}
                                    onChange={handleChange}
                                    placeholder="Longitude"
                                />
                            </div>
                        </Col>

                        <Col sm={4}>
                            <div className="form-group fill">
                                <label className="floating-label" htmlFor="location">
                                    Location
                                </label>
                                <input
                                    type="text"
                                    className="form-control"
                                    name="location"
                                    value={formData.location}
                                    onChange={handleChange}
                                    placeholder="Event Location"
                                />
                            </div>
                        </Col>
                        <Col sm={4}>
                            <div className="form-group fill">
                                <label className="floating-label" htmlFor="venue">
                                    Venue
                                </label>
                                <input
                                    type="text"
                                    className="form-control"
                                    name="venue"
                                    value={formData.venue}
                                    onChange={handleChange}
                                    placeholder="Event Venue"
                                />
                            </div>
                        </Col>
                        <Col sm={4}>
                            <div className="form-group fill">
                                <label className="floating-label" htmlFor="country">
                                    Country
                                </label>
                                <select
                                    id="country"
                                    name="country"
                                    className="form-control"
                                    value={formData.country}
                                    onChange={handleChange}
                                >
                                    <option value="" disabled>
                                        Select Country
                                    </option>
                                    {countryList.map((country) => (
                                        <option key={country.code} value={country.name}>
                                            {country.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </Col>

                        <Col sm={6}>
                            <div className="form-group fill">
                                <label className="floating-label" htmlFor="type">
                                    Type
                                </label>
                                <select className="form-control" name="type" value={formData.type} onChange={handleChange}>
                                    <option value="Physical">Physical</option>
                                    <option value="Virtual">Virtual</option>
                                </select>
                            </div>
                        </Col>

                        <Col sm={6}>
                            <div className="form-group fill">
                                <label className="floating-label" htmlFor="currency">
                                    Currency
                                </label>
                                <input
                                    type="text"
                                    className="form-control"
                                    name="currency"
                                    value={formData.currency}
                                    onChange={handleChange}
                                    placeholder="Currency"
                                />
                            </div>
                        </Col>

                        <Col sm={12}>
                            <div className="form-group d-flex align-items-center">
                                <div style={{ flex: 1 }}>
                                    <label>Select Speakers</label>

                                    <Select
                                        isMulti
                                        options={speakerOptions}
                                        value={selectedSpeakerOptions}
                                        onChange={handleSpeakerSelect}
                                        placeholder="Choose speakers..."
                                        styles={{
                                            control: (base) => ({
                                                ...base,
                                                zIndex: 9999 // Ensures the select dropdown stays on top
                                            }),
                                            menu: (base) => ({
                                                ...base,
                                                zIndex: 9999 // Ensures the dropdown menu has a higher z-index
                                            })
                                            // You can also adjust other parts like dropdown indicator, if needed
                                        }}
                                    />
                                </div>
                                <Button
                                    variant="primary"
                                    style={{ marginLeft: '10px', marginTop: '30px', height: '40px' }}
                                    onClick={() => setShowSidebar(true)}
                                >
                                    Add Speaker
                                </Button>
                            </div>

                            <SpeakerFormModal
                                show={showSidebar}
                                onClose={() => setShowSidebar(false)}
                                onChange={handleInputChange}
                                onSubmit={handleAddSpeaker}
                                formData={newSpeaker}
                            />
                        </Col>
                        <Col sm={12}>
                            <div className="form-group fill">
                                <label className="floating-label" htmlFor="description">
                                    Description
                                </label>
                                <textarea
                                    className="form-control"
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    placeholder="Event Description"
                                    rows={3}
                                />
                            </div>
                        </Col>
                        <Col sm={12}>
                            <div className="form-group fill">
                                <label className="floating-label" htmlFor="images">
                                    Images <Badge bg="info">{formData.images.length}/10</Badge>
                                </label>
                                
                                {/* Drag and Drop Zone */}
                                <div 
                                    className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center"
                                    onDragOver={handleDragOver}
                                    onDrop={handleDrop}
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
                                        <i className="fas fa-cloud-upload-alt fa-3x text-muted"></i>
                                    </div>
                                    <p className="text-muted mb-2">
                                        Drag and drop images here, or click to select files
                                    </p>
                                    <p className="text-muted small">
                                        Supported formats: JPG, PNG, GIF. Max size: 5MB per image. Max 10 images.
                                    </p>
                                    <input 
                                        type="file" 
                                        className="form-control" 
                                        name="images" 
                                        onChange={handleChange} 
                                        accept="image/*" 
                                        multiple
                                        style={{ display: 'none' }}
                                        id="imageInput"
                                    />
                                    <Button 
                                        variant="outline-primary" 
                                        onClick={() => document.getElementById('imageInput').click()}
                                    >
                                        Choose Files
                                    </Button>
                                </div>

                                {/* Image Preview Grid */}
                                {formData.images && formData.images.length > 0 && (
                                    <div className="mt-3">
                                        <h6>Selected Images ({formData.images.length})</h6>
                                        <div style={{ 
                                            display: 'grid', 
                                            gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                                            gap: '10px',
                                            marginTop: '10px'
                                        }}>
                                            {formData.images.map((image, index) => {
                                                // Determine the image source
                                                let imageSrc = '';
                                                let isExistingImage = false;
                                                
                                                if (typeof image === 'string') {
                                                    // Existing image from backend
                                                    isExistingImage = true;
                                                    if (image.startsWith('http')) {
                                                        imageSrc = image;
                                                    } else {
                                                        imageSrc = `${API_URL}/${image.replace(/\\/g, '/')}`;
                                                    }
                                                } else if (image instanceof File) {
                                                    // New uploaded file
                                                    imageSrc = imagePreviewUrls[index] || URL.createObjectURL(image);
                                                } else {
                                                    // Fallback
                                                    imageSrc = imagePreviewUrls[index] || '';
                                                }
                                                
                                                return (
                                                    <div key={index} style={{ position: 'relative' }}>
                                                        <img
                                                            src={imageSrc}
                                                            alt={`Event ${index + 1}`}
                                                            style={{ 
                                                                width: '100%', 
                                                                height: '120px', 
                                                                objectFit: 'cover',
                                                                borderRadius: '8px',
                                                                border: '2px solid #ddd'
                                                            }}
                                                            onError={(e) => {
                                                                console.error('Image failed to load:', imageSrc);
                                                                e.target.style.display = 'none';
                                                            }}
                                                        />
                                                        
                                                        {/* Image Controls */}
                                                        <div style={{
                                                            position: 'absolute',
                                                            top: '5px',
                                                            right: '5px',
                                                            display: 'flex',
                                                            gap: '2px'
                                                        }}>
                                                            <Button
                                                                size="sm"
                                                                variant="danger"
                                                                onClick={() => handleRemoveImage(index)}
                                                                style={{ padding: '2px 6px', fontSize: '10px' }}
                                                            >
                                                                ×
                                                            </Button>
                                                        </div>
                                                        
                                                        {/* Image Info */}
                                                        <div style={{
                                                            position: 'absolute',
                                                            bottom: '5px',
                                                            left: '5px',
                                                            right: '5px',
                                                            backgroundColor: 'rgba(0,0,0,0.7)',
                                                            color: 'white',
                                                            padding: '2px 4px',
                                                            borderRadius: '4px',
                                                            fontSize: '10px'
                                                        }}>
                                                            {isExistingImage ? 'Existing' : `${(image.size / 1024 / 1024).toFixed(1)}MB`}
                                                        </div>
                                                        
                                                        {/* Image Index Badge */}
                                                        <div style={{
                                                            position: 'absolute',
                                                            top: '5px',
                                                            left: '5px',
                                                            backgroundColor: 'rgba(0,0,0,0.7)',
                                                            color: 'white',
                                                            padding: '2px 6px',
                                                            borderRadius: '4px',
                                                            fontSize: '10px',
                                                            fontWeight: 'bold'
                                                        }}>
                                                            {index + 1}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        
                                        {/* Reorder Instructions */}
                                        {formData.images.length > 1 && (
                                            <div className="mt-2">
                                                <small className="text-muted">
                                                    💡 First image will be the main event image. Drag to reorder.
                                                </small>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </Col>
                        <Col sm={12}>
                            <div className="form-group fill">
                                <label className="floating-label" htmlFor="documents">
                                    Documents <Badge bg="info">{formData.documents.length}/10</Badge>
                                </label>
                                
                                {/* Drag and Drop Zone for Documents */}
                                <div 
                                    className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center"
                                    onDragOver={handleDocumentDragOver}
                                    onDrop={handleDocumentDrop}
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
                                        <i className="fas fa-file-alt fa-3x text-muted"></i>
                                    </div>
                                    <p className="text-muted mb-2">
                                        Drag and drop documents here, or click to select files
                                    </p>
                                    <p className="text-muted small">
                                        Supported formats: PDF Max size: 10MB per file. Max 10 files.
                                    </p>
                                    <input 
                                        type="file" 
                                        className="form-control" 
                                        name="documents" 
                                        onChange={handleChange} 
                                        accept=".pdf,.doc,.docx,.xls,.xlsx" 
                                        multiple
                                        style={{ display: 'none' }}
                                        id="documentInput"
                                    />
                                    <Button 
                                        variant="outline-primary" 
                                        onClick={() => document.getElementById('documentInput').click()}
                                    >
                                        Choose Documents
                                    </Button>
                                </div>

                                {/* Document Preview List */}
                                {formData.documents && formData.documents.length > 0 && (
                                    <div className="mt-3">
                                        <h6>Selected Documents ({formData.documents.length})</h6>
                                        <div style={{ 
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '10px',
                                            marginTop: '10px'
                                        }}>
                                            {formData.documents.map((document, index) => {
                                                let documentSrc = '';
                                                let isExistingDocument = false;
                                                
                                                if (typeof document === 'string') {
                                                    isExistingDocument = true;
                                                    if (document.startsWith('http')) {
                                                        documentSrc = document;
                                                    } else {
                                                        documentSrc = `${API_URL}/${document.replace(/\\/g, '/')}`;
                                                    }
                                                } else if (document instanceof File) {
                                                    documentSrc = documentPreviewUrls[index] || URL.createObjectURL(document);
                                                }
                                                
                                                return (
                                                    <div key={index} style={{ 
                                                        display: 'flex', 
                                                        alignItems: 'center',
                                                        padding: '10px',
                                                        border: '1px solid #ddd',
                                                        borderRadius: '8px',
                                                        backgroundColor: '#f8f9fa'
                                                    }}>
                                                        <div style={{ marginRight: '10px' }}>
                                                            <i className="fas fa-file-pdf fa-2x text-danger"></i>
                                                        </div>
                                                        
                                                        <div style={{ flex: 1 }}>
                                                            <div style={{ fontWeight: 'bold' }}>
                                                                {typeof document === 'string' ? document.split('/').pop() : document.name}
                                                            </div>
                                                            <div style={{ fontSize: '12px', color: '#666' }}>
                                                                {isExistingDocument ? 'Existing Document' : `${(document.size / 1024 / 1024).toFixed(1)}MB`}
                                                            </div>
                                                        </div>
                                                        
                                                        <div style={{ display: 'flex', gap: '5px' }}>
                                                            <Button
                                                                size="sm"
                                                                variant="outline-primary"
                                                                onClick={() => window.open(documentSrc, '_blank')}
                                                            >
                                                                <i className="fas fa-eye"></i>
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="danger"
                                                                onClick={() => handleRemoveDocument(index)}
                                                            >
                                                                <i className="fas fa-trash"></i>
                                                            </Button>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </Col>
                    </Row>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="danger" onClick={handleClose}>
                        Cancel
                    </Button>
                    <Button variant="primary" type="submit">
                        {editData ? 'Update' : 'Submit'}
                    </Button>
                </Modal.Footer>
            </form>

            {/* Map Modal */}
            <Modal show={showMapModal} onHide={() => setShowMapModal(false)} size="xl">
                <Modal.Header>
                    <Modal.Title>Select Location on the Map</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <MapContainer
                        center={[formData.latitude || 51.505, formData.longitude || -0.09]}
                        zoom={13}
                        style={{ width: '100%', height: '400px' }}
                    >
                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                        <LocationMap />
                    </MapContainer>
                </Modal.Body>

                {tempLatLng && (
                    <div className="p-4">
                        <Card className="mb-3">
                            <Card.Body>
                                <Card.Title>Coordinates Information</Card.Title>
                                <hr />
                                <Row>
                                    <Col xs={6} md={3}>
                                        <Card.Text className="mb-2">
                                            <strong>Latitude:</strong>
                                            <br />
                                            {tempLatLng.latitude || 'Not Available'}
                                        </Card.Text>
                                    </Col>
                                    <Col xs={6} md={3}>
                                        <Card.Text className="mb-2">
                                            <strong>Longitude:</strong>
                                            <br />
                                            {tempLatLng.longitude || 'Not Available'}
                                        </Card.Text>
                                    </Col>
                                </Row>
                            </Card.Body>
                        </Card>

                        <Card className="mb-3">
                            <Card.Body>
                                <Card.Title>Address Information</Card.Title>
                                <hr />
                                {tempLatLng.address ? (
                                    <div>
                                        <p className="mb-2">
                                            <strong>City/Town/Village:</strong>{' '}
                                            {tempLatLng.address.town || tempLatLng.address.village || null}
                                        </p>

                                        <p className="mb-2">
                                            <strong>State:</strong> {tempLatLng.address.state || null}
                                        </p>

                                        <p className="mb-2">
                                            <strong>District:</strong>{' '}
                                            {tempLatLng.address.state_district || tempLatLng.address.district || null}
                                        </p>

                                        <p className="mb-2">
                                            <strong>Country:</strong> {tempLatLng.address.country || null}
                                        </p>
                                    </div>
                                ) : (
                                    <p>Fetching address...</p>
                                )}
                            </Card.Body>
                        </Card>

                        <div className="mt-8 text-center">
                            <Button
                                variant="primary"
                                onClick={() => {
                                    setFormData((prev) => ({
                                        ...prev,
                                        latitude: tempLatLng.latitude,
                                        longitude: tempLatLng.longitude,
                                        location: [
                                            tempLatLng.address.state,
                                            tempLatLng.address.state_district || tempLatLng.address.district
                                        ]
                                            .filter(Boolean)
                                            .join(', '),
                                        venue: tempLatLng.address.town || tempLatLng.address.village,
                                        country: tempLatLng.address.country
                                    }));

                                    setShowMapModal(false);
                                    setTempLatLng(null);
                                }}
                                className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-8 rounded-lg shadow-lg transition-all duration-300 transform hover:scale-105"
                            >
                                Save Location
                            </Button>
                        </div>
                    </div>
                )}

                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowMapModal(false)}>
                        Close
                    </Button>
                </Modal.Footer>
            </Modal>
        </Modal>
    );
}

export default AddEventModal;
