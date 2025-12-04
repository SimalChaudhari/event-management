import React, { useState, useEffect } from 'react';
import { Button, Row, Col, Card, Badge, Container, Modal } from 'react-bootstrap';
import { useDispatch } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import { createExhibitor, updateExhibitor, exhibitorById } from '../../store/actions/exhibitorsActions';
import { EXHIBITOR_PATHS } from '../../utils/constants';
import { API_URL } from '../../configs/env';
import SingaporePhoneInput from '../../components/SingaporePhoneInput';

// DocumentNameInput component main component के बाहर define करें (Events जैसा ही)
const DocumentNameInput = ({ index, fileName, documentName, onNameChange, onValidationChange }) => {
    const [localError, setLocalError] = useState('');

    const handleNameChange = (e) => {
        const newName = e.target.value;

        // Update parent component
        onNameChange(index, newName);

        // Validate only if there's content
        if (newName.trim()) {
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

// FlyerNameInput component (Events pattern के अनुसार)
const FlyerNameInput = ({ index, fileName, flyerName, onNameChange, onValidationChange }) => {
    const [localError, setLocalError] = useState('');

    const validateFlyerName = (name, allNames, currentIndex) => {
        if (!name || name.trim() === '') {
            return { isValid: true, error: '' };
        }

        if (name.trim().length < 2) {
            return {
                isValid: false,
                error: 'Flyer name should be at least 2 characters'
            };
        }

        const duplicateIndex = allNames.findIndex(
            (flyerName, idx) => idx !== currentIndex && flyerName && flyerName.trim().toLowerCase() === name.trim().toLowerCase()
        );

        if (duplicateIndex !== -1) {
            return {
                isValid: false,
                error: 'Flyer name already exists'
            };
        }

        return { isValid: true, error: '' };
    };

    const handleNameChange = (e) => {
        const newName = e.target.value;
        onNameChange(index, newName);

        if (newName.trim()) {
            setLocalError('');
        } else {
            setLocalError('');
        }
    };

    return (
        <div style={{ width: '100%' }}>
            <input
                type="text"
                value={flyerName || ''}
                onChange={handleNameChange}
                placeholder="Enter flyer name (optional)"
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

// EventImageNameInput component (Events pattern के अनुसार)
const EventImageNameInput = ({ index, fileName, eventImageName, onNameChange, onValidationChange }) => {
    const [localError, setLocalError] = useState('');


    const handleNameChange = (e) => {
        const newName = e.target.value;
        onNameChange(index, newName);

        if (newName.trim()) {
            setLocalError('');
        } else {
            setLocalError('');
        }
    };

    return (
        <div style={{ width: '100%' }}>
            <input
                type="text"
                value={eventImageName || ''}
                onChange={handleNameChange}
                placeholder="Enter event image name (optional)"
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

function AddExhibitorPage() {
    const dispatch = useDispatch();
    const { id } = useParams(); // Edit mode
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        email: '',
        mobile: '',
        companyName: '',
        companyDescription: '',
        address: '',
        logo: null,
        uen: '',
        bothNumber: '',
        isActive: true,
        flyers: [],
        flyerNames: [],
        eventImages: [],
        eventImageNames: [],
        documents: [],
        documentNames: [],
        boothBanner: [] // Array of {value: string} or strings (images, videos, links)
    });

    // Preview states 
    const [flyerPreviewUrls, setFlyerPreviewUrls] = useState([]);
    const [eventImagePreviewUrls, setEventImagePreviewUrls] = useState([]);
    const [documentPreviewUrls, setDocumentPreviewUrls] = useState([]);
    const [boothBannerPreviewUrls, setBoothBannerPreviewUrls] = useState([]);
    const [boothBannerLinks, setBoothBannerLinks] = useState([]); // For URL links

    // Name arrays
    const [flyerNames, setFlyerNames] = useState([]);
    const [eventImageNames, setEventImageNames] = useState([]);
    const [documentNames, setDocumentNames] = useState([]);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Load edit data if id exists 
    useEffect(() => {
        if (id) {
            const loadExhibitorData = async () => {
                try {
                    setLoading(true);
                    const response = await dispatch(exhibitorById(id));

                    if (response?.data) {
                        const editData = response.data;

                        // Handle flyers data
                        let flyersData = [];
                        let flyerNamesData = [];
                        let flyerPreviewUrls = [];

                        if (editData.flyers) {
                            if (Array.isArray(editData.flyers)) {
                                if (editData.flyers.length > 0 && editData.flyers[0].hasOwnProperty('name')) {
                                    // New format: array of objects with name and flyer
                                    flyersData = editData.flyers.map((flyer) => flyer.flyer);
                                    flyerNamesData = editData.flyers.map((flyer) => flyer.name);
                                    flyerPreviewUrls = editData.flyers.map((flyer) => {
                                        if (flyer.flyer.startsWith('http')) {
                                            return flyer.flyer;
                                        }
                                        return `${API_URL}/${flyer.flyer.replace(/\\/g, '/')}`;
                                    });
                                } else {
                                    // Old format: array of flyer paths only
                                    flyersData = editData.flyers;
                                    flyerNamesData = editData.flyers.map((flyer, index) => `Flyer ${index + 1}`);
                                    flyerPreviewUrls = editData.flyers.map((flyer) => {
                                        if (flyer.startsWith('http')) {
                                            return flyer;
                                        }
                                        return `${API_URL}/${flyer.replace(/\\/g, '/')}`;
                                    });
                                }
                            }
                        }

                        // Handle event images data
                        let eventImagesData = [];
                        let eventImageNamesData = [];
                        let eventImagePreviewUrls = [];

                        if (editData.eventImages) {
                            if (Array.isArray(editData.eventImages)) {
                                if (editData.eventImages.length > 0 && editData.eventImages[0].hasOwnProperty('name')) {
                                    eventImagesData = editData.eventImages.map((eventImage) => eventImage.eventImage);
                                    eventImageNamesData = editData.eventImages.map((eventImage) => eventImage.name);
                                    eventImagePreviewUrls = editData.eventImages.map((eventImage) => {
                                        if (eventImage.eventImage.startsWith('http')) {
                                            return eventImage.eventImage;
                                        }
                                        return `${API_URL}/${eventImage.eventImage.replace(/\\/g, '/')}`;
                                    });
                                } else {
                                    eventImagesData = editData.eventImages;
                                    eventImageNamesData = editData.eventImages.map((eventImage, index) => `Event Image ${index + 1}`);
                                    eventImagePreviewUrls = editData.eventImages.map((eventImage) => {
                                        if (eventImage.startsWith('http')) {
                                            return eventImage;
                                        }
                                        return `${API_URL}/${eventImage.replace(/\\/g, '/')}`;
                                    });
                                }
                            }
                        }

                        // Handle documents data 
                        let documentsData = [];
                        let documentNamesData = [];
                        let documentPreviewUrls = [];

                        if (editData.documents) {
                            if (Array.isArray(editData.documents)) {
                                if (editData.documents.length > 0 && editData.documents[0].hasOwnProperty('name')) {
                                    documentsData = editData.documents.map((doc) => doc.document);
                                    documentNamesData = editData.documents.map((doc) => doc.name);
                                    documentPreviewUrls = editData.documents.map((doc) => {
                                        if (doc.document.startsWith('http')) {
                                            return doc.document;
                                        }
                                        return `${API_URL}/${doc.document.replace(/\\/g, '/')}`;
                                    });
                                } else {
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

                        // Handle booth banner data
                        let boothBannerData = [];
                        let boothBannerPreviewUrlsData = [];
                        let boothBannerLinksData = [];

                        if (editData.boothBanner && Array.isArray(editData.boothBanner)) {
                            boothBannerData = editData.boothBanner.map((banner) => {
                                if (typeof banner === 'object' && banner.value) {
                                    return banner.value;
                                }
                                return typeof banner === 'string' ? banner : '';
                            }).filter(Boolean);

                            boothBannerData.forEach((banner) => {
                                if (banner.startsWith('http://') || banner.startsWith('https://')) {
                                    boothBannerLinksData.push(banner);
                                } else {
                                    const bannerUrl = banner.startsWith('http') 
                                        ? banner 
                                        : `${API_URL}/${banner.replace(/\\/g, '/')}`;
                                    boothBannerPreviewUrlsData.push(bannerUrl);
                                }
                            });
                        }

                        const formDataToSet = {
                            email: editData.email || '',
                            mobile: editData.mobile || '',
                            companyName: editData.companyName || '',
                            companyDescription: editData.companyDescription || '',
                            address: editData.address || '',
                            logo: editData.logo || null,
                            uen: editData.uen || '',
                            bothNumber: editData.bothNumber || '',
                            isActive: editData.isActive !== undefined ? editData.isActive : true,
                            flyers: flyersData,
                            flyerNames: flyerNamesData,
                            eventImages: eventImagesData,
                            eventImageNames: eventImageNamesData,
                            documents: documentsData,
                            documentNames: documentNamesData,
                            boothBanner: boothBannerData
                        };

                        setFormData(formDataToSet);
                        setFlyerPreviewUrls(flyerPreviewUrls);
                        setEventImagePreviewUrls(eventImagePreviewUrls);
                        setDocumentPreviewUrls(documentPreviewUrls);
                        setFlyerNames(flyerNamesData);
                        setEventImageNames(eventImageNamesData);
                        setDocumentNames(documentNamesData);
                        setBoothBannerPreviewUrls(boothBannerPreviewUrlsData);
                        setBoothBannerLinks(boothBannerLinksData);
                    }
                } catch (error) {
                    setError('Failed to load exhibitor data');
                } finally {
                    setLoading(false);
                }
            };
            loadExhibitorData();
        }
    }, [id, dispatch]);

    // Handle form changes 
    const handleChange = (e) => {
        const { name, value, type, files } = e.target;

        if (type === 'file') {
            const newFiles = Array.from(files);

            if (name === 'logo') {
                if (newFiles.length > 0) {
                    setFormData((prev) => ({
                        ...prev,
                        logo: newFiles[0]
                    }));
                }
            } else if (name === 'flyers') {
                const newPreviewUrls = newFiles.map((file) => URL.createObjectURL(file));

                setFormData((prev) => ({
                    ...prev,
                    flyers: [...prev.flyers, ...newFiles]
                }));

                setFlyerPreviewUrls((prev) => [...prev, ...newPreviewUrls]);

                // Add default names for new flyers
                const newFlyerNames = newFiles.map((file, index) => `Flyer ${formData.flyers.length + index + 1}`);
                setFlyerNames((prev) => [...prev, ...newFlyerNames]);

                setFormData((prev) => ({
                    ...prev,
                    flyerNames: [...prev.flyerNames, ...newFlyerNames]
                }));
            } else if (name === 'eventImages') {
                const newPreviewUrls = newFiles.map((file) => URL.createObjectURL(file));

                setFormData((prev) => ({
                    ...prev,
                    eventImages: [...prev.eventImages, ...newFiles]
                }));

                setEventImagePreviewUrls((prev) => [...prev, ...newPreviewUrls]);

                // Add default names for new event images
                const newEventImageNames = newFiles.map((file, index) => `Event Image ${formData.eventImages.length + index + 1}`);
                setEventImageNames((prev) => [...prev, ...newEventImageNames]);

                setFormData((prev) => ({
                    ...prev,
                    eventImageNames: [...prev.eventImageNames, ...newEventImageNames]
                }));
            } else if (name === 'documents') {
                const newPreviewUrls = newFiles.map((file) => URL.createObjectURL(file));

                setFormData((prev) => ({
                    ...prev,
                    documents: [...prev.documents, ...newFiles]
                }));

                setDocumentPreviewUrls((prev) => [...prev, ...newPreviewUrls]);

                // Add default names for new documents
                const newDocumentNames = newFiles.map((file, index) => `Document ${formData.documents.length + index + 1}`);
                setDocumentNames((prev) => [...prev, ...newDocumentNames]);

                setFormData((prev) => ({
                    ...prev,
                    documentNames: [...prev.documentNames, ...newDocumentNames]
                }));
            } else if (name === 'boothBanner') {
                // Support images and videos for booth banner
                const validFiles = newFiles.filter((file) => {
                    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'video/mp4', 'video/mpeg', 'video/quicktime'];
                    return allowedTypes.includes(file.type);
                });

                const newPreviewUrls = validFiles.map((file) => URL.createObjectURL(file));

                setFormData((prev) => ({
                    ...prev,
                    boothBanner: [...prev.boothBanner, ...validFiles]
                }));

                setBoothBannerPreviewUrls((prev) => [...prev, ...newPreviewUrls]);
            }
        } else if (type === 'checkbox') {
            setFormData((prev) => ({
                ...prev,
                [name]: e.target.checked
            }));
        } else {
            setFormData((prev) => ({
                ...prev,
                [name]: value
            }));
        }
    };

    // Drag and drop handlers 
    const handleFlyerDragOver = (e) => {
        e.preventDefault();
    };

    const handleFlyerDrop = (e) => {
        e.preventDefault();
        const files = Array.from(e.dataTransfer.files);
        const validFiles = files.filter((file) => {
            const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
            return allowedImageTypes.includes(file.type);
        });

        if (validFiles.length > 0) {
            const newPreviewUrls = validFiles.map((file) => URL.createObjectURL(file));

            setFormData((prev) => ({
                ...prev,
                flyers: [...prev.flyers, ...validFiles]
            }));

            setFlyerPreviewUrls((prev) => [...prev, ...newPreviewUrls]);

            const newFlyerNames = validFiles.map((file, index) => `Flyer ${formData.flyers.length + index + 1}`);
            setFlyerNames((prev) => [...prev, ...newFlyerNames]);

            setFormData((prev) => ({
                ...prev,
                flyerNames: [...prev.flyerNames, ...newFlyerNames]
            }));
        }
    };

    const handleEventImageDragOver = (e) => {
        e.preventDefault();
    };

    const handleEventImageDrop = (e) => {
        e.preventDefault();
        const files = Array.from(e.dataTransfer.files);
        const validFiles = files.filter((file) => {
            const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
            return allowedImageTypes.includes(file.type);
        });

        if (validFiles.length > 0) {
            const newPreviewUrls = validFiles.map((file) => URL.createObjectURL(file));

            setFormData((prev) => ({
                ...prev,
                eventImages: [...prev.eventImages, ...validFiles]
            }));

            setEventImagePreviewUrls((prev) => [...prev, ...newPreviewUrls]);

            const newEventImageNames = validFiles.map((file, index) => `Event Image ${formData.eventImages.length + index + 1}`);
            setEventImageNames((prev) => [...prev, ...newEventImageNames]);

            setFormData((prev) => ({
                ...prev,
                eventImageNames: [...prev.eventImageNames, ...newEventImageNames]
            }));
        }
    };

    const handleDocumentDragOver = (e) => {
        e.preventDefault();
    };

    const handleDocumentDrop = (e) => {
        e.preventDefault();
        const files = Array.from(e.dataTransfer.files);
        const validFiles = files.filter((file) => file.type === 'application/pdf');

        if (validFiles.length > 0) {
            const newPreviewUrls = validFiles.map((file) => URL.createObjectURL(file));

            setFormData((prev) => ({
                ...prev,
                documents: [...prev.documents, ...validFiles]
            }));

            setDocumentPreviewUrls((prev) => [...prev, ...newPreviewUrls]);

            const newDocumentNames = validFiles.map((file, index) => `Document ${formData.documents.length + index + 1}`);
            setDocumentNames((prev) => [...prev, ...newDocumentNames]);

            setFormData((prev) => ({
                ...prev,
                documentNames: [...prev.documentNames, ...newDocumentNames]
            }));
        }
    };

    // Remove functions 
    const handleRemoveFlyer = (indexToRemove) => {
        setFormData((prev) => ({
            ...prev,
            flyers: prev.flyers.filter((_, index) => index !== indexToRemove)
        }));

        setFlyerPreviewUrls((prev) => prev.filter((_, index) => index !== indexToRemove));

        const updatedNames = flyerNames.filter((_, index) => index !== indexToRemove);
        setFlyerNames(updatedNames);
        setFormData((prev) => ({
            ...prev,
            flyerNames: updatedNames
        }));
    };

    const handleRemoveEventImage = (indexToRemove) => {
        setFormData((prev) => ({
            ...prev,
            eventImages: prev.eventImages.filter((_, index) => index !== indexToRemove)
        }));

        setEventImagePreviewUrls((prev) => prev.filter((_, index) => index !== indexToRemove));

        const updatedNames = eventImageNames.filter((_, index) => index !== indexToRemove);
        setEventImageNames(updatedNames);
        setFormData((prev) => ({
            ...prev,
            eventImageNames: updatedNames
        }));
    };

    const handleRemoveDocument = (indexToRemove) => {
        setFormData((prev) => ({
            ...prev,
            documents: prev.documents.filter((_, index) => index !== indexToRemove)
        }));

        setDocumentPreviewUrls((prev) => prev.filter((_, index) => index !== indexToRemove));

        const updatedNames = documentNames.filter((_, index) => index !== indexToRemove);
        setDocumentNames(updatedNames);
        setFormData((prev) => ({
            ...prev,
            documentNames: updatedNames
        }));
    };

    // Booth Banner handlers
    const handleBoothBannerDragOver = (e) => {
        e.preventDefault();
    };

    const handleBoothBannerDrop = (e) => {
        e.preventDefault();
        const files = Array.from(e.dataTransfer.files);
        const validFiles = files.filter((file) => {
            const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'video/mp4', 'video/mpeg', 'video/quicktime'];
            return allowedTypes.includes(file.type);
        });

        if (validFiles.length > 0) {
            const newPreviewUrls = validFiles.map((file) => URL.createObjectURL(file));

            setFormData((prev) => ({
                ...prev,
                boothBanner: [...prev.boothBanner, ...validFiles]
            }));

            setBoothBannerPreviewUrls((prev) => [...prev, ...newPreviewUrls]);
        }
    };

    const handleAddBoothBannerLink = () => {
        const link = prompt('Enter URL for booth banner (image, video, or link):');
        if (link && link.trim()) {
            setFormData((prev) => ({
                ...prev,
                boothBanner: [...prev.boothBanner, link.trim()]
            }));
            setBoothBannerLinks((prev) => [...prev, link.trim()]);
        }
    };

    const handleRemoveBoothBanner = (indexToRemove) => {
        const item = formData.boothBanner[indexToRemove];
        const isLink = typeof item === 'string' && (item.startsWith('http://') || item.startsWith('https://'));

        setFormData((prev) => ({
            ...prev,
            boothBanner: prev.boothBanner.filter((_, index) => index !== indexToRemove)
        }));

        if (isLink) {
            setBoothBannerLinks((prev) => prev.filter((_, index) => index !== indexToRemove));
        } else {
            setBoothBannerPreviewUrls((prev) => prev.filter((_, index) => index !== indexToRemove));
        }
    };

    // Name change handlers 
    const handleFlyerNameChange = (index, newName) => {
        setFormData((prev) => {
            const updatedNames = [...prev.flyerNames];
            updatedNames[index] = newName;
            return {
                ...prev,
                flyerNames: updatedNames
            };
        });
    };

    const handleEventImageNameChange = (index, newName) => {
        setFormData((prev) => {
            const updatedNames = [...prev.eventImageNames];
            updatedNames[index] = newName;
            return {
                ...prev,
                eventImageNames: updatedNames
            };
        });
    };

    const handleDocumentNameChange = (index, newName) => {
        setFormData((prev) => {
            const updatedNames = [...prev.documentNames];
            updatedNames[index] = newName;
            return {
                ...prev,
                documentNames: updatedNames
            };
        });
    };

    // Validate form
    const validateForm = () => {
        if (!formData.companyName.trim()) {
            setError('Company name is required');
            return false;
        }
        if (!formData.email.trim()) {
            setError('Email is required');
            return false;
        }
        // Email format validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email.trim())) {
            setError('Please enter a valid email address');
            return false;
        }
        return true;
    };

    // Handle form submission 
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!validateForm()) {
            return;
        }

        try {
            setLoading(true);

            const formDataToSend = new FormData();

            // Add logo file
            if (formData.logo && formData.logo instanceof File) {
                formDataToSend.append('logo', formData.logo);
            }

            // Add text fields
            Object.keys(formData).forEach((key) => {
                if (key === 'logo') {
                    // Skip logo as it's handled above
                } else if (key === 'flyerNames') {
                    if (formData[key] && Array.isArray(formData[key])) {
                        // Join array with comma to send as string
                        formDataToSend.append('flyerNames', formData[key].join(','));
                    }
                } else if (key === 'eventImageNames') {
                    if (formData[key] && Array.isArray(formData[key])) {
                        // Join array with comma to send as string
                        formDataToSend.append('eventImageNames', formData[key].join(','));
                    }
                } else if (key === 'documentNames') {
                    if (formData[key] && Array.isArray(formData[key])) {
                        // Join array with comma to send as string
                        formDataToSend.append('documentNames', formData[key].join(','));
                    }
                } else if (key === 'flyers') {
                    if (formData[key] && Array.isArray(formData[key])) {
                        formData[key].forEach((file) => {
                            if (file instanceof File) {
                                formDataToSend.append('flyers', file);
                            }
                        });
                    }
                } else if (key === 'eventImages') {
                    if (formData[key] && Array.isArray(formData[key])) {
                        formData[key].forEach((file) => {
                            if (file instanceof File) {
                                formDataToSend.append('eventImages', file);
                            }
                        });
                    }
                } else if (key === 'documents') {
                    if (formData[key] && Array.isArray(formData[key])) {
                        formData[key].forEach((file) => {
                            if (file instanceof File) {
                                formDataToSend.append('documents', file);
                            }
                        });
                    }
                } else if (key === 'boothBanner') {
                    // Handle booth banner - send existing URLs/links as JSON array
                    // New files will be uploaded separately
                    if (formData[key] && Array.isArray(formData[key])) {
                        const existingBanners = formData[key]
                            .filter(item => typeof item === 'string' && (item.startsWith('http://') || item.startsWith('https://') || item.startsWith('uploads/')))
                            .map(item => ({ value: item }));
                        
                        if (existingBanners.length > 0) {
                            formDataToSend.append('boothBanner', JSON.stringify(existingBanners));
                        }
                        
                        // Upload new files
                        formData[key].forEach((item) => {
                            if (item instanceof File) {
                                formDataToSend.append('boothBanner', item);
                            }
                        });
                    }
                } else if (formData[key] !== null && !Array.isArray(formData[key])) {
                    formDataToSend.append(key, formData[key]);
                }
            });

            // Handle existing files for edit mode
            if (id) {
                // Handle existing logo
                if (formData.logo && typeof formData.logo === 'string') {
                    formDataToSend.append('originalLogo', formData.logo);
                }

                if (formData.flyers && formData.flyers.length > 0) {
                    formData.flyers.forEach((flyer) => {
                        if (typeof flyer === 'string') {
                            formDataToSend.append('originalFlyers', flyer);
                        }
                    });
                }

                if (formData.eventImages && formData.eventImages.length > 0) {
                    formData.eventImages.forEach((eventImage) => {
                        if (typeof eventImage === 'string') {
                            formDataToSend.append('originalEventImages', eventImage);
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

                // Handle existing names for edit mode
                if (formData.flyerNames && formData.flyerNames.length > 0) {
                    formData.flyerNames.forEach((name) => {
                        if (typeof name === 'string') {
                            formDataToSend.append('originalFlyerNames', name);
                        }
                    });
                }

                if (formData.eventImageNames && formData.eventImageNames.length > 0) {
                    formData.eventImageNames.forEach((name) => {
                        if (typeof name === 'string') {
                            formDataToSend.append('originalEventImageNames', name);
                        }
                    });
                }

                if (formData.documentNames && formData.documentNames.length > 0) {
                    formData.documentNames.forEach((name) => {
                        if (typeof name === 'string') {
                            formDataToSend.append('originalDocumentNames', name);
                        }
                    });
                }
            }

            const success = id ? await dispatch(updateExhibitor(id, formDataToSend)) : await dispatch(createExhibitor(formDataToSend));

            if (success) {
                navigate(EXHIBITOR_PATHS.LIST_EXHIBITORS);
            }
        } catch (error) {
            setError('Failed to save exhibitor');
        } finally {
            setLoading(false);
        }
    };

    const handleNavigate = () => {
        navigate(EXHIBITOR_PATHS.LIST_EXHIBITORS);
    };

    if (loading && id) {
        return (
            <div className="text-center p-5">
                <div className="spinner-border" role="status">
                    <span className="sr-only">Loading...</span>
                </div>
            </div>
        );
    }

    return (
        <Container fluid>
            <div className="row">
                <div className="col-12">
                    <div className="card">
                        <div className="card-header">
                            <div className="d-flex justify-content-between align-items-center">
                                <h4 className="card-title">{id ? 'Edit Exhibitor' : 'Add Exhibitor'}</h4>
                                <Button variant="secondary" onClick={handleNavigate}>
                                    <i style={{ marginRight: '10px' }} className="fas fa-arrow-left me-2"></i>
                                    Back
                                </Button>
                            </div>
                        </div>
                        <div className="card-body">
                            {error && (
                                <div className="alert alert-danger" role="alert">
                                    {error}
                                </div>
                            )}

                            <form onSubmit={handleSubmit}>
                                <Row>
                                    {/* Company Name - First field */}
                                    <Col sm={12}>
                                        <div className="form-group fill">
                                            <label className="floating-label" htmlFor="companyName">
                                                Company Name <span style={{ color: 'red' }}>*</span>
                                            </label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                name="companyName"
                                                value={formData.companyName}
                                                onChange={handleChange}
                                                placeholder="Company Name"
                                                required
                                            />
                                        </div>
                                    </Col>

                                    {/* Email */}
                                    <Col sm={6}>
                                        <div className="form-group fill">
                                            <label className="floating-label" htmlFor="email">
                                                Email <span style={{ color: 'red' }}>*</span>
                                            </label>
                                            <input
                                                type="email"
                                                className="form-control"
                                                name="email"
                                                value={formData.email}
                                                onChange={handleChange}
                                                placeholder="Email Address"
                                                required
                                            />
                                        </div>
                                    </Col>

                                    {/* Mobile */}
                                    <Col sm={6}>
                                        <div className="form-group fill">
                                            <SingaporePhoneInput
                                                name="mobile"
                                                value={formData.mobile}
                                                onChange={handleChange}
                                                label="Mobile (Optional)"
                                                required={false}
                                            />
                                        </div>
                                    </Col>

                                    {/* Company Description */}
                                    <Col sm={12}>
                                        <div className="form-group fill">
                                            <label className="floating-label" htmlFor="companyDescription">
                                                Company Description (Optional)
                                            </label>
                                            <textarea
                                                className="form-control"
                                                name="companyDescription"
                                                value={formData.companyDescription}
                                                onChange={handleChange}
                                                placeholder="Enter company description..."
                                                rows={4}
                                            />
                                        </div>
                                    </Col>

                                    {/* Address */}
                                    <Col sm={12}>
                                        <div className="form-group fill">
                                            <label className="floating-label" htmlFor="address">
                                                Address (Optional)
                                            </label>
                                            <textarea
                                                className="form-control"
                                                name="address"
                                                value={formData.address}
                                                onChange={handleChange}
                                                placeholder="Enter company address..."
                                                rows={3}
                                            />
                                        </div>
                                    </Col>

                               

                                    {/* UEN, Booth Number, Status - 3 columns in one line */}
                                    <Col sm={4}>
                                        <div className="form-group fill">
                                            <label className="floating-label" htmlFor="uen">
                                                UEN Number (Optional)
                                            </label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                name="uen"
                                                value={formData.uen}
                                                onChange={handleChange}
                                                placeholder="UEN Number"
                                            />
                                        </div>
                                    </Col>

                                    <Col sm={4}>
                                        <div className="form-group fill">
                                            <label className="floating-label" htmlFor="bothNumber">
                                                Booth Number (Optional)
                                            </label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                name="bothNumber"
                                                value={formData.bothNumber}
                                                onChange={handleChange}
                                                placeholder="Booth Number"
                                            />
                                        </div>
                                    </Col>

                                    <Col sm={4}>
                                        <div className="form-group fill">
                                            <label className="floating-label">Status</label>
                                            <div>
                                                <input
                                                    type="checkbox"
                                                    name="isActive"
                                                    checked={formData.isActive}
                                                    onChange={handleChange}
                                                    style={{ marginRight: '8px', marginTop: '10px' }}
                                                />
                                                <label>Active</label>
                                            </div>
                                        </div>
                                    </Col>

                                         {/* Logo Upload - Below Company Description */}
                                         <Col sm={12}>
                                        <div className="form-group fill">
                                            <label className="floating-label" htmlFor="logo">
                                                Company Logo
                                            </label>
                                            <input
                                                type="file"
                                                className="form-control"
                                                name="logo"
                                                onChange={handleChange}
                                                accept="image/*"
                                            />
                                            {formData.logo && (
                                                <div className="mt-2">
                                                    <img
                                                        src={formData.logo instanceof File ? URL.createObjectURL(formData.logo) : `${API_URL}/${formData.logo.replace(/\\/g, '/')}`}
                                                        alt="Logo Preview"
                                                        style={{
                                                            width: '100px',
                                                            height: '100px',
                                                            objectFit: 'cover',
                                                            borderRadius: '8px',
                                                            border: '2px solid #ddd'
                                                        }}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </Col>

                                    {/* Flyers Section - Events pattern */}
                                    <Col sm={12}>
                                        <div className="form-group fill">
                                            <Badge bg="info">
                                                <span>Flyers </span> {formData.flyers.length}/10
                                            </Badge>

                                            {/* Drag and Drop Zone for Flyers */}
                                            <div
                                                className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center mt-2"
                                                onDragOver={handleFlyerDragOver}
                                                onDrop={handleFlyerDrop}
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
                                                    Drag and drop flyers here, or click to select files
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
                                                    name="flyers"
                                                    onChange={handleChange}
                                                    accept="image/*"
                                                    multiple
                                                    style={{ display: 'none' }}
                                                    id="flyerInput"
                                                />
                                                <Button
                                                    variant="outline-primary"
                                                    onClick={() => document.getElementById('flyerInput').click()}
                                                    style={{ marginTop: '10px' }}
                                                >
                                                    Choose Flyers
                                                </Button>
                                            </div>

                                            {/* Flyer Preview Grid */}
                                            {formData.flyers && formData.flyers.length > 0 && (
                                                <div className="mt-3">
                                                    <h6
                                                        style={{
                                                            fontSize: '16px',
                                                            fontWeight: '600',
                                                            marginBottom: '15px',
                                                            color: '#333'
                                                        }}
                                                    >
                                                        Selected Flyers ({formData.flyers.length})
                                                    </h6>
                                                    <div
                                                        style={{
                                                            display: 'grid',
                                                            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                                                            gap: '15px',
                                                            marginTop: '10px'
                                                        }}
                                                    >
                                                        {formData.flyers.map((flyer, index) => {
                                                            let flyerSrc = '';
                                                            let isExistingFlyer = false;

                                                            if (typeof flyer === 'string') {
                                                                isExistingFlyer = true;
                                                                if (flyer.startsWith('http')) {
                                                                    flyerSrc = flyer;
                                                                } else {
                                                                    flyerSrc = `${API_URL}/${flyer.replace(/\\/g, '/')}`;
                                                                }
                                                            } else if (flyer instanceof File) {
                                                                flyerSrc = flyerPreviewUrls[index] || URL.createObjectURL(flyer);
                                                            }

                                                            const fileName =
                                                                typeof flyer === 'string' ? flyer.split('/').pop() : flyer.name;

                                                            return (
                                                                <div
                                                                    key={`flyer-${index}-${fileName}`}
                                                                    style={{
                                                                        display: 'flex',
                                                                        flexDirection: 'column',
                                                                        padding: '12px',
                                                                        border: '1px solid #e9ecef',
                                                                        borderRadius: '8px',
                                                                        backgroundColor: '#ffffff',
                                                                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                                                                    }}
                                                                >
                                                                    <div style={{ position: 'relative', marginBottom: '8px' }}>
                                                                        <img
                                                                            src={flyerSrc}
                                                                            alt={`Flyer ${index + 1}`}
                                                                            style={{
                                                                                width: '100%',
                                                                                height: '120px',
                                                                                objectFit: 'cover',
                                                                                borderRadius: '4px'
                                                                            }}
                                                                        />
                                                                        <Button
                                                                            size="sm"
                                                                            variant="danger"
                                                                            onClick={() => handleRemoveFlyer(index)}
                                                                            style={{
                                                                                position: 'absolute',
                                                                                top: '4px',
                                                                                right: '4px',
                                                                                padding: '4px 8px',
                                                                                fontSize: '12px',
                                                                                borderRadius: '50%',
                                                                                width: '24px',
                                                                                height: '24px',
                                                                                display: 'flex',
                                                                                alignItems: 'center',
                                                                                justifyContent: 'center'
                                                                            }}
                                                                        >
                                                                            ×
                                                                        </Button>
                                                                    </div>

                                                                    <FlyerNameInput
                                                                        index={index}
                                                                        fileName={fileName}
                                                                        flyerName={formData.flyerNames[index] || ''}
                                                                        onNameChange={handleFlyerNameChange}
                                                                    />

                                                                    <div
                                                                        style={{
                                                                            fontSize: '11px',
                                                                            color: '#666',
                                                                            marginTop: '4px'
                                                                        }}
                                                                    >
                                                                        {isExistingFlyer
                                                                            ? 'Existing Flyer'
                                                                            : `${(flyer.size / 1024 / 1024).toFixed(1)}MB`}
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </Col>

                                    {/* Event Images Section - Events pattern  */}
                                    <Col sm={12}>
                                        <div className="form-group fill">
                                            <Badge bg="info">
                                                <span>Event Images </span> {formData.eventImages.length}/10
                                            </Badge>

                                            {/* Drag and Drop Zone for Event Images */}
                                            <div
                                                className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center mt-2"
                                                onDragOver={handleEventImageDragOver}
                                                onDrop={handleEventImageDrop}
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
                                                    <i className="fas fa-image fa-3x text-muted"></i>
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
                                                    Drag and drop event images here, or click to select files
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
                                                    name="eventImages"
                                                    onChange={handleChange}
                                                    accept="image/*"
                                                    multiple
                                                    style={{ display: 'none' }}
                                                    id="eventImageInput"
                                                />
                                                <Button
                                                    variant="outline-primary"
                                                    onClick={() => document.getElementById('eventImageInput').click()}
                                                    style={{ marginTop: '10px' }}
                                                >
                                                    Choose Event Images
                                                </Button>
                                            </div>

                                            {/* Event Image Preview Grid */}
                                            {formData.eventImages && formData.eventImages.length > 0 && (
                                                <div className="mt-3">
                                                    <h6
                                                        style={{
                                                            fontSize: '16px',
                                                            fontWeight: '600',
                                                            marginBottom: '15px',
                                                            color: '#333'
                                                        }}
                                                    >
                                                        Selected Event Images ({formData.eventImages.length})
                                                    </h6>
                                                    <div
                                                        style={{
                                                            display: 'grid',
                                                            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                                                            gap: '15px',
                                                            marginTop: '10px'
                                                        }}
                                                    >
                                                        {formData.eventImages.map((eventImage, index) => {
                                                            let eventImageSrc = '';
                                                            let isExistingEventImage = false;

                                                            if (typeof eventImage === 'string') {
                                                                isExistingEventImage = true;
                                                                if (eventImage.startsWith('http')) {
                                                                    eventImageSrc = eventImage;
                                                                } else {
                                                                    eventImageSrc = `${API_URL}/${eventImage.replace(/\\/g, '/')}`;
                                                                }
                                                            } else if (eventImage instanceof File) {
                                                                eventImageSrc =
                                                                    eventImagePreviewUrls[index] || URL.createObjectURL(eventImage);
                                                            }

                                                            const fileName =
                                                                typeof eventImage === 'string'
                                                                    ? eventImage.split('/').pop()
                                                                    : eventImage.name;

                                                            return (
                                                                <div
                                                                    key={`eventImage-${index}-${fileName}`}
                                                                    style={{
                                                                        display: 'flex',
                                                                        flexDirection: 'column',
                                                                        padding: '12px',
                                                                        border: '1px solid #e9ecef',
                                                                        borderRadius: '8px',
                                                                        backgroundColor: '#ffffff',
                                                                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                                                                    }}
                                                                >
                                                                    <div style={{ position: 'relative', marginBottom: '8px' }}>
                                                                        <img
                                                                            src={eventImageSrc}
                                                                            alt={`Event Image ${index + 1}`}
                                                                            style={{
                                                                                width: '100%',
                                                                                height: '120px',
                                                                                objectFit: 'cover',
                                                                                borderRadius: '4px'
                                                                            }}
                                                                        />
                                                                        <Button
                                                                            size="sm"
                                                                            variant="danger"
                                                                            onClick={() => handleRemoveEventImage(index)}
                                                                            style={{
                                                                                position: 'absolute',
                                                                                top: '4px',
                                                                                right: '4px',
                                                                                padding: '4px 8px',
                                                                                fontSize: '12px',
                                                                                borderRadius: '50%',
                                                                                width: '24px',
                                                                                height: '24px',
                                                                                display: 'flex',
                                                                                alignItems: 'center',
                                                                                justifyContent: 'center'
                                                                            }}
                                                                        >
                                                                            ×
                                                                        </Button>
                                                                    </div>

                                                                    <EventImageNameInput
                                                                        index={index}
                                                                        fileName={fileName}
                                                                        eventImageName={formData.eventImageNames[index] || ''}
                                                                        onNameChange={handleEventImageNameChange}
                                                                    />

                                                                    <div
                                                                        style={{
                                                                            fontSize: '11px',
                                                                            color: '#666',
                                                                            marginTop: '4px'
                                                                        }}
                                                                    >
                                                                        {isExistingEventImage
                                                                            ? 'Existing Event Image'
                                                                            : `${(eventImage.size / 1024 / 1024).toFixed(1)}MB`}
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </Col>

                                    {/* Documents Section - Events pattern  */}
                                    <Col sm={12}>
                                        <div className="form-group fill">
                                            <Badge bg="info">
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
                                                    Supported formats: PDF only. Max size: 10MB per file. Max 10 files.
                                                </p>
                                                <input
                                                    type="file"
                                                    className="form-control"
                                                    name="documents"
                                                    onChange={handleChange}
                                                    accept=".pdf"
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
                                                                        <DocumentNameInput
                                                                            index={index}
                                                                            fileName={fileName}
                                                                            documentName={formData.documentNames[index] || ''}
                                                                            onNameChange={handleDocumentNameChange}
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

                                    {/* Booth Banner Section */}
                                    <Col sm={12}>
                                        <div className="form-group fill">
                                            <Badge bg="info">
                                                <span>Booth Banner </span> {formData.boothBanner.length}/20
                                            </Badge>
                                            <p className="text-muted small mt-2 mb-2">
                                                Upload images, videos, or add links for booth banner display
                                            </p>

                                            {/* Drag and Drop Zone for Booth Banner */}
                                            <div
                                                className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center mt-2"
                                                onDragOver={handleBoothBannerDragOver}
                                                onDrop={handleBoothBannerDrop}
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
                                                    <i className="fas fa-images fa-3x text-muted"></i>
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
                                                    Drag and drop images/videos here, or click to select files
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
                                                    Supported: JPG, PNG, GIF, MP4. Max size: 10MB per file. Max 20 items.
                                                </p>
                                                <input
                                                    type="file"
                                                    className="form-control"
                                                    name="boothBanner"
                                                    onChange={handleChange}
                                                    accept="image/*,video/*"
                                                    multiple
                                                    style={{ display: 'none' }}
                                                    id="boothBannerInput"
                                                />
                                                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                                    <Button
                                                        variant="outline-primary"
                                                        onClick={() => document.getElementById('boothBannerInput').click()}
                                                    >
                                                        Choose Files
                                                    </Button>
                                                    <Button
                                                        variant="outline-success"
                                                        onClick={handleAddBoothBannerLink}
                                                    >
                                                        <i className="fas fa-link me-1"></i>
                                                        Add Link
                                                    </Button>
                                                </div>
                                            </div>

                                            {/* Booth Banner Preview Grid */}
                                            {formData.boothBanner && formData.boothBanner.length > 0 && (
                                                <div className="mt-3">
                                                    <h6
                                                        style={{
                                                            fontSize: '16px',
                                                            fontWeight: '600',
                                                            marginBottom: '15px',
                                                            color: '#333'
                                                        }}
                                                    >
                                                        Booth Banner Items ({formData.boothBanner.length})
                                                    </h6>
                                                    <div
                                                        style={{
                                                            display: 'grid',
                                                            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                                                            gap: '15px',
                                                            marginTop: '10px'
                                                        }}
                                                    >
                                                        {formData.boothBanner.map((item, index) => {
                                                            let itemSrc = '';
                                                            let isLink = false;
                                                            let isExisting = false;

                                                            if (typeof item === 'string') {
                                                                isLink = item.startsWith('http://') || item.startsWith('https://');
                                                                isExisting = item.startsWith('uploads/');
                                                                
                                                                if (isLink) {
                                                                    itemSrc = item;
                                                                } else {
                                                                    itemSrc = `${API_URL}/${item.replace(/\\/g, '/')}`;
                                                                }
                                                            } else if (item instanceof File) {
                                                                itemSrc = boothBannerPreviewUrls[index] || URL.createObjectURL(item);
                                                            }

                                                            const isVideo = itemSrc && (itemSrc.includes('.mp4') || itemSrc.includes('.mpeg') || itemSrc.includes('.mov') || (item instanceof File && item.type.startsWith('video/')));

                                                            return (
                                                                <div
                                                                    key={`boothBanner-${index}`}
                                                                    style={{
                                                                        display: 'flex',
                                                                        flexDirection: 'column',
                                                                        padding: '12px',
                                                                        border: '1px solid #e9ecef',
                                                                        borderRadius: '8px',
                                                                        backgroundColor: '#ffffff',
                                                                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                                                                    }}
                                                                >
                                                                    <div style={{ position: 'relative', marginBottom: '8px' }}>
                                                                        {isVideo ? (
                                                                            <video
                                                                                src={itemSrc}
                                                                                style={{
                                                                                    width: '100%',
                                                                                    height: '120px',
                                                                                    objectFit: 'cover',
                                                                                    borderRadius: '4px'
                                                                                }}
                                                                                controls
                                                                            />
                                                                        ) : (
                                                                            <img
                                                                                src={itemSrc}
                                                                                alt={`Banner ${index + 1}`}
                                                                                style={{
                                                                                    width: '100%',
                                                                                    height: '120px',
                                                                                    objectFit: 'cover',
                                                                                    borderRadius: '4px'
                                                                                }}
                                                                                onError={(e) => {
                                                                                    e.target.src = '/assets/images/placeholder.jpg';
                                                                                }}
                                                                            />
                                                                        )}
                                                                        <Button
                                                                            size="sm"
                                                                            variant="danger"
                                                                            onClick={() => handleRemoveBoothBanner(index)}
                                                                            style={{
                                                                                position: 'absolute',
                                                                                top: '4px',
                                                                                right: '4px',
                                                                                padding: '4px 8px',
                                                                                fontSize: '12px',
                                                                                borderRadius: '50%',
                                                                                width: '24px',
                                                                                height: '24px',
                                                                                display: 'flex',
                                                                                alignItems: 'center',
                                                                                justifyContent: 'center'
                                                                            }}
                                                                        >
                                                                            ×
                                                                        </Button>
                                                                    </div>

                                                                    <div
                                                                        style={{
                                                                            fontSize: '11px',
                                                                            color: '#666',
                                                                            marginTop: '4px',
                                                                            textAlign: 'center',
                                                                            wordBreak: 'break-word'
                                                                        }}
                                                                    >
                                                                        {isLink ? (
                                                                            <a href={itemSrc} target="_blank" rel="noopener noreferrer" style={{ color: '#007bff' }}>
                                                                                <i className="fas fa-link me-1"></i>
                                                                                Link
                                                                            </a>
                                                                        ) : isExisting ? (
                                                                            'Existing Item'
                                                                        ) : (
                                                                            `${(item.size / 1024 / 1024).toFixed(1)}MB`
                                                                        )}
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
                                            <Button variant="danger" onClick={handleNavigate}>
                                                Cancel
                                            </Button>
                                            <Button variant="primary" type="submit" disabled={loading}>
                                                {loading ? (
                                                    <>
                                                        <span
                                                            className="spinner-border spinner-border-sm me-2"
                                                            role="status"
                                                            aria-hidden="true"
                                                        ></span>
                                                        {id ? 'Updating...' : 'Creating...'}
                                                    </>
                                                ) : id ? (
                                                    'Update'
                                                ) : (
                                                    'Create'
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
}

export default AddExhibitorPage;
