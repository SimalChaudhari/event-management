import React from 'react';
import { Modal, Button, Row, Col, Badge, Form } from 'react-bootstrap';
import Select from 'react-select';

const SessionModal = ({
    show,
    onHide,
    sessionForm,
    setSessionForm,
    currentSession,
    currentTrack,
    speakerList = [],
    isLoading,
    onSubmit,
    mode = 'edit', // 'edit' or 'view'
    formatTime
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
                    {isViewMode ? 'Session Details' : (currentSession ? 'Edit Session' : 'Add Session')}
                </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {isViewMode ? (
                    // View Mode
                    currentSession && (
                        <Row>
                            <Col sm={12} className="mb-2">
                                <div className="form-group mb-0">
                                    <label className="font-weight-bold" style={{ color: '#333', marginBottom: '3px', fontSize: '14px' }}>
                                        Session Title
                                    </label>
                                    <div style={{ fontSize: '16px', padding: '4px 0 0 0', minHeight: '24px' }}>
                                        {currentSession.title || 'N/A'}
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
                                        {currentSession.description || 'No description available'}
                                    </div>
                                </div>
                            </Col>
                            <Col sm={12}>
                                <hr style={{ margin: '10px 0', borderTop: '1px solid #dee2e6' }} />
                            </Col>
                            <Col md={4} className="mb-2">
                                <div className="form-group mb-0">
                                    <label className="font-weight-bold" style={{ color: '#333', marginBottom: '3px', fontSize: '14px' }}>
                                        Session Date
                                    </label>
                                    <div style={{ padding: '4px 0 0 0', minHeight: '24px' }}>
                                        {currentSession.sessionDate 
                                            ? new Date(currentSession.sessionDate).toLocaleDateString() 
                                            : 'N/A'}
                                    </div>
                                </div>
                            </Col>
                            <Col md={4} className="mb-2">
                                <div className="form-group mb-0">
                                    <label className="font-weight-bold" style={{ color: '#333', marginBottom: '3px', fontSize: '14px' }}>
                                        Start Time
                                    </label>
                                    <div style={{ padding: '4px 0 0 0', minHeight: '24px' }}>
                                        {currentSession.startTime && formatTime ? formatTime(currentSession.startTime) : (currentSession.startTime || 'N/A')}
                                    </div>
                                </div>
                            </Col>
                            <Col md={4} className="mb-2">
                                <div className="form-group mb-0">
                                    <label className="font-weight-bold" style={{ color: '#333', marginBottom: '3px', fontSize: '14px' }}>
                                        End Time
                                    </label>
                                    <div style={{ padding: '4px 0 0 0', minHeight: '24px' }}>
                                        {currentSession.endTime && formatTime ? formatTime(currentSession.endTime) : (currentSession.endTime || 'N/A')}
                                    </div>
                                </div>
                            </Col>
                            <Col sm={12}>
                                <hr style={{ margin: '10px 0', borderTop: '1px solid #dee2e6' }} />
                            </Col>
                            <Col sm={12} className="mb-2">
                                <div className="form-group mb-0">
                                    <label className="font-weight-bold" style={{ color: '#333', marginBottom: '3px', fontSize: '14px' }}>
                                        Venue
                                    </label>
                                    <div style={{ padding: '4px 0 0 0', minHeight: '24px' }}>
                                        {currentSession.venue || 'N/A'}
                                    </div>
                                </div>
                            </Col>
                            <Col sm={12}>
                                <hr style={{ margin: '10px 0', borderTop: '1px solid #dee2e6' }} />
                            </Col>
                            <Col sm={12} className="mb-2">
                                <div className="form-group mb-0">
                                    <label className="font-weight-bold" style={{ color: '#333', marginBottom: '3px', fontSize: '14px' }}>
                                        Speakers
                                    </label>
                                    <div style={{ padding: '4px 0 0 0', minHeight: '24px' }}>
                                        {currentSession.speakers && currentSession.speakers.length > 0 ? (
                                            <div>
                                                {currentSession.speakers.map((speaker, idx) => (
                                                    <Badge 
                                                        key={speaker.id || speaker || idx} 
                                                        variant="primary" 
                                                        className="mr-2 mb-1"
                                                        style={{ fontSize: '12px', padding: '6px 10px' }}
                                                    >
                                                        {speaker.name || (speaker.firstName ? `${speaker.firstName} ${speaker.lastName || ''}`.trim() : 'Speaker') || speaker.email || `Speaker ${idx + 1}`}
                                                    </Badge>
                                                ))}
                                            </div>
                                        ) : (
                                            <span className="text-muted">No speakers assigned</span>
                                        )}
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
                                        <Badge variant={currentSession.isActive ? 'success' : 'secondary'}>
                                            {currentSession.isActive ? 'Active' : 'Inactive'}
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
                                        Polling
                                    </label>
                                    <div style={{ padding: '4px 0 0 0', minHeight: '24px' }}>
                                        <Badge variant={currentSession.enablePolling ? 'success' : 'secondary'}>
                                            {currentSession.enablePolling ? 'Enabled' : 'Disabled'}
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
                                        Q&A
                                    </label>
                                    <div style={{ padding: '4px 0 0 0', minHeight: '24px' }}>
                                        <Badge variant={currentSession.enableQna ? 'success' : 'secondary'}>
                                            {currentSession.enableQna ? 'Enabled' : 'Disabled'}
                                        </Badge>
                                    </div>
                                </div>
                            </Col>
                            {currentTrack && (
                                <>
                                    <Col sm={12}>
                                        <hr style={{ margin: '10px 0', borderTop: '1px solid #dee2e6' }} />
                                    </Col>
                                    <Col sm={12} className="mb-2">
                                        <div className="form-group mb-0">
                                            <label className="font-weight-bold" style={{ color: '#333', marginBottom: '3px', fontSize: '14px' }}>
                                                Track
                                            </label>
                                            <div style={{ padding: '4px 0 0 0', minHeight: '24px' }}>
                                                {currentTrack.title || 'N/A'}
                                            </div>
                                        </div>
                                    </Col>
                                </>
                            )}
                        </Row>
                    )
                ) : (
                    // Edit/Add Mode
                    <Row>
                        <Col sm={12}>
                            <div className="form-group fill">
                                <label className="floating-label" htmlFor="sessionTitle">
                                    Session Title <span style={{ color: '#dc3545' }}>*</span>
                                </label>
                                <input
                                    type="text"
                                    className="form-control"
                                    id="sessionTitle"
                                    placeholder="Enter session title"
                                    value={sessionForm.title}
                                    onChange={(e) => setSessionForm({ ...sessionForm, title: e.target.value })}
                                    required
                                />
                            </div>
                        </Col>
                        <Col sm={12}>
                            <div className="form-group fill">
                                <label className="floating-label" htmlFor="sessionDescription">
                                    Description
                                </label>
                                <textarea
                                    className="form-control"
                                    id="sessionDescription"
                                    placeholder="Enter session description"
                                    value={sessionForm.description}
                                    onChange={(e) => setSessionForm({ ...sessionForm, description: e.target.value })}
                                    rows={3}
                                />
                            </div>
                        </Col>
                        <Col md={6}>
                            <div className="form-group fill">
                                <label className="floating-label" htmlFor="sessionDate">
                                    Session Date <span style={{ color: '#dc3545' }}>*</span>
                                </label>
                                <input
                                    type="date"
                                    className="form-control"
                                    id="sessionDate"
                                    value={sessionForm.sessionDate}
                                    onChange={(e) => setSessionForm({ ...sessionForm, sessionDate: e.target.value })}
                                    required
                                />
                            </div>
                        </Col>
                        <Col md={3}>
                            <div className="form-group fill">
                                <label className="floating-label" htmlFor="startTime">
                                    Start Time <span style={{ color: '#dc3545' }}>*</span>
                                </label>
                                <input
                                    type="time"
                                    className="form-control"
                                    id="startTime"
                                    value={sessionForm.startTime}
                                    onChange={(e) => setSessionForm({ ...sessionForm, startTime: e.target.value })}
                                    required
                                />
                            </div>
                        </Col>
                        <Col md={3}>
                            <div className="form-group fill">
                                <label className="floating-label" htmlFor="endTime">
                                    End Time <span style={{ color: '#dc3545' }}>*</span>
                                </label>
                                <input
                                    type="time"
                                    className="form-control"
                                    id="endTime"
                                    value={sessionForm.endTime}
                                    onChange={(e) => setSessionForm({ ...sessionForm, endTime: e.target.value })}
                                    required
                                />
                            </div>
                        </Col>
                        <Col sm={12}>
                            <div className="form-group fill">
                                <label className="floating-label" htmlFor="venue">
                                    Venue
                                </label>
                                <input
                                    type="text"
                                    className="form-control"
                                    id="venue"
                                    placeholder="Enter venue"
                                    value={sessionForm.venue}
                                    onChange={(e) => setSessionForm({ ...sessionForm, venue: e.target.value })}
                                />
                            </div>
                        </Col>
                        <Col sm={12}>
                            <div className="form-group fill">
                                <label className="floating-label" htmlFor="speakers">
                                    Speakers
                                </label>
                                
                                {/* <small className="text-muted" style={{ display: 'block', marginTop: '5px' }}>  </small> */}
                                {speakerList.length === 0 ? (
                                    <div className="p-2 border rounded" style={{ minHeight: '38px', padding: '8px 12px' }}>
                                        <span className="text-muted">Loading speakers...</span>
                                    </div>
                                ) : (
                                    <>
                                        <Select
                                            isMulti
                                            options={speakerList.map((speaker) => ({
                                                value: speaker.id,
                                                label: `${speaker.firstName || ''} ${speaker.lastName || ''}${speaker.email ? ` - ${speaker.email}` : ''}`.trim() || speaker.email || `Speaker ${speaker.id}`
                                            }))}
                                            value={sessionForm.speakerIds.map(id => {
                                                const speaker = speakerList.find(s => s.id === id || s.id === String(id));
                                                if (!speaker) return null;
                                                return {
                                                    value: speaker.id,
                                                    label: `${speaker.firstName || ''} ${speaker.lastName || ''}${speaker.email ? ` - ${speaker.email}` : ''}`.trim() || speaker.email || `Speaker ${speaker.id}`
                                                };
                                            }).filter(Boolean)}
                                            onChange={(selectedOptions) => {
                                                const selectedIds = selectedOptions ? selectedOptions.map(option => option.value) : [];
                                                setSessionForm({ ...sessionForm, speakerIds: selectedIds });
                                            }}
                                            placeholder="Select speakers..."
                                            isClearable
                                            isSearchable
                                            styles={{
                                                control: (base) => ({
                                                    ...base,
                                                    minHeight: '38px'
                                                }),
                                                menu: (base) => ({
                                                    ...base,
                                                    zIndex: 10000
                                                }),
                                                menuPortal: (base) => ({
                                                    ...base,
                                                    zIndex: 10000
                                                })
                                            }}
                                            menuPortalTarget={document.body}
                                            menuPosition="fixed"
                                        />
                                        <small className="text-muted" style={{ display: 'block', marginTop: '5px' }}>
                                            Select one or more speakers for this session
                                        </small>
                                    </>
                                )}
                            </div>
                        </Col>
                        <Col sm={12}>
                            <div className="form-group fill">
                                <Form.Check
                                    type="checkbox"
                                    label="Active"
                                    checked={sessionForm.isActive}
                                    onChange={(e) => setSessionForm({ ...sessionForm, isActive: e.target.checked })}
                                />
                            </div>
                        </Col>
                        <Col sm={12}>
                            <div className="form-group fill">
                                <Form.Check
                                    type="checkbox"
                                    label="Enable Polling"
                                    checked={sessionForm.enablePolling || false}
                                    onChange={(e) => setSessionForm({ ...sessionForm, enablePolling: e.target.checked })}
                                />
                                <small className="text-muted" style={{ display: 'block', marginTop: '5px' }}>
                                    When enabled, polling will be activated on the front end for this session
                                </small>
                            </div>
                        </Col>
                        <Col sm={12}>
                            <div className="form-group fill">
                                <Form.Check
                                    type="checkbox"
                                    label="Enable Q&A"
                                    checked={sessionForm.enableQna || false}
                                    onChange={(e) => setSessionForm({ ...sessionForm, enableQna: e.target.checked })}
                                />
                                <small className="text-muted" style={{ display: 'block', marginTop: '5px' }}>
                                    When enabled, Q&A will be activated on the front end for this session
                                </small>
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
                        disabled={
                            isLoading || 
                            !sessionForm.title?.trim() || 
                            !sessionForm.sessionDate || 
                            !sessionForm.startTime || 
                            !sessionForm.endTime
                        }
                    >
                        {isLoading ? 'Saving...' : currentSession ? 'Update' : 'Save Session'}
                    </Button>
                )}
            </Modal.Footer>
        </Modal>
    );
};

export default SessionModal;

