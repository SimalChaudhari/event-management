import React, { useState, useEffect } from 'react';
import { Modal, Button, Row, Col, Alert } from 'react-bootstrap';
import { useDispatch } from 'react-redux';
import { createCategory, updateCategory } from '../../../../store/actions/categoryActions';

const AddCategoryModal = ({ show, handleClose, editData }) => {
    const dispatch = useDispatch();
    const [formData, setFormData] = useState({
        name: '',
        description: ''
    });
    const [loading, setLoading] = useState(false);


    useEffect(() => {
        if (editData) {
            setFormData({
                name: editData.name || '',
                description: editData.description || ''
            });
        } else {
            setFormData({
                name: '',
                description: ''
            });
        }
    
    }, [editData, show]);

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
    
        try {
            if (editData) {
                await dispatch(updateCategory(editData.id, formData));
            } else {
                await dispatch(createCategory(formData));
            }
            handleClose();
        } catch (error) {
            console.error('Error saving category:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal show={show} onHide={handleClose} size="lg">
            <form onSubmit={handleSubmit}>
                <Modal.Header>
                    <Modal.Title as="h5">
                        {editData ? 'Edit Category' : 'Add New Category'}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                 
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
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="danger" onClick={handleClose}>
                        Cancel
                    </Button>
                    <Button 
                        variant="primary" 
                        type="submit" 
                        disabled={loading || !formData.name.trim()}
                    >
                        {loading ? (editData ? 'Updating...' : 'Creating...') : (editData ? 'Update Category' : 'Create Category')}
                    </Button>
                </Modal.Footer>
            </form>
        </Modal>
    );
};

export default AddCategoryModal;