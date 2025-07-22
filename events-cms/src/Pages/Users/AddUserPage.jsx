import React, { useState, useEffect } from 'react';
import { Button, Row, Col, Card, Container, Alert } from 'react-bootstrap';
import { useDispatch } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { createUser, editUser, userById } from '../../store/actions/userActions';
import { API_URL } from '../../configs/env';
import { USER_PATHS } from '../../utils/constants';

const AddUserPage = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { id } = useParams(); // Edit mode के लिए
    
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        mobile: '',
        address: '',
        city: '',
        state: '',
        postalCode: '',
        isMember: false,
        biometricEnabled: false,
        profilePicture: null
    });
    const [loading, setLoading] = useState(false);
    const [imagePreview, setImagePreview] = useState(null);

    // Load edit data if id exists
    useEffect(() => {
        if (id) {
            const loadUserData = async () => {
                try {
                    const response = await dispatch(userById(id));
                    if (response?.data) {
                        const editData = response.data;
                        setFormData({
                            firstName: editData.firstName || '',
                            lastName: editData.lastName || '',
                            email: editData.email || '',
                            password: '',
                            mobile: editData.mobile || '',
                            address: editData.address || '',
                            city: editData.city || '',
                            state: editData.state || '',
                            postalCode: editData.postalCode || '',
                            isMember: editData.isMember || false,
                            biometricEnabled: editData.biometricEnabled || false,
                            profilePicture: null
                        });
                        
                        // Edit mode में पुरानी image का URL set करें
                        if (editData.profilePicture) {
                            setImagePreview(`${API_URL}/${editData.profilePicture.replace(/\\/g, '/')}`);
                        } else {
                            setImagePreview(null);
                        }
                    }
                } catch (error) {
                    console.error('Error loading user data:', error);
                }
            };
            loadUserData();
        }
    }, [id, dispatch]);

    const handleChange = (e) => {
        const { name, value, type, checked, files } = e.target;
        
        if (type === 'file') {
            const file = files[0];
            setFormData((prev) => ({
                ...prev,
                [name]: file
            }));
            
            // Image preview
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    setImagePreview(e.target.result);
                };
                reader.readAsDataURL(file);
            } else {
                setImagePreview(null);
            }
        } else {
            setFormData((prev) => ({
                ...prev,
                [name]: type === 'checkbox' ? checked : value
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
       

        try {
            const formDataToSend = new FormData();
            Object.keys(formData).forEach((key) => {
                if (formData[key] !== null) {
                    formDataToSend.append(key, formData[key]);
                }
            });

            let response;
            if (id) {
                response = await dispatch(editUser(id, formDataToSend));
            } else {
                response = await dispatch(createUser(formDataToSend));
            }

            if (response) {
                if (!id) {
                    setFormData({
                        firstName: '',
                        lastName: '',
                        email: '',
                        password: '',
                        mobile: '',
                        address: '',
                        city: '',
                        state: '',
                        postalCode: '',
                        isMember: false,
                        biometricEnabled: false,
                        profilePicture: null
                    });
                    setImagePreview(null);
                }
               
                    navigate(`${USER_PATHS.LIST_USERS}`);
              
            }
        } catch (error) {
            setLoading(false);

        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        navigate(`${USER_PATHS.LIST_USERS}`);
    };

    return (
        <Container fluid>
            <div className="row">
                <div className="col-12">
                    <div className="card">
                        <div className="card-header">
                            <div className="d-flex justify-content-between align-items-center">
                                <h4 className="card-title">{id ? 'Edit User' : 'Add User'}</h4>
                                <Button 
                                    variant="secondary" 
                                    onClick={handleCancel}
                                >
                                    <i style={{marginRight: '10px'}} className="fas fa-arrow-left me-2"></i>
                                    Back
                                </Button>
                            </div>
                        </div>
                        <div className="card-body">
                          

                            <form onSubmit={handleSubmit}>
                                <Row>
                                    <Col sm={6}>
                                        <div className="form-group fill">
                                            <label className="floating-label" htmlFor="firstName">
                                                First Name<span className="text-danger">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                name="firstName"
                                                value={formData.firstName}
                                                onChange={handleChange}
                                                placeholder="First Name"
                                                required
                                            />
                                        </div>
                                    </Col>
                                    <Col sm={6}>
                                        <div className="form-group fill">
                                            <label className="floating-label" htmlFor="lastName">
                                                Last Name<span className="text-danger">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                name="lastName"
                                                value={formData.lastName}
                                                onChange={handleChange}
                                                placeholder="Last Name"
                                                required
                                            />
                                        </div>
                                    </Col>
                                    <Col sm={6}>
                                        <div className="form-group fill">
                                            <label className="floating-label" htmlFor="email">
                                                Email<span className="text-danger">*</span>
                                            </label>
                                            <input
                                                type="email"
                                                className="form-control"
                                                name="email"
                                                value={formData.email}
                                                onChange={handleChange}
                                                placeholder="Email"
                                                required
                                            />
                                        </div>
                                    </Col>
                                    {!id && (
                                        <Col sm={6}>
                                            <div className="form-group fill">
                                                <label className="floating-label" htmlFor="password">
                                                    Password<span className="text-danger">*</span>
                                                </label>
                                                <input
                                                    type="password"
                                                    className="form-control"
                                                    name="password"
                                                    value={formData.password}
                                                    onChange={handleChange}
                                                    placeholder="Password"
                                                    required={!id}
                                                    minLength="6"
                                                />
                                            </div>
                                        </Col>
                                    )}
                                    <Col sm={6}>
                                        <div className="form-group fill">
                                            <label className="floating-label" htmlFor="mobile">
                                                Mobile
                                            </label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                name="mobile"
                                                value={formData.mobile}
                                                onChange={handleChange}
                                                placeholder="Mobile"
                                            />
                                        </div>
                                    </Col>
                                    <Col sm={12}>
                                        <div className="form-group fill">
                                            <label className="floating-label" htmlFor="address">
                                                Address
                                            </label>
                                            <textarea
                                                className="form-control"
                                                name="address"
                                                value={formData.address}
                                                onChange={handleChange}
                                                placeholder="Address"
                                                rows={3}
                                            />
                                        </div>
                                    </Col>
                                    <Col sm={4}>
                                        <div className="form-group fill">
                                            <label className="floating-label" htmlFor="city">
                                                City
                                            </label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                name="city"
                                                value={formData.city}
                                                onChange={handleChange}
                                                placeholder="City"
                                            />
                                        </div>
                                    </Col>
                                    <Col sm={4}>
                                        <div className="form-group fill">
                                            <label className="floating-label" htmlFor="state">
                                                State
                                            </label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                name="state"
                                                value={formData.state}
                                                onChange={handleChange}
                                                placeholder="State"
                                            />
                                        </div>
                                    </Col>
                                    <Col sm={4}>
                                        <div className="form-group fill">
                                            <label className="floating-label" htmlFor="postalCode">
                                                Postal Code
                                            </label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                name="postalCode"
                                                value={formData.postalCode}
                                                onChange={handleChange}
                                                placeholder="Postal Code"
                                            />
                                        </div>
                                    </Col>

                                    <Col sm={12}>
                                        <div className="form-group fill">
                                            <label className="floating-label" htmlFor="profilePicture">
                                                Profile Picture
                                            </label>
                                            <input
                                                type="file"
                                                className="form-control"
                                                name="profilePicture"
                                                onChange={handleChange}
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
                                    <Col sm={6}>
                                        <div className="form-group">
                                            <div className="custom-control custom-switch">
                                                <input
                                                    type="checkbox"
                                                    className="custom-control-input"
                                                    id="isMember"
                                                    name="isMember"
                                                    checked={formData.isMember}
                                                    onChange={handleChange}
                                                />
                                                <label className="custom-control-label" htmlFor="isMember">
                                                    Is Member
                                                </label>
                                            </div>
                                        </div>
                                    </Col>
                                    <Col sm={6}>
                                        <div className="form-group">
                                            <div className="custom-control custom-switch">
                                                <input
                                                    type="checkbox"
                                                    className="custom-control-input"
                                                    id="biometricEnabled"
                                                    name="biometricEnabled"
                                                    checked={formData.biometricEnabled}
                                                    onChange={handleChange}
                                                />
                                                <label className="custom-control-label" htmlFor="biometricEnabled">
                                                    Biometric Enabled
                                                </label>
                                            </div>
                                        </div>
                                    </Col>
                                </Row>
                                
                                {/* Form Actions */}
                                <div className="row mt-4">
                                    <div className="col-12">
                                        <div className="d-flex justify-content-between gap-2">
                                            <Button 
                                                variant="danger" 
                                                onClick={handleCancel}
                                            >
                                                Cancel
                                            </Button>
                                            <Button 
                                                variant="primary" 
                                                type="submit"
                                                disabled={loading || !formData.firstName.trim() || !formData.lastName.trim() || !formData.email.trim() || (!id && !formData.password.trim())}
                                            >
                                                {loading ? (id ? 'Updating...' : 'Creating...') : (id ? 'Update User' : 'Create User')}
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

export default AddUserPage; 