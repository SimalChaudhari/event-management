import React from 'react';
import { Button, Row, Col, Badge, Form } from 'react-bootstrap';
import SettingsEditor from '../../App/components/CkEditor/SettingsEditor';
import FormRightSidebar from '../common/FormRightSidebar';

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

    const title = isViewMode ? 'Track Details' : currentTrack ? 'Edit Track' : 'Add Track';

    const handleSave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        onSubmit(e);
    };

    const footer = isViewMode ? (
        <Button type="button" variant="danger" onClick={onHide}>
            Close
        </Button>
    ) : (
        <>
            <Button type="button" variant="danger" onClick={onHide}>
                Cancel
            </Button>
            <Button
                type="button"
                variant="primary"
                onClick={handleSave}
                disabled={isLoading || !trackForm.title?.trim()}
            >
                {isLoading ? 'Saving...' : currentTrack ? 'Update' : 'Save Track'}
            </Button>
        </>
    );

    return (
        <FormRightSidebar show={show} onHide={onHide} title={title} footer={footer} width={560}>
            {isViewMode ? (
                currentTrack && (
                    <Row>
                        <Col sm={12} className="mb-2">
                            <div className="form-group mb-0">
                                <label
                                    className="font-weight-bold"
                                    style={{ color: '#333', marginBottom: '3px', fontSize: '14px' }}
                                >
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
                                <label
                                    className="font-weight-bold"
                                    style={{ color: '#333', marginBottom: '3px', fontSize: '14px' }}
                                >
                                    Description
                                </label>
                                <div
                                    style={{
                                        fontSize: '14px',
                                        padding: '4px 0 0 0',
                                        minHeight: '24px',
                                        lineHeight: '1.6'
                                    }}
                                    dangerouslySetInnerHTML={{
                                        __html: currentTrack.description || 'No description available'
                                    }}
                                />
                            </div>
                        </Col>
                        <Col sm={12}>
                            <hr style={{ margin: '10px 0', borderTop: '1px solid #dee2e6' }} />
                        </Col>
                        <Col sm={12} className="mb-2">
                            <div className="form-group mb-0">
                                <label
                                    className="font-weight-bold"
                                    style={{ color: '#333', marginBottom: '3px', fontSize: '14px' }}
                                >
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
                                <label
                                    className="font-weight-bold"
                                    style={{ color: '#333', marginBottom: '3px', fontSize: '14px' }}
                                >
                                    Sessions Count
                                </label>
                                <div style={{ padding: '4px 0 0 0', minHeight: '24px' }}>
                                    <Badge variant="info">
                                        {(trackSessions[currentTrack.id] || []).length}{' '}
                                        {(trackSessions[currentTrack.id] || []).length === 1 ? 'Session' : 'Sessions'}
                                    </Badge>
                                </div>
                            </div>
                        </Col>
                    </Row>
                )
            ) : (
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
                        <div className="form-group" style={{ marginTop: '10px' }}>
                            <label
                                htmlFor="trackDescription"
                                style={{
                                    display: 'block',
                                    marginBottom: '10px',
                                    fontSize: '0.875rem',
                                    fontWeight: '500',
                                    color: '#4680ff'
                                }}
                            >
                                Description
                            </label>
                            <hr style={{ margin: '10px 0 15px 0', borderTop: '1px solid #dee2e6' }} />
                            <SettingsEditor
                                data={trackForm.description || ''}
                                onChange={(event, editor) => {
                                    setTrackForm({ ...trackForm, description: editor.getData() });
                                }}
                                placeholder="Enter track description"
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
        </FormRightSidebar>
    );
};

export default TrackModal;
