import React, { useState, useEffect } from 'react';
import { Button, Row, Col, Card, Container, Alert } from 'react-bootstrap';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { createRegisterEvent, eventList } from '../../../store/actions/eventActions';
import { userList } from '../../../store/actions/userActions';

const AddRegisterEventPage = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
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
        dispatch(eventList({}));
        dispatch(userList());
    }, [dispatch]);

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
            if (response) {
                setSuccess('Register Event created successfully!');
                setFormData({
                    userId: '',
                    eventId: '',
                    type: 'Attendee',
                    registerCode: '',
                    isCreatedByAdmin: true
                });
                setTimeout(() => {
                    navigate('/events/registered');
                }, 2000);
            } 
        } catch (err) {
            setError('An error occurred while creating register event');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        navigate('/events/registered');
    };

    return (
        <Container fluid>
            <div className="row">
                <div className="col-12">
                    <div className="card">
                        <div className="card-header">
                            <div className="d-flex justify-content-between align-items-center">
                                <h4 className="card-title">Add Register Event</h4>
                                <Button 
                                    variant="secondary" 
                                    onClick={handleCancel}
                                >
                                    <i style={{marginRight: '10px'}} className="fas fa-arrow-left me-2"></i>
                                    Back to Registered Events
                                </Button>
                            </div>
                        </div>
                        <div className="card-body">
                            {error && <Alert variant="danger">{error}</Alert>}
                            {success && <Alert variant="success">{success}</Alert>}

                            <form onSubmit={handleSubmit}>
                                <Row>
                                    <Col sm={12}>
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

                                    <Col sm={12}>
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

                                    <Col sm={12}>
                                        <div className="form-group fill">
                                            <label className="floating-label" htmlFor="type">
                                                Registration Type
                                            </label>
                                            <select 
                                                className="form-control" 
                                                name="type" 
                                                value={formData.type} 
                                                onChange={handleInputChange} 
                                                required
                                            >
                                                <option value="Attendee">Attendee</option>
                                                <option value="Exhibitor">Exhibitor</option>
                                            </select>
                                        </div>
                                    </Col>

                                    <Col sm={12}>
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
                                
                                {/* Form Actions */}
                                <div className="row mt-4">
                                    <div className="col-12">
                                        <div className="d-flex justify-content-between gap-2">
                                            <Button 
                                                variant="secondary" 
                                                onClick={handleCancel}
                                            >
                                                Cancel
                                            </Button>
                                            <Button 
                                                variant="primary" 
                                                type="submit" 
                                                disabled={loading || !formData.userId || !formData.eventId}
                                            >
                                                {loading ? 'Creating...' : 'Create Register Event'}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </Container>
    );
};

export default AddRegisterEventPage; 