import React, { useState, useEffect } from 'react';
import { Button, Row, Col, Card, Container, Alert } from 'react-bootstrap';
import { useDispatch } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { createSpeaker, updateSpeaker, speakerById } from '../../store/actions/speakerActions';
import { API_URL, DUMMY_PATH } from '../../configs/env';

const AddSpeakerPage = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { id } = useParams(); // Edit mode के लिए
    
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
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Load edit data if id exists
    useEffect(() => {
        if (id) {
            const loadSpeakerData = async () => {
                try {
                    const response = await dispatch(speakerById(id));
                    if (response?.data) {
                        const editData = response.data;
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
                    }
                } catch (error) {
                    console.error('Error loading speaker data:', error);
                }
            };
            loadSpeakerData();
        }
    }, [id, dispatch]);

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
            if (id && formData.speakerProfile) {
                setImagePreview(`${API_URL}/${formData.speakerProfile}`);
            } else {
                setImagePreview(DUMMY_PATH);
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const submitData = new FormData();
            Object.keys(formData).forEach((key) => {
                if (formData[key] !== null) {
                    submitData.append(key, formData[key]);
                }
            });

            if (id) {
                const response = await dispatch(updateSpeaker(id, submitData));
                if (response) {
                    setSuccess('Speaker updated successfully!');
                    setTimeout(() => {
                        navigate('/speakers');
                    }, 2000);
                }
            } else {
                const response = await dispatch(createSpeaker(submitData));
                if (response) {
                    setSuccess('Speaker created successfully!');
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
                    setTimeout(() => {
                        navigate('/speakers');
                    }, 2000);
                }
            }
        } catch (error) {
            setError('An error occurred while saving speaker');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        navigate('/speakers');
    };

    return (
        <Container fluid>
            <div className="row">
                <div className="col-12">
                    <div className="card">
                        <div className="card-header">
                            <div className="d-flex justify-content-between align-items-center">
                                <h4 className="card-title">{id ? 'Edit Speaker' : 'Add Speaker'}</h4>
                                <Button 
                                    variant="secondary" 
                                    onClick={handleCancel}
                                >
                                    <i style={{marginRight: '10px'}} className="fas fa-arrow-left me-2"></i>
                                    Back to Speakers
                                </Button>
                            </div>
                        </div>
                        <div className="card-body">
                            {error && <Alert variant="danger">{error}</Alert>}
                            {success && <Alert variant="success">{success}</Alert>}

                            <form onSubmit={handleSubmit}>
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
                                                        {id ? 'Current Profile Image' : 'Image Preview'}
                                                    </p>
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
                                                onClick={handleCancel}
                                            >
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
                                                {loading ? (id ? 'Updating...' : 'Creating...') : id ? 'Update Speaker' : 'Create Speaker'}
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
};

export default AddSpeakerPage; 