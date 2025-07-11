import React, { useState, useEffect } from 'react';
import { Modal, Button, Row, Col, Alert } from 'react-bootstrap';
import { useDispatch } from 'react-redux';
import { createSpeaker, updateSpeaker } from '../../../store/actions/speakerActions';
import { API_URL, DUMMY_PATH } from '../../../configs/env';

const AddSpeakerModal = ({ show, handleClose, editData }) => {
    const dispatch = useDispatch();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        mobile: '',
        position: '',
        companyName: '',
        location: '',
        description: '',
        speakerProfile: null
    });
    const [loading, setLoading] = useState(false);
    const [imagePreview, setImagePreview] = useState(null);

    useEffect(() => {
        if (editData) {
            setFormData({
                name: editData.name || '',
                email: editData.email || '',
                mobile: editData.mobile || '',
                position: editData.position || '',
                companyName: editData.companyName || '',
                location: editData.location || '',
                description: editData.description || '',
                speakerProfile: null
            });
            // Edit mode में पुरानी image का URL set करें
            if (editData.speakerProfile) {
                setImagePreview(`${API_URL}/${editData.speakerProfile}`);
            } else {
                setImagePreview(DUMMY_PATH);
            }
        } else {
            setFormData({
                name: '',
                email: '',
                mobile: '',
                position: '',
                companyName: '',
                location: '',
                description: '',
                speakerProfile: null
            });
            setImagePreview(null);
        }
    }, [editData, show]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        setFormData((prev) => ({
            ...prev,
            speakerProfile: file
        }));

        // नई image का preview दिखाने के लिए
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                setImagePreview(e.target.result);
            };
            reader.readAsDataURL(file);
        } else {
            // Edit mode में पुरानी image वापस दिखाएं
            if (editData && editData.speakerProfile) {
                setImagePreview(`${API_URL}/${editData.speakerProfile}`);
            } else {
                setImagePreview(DUMMY_PATH);
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const submitData = new FormData();
            Object.keys(formData).forEach((key) => {
                if (formData[key] !== null) {
                    submitData.append(key, formData[key]);
                }
            });

            if (editData) {
                await dispatch(updateSpeaker(editData.id, submitData));
            } else {
                await dispatch(createSpeaker(submitData));
            }
            handleClose();
        } catch (error) {
            console.error('Error saving speaker:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal show={show} onHide={handleClose} size="lg">
            <form onSubmit={handleSubmit}>
                <Modal.Header>
                    <Modal.Title as="h5">{editData ? 'Edit Speaker' : 'Add New Speaker'}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Row>
                        <Col sm={6}>
                            <div className="form-group fill">
                                <label className="floating-label" htmlFor="name">
                                    Speaker Name *
                                </label>
                                <input
                                    type="text"
                                    className="form-control"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    placeholder="Enter speaker name"
                                    required
                                />
                            </div>
                        </Col>

                        <Col sm={6}>
                            <div className="form-group fill">
                                <label className="floating-label" htmlFor="email">
                                    Email *
                                </label>
                                <input
                                    type="email"
                                    className="form-control"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    placeholder="Enter email address"
                                    required
                                />
                            </div>
                        </Col>

                        <Col sm={6}>
                            <div className="form-group fill">
                                <label className="floating-label" htmlFor="mobile">
                                    Mobile *
                                </label>
                                <input
                                    type="tel"
                                    className="form-control"
                                    name="mobile"
                                    value={formData.mobile}
                                    onChange={handleInputChange}
                                    placeholder="Enter mobile number"
                                    required
                                />
                            </div>
                        </Col>

                        <Col sm={6}>
                            <div className="form-group fill">
                                <label className="floating-label" htmlFor="position">
                                    Position *
                                </label>
                                <input
                                    type="text"
                                    className="form-control"
                                    name="position"
                                    value={formData.position}
                                    onChange={handleInputChange}
                                    placeholder="Enter position/designation"
                                    required
                                />
                            </div>
                        </Col>

                        <Col sm={6}>
                            <div className="form-group fill">
                                <label className="floating-label" htmlFor="companyName">
                                    Company Name
                                </label>
                                <input
                                    type="text"
                                    className="form-control"
                                    name="companyName"
                                    value={formData.companyName}
                                    onChange={handleInputChange}
                                    placeholder="Enter company name"
                                />
                            </div>
                        </Col>

                        <Col sm={6}>
                            <div className="form-group fill">
                                <label className="floating-label" htmlFor="location">
                                    Location
                                </label>
                                <input
                                    type="text"
                                    className="form-control"
                                    name="location"
                                    value={formData.location}
                                    onChange={handleInputChange}
                                    placeholder="Enter location"
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
                                    onChange={handleInputChange}
                                    placeholder="Enter speaker description"
                                    rows={4}
                                />
                            </div>
                        </Col>

                        <Col sm={12}>
                            <div className="form-group fill">
                                <label className="floating-label" htmlFor="speakerProfile">
                                    Profile Image
                                </label>
                                <input
                                    type="file"
                                    className="form-control"
                                    name="speakerProfile"
                                    onChange={handleFileChange}
                                    accept="image/*"
                                />
                                
                                {/* Image Preview */}
                                {imagePreview && (
                                    <div className="mt-3 text-start">
                                        <img 
                                            src={imagePreview} 
                                            alt="Profile Preview" 
                                            style={{
                                                width: '120px',
                                                height: '120px',
                                                objectFit: 'cover',
                                                borderRadius: '10px',
                                                border: '2px solid #4680ff',
                                                marginTop: '10px'
                                            }}
                                        />
                                        <p className="text-muted mt-2" style={{ fontSize: '12px' }}>
                                            {editData ? 'Current Profile Image' : 'Image Preview'}
                                        </p>
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
                    <Button
                        variant="primary"
                        type="submit"
                        disabled={
                            loading ||
                            !formData.name.trim() ||
                            !formData.email.trim() ||
                            !formData.mobile.trim() ||
                            !formData.position.trim()
                        }
                    >
                        {loading ? (editData ? 'Updating...' : 'Creating...') : editData ? 'Update Speaker' : 'Create Speaker'}
                    </Button>
                </Modal.Footer>
            </form>
        </Modal>
    );
};

export default AddSpeakerModal;
