import React, { useState, useEffect } from 'react';
import { Button, Row, Col, Card, Badge, Container, Modal } from 'react-bootstrap';
import Select from 'react-select';
import { useDispatch } from 'react-redux';
import { useParams, useHistory, useNavigate } from 'react-router-dom';
import { FetchEventData } from '../fetchEvents/FetchEventApi';
import { createEvent, editEvent, eventById } from '../../../../store/actions/eventActions';
import { API_URL } from '../../../../configs/env';
import axiosInstance from '../../../../configs/axiosInstance';
import { MapContainer, TileLayer, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import LocationMarker from '../components/LocationMarker';
import SpeakerFormModal from '../components/SpeakerFormSidebar';
import CategoryFormModal from '../components/CategoryFormModal';
import { createSpeaker } from '../../../../store/actions/speakerActions';
import { createCategory } from '../../../../store/actions/categoryActions';
import { removeEventImage, removeEventDocument } from '../../../../store/actions/eventActions';

function AddEventPage() {
    const dispatch = useDispatch();
    const { id } = useParams(); // Edit mode के लिए
    const { fetchEvent } = FetchEventData();
    const [tempLatLng, setTempLatLng] = useState(null);
    const [display, setDisplay] = useState(null);

    const [speakerList, setSpeakerList] = useState([]);
    const [categoryList, setCategoryList] = useState([]);
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
        images: [],
        documents: [],
        type: 'Physical',
        price: '',
        currency: '',
        speakerIds: [],
        categoryIds: [],
        latitude: '',
        longitude: ''
    });
    const [showMapModal, setShowMapModal] = useState(false);

    // Image and document management states
    const [imagePreviewUrls, setImagePreviewUrls] = useState([]);
    const [uploadProgress, setUploadProgress] = useState({});
    const [documentPreviewUrls, setDocumentPreviewUrls] = useState([]);
    const [documentUploadProgress, setDocumentUploadProgress] = useState({});
    const [removedImages, setRemovedImages] = useState([]);
    const [removedDocuments, setRemovedDocuments] = useState([]);

    // Modal states
    const [selectedSpeakers, setSelectedSpeakers] = useState([]);
    const [showSidebar, setShowSidebar] = useState(false);
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const navigate = useNavigate();
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
    const [newCategory, setNewCategory] = useState({
        name: '',
        description: ''
    });

    // Fetch current location
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
                }
            );
        } else {
            alert('Geolocation is not supported by your browser');
        }
    };

    useEffect(() => {
        getCurrentLocation();
    }, []);

    // Load edit data if id exists
    useEffect(() => {
        if (id) {
            const loadEventData = async () => {
                try {
                    const response = await dispatch(eventById(id));
                    if (response?.data) {
                        const editData = response.data;
                        
                        // Handle speakers data
                        let speakerIds = [];
                        if (editData.speakers) {
                            speakerIds = editData.speakers.map((speaker) => speaker.id);
                        } else if (editData.speakersData) {
                            speakerIds = editData.speakersData.map((speaker) => speaker.id);
                        }

                        // Handle categories data
                        let categoryIds = [];
                        if (editData.categories) {
                            categoryIds = editData.categories.map((category) => category.id);
                        } else if (editData.categoriesData) {
                            categoryIds = editData.categoriesData.map((category) => category.id);
                        }

                        // Handle images
                        let imagesData = [];
                        let previewUrls = [];
                        if (editData.images) {
                            if (typeof editData.images === 'string') {
                                imagesData = [editData.images];
                                previewUrls = [`${API_URL}/${editData.images.replace(/\\/g, '/')}`];
                            } else if (Array.isArray(editData.images)) {
                                imagesData = editData.images;
                                previewUrls = editData.images.map(img => {
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

                        // Handle documents
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
                            images: imagesData,
                            documents: documentsData,
                            type: editData.type || 'Physical',
                            price: editData.price || '',
                            currency: editData.currency || '',
                            speakerIds: speakerIds,
                            categoryIds: categoryIds
                        });
                        
                        setImagePreviewUrls(previewUrls);
                        setDocumentPreviewUrls(documentPreviewUrls);
                        setRemovedImages([]);
                        setRemovedDocuments([]);
                    }
                } catch (error) {
                    console.error('Error loading event data:', error);
                }
            };
            loadEventData();
        }
    }, [id, dispatch]);

    // Image removal function
    const handleRemoveImage = async (indexToRemove) => {
        const imageToRemove = formData.images[indexToRemove];
        
        if (typeof imageToRemove === 'string' && id) {
            try {
                const updatedImages = await dispatch(removeEventImage(id, imageToRemove));
                if (updatedImages) {
                    setFormData(prev => ({
                        ...prev,
                        images: updatedImages
                    }));
                    
                    const newPreviewUrls = updatedImages.map(img => 
                        img.startsWith('http') ? img : `${API_URL}/${img.replace(/\\/g, '/')}`
                    );
                    setImagePreviewUrls(newPreviewUrls);
                }
            } catch (error) {
                console.error('Error removing image:', error);
            }
        } else {
            setFormData(prev => ({
                ...prev,
                images: prev.images.filter((_, index) => index !== indexToRemove)
            }));
            
            setImagePreviewUrls(prev => 
                prev.filter((_, index) => index !== indexToRemove)
            );
        }
    };

    // Document removal function
    const handleRemoveDocument = async (indexToRemove) => {
        const documentToRemove = formData.documents[indexToRemove];
        
        if (typeof documentToRemove === 'string' && id) {
            try {
                const updatedDocuments = await dispatch(removeEventDocument(id, documentToRemove));
                if (updatedDocuments) {
                    setFormData(prev => ({
                        ...prev,
                        documents: updatedDocuments
                    }));
                    
                    const newPreviewUrls = updatedDocuments.map(doc => 
                        doc.startsWith('http') ? doc : `${API_URL}/${doc.replace(/\\/g, '/')}`
                    );
                    setDocumentPreviewUrls(newPreviewUrls);
                }
            } catch (error) {
                console.error('Error removing document:', error);
            }
        } else {
            setFormData(prev => ({
                ...prev,
                documents: prev.documents.filter((_, index) => index !== indexToRemove)
            }));
            
            setDocumentPreviewUrls(prev => 
                prev.filter((_, index) => index !== indexToRemove)
            );
        }
    };

    // Handle form changes
    const handleChange = (e) => {
        const { name, value, type, files } = e.target;
        
        if (type === 'file') {
            const newFiles = Array.from(files);
            
            if (name === 'images') {
                const validFiles = newFiles.filter(file => {
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
                
                setFormData(prev => ({
                    ...prev,
                    images: [...prev.images, ...validFiles]
                }));
                
                setImagePreviewUrls(prev => [...prev, ...newPreviewUrls]);
            } else if (name === 'documents') {
                const validFiles = newFiles.filter(file => {
                    const isValidType = file.type === 'application/pdf' || 
                                     file.type === 'application/msword' ||
                                     file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
                                     file.type === 'application/vnd.ms-excel' ||
                                     file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
                    const isValidSize = file.size <= 10 * 1024 * 1024;
                    
                    if (!isValidType) {
                        alert(`${file.name} is not a valid document file. Supported: PDF, DOC, DOCX, XLS, XLSX`);
                    }
                    if (!isValidSize) {
                        alert(`${file.name} is too large. Maximum size is 10MB.`);
                    }
                    
                    return isValidType && isValidSize;
                });
                
                const newPreviewUrls = validFiles.map(file => URL.createObjectURL(file));
                
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

    // Drag and drop handlers
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
        
        setFormData(prev => ({
            ...prev,
            images: [...prev.images, ...validFiles]
        }));
        
        setImagePreviewUrls(prev => [...prev, ...newPreviewUrls]);
    };

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
        
        setFormData(prev => ({
            ...prev,
            documents: [...prev.documents, ...validFiles]
        }));
        
        setDocumentPreviewUrls(prev => [...prev, ...newPreviewUrls]);
    };

    // Reset form data
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
            documents: [],
            type: 'Physical',
            price: '',
            currency: '',
            speakerIds: [],
            categoryIds: [],
            latitude: '',
            longitude: ''
        });
        setImagePreviewUrls([]);
        setDocumentPreviewUrls([]);
        setRemovedImages([]);
        setRemovedDocuments([]);
        setUploadProgress({});
        setDocumentUploadProgress({});
    };

    // Load countries, speakers, and categories
    useEffect(() => {
        const fetchCountry = async () => {
            try {
                const response = await axiosInstance.get('countries');
                if (response) {
                    setCountryList(response.data);
                }
            } catch (error) {
                console.error('Error fetching countries:', error);
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

    const fetchCategories = async () => {
        try {
            const response = await axiosInstance.get('categories/get');
            if (response.data.success) {
                setCategoryList(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    useEffect(() => {
        fetchSpeakers();
        fetchCategories();
    }, []);

    // Handle speaker and category selection
    const handleSpeakerSelect = (selectedOptions) => {
        const selectedIds = selectedOptions.map((option) => option.value);
        setFormData((prev) => ({
            ...prev,
            speakerIds: selectedIds
        }));
    };

    const handleCategorySelect = (selectedOptions) => {
        const selectedIds = selectedOptions.map((option) => option.value);
        setFormData((prev) => ({
            ...prev,
            categoryIds: selectedIds
        }));
    };

    // Handle form submission
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
            } else if (key === 'categoryIds') {
                const categoriesArray = Array.isArray(dataToSend.categoryIds) ? dataToSend.categoryIds : [];
                formDataToSend.append('categoryIds', categoriesArray.join(','));
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

        // Handle existing files for edit mode
        if (id) {
            if (formData.images && formData.images.length > 0) {
                formData.images.forEach((image) => {
                    if (typeof image === 'string') {
                        formDataToSend.append('originalImages', image);
                    }
                });
            }

            if (formData.documents && formData.documents.length > 0) {
                formData.documents.forEach((document) => {
                    if (typeof document === 'string') {
                        formDataToSend.append('originalDocuments', document);
                    }
                });
            }
        }

        try {
            const success = id ? await dispatch(editEvent(id, formDataToSend)) : await dispatch(createEvent(formDataToSend));
            if (success) {
                fetchEvent();
                navigate('/events/event-list');
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

    // Speaker and category options
    const speakerOptions = speakerList.map((speaker) => ({
        label: speaker.name,
        value: speaker.id
    }));

    const selectedSpeakerOptions = speakerOptions.filter((option) => 
        formData.speakerIds && formData.speakerIds.includes(option.value)
    );

    const categoryOptions = categoryList.map((category) => ({
        label: category.name,
        value: category.id
    }));

    const selectedCategoryOptions = categoryOptions.filter((option) => {
        return formData.categoryIds && formData.categoryIds.includes(String(option.value));
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
                setNewSpeaker({
                    name: '',
                    companyName: '',
                    position: '',
                    mobile: '',
                    email: '',
                    location: '',
                    description: '',
                    speakerProfile: null
                });
                setShowSidebar(false);
            }
        } catch (error) {
            console.error('Error adding speaker:', error);
        }
    };

    const handleAddCategory = async () => {
        try {
            const success = await dispatch(createCategory(newCategory));
            if (success) {
                fetchCategories();
                setNewCategory({
                    name: '',
                    description: ''
                });
                setShowCategoryModal(false);
            }
        } catch (error) {
            console.error('Error adding category:', error);
        }
    };

    // Location map component
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
        <Container fluid>
            <div className="row">
                <div className="col-12">
                    <div className="card">
                        <div className="card-header">
                            <div className="d-flex justify-content-between align-items-center">
                                <h4 className="card-title">{id ? 'Edit Event' : 'Add Event'}</h4>
                                <Button 
                                    variant="secondary" 
                                    onClick={() => navigate('/events/event-list')}
                                >
                                    <i style={{marginRight: '10px'}} className="fas fa-arrow-left me-2"></i>
                                    Back to Events
                                </Button>
                            </div>
                        </div>
                        <div className="card-body">
                            <form onSubmit={handleSubmit}>
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

                                    <Col sm={6}>
                                        <div className="form-group fill">
                                            <label className="floating-label" htmlFor="latitude">
                                                Latitude
                                            </label>
                                            <input
                                                type="number"
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
                                                <label>{id ? 'Update Speakers' : 'Select Speakers'}</label>

                                                <Select
                                                    key={`speakers-${formData.speakerIds?.join(',') || 'empty'}`}
                                                    isMulti
                                                    options={speakerOptions}
                                                    value={selectedSpeakerOptions}
                                                    onChange={handleSpeakerSelect}
                                                    placeholder={id ? "Update speakers..." : "Choose speakers..."}
                                                    styles={{
                                                        control: (base) => ({
                                                            ...base,
                                                            zIndex: 9999
                                                        }),
                                                        menu: (base) => ({
                                                            ...base,
                                                            zIndex: 9999
                                                        }),
                                                        menuPortal: (base) => ({
                                                            ...base,
                                                            zIndex: 10000 // Ensures dropdown renders above other elements
                                                        })
                                                    }}
                                                    menuPortalTarget={document.body} // Renders dropdown in body
                                                    menuPosition="fixed" // Fixed positioning
                                                />
                                            </div>
                                            {!id && (
                                                <Button
                                                    variant="primary"
                                                    style={{ marginLeft: '10px', marginTop: '30px', height: '40px' }}
                                                    onClick={() => setShowSidebar(true)}
                                                >
                                                    Add Speaker
                                                </Button>
                                            )}
                                        </div>

                                        <SpeakerFormModal
                                            show={showSidebar}
                                            onClose={() => setShowSidebar(false)}
                                            onChange={handleInputChange}
                                            onSubmit={handleAddSpeaker}
                                            formData={newSpeaker}
                                        />

                                        <CategoryFormModal
                                            show={showCategoryModal}
                                            onClose={() => setShowCategoryModal(false)}
                                            onChange={(e) => {
                                                const { name, value } = e.target;
                                                setNewCategory(prev => ({
                                                    ...prev,
                                                    [name]: value
                                                }));
                                            }}
                                            onSubmit={handleAddCategory}
                                            formData={newCategory}
                                        />
                                    </Col>
                                    <Col sm={12}>
                                        <div className="form-group d-flex align-items-center">
                                            <div style={{ flex: 1 }}>
                                                <label>{id ? 'Update Categories' : 'Select Categories'}</label>

                                                <Select
                                                    key={`categories-${JSON.stringify(formData.categoryIds)}`}
                                                    isMulti
                                                    options={categoryOptions}
                                                    value={selectedCategoryOptions}
                                                    onChange={handleCategorySelect}
                                                    placeholder={id ? "Update categories..." : "Choose categories..."}
                                                    styles={{
                                                        control: (base) => ({
                                                            ...base,
                                                            zIndex: 9999
                                                        }),
                                                        menu: (base) => ({
                                                            ...base,
                                                            zIndex: 9999
                                                        }),
                                                        menuPortal: (base) => ({
                                                            ...base,
                                                            zIndex: 10000 // Ensures dropdown renders above other elements
                                                        })
                                                    }}
                                                    menuPortalTarget={document.body} // Renders dropdown in body
                                                    menuPosition="fixed" // Fixed positioning
                                                />
                                            </div>
                                            {!id && (
                                                <Button
                                                    variant="primary"
                                                    style={{ marginLeft: '10px', marginTop: '30px', height: '40px' }}
                                                    onClick={() => setShowCategoryModal(true)}
                                                >
                                                    Add Category
                                                </Button>
                                            )}
                                        </div>
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
                                            <Badge bg="info"> <span>Images </span> {formData.images.length}/10</Badge>
                                            
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
                                                <p className="text-muted mb-2" style={{ 
                                                    fontSize: '14px',
                                                    lineHeight: '1.4',
                                                    maxWidth: '100%',
                                                    wordWrap: 'break-word'
                                                }}>
                                                    Drag and drop images here, or click to select files
                                                </p>
                                                <p className="text-muted small" style={{ 
                                                    fontSize: '12px',
                                                    lineHeight: '1.3',
                                                    maxWidth: '100%',
                                                    wordWrap: 'break-word'
                                                }}>
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
                                                    style={{ marginTop: '10px' }}
                                                >
                                                    Choose Files
                                                </Button>
                                            </div>

                                            {/* Image Preview Grid */}
                                            {formData.images && formData.images.length > 0 && (
                                                <div className="mt-3">
                                                    <h6 style={{ 
                                                        fontSize: '16px',
                                                        fontWeight: '600',
                                                        marginBottom: '15px',
                                                        color: '#333'
                                                    }}>
                                                        Selected Images ({formData.images.length})
                                                    </h6>
                                                    <div style={{ 
                                                        display: 'grid', 
                                                        gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                                                        gap: '15px',
                                                        marginTop: '10px'
                                                    }}>
                                                        {formData.images.map((image, index) => {
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
                                                                <div key={index} style={{ 
                                                                    position: 'relative',
                                                                    borderRadius: '8px',
                                                                    overflow: 'hidden',
                                                                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                                                    transition: 'transform 0.2s ease',
                                                                    cursor: 'pointer'
                                                                }}
                                                                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                                                                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                                                >
                                                                    <img
                                                                        src={imageSrc}
                                                                        alt={`Event ${index + 1}`}
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
                                                                    
                                                                    {/* Image Controls */}
                                                                    <div style={{
                                                                        position: 'absolute',
                                                                        top: '8px',
                                                                        right: '8px',
                                                                        display: 'flex',
                                                                        gap: '4px'
                                                                    }}>
                                                                        <Button
                                                                            size="sm"
                                                                            variant="danger"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                handleRemoveImage(index);
                                                                            }}
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
                                                                    <div style={{
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
                                                                    }}>
                                                                        {isExistingImage ? 'Existing' : `${(image.size / 1024 / 1024).toFixed(1)}MB`}
                                                                    </div>
                                                                    
                                                                    {/* Image Index Badge */}
                                                                    <div style={{
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
                                                                    }}>
                                                                        {index + 1}
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                    
                                                    {/* Reorder Instructions */}
                                                    {formData.images.length > 1 && (
                                                        <div className="mt-3" style={{
                                                            padding: '10px',
                                                            backgroundColor: '#f8f9fa',
                                                            borderRadius: '6px',
                                                            border: '1px solid #e9ecef'
                                                        }}>
                                                            <small className="text-muted" style={{
                                                                fontSize: '12px',
                                                                lineHeight: '1.4',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '6px'
                                                            }}>
                                                                <span>💡</span>
                                                                <span>First image will be the main event image. Drag to reorder.</span>
                                                            </small>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </Col>
                                    <Col sm={12}>
                                        <div className="form-group fill">
                                            <Badge bg="info"> <span>Documents </span> {formData.documents.length}/10</Badge>
                                
                                            {/* Drag and Drop Zone for Documents */}
                                            <div 
                                                className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center mt-2"
                                                onDragOver={handleDocumentDragOver}
                                                onDrop={handleDocumentDrop}
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
                                                    <i className="fas fa-file-alt fa-3x text-muted"></i>
                                                </div>
                                                <p className="text-muted mb-2" style={{ 
                                                    fontSize: '14px',
                                                    lineHeight: '1.4',
                                                    maxWidth: '100%',
                                                    wordWrap: 'break-word'
                                                }}>
                                                    Drag and drop documents here, or click to select files
                                                </p>
                                                <p className="text-muted small" style={{ 
                                                    fontSize: '12px',
                                                    lineHeight: '1.3',
                                                    maxWidth: '100%',
                                                    wordWrap: 'break-word'
                                                }}>
                                                    Supported formats: PDF, DOC, DOCX, XLS, XLSX. Max size: 10MB per file. Max 10 files.
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
                                                    style={{ marginTop: '10px' }}
                                                >
                                                    Choose Documents
                                                </Button>
                                            </div>

                                            {/* Document Preview List */}
                                            {formData.documents && formData.documents.length > 0 && (
                                                <div className="mt-3">
                                                    <h6 style={{ 
                                                        fontSize: '16px',
                                                        fontWeight: '600',
                                                        marginBottom: '15px',
                                                        color: '#333'
                                                    }}>
                                                        Selected Documents ({formData.documents.length})
                                                    </h6>
                                                    <div style={{ 
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        gap: '12px',
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
                                                            
                                                            const fileName = typeof document === 'string' ? document.split('/').pop() : document.name;
                                                            
                                                            return (
                                                                <div key={index} style={{ 
                                                                    display: 'flex', 
                                                                    alignItems: 'center',
                                                                    padding: '12px',
                                                                    border: '1px solid #e9ecef',
                                                                    borderRadius: '8px',
                                                                    backgroundColor: '#ffffff',
                                                                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                                                                    transition: 'all 0.2s ease'
                                                                }}
                                                                onMouseEnter={(e) => {
                                                                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
                                                                    e.currentTarget.style.transform = 'translateY(-1px)';
                                                                }}
                                                                onMouseLeave={(e) => {
                                                                    e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
                                                                    e.currentTarget.style.transform = 'translateY(0)';
                                                                }}
                                                                >
                                                                    <div style={{ marginRight: '12px', flexShrink: 0 }}>
                                                                        <i className="fas fa-file-pdf fa-2x text-danger"></i>
                                                                    </div>
                                                                    
                                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                                        <div style={{ 
                                                                            fontWeight: '600',
                                                                            fontSize: '14px',
                                                                            color: '#333',
                                                                            whiteSpace: 'nowrap',
                                                                            overflow: 'hidden',
                                                                            textOverflow: 'ellipsis',
                                                                            marginBottom: '2px'
                                                                        }}>
                                                                            {fileName}
                                                                        </div>
                                                                        <div style={{ 
                                                                            fontSize: '12px', 
                                                                            color: '#666',
                                                                            whiteSpace: 'nowrap',
                                                                            overflow: 'hidden',
                                                                            textOverflow: 'ellipsis'
                                                                        }}>
                                                                            {isExistingDocument ? 'Existing Document' : `${(document.size / 1024 / 1024).toFixed(1)}MB`}
                                                                        </div>
                                                                    </div>
                                                                    
                                                                    <div style={{ 
                                                                        display: 'flex', 
                                                                        gap: '6px',
                                                                        flexShrink: 0
                                                                    }}>
                                                                        <Button
                                                                            size="sm"
                                                                            variant="outline-primary"
                                                                            onClick={() => window.open(documentSrc, '_blank')}
                                                                            style={{
                                                                                padding: '6px 10px',
                                                                                fontSize: '12px'
                                                                            }}
                                                                        >
                                                                            <i className="fas fa-eye"></i>
                                                                        </Button>
                                                                        <Button
                                                                            size="sm"
                                                                            variant="danger"
                                                                            onClick={() => handleRemoveDocument(index)}
                                                                            style={{
                                                                                padding: '6px 10px',
                                                                                fontSize: '12px'
                                                                            }}
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
                                
                                {/* Form Actions */}
                                <div className="row mt-4">
                                    <div className="col-12">
                                        <div className="d-flex justify-content-between gap-2">
                                            <Button 
                                                variant="secondary" 
                                                onClick={() => navigate('/events/event-list')}
                                            >
                                                Cancel
                                            </Button>
                                            <Button variant="primary" type="submit">
                                                {id ? 'Update Event' : 'Create Event'}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>

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
        </Container>
    );
}

export default AddEventPage;