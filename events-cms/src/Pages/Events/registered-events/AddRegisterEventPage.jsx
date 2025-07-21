import React, { useState, useEffect } from 'react';
import { Button, Row, Col, Card, Container, Alert } from 'react-bootstrap';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { createRegisterEvent, eventList, adminUpdateRegisterEvent, registerEventById } from '../../../store/actions/eventActions';
import { userList } from '../../../store/actions/userActions';

const AddRegisterEventPage = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { id } = useParams(); // For edit mode
    const events = useSelector((state) => state.event?.event?.events || []);
    const users = useSelector((state) => state.user?.user?.data || []);


    const [formData, setFormData] = useState({
        userId: '',
        eventId: '',
        type: 'Attendee',
        registerCode: '',
        isCreatedByAdmin: true
    });

    console.log(formData);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [currentUser, setCurrentUser] = useState(null);
    const [currentEvent, setCurrentEvent] = useState(null);

    useEffect(() => {
        dispatch(eventList({}));
        dispatch(userList());
    }, [dispatch]);

    // Load data for edit mode
    useEffect(() => {
        if (id) {
            const loadRegisterEventData = async () => {
                try {
                    setLoading(true);
                    const response = await dispatch(registerEventById(id));
                    if (response?.data) {
                        const editData = response.data;

                        console.log(editData.user);
                        
                        // Store current user and event data
                        setCurrentUser(editData.user);
                        setCurrentEvent(editData.event);
                        
                        setFormData({
                            userId: editData.user?.id || '',
                            eventId: editData.event?.id || '',
                            type: editData.type || 'Attendee',
                            registerCode: editData.registerCode || '',
                            isCreatedByAdmin: editData.isCreatedByAdmin || true
                        });
                    }
                } catch (error) {
                    console.error('Error loading register event data:', error);
                    setError('Error loading register event data');
                } finally {
                    setLoading(false);
                }
            };
            loadRegisterEventData();
        }
    }, [id, dispatch]);

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
            let response;
            if (id) {
                // Edit mode - update existing register event
                // Include userId and eventId in the update data
                const updateData = {
                    userId: formData.userId,
                    eventId: formData.eventId,
                    type: formData.type,
                    registerCode: formData.registerCode,
                    isCreatedByAdmin: formData.isCreatedByAdmin
                };
                response = await dispatch(adminUpdateRegisterEvent(id, updateData));
            } else {
                // Create mode - create new register event
                response = await dispatch(createRegisterEvent(formData));
            }
            
            if (response) {
                setSuccess(id ? 'Register Event updated successfully!' : 'Register Event created successfully!');
                if (!id) {
                    setFormData({
                        userId: '',
                        eventId: '',
                        type: 'Attendee',
                        registerCode: '',
                        isCreatedByAdmin: true
                    });
                }
                setTimeout(() => {
                    navigate('/events/registered');
                }, 2000);
            } 
        } catch (err) {
            setError(id ? 'An error occurred while updating register event' : 'An error occurred while creating register event');
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
                                <h4 className="card-title">{id ? 'Edit Register Event' : 'Add Register Event'}</h4>
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

                            {loading && id ? (
                                <div className="text-center">
                                    <div className="spinner-border" role="status">
                                        <span className="visually-hidden">Loading...</span>
                                    </div>
                                    <p className="mt-2">Loading register event data...</p>
                                </div>
                            ) : (
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
                                                            {user.firstName} {user.lastName}
                                                        </option>
                                                    ))}
                                                </select>
                                                {id && currentUser && (
                                                    <small className="text-info">
                                                        Current: {currentUser.firstName} {currentUser.lastName} ({currentUser.email})
                                                    </small>
                                                )}
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
                                                {id && currentEvent && (
                                                    <small className="text-info">
                                                        Current: {currentEvent.name} ({new Date(currentEvent.startDate).toLocaleDateString()})
                                                    </small>
                                                )}
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
                                                    {loading ? (id ? 'Updating...' : 'Creating...') : (id ? 'Update Register Event' : 'Create Register Event')}
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </Container>
    );
};

export default AddRegisterEventPage; 