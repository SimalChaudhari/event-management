import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Button, Row, Col, Container } from 'react-bootstrap';
import Select from 'react-select';
import { createSession, updateSession, getAllTracks, getAllSessions } from '../../store/actions/programmeActions';
import { speakerList } from '../../store/actions/speakerActions';
import { toast } from 'react-toastify';
import { PROGRAMME_PATHS } from '../../utils/constants';
import SettingsEditor from '../../App/components/CkEditor/SettingsEditor';

const AddSessionPage = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { id } = useParams();
    const isEditing = Boolean(id);

    const { tracks, sessions, loading } = useSelector((state) => state.programme);
    const { speakers: speakerData } = useSelector((state) => state.speaker);

    const [formData, setFormData] = useState({
        trackId: '',
        title: '',
        description: '',
        sessionDate: '',
        startTime: '',
        endTime: '',
        venue: '',
        isActive: true,
        speakerIds: [],
    });

    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        dispatch(speakerList());
        
        // Always fetch tracks for track selection
        dispatch(getAllTracks());
        
        // Only fetch sessions if editing and not already available
        if (isEditing && (!sessions || sessions.length === 0)) {
            dispatch(getAllSessions());
        }
    }, [dispatch, isEditing, sessions]);

    useEffect(() => {
        if (isEditing && sessions && sessions.length > 0 && tracks && tracks.length > 0) {
            const session = sessions.find(s => s.id === id);
            if (session) {
                const sessionDate = session.sessionDate ? new Date(session.sessionDate).toISOString().split('T')[0] : '';
                
                setFormData({
                    trackId: session.trackId || '',
                    title: session.title || '',
                    description: session.description || '',
                    sessionDate: sessionDate,
                    startTime: session.startTime || '',
                    endTime: session.endTime || '',
                    venue: session.venue || '',
                    isActive: session.isActive !== undefined ? session.isActive : true,
                    speakerIds: session.speakers ? session.speakers.map(s => s.id) : [],
                });
                
                // Track ID is already set in formData
            }
        }
    }, [isEditing, id, sessions, tracks]);

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


    const validateForm = () => {
        const newErrors = {};

        if (!formData.trackId) newErrors.trackId = 'Please select a track';
        if (!formData.title.trim()) newErrors.title = 'Session title is required';
        if (!formData.sessionDate) newErrors.sessionDate = 'Session date is required';
        if (!formData.startTime) newErrors.startTime = 'Start time is required';
        if (!formData.endTime) newErrors.endTime = 'End time is required';

        if (formData.startTime && formData.endTime && formData.startTime >= formData.endTime) {
            newErrors.endTime = 'End time must be after start time';
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
                result = await dispatch(updateSession(id, payload));
            } else {
                result = await dispatch(createSession(payload));
            }

            if (result.success) {
                navigate(PROGRAMME_PATHS.LIST_PROGRAMMES);
            }
        } catch (error) {
            console.error('Error saving session:', error);
        } finally {
            setSubmitting(false);
        }
    };

    const handleNavigate = () => {
        navigate(PROGRAMME_PATHS.LIST_PROGRAMMES);
    };

    const speakerOptions = speakerData ? speakerData.map(speaker => ({
        value: speaker.id,
        label: speaker.firstName && speaker.lastName ? `${speaker.firstName} ${speaker.lastName}` : speaker.name || 'Unknown Speaker'
    })) : [];

    // Debug logging
    console.log('Speaker data:', speakerData);
    console.log('Speaker options:', speakerOptions);

    const selectedSpeakers = speakerOptions.filter(opt => formData.speakerIds.includes(opt.value));

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
                                        {isEditing ? 'Edit Programme Session' : 'Add New Programme Session'}
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
                                        <p className="mt-2">Loading session details...</p>
                                    </div>
                                ) : (
                                    <form onSubmit={handleSubmit}>
                                        <Row>
                                            <Col sm={12}>
                                                <div className="form-group fill">
                                                    <label className="floating-label" style={{ marginTop: '-8px' }} htmlFor="trackId">
                                                        Track *
                                                    </label>
                                                    <Select
                                                        value={tracks?.find(track => track.id === formData.trackId) ? 
                                                            { value: formData.trackId, label: tracks.find(track => track.id === formData.trackId)?.title } : null}
                                                        onChange={(selectedOption) => {
                                                            handleInputChange({ target: { name: 'trackId', value: selectedOption?.value || '' } });
                                                        }}
                                                        options={tracks?.map((track) => ({
                                                            value: track.id,
                                                            label: track.title
                                                        }))}
                                                        placeholder="Select a track"
                                                        isClearable
                                                        isSearchable
                                                        menuPortalTarget={document.body}
                                                        menuPosition="fixed"
                                                        styles={{
                                                            control: (base) => ({
                                                                ...base,
                                                                minHeight: '45px',
                                                                border: errors.trackId ? '1px solid #dc3545' : '1px solid #ced4da',
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
                                                    {errors.trackId && (
                                                        <small className="text-danger">{errors.trackId}</small>
                                                    )}
                                                </div>
                                            </Col>
                                        </Row>

                                        <Row>
                                            <Col sm={12}>
                                                <div className="form-group fill">
                                                    <label className="floating-label" htmlFor="title">
                                                        Session Title *
                                                    </label>
                                                    <input
                                                        type="text"
                                                        className={`form-control ${errors.title ? 'is-invalid' : ''}`}
                                                        id="title"
                                                        name="title"
                                                        placeholder="Enter session title"
                                                        value={formData.title}
                                                        onChange={handleInputChange}
                                                    />
                                                    {errors.title && (
                                                        <div className="invalid-feedback">{errors.title}</div>
                                                    )}
                                                </div>
                                            </Col>
                                        </Row>

                                        <Row>
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
                                                        placeholder="Enter session description (optional)"
                                                    />
                                                </div>
                                            </Col>
                                        </Row>

                                        <Row>
                                            <Col sm={4}>
                                                <div className="form-group fill">
                                                    <label className="floating-label" htmlFor="sessionDate">
                                                        Session Date *
                                                    </label>
                                                    <input
                                                        type="date"
                                                        className={`form-control ${errors.sessionDate ? 'is-invalid' : ''}`}
                                                        id="sessionDate"
                                                        name="sessionDate"
                                                        value={formData.sessionDate}
                                                        onChange={handleInputChange}
                                                    />
                                                    {errors.sessionDate && (
                                                        <div className="invalid-feedback">{errors.sessionDate}</div>
                                                    )}
                                                </div>
                                            </Col>

                                            <Col sm={4}>
                                                <div className="form-group fill">
                                                    <label className="floating-label" htmlFor="startTime">
                                                        Start Time *
                                                    </label>
                                                    <input
                                                        type="time"
                                                        className={`form-control ${errors.startTime ? 'is-invalid' : ''}`}
                                                        id="startTime"
                                                        name="startTime"
                                                        value={formData.startTime}
                                                        onChange={handleInputChange}
                                                    />
                                                    {errors.startTime && (
                                                        <div className="invalid-feedback">{errors.startTime}</div>
                                                    )}
                                                </div>
                                            </Col>

                                            <Col sm={4}>
                                                <div className="form-group fill">
                                                    <label className="floating-label" htmlFor="endTime">
                                                        End Time *
                                                    </label>
                                                    <input
                                                        type="time"
                                                        className={`form-control ${errors.endTime ? 'is-invalid' : ''}`}
                                                        id="endTime"
                                                        name="endTime"
                                                        value={formData.endTime}
                                                        onChange={handleInputChange}
                                                    />
                                                    {errors.endTime && (
                                                        <div className="invalid-feedback">{errors.endTime}</div>
                                                    )}
                                                </div>
                                            </Col>
                                        </Row>

                                        <Row>
                                            <Col sm={12}>
                                                <div className="form-group fill">
                                                    <label className="floating-label" htmlFor="venue">
                                                        Venue
                                                    </label>
                                                    <input
                                                        type="text"
                                                        className="form-control"
                                                        id="venue"
                                                        name="venue"
                                                        placeholder="Enter session venue (optional)"
                                                        value={formData.venue}
                                                        onChange={handleInputChange}
                                                    />
                                                </div>
                                            </Col>
                                        </Row>

                                        <Row>
                                            <Col sm={12}>
                                                <div className="form-group fill">
                                                    <label className="floating-label" style={{ marginTop: '-8px' }} htmlFor="speakerIds">
                                                        Speakers
                                                    </label>
                                                    <Select
                                                        isMulti
                                                        value={selectedSpeakers}
                                                        onChange={(selectedOptions) => {
                                                            const speakerIds = selectedOptions ? selectedOptions.map(opt => opt.value) : [];
                                                            handleInputChange({ target: { name: 'speakerIds', value: speakerIds } });
                                                        }}
                                                        options={speakerOptions}
                                                        placeholder="Select speakers (optional)"
                                                        isSearchable
                                                        menuPortalTarget={document.body}
                                                        menuPosition="fixed"
                                                        styles={{
                                                            control: (base) => ({
                                                                ...base,
                                                                minHeight: '45px',
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
                                                </div>
                                            </Col>
                                        </Row>

                                        <Row>
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
                                                        {submitting ? 'Saving...' : (isEditing ? 'Update Session' : 'Create Session')}
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

export default AddSessionPage;
