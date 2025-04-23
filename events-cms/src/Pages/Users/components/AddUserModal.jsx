import React, { useState, useEffect } from 'react';
import { Modal, Button, Row, Col } from 'react-bootstrap';
import { useDispatch } from 'react-redux';
import { createUser, editUser } from '../../../store/actions/userActions';
import { FetchUsers } from '../fetchApi/FetchApi';
import { API_URL } from '../../../configs/env';

function AddUserModal({ show, handleClose, editData }) {
    const dispatch = useDispatch();

    const { fetchData } = FetchUsers(); // Destructure fetchData from the custom hook

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

    // Reset form when modal closes or when switching between add/edit
    useEffect(() => {
        if (editData) {
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
                profilePicture: editData.profilePicture ? `${API_URL}/${editData.profilePicture.replace(/\\/g, '/')}` : null
            });
        } else {
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
        }
    }, [editData, show]);

    const handleChange = (e) => {
        const { name, value, type, checked, files } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : type === 'file' ? files[0] : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const formDataToSend = new FormData();
        Object.keys(formData).forEach((key) => {
            if (formData[key] !== null) {
                formDataToSend.append(key, formData[key]);
            }
        });

        try {
            let success;
            if (editData) {
                success = await dispatch(editUser(editData.id, formDataToSend));
            } else {
                success = await dispatch(createUser(formDataToSend));
            }

            if (success) {
                fetchData();
                handleClose();
            }
        } catch (error) {
            console.error('Error submitting form:', error);
        }
    };

    return (
        <Modal show={show} onHide={handleClose} size="lg">
            <form onSubmit={handleSubmit}>
                <Modal.Header>
                    <Modal.Title as="h5">{editData ? 'Edit User' : 'Add User'}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Row>
                        <Col sm={6}>
                            <div className="form-group fill">
                                <label className="floating-label" htmlFor="firstName">
                                    First Name
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
                                    Last Name
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
                                    Email
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
                        {!editData && (
                            <Col sm={6}>
                                <div className="form-group fill">
                                    <label className="floating-label" htmlFor="password">
                                        Password
                                    </label>
                                    <input
                                        type="password"
                                        className="form-control"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        placeholder="Password"
                                        required={!editData}
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
                                {formData.profilePicture && (
                                    <img
                                        src={
                                            typeof formData.profilePicture === 'string'
                                                ? formData.profilePicture
                                                : URL.createObjectURL(formData.profilePicture)
                                        }
                                        alt="Profile"
                                        style={{ width: '100px', height: '100px', marginTop: '10px' }}
                                    />
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

export default AddUserModal;
