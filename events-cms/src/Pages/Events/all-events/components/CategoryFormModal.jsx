import React from 'react';
import { Button, Col, Row } from 'react-bootstrap';
import FormRightSidebar from '../../../../components/common/FormRightSidebar';

const CategoryFormModal = ({ show, onClose, onChange, onSubmit, formData }) => {
    const handleSave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        onSubmit(e);
    };

    const footer = (
        <>
            <Button type="button" variant="danger" onClick={onClose}>
                Cancel
            </Button>
            <Button type="button" variant="primary" onClick={handleSave} disabled={!formData.name.trim()}>
                Save Category
            </Button>
        </>
    );

    return (
        <FormRightSidebar show={show} onHide={onClose} title="Add New Category" footer={footer} width={520}>
            <Row>
                <Col sm={12}>
                    <div className="form-group fill">
                        <label className="floating-label" htmlFor="categoryName">
                            Category Name <span style={{ color: '#dc3545' }}>*</span>
                        </label>
                        <input
                            type="text"
                            className="form-control"
                            id="categoryName"
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
                        <label className="floating-label" htmlFor="categoryDescription">
                            Description
                        </label>
                        <textarea
                            className="form-control"
                            id="categoryDescription"
                            name="description"
                            value={formData.description}
                            onChange={onChange}
                            placeholder="Enter category description"
                            rows={3}
                        />
                    </div>
                </Col>
            </Row>
        </FormRightSidebar>
    );
};

export default CategoryFormModal;
