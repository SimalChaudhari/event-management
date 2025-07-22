import React, { useState, useEffect } from 'react';
import { Button, Row, Col, Card, Container, Alert } from 'react-bootstrap';
import { useDispatch } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { createCategory, updateCategory, categoryById } from '../../../store/actions/categoryActions';
import { EVENT_PATHS } from '../../../utils/constants';

const AddCategoryPage = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { id } = useParams(); // Edit mode के लिए

    const [formData, setFormData] = useState({
        name: '',
        description: ''
    });
    const [loading, setLoading] = useState(false);

    // Load edit data if id exists
    useEffect(() => {
        if (id) {
            const loadCategoryData = async () => {
                    const response = await dispatch(categoryById(id));
                    if (response?.data) {
                        const editData = response.data;
                        setFormData({
                            name: editData.name || '',
                            description: editData.description || ''
                        });
                    }
            };
            loadCategoryData();
        }
    }, [id, dispatch]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (id) {
                const response = await dispatch(updateCategory(id, formData));
                if (response) {
                    navigate(EVENT_PATHS.CATEGORIES);
                }
            } else {
                const response = await dispatch(createCategory(formData));
                if (response) {
                    setFormData({
                        name: '',
                        description: ''
                    });

                    navigate(EVENT_PATHS.CATEGORIES);
                }
            }
        } catch (error) {
            //error handling
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        navigate(EVENT_PATHS.CATEGORIES);
    };

    return (
        <Container fluid>
            <div className="row">
                <div className="col-12">
                    <div className="card">
                        <div className="card-header">
                            <div className="d-flex justify-content-between align-items-center">
                                <h4 className="card-title">{id ? 'Edit Category' : 'Add Category'}</h4>
                                <Button variant="secondary" onClick={handleCancel}>
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
                                                Name <span style={{ color: 'red' }}>*</span>
                                            </label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                name="name"
                                                value={formData.name}
                                                onChange={handleInputChange}
                                                placeholder="Enter category name"
                                                required
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
                                                placeholder="Enter category description (optional)"
                                                rows={4}
                                            />
                                        </div>
                                    </Col>
                                </Row>

                                {/* Form Actions */}
                                <div className="row mt-4">
                                    <div className="col-12">
                                        <div className="d-flex justify-content-between gap-2">
                                            <Button variant="danger" onClick={handleCancel}>
                                                Cancel
                                            </Button>
                                            <Button variant="primary" type="submit" disabled={loading || !formData.name.trim()}>
                                                {loading
                                                    ? id
                                                        ? 'Updating...'
                                                        : 'Creating...'
                                                    : id
                                                    ? 'Update'
                                                    : 'Create'}
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

export default AddCategoryPage;
