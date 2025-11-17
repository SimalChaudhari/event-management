import React from 'react';
import { Modal, Button, Row, Col, Badge, Form } from 'react-bootstrap';

const TrackModal = ({
    show,
    onHide,
    trackForm,
    setTrackForm,
    currentTrack,
    isLoading,
    onSubmit,
    mode = 'edit', // 'edit' or 'view'
    trackSessions = {}
}) => {
    const isViewMode = mode === 'view';

    return (
        <Modal 
            show={show} 
            onHide={onHide} 
            size="lg"
            centered
            backdrop={false}
            keyboard={false}
            style={{ zIndex: 9999 }}
        >
            <Modal.Header>
                <Modal.Title>
                    {isViewMode ? 'Track Details' : (currentTrack ? 'Edit Track' : 'Add Track')}
                </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {isViewMode ? (
                    // View Mode
                    currentTrack && (
                        <Row>
                            <Col sm={12} className="mb-2">
                                <div className="form-group mb-0">
                                    <label className="font-weight-bold" style={{ color: '#333', marginBottom: '3px', fontSize: '14px' }}>
                                        Track Title
                                    </label>
                                    <div style={{ fontSize: '16px', padding: '4px 0 0 0', minHeight: '24px' }}>
                                        {currentTrack.title || 'N/A'}
                                    </div>
                                </div>
                            </Col>
                            <Col sm={12}>
                                <hr style={{ margin: '10px 0', borderTop: '1px solid #dee2e6' }} />
                            </Col>
                            <Col sm={12} className="mb-2">
                                <div className="form-group mb-0">
                                    <label className="font-weight-bold" style={{ color: '#333', marginBottom: '3px', fontSize: '14px' }}>
                                        Description
                                    </label>
                                    <div style={{ fontSize: '14px', padding: '4px 0 0 0', whiteSpace: 'pre-wrap', minHeight: '24px' }}>
                                        {currentTrack.description || 'No description available'}
                                    </div>
                                </div>
                            </Col>
                            <Col sm={12}>
                                <hr style={{ margin: '10px 0', borderTop: '1px solid #dee2e6' }} />
                            </Col>
                            <Col sm={12} className="mb-2">
                                <div className="form-group mb-0">
                                    <label className="font-weight-bold" style={{ color: '#333', marginBottom: '3px', fontSize: '14px' }}>
                                        Status
                                    </label>
                                    <div style={{ padding: '4px 0 0 0', minHeight: '24px' }}>
                                        <Badge variant={currentTrack.isActive ? 'success' : 'secondary'}>
                                            {currentTrack.isActive ? 'Active' : 'Inactive'}
                                        </Badge>
                                    </div>
                                </div>
                            </Col>
                            <Col sm={12}>
                                <hr style={{ margin: '10px 0', borderTop: '1px solid #dee2e6' }} />
                            </Col>
                            <Col sm={12} className="mb-2">
                                <div className="form-group mb-0">
                                    <label className="font-weight-bold" style={{ color: '#333', marginBottom: '3px', fontSize: '14px' }}>
                                        Sessions Count
                                    </label>
                                    <div style={{ padding: '4px 0 0 0', minHeight: '24px' }}>
                                        <Badge variant="info">
                                            {(trackSessions[currentTrack.id] || []).length} {(trackSessions[currentTrack.id] || []).length === 1 ? 'Session' : 'Sessions'}
                                        </Badge>
                                    </div>
                                </div>
                            </Col>
                        </Row>
                    )
                ) : (
                    // Edit/Add Mode
                    <Row>
                        <Col sm={12}>
                            <div className="form-group fill">
                                <label className="floating-label" htmlFor="trackTitle">
                                    Track Title <span style={{ color: '#dc3545' }}>*</span>
                                </label>
                                <input
                                    type="text"
                                    className="form-control"
                                    id="trackTitle"
                                    placeholder="Enter track title"
                                    value={trackForm.title}
                                    onChange={(e) => setTrackForm({ ...trackForm, title: e.target.value })}
                                    required
                                />
                            </div>
                        </Col>
                        <Col sm={12}>
                            <div className="form-group fill">
                                <label className="floating-label" htmlFor="trackDescription">
                                    Description
                                </label>
                                <textarea
                                    className="form-control"
                                    id="trackDescription"
                                    placeholder="Enter track description"
                                    value={trackForm.description}
                                    onChange={(e) => setTrackForm({ ...trackForm, description: e.target.value })}
                                    rows={6}
                                />
                            </div>
                        </Col>
                        <Col sm={12}>
                            <div className="form-group fill">
                                <Form.Check
                                    type="checkbox"
                                    label="Active"
                                    checked={trackForm.isActive}
                                    onChange={(e) => setTrackForm({ ...trackForm, isActive: e.target.checked })}
                                />
                            </div>
                        </Col>
                    </Row>
                )}
            </Modal.Body>
            <Modal.Footer>
                <Button variant="danger" onClick={onHide}>
                    {isViewMode ? 'Close' : 'Cancel'}
                </Button>
                {!isViewMode && (
                    <Button 
                        variant="primary" 
                        onClick={onSubmit} 
                        disabled={isLoading || !trackForm.title?.trim()}
                    >
                        {isLoading ? 'Saving...' : currentTrack ? 'Update' : 'Save Track'}
                    </Button>
                )}
            </Modal.Footer>
        </Modal>
    );
};

export default TrackModal;

