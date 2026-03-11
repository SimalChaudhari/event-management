import React, { useState, useEffect, useRef } from 'react';
import { Button, Row, Col, Badge, Container, Form } from 'react-bootstrap';
import Select from 'react-select';
import { useDispatch, useSelector } from 'react-redux';
import store from '../../../../store/store';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { FetchEventData } from '../fetchEvents/FetchEventApi';
import {
    createEvent,
    editEvent,
    eventById,
    exhibitorGet,
    removeEventFloorPlan,
    removeEventBackgroundImage,
    removeEventStampImage,
    deleteEventStamp,
    getCountries,
    getSpeakersForEvent,
    getCategoriesForEvent,
    eventList
} from '../../../../store/actions/eventActions';
import { API_URL } from '../../../../configs/env';
import 'leaflet/dist/leaflet.css';
import SpeakerFormModal from '../components/SpeakerFormSidebar';
import CategoryFormModal from '../components/CategoryFormModal';
import MapLocationModal from './MapLocationModal';
import { createSpeaker } from '../../../../store/actions/speakerActions';
import { createCategory } from '../../../../store/actions/categoryActions';
import { removeEventImage, removeEventDocument } from '../../../../store/actions/eventActions';
import { EVENT_PATHS } from '../../../../utils/constants';
import useTableNavigation from '../../../../hooks/useTableNavigation';
import { toast } from 'react-toastify';
import EventProgrammeManagement from '../../../../components/events/EventProgrammeManagement';
import { createTrack, createSession } from '../../../../store/actions/programmeActions';
import SettingsEditor from '../../../../App/components/CkEditor/SettingsEditor';
import DeleteConfirmationModal from '../../../../components/modal/DeleteConfirmationModal';
import { components } from 'react-select';

