import React from 'react';
import { Modal, Form, Button, Col, Row, Badge } from 'react-bootstrap';

const EventStampFormModal = ({ show, onClose, onChange, onSubmit, formData, onImageChange, onImageRemove, selectedImages }) => {
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
                <Modal.Title>Add New Event Stamp</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Row>
                    <Col sm={12}>
                        <div className="form-group fill">
                            <label className="floating-label" htmlFor="description">
                                Description *
                            </label>
                            <textarea
                                className="form-control"
                                name="description"
                                value={formData.description}
                                onChange={onChange}
                                placeholder="Enter event stamp description"
                                rows={3}
                                required
                            />
                        </div>
                    </Col>

                    <Col sm={12}>
                        <div className="form-group fill">
                        <Badge bg="info"> <span>Images (Optional) </span> </Badge>
                                      
                            <div 
                                className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center mt-2"
                                style={{
                                    border: '2px dashed #ccc',
                                    borderRadius: '8px',
                                    padding: '20px',
                                    textAlign: 'center',
                                    backgroundColor: '#f9f9f9',
                                    marginBottom: '10px',
                                    minHeight: '100px'
                                }}
                            >
                                <div className="mb-3">
                                    <i className="fas fa-image fa-2x text-muted"></i>
                                </div>
                                <p className="text-muted mb-2">
                                    Upload images for event stamp
                                </p>
                                <p className="text-muted small">
                                    Supported formats: JPG, PNG, GIF. Max size: 5MB per image.
                                </p>
                                <input
                                    type="file"
                                    className="form-control"
                                    onChange={onImageChange}
                                    accept="image/*"
                                    multiple
                                    style={{ display: 'none' }}
                                    id="eventStampImageInput"
                                />
                                <Button
                                    variant="outline-primary"
                                    onClick={() => document.getElementById('eventStampImageInput').click()}
                                    style={{ marginTop: '10px' }}
                                >
                                    Choose Images
                                </Button>
                            </div>
                            
                            {selectedImages && selectedImages.length > 0 && (
                                <div className="mt-3">
                                    <h6>Selected Images ({selectedImages.length})</h6>
                                    <div style={{ 
                                        display: 'grid', 
                                        gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
                                        gap: '10px',
                                        marginTop: '10px'
                                    }}>
                                        {selectedImages.map((image, index) => (
                                            <div key={index} style={{ 
                                                position: 'relative',
                                                borderRadius: '6px',
                                                overflow: 'hidden'
                                            }}>
                                                <img
                                                    src={image.preview}
                                                    alt={`Event Stamp ${index + 1}`}
                                                    style={{ 
                                                        width: '100%', 
                                                        height: '100px', 
                                                        objectFit: 'cover'
                                                    }}
                                                />
                                                <Button
                                                    size="sm"
                                                    variant="danger"
                                                    style={{
                                                        position: 'absolute',
                                                        top: '5px',
                                                        right: '5px',
                                                        padding: '2px 6px',
                                                        fontSize: '10px'
                                                    }}
                                                    onClick={() => onImageRemove(index)}
                                                >
                                                    ×
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
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
                    disabled={!formData.description.trim()}
                >
                    Save
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default EventStampFormModal; 