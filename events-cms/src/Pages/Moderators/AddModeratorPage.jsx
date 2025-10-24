import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Button, Row, Col, Container } from 'react-bootstrap';
import { createModerator, updateModerator, getModeratorById } from '../../store/actions/moderatorActions';
import { toast } from 'react-toastify';

const AddModeratorPage = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { id } = useParams();
    const isEditing = Boolean(id);

    const { selectedModerator, loading } = useSelector((state) => state.moderator);

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        mobile: '',
    });

    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (isEditing && id) {
            dispatch(getModeratorById(id));
        }
    }, [dispatch, isEditing, id]);

    useEffect(() => {
        if (isEditing && selectedModerator) {
            setFormData({
                firstName: selectedModerator.firstName || '',
                lastName: selectedModerator.lastName || '',
                email: selectedModerator.email || '',
                mobile: selectedModerator.mobile || ''
            });
        }
    }, [isEditing, selectedModerator]);

    const handleInputChange = (e) => {
        const { name, type, checked, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
        
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.firstName?.trim()) {
            newErrors.firstName = 'First name is required';
        }

        if (!formData.lastName?.trim()) {
            newErrors.lastName = 'Last name is required';
        }

        if (!formData.email?.trim()) {
            newErrors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Please enter a valid email address';
        }

        if (formData.mobile && !/^\+?[\d\s-()]+$/.test(formData.mobile)) {
            newErrors.mobile = 'Please enter a valid mobile number';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            toast.error('Please fix the validation errors');
            return;
        }

        setSubmitting(true);

        try {
            const payload = {
                firstName: formData.firstName.trim(),
                lastName: formData.lastName.trim(),
                email: formData.email.trim(),
                mobile: formData.mobile?.trim() || undefined,
            };

            let result;
            if (isEditing) {
                result = await dispatch(updateModerator(id, payload));
            } else {
                result = await dispatch(createModerator(payload));
            }

            if (result.success) {
                navigate('/moderators');
            }
        } catch (error) {
            console.error('Error saving moderator:', error);
        } finally {
            setSubmitting(false);
        }
    };

    const handleNavigate = () => {
        navigate('/moderators');
    };

    return (
        <Container fluid>
            <div className="row">
                <div className="col-12">
                    <div className="card">
                        <div className="card-header">
                            <div className="d-flex justify-content-between align-items-center">
                                <h4 className="card-title">
                                    {isEditing ? 'Edit Moderator' : 'Add New Moderator'}
                                </h4>
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
                                            <label className="floating-label" htmlFor="firstName">
                                                First Name <span className="text-danger">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                className={`form-control ${errors.firstName ? 'is-invalid' : ''}`}
                                                id="firstName"
                                                name="firstName"
                                                placeholder="Enter first name"
                                                value={formData.firstName}
                                                onChange={handleInputChange}
                                            />
                                            {errors.firstName && (
                                                <small className="text-danger">{errors.firstName}</small>
                                            )}
                                        </div>
                                    </Col>

                                    <Col sm={6}>
                                        <div className="form-group fill">
                                            <label className="floating-label" htmlFor="lastName">
                                                Last Name <span className="text-danger">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                className={`form-control ${errors.lastName ? 'is-invalid' : ''}`}
                                                id="lastName"
                                                name="lastName"
                                                placeholder="Enter last name"
                                                value={formData.lastName}
                                                onChange={handleInputChange}
                                            />
                                            {errors.lastName && (
                                                <small className="text-danger">{errors.lastName}</small>
                                            )}
                                        </div>
                                    </Col>

                                    <Col sm={12}>
                                        <div className="form-group fill">
                                            <label className="floating-label" htmlFor="email">
                                                Email <span className="text-danger">*</span>
                                            </label>
                                            <input
                                                type="email"
                                                className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                                                id="email"
                                                name="email"
                                                placeholder="Enter email"
                                                value={formData.email}
                                                onChange={handleInputChange}
                                            />
                                            {errors.email && (
                                                <small className="text-danger">{errors.email}</small>
                                            )}
                                        </div>
                                    </Col>

                                    <Col sm={12}>
                                        <div className="form-group fill">
                                            <label className="floating-label" htmlFor="mobile">
                                                Mobile (Optional)
                                            </label>
                                            <input
                                                type="text"
                                                className={`form-control ${errors.mobile ? 'is-invalid' : ''}`}
                                                id="mobile"
                                                name="mobile"
                                                placeholder="Enter mobile number"
                                                value={formData.mobile}
                                                onChange={handleInputChange}
                                            />
                                            {errors.mobile && (
                                                <small className="text-danger">{errors.mobile}</small>
                                            )}
                                        </div>
                                    </Col>

                                </Row>

                                <Row>
                                    <Col sm={12}>
                                        <div className="d-flex justify-content-between gap-2 mt-4">
                                            <Button 
                                                variant="danger" 
                                                onClick={handleNavigate}
                                                disabled={submitting}
                                            >
                                                Cancel
                                            </Button>
                                            <Button 
                                                variant="primary" 
                                                type="submit"
                                                disabled={submitting}
                                            >
                                                {submitting ? 'Saving...' : (isEditing ? 'Update' : 'Create')}
                                            </Button>
                                        </div>
                                    </Col>
                                </Row>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </Container>
    );
};

export default AddModeratorPage;

