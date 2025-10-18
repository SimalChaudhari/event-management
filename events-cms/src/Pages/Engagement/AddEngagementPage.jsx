import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Button, Row, Col, Container } from 'react-bootstrap';
import Select from 'react-select';
import { createEngagement, updateEngagement, getEngagementById, getAllEngagements } from '../../store/actions/engagementActions';
import { getAllTracks } from '../../store/actions/programmeActions';
import { toast } from 'react-toastify';
import { ENGAGEMENT_PATHS } from '../../utils/constants';

const AddEngagementPage = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { id } = useParams();
    const isEditing = Boolean(id);

    const { selectedEngagement, engagements, loading } = useSelector((state) => state.engagement);
    const { tracks } = useSelector((state) => state.programme);

    const [formData, setFormData] = useState({
        isActive: true
    });

    const [selectedTrackId, setSelectedTrackId] = useState('');
    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        dispatch(getAllTracks());
        dispatch(getAllEngagements());
        if (isEditing) {
            dispatch(getEngagementById(id));
        }
    }, [dispatch, isEditing, id]);

    useEffect(() => {
        if (isEditing && selectedEngagement) {
            setFormData({
                isActive: selectedEngagement.isActive !== undefined ? selectedEngagement.isActive : true
            });
            // Set the track ID from the engagement data
            if (selectedEngagement.trackId && !selectedTrackId) {
                setSelectedTrackId(selectedEngagement.trackId);
            }
        }
    }, [isEditing, selectedEngagement]);

    const handleInputChange = (e) => {
        const { name, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : e.target.value
        }));
        
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const handleTrackChange = (trackId) => {
        setSelectedTrackId(trackId || '');
        if (errors.trackId) {
            setErrors(prev => ({ ...prev, trackId: '' }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!selectedTrackId) {
            newErrors.trackId = 'Please select a programme track';
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
                trackId: selectedTrackId,
                ...formData
            };

            let result;
            if (isEditing) {
                result = await dispatch(updateEngagement(id, payload));
            } else {
                result = await dispatch(createEngagement(payload));
            }

            if (result.success) {
                navigate(ENGAGEMENT_PATHS.LIST_ENGAGEMENTS);
            }
        } catch (error) {
            console.error('Error saving engagement:', error);
        } finally {
            setSubmitting(false);
        }
    };

    const handleNavigate = () => {
        navigate(ENGAGEMENT_PATHS.LIST_ENGAGEMENTS);
    };

    // Get list of track IDs that already have engagements (excluding current one if editing)
    const usedTrackIds = engagements
        ?.filter(engagement => !isEditing || engagement.id !== id)
        .map(engagement => engagement.trackId) || [];

    // Filter out tracks that already have engagements
    const availableTracks = tracks?.filter(track => !usedTrackIds.includes(track.id)) || [];

    // If editing, include the current track even if it has an engagement
    const displayTracks = isEditing && selectedEngagement?.trackId
        ? [...availableTracks, tracks?.find(t => t.id === selectedEngagement.trackId)].filter(Boolean)
        : availableTracks;

    // Create track options for select dropdown with event name
    const trackOptions = displayTracks.map(track => ({
        value: track.id,
        label: `${track.title} - ${track.event?.name || 'No Event'}`
    }));

    const selectedTrackOption = trackOptions.find(option => option.value === selectedTrackId);

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
                                        {isEditing ? 'Edit Engagement' : 'Add New Engagement'}
                                    </h4>
                                    <Button variant="secondary" onClick={handleNavigate}>
                                        <i style={{ marginRight: '10px' }} className="fas fa-arrow-left me-2"></i>
                                        Back
                                    </Button>
                                </div>
                            </div>
                            <div className="card-body">
                                <form onSubmit={handleSubmit}>
                                    <Row>
                                        <Col sm={12}>
                                            <div className="form-group fill">
                                                <label className="floating-label" 
                                                style={{ marginTop: '-8px' }}
                                                htmlFor="trackId">
                                                    Programme Track <span className="text-danger">*</span>
                                                </label>
                                                <Select
                                                    options={trackOptions}
                                                    value={selectedTrackOption}
                                                    onChange={(option) => handleTrackChange(option?.value)}
                                                    placeholder="Select Programme Track..."
                                                    isClearable
                                                    isSearchable
                                                    isDisabled={isEditing}
                                                    className={errors.trackId ? 'is-invalid' : ''}
                                                    styles={{
                                                        control: (base) => ({
                                                            ...base,
                                                            fontSize: '14px',
                                                            borderColor: errors.trackId ? '#dc3545' : base.borderColor,
                                                        }),
                                                        menu: (base) => ({
                                                            ...base,
                                                            zIndex: 9999
                                                        })
                                                    }}
                                                />
                                                {errors.trackId && (
                                                    <small className="text-danger">{errors.trackId}</small>
                                                )}
                                                <small className="form-text text-muted">
                                                    Only tracks without existing engagements are shown
                                                </small>
                                            </div>
                                        </Col>

                                        <Col sm={12}>
                                            <div className="form-group">
                                                <div className="checkbox d-inline">
                                                    <input
                                                        type="checkbox"
                                                        name="isActive"
                                                        id="isActive"
                                                        checked={formData.isActive}
                                                        onChange={handleInputChange}
                                                        style={{ marginRight: '8px' }}
                                                    />
                                                    <label htmlFor="isActive" className="cr">
                                                        Active
                                                    </label>
                                                </div>
                                                <small className="form-text text-muted d-block mt-2">
                                                    Check this to make the engagement active
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
                                                    disabled={submitting}
                                                >
                                                    {submitting ? 'Saving...' : (isEditing ? 'Update' : 'Create')}
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

export default AddEngagementPage;
