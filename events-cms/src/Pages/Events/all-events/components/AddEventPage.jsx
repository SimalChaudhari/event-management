import React, { useState, useEffect } from 'react';
import { Button, Row, Col, Card, Badge, Container, Modal, Form } from 'react-bootstrap';
import Select from 'react-select';
import { useDispatch } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import { FetchEventData } from '../fetchEvents/FetchEventApi';
import {
    createEvent,
    editEvent,
    eventById,
    exhibitorGet,
    removeEventFloorPlan,
    removeEventStampImage
} from '../../../../store/actions/eventActions';
import { API_URL } from '../../../../configs/env';
import axiosInstance from '../../../../configs/axiosInstance';
import 'leaflet/dist/leaflet.css';
import SpeakerFormModal from '../components/SpeakerFormSidebar';
import CategoryFormModal from '../components/CategoryFormModal';
import MapLocationModal from './MapLocationModal';
import { createSpeaker } from '../../../../store/actions/speakerActions';
import { createCategory } from '../../../../store/actions/categoryActions';
import { removeEventImage, removeEventDocument } from '../../../../store/actions/eventActions';
import { EVENT_PATHS } from '../../../../utils/constants';

// DocumentNameInput component को main component के बाहर define करें
const DocumentNameInput = ({ index, fileName, documentName, onNameChange, onValidationChange }) => {
    const [localError, setLocalError] = useState('');

    // Validation function
    const validateDocumentName = (name, allNames, currentIndex) => {
        if (!name || name.trim() === '') {
            return { isValid: true, error: '' };
        }

        if (name.trim().length < 2) {
            return {
                isValid: false,
                error: 'Document name should be at least 2 characters'
            };
        }

        const duplicateIndex = allNames.findIndex(
            (docName, idx) => idx !== currentIndex && docName && docName.trim().toLowerCase() === name.trim().toLowerCase()
        );

        if (duplicateIndex !== -1) {
            return {
                isValid: false,
                error: 'Document name already exists'
            };
        }

        return { isValid: true, error: '' };
    };

    const handleNameChange = (e) => {
        const newName = e.target.value;

        // Update parent component
        onNameChange(index, newName);

        // Validate only if there's content
        if (newName.trim()) {
            // We'll handle validation in parent to avoid state issues
            setLocalError('');
        } else {
            setLocalError('');
        }
    };

    return (
        <div style={{ width: '100%' }}>
            <input
                type="text"
                value={documentName || ''}
                onChange={handleNameChange}
                placeholder="Enter document name (optional)"
                style={{
                    width: '100%',
                    padding: '6px 8px',
                    border: `1px solid ${localError ? '#dc3545' : '#ddd'}`,
                    borderRadius: '4px',
                    fontSize: '14px',
                    fontWeight: '600',
                    marginBottom: localError ? '2px' : '4px',
                    backgroundColor: localError ? '#fff5f5' : '#fff'
                }}
            />
            {localError && (
                <div
                    style={{
                        fontSize: '11px',
                        color: '#dc3545',
                        marginBottom: '4px',
                        fontStyle: 'italic'
                    }}
                >
                    {localError}
                </div>
            )}
        </div>
    );
};

