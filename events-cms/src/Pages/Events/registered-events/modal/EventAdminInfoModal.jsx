import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Row, Col, Alert } from 'react-bootstrap';

const EventAdminInfoModal = ({ show, onHide, eventId, eventName, onSave, initialData }) => {
    const [luckyDrawDateTime, setLuckyDrawDateTime] = useState('');
    const [additionalInformation, setAdditionalInformation] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (initialData) {
            setLuckyDrawDateTime(initialData.luckyDrawDateTime || '');
            setAdditionalInformation(initialData.additionalInformation || '');
        } else {
            setLuckyDrawDateTime('');
            setAdditionalInformation('');
        }
    }, [initialData, show]);

    const handleSave = async () => {
        setError('');
        setSaving(true);

        try {
            const data = {
                luckyDrawDateTime: luckyDrawDateTime || null,
                additionalInformation: additionalInformation || null
            };

            await onSave(eventId, data);
            handleClose();
        } catch (err) {
            setError(err.message || 'Failed to save admin information');
        } finally {
            setSaving(false);
        }
    };

    const handleClose = () => {
        setLuckyDrawDateTime('');
        setAdditionalInformation('');
        setError('');
        onHide();
    };

    // Format date for datetime-local input (YYYY-MM-DDTHH:mm)
    const formatDateTimeForInput = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    return (
        <Modal
            show={show}
            onHide={handleClose}
            size="lg"
            centered
        >
            <Modal.Header>
                <Modal.Title>
                    <i className="feather icon-info mr-2 text-primary"></i>
                    Event Admin Information
                </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {eventName && (
                    <Alert variant="info" className="mb-3">
                        <strong>Event:</strong> {eventName}
                    </Alert>
                )}

                {error && (
                    <Alert variant="danger" className="mb-3">
                        <i className="feather icon-alert-circle mr-2"></i>
                        {error}
                    </Alert>
                )}

                <Form>
                    <Row>
                        <Col md={12}>
                            <Form.Group className="mb-3">
                                <Form.Label>
                                    Lucky Draw Date/Time <span className="text-muted">(Optional)</span>
                                </Form.Label>
                                <Form.Control
                                    type="datetime-local"
                                    value={luckyDrawDateTime ? formatDateTimeForInput(luckyDrawDateTime) : ''}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        if (value) {
                                            // Convert to ISO string
                                            const date = new Date(value);
                                            setLuckyDrawDateTime(date.toISOString());
                                        } else {
                                            setLuckyDrawDateTime('');
                                        }
                                    }}
                                    placeholder="Select date and time"
                                />
                                <Form.Text className="text-muted">
                                    This will be applied to all registrations for this event
                                </Form.Text>
                            </Form.Group>
                        </Col>
                    </Row>

                    <Row>
                        <Col md={12}>
                            <Form.Group className="mb-3">
                                <Form.Label>
                                    Additional Information <span className="text-muted">(Optional)</span>
                                </Form.Label>
                                <Form.Control
                                    as="textarea"
                                    rows={4}
                                    value={additionalInformation}
                                    onChange={(e) => setAdditionalInformation(e.target.value)}
                                    placeholder="Enter additional information for this event"
                                />
                                <Form.Text className="text-muted">
                                    This will be applied to all registrations for this event
                                </Form.Text>
                            </Form.Group>
                        </Col>
                    </Row>
                </Form>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={handleClose} disabled={saving}>
                    <i className="feather icon-x mr-1"></i>
                    Cancel
                </Button>
                <Button variant="primary" onClick={handleSave} disabled={saving}>
                    {saving ? (
                        <>
                            <span className="spinner-border spinner-border-sm mr-1" role="status" aria-hidden="true"></span>
                            Saving...
                        </>
                    ) : (
                        <>
                            <i className="feather icon-save mr-1"></i>
                            Save
                        </>
                    )}
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default EventAdminInfoModal;

