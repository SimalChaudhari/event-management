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
        name: '',
        email: '',
        mobile: '',
        isActive: true
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
                name: selectedModerator.name || '',
                email: selectedModerator.email || '',
                mobile: selectedModerator.mobile || '',
                isActive: selectedModerator.isActive !== undefined ? selectedModerator.isActive : true
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

        if (!formData.name?.trim()) {
            newErrors.name = 'Name is required';
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
                name: formData.name.trim(),
                email: formData.email.trim(),
                mobile: formData.mobile?.trim() || undefined,
                isActive: formData.isActive
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
                                    <Col sm={12}>
                                        <div className="form-group fill">
                                            <label className="floating-label" htmlFor="name">
                                                Name <span className="text-danger">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                                                id="name"
                                                name="name"
                                                placeholder="Enter name"
                                                value={formData.name}
                                                onChange={handleInputChange}
                                            />
                                            {errors.name && (
                                                <small className="text-danger">{errors.name}</small>
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

                                    <Col sm={12}>
                                        <div className="form-group">
                                            <div className="checkbox d-inline">
                                                <input
                                                    type="checkbox"
                                                    name="isActive"
                                                    id="isActive"
                                                    checked={formData.isActive}
                                                    onChange={handleInputChange}
                                                    style={{ marginRight: '8px' }}
                                                />
                                                <label htmlFor="isActive" className="cr">
                                                    Active
                                                </label>
                                            </div>
                                            <small className="form-text text-muted d-block mt-2">
                                                Check this to make the moderator active
                                            </small>
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