// Main component
function AddEventPage() {
    const dispatch = useDispatch();
    const { id } = useParams(); // Edit mode
    const navigate = useNavigate();
    const location = useLocation();
  
    const events = useSelector((state) => state.event?.event?.events);
    const previousPageRef = useRef(null);
    const originalEventDateRef = useRef(null);
    const programmeDataRef = useRef(null); // Store programme data during event creation

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
        publishStartDate: '',
        publishEndDate: '',
        location: '',
        venue: '',
        country: '',
        images: [],
        documents: [],
        documentNames: [], // Add this new field
        type: 'Physical',
        price: '',
        gstRate: 18,
        speakerIds: [],
        categoryIds: [],
        latitude: '',
        longitude: '',
        floorPlan: null,
        backgroundImage: null,
        exhibitorIds: [],
        exhibitorDescription: '',
        stampRequiredForReward: '', // Stamps required for reward (e.g. 8) - progress shown as 1/8, 2/8 in app
        eventStampDescription: '', // Description for event stamps
        eventStampIds: [], // Array of existing stamp IDs to associate
        newStamps: [], // Array of new stamps to create: [{ name: string, image: File }]
        enableLuckyDrawFeature: false,
        withdrawalEnabled: true,
        earlyBirdPrice: '',
        earlyBirdStartDate: '',
        earlyBirdEndDate: ''
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

    // Add new states for event stamps
    const [newStamps, setNewStamps] = useState([]); // [{ name: string, image: File, preview: string }]
    const [selectedStampIds, setSelectedStampIds] = useState([]); // Array of selected existing stamp IDs
    const [availableStamps, setAvailableStamps] = useState([]); // List of all available stamps for selection
    const [existingStamps, setExistingStamps] = useState([]); // Existing stamps associated with event (for edit mode)

    // Add floor plan preview state
    const [floorPlanPreview, setFloorPlanPreview] = useState(null);

    // Add background image preview state
    const [backgroundImagePreview, setBackgroundImagePreview] = useState(null);

    // Add new state for document names input
    const [documentNames, setDocumentNames] = useState([]);

    // Add loading state for form submission
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Add loading state for speaker modal
    const [isSpeakerLoading, setIsSpeakerLoading] = useState(false);

    // Confirmation modal for speaker removal
    const [showSpeakerDeleteModal, setShowSpeakerDeleteModal] = useState(false);
    const [speakerToRemove, setSpeakerToRemove] = useState(null);

    // Confirmation modal for stamp removal
    const [showStampDeleteModal, setShowStampDeleteModal] = useState(false);
    const [stampToDelete, setStampToDelete] = useState(null);
    const [isDeletingStamp, setIsDeletingStamp] = useState(false);

    // Add loading states for dropdowns
    const [isLoadingSpeakers, setIsLoadingSpeakers] = useState(false);
    const [isLoadingCategories, setIsLoadingCategories] = useState(false);
    const [isLoadingExhibitors, setIsLoadingExhibitors] = useState(false);
    const [isLoadingCountries, setIsLoadingCountries] = useState(false);

    // Use refs to track in-flight requests (prevents race conditions better than state)
    const fetchingSpeakersRef = useRef(false);
    const fetchingCategoriesRef = useRef(false);
    const fetchingExhibitorsRef = useRef(false);
    const fetchingCountriesRef = useRef(false);
    const countriesFetchedOnMountRef = useRef(false);
    const eventDataLoadedRef = useRef(false);
    const currentEventIdRef = useRef(null);
    // Use refs to track loaded state (prevents stale closures in callbacks)
    const speakersLoadedRef = useRef(false);
    const categoriesLoadedRef = useRef(false);
    const exhibitorsLoadedRef = useRef(false);
    const countriesLoadedRef = useRef(false);

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

    // Fetch functions - now called on demand when dropdowns open
    // Using refs to prevent race conditions and multiple simultaneous calls
    const fetchSpeakers = React.useCallback(async () => {
        // Check refs to prevent race conditions (refs are synchronous and don't cause re-renders)
        if (fetchingSpeakersRef.current) return;
        if (speakersLoadedRef.current) return;

        // Set refs synchronously to prevent race conditions
        fetchingSpeakersRef.current = true;
        setIsLoadingSpeakers(true);
        try {
            const speakers = await dispatch(getSpeakersForEvent());
            // Always set the list and loaded flags, even if empty array
            const speakersList = Array.isArray(speakers) ? speakers : [];
            setSpeakerList(speakersList);
            speakersLoadedRef.current = true; // Update ref synchronously
        } catch (error) {
            console.error('Error fetching speakers:', error);
            // Even on error, set loaded to true to prevent infinite retries
            speakersLoadedRef.current = true;
        } finally {
            setIsLoadingSpeakers(false);
            fetchingSpeakersRef.current = false;
        }
    }, [dispatch]); // Stable callback - only depends on dispatch

    const fetchCategories = React.useCallback(async () => {
        // Check refs to prevent race conditions
        if (fetchingCategoriesRef.current) return;
        if (categoriesLoadedRef.current) return;

        fetchingCategoriesRef.current = true;
        setIsLoadingCategories(true);
        try {
            const categories = await dispatch(getCategoriesForEvent());
            const categoriesList = Array.isArray(categories) ? categories : [];
            setCategoryList(categoriesList);
            categoriesLoadedRef.current = true;
        } catch (error) {
            console.error('Error fetching categories:', error);
            categoriesLoadedRef.current = true;
        } finally {
            setIsLoadingCategories(false);
            fetchingCategoriesRef.current = false;
        }
    }, [dispatch]); // Stable callback

    const fetchExhibitors = React.useCallback(async () => {
        // Check refs to prevent race conditions
        if (fetchingExhibitorsRef.current) return;
        if (exhibitorsLoadedRef.current) return;

        fetchingExhibitorsRef.current = true;
        setIsLoadingExhibitors(true);
        try {
            const response = await dispatch(exhibitorGet());
            const exhibitorsList = Array.isArray(response?.data) ? response.data : [];
            setExhibitorList(exhibitorsList);
            exhibitorsLoadedRef.current = true;
        } catch (error) {
            // Error handling without console
            exhibitorsLoadedRef.current = true;
        } finally {
            setIsLoadingExhibitors(false);
            fetchingExhibitorsRef.current = false;
        }
    }, [dispatch]); // Stable callback

    const fetchCountries = React.useCallback(async () => {
        // Check refs to prevent race conditions
        if (fetchingCountriesRef.current) return;
        if (countriesLoadedRef.current) return;

        fetchingCountriesRef.current = true;
        setIsLoadingCountries(true);
        try {
            const countries = await dispatch(getCountries());
            const countriesList = Array.isArray(countries) ? countries : [];
            setCountryList(countriesList);
            countriesLoadedRef.current = true;
        } catch (error) {
            console.error('Error fetching countries:', error);
            countriesLoadedRef.current = true;
        } finally {
            setIsLoadingCountries(false);
            fetchingCountriesRef.current = false;
        }
    }, [dispatch]); // Stable callback

    // Fetch countries on mount since it's a small static list and needed for the dropdown
    // Using ref to track mount fetch to prevent multiple calls
    useEffect(() => {
        if (!countriesFetchedOnMountRef.current) {
            countriesFetchedOnMountRef.current = true;
            fetchCountries();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Empty deps - only run on mount

    // Capture the page number from URL when entering edit mode
    useEffect(() => {
        if (id) {
            // Get page parameter from URL if it exists
            const urlParams = new URLSearchParams(location.search);
            const pageParam = urlParams.get('page');
            if (pageParam) {
                previousPageRef.current = parseInt(pageParam, 10);
            } else {
                // Also check if page is in location state (from navigation)
                if (location.state?.page) {
                    previousPageRef.current = location.state.page;
                }
            }
        }
    }, [id, location.search, location.state]);

    // Load edit data if id exists
    useEffect(() => {
        // Only run if id exists
        if (!id) {
            // Reset ref when id is cleared
            eventDataLoadedRef.current = false;
            currentEventIdRef.current = null;
            return;
        }

        // Reset ref when id changes
        if (currentEventIdRef.current !== id) {
            eventDataLoadedRef.current = false;
            currentEventIdRef.current = id;
        }

        // Only fetch if not already loaded for this id
        // Set ref synchronously BEFORE async call to prevent React Strict Mode double calls
        if (eventDataLoadedRef.current) return;
        eventDataLoadedRef.current = true;

        const loadEventData = async () => {
            try {
                const response = await dispatch(eventById(id));

                if (response?.data) {
                    const editData = response.data;

                    // Load dropdown data if there are selected values (for proper display)
                    // Note: Countries are already fetched on mount, so we don't need to fetch again
                    // Only fetch if data exists - the fetch functions have their own guards
                    if (editData.speakers || editData.speakersData) {
                        fetchSpeakers();
                    }
                    if (editData.categories || editData.categoriesData) {
                        fetchCategories();
                    }
                    if (editData.exhibitors) {
                        fetchExhibitors();
                    }
                    // Removed fetchCountries() here since it's already fetched on mount

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

                    // Handle background image
                    let backgroundImageData = null;
                    let backgroundImagePreviewUrl = null;
                    if (editData.backgroundImage) {
                        if (typeof editData.backgroundImage === 'string') {
                            backgroundImageData = editData.backgroundImage;
                            backgroundImagePreviewUrl = `${API_URL}/${editData.backgroundImage.replace(/\\/g, '/')}`;
                        }
                    }

                    // Handle event stamps - Updated to match new API response structure
                    // API returns: eventStamps: { description: "...", stamps: [{ id, name, image: "uploads/eventStamps/xxx.png" }] }
                    let eventStampIdsData = [];
                    let stampsData = [];
                    let eventStampDescription = '';

                    if (editData.eventStamps) {
                        if (Array.isArray(editData.eventStamps)) {
                            // Old structure: array of stamps
                            stampsData = editData.eventStamps;
                            eventStampIdsData = editData.eventStamps.map(stamp => stamp.id).filter(Boolean);
                        } else if (editData.eventStamps.stamps && Array.isArray(editData.eventStamps.stamps)) {
                            // New structure: object with description and stamps
                            stampsData = editData.eventStamps.stamps;
                            eventStampIdsData = editData.eventStamps.stamps.map(stamp => stamp.id).filter(Boolean);
                            eventStampDescription = editData.eventStamps.description || '';
                        }
                    }
                    
                    // Store existing stamps for display in edit mode
                    setExistingStamps(stampsData || []);

                    const formDataToSet = {
                        name: editData.name || '',
                        description: editData.description || '',
                        startDate: editData.startDate ? editData.startDate.split('T')[0] : '',
                        startTime: editData.startTime || '',
                        endDate: editData.endDate ? editData.endDate.split('T')[0] : '',
                        endTime: editData.endTime || '',
                        publishStartDate: editData.publishStartDate ? editData.publishStartDate.split('T')[0] : '',
                        publishEndDate: editData.publishEndDate ? editData.publishEndDate.split('T')[0] : '',
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
                        gstRate: editData.gstRate ?? 18,
                        speakerIds: speakerIds,
                        categoryIds: categoryIds,
                        floorPlan: floorPlanData,
                        backgroundImage: backgroundImageData,
                        exhibitorIds: exhibitorIds,
                        exhibitorDescription: exhibitorDescription,
                        stampRequiredForReward: editData.stampRequiredForReward ?? '',
                        eventStampDescription: editData.eventStampDescription || '',
                        eventStampIds: eventStampIdsData,
                        newStamps: [],
                        enableLuckyDrawFeature: editData.enableLuckyDrawFeature || false,
                        withdrawalEnabled: editData.withdrawalEnabled !== false,
                        earlyBirdPrice: editData.earlyBirdPrice ?? '',
                        earlyBirdStartDate: editData.earlyBirdStartDate ? editData.earlyBirdStartDate.split('T')[0] : '',
                        earlyBirdEndDate: editData.earlyBirdEndDate ? editData.earlyBirdEndDate.split('T')[0] : ''
                    };

                    // Store the original event date to detect if it changes during edit
                    originalEventDateRef.current = formDataToSet.startDate;

                    setFormData(formDataToSet);
                    setImagePreviewUrls(previewUrls);
                    setDocumentPreviewUrls(documentPreviewUrls);
                    setDocumentNames(documentNamesData);
                    setSelectedStampIds(eventStampIdsData);
                    setExistingStamps(stampsData || []);
                    setNewStamps([]);

                    setFloorPlanPreview(floorPlanPreviewUrl);
                    setBackgroundImagePreview(backgroundImagePreviewUrl);
                }
            } catch (error) {
                console.error('Error loading event data:', error);
                // Reset ref on error only if it's still the same id
                if (currentEventIdRef.current === id) {
                    eventDataLoadedRef.current = false;
                }
            }
        };
        
        loadEventData();
        
        // Cleanup function
        return () => {
            // Only reset if id changed (not on unmount)
            if (currentEventIdRef.current !== id) {
                eventDataLoadedRef.current = false;
            }
        };
    }, [id, dispatch]); // Only depend on id and dispatch - fetch functions have their own guards

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
            publishStartDate: '',
            publishEndDate: '',
            location: '',
            venue: '',
            country: '',
            images: [],
            documents: [],
            documentNames: [], // Add this
            type: 'Physical',
            price: '',
            gstRate: 18,
            speakerIds: [],
            categoryIds: [],
            latitude: '',
            longitude: '',
            floorPlan: null,
            backgroundImage: null,
            exhibitorIds: [],
            exhibitorDescription: '',
            stampRequiredForReward: '',
            eventStampDescription: '',
            eventStampIds: [],
            newStamps: [],
            enableLuckyDrawFeature: false,
            withdrawalEnabled: true,
            earlyBirdPrice: '',
            earlyBirdStartDate: '',
            earlyBirdEndDate: ''
        });
        setImagePreviewUrls([]);
        setDocumentPreviewUrls([]);
        setDocumentNames([]); // Add this
        setFloorPlanPreview(null);
        setNewStamps([]);
        setSelectedStampIds([]);
        setExistingStamps([]);
        setBackgroundImagePreview(null);
    };

    // Handlers for dropdown open events
    const handleSpeakerDropdownOpen = () => {
        setSpeakerDropdownOpen(true);
        fetchSpeakers();
    };

    const handleCategoryDropdownOpen = () => {
        setCategoryDropdownOpen(true);
        fetchCategories();
    };

    const handleExhibitorDropdownOpen = () => {
        setExhibitorDropdownOpen(true);
        fetchExhibitors();
    };

    // Removed handleCountryDropdownFocus - countries are now fetched on mount

    // Handle speaker and category selection
    const handleSpeakerSelect = (selectedOptions) => {
        const selectedIds = selectedOptions.map((option) => option.value);

        setFormData((prev) => ({
            ...prev,
            speakerIds: selectedIds
        }));
    };

    // Custom MultiValueRemove to show confirmation modal
    const CustomMultiValueRemove = (props) => {
        const { data, innerProps } = props;
        const speaker = speakerList.find(s => s.id === data.value);
        const speakerName = speaker ? `${speaker.firstName} ${speaker.lastName}` : data.label;
        
        return (
            <components.MultiValueRemove
                {...props}
                innerProps={{
                    ...innerProps,
                    onClick: (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setSpeakerToRemove({ id: data.value, name: speakerName });
                        setShowSpeakerDeleteModal(true);
                    }
                }}
            />
        );
    };

    // Handle confirm remove speaker
    const handleConfirmRemoveSpeaker = () => {
        if (speakerToRemove) {
            const newValue = selectedSpeakerOptions.filter(opt => opt.value !== speakerToRemove.id);
            handleSpeakerSelect(newValue);
        }
        setShowSpeakerDeleteModal(false);
        setSpeakerToRemove(null);
    };

    const handleCategorySelect = (selectedOptions) => {
        const selectedIds = selectedOptions.map((option) => option.value);
        setFormData((prev) => ({
            ...prev,
            categoryIds: selectedIds
        }));
    };

    // Handle form submission - Updated to handle event stamps correctly
    const handleSubmit = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        // Prevent double submission
        if (isSubmitting) {
            return;
        }
        
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
            eventStampIds: selectedStampIds,
            newStamps: newStamps.map(stamp => ({ 
                name: stamp.name, // Booth number
                exhibitorId: stamp.exhibitorId,
                image: stamp.image,
                isVisited: false // Default false
            })),
            documentNames: cleanedDocumentNames, // Use cleaned names
            startTime: formattedStartTime,
            endTime: formattedEndTime
        };

        if (dataToSend.speakersData) {
            delete dataToSend.speakersData;
        }

        // Clean up empty date strings - convert to null for optional dates
        const dateFields = ['publishStartDate', 'publishEndDate', 'earlyBirdStartDate', 'earlyBirdEndDate'];
        dateFields.forEach(field => {
            if (dataToSend[field] === '' || dataToSend[field] === null || dataToSend[field] === undefined) {
                dataToSend[field] = null;
            }
        });

        Object.keys(dataToSend).forEach((key) => {
            if (key === 'speakerIds') {
                const speakersArray = Array.isArray(dataToSend.speakerIds) ? dataToSend.speakerIds : [];
                formDataToSend.append('speakerIds', speakersArray.join(','));
            } else if (key === 'categoryIds') {
                const categoriesArray = Array.isArray(dataToSend.categoryIds) ? dataToSend.categoryIds : [];
                formDataToSend.append('categoryIds', categoriesArray.join(','));
            } else if (key === 'exhibitorIds') {
                const exhibitorsArray = Array.isArray(dataToSend.exhibitorIds) ? dataToSend.exhibitorIds : [];
                formDataToSend.append('exhibitorIds', exhibitorsArray.join(','));
            } else if (key === 'exhibitorDescription') {
                formDataToSend.append('exhibitorDescription', dataToSend[key]);
            } else if (key === 'stampRequiredForReward') {
                const val = dataToSend[key];
                if (val !== '' && val !== null && val !== undefined && !isNaN(Number(val))) {
                    formDataToSend.append('stampRequiredForReward', String(Math.max(1, parseInt(val, 10))));
                }
            } else if (key === 'eventStampDescription') {
                formDataToSend.append('eventStampDescription', dataToSend[key] || '');
            } else if (key === 'eventStampIds') {
                // Handle existing stamp IDs to associate
                if (dataToSend[key] && Array.isArray(dataToSend[key]) && dataToSend[key].length > 0) {
                    formDataToSend.append('eventStampIds', JSON.stringify(dataToSend[key]));
                }
            } else if (key === 'newStamps') {
                // Handle new stamps to create - send as JSON and images separately
                if (dataToSend[key] && Array.isArray(dataToSend[key]) && dataToSend[key].length > 0) {
                    // Send stamp data with name, exhibitorId, and isVisited
                    const stampData = dataToSend[key].map(stamp => ({ 
                        name: stamp.name, 
                        exhibitorId: stamp.exhibitorId || null,
                        isVisited: stamp.isVisited || false
                    }));
                    formDataToSend.append('newStamps', JSON.stringify(stampData));
                    
                    // Send stamp images as files
                    dataToSend[key].forEach((stamp, index) => {
                        if (stamp.image instanceof File) {
                            formDataToSend.append('eventStampImages', stamp.image);
                        }
                    });
                }
            } else if (key === 'enableLuckyDrawFeature') {
                // Handle lucky draw feature toggle
                formDataToSend.append('enableLuckyDrawFeature', dataToSend[key] ? 'true' : 'false');
            } else if (key === 'withdrawalEnabled') {
                formDataToSend.append('withdrawalEnabled', dataToSend[key] ? 'true' : 'false');
            } else if (key === 'floorPlan') {
                if (dataToSend[key] instanceof File) {
                    formDataToSend.append('floorPlan', dataToSend[key]);
                }
            } else if (key === 'backgroundImage') {
                if (dataToSend[key] instanceof File) {
                    formDataToSend.append('backgroundImage', dataToSend[key]);
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
            } else if (key !== 'speakersData') {
                // Skip empty/null/undefined values (except optional date fields - we send empty to clear)
                if (dataToSend[key] === null || dataToSend[key] === undefined) {
                    // For optional date fields, still send empty string so backend clears the value
                    if (dateFields.includes(key)) {
                        formDataToSend.append(key, '');
                    }
                    return;
                }
                // For optional date fields when empty string, send empty so backend clears publish dates
                if (dateFields.includes(key) && (dataToSend[key] === '' || !dataToSend[key])) {
                    formDataToSend.append(key, '');
                    return;
                }
                // Skip empty Early Bird price so backend doesn't receive invalid number
                if (key === 'earlyBirdPrice' && (dataToSend[key] === '' || dataToSend[key] === null || dataToSend[key] === undefined)) {
                    return;
                }
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

            // Handle existing stamp IDs for edit mode
            if (selectedStampIds && selectedStampIds.length > 0) {
                formDataToSend.append('eventStampIds', JSON.stringify(selectedStampIds));
            }

            // Handle existing background image for edit mode
            if (formData.backgroundImage && typeof formData.backgroundImage === 'string') {
                formDataToSend.append('originalBackgroundImage', formData.backgroundImage);
            }
        }

        const saveProgrammeData = async (newEventId, programmeData) => {
            if (!programmeData || !programmeData.tracks || programmeData.tracks.length === 0) {
                return;
            }

            try {
                // Create all tracks first
                for (const track of programmeData.tracks) {
                    const trackData = {
                        title: track.title,
                        description: track.description,
                        isActive: track.isActive
                    };
                    const trackResult = await dispatch(createTrack(newEventId, trackData));
                    
                    if (trackResult?.success && trackResult.data) {
                        const trackId = trackResult.data.id;
                        const sessions = programmeData.sessions[track.id] || [];
                        
                        // Create all sessions for this track
                        for (const session of sessions) {
                            const sessionData = {
                                trackId: trackId,
                                title: session.title,
                                description: session.description,
                                sessionDate: session.sessionDate,
                                startTime: session.startTime,
                                endTime: session.endTime,
                                venue: session.venue,
                                isActive: session.isActive,
                                speakerIds: session.speakers ? session.speakers.map(s => s.id || s).filter(Boolean) : []
                            };
                            await dispatch(createSession(sessionData, newEventId));
                        }
                    }
                }
                // toast.success('Programme data saved successfully');
            } catch (error) {
                console.error('Error saving programme data:', error);
                // toast.error('Failed to save some programme data');
            }
        };

        try {
            const result = id ? await dispatch(editEvent(id, formDataToSend)) : await dispatch(createEvent(formDataToSend));
            if (result && result.success) {
                const newEventId = result.data?.id || result.id || id;
                
                // If creating new event and we have programme data, save it
                if (!id && programmeDataRef.current) {
                    if (newEventId) {
                        await saveProgrammeData(newEventId, programmeDataRef.current);
                    }
                }
                
                // Redux store is already updated by the action, no need to fetch again
                if (id) {
                    // For edit mode, check if the event date was changed
                    const originalDate = originalEventDateRef.current;
                    const newDate = formData.startDate;
                    
                    // Parse dates for comparison
                    const parseDate = (dateValue) => {
                        if (!dateValue) return new Date(0);
                        const dateStr = String(dateValue);
                        const parts = dateStr.split('T')[0].split('-');
                        if (parts.length === 3) {
                            return new Date(Date.UTC(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10)));
                        }
                        return new Date(dateStr);
                    };
                    
                    const originalDateObj = parseDate(originalDate);
                    const newDateObj = parseDate(newDate);
                    
                    // If date changed, refresh events list and calculate which page the updated event will appear on
                    if (originalDate !== newDate) {
                        // Refresh events list to get updated and sorted data from backend
                        await dispatch(eventList());
                        
                        // Get updated events directly from Redux store (bypassing useSelector delay)
                        const state = store.getState();
                        const updatedEvents = state.event?.event?.events || [];
                        
                        const pageLength = 5;
                        
                        // Count how many events have a startDate >= updated event's date (newer or equal)
                        // Since events are sorted descending (newest first), these events will appear before the updated event
                        let eventsBeforeUpdatedEvent = 0;
                        if (Array.isArray(updatedEvents)) {
                            // Filter out the current event being edited from the count
                            eventsBeforeUpdatedEvent = updatedEvents.filter((event) => {
                                // Exclude the current event being edited
                                if (event.id === id) return false;
                                if (!event.startDate) return false;
                                const eventDate = parseDate(event.startDate);
                                // Count events that are newer than or equal to the updated event's date
                                return eventDate.getTime() >= newDateObj.getTime();
                            }).length;
                        }
                        
                        // Calculate page number (1-indexed for URL)
                        const pageNumber = Math.floor(eventsBeforeUpdatedEvent / pageLength) + 1;
                        
                        // Navigate to the page where the updated event appears
                        // Example: If Nov 18 is updated to Dec 2, and there are 0 events with dates >= Dec 2,
                        // the updated event will be at index 0, which is page 1
                        // Navigate to the correct list based on event type
                        navigate(`${listPath}?page=${pageNumber}`);
                    } else {
                        // Date didn't change, preserve the page number if we were editing from a specific page
                        if (previousPageRef.current) {
                            navigate(`${listPath}?page=${previousPageRef.current}`);
                        } else {
                            navigate(listPath);
                        }
                    }
                } else {
                    // For create mode, calculate which page the new event will appear on
                    // Events are sorted by startDate descending (newest first)
                    // Page length is 5 events per page
                    const pageLength = 5;
                    
                    // Parse the new event's date
                    const parseDate = (dateValue) => {
                        if (!dateValue) return new Date(0);
                        const dateStr = String(dateValue);
                        const parts = dateStr.split('T')[0].split('-');
                        if (parts.length === 3) {
                            return new Date(Date.UTC(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10)));
                        }
                        return new Date(dateStr);
                    };
                    
                    const newEventDate = parseDate(formData.startDate);
                    
                    // Count how many existing events have a startDate >= new event's date (newer or equal)
                    // Since events are sorted descending (newest first), these events will appear before the new event
                    // The new event will be inserted at this position
                    let eventsBeforeNewEvent = 0;
                    if (Array.isArray(events)) {
                        eventsBeforeNewEvent = events.filter((event) => {
                            if (!event.startDate) return false;
                            const eventDate = parseDate(event.startDate);
                            // Count events that are newer than or equal to the new event's date
                            // These will appear before the new event in the sorted list
                            return eventDate.getTime() >= newEventDate.getTime();
                        }).length;
                    }
                    
                    // The new event will be inserted at position eventsBeforeNewEvent (0-indexed)
                    // After insertion, the new event will be at index eventsBeforeNewEvent
                    // Calculate page number (1-indexed for URL)
                    // Page = Math.floor(index / pageLength) + 1
                    const pageNumber = Math.floor(eventsBeforeNewEvent / pageLength) + 1;
                    
                    // Navigate to the page where the new event appears
                    // Example: If Nov 30 is created and there are 10 events with dates >= Nov 30,
                    // the new event will be at index 10, which is page 3 (10 / 5 = 2, +1 = page 3)
                    // Navigate to the correct list based on event type
                    navigate(`${listPath}?page=${pageNumber}`);
                }
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
            const createdSpeaker = await dispatch(createSpeaker(formDataToSend));
            if (createdSpeaker) {
                // Add the new speaker to local state directly (no need to fetch all speakers)
                setSpeakerList((prev) => [createdSpeaker, ...prev]);
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
            const result = await dispatch(createCategory(newCategory));
            if (result && result.success) {
                // Add the new category to local state directly (no need to fetch all categories)
                if (result.category) {
                    setCategoryList((prev) => [result.category, ...prev]);
                }
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

    const handleRemoveBackgroundImage = async () => {
        const response = await dispatch(removeEventBackgroundImage(id));
        if (response.success) {
            setFormData((prev) => ({
                ...prev,
                backgroundImage: null
            }));
            setBackgroundImagePreview(null);
        }
    };

    // Handle background image change
    const handleBackgroundImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                alert('Please select an image file');
                return;
            }
            // Validate file size (10MB)
            if (file.size > 10 * 1024 * 1024) {
                alert('Image size should be less than 10MB');
                return;
            }
            setFormData((prev) => ({
                ...prev,
                backgroundImage: file
            }));
            setBackgroundImagePreview(URL.createObjectURL(file));
        }
    };

    // Exhibitor handling
    const handleExhibitorSelect = (selectedOptions) => {
        const selectedIds = selectedOptions ? selectedOptions.map((option) => option.value) : [];
        setFormData((prev) => ({
            ...prev,
            exhibitorIds: selectedIds
        }));
    };

    // Add new event stamp handling functions
    const handleExhibitorDescriptionChange = (e) => {
        const { value } = e.target;
        setFormData((prev) => ({
            ...prev,
            exhibitorDescription: value
        }));
    };

    // Add new stamp
    const handleAddNewStamp = () => {
        setNewStamps((prev) => [...prev, { name: '', exhibitorId: '', image: null, preview: null }]);
    };

    // Update stamp booth number (and exhibitorId)
    const handleStampBoothChange = (index, exhibitorId, boothNumber) => {
        setNewStamps((prev) => {
            const updated = [...prev];
            updated[index] = { ...updated[index], name: boothNumber, exhibitorId: exhibitorId };
            return updated;
        });
    };

    // Update stamp image
    const handleStampImageChange = (index, file) => {
        if (file) {
            const preview = URL.createObjectURL(file);
            setNewStamps((prev) => {
                const updated = [...prev];
                updated[index] = { ...updated[index], image: file, preview };
                return updated;
            });
        }
    };

    // Remove new stamp
    const handleRemoveNewStamp = (index) => {
        setNewStamps((prev) => {
            const updated = prev.filter((_, i) => i !== index);
            // Revoke object URL to prevent memory leak
            if (prev[index].preview) {
                URL.revokeObjectURL(prev[index].preview);
            }
            return updated;
        });
    };

    // Remove existing stamp (for edit mode) - Show delete modal
    const handleRemoveExistingStamp = (stampId) => {
        const stamp = existingStamps.find(s => s.id === stampId);
        setStampToDelete({ id: stampId, name: stamp?.name || 'this stamp' });
        setShowStampDeleteModal(true);
    };

    // Confirm stamp deletion
    const handleConfirmDeleteStamp = async () => {
        if (!stampToDelete || isDeletingStamp) return;

        setIsDeletingStamp(true);
        try {
            // Delete from backend
            const deleted = await dispatch(deleteEventStamp(stampToDelete.id));
            
            if (deleted) {
                // Remove from local state only after successful deletion
                setSelectedStampIds((prev) => prev.filter(id => id !== stampToDelete.id));
                setExistingStamps((prev) => prev.filter(stamp => stamp.id !== stampToDelete.id));
                setShowStampDeleteModal(false);
                setStampToDelete(null);
            }
        } catch (error) {
            console.error('Error deleting stamp:', error);
            toast.error('Failed to delete stamp. Please try again.');
        } finally {
            setIsDeletingStamp(false);
        }
    };

    // Cancel stamp deletion
    const handleCancelDeleteStamp = () => {
        if (!isDeletingStamp) {
            setShowStampDeleteModal(false);
            setStampToDelete(null);
        }
    };

    // Detect if this is for upcoming events by checking pathname
    // AddEventPage is used for both regular events and upcoming events
    const pathname = window.location.pathname || location.pathname;
    const isUpcomingEvent = pathname && (
        pathname.includes('/upcoming/edit-upcoming-event') ||
        pathname.includes('/upcoming/add-upcoming-event') ||
        pathname.startsWith('/upcoming/')
    );
    
    // Determine which paths to use based on event type
    const listPath = isUpcomingEvent ? EVENT_PATHS.UPCOMING_EVENTS : EVENT_PATHS.LIST_EVENTS;
    const viewPath = isUpcomingEvent ? EVENT_PATHS.VIEW_UPCOMING_EVENT : EVENT_PATHS.VIEW_EVENT;
    const editPath = isUpcomingEvent ? EVENT_PATHS.EDIT_UPCOMING_EVENT : EVENT_PATHS.EDIT_EVENT;
    const addPath = isUpcomingEvent ? EVENT_PATHS.ADD_UPCOMING_EVENT : EVENT_PATHS.ADD_EVENT;

    // Use reusable table navigation hook for back navigation with page preservation
    const { handleBack } = useTableNavigation({
        tableRef: null, // Not needed for back navigation
        listPath: listPath,
        viewPath: viewPath,
        editPath: editPath,
        addPath: addPath
    });

    const handleNavigate = () => {
        // Use the reusable handleBack function which preserves page from URL or location state
        const urlParams = new URLSearchParams(location.search || window.location.search);
        const currentPage = urlParams.get('page') || location.state?.page || previousPageRef.current;
        handleBack(currentPage);
    };

    // Document name change handler - updated version
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
                                                Name <span style={{ color: 'red' }}>*</span>
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
                                            <label className="floating-label" htmlFor="type">
                                                Type
                                            </label>
                                            <select className="form-control" name="type" value={formData.type} onChange={handleChange}>
                                                <option value="Physical">Physical</option>
                                                <option value="Virtual">Virtual</option>
                                            </select>
                                        </div>
                                    </Col>
                                    <Col sm={12}>
                                        <div style={{ marginBottom: '1rem' }}>
                                            <Row>
                                                <Col sm={6}>
                                                    <div className="form-group fill" style={{ position: 'relative' }}>
                                                        <label
                                                            className="floating-label"
                                                            htmlFor="price"
                                                            style={{
                                                                zIndex: 10,
                                                                position: 'absolute',
                                                                backgroundColor: 'white',
                                                                paddingRight: '4px',
                                                                paddingLeft: '2px'
                                                            }}
                                                        >
                                                            Price <span style={{ color: 'red' }}>*</span>
                                                        </label>
                                                        <div className="input-group" style={{ position: 'relative', zIndex: 1, marginTop: '8px' }}>
                                                            <input
                                                                type="number"
                                                                className="form-control"
                                                                name="price"
                                                                value={formData.price}
                                                                onChange={handleChange}
                                                                placeholder="0.00"
                                                                step="0.01"
                                                                min="0"
                                                            />
                                                            <span
                                                                className="input-group-text border-start-0"
                                                                style={{
                                                                    fontSize: '12px',
                                                                    color: 'white',
                                                                    fontWeight: '600',
                                                                    backgroundColor: '#0066cc',
                                                                    minWidth: '60px',
                                                                    justifyContent: 'center',
                                                                    padding: '0.5rem 0.75rem'
                                                                }}
                                                            >
                                                                SGD
                                                            </span>
                                                        </div>
                                                    </div>
                                                </Col>
                                                <Col sm={6}>
                                                    <div className="form-group fill">
                                                        <label className="floating-label" htmlFor="gstRate">
                                                            GST/Tax (%)
                                                        </label>
                                                        <input
                                                            type="number"
                                                            className="form-control"
                                                            name="gstRate"
                                                            value={formData.gstRate}
                                                            onChange={handleChange}
                                                            placeholder="18"
                                                            step="0.01"
                                                            min="0"
                                                            max="100"
                                                            title="GST/Tax percentage added on top of event price (shown on checkout)"
                                                        />
                                                        <small className="text-muted">% on top of price. Shown on checkout page only.</small>
                                                    </div>
                                                </Col>
                                            </Row>
                                            {formData.price && parseFloat(formData.price) > 0 && (
                                                <div className="mt-2 p-3" style={{ backgroundColor: '#f8f9fa', borderRadius: '6px', border: '1px solid #e9ecef', clear: 'both' }}>
                                                    <small className="d-block text-muted mb-2" style={{ fontWeight: '600' }}>Price Breakdown</small>
                                                    <div className="d-flex flex-column gap-1" style={{ fontSize: '13px' }}>
                                                        <span>Price: <strong>{parseFloat(formData.price).toFixed(2)} SGD</strong></span>
                                                        <span>GST: <strong>{(formData.gstRate || 18)}%</strong></span>
                                                        <span>GST Amount: <strong>{(parseFloat(formData.price) * ((formData.gstRate || 18) / 100)).toFixed(2)} SGD</strong></span>
                                                        <span style={{ color: '#28a745', fontWeight: '600', borderTop: '1px solid #dee2e6', paddingTop: '6px', marginTop: '4px' }}>Total: <strong>{(parseFloat(formData.price) * (1 + (formData.gstRate || 18) / 100)).toFixed(2)} SGD</strong></span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </Col>

                                    <Col sm={12}>
                                        <div className="mb-3 p-3" style={{ backgroundColor: '#f0f8ff', borderRadius: '8px', border: '1px solid #b8daff' }}>
                                            <h6 className="mb-3" style={{ color: '#004085', fontWeight: '600' }}>
                                                <i className="feather icon-zap mr-1" style={{ verticalAlign: 'middle' }}></i>
                                                Early Bird
                                            </h6>
                                            <Row>
                                                <Col sm={4}>
                                                    <div className="form-group fill">
                                                        <label className="floating-label" htmlFor="earlyBirdPrice">Early Bird Price (SGD)</label>
                                                        <input
                                                            type="number"
                                                            className="form-control"
                                                            name="earlyBirdPrice"
                                                            value={formData.earlyBirdPrice}
                                                            onChange={handleChange}
                                                            placeholder="0.00"
                                                            step="0.01"
                                                            min="0"
                                                            title="Discounted price for early registration"
                                                        />
                                                    </div>
                                                </Col>
                                                <Col sm={4}>
                                                    <div className="form-group fill">
                                                        <label className="floating-label" htmlFor="earlyBirdStartDate">Start Date</label>
                                                        <input
                                                            type="date"
                                                            className="form-control"
                                                            name="earlyBirdStartDate"
                                                            value={formData.earlyBirdStartDate}
                                                            onChange={handleChange}
                                                            title="Date when Early Bird price becomes available"
                                                        />
                                                    </div>
                                                </Col>
                                                <Col sm={4}>
                                                    <div className="form-group fill">
                                                        <label className="floating-label" htmlFor="earlyBirdEndDate">End Date (Expiry)</label>
                                                        <input
                                                            type="date"
                                                            className="form-control"
                                                            name="earlyBirdEndDate"
                                                            value={formData.earlyBirdEndDate}
                                                            onChange={handleChange}
                                                            title="Date when Early Bird price expires"
                                                        />
                                                    </div>
                                                </Col>
                                            </Row>
                                            {(formData.earlyBirdPrice || formData.earlyBirdStartDate || formData.earlyBirdEndDate) && (
                                                <div className="mt-2 small text-muted">
                                                    Early Bird: {formData.earlyBirdPrice && parseFloat(formData.earlyBirdPrice) >= 0 ? `${parseFloat(formData.earlyBirdPrice).toFixed(2)} SGD` : '—'} 
                                                    {formData.earlyBirdStartDate || formData.earlyBirdEndDate ? ` • ${formData.earlyBirdStartDate || '—'} to ${formData.earlyBirdEndDate || '—'}` : ''}
                                                </div>
                                            )}
                                        </div>
                                    </Col>

                                    <Col sm={6}>
                                        <div className="form-group fill">
                                            <label className="floating-label" htmlFor="startDate">
                                                Start Date <span style={{ color: 'red' }}>*</span>
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
                                                Start Time <span style={{ color: 'red' }}>*</span>
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
                                                End Date <span style={{ color: 'red' }}>*</span>
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
                                                End Time <span style={{ color: 'red' }}>*</span>
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
                                            <label className="floating-label" htmlFor="publishStartDate">
                                                Publish Start Date
                                            </label>
                                            <input
                                                type="date"
                                                className="form-control"
                                                name="publishStartDate"
                                                value={formData.publishStartDate}
                                                onChange={handleChange}
                                                title="Date when event becomes visible on the app"
                                            />
                                        </div>
                                    </Col>
                                    <Col sm={6}>
                                        <div className="form-group fill">
                                            <label className="floating-label" htmlFor="publishEndDate">
                                                Publish End Date
                                            </label>
                                            <input
                                                type="date"
                                                className="form-control"
                                                name="publishEndDate"
                                                value={formData.publishEndDate}
                                                onChange={handleChange}
                                                title="Date when event stops being visible on the app"
                                            />
                                        </div>
                                    </Col>

                                    <Col sm={12}>
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
                                                disabled={isLoadingCountries}
                                            >
                                                <option value="" disabled>
                                                    {isLoadingCountries ? 'Loading countries...' : 'Select Country'}
                                                </option>
                                                {countryList.map((country) => (
                                                    <option key={country.code} value={country.name}>
                                                        {country.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </Col>

                                    <Col sm={3}>
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
                                    <Col sm={3}>
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

                                    <Col sm={3}>
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

                                    <Col sm={3}>
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

                               

                                    
                                   

                                    <Col sm={12}>
                                        <div className="form-group" style={{ marginTop: '10px' }}>
                                            <label htmlFor="description" style={{ 
                                                display: 'block', 
                                                marginBottom: '10px', 
                                                fontSize: '0.875rem',
                                                fontWeight: '500',
                                                color: '#4680ff'
                                            }}>
                                                Event Description (Optional)
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
                                                placeholder="Enter event description..."
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
                                                    placeholder={
                                                        isLoadingSpeakers
                                                            ? 'Loading speakers...'
                                                            : id
                                                            ? 'Update speakers...'
                                                            : 'Choose speakers...'
                                                    }
                                                    isLoading={isLoadingSpeakers}
                                                    onMenuOpen={handleSpeakerDropdownOpen}
                                                    onMenuClose={() => setSpeakerDropdownOpen(false)}
                                                    components={{
                                                        MultiValueRemove: CustomMultiValueRemove
                                                    }}
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
                                                    Add
                                                </Button>
                                            )}
                                        </div>

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
                                                    placeholder={
                                                        isLoadingCategories
                                                            ? 'Loading categories...'
                                                            : id
                                                            ? 'Update categories...'
                                                            : 'Choose categories...'
                                                    }
                                                    isLoading={isLoadingCategories}
                                                    onMenuOpen={handleCategoryDropdownOpen}
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
                                                    Add
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
                                                    placeholder={isLoadingExhibitors ? 'Loading exhibitors...' : 'Choose exhibitors...'}
                                                    isLoading={isLoadingExhibitors}
                                                    onMenuOpen={handleExhibitorDropdownOpen}
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
                                        <div className="form-group" style={{ marginTop: '10px' }}>
                                            <label htmlFor="exhibitorDescription" style={{ 
                                                display: 'block', 
                                                marginBottom: '10px', 
                                                fontSize: '0.875rem',
                                                fontWeight: '500',
                                                color: '#4680ff'
                                            }}>
                                                Exhibitor Description (Optional)
                                            </label>
                                            <hr style={{ margin: '10px 0 15px 0', borderTop: '1px solid #dee2e6' }} />
                                            <SettingsEditor
                                                data={formData.exhibitorDescription || ''}
                                                onChange={(event, editor) => {
                                                    setFormData((prev) => ({
                                                        ...prev,
                                                        exhibitorDescription: editor.getData()
                                                    }));
                                                }}
                                                placeholder="Enter exhibitor description..."
                                            />
                                        </div>
                                    </Col>

                                    <Col sm={12}>
                                        <div className="form-group" style={{ marginTop: '10px' }}>
                                            <label htmlFor="stampRequiredForReward" style={{ 
                                                display: 'block', 
                                                marginBottom: '10px', 
                                                fontSize: '0.875rem',
                                                fontWeight: '500',
                                                color: '#4680ff'
                                            }}>
                                                Stamps Required for Reward (Optional)
                                            </label>
                                            <p style={{ fontSize: '0.8rem', color: '#6c757d', marginBottom: '10px' }}>
                                                Number of stamps needed to get the reward. Progress shown in app as e.g. 1/8, 2/8, ... 8/8.
                                            </p>
                                            <Form.Control
                                                type="number"
                                                id="stampRequiredForReward"
                                                min="1"
                                                placeholder="e.g. 8"
                                                value={formData.stampRequiredForReward ?? ''}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    setFormData((prev) => ({
                                                        ...prev,
                                                        stampRequiredForReward: val === '' ? '' : (parseInt(val, 10) || '')
                                                    }));
                                                }}
                                                style={{ maxWidth: '200px' }}
                                            />
                                        </div>
                                    </Col>

                                    {/* Event Stamp section - only shown in EDIT mode (stamps auto-created from exhibitors at create time) */}
                                    {id && (
                                    <Col sm={12}>
                                        <div className="form-group" style={{ marginTop: '10px' }}>
                                            {/* Event Stamp Description */}
                                            <div className="form-group" style={{ marginBottom: '20px' }}>
                                                <label htmlFor="eventStampDescription" style={{ 
                                                    display: 'block', 
                                                    marginBottom: '10px', 
                                                    fontSize: '0.875rem',
                                                    fontWeight: '500',
                                                    color: '#4680ff'
                                                }}>
                                                    Event Stamp Description (Optional)
                                                </label>
                                                <SettingsEditor
                                                    data={formData.eventStampDescription || ''}
                                                    onChange={(event, editor) => {
                                                        setFormData((prev) => ({
                                                            ...prev,
                                                            eventStampDescription: editor.getData()
                                                        }));
                                                    }}
                                                    placeholder="Enter event stamp description..."
                                                />
                                            </div>

                                              <label style={{ 
                                                display: 'block', 
                                                marginBottom: '10px', 
                                                fontSize: '0.875rem',
                                                fontWeight: '500',
                                                color: '#4680ff'
                                            }}>
                                                Event Stamps (Optional)
                                            </label>
                                            <hr style={{ margin: '10px 0 15px 0', borderTop: '1px solid #dee2e6' }} />
                                            
                                            {/* Add New Stamp Button */}
                                            <Button
                                                variant="outline-primary"
                                                onClick={handleAddNewStamp}
                                                style={{ marginBottom: '15px' }}
                                            >
                                                <i style={{marginRight: '10px'}} className="fas fa-plus me-2"></i>
                                                Add New Stamp
                                            </Button>

                                            {/* New Stamps List */}
                                            {newStamps.length > 0 && (
                                                <div style={{ marginTop: '15px' }}>
                                                    <h6 style={{ marginBottom: '15px', fontSize: '14px', fontWeight: '600' }}>
                                                        New Stamps to Create ({newStamps.length})
                                                    </h6>
                                                    {newStamps.map((stamp, index) => (
                                                        <div
                                                            key={index}
                                                            style={{
                                                                border: '1px solid #dee2e6',
                                                                borderRadius: '8px',
                                                                padding: '15px',
                                                                marginBottom: '15px',
                                                                backgroundColor: '#f8f9fa'
                                                            }}
                                                        >
                                                            <Row>
                                                                <Col sm={12} md={4}>
                                                                    <div className="form-group">
                                                                        <label style={{ fontSize: '12px', fontWeight: '500', marginBottom: '5px' }}>
                                                                            Booth Number * (Searchable)
                                                                        </label>
                                                                        <Select
                                                                            key={`stamp-booth-${index}-${formData.exhibitorIds?.join(',') || 'none'}`}
                                                                            isSearchable
                                                                            isClearable
                                                                            placeholder="Search and select booth number..."
                                                                            options={(() => {
                                                                                // Get selected exhibitor IDs from formData
                                                                                const selectedExhibitorIds = formData.exhibitorIds || [];
                                                                                
                                                                                // Get exhibitor IDs that already have stamps (from existingStamps and newStamps)
                                                                                const exhibitorsWithStamps = new Set();
                                                                                
                                                                                // Add exhibitor IDs from existing stamps
                                                                                existingStamps.forEach(stamp => {
                                                                                    if (stamp.exhibitorId) {
                                                                                        exhibitorsWithStamps.add(String(stamp.exhibitorId));
                                                                                    }
                                                                                });
                                                                                
                                                                                // Add exhibitor IDs from other new stamps (excluding current index)
                                                                                newStamps.forEach((stamp, idx) => {
                                                                                    if (idx !== index && stamp.exhibitorId) {
                                                                                        exhibitorsWithStamps.add(String(stamp.exhibitorId));
                                                                                    }
                                                                                });
                                                                                
                                                                                // Filter to show only selected exhibitors (if any selected)
                                                                                // If no exhibitors selected, show all exhibitors with booth numbers
                                                                                // Exclude exhibitors that already have stamps
                                                                                let exhibitorsToShow = [];
                                                                                
                                                                                if (selectedExhibitorIds.length > 0) {
                                                                                    // Convert all IDs to strings for comparison (handle both string and number IDs)
                                                                                    const selectedIdsAsStrings = selectedExhibitorIds.map(id => String(id));
                                                                                    
                                                                                    exhibitorsToShow = exhibitorList.filter(ex => {
                                                                                        if (!ex || !ex.id) return false;
                                                                                        
                                                                                        const exId = String(ex.id);
                                                                                        const hasBoothNumber = ex.boothNumber && String(ex.boothNumber).trim() !== '';
                                                                                        const isSelected = selectedIdsAsStrings.includes(exId);
                                                                                        const alreadyHasStamp = exhibitorsWithStamps.has(exId);
                                                                                        
                                                                                        return isSelected && hasBoothNumber && !alreadyHasStamp;
                                                                                    });
                                                                                } else {
                                                                                    // Show all exhibitors with booth numbers if none selected
                                                                                    exhibitorsToShow = exhibitorList.filter(ex => {
                                                                                        if (!ex || !ex.id) return false;
                                                                                        const exId = String(ex.id);
                                                                                        const hasBoothNumber = ex.boothNumber && String(ex.boothNumber).trim() !== '';
                                                                                        const alreadyHasStamp = exhibitorsWithStamps.has(exId);
                                                                                        return hasBoothNumber && !alreadyHasStamp;
                                                                                    });
                                                                                }
                                                                                
                                                                                const options = exhibitorsToShow.map((exhibitor) => ({
                                                                                    value: exhibitor.id,
                                                                                    label: `${exhibitor.boothNumber} - ${exhibitor.companyName}`,
                                                                                    boothNumber: exhibitor.boothNumber,
                                                                                    companyName: exhibitor.companyName
                                                                                }));
                                                                                
                                                                                return options;
                                                                            })()}
                                                                            value={stamp.exhibitorId ? {
                                                                                value: stamp.exhibitorId,
                                                                                label: `${stamp.name} - ${exhibitorList.find(ex => ex.id === stamp.exhibitorId)?.companyName || ''}`
                                                                            } : null}
                                                                            onChange={(selectedOption) => {
                                                                                if (selectedOption) {
                                                                                    handleStampBoothChange(
                                                                                        index, 
                                                                                        selectedOption.value, 
                                                                                        selectedOption.boothNumber || selectedOption.companyName
                                                                                    );
                                                                                } else {
                                                                                    // Clear selection
                                                                                    setNewStamps((prev) => {
                                                                                        const updated = [...prev];
                                                                                        updated[index] = { ...updated[index], name: '', exhibitorId: '' };
                                                                                        return updated;
                                                                                    });
                                                                                }
                                                                            }}
                                                                            styles={{
                                                                                control: (provided) => ({
                                                                                    ...provided,
                                                                                    minHeight: '38px',
                                                                                    fontSize: '14px'
                                                                                }),
                                                                                menu: (provided) => ({
                                                                                    ...provided,
                                                                                    zIndex: 9999
                                                                                })
                                                                            }}
                                                                        />
                                                                    </div>
                                                                </Col>
                                                                <Col sm={12} md={6}>
                                                                    <div className="form-group">
                                                                        <label style={{ fontSize: '12px', fontWeight: '500', marginBottom: '5px' }}>
                                                                            Stamp Image
                                                                        </label>
                                                                        <input
                                                                            type="file"
                                                                            className="form-control"
                                                                            accept="image/*"
                                                                            onChange={(e) => {
                                                                                if (e.target.files && e.target.files[0]) {
                                                                                    handleStampImageChange(index, e.target.files[0]);
                                                                                }
                                                                            }}
                                                                        />
                                                                    </div>
                                                                </Col>
                                                                <Col sm={12} md={2}>
                                                                    <div className="form-group">
                                                                        <label style={{ fontSize: '12px', fontWeight: '500', marginBottom: '5px' }}>
                                                                            &nbsp;
                                                                        </label>
                                                                        <Button
                                                                            variant="danger"
                                                                            size="sm"
                                                                            onClick={() => handleRemoveNewStamp(index)}
                                                                            style={{ width: '100%' }}
                                                                        >
                                                                            <i className="fas fa-trash"></i> Remove
                                                                        </Button>
                                                                    </div>
                                                                </Col>
                                                            </Row>
                                                            {stamp.preview && (
                                                                <div style={{ marginTop: '10px' }}>
                                                                    <img
                                                                        src={stamp.preview}
                                                                        alt="Preview"
                                                                        style={{
                                                                            maxWidth: '150px',
                                                                            maxHeight: '150px',
                                                                            borderRadius: '4px',
                                                                            border: '1px solid #dee2e6'
                                                                        }}
                                                                    />
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Display Existing Stamps (Edit Mode) */}
                                            {id && existingStamps.length > 0 && (
                                                <div style={{ marginTop: '20px' }}>
                                                    <h6 style={{ marginBottom: '15px', fontSize: '14px', fontWeight: '600' }}>
                                                        Existing Stamps ({existingStamps.length})
                                                    </h6>
                                                    <div
                                                        style={{
                                                            display: 'grid',
                                                            gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                                                            gap: '15px',
                                                            marginTop: '10px'
                                                        }}
                                                    >
                                                        {existingStamps.map((stamp) => {
                                                            console.log('🖼️ AddEventPage - Rendering existing stamp:', {
                                                                stampId: stamp.id,
                                                                stampName: stamp.name,
                                                                stampImage: stamp.image,
                                                                fullStamp: stamp
                                                            });
                                                            
                                                            let imageSrc = null;
                                                            if (stamp.image) {
                                                                if (stamp.image.startsWith('http')) {
                                                                    imageSrc = stamp.image;
                                                                    console.log('✅ AddEventPage - Using full URL:', imageSrc);
                                                                } else {
                                                                    // Normalize path: remove leading/trailing slashes and backslashes
                                                                    let normalizedPath = stamp.image.replace(/\\/g, '/').replace(/^\/+|\/+$/g, '');
                                                                    
                                                                    // Backend stores paths as "uploads/eventStamps/xxx.png"
                                                                    // Backend serves static files from "uploads" folder with prefix "/uploads/"
                                                                    // So "uploads/eventStamps/xxx.png" should be accessed as "/uploads/eventStamps/xxx.png"
                                                                    // We don't need to remove the "uploads/" prefix, just use it as is
                                                                    
                                                                    // Ensure API_URL doesn't have trailing slash
                                                                    const baseUrl = API_URL.replace(/\/+$/, '');
                                                                    imageSrc = `${baseUrl}/${normalizedPath}`;
                                                                    console.log('🔧 AddEventPage - Generated URL:', {
                                                                        original: stamp.image,
                                                                        normalized: normalizedPath,
                                                                        baseUrl: baseUrl,
                                                                        finalUrl: imageSrc,
                                                                        expectedPath: `Should be accessible at: ${imageSrc}`
                                                                    });
                                                                }
                                                            } else {
                                                                console.log('⚠️ AddEventPage - No image for stamp:', stamp.id);
                                                            }
                                                            
                                                            // Get booth number from stamp (name field contains booth number)
                                                            const boothNumber = stamp.boothNumber || stamp.name || 'N/A';
                                                            
                                                            return (
                                                                <div
                                                                    key={stamp.id}
                                                                    style={{
                                                                        position: 'relative',
                                                                        border: '1px solid #dee2e6',
                                                                        borderRadius: '8px',
                                                                        overflow: 'hidden',
                                                                        backgroundColor: '#f8f9fa'
                                                                    }}
                                                                >
                                                                    {imageSrc ? (
                                                                        <>
                                                                            <img
                                                                                src={imageSrc}
                                                                                alt={boothNumber || 'Stamp'}
                                                                                style={{
                                                                                    width: '100%',
                                                                                    height: '120px',
                                                                                    objectFit: 'cover'
                                                                                }}
                                                                                onLoad={() => {
                                                                                    console.log('✅ Image loaded successfully:', imageSrc);
                                                                                }}
                                                                                onError={(e) => {
                                                                                console.error('❌ Image failed to load:', {
                                                                                    imageSrc,
                                                                                    stampId: stamp.id,
                                                                                    stampName: stamp.name,
                                                                                    error: e
                                                                                });
                                                                                e.target.style.display = 'none';
                                                                            }}
                                                                            />
                                                                            <div style={{
                                                                                position: 'absolute',
                                                                                bottom: 0,
                                                                                left: 0,
                                                                                right: 0,
                                                                                padding: '8px',
                                                                                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                                                                                color: 'white',
                                                                                textAlign: 'center'
                                                                            }}>
                                                                                <div style={{ fontSize: '12px', fontWeight: '600' }}>
                                                                                    Booth: {boothNumber}
                                                                                </div>
                                                                            </div>
                                                                        </>
                                                                    ) : (
                                                                        <div style={{
                                                                            width: '100%',
                                                                            height: '120px',
                                                                            display: 'flex',
                                                                            flexDirection: 'column',
                                                                            alignItems: 'center',
                                                                            justifyContent: 'center',
                                                                            backgroundColor: '#e9ecef',
                                                                            padding: '10px'
                                                                        }}>
                                                                            <i className="fas fa-image fa-2x text-muted mb-2"></i>
                                                                            <div style={{ fontSize: '12px', fontWeight: '600', textAlign: 'center', color: '#6c757d' }}>
                                                                                Booth: {boothNumber}
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}
                                            
                                            <div style={{ marginTop: '15px' }}>
                                                <Badge bg="info">
                                                    <span>New Stamps: {newStamps.length} | Existing: {existingStamps.length}</span>
                                                </Badge>
                                            </div>
                                        </div>
                                    </Col>
                                    )}

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

                                    {/* Background Image Section */}
                                    <Col sm={12}>
                                        <div className="form-group fill">
                                            <Badge bg="info">
                                                {' '}
                                                <span>Background Image (Optional) </span>{' '}
                                                {backgroundImagePreview ? 'Selected' : 'Not Selected'}
                                            </Badge>
                                            <div
                                                className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center mt-2"
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
                                                {backgroundImagePreview && formData.backgroundImage ? (
                                                    <div style={{ width: '100%', maxWidth: '300px' }}>
                                                        <img
                                                            src={backgroundImagePreview}
                                                            alt="Background Image Preview"
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
                                                            onClick={
                                                                id
                                                                    ? handleRemoveBackgroundImage
                                                                    : () => {
                                                                          setFormData((prev) => ({
                                                                              ...prev,
                                                                              backgroundImage: null
                                                                          }));
                                                                          setBackgroundImagePreview(null);
                                                                      }
                                                            }
                                                            style={{ marginRight: '10px' }}
                                                        >
                                                            Remove Background Image
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <div className="mb-3">
                                                            <i className="fas fa-image fa-3x text-muted"></i>
                                                        </div>
                                                        <p className="text-muted mb-2">Upload background image for Q&A pages (Optional)</p>
                                                        <p className="text-muted small">
                                                            Supported formats: JPG, PNG, GIF. Max size: 10MB.
                                                        </p>
                                                        <input
                                                            type="file"
                                                            className="form-control"
                                                            name="backgroundImage"
                                                            onChange={handleBackgroundImageChange}
                                                            accept="image/*"
                                                            style={{ display: 'none' }}
                                                            id="backgroundImageInput"
                                                        />
                                                        <Button
                                                            variant="outline-primary"
                                                            onClick={() => document.getElementById('backgroundImageInput').click()}
                                                            style={{ marginTop: '10px' }}
                                                        >
                                                            Choose Background Image
                                                        </Button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </Col>

                                    {/* Event Stamp Modal */}
                                    {/* Remove the EventStampFormModal import and usage */}
                                    {/* <EventStampFormModal ... /> */}
                                </Row>

                                {/* Lucky Draw Feature Section */}
                                <Row className="mt-4">
                                    <Col sm={12}>
                                        <div className="form-group fill">
                                            <div style={{
                                                padding: '20px',
                                                backgroundColor: '#f8f9fa',
                                                borderRadius: '8px',
                                                border: '1px solid #e9ecef'
                                            }}>
                                                <div className="d-flex justify-content-between align-items-center flex-wrap">
                                                    <div style={{ flex: '1', minWidth: '300px', marginBottom: '10px' }}>
                                                        <label className="form-label" style={{ fontWeight: '600', marginBottom: '8px', display: 'block' }}>
                                                            <i className="fas fa-gift mr-2" style={{ color: '#4680ff' }}></i>
                                                            Lucky Draw Feature
                                                        </label>
                                                        <p className="text-muted mb-0" style={{ fontSize: '14px', lineHeight: '1.5' }}>
                                                            Enable lucky draw feature for this event. When participants mark their attendance, 
                                                            they will automatically receive a 4-digit lucky draw number (0001-9999) based on check-in sequence.
                                                        </p>
                                                    </div>
                                                    <div className="d-flex align-items-center" style={{ minWidth: '180px', justifyContent: 'flex-end' }}>
                                                        <Form.Check
                                                            type="switch"
                                                            id="enableLuckyDrawFeature"
                                                            label={
                                                                <span style={{ 
                                                                    fontWeight: '500',
                                                                    color: formData.enableLuckyDrawFeature ? '#28a745' : '#6c757d',
                                                                    marginLeft: '8px'
                                                                }}>
                                                                    {formData.enableLuckyDrawFeature ? (
                                                                        <span><i className="fas fa-check-circle mr-1"></i>Enabled</span>
                                                                    ) : (
                                                                        <span><i className="fas fa-times-circle mr-1"></i>Disabled</span>
                                                                    )}
                                                                </span>
                                                            }
                                                            checked={formData.enableLuckyDrawFeature || false}
                                                            onChange={(e) => {
                                                                setFormData((prev) => ({
                                                                    ...prev,
                                                                    enableLuckyDrawFeature: e.target.checked
                                                                }));
                                                            }}
                                                            style={{ 
                                                                fontSize: '1rem',
                                                                display: 'flex',
                                                                alignItems: 'center'
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </Col>

                                    {/* Withdraw option - visible only when enabled from Admin Panel */}
                                    <Col sm={12}>
                                        <div className="card">
                                            <div className="card-body">
                                                <div className="d-flex justify-content-between align-items-start flex-wrap gap-2">
                                                    <div className="flex-grow-1">
                                                        <label className="form-label mb-1">
                                                            <strong>Enable Withdraw Option</strong>
                                                        </label>
                                                        <p className="text-muted mb-0" style={{ fontSize: '14px', lineHeight: '1.5' }}>
                                                            When enabled, registered users can request to withdraw from this event (refund flow). When disabled, the Withdraw option is hidden in the app and API.
                                                        </p>
                                                    </div>
                                                    <div className="d-flex align-items-center" style={{ minWidth: '180px', justifyContent: 'flex-end' }}>
                                                        <Form.Check
                                                            type="switch"
                                                            id="withdrawalEnabled"
                                                            label={
                                                                <span style={{
                                                                    fontWeight: '500',
                                                                    color: formData.withdrawalEnabled ? '#28a745' : '#6c757d',
                                                                    marginLeft: '8px'
                                                                }}>
                                                                    {formData.withdrawalEnabled ? (
                                                                        <span><i className="fas fa-check-circle mr-1"></i>Enabled</span>
                                                                    ) : (
                                                                        <span><i className="fas fa-times-circle mr-1"></i>Disabled</span>
                                                                    )}
                                                                </span>
                                                            }
                                                            checked={formData.withdrawalEnabled !== false}
                                                            onChange={(e) => {
                                                                setFormData((prev) => ({
                                                                    ...prev,
                                                                    withdrawalEnabled: e.target.checked
                                                                }));
                                                            }}
                                                            style={{
                                                                fontSize: '1rem',
                                                                display: 'flex',
                                                                alignItems: 'center'
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </Col>
                                </Row>

                                {/* Programme Management Section - Available in both create and edit modes */}
                                <Row className="mt-4">
                                    <Col sm={12}>
                                        <EventProgrammeManagement 
                                            eventId={id} 
                                            isEditMode={!!id}
                                            eventSpeakers={speakerList.filter(speaker => formData.speakerIds && formData.speakerIds.includes(speaker.id))}
                                            onProgrammeDataChange={(data) => {
                                                if (!id) {
                                                    // Store programme data for later saving after event creation
                                                    programmeDataRef.current = data;
                                                }
                                            }}
                                        />
                                    </Col>
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
            />

            <DeleteConfirmationModal
                show={showSpeakerDeleteModal}
                onHide={() => {
                    setShowSpeakerDeleteModal(false);
                    setSpeakerToRemove(null);
                }}
                onConfirm={handleConfirmRemoveSpeaker}
                title="Remove Speaker"
                message={
                    <>
                        Are you sure you want to delete?
                        <br />
                        <br />
                        <span className="text-muted" style={{ fontSize: '0.9em' }}>
                            <strong>Note:</strong> This speaker will be removed from all programme sessions and engagements. The sessions and engagements will remain, but without this speaker.
                        </span>
                    </>
                }
            />

            <DeleteConfirmationModal
                show={showStampDeleteModal}
                onHide={handleCancelDeleteStamp}
                onConfirm={handleConfirmDeleteStamp}
                isLoading={isDeletingStamp}
                title="Delete Event Stamp"
                message={
                    <>
                        Are you sure you want to delete this event stamp?
                        <br />
                        <br />
                        <span className="text-danger" style={{ fontSize: '0.85em' }}>
                        <strong>Note:</strong> This action cannot be undone and will also delete the associated image file.
                        </span>
                    </>
                }
            />
        </Container>
    );
}

export default AddEventPage;
