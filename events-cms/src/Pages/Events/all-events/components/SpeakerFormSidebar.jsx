import React from 'react';
import { Modal, Form, Button, Col, Row } from 'react-bootstrap';
import SingaporePhoneInput from '../../../../components/SingaporePhoneInput';

const SpeakerFormModal = ({ show, onClose, onChange, onSubmit, formData, isLoading = false }) => {
    return (
        <Modal
            show={show}
            onHide={onClose}
            backdrop={false} // disables dimming the background
            keyboard={false} // optional: disables ESC to close
            centered
            size="lg"
            style={{
                zIndex: 9999
            }}
            dialogClassName="speaker-modal"
        >
            <Modal.Header>
                <Modal.Title>Add New Speaker</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                 <Row>
                    <Col sm={6}>
                        <div className="form-group fill">
                            <label className="floating-label" htmlFor="firstName">
                                First Name <span style={{ color: '#dc3545' }}>*</span>
                            </label>
                            <input
                                type="text"
                                className="form-control"
                                name="firstName"
                                value={formData.firstName}
                                onChange={onChange}
                                placeholder="Enter first name"
                                required
                            />
                        </div>
                    </Col>

                    <Col sm={6}>
                        <div className="form-group fill">
                            <label className="floating-label" htmlFor="lastName">
                                Last Name <span style={{ color: '#dc3545' }}>*</span>
                            </label>
                            <input
                                type="text"
                                className="form-control"
                                name="lastName"
                                value={formData.lastName}
                                onChange={onChange}
                                placeholder="Enter last name"
                                required
                            />
                        </div>
                    </Col>

                    <Col sm={6}>
                        <div className="form-group fill">
                            <label className="floating-label" htmlFor="email">
                                Email <span style={{ color: '#dc3545' }}>*</span>
                            </label>
                            <input
                                type="email"
                                className="form-control"
                                name="email"
                                value={formData.email}
                                onChange={onChange}
                                placeholder="Enter email address"
                                required
                            />
                        </div>
                    </Col>

                    <Col sm={6}>
                        <div className="form-group fill">
                            <SingaporePhoneInput
                                name="mobile"
                                value={formData.mobile}
                                onChange={onChange}
                                label="Mobile"
                                required={true}
                            />
                        </div>
                    </Col>

                    <Col sm={6}>
                        <div className="form-group fill">
                            <label className="floating-label" htmlFor="position">
                                Position <span style={{ color: '#dc3545' }}>*</span>
                            </label>
                            <input
                                type="text"
                                className="form-control"
                                name="position"
                                value={formData.position}
                                onChange={onChange}
                                placeholder="Enter position/designation"
                                required
                            />
                        </div>
                    </Col>

                    <Col sm={6}>
                        <div className="form-group fill">
                            <label className="floating-label" htmlFor="companyName">
                                Company Name
                            </label>
                            <input
                                type="text"
                                className="form-control"
                                name="companyName"
                                value={formData.companyName}
                                onChange={onChange}
                                placeholder="Enter company name"
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
                                placeholder="Enter speaker description"
                                rows={3}
                            />
                        </div>
                    </Col>

                    <Col sm={12}>
                        <div className="form-group fill">
                            <label className="floating-label" htmlFor="profilePicture">
                                Profile Image
                            </label>
                            <input 
                                type="file" 
                                className="form-control" 
                                name="profilePicture" 
                                onChange={onChange} 
                                accept="image/*" 
                            />
                            {formData.profilePicture && (
                                <div className="mt-3 text-start">
                                    <img
                                        src={typeof formData.profilePicture === 'string' ? formData.profilePicture : URL.createObjectURL(formData.profilePicture)}
                                        alt="Speaker Profile Preview"
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
                                        Image Preview
                                    </p>
                                </div>
                            )}
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
                    disabled={
                        isLoading ||
                        !formData.firstName?.trim() ||
                        !formData.lastName?.trim() ||
                        !formData.email?.trim() ||
                        !formData.mobile?.trim() ||
                        !formData.position?.trim()
                    }
                >
                    {isLoading ? (
                        <>
                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                            Saving...
                        </>
                    ) : (
                        'Save Speaker'
                    )}
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default SpeakerFormModal;