// Main component
function AddEventPage() {
    const dispatch = useDispatch();
    const { id } = useParams(); // Edit mode
    const { fetchEvent } = FetchEventData();
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
        documentNames: [], // Add this new field
        type: 'Physical',
        price: '',
        currency: '',
        speakerIds: [],
        speakerStartTimes: [], // Speaker start times array
        speakerEndTimes: [], // Speaker end times array
        categoryIds: [],
        latitude: '',
        longitude: '',
        floorPlan: null,
        exhibitorIds: [],
        exhibitorDescription: '',
        eventStampDescription: '',
        eventStampImages: []
    });
    const [showMapModal, setShowMapModal] = useState(false);

    // Track dropdown open states
    const [speakerDropdownOpen, setSpeakerDropdownOpen] = useState(false);
    const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
    const [exhibitorDropdownOpen, setExhibitorDropdownOpen] = useState(false);

    // Image and document management states
    const [imagePreviewUrls, setImagePreviewUrls] = useState([]);

    const [documentPreviewUrls, setDocumentPreviewUrls] = useState([]);

    // Modal states
    const [showSidebar, setShowSidebar] = useState(false);
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const navigate = useNavigate();
    const [newSpeaker, setNewSpeaker] = useState({
        firstName: '',
        lastName: '',
        email: '',
        mobile: '',
        position: '',
        companyName: '',
        description: '',
        profilePicture: null
    });
    const [newCategory, setNewCategory] = useState({
        name: '',
        description: ''
    });

    const [exhibitorList, setExhibitorList] = useState([]);

    // Add new states for event stamp
    const [eventStampImagePreviewUrls, setEventStampImagePreviewUrls] = useState([]);

    // Add floor plan preview state
    const [floorPlanPreview, setFloorPlanPreview] = useState(null);

    // Add new state for document names input
    const [documentNames, setDocumentNames] = useState([]);

    // Add loading state for form submission
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Add loading state for speaker modal
    const [isSpeakerLoading, setIsSpeakerLoading] = useState(false);

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
                        let speakerStartTimes = [];
                        let speakerEndTimes = [];
                        if (editData.speakers) {
                            speakerIds = editData.speakers.map((speaker) => speaker.id);
                            speakerStartTimes = editData.speakers.map((speaker) => speaker.speakingStartTime || '');
                            speakerEndTimes = editData.speakers.map((speaker) => speaker.speakingEndTime || '');
                        } else if (editData.speakersData) {
                            speakerIds = editData.speakersData.map((speaker) => speaker.id);
                            speakerStartTimes = editData.speakersData.map((speaker) => speaker.speakingStartTime || '');
                            speakerEndTimes = editData.speakersData.map((speaker) => speaker.speakingEndTime || '');
                        }

                        // Handle categories data
                        let categoryIds = [];
                        if (editData.categories) {
                            categoryIds = editData.categories.map((category) => category.id);
                        } else if (editData.categoriesData) {
                            categoryIds = editData.categoriesData.map((category) => category.id);
                        }

                        // Handle exhibitors
                        let exhibitorDescription = '';
                        let exhibitorIds = [];
                        if (editData.exhibitors) {
                          
                            exhibitorIds = editData.exhibitors?.exhibitors?.map((exhibitor) => String(exhibitor.id)); // Convert to string
                            exhibitorDescription = editData?.exhibitors?.exhibitorDescription || '';
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
                                previewUrls = editData.images.map((img) => {
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

                        // Handle documents - updated to handle new structure
                        let documentsData = [];
                        let documentNamesData = [];
                        let documentPreviewUrls = [];

                        if (editData.documents) {
                            if (Array.isArray(editData.documents)) {
                                // Check if documents are in new format with name and document properties
                                if (editData.documents.length > 0 && editData.documents[0].hasOwnProperty('name')) {
                                    // New format: array of objects with name and document
                                    documentsData = editData.documents.map((doc) => doc.document);
                                    documentNamesData = editData.documents.map((doc) => doc.name);
                                    documentPreviewUrls = editData.documents.map((doc) => {
                                        if (doc.document.startsWith('http')) {
                                            return doc.document;
                                        }
                                        return `${API_URL}/${doc.document.replace(/\\/g, '/')}`;
                                    });
                                } else {
                                    // Old format: array of document paths only
                                    documentsData = editData.documents;
                                    documentNamesData = editData.documents.map((doc, index) => `Document ${index + 1}`);
                                    documentPreviewUrls = editData.documents.map((doc) => {
                                        if (doc.startsWith('http')) {
                                            return doc;
                                        }
                                        return `${API_URL}/${doc.replace(/\\/g, '/')}`;
                                    });
                                }
                            }
                        }

                        // Handle floor plan
                        let floorPlanData = null;
                        let floorPlanPreviewUrl = null;
                        if (editData.floorPlan) {
                            if (typeof editData.floorPlan === 'string') {
                                floorPlanData = editData.floorPlan;
                                floorPlanPreviewUrl = `${API_URL}/${editData.floorPlan.replace(/\\/g, '/')}`;
                            }
                        }

                        // Handle event stamps - Updated to match API response structure
                        let eventStampDescription = '';
                        let eventStampImagesData = [];
                        let eventStampImagePreviewUrls = [];

                        if (editData.eventStamps) {
                            // Handle event stamp description
                            eventStampDescription = editData.eventStamps.description || '';

                            // Handle event stamp images
                            if (editData.eventStamps.images && Array.isArray(editData.eventStamps.images)) {
                                eventStampImagesData = editData.eventStamps.images;
                                eventStampImagePreviewUrls = editData.eventStamps.images.map((img) => {
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

                        const formDataToSet = {
                            name: editData.name || '',
                            description: editData.description || '',
                            startDate: editData.startDate ? editData.startDate.split('T')[0] : '',
                            startTime: editData.startTime || '',
                            endDate: editData.endDate ? editData.endDate.split('T')[0] : '',
                            endTime: editData.endTime || '',
                            location: editData.location || '',
                            venue: editData.venue || '',
                            latitude: editData.latitude || '',
                            longitude: editData.longitude || '',
                            country: editData.country || '',
                            images: imagesData,
                            documents: documentsData,
                            documentNames: documentNamesData,
                            type: editData.type || 'Physical',
                            price: editData.price || '',
                            currency: editData.currency || '',
                            speakerIds: speakerIds,
                            speakerStartTimes: speakerStartTimes,
                            speakerEndTimes: speakerEndTimes,
                            categoryIds: categoryIds,
                            floorPlan: floorPlanData,
                            exhibitorIds: exhibitorIds,
                            exhibitorDescription: exhibitorDescription,
                            eventStampDescription: eventStampDescription,
                            eventStampImages: eventStampImagesData
                        };

                        setFormData(formDataToSet);
                        setImagePreviewUrls(previewUrls);
                        setDocumentPreviewUrls(documentPreviewUrls);
                        setDocumentNames(documentNamesData);
                        setEventStampImagePreviewUrls(eventStampImagePreviewUrls);

                        setFloorPlanPreview(floorPlanPreviewUrl);
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
                    setFormData((prev) => ({
                        ...prev,
                        images: updatedImages
                    }));

                    const newPreviewUrls = updatedImages.map((img) =>
                        img.startsWith('http') ? img : `${API_URL}/${img.replace(/\\/g, '/')}`
                    );
                    setImagePreviewUrls(newPreviewUrls);
                }
            } catch (error) {
                console.error('Error removing image:', error);
            }
        } else {
            setFormData((prev) => ({
                ...prev,
                images: prev.images.filter((_, index) => index !== indexToRemove)
            }));

            setImagePreviewUrls((prev) => prev.filter((_, index) => index !== indexToRemove));
        }
    };

    // Document removal function
    const handleRemoveDocument = async (indexToRemove) => {
        const documentToRemove = formData.documents[indexToRemove];

        if (typeof documentToRemove === 'string' && id) {
            try {
                const updatedDocuments = await dispatch(removeEventDocument(id, documentToRemove));
                if (updatedDocuments) {
                    setFormData((prev) => ({
                        ...prev,
                        documents: updatedDocuments
                    }));

                    const newPreviewUrls = updatedDocuments.map((doc) =>
                        doc.startsWith('http') ? doc : `${API_URL}/${doc.replace(/\\/g, '/')}`
                    );
                    setDocumentPreviewUrls(newPreviewUrls);

                    // Remove corresponding document name
                    const updatedNames = documentNames.filter((_, index) => index !== indexToRemove);
                    setDocumentNames(updatedNames);
                    setFormData((prev) => ({
                        ...prev,
                        documentNames: updatedNames
                    }));
                }
            } catch (error) {
                console.error('Error removing document:', error);
            }
        } else {
            setFormData((prev) => ({
                ...prev,
                documents: prev.documents.filter((_, index) => index !== indexToRemove)
            }));

            setDocumentPreviewUrls((prev) => prev.filter((_, index) => index !== indexToRemove));

            // Remove corresponding document name
            const updatedNames = documentNames.filter((_, index) => index !== indexToRemove);
            setDocumentNames(updatedNames);
            setFormData((prev) => ({
                ...prev,
                documentNames: updatedNames
            }));
        }
    };

    // Handle form changes
    const handleChange = (e) => {
        const { name, value, type, files } = e.target;

        if (type === 'file') {
            const newFiles = Array.from(files);

            if (name === 'images') {
                const newPreviewUrls = newFiles.map((file) => URL.createObjectURL(file));

                setFormData((prev) => ({
                    ...prev,
                    images: [...prev.images, ...newFiles]
                }));

                setImagePreviewUrls((prev) => [...prev, ...newPreviewUrls]);
            } else if (name === 'documents') {
                const newPreviewUrls = newFiles.map((file) => URL.createObjectURL(file));

                setFormData((prev) => ({
                    ...prev,
                    documents: [...prev.documents, ...newFiles]
                }));

                setDocumentPreviewUrls((prev) => [...prev, ...newPreviewUrls]);

                // Add default names for new documents
                const newDocumentNames = newFiles.map((file) => file.name.replace(/\.[^/.]+$/, '')); // Remove extension
                setDocumentNames((prev) => [...prev, ...newDocumentNames]);

                setFormData((prev) => ({
                    ...prev,
                    documentNames: [...prev.documentNames, ...newDocumentNames]
                }));
            }
        } else {
            setFormData((prev) => ({
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
        const newPreviewUrls = files.map((file) => URL.createObjectURL(file));
        setFormData((prev) => ({
            ...prev,
            images: [...prev.images, ...files]
        }));

        setImagePreviewUrls((prev) => [...prev, ...newPreviewUrls]);
    };

    const handleDocumentDragOver = (e) => {
        e.preventDefault();
    };

    const handleDocumentDrop = (e) => {
        e.preventDefault();
        const files = Array.from(e.dataTransfer.files);

        // Only allow PDF files for documents
        const validFiles = files.filter((file) => file.type === 'application/pdf');

        if (validFiles.length !== files.length) {
            alert(' PDF files allowed');
        }

        if (validFiles.length > 0) {
            const newPreviewUrls = validFiles.map((file) => URL.createObjectURL(file));

            setFormData((prev) => ({
                ...prev,
                documents: [...prev.documents, ...validFiles]
            }));

            setDocumentPreviewUrls((prev) => [...prev, ...newPreviewUrls]);

            const newDocumentNames = validFiles.map((file) => file.name.replace(/\.[^/.]+$/, ''));

            setFormData((prev) => ({
                ...prev,
                documentNames: [...prev.documentNames, ...newDocumentNames]
            }));

            setDocumentNames((prev) => [...prev, ...newDocumentNames]);
        }
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
            documentNames: [], // Add this
            type: 'Physical',
            price: '',
            currency: '',
            speakerIds: [],
            speakerStartTimes: [],
            speakerEndTimes: [],
            categoryIds: [],
            latitude: '',
            longitude: '',
            floorPlan: null,
            exhibitorIds: [],
            exhibitorDescription: '',
            eventStampDescription: '',
            eventStampImages: []
        });
        setImagePreviewUrls([]);
        setDocumentPreviewUrls([]);
        setDocumentNames([]); // Add this
        setEventStampImagePreviewUrls([]);
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
            const response = await axiosInstance.get('users/speakers/get');
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
        fetchExhibitors();
    }, []);

    // Handle speaker and category selection
    const handleSpeakerSelect = (selectedOptions) => {
        const selectedIds = selectedOptions.map((option) => option.value);
        
        // Initialize timing arrays with empty strings for each speaker
        const currentStartTimes = formData.speakerStartTimes || [];
        const currentEndTimes = formData.speakerEndTimes || [];
        
        // Preserve existing times for speakers that are still selected
        const newStartTimes = selectedIds.map((id, index) => {
            const oldIndex = formData.speakerIds.indexOf(id);
            return oldIndex >= 0 ? currentStartTimes[oldIndex] || '' : '';
        });
        
        const newEndTimes = selectedIds.map((id, index) => {
            const oldIndex = formData.speakerIds.indexOf(id);
            return oldIndex >= 0 ? currentEndTimes[oldIndex] || '' : '';
        });
        
        setFormData((prev) => ({
            ...prev,
            speakerIds: selectedIds,
            speakerStartTimes: newStartTimes,
            speakerEndTimes: newEndTimes
        }));
    };

    const handleCategorySelect = (selectedOptions) => {
        const selectedIds = selectedOptions.map((option) => option.value);
        setFormData((prev) => ({
            ...prev,
            categoryIds: selectedIds
        }));
    };

    // Handle speaker timing updates
    const handleSpeakerTimingChange = (index, field, value) => {
        setFormData((prev) => {
            const newTimes = field === 'startTime' ? [...prev.speakerStartTimes] : [...prev.speakerEndTimes];
            newTimes[index] = value;
            
            return {
                ...prev,
                [field === 'startTime' ? 'speakerStartTimes' : 'speakerEndTimes']: newTimes
            };
        });
    };

    // Handle form submission - Updated to handle event stamps correctly
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        // Validate document names before submission
        let hasValidationErrors = false;
        const documentNameErrors = [];

        formData.documentNames.forEach((name, index) => {
            if (name && name.trim()) {
                // Only validate if name is provided
                const validation = validateDocumentName(name, formData.documentNames, index);
                if (!validation.isValid) {
                    hasValidationErrors = true;
                    documentNameErrors.push(`Document ${index + 1}: ${validation.error}`);
                }
            }
        });

        // Clean up empty document names before sending
        const cleanedDocumentNames = formData.documentNames.map((name) => (name && name.trim() ? name.trim() : ''));

        const formDataToSend = new FormData();

        const formattedStartTime = formatTime(formData.startTime);
        const formattedEndTime = formatTime(formData.endTime);

        const dataToSend = {
            ...formData,
            documentNames: cleanedDocumentNames, // Use cleaned names
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
            } else if (key === 'speakerStartTimes') {
                const startTimesArray = Array.isArray(dataToSend.speakerStartTimes) ? dataToSend.speakerStartTimes : [];
                formDataToSend.append('speakerStartTimes', startTimesArray.join(','));
            } else if (key === 'speakerEndTimes') {
                const endTimesArray = Array.isArray(dataToSend.speakerEndTimes) ? dataToSend.speakerEndTimes : [];
                formDataToSend.append('speakerEndTimes', endTimesArray.join(','));
            } else if (key === 'categoryIds') {
                const categoriesArray = Array.isArray(dataToSend.categoryIds) ? dataToSend.categoryIds : [];
                formDataToSend.append('categoryIds', categoriesArray.join(','));
            } else if (key === 'exhibitorIds') {
                const exhibitorsArray = Array.isArray(dataToSend.exhibitorIds) ? dataToSend.exhibitorIds : [];
                formDataToSend.append('exhibitorIds', exhibitorsArray.join(','));
            } else if (key === 'exhibitorDescription') {
                formDataToSend.append('exhibitorDescription', dataToSend[key]);
            } else if (key === 'eventStampDescription') {
                // Handle event stamp description
                formDataToSend.append('eventStampDescription', dataToSend[key]);
            } else if (key === 'eventStampImages') {
                // Handle event stamp images
                if (dataToSend[key] && Array.isArray(dataToSend[key])) {
                    dataToSend[key].forEach((file) => {
                        if (file instanceof File) {
                            formDataToSend.append('eventStampImages', file);
                        }
                    });
                }
            } else if (key === 'floorPlan') {
                if (dataToSend[key] instanceof File) {
                    formDataToSend.append('floorPlan', dataToSend[key]);
                }
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
            } else if (key === 'documentNames') {
                // Handle document names
                if (dataToSend[key] && Array.isArray(dataToSend[key])) {
                    dataToSend[key].forEach((name) => {
                        formDataToSend.append('documentNames', name);
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

            // Handle existing document names for edit mode
            if (formData.documentNames && formData.documentNames.length > 0) {
                formData.documentNames.forEach((name) => {
                    if (typeof name === 'string') {
                        formDataToSend.append('originalDocumentNames', name);
                    }
                });
            }

            // Handle existing event stamp images for edit mode
            if (formData.eventStampImages && formData.eventStampImages.length > 0) {
                formData.eventStampImages.forEach((image) => {
                    if (typeof image === 'string') {
                        formDataToSend.append('originalEventStampImages', image);
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
        } finally {
            setIsSubmitting(false);
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
        label: `${speaker.firstName} ${speaker.lastName}`,
        value: speaker.id
    }));

    const selectedSpeakerOptions = speakerOptions.filter((option) => formData.speakerIds && formData.speakerIds.includes(option.value));

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
        setIsSpeakerLoading(true);
        const formDataToSend = new FormData();

        Object.keys(newSpeaker).forEach((key) => {
            if (key === 'profilePicture' && newSpeaker[key]) {
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
                    firstName: '',
                    lastName: '',
                    email: '',
                    mobile: '',
                    position: '',
                    companyName: '',
                    description: '',
                    profilePicture: null
                });
                setShowSidebar(false);
            }
        } catch (error) {
            console.error('Error adding speaker:', error);
        } finally {
            setIsSpeakerLoading(false);
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

    // Handle location save from modal
    const handleLocationSave = (locationData) => {
        setFormData((prev) => ({
            ...prev,
            ...locationData
        }));
    };

    // Floor plan handling
    const handleFloorPlanChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFormData((prev) => ({
                ...prev,
                floorPlan: file
            }));
            setFloorPlanPreview(URL.createObjectURL(file));
        }
    };

    const handleRemoveFloorPlan = async () => {
        const response = await dispatch(removeEventFloorPlan(id));
        if (response.success) {
            setFormData((prev) => ({
                ...prev,
                floorPlan: null
            }));
            setFloorPlanPreview(null);
        }
    };

    // Exhibitor handling
    const handleExhibitorSelect = (selectedOptions) => {
        const selectedIds = selectedOptions.map((option) => option.value);
        setFormData((prev) => ({
            ...prev,
            exhibitorIds: selectedIds
        }));
    };

    // Add new event stamp handling functions
    const handleEventStampDescriptionChange = (e) => {
        const { value } = e.target;
        setFormData((prev) => ({
            ...prev,
            eventStampDescription: value
        }));
    };

    const handleExhibitorDescriptionChange = (e) => {
        const { value } = e.target;
        setFormData((prev) => ({
            ...prev,
            exhibitorDescription: value
        }));
    };

    const handleEventStampImagesChange = (e) => {
        const files = Array.from(e.target.files);

        const newPreviewUrls = files.map((file) => URL.createObjectURL(file));

        setFormData((prev) => ({
            ...prev,
            eventStampImages: [...prev.eventStampImages, ...files]
        }));

        setEventStampImagePreviewUrls((prev) => [...prev, ...newPreviewUrls]);
    };

    const handleRemoveEventStampImage = async (indexToRemove) => {
        const imageToRemove = formData.eventStampImages[indexToRemove];

        if (typeof imageToRemove === 'string' && id) {
            try {
                const updatedImages = await dispatch(removeEventStampImage(id, imageToRemove));
                if (updatedImages) {
                    setFormData((prev) => ({
                        ...prev,
                        eventStampImages: updatedImages
                    }));

                    const newPreviewUrls = updatedImages.map((img) =>
                        img.startsWith('http') ? img : `${API_URL}/${img.replace(/\\/g, '/')}`
                    );
                    setEventStampImagePreviewUrls(newPreviewUrls);
                }
            } catch (error) {
                // Error handling without console
            }
        } else {
            setFormData((prev) => ({
                ...prev,
                images: prev.images.filter((_, index) => index !== indexToRemove)
            }));

            setImagePreviewUrls((prev) => prev.filter((_, index) => index !== indexToRemove));
        }
    };

    const fetchExhibitors = async () => {
        try {
            const response = await dispatch(exhibitorGet());
            setExhibitorList(response.data);
        } catch (error) {
            // Error handling without console
        }
    };

    const handleNavigate = () => {
        navigate(EVENT_PATHS.LIST_EVENTS);
    };

    // Document name change handler - updated version
    const handleDocumentNameChange = (index, newName) => {
        // FormData में documentNames को update करें
        setFormData((prev) => {
            const updatedNames = [...prev.documentNames];
            updatedNames[index] = newName;

            return {
                ...prev,
                documentNames: updatedNames
            };
        });
    };

    // Document name validation function
    const validateDocumentName = (name, index) => {
        // If name is completely empty, no validation needed
        if (!name || name.trim() === '') {
            return { isValid: true, error: '' };
        }

        // If name has content, then validate
        if (name.trim().length < 2) {
            return {
                isValid: false,
                error: 'Document name should be at least 2 characters'
            };
        }

        // Check for duplicate names
        const duplicateIndex = formData.documentNames.findIndex(
            (docName, idx) => idx !== index && docName && docName.trim().toLowerCase() === name.trim().toLowerCase()
        );

        if (duplicateIndex !== -1) {
            return {
                isValid: false,
                error: 'Document name already exists'
            };
        }

        return { isValid: true, error: '' };
    };

    return (
        <Container fluid>
            <div className="row">
                <div className="col-12">
                    <div className="card">
                        <div className="card-header">
                            <div className="d-flex justify-content-between align-items-center">
                                <h4 className="card-title">{id ? 'Edit Event' : 'Add Event'}</h4>
                                <Button variant="secondary" onClick={handleNavigate}>
                                    <i style={{ marginRight: '10px' }} className="fas fa-arrow-left me-2"></i>
                                    Back
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
                                            <div style={{ position: 'relative' }}>
                                                <input
                                                    type="number"
                                                    className="form-control"
                                                    name="latitude"
                                                    value={formData.latitude}
                                                    onChange={handleChange}
                                                    placeholder="Latitude"
                                                    style={{ paddingRight: '45px' }}
                                                />
                                                <Button
                                                    variant="outline-primary"
                                                    size="sm"
                                                    onClick={() => setShowMapModal(true)}
                                                    style={{
                                                        position: 'absolute',
                                                        right: '8px',
                                                        top: '50%',
                                                        transform: 'translateY(-50%)',
                                                        height: '32px',
                                                        width: '32px',
                                                        padding: '0',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        fontSize: '14px',
                                                        borderRadius: '4px'
                                                    }}
                                                    title="Select on Map"
                                                >
                                                    <i className="fas fa-map-marker-alt"></i>
                                                </Button>
                                            </div>
                                        </div>
                                    </Col>
                                    <Col sm={6}>
                                        <div className="form-group fill">
                                            <label className="floating-label" htmlFor="longitude">
                                                Longitude
                                            </label>
                                            <div style={{ position: 'relative' }}>
                                                <input
                                                    type="number"
                                                    className="form-control"
                                                    name="longitude"
                                                    value={formData.longitude}
                                                    onChange={handleChange}
                                                    placeholder="Longitude"
                                                    style={{ paddingRight: '45px' }}
                                                />
                                                <Button
                                                    variant="outline-primary"
                                                    size="sm"
                                                    onClick={() => setShowMapModal(true)}
                                                    style={{
                                                        position: 'absolute',
                                                        right: '8px',
                                                        top: '50%',
                                                        transform: 'translateY(-50%)',
                                                        height: '32px',
                                                        width: '32px',
                                                        padding: '0',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        fontSize: '14px',
                                                        borderRadius: '4px'
                                                    }}
                                                    title="Select on Map"
                                                >
                                                    <i className="fas fa-map-marker-alt"></i>
                                                </Button>
                                            </div>
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
                                        <div className="form-group fill">
                                            <label className="floating-label" htmlFor="description">
                                                Event Description (Optional)
                                            </label>
                                            <textarea
                                                className="form-control"
                                                name="description"
                                                value={formData.description}
                                                onChange={handleChange}
                                                placeholder="Enter event description..."
                                                rows={3}
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
                                                    placeholder={id ? 'Update speakers...' : 'Choose speakers...'}
                                                    onMenuOpen={() => setSpeakerDropdownOpen(true)}
                                                    onMenuClose={() => setSpeakerDropdownOpen(false)}
                                                    styles={{
                                                        control: (base) => ({
                                                            ...base,
                                                            ...(speakerDropdownOpen && {
                                                                zIndex: showMapModal ? 1 : 9999
                                                            })
                                                        }),
                                                        menu: (base) => ({
                                                            ...base,
                                                            ...(speakerDropdownOpen && {
                                                                zIndex: showMapModal ? 1 : 9999
                                                            })
                                                        }),
                                                        menuPortal: (base) => ({
                                                            ...base,
                                                            ...(speakerDropdownOpen && {
                                                                zIndex: showMapModal ? 1 : 10000
                                                            })
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

                                        {/* Speaker Timing Fields */}
                                        {formData.speakerIds && formData.speakerIds.length > 0 && (
                                            <div className="mt-4 p-3 border rounded bg-light">
                                                <h6 className="mb-3">Speaker Timings</h6>
                                                {formData.speakerIds.map((speakerId, index) => {
                                                    const speaker = speakerList.find(s => s.id === speakerId);
                                                    return (
                                                        <div key={speakerId} className="mb-3 p-3 border rounded bg-white">
                                                            <div className="mb-2">
                                                                <strong>
                                                                    {speaker ? `${speaker.firstName} ${speaker.lastName}` : 'Speaker'}
                                                                </strong>
                                                            </div>
                                                            <Row>
                                                                <Col md={6}>
                                                                    <Form.Group>
                                                                        <Form.Label>Speaking Start Time</Form.Label>
                                                                        <Form.Control
                                                                            type="time"
                                                                            value={formData.speakerStartTimes?.[index] || ''}
                                                                            onChange={(e) => handleSpeakerTimingChange(index, 'startTime', e.target.value)}
                                                                            placeholder="HH:MM"
                                                                        />
                                                                    </Form.Group>
                                                                </Col>
                                                                <Col md={6}>
                                                                    <Form.Group>
                                                                        <Form.Label>Speaking End Time</Form.Label>
                                                                        <Form.Control
                                                                            type="time"
                                                                            value={formData.speakerEndTimes?.[index] || ''}
                                                                            onChange={(e) => handleSpeakerTimingChange(index, 'endTime', e.target.value)}
                                                                            placeholder="HH:MM"
                                                                        />
                                                                    </Form.Group>
                                                                </Col>
                                                            </Row>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}

                                        <SpeakerFormModal
                                            show={showSidebar}
                                            onClose={() => setShowSidebar(false)}
                                            onChange={handleInputChange}
                                            onSubmit={handleAddSpeaker}
                                            formData={newSpeaker}
                                            isLoading={isSpeakerLoading}
                                        />

                                        <CategoryFormModal
                                            show={showCategoryModal}
                                            onClose={() => setShowCategoryModal(false)}
                                            onChange={(e) => {
                                                const { name, value } = e.target;
                                                setNewCategory((prev) => ({
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
                                                    placeholder={id ? 'Update categories...' : 'Choose categories...'}
                                                    onMenuOpen={() => setCategoryDropdownOpen(true)}
                                                    onMenuClose={() => setCategoryDropdownOpen(false)}
                                                    styles={{
                                                        control: (base) => ({
                                                            ...base,
                                                            ...(categoryDropdownOpen && {
                                                                zIndex: showMapModal ? 1 : 9999
                                                            })
                                                        }),
                                                        menu: (base) => ({
                                                            ...base,
                                                            ...(categoryDropdownOpen && {
                                                                zIndex: showMapModal ? 1 : 9999
                                                            })
                                                        }),
                                                        menuPortal: (base) => ({
                                                            ...base,
                                                            ...(categoryDropdownOpen && {
                                                                zIndex: showMapModal ? 1 : 10000
                                                            })
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
                                        <div className="form-group d-flex align-items-center">
                                            <div style={{ flex: 1 }}>
                                                <label>Select Exhibitors (Optional)</label>
                                                <Select
                                                    isMulti
                                                    options={exhibitorList.map((exhibitor) => ({
                                                        label: exhibitor.companyName,
                                                        value: exhibitor.id
                                                    }))}
                                                    value={exhibitorList
                                                        .filter((exhibitor) => formData.exhibitorIds.includes(String(exhibitor.id))) // Convert to string for comparison
                                                        .map((exhibitor) => ({
                                                            label: exhibitor.companyName,
                                                            value: exhibitor.id
                                                        }))}
                                                    onChange={handleExhibitorSelect}
                                                    placeholder="Choose exhibitors..."
                                                    onMenuOpen={() => setExhibitorDropdownOpen(true)}
                                                    onMenuClose={() => setExhibitorDropdownOpen(false)}
                                                    styles={{
                                                        control: (base) => ({
                                                            ...base,
                                                            ...(exhibitorDropdownOpen && {
                                                                zIndex: showMapModal ? 1 : 9999
                                                            })
                                                        }),
                                                        menu: (base) => ({
                                                            ...base,
                                                            ...(exhibitorDropdownOpen && {
                                                                zIndex: showMapModal ? 1 : 9999
                                                            })
                                                        }),
                                                        menuPortal: (base) => ({
                                                            ...base,
                                                            ...(exhibitorDropdownOpen && {
                                                                zIndex: showMapModal ? 1 : 10000
                                                            })
                                                        })
                                                    }}
                                                    menuPortalTarget={document.body}
                                                    menuPosition="fixed"
                                                />
                                            </div>
                                        </div>
                                    </Col>

                                    <Col sm={12}>
                                        <div className="form-group fill">
                                            <label className="floating-label" htmlFor="exhibitorDescription">
                                                Exhibitor Description (Optional)
                                            </label>
                                            <textarea
                                                className="form-control"
                                                name="exhibitorDescription"
                                                value={formData.exhibitorDescription}
                                                onChange={handleExhibitorDescriptionChange}
                                                placeholder="Enter exhibitor description..."
                                                rows={3}
                                            />
                                        </div>
                                    </Col>

                                    <Col sm={12}>
                                        <div className="form-group fill">
                                            <label className="floating-label" htmlFor="eventStampDescription">
                                                Event Stamp Description (Optional)
                                            </label>
                                            <textarea
                                                className="form-control"
                                                name="eventStampDescription"
                                                value={formData.eventStampDescription}
                                                onChange={handleEventStampDescriptionChange}
                                                placeholder="Enter event stamp description..."
                                                rows={3}
                                            />
                                        </div>
                                    </Col>

                                    <Col sm={12}>
                                        <div className="form-group fill">
                                            <Badge bg="info">
                                                <span>Event Stamp Images (Optional) </span> {formData.eventStampImages.length}/5
                                            </Badge>

                                            {/* Drag and Drop Zone for Event Stamp Images */}
                                            <div
                                                className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center mt-2"
                                                onDragOver={handleDragOver}
                                                onDrop={(e) => {
                                                    e.preventDefault();
                                                    const files = Array.from(e.dataTransfer.files);
                                                    const validFiles = files.filter((file) => {
                                                        const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
                                                        const isValidType = allowedImageTypes.includes(file.type);
                                                        const isValidSize = file.size <= 50 * 1024 * 1024;

                                                        if (!isValidType) {
                                                            alert(
                                                                `${file.name} is not a valid image file. Allowed types: JPEG, JPG, PNG, GIF.`
                                                            );
                                                        }
                                                        if (!isValidSize) {
                                                            alert(`${file.name} is too large. Maximum size is 50MB.`);
                                                        }

                                                        return isValidType && isValidSize;
                                                    });

                                                    const newPreviewUrls = validFiles.map((file) => URL.createObjectURL(file));

                                                    setFormData((prev) => ({
                                                        ...prev,
                                                        eventStampImages: [...prev.eventStampImages, ...validFiles]
                                                    }));

                                                    setEventStampImagePreviewUrls((prev) => [...prev, ...newPreviewUrls]);
                                                }}
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
                                                    <i className="fas fa-stamp fa-3x text-muted"></i>
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
                                                    Drag and drop event stamp images here, or click to select files
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
                                                    Supported formats: JPG, PNG, GIF. Max size: 5MB per image. Max 5 images.
                                                </p>
                                                <input
                                                    type="file"
                                                    className="form-control"
                                                    name="eventStampImages"
                                                    onChange={handleEventStampImagesChange}
                                                    accept="image/*"
                                                    multiple
                                                    style={{ display: 'none' }}
                                                    id="eventStampImageInput"
                                                />
                                                <Button
                                                    variant="outline-primary"
                                                    onClick={() => document.getElementById('eventStampImageInput').click()}
                                                    style={{ marginTop: '10px' }}
                                                >
                                                    Choose Event Stamp Images
                                                </Button>
                                            </div>

                                            {/* Event Stamp Image Preview Grid */}
                                            {formData.eventStampImages && formData.eventStampImages.length > 0 && (
                                                <div className="mt-3">
                                                    <h6
                                                        style={{
                                                            fontSize: '16px',
                                                            fontWeight: '600',
                                                            marginBottom: '15px',
                                                            color: '#333'
                                                        }}
                                                    >
                                                        Selected Event Stamp Images ({formData.eventStampImages.length})
                                                    </h6>
                                                    <div
                                                        style={{
                                                            display: 'grid',
                                                            gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                                                            gap: '15px',
                                                            marginTop: '10px'
                                                        }}
                                                    >
                                                        {formData.eventStampImages.map((image, index) => {
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
                                                                imageSrc = eventStampImagePreviewUrls[index] || URL.createObjectURL(image);
                                                            } else {
                                                                imageSrc = eventStampImagePreviewUrls[index] || '';
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
                                                                        cursor: 'pointer'
                                                                    }}
                                                                    onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.02)')}
                                                                    onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                                                                >
                                                                    <img
                                                                        src={imageSrc}
                                                                        alt={`Event Stamp ${index + 1}`}
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
                                                                                handleRemoveEventStampImage(index);
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
                                                </div>
                                            )}
                                        </div>
                                    </Col>

                                    <Col sm={12}>
                                        <div className="form-group fill">
                                            <Badge bg="info">
                                                {' '}
                                                <span>Images </span> {formData.images.length}/10
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
                                                    <h6
                                                        style={{
                                                            fontSize: '16px',
                                                            fontWeight: '600',
                                                            marginBottom: '15px',
                                                            color: '#333'
                                                        }}
                                                    >
                                                        Selected Images ({formData.images.length})
                                                    </h6>
                                                    <div
                                                        style={{
                                                            display: 'grid',
                                                            gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                                                            gap: '15px',
                                                            marginTop: '10px'
                                                        }}
                                                    >
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
                                                                <div
                                                                    key={index}
                                                                    style={{
                                                                        position: 'relative',
                                                                        borderRadius: '8px',
                                                                        overflow: 'hidden',
                                                                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                                                        transition: 'transform 0.2s ease',
                                                                        cursor: 'pointer'
                                                                    }}
                                                                    onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.02)')}
                                                                    onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
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

                                                    {/* Reorder Instructions */}
                                                    {formData.images.length > 1 && (
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
                                            <Badge bg="info">
                                                {' '}
                                                <span>Documents </span> {formData.documents.length}/10
                                            </Badge>

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
                                                <p
                                                    className="text-muted mb-2"
                                                    style={{
                                                        fontSize: '14px',
                                                        lineHeight: '1.4',
                                                        maxWidth: '100%',
                                                        wordWrap: 'break-word'
                                                    }}
                                                >
                                                    Drag and drop documents here, or click to select files
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

                                            {/* Document Preview List - Direct JSX instead of function */}
                                            {formData.documents && formData.documents.length > 0 && (
                                                <div className="mt-3">
                                                    <h6
                                                        style={{
                                                            fontSize: '16px',
                                                            fontWeight: '600',
                                                            marginBottom: '15px',
                                                            color: '#333'
                                                        }}
                                                    >
                                                        Selected Documents ({formData.documents.length})
                                                    </h6>
                                                    <div
                                                        style={{
                                                            display: 'flex',
                                                            flexDirection: 'column',
                                                            gap: '12px',
                                                            marginTop: '10px'
                                                        }}
                                                    >
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

                                                            const fileName =
                                                                typeof document === 'string' ? document.split('/').pop() : document.name;

                                                            return (
                                                                <div
                                                                    key={`doc-${index}-${fileName}`}
                                                                    style={{
                                                                        display: 'flex',
                                                                        alignItems: 'flex-start',
                                                                        padding: '12px',
                                                                        gap: '6px',
                                                                        border: '1px solid #e9ecef',
                                                                        borderRadius: '8px',
                                                                        backgroundColor: '#ffffff',
                                                                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                                                                        transition: 'all 0.2s ease'
                                                                    }}
                                                                >
                                                                    <div style={{ marginRight: '12px', flexShrink: 0, marginTop: '8px' }}>
                                                                        <i className="fas fa-file-pdf fa-2x text-danger"></i>
                                                                    </div>

                                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                                        {/* Simple input field for document name */}
                                                                        <input
                                                                            type="text"
                                                                            value={formData.documentNames[index] || ''}
                                                                            onChange={(e) =>
                                                                                handleDocumentNameChange(index, e.target.value)
                                                                            }
                                                                            placeholder="Enter document name (optional)"
                                                                            style={{
                                                                                width: '100%',
                                                                                padding: '6px 8px',
                                                                                border: '1px solid #ddd',
                                                                                borderRadius: '4px',
                                                                                fontSize: '14px',
                                                                                fontWeight: '600',
                                                                                marginBottom: '4px'
                                                                            }}
                                                                        />

                                                                        <div
                                                                            style={{
                                                                                fontSize: '12px',
                                                                                color: '#666',
                                                                                whiteSpace: 'nowrap',
                                                                                overflow: 'hidden',
                                                                                textOverflow: 'ellipsis'
                                                                            }}
                                                                        >
                                                                            File: {fileName} |{' '}
                                                                            {isExistingDocument
                                                                                ? 'Existing Document'
                                                                                : `${(document.size / 1024 / 1024).toFixed(1)}MB`}
                                                                        </div>
                                                                    </div>

                                                                    <div
                                                                        style={{
                                                                            display: 'flex',
                                                                            gap: '6px',
                                                                            flexShrink: 0,
                                                                            marginTop: '1px'
                                                                        }}
                                                                    >
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

                                                    <div
                                                        style={{
                                                            marginTop: '10px',
                                                            padding: '8px 12px',
                                                            backgroundColor: '#f8f9fa',
                                                            borderRadius: '4px',
                                                            fontSize: '12px',
                                                            color: '#6c757d'
                                                        }}
                                                    >
                                                        💡 Document names are optional. Leave empty if not needed.
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </Col>
                                    <Col sm={12}>
                                        <div className="form-group fill">
                                            <Badge bg="info">
                                                {' '}
                                                <span>Floor Plan (Optional) </span> {floorPlanPreview ? 'Selected' : 'Not Selected'}
                                            </Badge>

                                            {/* Floor Plan Section */}
                                            <div className="form-group fill">
                                                <div
                                                    className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center mt-2"
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
                                                    {floorPlanPreview && formData.floorPlan ? (
                                                        <div style={{ width: '100%', maxWidth: '300px' }}>
                                                            <img
                                                                src={floorPlanPreview}
                                                                alt="Floor Plan Preview"
                                                                style={{
                                                                    width: '100%',
                                                                    height: 'auto',
                                                                    borderRadius: '8px',
                                                                    marginBottom: '10px'
                                                                }}
                                                            />
                                                            <Button
                                                                variant="danger"
                                                                size="sm"
                                                                onClick={handleRemoveFloorPlan}
                                                                style={{ marginRight: '10px' }}
                                                            >
                                                                Remove Floor Plan
                                                            </Button>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <div className="mb-3">
                                                                <i className="fas fa-building fa-3x text-muted"></i>
                                                            </div>
                                                            <p className="text-muted mb-2">Upload floor plan image (Optional)</p>
                                                            <p className="text-muted small">
                                                                Supported formats: JPG, PNG, GIF. Max size: 5MB.
                                                            </p>
                                                            <input
                                                                type="file"
                                                                className="form-control"
                                                                name="floorPlan"
                                                                onChange={handleFloorPlanChange}
                                                                accept="image/*"
                                                                style={{ display: 'none' }}
                                                                id="floorPlanInput"
                                                            />
                                                            <Button
                                                                variant="outline-primary"
                                                                onClick={() => document.getElementById('floorPlanInput').click()}
                                                                style={{ marginTop: '10px' }}
                                                            >
                                                                Choose Floor Plan
                                                            </Button>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </Col>

                                    {/* Event Stamp Modal */}
                                    {/* Remove the EventStampFormModal import and usage */}
                                    {/* <EventStampFormModal ... /> */}
                                </Row>

                                {/* Form Actions */}
                                <div className="row mt-4">
                                    <div className="col-12">
                                        <div className="d-flex justify-content-between gap-2">
                                            <Button variant="danger" onClick={handleNavigate} disabled={isSubmitting}>
                                                Cancel
                                            </Button>
                                            <Button variant="primary" type="submit" disabled={isSubmitting}>
                                                {isSubmitting ? <>{id ? 'Updating...' : 'Creating...'}</> : id ? 'Update' : 'Create'}
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
            <MapLocationModal
                show={showMapModal}
                onHide={() => setShowMapModal(false)}
                formData={formData}
                onLocationSave={handleLocationSave}
                display={display}
            />
        </Container>
    );
}

export default AddEventPage;
