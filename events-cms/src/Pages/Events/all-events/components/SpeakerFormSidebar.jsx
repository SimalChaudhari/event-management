import React from 'react';
import { Modal, Form, Button, Col, Row } from 'react-bootstrap';

const SpeakerFormModal = ({ show, onClose, onChange, onSubmit, formData }) => {
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
                <Row cla>
                    <Col sm={6}>
                        <div className="form-group fill">
                            <label className="floating-label" htmlFor="name">
                                Name
                            </label>
                            <input
                                type="text"
                                className="form-control"
                                name="name"
                                value={formData.name}
                                onChange={onChange}
                                placeholder="Event Name"
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
                                placeholder="companyName "
                                required
                            />
                        </div>
                    </Col>

                    <Col sm={6}>
                        <div className="form-group fill">
                            <label className="floating-label" htmlFor="position">
                            Position
                            </label>
                            <input
                                type="text"
                                className="form-control"
                                name="position"
                                value={formData.position}
                                onChange={onChange}
                                placeholder="position "
                                required
                            />
                        </div>
                    </Col>
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
                                onChange={onChange}
                                placeholder="Mobile"
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
                                type="text"
                                className="form-control"
                                name="email"
                                value={formData.email}
                                onChange={onChange}
                                placeholder="email"
                                required
                            />
                        </div>
                    </Col>

        
                    <Col sm={6}>
                        <div className="form-group fill">
                            <label className="floating-label" htmlFor="location">
                            Location
                            </label>
                            <input
                                type="text"
                                className="form-control"
                                name="location"
                                value={formData.location}
                                onChange={onChange}
                                placeholder="location"
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
                                    placeholder="Description"
                                    rows={2}
                                />
                            </div>
                        </Col>

                    <Col sm={6}>
                        <div className="form-group fill">
                            <label className="floating-label" htmlFor="speakerProfile">
                                Image
                            </label>
                            <input type="file" className="form-control" name="speakerProfile" onChange={onChange} accept="image/*" />
                            {formData.speakerProfile && (
                                <img
                                    src={typeof formData.speakerProfile === 'string' ? formData.speakerProfile : URL.createObjectURL(formData.speakerProfile)}
                                    alt="speaker"
                                    style={{ width: '100px', height: '100px', marginTop: '10px' }}
                                />
                            )}
                        </div>
                    </Col>
                </Row>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="danger" onClick={onClose}>
                    Cancel
                </Button>
                <Button variant="primary" type="submit" onClick={onSubmit}>
                    Save Speaker
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default SpeakerFormModal;
