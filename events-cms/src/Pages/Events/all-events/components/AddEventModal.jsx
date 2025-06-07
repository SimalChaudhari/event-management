import React, { useState, useEffect } from 'react';
import { Modal, Button, Row, Col, Card } from 'react-bootstrap';
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
import { addSpeaker } from '../../../../store/actions/speakerActions';

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
        image: null,
        type: 'Physical',
        price: '',
        currency: '',
        speakerIds: [],
        latitude: '', // Added latitude
        longitude: '' // Added longitude
    });
    const [showMapModal, setShowMapModal] = useState(false); // For showing the map modal

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
            image: null,
            type: 'Physical',
            price: '',
            currency: '',
            speakerIds: [],
            latitude: '', // Added latitude
            longitude: '' // Added longitude
        });
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

            // Set form data with the extracted speaker IDs
            setFormData({
                name: '',
                description: '',
                startDate: '',
                startTime: '',
                endDate: '',
                endTime: '',
                location: '',
                venue: '',
                latitude: '',
                longitude: '',
                country: '',
                image: null,
                type: 'Physical',
                price: '',
                currency: '',
                ...editData,
                speakerIds: speakerIds,
                image: editData.image ? `${API_URL}/${editData.image.replace(/\\/g, '/')}` : null
            });
        } else {
            resetFormData();
        }
    }, [editData]);

    const handleChange = (e) => {
        const { name, value, type, files } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === 'file' ? files[0] : value
        }));
    };

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

        // Create a data object without speakersData
        const dataToSend = {
            ...formData,
            startTime: formattedStartTime,
            endTime: formattedEndTime
        };

        // Remove speakersData property if it exists
        if (dataToSend.speakersData) {
            delete dataToSend.speakersData;
        }

        Object.keys(dataToSend).forEach((key) => {
            if (key === 'speakerIds') {
                // Make sure speakerIds is an array before joining
                const speakersArray = Array.isArray(dataToSend.speakerIds) ? dataToSend.speakerIds : [];

                // Convert to comma-separated string - this is what the backend expects
                formDataToSend.append('speakerIds', speakersArray.join(','));
            } else if (key === 'image') {
                if (dataToSend[key] && typeof dataToSend[key] !== 'string') {
                    formDataToSend.append(key, dataToSend[key]);
                }
            } else if (key !== 'speakersData' && dataToSend[key] !== null) {
                formDataToSend.append(key, dataToSend[key]);
            }
        });

        if (editData && editData.image && typeof formData.image === 'string') {
            formDataToSend.append('originalImage', editData.image);
        }

        try {
            const success = editData ? await dispatch(editEvent(editData.id, formDataToSend)) : await dispatch(createEvent(formDataToSend));
            if (success) {
                fetchEvent();
                handleClose();
                resetFormData(); // Reset the form data
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
            const success = await dispatch(addSpeaker(formDataToSend));
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
                        <Col sm={6}>
                            <div className="form-group fill">
                                <label className="floating-label" htmlFor="image">
                                    Image
                                </label>
                                <input type="file" className="form-control" name="image" onChange={handleChange} accept="image/*" />
                                {formData.image && (
                                    <img
                                        src={typeof formData.image === 'string' ? formData.image : URL.createObjectURL(formData.image)}
                                        alt="Event"
                                        style={{ width: '100px', height: '100px', marginTop: '10px' }}
                                    />
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
