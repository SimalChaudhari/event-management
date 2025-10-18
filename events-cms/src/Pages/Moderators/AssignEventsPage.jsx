import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Button, Row, Col, Container, Badge } from 'react-bootstrap';
import Select from 'react-select';
import { getModeratorById, assignModeratorToMultipleEvents, getModeratorEvents } from '../../store/actions/moderatorActions';
import * as eventActions from '../../store/actions/eventActions';
import { toast } from 'react-toastify';

const AssignEventsPage = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { id } = useParams();

    const { selectedModerator } = useSelector((state) => state.moderator);
    const { event: events } = useSelector((state) => state.event);

    const [selectedEventIds, setSelectedEventIds] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    const [currentAssignedEvents, setCurrentAssignedEvents] = useState([]);

    useEffect(() => {
        if (id) {
            dispatch(getModeratorById(id));
            dispatch(getModeratorEvents(id));
        }
        dispatch(eventActions.eventList());
    }, [dispatch, id]);

    useEffect(() => {
        if (selectedModerator && selectedModerator.moderatorEvents) {
            const assignedEventIds = selectedModerator.moderatorEvents.map(me => me.eventId);
            setCurrentAssignedEvents(assignedEventIds);
            setSelectedEventIds(assignedEventIds);
        }
    }, [selectedModerator]);

    const handleEventChange = (selectedOptions) => {
        const ids = selectedOptions ? selectedOptions.map(option => option.value) : [];
        setSelectedEventIds(ids);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (selectedEventIds.length === 0) {
            toast.error('Please select at least one event');
            return;
        }

        setSubmitting(true);

        try {
            const result = await dispatch(assignModeratorToMultipleEvents(id, selectedEventIds));
            
            if (result.success) {
                navigate('/moderators');
            }
        } catch (error) {
            console.error('Error assigning events:', error);
        } finally {
            setSubmitting(false);
        }
    };

    const handleNavigate = () => {
        navigate('/moderators');
    };

    // Create event options
    const eventList = events?.events || [];
    const eventOptions = eventList.map(event => ({
        value: event.id,
        label: event.name
    }));

    const selectedEventOptions = eventOptions.filter(option => selectedEventIds.includes(option.value));

    return (
        <>
            <style jsx>{`
                .react-select__menu {
                    z-index: 9999 !important;
                }
                .react-select__menu-portal {
                    z-index: 9999 !important;
                }
                .react-select__control {
                    font-size: 14px;
                }
            `}</style>
            <Container fluid>
                <div className="row">
                    <div className="col-12">
                        <div className="card">
                            <div className="card-header">
                                <div className="d-flex justify-content-between align-items-center">
                                    <h4 className="card-title">
                                        Assign Events to Moderator
                                    </h4>
                                    <Button variant="secondary" onClick={handleNavigate}>
                                        <i style={{ marginRight: '10px' }} className="fas fa-arrow-left me-2"></i>
                                        Back
                                    </Button>
                                </div>
                            </div>
                            <div className="card-body">
                                {selectedModerator && (
                                    <div className="mb-4 p-3 bg-light rounded">
                                        <h6 className="mb-2">
                                            <i className="feather icon-user mr-2"></i>
                                            Moderator: <strong>{selectedModerator.name}</strong>
                                        </h6>
                                        <p className="mb-0 text-muted">
                                            <i className="feather icon-mail mr-2"></i>
                                            {selectedModerator.email}
                                        </p>
                                        {currentAssignedEvents.length > 0 && (
                                            <p className="mb-0 mt-2">
                                                <Badge bg="info">
                                                    Currently assigned to {currentAssignedEvents.length} event(s)
                                                </Badge>
                                            </p>
                                        )}
                                    </div>
                                )}

                                <form onSubmit={handleSubmit}>
                                    <Row>
                                        <Col sm={12}>
                                            <div className="form-group fill">
                                                <label className="floating-label" 
                                                style={{ marginTop: '-8px' }}
                                                htmlFor="events">
                                                    Select Events <span className="text-danger">*</span>
                                                </label>
                                                <Select
                                                    options={eventOptions}
                                                    value={selectedEventOptions}
                                                    onChange={handleEventChange}
                                                    placeholder="Select events..."
                                                    isMulti
                                                    isSearchable
                                                    styles={{
                                                        control: (base) => ({
                                                            ...base,
                                                            fontSize: '14px',
                                                        }),
                                                        menu: (base) => ({
                                                            ...base,
                                                            zIndex: 9999
                                                        })
                                                    }}
                                                />
                                                <small className="form-text text-muted">
                                                    Select one or more events to assign to this moderator
                                                </small>
                                            </div>
                                        </Col>
                                    </Row>

                                    <Row>
                                        <Col sm={12}>
                                            <div className="d-flex justify-content-between gap-2 mt-4">
                                                <Button 
                                                    variant="danger" 
                                                    onClick={handleNavigate}
                                                    disabled={submitting}
                                                >
                                                    Cancel
                                                </Button>
                                                <Button 
                                                    variant="primary" 
                                                    type="submit"
                                                    disabled={submitting || selectedEventIds.length === 0}
                                                >
                                                    {submitting ? 'Assigning...' : 'Assign Events'}
                                                </Button>
                                            </div>
                                        </Col>
                                    </Row>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </Container>
        </>
    );
};

export default AssignEventsPage;

