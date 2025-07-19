import React, { useState, useEffect } from 'react';
import { Button, Row, Col, Card, Container, Alert } from 'react-bootstrap';
import { useDispatch } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { createCategory, updateCategory, categoryById } from '../../../store/actions/categoryActions';

const AddCategoryPage = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { id } = useParams(); // Edit mode के लिए
    
    const [formData, setFormData] = useState({
        name: '',
        description: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Load edit data if id exists
    useEffect(() => {
        if (id) {
            const loadCategoryData = async () => {
                try {
                    const response = await dispatch(categoryById(id));
                    if (response?.data) {
                        const editData = response.data;
                        setFormData({
                            name: editData.name || '',
                            description: editData.description || ''
                        });
                    }
                } catch (error) {
                    console.error('Error loading category data:', error);
                }
            };
            loadCategoryData();
        }
    }, [id, dispatch]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            if (id) {
                const response = await dispatch(updateCategory(id, formData));
                if (response) {
                    setSuccess('Category updated successfully!');
                    setTimeout(() => {
                        navigate('/categories');
                    }, 2000);
                }
            } else {
                const response = await dispatch(createCategory(formData));
                if (response) {
                    setSuccess('Category created successfully!');
                    setFormData({
                        name: '',
                        description: ''
                    });
                    setTimeout(() => {
                        navigate('/categories');
                    }, 2000);
                }
            }
        } catch (error) {
            setError('An error occurred while saving category');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        navigate('/categories');
    };

    return (
        <Container fluid>
            <div className="row">
                <div className="col-12">
                    <div className="card">
                        <div className="card-header">
                            <div className="d-flex justify-content-between align-items-center">
                                <h4 className="card-title">{id ? 'Edit Category' : 'Add Category'}</h4>
                                <Button 
                                    variant="secondary" 
                                    onClick={handleCancel}
                                >
                                    <i style={{marginRight: '10px'}} className="fas fa-arrow-left me-2"></i>
                                    Back to Categories
                                </Button>
                            </div>
                        </div>
                        <div className="card-body">
                            {error && <Alert variant="danger">{error}</Alert>}
                            {success && <Alert variant="success">{success}</Alert>}

                            <form onSubmit={handleSubmit}>
                                <Row>
                                    <Col sm={12}>
                                        <div className="form-group fill">
                                            <label className="floating-label" htmlFor="name">
                                                Category Name *
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
                                            <Button 
                                                variant="secondary" 
                                                onClick={handleCancel}
                                            >
                                                Cancel
                                            </Button>
                                            <Button 
                                                variant="primary" 
                                                type="submit" 
                                                disabled={loading || !formData.name.trim()}
                                            >
                                                {loading ? (id ? 'Updating...' : 'Creating...') : (id ? 'Update Category' : 'Create Category')}
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