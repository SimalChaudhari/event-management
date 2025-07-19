import React from 'react';
import { Modal, Form, Button, Col, Row } from 'react-bootstrap';

const CategoryFormModal = ({ show, onClose, onChange, onSubmit, formData }) => {
    return (
        <Modal
            show={show}
            onHide={onClose}
            backdrop={false}
            keyboard={false}
            centered
            size="lg"
            style={{
                zIndex: 9999
            }}
            dialogClassName="speaker-modal"
        >
            <Modal.Header>
                <Modal.Title>Add New Category</Modal.Title>
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
                                onChange={onChange}
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
                                onChange={onChange}
                                placeholder="Enter category description"
                                rows={3}
                            />
                        </div>
                    </Col>
                </Row>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="danger" onClick={onClose}>
                    Cancel
                </Button>
                <Button 
                    variant="primary" 
                    type="submit" 
                    onClick={onSubmit}
                    disabled={!formData.name.trim()}
                >
                    Save Category
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default CategoryFormModal; 