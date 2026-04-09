import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Button, Row, Col, Container } from 'react-bootstrap';
import Select from 'react-select';
import { createTrack, updateTrack, getAllTracks } from '../../store/actions/programmeActions';
import { eventList } from '../../store/actions/eventActions';
import { toast } from 'react-toastify';
import { PROGRAMME_PATHS } from '../../utils/constants';
import SettingsEditor from '../../App/components/CkEditor/SettingsEditor';

const AddTrackPage = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { id } = useParams();
    const isEditing = Boolean(id);

    const { tracks, loading } = useSelector((state) => state.programme);
    const events = useSelector((state) => state.event?.event?.events);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        isActive: true
    });

    const [selectedEventId, setSelectedEventId] = useState('');
    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        dispatch(eventList());
        if (isEditing) {
            dispatch(getAllTracks());
        }
    }, [dispatch, isEditing]);

    useEffect(() => {
        if (isEditing && tracks && tracks.length > 0) {
            const track = tracks.find(t => t.id === id);
            if (track) {
                setFormData({
                    title: track.title || '',
                    description: track.description || '',
                    isActive: track.isActive !== undefined ? track.isActive : true
                });
                // Set the event ID from the track data
                if (track.eventId && !selectedEventId) {
                    setSelectedEventId(track.eventId);
                }
            }
        }
    }, [isEditing, id, tracks]);

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
        
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const handleEventChange = (eventId) => {
        setSelectedEventId(eventId || '');
        if (errors.eventId) {
            setErrors(prev => ({ ...prev, eventId: '' }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!selectedEventId) {
            newErrors.eventId = 'Please select an event';
        }

        if (!formData.title.trim()) {
            newErrors.title = 'Track title is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            toast.error('Please fix the validation errors');
            return;
        }

        setSubmitting(true);

        try {
            const payload = {
                ...formData
            };

            let result;
            if (isEditing) {
                result = await dispatch(updateTrack(id, payload));
            } else {
                result = await dispatch(createTrack(selectedEventId, payload));
            }

            if (result.success) {
                navigate(PROGRAMME_PATHS.LIST_PROGRAMMES);
            }
        } catch (error) {
            console.error('Error saving track:', error);
        } finally {
            setSubmitting(false);
        }
    };

    const handleNavigate = () => {
        navigate(PROGRAMME_PATHS.LIST_PROGRAMMES);
    };

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
                                        {isEditing ? 'Edit Programme Track' : 'Add New Programme Track'}
                                    </h4>
                                    <Button variant="secondary" onClick={handleNavigate}>
                                        <i style={{ marginRight: '10px' }} className="fas fa-arrow-left me-2"></i>
                                        Back
                                    </Button>
                                </div>
                            </div>
                            <div className="card-body">
                                {loading && isEditing ? (
                                    <div className="text-center py-5">
                                        <div className="spinner-border text-primary" role="status">
                                            <span className="sr-only">Loading...</span>
                                        </div>
                                        <p className="mt-2">Loading track details...</p>
                                    </div>
                                ) : (
                                    <form onSubmit={handleSubmit}>
                                        <Row>
                                            <Col sm={12}>
                                                <div className="form-group fill">
                                                    <label className="floating-label" style={{ marginTop: '-8px' }} htmlFor="eventId">
                                                        Event *
                                                    </label>
                                                    <Select
                                                        value={events?.find(event => event.id === selectedEventId) ? 
                                                            { value: selectedEventId, label: `${events.find(event => event.id === selectedEventId)?.name} - ${events.find(event => event.id === selectedEventId)?.location}` } : null}
                                                        onChange={(selectedOption) => handleEventChange(selectedOption?.value || '')}
                                                        options={events?.map((event) => ({
                                                            value: event.id,
                                                            label: `${event.name} - ${event.location}`
                                                        }))}
                                                        placeholder="Select an event"
                                                        isClearable
                                                        isSearchable
                                                        isDisabled={isEditing}
                                                        menuPortalTarget={document.body}
                                                        menuPosition="fixed"
                                                        styles={{
                                                            control: (base) => ({
                                                                ...base,
                                                                minHeight: '45px',
                                                                border: errors.eventId ? '1px solid #dc3545' : '1px solid #ced4da',
                                                                fontSize: '14px'
                                                            }),
                                                            menu: (base) => ({
                                                                ...base,
                                                                zIndex: 9999,
                                                                fontSize: '14px'
                                                            }),
                                                            menuPortal: (base) => ({
                                                                ...base,
                                                                zIndex: 9999
                                                            })
                                                        }}
                                                    />
                                                    {errors.eventId && (
                                                        <small className="text-danger">{errors.eventId}</small>
                                                    )}
                                                    {isEditing && (
                                                        <small className="text-muted d-block mt-1">
                                                            Event cannot be changed when editing
                                                        </small>
                                                    )}
                                                </div>
                                            </Col>

                                            <Col sm={12}>
                                                <div className="form-group fill">
                                                    <label className="floating-label" htmlFor="title">
                                                        Track Title *
                                                    </label>
                                                    <input
                                                        type="text"
                                                        className={`form-control ${errors.title ? 'is-invalid' : ''}`}
                                                        id="title"
                                                        name="title"
                                                        placeholder="Enter track title (e.g., Main Hall, Workshop Room A)"
                                                        value={formData.title}
                                                        onChange={handleInputChange}
                                                    />
                                                    {errors.title && (
                                                        <div className="invalid-feedback">{errors.title}</div>
                                                    )}
                                                </div>
                                            </Col>

                                            <Col sm={12}>
                                                <div className="form-group" style={{ marginTop: '10px' }}>
                                                    <label htmlFor="description" style={{ 
                                                        display: 'block', 
                                                        marginBottom: '10px', 
                                                        fontSize: '0.875rem',
                                                        fontWeight: '500',
                                                        color: '#4680ff'
                                                    }}>
                                                        Description
                                                    </label>
                                                    <hr style={{ margin: '10px 0 15px 0', borderTop: '1px solid #dee2e6' }} />
                                                    <SettingsEditor
                                                        data={formData.description || ''}
                                                        onChange={(event, editor) => {
                                                            setFormData((prev) => ({
                                                                ...prev,
                                                                description: editor.getData()
                                                            }));
                                                        }}
                                                        placeholder="Enter track description (optional)"
                                                    />
                                                    <small className="text-muted" style={{ display: 'block', marginTop: '10px' }}>
                                                        Provide a brief description of this track
                                                    </small>
                                                </div>
                                            </Col>

                                            <Col sm={12}>
                                                <div className="form-group">
                                                    <label className="d-block mb-3">Status</label>
                                                    <div className="form-check form-check-inline">
                                                        <input
                                                            className="form-check-input"
                                                            type="checkbox"
                                                            id="isActive"
                                                            name="isActive"
                                                            checked={formData.isActive}
                                                            onChange={handleInputChange}
                                                        />
                                                        <label className="form-check-label" htmlFor="isActive">
                                                            Active
                                                        </label>
                                                    </div>
                                                </div>
                                            </Col>

                                        </Row>

                                        {/* Form Actions */}
                                        <div className="row mt-4">
                                            <div className="col-12">
                                                <div className="d-flex justify-content-between gap-2">
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
                                                        disabled={submitting}
                                                    >
                                                        {submitting ? 'Saving...' : (isEditing ? 'Update Track' : 'Create Track')}
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
        </>
    );
};

export default AddTrackPage;
