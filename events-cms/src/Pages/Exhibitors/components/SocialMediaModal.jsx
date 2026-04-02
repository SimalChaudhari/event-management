import React from 'react';
import { Modal, Button, Row, Col } from 'react-bootstrap';

const SocialMediaModal = ({ show, onHide, socialMediaData, setSocialMediaData, onSave }) => {
    return (
        <Modal
            show={show}
            onHide={onHide}
            size="lg"
            centered
        >
            <Modal.Header closeButton>
                <Modal.Title>
                    <i className="fas fa-share-alt" style={{ marginRight: '10px' }}></i>
                    Social Media Links
                </Modal.Title>
            </Modal.Header>
            <Modal.Body style={{ padding: '20px' }}>
                <div style={{ marginBottom: '20px' }}>
                    <Button
                        variant="success"
                        size="sm"
                        onClick={() => {
                            setSocialMediaData([...socialMediaData, { platform: '', icon: '', link: '' }]);
                        }}
                    >
                        <i className="fas fa-plus" style={{ marginRight: '8px' }}></i>
                        Add Social Media Link
                    </Button>
                </div>

                {socialMediaData.length === 0 ? (
                    <div style={{ 
                        textAlign: 'center', 
                        padding: '40px 20px',
                        backgroundColor: '#f8f9fa',
                        borderRadius: '8px',
                        border: '1px dashed #dee2e6'
                    }}>
                        <i className="fas fa-share-alt fa-3x text-muted mb-3"></i>
                        <p className="text-muted mb-0">No social media links added. Click "Add Social Media Link" to add one.</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {socialMediaData.map((item, index) => (
                            <div
                                key={index}
                                style={{
                                    border: '1px solid #dee2e6',
                                    borderRadius: '8px',
                                    padding: '20px',
                                    backgroundColor: '#fff',
                                    position: 'relative'
                                }}
                            >
                                <div style={{ 
                                    display: 'flex', 
                                    justifyContent: 'space-between', 
                                    alignItems: 'center',
                                    marginBottom: '15px'
                                }}>
                                    <h6 style={{ margin: 0, fontWeight: '600', color: '#495057' }}>
                                        Social Media Link #{index + 1}
                                    </h6>
                                    <Button
                                        variant="danger"
                                        size="sm"
                                        onClick={() => {
                                            setSocialMediaData(socialMediaData.filter((_, i) => i !== index));
                                        }}
                                    >
                                        <i className="fas fa-trash" style={{ marginRight: '5px' }}></i>
                                        Delete
                                    </Button>
                                </div>
                                <Row>
                                    <Col sm={12} className="mb-3">
                                        <label className="form-label" style={{ fontSize: '14px', fontWeight: '500', marginBottom: '8px', display: 'block' }}>
                                            Platform Name <span style={{ color: 'red' }}>*</span>
                                        </label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={item.platform || ''}
                                            onChange={(e) => {
                                                const newData = [...socialMediaData];
                                                newData[index] = { ...newData[index], platform: e.target.value };
                                                setSocialMediaData(newData);
                                            }}
                                            placeholder="e.g., Facebook, Instagram, Twitter, YouTube, LinkedIn, etc."
                                            required
                                            style={{ padding: '10px' }}
                                        />
                                    </Col>
                                    <Col sm={6} className="mb-3">
                                        <label className="form-label" style={{ fontSize: '14px', fontWeight: '500', marginBottom: '8px', display: 'block' }}>
                                            Link <span style={{ color: 'red' }}>*</span>
                                        </label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={item.link || ''}
                                            onChange={(e) => {
                                                const newData = [...socialMediaData];
                                                newData[index] = { ...newData[index], link: e.target.value };
                                                setSocialMediaData(newData);
                                            }}
                                            placeholder="https://example.com/yourpage"
                                            required
                                            style={{ padding: '10px' }}
                                        />
                                    </Col>
                                    <Col sm={6} className="mb-3">
                                        <label className="form-label" style={{ fontSize: '14px', fontWeight: '500', marginBottom: '8px', display: 'block' }}>
                                            Icon URL (Optional)
                                        </label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={item.icon || ''}
                                            onChange={(e) => {
                                                const newData = [...socialMediaData];
                                                newData[index] = { ...newData[index], icon: e.target.value };
                                                setSocialMediaData(newData);
                                            }}
                                            placeholder="Icon URL or leave empty for default icon"
                                            style={{ padding: '10px' }}
                                        />
                                    </Col>
                                </Row>
                            </div>
                        ))}
                    </div>
                )}
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onHide}>
                    Cancel
                </Button>
                <Button
                    variant="primary"
                    onClick={onSave}
                >
                    Save Social Media Links
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default SocialMediaModal;

