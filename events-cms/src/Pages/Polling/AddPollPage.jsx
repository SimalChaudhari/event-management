import React, { useState, useEffect } from 'react';
import { Button, Row, Col, Card, Form, Alert, Container } from 'react-bootstrap';
import Select from 'react-select';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import { createPoll, updatePoll, getPollById } from '../../store/actions/pollingActions';
import { eventList } from '../../store/actions/eventActions';
import { speakerList } from '../../store/actions/speakerActions';
import { POLLING_PATHS } from '../../utils/constants';

const AddPollPage = () => {
    const { id } = useParams();
    const isEditMode = Boolean(id);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const { pollById, loading } = useSelector((state) => state.polling);
    const events = useSelector((state) => state.event?.event?.events || []);
    const speakers = useSelector((state) => state.speaker?.speakers || []);

    const [formData, setFormData] = useState({
        question: '',
        eventId: '',
        speakerId: '',
        timerSeconds: 30,
        options: [{ optionText: '' }, { optionText: '' }]
    });

    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                await dispatch(eventList());
                await dispatch(speakerList());

                if (isEditMode && id) {
                    await dispatch(getPollById(id));
                }
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };
        fetchData();
    }, [dispatch, isEditMode, id]);

    // Debug: Log speakers data
    useEffect(() => {
        console.log('Speakers from Redux:', speakers);
        console.log('Speaker options:', speakerOptions);
    }, [speakers]);

    useEffect(() => {
        if (isEditMode && pollById) {
            setFormData({
                question: pollById.question?.question || '',
                eventId: pollById.event?.id || '',
                speakerId: pollById.speaker?.id || '',
                timerSeconds: pollById.question?.timerSeconds || 30,
                options: pollById.question?.options?.map((opt) => ({
                    id: opt.id,
                    optionText: opt.optionText
                })) || [{ optionText: '' }, { optionText: '' }]
            });
        }
    }, [isEditMode, pollById]);

    const eventOptions =
        events?.map((event) => ({
            value: event.id,
            label: event.name
        })) || [];

    const speakerOptions =
        speakers?.map((speaker) => ({
            value: speaker.id,
            label: `${speaker.firstName} ${speaker.lastName}`
        })) || [];

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value
        }));
        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: '' }));
        }
    };

    const handleSelectChange = (name, selectedOption) => {
        setFormData((prev) => ({
            ...prev,
            [name]: selectedOption?.value || ''
        }));
        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: '' }));
        }
    };

    const handleOptionChange = (index, value) => {
        const newOptions = [...formData.options];
        newOptions[index].optionText = value;
        setFormData((prev) => ({
            ...prev,
            options: newOptions
        }));
        if (errors[`option_${index}`]) {
            setErrors((prev) => ({ ...prev, [`option_${index}`]: '' }));
        }
    };

    const addOption = () => {
        if (formData.options.length < 6) {
            setFormData((prev) => ({
                ...prev,
                options: [...prev.options, { optionText: '' }]
            }));
        }
    };

    const removeOption = (index) => {
        if (formData.options.length > 2) {
            const newOptions = formData.options.filter((_, i) => i !== index);
            setFormData((prev) => ({
                ...prev,
                options: newOptions
            }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.question.trim()) {
            newErrors.question = 'Question is required';
        }

        if (!formData.eventId) {
            newErrors.eventId = 'Event is required';
        }

        if (!formData.speakerId) {
            newErrors.speakerId = 'Speaker is required';
        }

        if (!formData.timerSeconds || formData.timerSeconds < 10) {
            newErrors.timerSeconds = 'Timer must be at least 10 seconds';
        }

        formData.options.forEach((option, index) => {
            if (!option.optionText.trim()) {
                newErrors[`option_${index}`] = 'Option text is required';
            }
        });

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setSubmitting(true);

        try {
            const pollData = {
                question: formData.question,
                eventId: formData.eventId,
                speakerId: formData.speakerId, // Now required, no null check
                timerSeconds: parseInt(formData.timerSeconds),
                options: formData.options.map((opt) => ({
                    optionText: opt.optionText
                }))
            };

            if (isEditMode) {
                await dispatch(updatePoll(id, pollData));
            } else {
                await dispatch(createPoll(pollData));
            }

            navigate(POLLING_PATHS.LIST_POLLS);
        } catch (error) {
            console.error('Error saving poll:', error);
        } finally {
            setSubmitting(false);
        }
    };

    const handleCancel = () => {
        navigate(POLLING_PATHS.LIST_POLLS);
    };

    return (
        <Container fluid>
            <Row>
                <Col>
                    <Card>
                        <Card.Header>
                            <Card.Title as="h5">{isEditMode ? 'Edit Poll' : 'Create New Poll'}</Card.Title>
                            <span className="d-block m-t-5">
                                {isEditMode ? 'Update poll details' : 'Fill in the details to create a new poll'}
                            </span>
                        </Card.Header>
                        <Card.Body>
                            <Form onSubmit={handleSubmit}>
                                <Row>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>
                                                Event <span className="text-danger">*</span>
                                            </Form.Label>
                                            <Select
                                                options={eventOptions}
                                                value={eventOptions.find((opt) => opt.value === formData.eventId)}
                                                onChange={(option) => handleSelectChange('eventId', option)}
                                                placeholder="Select Event"
                                                isSearchable
                                                className={errors.eventId ? 'is-invalid' : ''}
                                            />
                                            {errors.eventId && <div className="invalid-feedback d-block">{errors.eventId}</div>}
                                        </Form.Group>
                                    </Col>

                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>
                                                Speaker <span className="text-danger">*</span>
                                            </Form.Label>
                                            <Select
                                                options={speakerOptions}
                                                value={speakerOptions.find((opt) => opt.value === formData.speakerId)}
                                                onChange={(option) => handleSelectChange('speakerId', option)}
                                                placeholder="Select Speaker"
                                                isSearchable
                                                className={errors.speakerId ? 'is-invalid' : ''}
                                            />
                                            {errors.speakerId && <div className="invalid-feedback d-block">{errors.speakerId}</div>}
                                        </Form.Group>
                                    </Col>
                                </Row>

                                <Row>
                                    <Col md={12}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>
                                                Poll Question <span className="text-danger">*</span>
                                            </Form.Label>
                                            <Form.Control
                                                as="textarea"
                                                rows={3}
                                                name="question"
                                                value={formData.question}
                                                onChange={handleInputChange}
                                                placeholder="Enter your poll question..."
                                                isInvalid={!!errors.question}
                                            />
                                            <Form.Control.Feedback type="invalid">{errors.question}</Form.Control.Feedback>
                                        </Form.Group>
                                    </Col>
                                </Row>

                                <Row>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>
                                                Timer (seconds) <span className="text-danger">*</span>
                                            </Form.Label>
                                            <Form.Control
                                                type="number"
                                                name="timerSeconds"
                                                value={formData.timerSeconds}
                                                onChange={handleInputChange}
                                                min="10"
                                                max="300"
                                                isInvalid={!!errors.timerSeconds}
                                            />
                                            <Form.Text className="text-muted">Recommended: 30-60 seconds</Form.Text>
                                            <Form.Control.Feedback type="invalid">{errors.timerSeconds}</Form.Control.Feedback>
                                        </Form.Group>
                                    </Col>
                                </Row>

                                <Row>
                                    <Col md={12}>
                                        <Form.Label>
                                            Poll Options <span className="text-danger">*</span>
                                            <span className="text-muted ms-2">(Minimum 2, Maximum 6)</span>
                                        </Form.Label>
                                        {formData.options.map((option, index) => (
                                            <div key={index} className="mb-3">
                                                <div className="d-flex gap-2 align-items-start">
                                                    <div className="flex-grow-1">
                                                        <Form.Control
                                                            type="text"
                                                            placeholder={`Option ${index + 1}`}
                                                            value={option.optionText}
                                                            onChange={(e) => handleOptionChange(index, e.target.value)}
                                                            isInvalid={!!errors[`option_${index}`]}
                                                        />
                                                        <Form.Control.Feedback type="invalid">
                                                            {errors[`option_${index}`]}
                                                        </Form.Control.Feedback>
                                                    </div>
                                                    {formData.options.length > 2 && (
                                                        <Button
                                                            variant="outline-danger"
                                                            onClick={() => removeOption(index)}
                                                            style={{ minWidth: '40px' }}
                                                        >
                                                            <i className="feather icon-trash-2"></i>
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}

                                        {formData.options.length < 6 && (
                                            <Button variant="outline-primary" onClick={addOption} className="mb-3">
                                                <i className="feather icon-plus me-2"></i>
                                                Add Option
                                            </Button>
                                        )}
                                    </Col>
                                </Row>

                                <div className="row mt-4">
                                    <div className="col-12">
                                        <div className="d-flex justify-content-between gap-2">
                                            <Button variant="danger" onClick={handleCancel} disabled={submitting}>
                                                Cancel
                                            </Button>
                                            <Button type="submit" variant="primary" disabled={submitting || loading}>
                                                {submitting ? (
                                                    <>
                                                        <span
                                                            className="spinner-border spinner-border-sm me-2"
                                                            role="status"
                                                            aria-hidden="true"
                                                        ></span>
                                                        {isEditMode ? 'Updating...' : 'Creating...'}
                                                    </>
                                                ) : (
                                                    <>{isEditMode ? 'Update Poll' : 'Create Poll'}</>
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </Form>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default AddPollPage;
