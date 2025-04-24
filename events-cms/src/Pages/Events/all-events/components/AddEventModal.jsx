import React, { useState, useEffect } from 'react';
import { Modal, Button, Row, Col } from 'react-bootstrap';
import Select from 'react-select';
import { useDispatch } from 'react-redux';
import { FetchEventData } from '../fetchEvents/FetchEventApi';
import { createEvent, editEvent } from '../../../../store/actions/eventActions';
import { API_URL } from '../../../../configs/env';
import axiosInstance from '../../../../configs/axiosInstance';

function AddEventModal({ show, handleClose, editData }) {
    const dispatch = useDispatch();
    const { fetchEvent } = FetchEventData();

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
        speakerIds: []
    });

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
            speakerIds: []
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

    // Load speakers from API
    useEffect(() => {
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
        fetchSpeakers();
    }, []);

    useEffect(() => {
        if (editData) {
            // Check for both possible speaker data formats
            let speakerIds = [];
            
            // Check if speakers data exists in either format
            if (editData.speakers) {
                speakerIds = editData.speakers.map(speaker => speaker.id);
            } else if (editData.speakersData) {
                speakerIds = editData.speakersData.map(speaker => speaker.id);
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
                const speakersArray = Array.isArray(dataToSend.speakerIds) 
                    ? dataToSend.speakerIds 
                    : [];
                    
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
                            <div className="form-group">
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
        </Modal>
    );
}

export default AddEventModal;
