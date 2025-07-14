import React from 'react';
import { Modal, Button, Row, Col, Badge } from 'react-bootstrap';

const ViewCategoryModal = ({ show, handleClose, categoryData }) => {
    if (!categoryData) return null;

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <Modal show={show} onHide={handleClose} size="md">
            <Modal.Header  className="bg-primary text-white">
                <Modal.Title>
                    <i className="feather icon-tag mr-2"></i>
                    Category Details
                </Modal.Title>
            </Modal.Header>
            <Modal.Body className="p-4">
                <Row>
                    <Col md={12}>
                        <div className="mb-4">
                            <h6 className="text-primary mb-2">
                                <i className="feather icon-folder mr-2"></i>
                              Category Name
                            </h6>
                            <div className="p-3 bg-light rounded">
                              <p className="mb-0">{categoryData.name}</p>
                            </div>
                        </div>
                    </Col>

                    <Col md={12}>
                        <div className="mb-4">
                            <h6 className="text-primary mb-2">
                                <i className="feather icon-file-text mr-2"></i>
                                Description
                            </h6>
                            <div className="p-3 bg-light rounded">
                                {categoryData.description ? (
                                    <p className="mb-0">{categoryData.description}</p>
                                ) : (
                                    <p className="mb-0 text-muted font-italic">
                                        No description provided
                                    </p>
                                )}
                            </div>
                        </div>
                    </Col>

                    <Col md={6}>
                        <div className="mb-3">
                            <h6 className="text-primary mb-2">
                                <i className="feather icon-calendar mr-2"></i>
                                Created
                            </h6>
                            <p className="mb-0">{formatDate(categoryData.createdAt)}</p>
                        </div>
                    </Col>

                    <Col md={6}>
                        <div className="mb-3">
                            <h6 className="text-primary mb-2">
                                <i className="feather icon-edit mr-2"></i>
                                Updated
                            </h6>
                            <p className="mb-0">{formatDate(categoryData.updatedAt)}</p>
                        </div>
                    </Col>
                </Row>
            </Modal.Body>
            <Modal.Footer className="bg-light">
                <Button variant="secondary" onClick={handleClose}>
                    <i className="feather icon-x mr-1"></i>
                    Close
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default ViewCategoryModal; 