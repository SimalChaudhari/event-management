import React, { useState, useEffect } from 'react';
import { Modal, Button, Row, Col, Alert } from 'react-bootstrap';
import { useSelector, useDispatch } from 'react-redux';
import { createRegisterEvent, eventList } from '../../../../store/actions/eventActions';
import { userList } from '../../../../store/actions/userActions';

const AddRegisterEventModal = ({ show, onHide }) => {
    const dispatch = useDispatch();
    const events = useSelector((state) => state.event?.event?.events || []);
    const users = useSelector((state) => state.user?.user?.data || []);
    const [formData, setFormData] = useState({
        userId: '',
        eventId: '',
        type: 'Attendee',
        registerCode: '',
        isCreatedByAdmin: true
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        if (show) {
            dispatch(eventList({}));
            dispatch(userList());
        }
    }, [show, dispatch]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const response = await dispatch(createRegisterEvent(formData));
            // Here you would call your API to create register event
            if (response) {
                setFormData('');
                onHide();
            } 
        } catch (err) {
            setError('An error occurred while creating register event');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setFormData('');
        onHide();
    };

    return (
        <Modal show={show} onHide={handleClose} size="lg">
            <form onSubmit={handleSubmit}>
                <Modal.Header>
                    <Modal.Title as="h5">Add Register Event</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {error && <Alert variant="danger">{error}</Alert>}
                    {success && <Alert variant="success">{success}</Alert>}

                    <Row>
                        <Col sm={6}>
                            <div className="form-group fill">
                                <label className="floating-label" htmlFor="userId">
                                    Select User
                                </label>
                                <select
                                    className="form-control"
                                    name="userId"
                                    value={formData.userId}
                                    onChange={handleInputChange}
                                    required
                                >
                                    <option value="">Select a user</option>
                                    {users.map((user) => (
                                        <option key={user.id} value={user.id}>
                                            {user.firstName} {user.lastName} - {user.email}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </Col>

                        <Col sm={6}>
                            <div className="form-group fill">
                                <label className="floating-label" htmlFor="eventId">
                                    Select Event
                                </label>
                                <select
                                    className="form-control"
                                    name="eventId"
                                    value={formData.eventId}
                                    onChange={handleInputChange}
                                    required
                                >
                                    <option value="">Select an event</option>
                                    {events.map((event) => (
                                        <option key={event.id} value={event.id}>
                                            {event.name} - {new Date(event.startDate).toLocaleDateString()}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </Col>

                        <Col sm={6}>
                            <div className="form-group fill">
                                <label className="floating-label" htmlFor="type">
                                    Registration Type
                                </label>
                                <select className="form-control" name="type" value={formData.type} onChange={handleInputChange} required>
                                    <option value="Attendee">Attendee</option>
                                    <option value="Exhibitor">Exhibitor</option>
                                </select>
                            </div>
                        </Col>

                        <Col sm={6}>
                            <div className="form-group fill">
                                <label className="floating-label" htmlFor="registerCode">
                                    Register Code
                                </label>
                                <input
                                    type="text"
                                    className="form-control"
                                    name="registerCode"
                                    value={formData.registerCode}
                                    onChange={handleInputChange}
                                    placeholder="Enter register code (optional for admin)"
                                />
                            </div>
                        </Col>
                    </Row>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="danger" onClick={handleClose}>
                        Cancel
                    </Button>
                    <Button variant="primary" type="submit" disabled={loading || !formData.userId || !formData.eventId}>
                        {loading ? 'Creating...' : 'Create Register Event'}
                    </Button>
                </Modal.Footer>
            </form>
        </Modal>
    );
};

export default AddRegisterEventModal;
