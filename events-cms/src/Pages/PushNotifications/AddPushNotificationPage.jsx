import React, { useEffect, useMemo, useState, useCallback } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import Card from 'react-bootstrap/Card';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Button from 'react-bootstrap/Button';
import Alert from 'react-bootstrap/Alert';
import Badge from 'react-bootstrap/Badge';
import Spinner from 'react-bootstrap/Spinner';
import Select from 'react-select';
import {
    createPushNotification,
    updatePushNotification,
    fetchPushNotificationDetail,
    clearPushNotificationDetail
} from '../../store/actions/pushNotificationActions.jsx';
import { eventList } from '../../store/actions/eventActions.jsx';
import { getTracksByEvent } from '../../store/actions/programmeActions.jsx';
import { PUSH_NOTIFICATION_PATHS } from '../../utils/constants.js';
import '../../assets/css/event.css';

const initialFormState = {
    message: '',
    sendToAllUsers: false,
    eventId: '',
    trackIds: [],
    redirectType: 'none',
    redirectUrl: '',
    appPageRoute: '',
    scheduledAt: ''
};

const toDateTimeLocal = (value) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';

    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - offset * 60000);
    return localDate.toISOString().slice(0, 16);
};

const AddPushNotificationPage = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditing = Boolean(id);

    const { selectedNotification, loading: notificationLoading } = useSelector(
        (state) => state.pushNotification || {}
    );
    const eventsState = useSelector((state) => state.event?.event);
    const programmeTracks = useSelector((state) => state.programme?.tracks || []);

    const [formState, setFormState] = useState(initialFormState);
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        dispatch(eventList());

        if (isEditing && id) {
            dispatch(fetchPushNotificationDetail(id));
        } else {
            dispatch(clearPushNotificationDetail());
        }

        return () => {
            dispatch(clearPushNotificationDetail());
        };
    }, [dispatch, id, isEditing]);

    useEffect(() => {
        if (!isEditing || !selectedNotification) return;

        setFormState((prev) => ({
            ...prev,
            message: selectedNotification.message ?? '',
            sendToAllUsers:
                selectedNotification.sendToAllUsers === undefined
                    ? true
                    : selectedNotification.sendToAllUsers,
            eventId: selectedNotification.eventId || '',
            trackIds: Array.isArray(selectedNotification.trackIds)
                ? selectedNotification.trackIds
                : [],
            redirectType: selectedNotification.redirectType || 'none',
            redirectUrl: selectedNotification.redirectUrl || '',
            appPageRoute: selectedNotification.appPageRoute || '',
            scheduledAt: selectedNotification.scheduledAt
                ? toDateTimeLocal(selectedNotification.scheduledAt)
                : ''
        }));

        if (!selectedNotification.sendToAllUsers && selectedNotification.eventId) {
            dispatch(getTracksByEvent(selectedNotification.eventId));
        }
    }, [dispatch, isEditing, selectedNotification]);

    const resolveEvents = useCallback((rawEvents) => {
        if (!rawEvents) return [];
        if (Array.isArray(rawEvents)) return rawEvents;
        if (Array.isArray(rawEvents?.data)) return rawEvents.data;
        if (Array.isArray(rawEvents?.events)) return rawEvents.events;
        return [];
    }, []);

    const events = useMemo(() => resolveEvents(eventsState), [eventsState, resolveEvents]);

    const selectedEvent = useMemo(() => {
        if (formState.sendToAllUsers) return null;
        const fromList = events.find((event) => event.id === formState.eventId);
        if (fromList) return fromList;
        if (selectedNotification?.event && selectedNotification.event.id === formState.eventId) {
            return selectedNotification.event;
        }
        if (selectedNotification?.eventId === formState.eventId) {
            return {
                id: selectedNotification.eventId,
                name: selectedNotification.event?.name || selectedNotification.eventId,
                location: selectedNotification.event?.location || selectedNotification.event?.venue
            };
        }
        return null;
    }, [events, formState.eventId, formState.sendToAllUsers, selectedNotification]);

    const baseEventOptions = useMemo(
        () =>
            events.map((event) => ({
                value: event.id,
                label: [event.name, event.location || event.city]
                    .filter(Boolean)
                    .join(' • ')
            })),
        [events]
    );

    const selectedEventOption = useMemo(() => {
        if (!formState.eventId) return null;
        const existing = baseEventOptions.find((option) => option.value === formState.eventId);
        if (existing) return existing;

        const referenceEvent = selectedEvent;
        if (referenceEvent) {
            const label = [referenceEvent.name, referenceEvent.location || referenceEvent.city]
                .filter(Boolean)
                .join(' • ');
            return {
                value: referenceEvent.id,
                label: label || referenceEvent.name || 'Selected event'
            };
        }

        return {
            value: formState.eventId,
            label: 'Selected event'
        };
    }, [formState.eventId, baseEventOptions, selectedEvent]);

    const eventOptions = useMemo(() => {
        if (!selectedEventOption) return baseEventOptions;
        const exists = baseEventOptions.some((option) => option.value === selectedEventOption.value);
        return exists ? baseEventOptions : [...baseEventOptions, selectedEventOption];
    }, [baseEventOptions, selectedEventOption]);

    const trackOptions = useMemo(
        () =>
            (programmeTracks || []).map((track) => ({
                value: track.id,
                label: track.title || track.name || track.id
            })),
        [programmeTracks]
    );

    const selectedTrackOptions = useMemo(() => {
        if (!Array.isArray(formState.trackIds)) return [];
        const options = trackOptions.filter((option) => formState.trackIds.includes(option.value));

        if (options.length === 0 && selectedNotification?.tracks && selectedNotification.tracks.length > 0) {
            return selectedNotification.tracks.map((track) => ({
                value: track.id,
                label: track.title || track.name || track.id
            }));
        }

        return options;
    }, [formState.trackIds, trackOptions, selectedNotification]);

    const handleFieldChange = (field, value) => {
        setFormState((prev) => ({
            ...prev,
            [field]: value
        }));

        if (errors[field]) {
            setErrors((prevErrors) => ({
                ...prevErrors,
                [field]: undefined
            }));
        }
    };

    const handleMessageChange = (event) => {
        handleFieldChange('message', event.target.value);
    };

    const handleSendToAllToggle = (event) => {
        const sendToAllUsers = event.target.checked;
        handleFieldChange('sendToAllUsers', sendToAllUsers);

        if (sendToAllUsers) {
            setFormState((prev) => ({
                ...prev,
                eventId: '',
                trackIds: []
            }));
            setErrors((prev) => ({
                ...prev,
                eventId: undefined
            }));
        }
    };

    const handleEventChange = (selectedOption) => {
        const nextEventId = selectedOption?.value || '';
        setFormState((prev) => ({
            ...prev,
            eventId: nextEventId,
            trackIds: []
        }));

        if (nextEventId) {
            dispatch(getTracksByEvent(nextEventId));
        }
    };

    const handleTrackChange = (selectedOptions) => {
        const trackIds = Array.isArray(selectedOptions)
            ? selectedOptions.map((option) => option.value)
            : [];
        handleFieldChange('trackIds', trackIds);
    };

    const handleRedirectTypeChange = (event) => {
        const redirectType = event.target.value;
        setFormState((prev) => ({
            ...prev,
            redirectType,
            redirectUrl: redirectType === 'url' ? prev.redirectUrl : '',
            appPageRoute: redirectType === 'app_page' ? prev.appPageRoute : ''
        }));

        setErrors((prev) => ({
            ...prev,
            redirectUrl: undefined,
            appPageRoute: undefined
        }));
    };

    const handleScheduledAtChange = (event) => {
        handleFieldChange('scheduledAt', event.target.value);
    };

    const validateForm = () => {
        const nextErrors = {};

        if (!formState.message || !formState.message.trim()) {
            nextErrors.message = 'Notification message is required.';
        }

        if (!formState.sendToAllUsers && !formState.eventId) {
            nextErrors.eventId = 'Select an event or enable "Send to all users".';
        }

        if (formState.redirectType === 'url' && !formState.redirectUrl.trim()) {
            nextErrors.redirectUrl = 'Destination URL is required when redirect type is URL.';
        }

        if (formState.redirectType === 'app_page' && !formState.appPageRoute.trim()) {
            nextErrors.appPageRoute = 'App route is required when redirect type is App Page.';
        }

        if (formState.scheduledAt) {
            const date = new Date(formState.scheduledAt);
            if (Number.isNaN(date.getTime())) {
                nextErrors.scheduledAt = 'Provide a valid future date and time.';
            }
        }

        setErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
    };

    const buildPayload = () => {
        const payload = {
            message: formState.message.trim(),
            sendToAllUsers: formState.sendToAllUsers,
            redirectType: formState.redirectType
        };

        if (!formState.sendToAllUsers) {
            payload.eventId = formState.eventId;
            if (Array.isArray(formState.trackIds) && formState.trackIds.length > 0) {
                payload.trackIds = formState.trackIds;
            }
        }

        if (formState.redirectType === 'url') {
            payload.redirectUrl = formState.redirectUrl.trim();
        }

        if (formState.redirectType === 'app_page') {
            payload.appPageRoute = formState.appPageRoute.trim();
        }

        if (formState.scheduledAt) {
            const isoDate = new Date(formState.scheduledAt);
            if (!Number.isNaN(isoDate.getTime())) {
                payload.scheduledAt = isoDate.toISOString();
            }
        }

        return payload;
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!validateForm()) return;

        const payload = buildPayload();
        setIsSubmitting(true);

        try {
            let response;
            if (isEditing && id) {
                response = await dispatch(updatePushNotification(id, payload));
            } else {
                response = await dispatch(createPushNotification(payload));
            }

            if (response?.success) {
                navigate(PUSH_NOTIFICATION_PATHS.LIST_NOTIFICATIONS);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        navigate(PUSH_NOTIFICATION_PATHS.LIST_NOTIFICATIONS);
    };

    const renderStatusBanner = () => {
        if (!isEditing || !selectedNotification) return null;

        const { status, sentCount, failedCount, sentAt } = selectedNotification;
        const badgeVariantMap = {
            scheduled: 'info',
            sent: 'success',
            failed: 'danger',
            cancelled: 'secondary'
        };

        const variant = badgeVariantMap[status] || 'primary';

        return (
            <Alert variant="light" className="d-flex justify-content-between align-items-center">
                <div>
                    <h6 className="mb-1">Delivery Status</h6>
                    <Badge bg={variant} className="me-2 text-uppercase">
                        {status || 'scheduled'}
                    </Badge>
                    <span className="text-muted small">
                        Sent: <strong>{sentCount ?? 0}</strong> | Failed: <strong>{failedCount ?? 0}</strong>
                    </span>
                </div>
                {sentAt && (
                    <span className="text-muted small">
                        Last sent: {new Date(sentAt).toLocaleString()}
                    </span>
                )}
            </Alert>
        );
    };

    const isLoading = notificationLoading && !selectedNotification && isEditing;

    const renderAudiencePreview = () => {
        if (formState.sendToAllUsers) {
            return (
                <div className="d-flex justify-content-between flex-wrap">
                    <span>
                        <strong>Audience:</strong> All registered users will receive this notification.
                    </span>
                </div>
            );
        }

        return (
            <div className="d-flex flex-column flex-lg-row justify-content-between gap-3">
                <div>
                    <span className="d-block">
                        <strong>Event:</strong>{' '}
                        {selectedEvent?.name || selectedEvent?.title || selectedNotification?.event?.name || '—'}
                    </span>
                    {selectedEvent?.location && (
                        <span className="text-muted small d-block mt-1">
                            <i className="feather icon-map-pin me-1" />
                            {selectedEvent.location}
                        </span>
                    )}
                </div>
                <div>
                    <strong>Tracks:</strong>{' '}
                    {selectedTrackOptions.length > 0 ? (
                        <div className="d-flex flex-wrap gap-2 mt-2">
                            {selectedTrackOptions.map((track) => (
                                <Badge key={track.value} bg="info">
                                    {track.label}
                                </Badge>
                            ))}
                        </div>
                    ) : (
                        <span className="text-muted">All registrants for this event</span>
                    )}
                </div>
            </div>
        );
    };

    return (
        <Container fluid>
            <Row>
                <Col xs={12}>
                    <Card>
                        <Card.Header className="d-flex justify-content-between align-items-center">
                            <h4 className="mb-0">{isEditing ? 'Edit Push Notification' : 'Add Push Notification'}</h4>
                            <Button variant="secondary" onClick={handleCancel}>
                                <i className="feather icon-arrow-left me-2" />
                                Back
                            </Button>
                        </Card.Header>
                        <Card.Body>
                            {renderStatusBanner()}

                            {isLoading ? (
                                <div className="text-center py-4">
                                    <Spinner animation="border" variant="primary" role="status" />
                                    <p className="mt-2 mb-0 text-muted">Loading notification details…</p>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit}>
                                    <div
                                        className="mb-4 rounded p-3"
                                        style={{ background: '#f7f8fa', border: '1px solid #e9ecef' }}
                                    >
                                        {renderAudiencePreview()}

                                        <div className="form-check form-switch mb-3">
                                            <input
                                                type="checkbox"
                                                id="sendToAllUsers"
                                                className="form-check-input"
                                                checked={formState.sendToAllUsers}
                                                onChange={handleSendToAllToggle}
                                            />
                                            <label className="form-check-label" htmlFor="sendToAllUsers">
                                                Send to all registered users
                                            </label>
                                        </div>

                                        <Row className="g-4">
                                            <Col md={6}>
                                                <div className="form-group d-flex align-items-center">
                                                    <div style={{ flex: 1 }}>
                                                        <label htmlFor="eventId">
                                                            Event {formState.sendToAllUsers ? '(optional)' : '*'}
                                                        </label>
                                                        <Select
                                                            inputId="eventId"
                                                            classNamePrefix="react-select"
                                                            placeholder={
                                                                formState.sendToAllUsers
                                                                    ? 'Disabled when sending to all users'
                                                                    : 'Select an event'
                                                            }
                                                            options={eventOptions}
                                                            value={selectedEventOption}
                                                            onChange={handleEventChange}
                                                            isClearable
                                                            isDisabled={formState.sendToAllUsers}
                                                            menuPortalTarget={document.body}
                                                            styles={{
                                                                menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                                                                control: (base) => ({ ...base, minHeight: '48px' })
                                                            }}
                                                        />
                                                        {errors.eventId && !formState.sendToAllUsers && (
                                                            <div className="invalid-feedback d-block">{errors.eventId}</div>
                                                        )}
                                                        {selectedEvent && (
                                                            <small className="text-muted d-block mt-2">
                                                                <i className="feather icon-map-pin mr-1" />
                                                                {[
                                                                    selectedEvent.location,
                                                                    selectedEvent.city
                                                                ]
                                                                    .filter(Boolean)
                                                                    .join(', ')}
                                                            </small>
                                                        )}
                                                        {formState.sendToAllUsers && (
                                                            <small className="text-muted d-block mt-2">
                                                                Disable "Send to all users" to choose a specific event.
                                                            </small>
                                                        )}
                                                    </div>
                                                </div>
                                            </Col>

                                            <Col md={6}>
                                                <div className="form-group d-flex align-items-center">
                                                    <div style={{ flex: 1 }}>
                                                        <label htmlFor="trackIds">Tracks (optional)</label>
                                                        <Select
                                                            inputId="trackIds"
                                                            classNamePrefix="react-select"
                                                            placeholder={
                                                                formState.sendToAllUsers
                                                                    ? 'Disabled when sending to all users'
                                                                    : formState.eventId
                                                                        ? 'Select one or more tracks'
                                                                        : 'Choose an event first'
                                                            }
                                                            isMulti
                                                            options={trackOptions}
                                                            value={selectedTrackOptions}
                                                            onChange={handleTrackChange}
                                                            isDisabled={formState.sendToAllUsers || !formState.eventId}
                                                            menuPortalTarget={document.body}
                                                            styles={{
                                                                menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                                                                control: (base) => ({ ...base, minHeight: '48px' })
                                                            }}
                                                        />
                                                        <small className="text-muted d-block mt-2">
                                                            {formState.sendToAllUsers
                                                                ? 'Tracks are only configurable when targeting a specific event.'
                                                                : 'If no track is selected, the notification goes to all attendees for the chosen event.'}
                                                        </small>
                                                    </div>
                                                </div>
                                            </Col>
                                        </Row>
                                    </div>

                                    <div className="mb-4">
                                        <div className="form-group fill">
                                            <label className="floating-label" htmlFor="message">
                                                Notification Message *
                                            </label>
                                            <textarea
                                                id="message"
                                                className={`form-control ${errors.message ? 'is-invalid' : ''}`}
                                                placeholder="Enter notification message"
                                                rows={6}
                                                value={formState.message}
                                                onChange={handleMessageChange}
                                                required
                                            />
                                            {errors.message && <div className="invalid-feedback">{errors.message}</div>}
                                            <small className="form-text text-muted">
                                                Keep messages concise; users will see the first 120 characters.
                                            </small>
                                        </div>
                                    </div>

                                    <div className="mb-4">
                                        <Row className="g-4">
                                            <Col md={6}>
                                                <div className="form-group fill">
                                                    <label className="floating-label" htmlFor="scheduledAt">
                                                        Scheduled Time (optional)
                                                    </label>
                                                    <input
                                                        type="datetime-local"
                                                        id="scheduledAt"
                                                        className={`form-control ${errors.scheduledAt ? 'is-invalid' : ''}`}
                                                        value={formState.scheduledAt}
                                                        onChange={handleScheduledAtChange}
                                                    />
                                                    {errors.scheduledAt && <div className="invalid-feedback">{errors.scheduledAt}</div>}
                                                    <small className="text-muted d-block mt-2">
                                                        Leave blank to send during the next scheduled worker run.
                                                    </small>
                                                </div>
                                            </Col>
                                            <Col md={6}>
                                                <div className="form-group fill">
                                                    <label className="floating-label" htmlFor="redirectType">
                                                        Redirect Action
                                                    </label>
                                                    <select
                                                        id="redirectType"
                                                        className="form-control"
                                                        value={formState.redirectType}
                                                        onChange={handleRedirectTypeChange}
                                                    >
                                                        <option value="none">No redirect</option>
                                                        <option value="url">Open external URL</option>
                                                        <option value="app_page">Navigate to app page</option>
                                                    </select>
                                                </div>

                                                {formState.redirectType === 'url' && (
                                                    <div className="form-group fill mt-4">
                                                        <label className="floating-label" htmlFor="redirectUrl">
                                                            Destination URL *
                                                        </label>
                                                        <input
                                                            type="url"
                                                            id="redirectUrl"
                                                            className={`form-control ${errors.redirectUrl ? 'is-invalid' : ''}`}
                                                            placeholder="https://example.com/promotion"
                                                            value={formState.redirectUrl}
                                                            onChange={(event) => handleFieldChange('redirectUrl', event.target.value)}
                                                            required
                                                        />
                                                        {errors.redirectUrl && <div className="invalid-feedback">{errors.redirectUrl}</div>}
                                                        <small className="text-muted d-block mt-2">
                                                            Ensure the link is secure (https) and mobile friendly.
                                                        </small>
                                                    </div>
                                                )}

                                                {formState.redirectType === 'app_page' && (
                                                    <div className="form-group fill mt-4">
                                                        <label className="floating-label" htmlFor="appPageRoute">
                                                            App Route *
                                                        </label>
                                                        <input
                                                            type="text"
                                                            id="appPageRoute"
                                                            className={`form-control ${errors.appPageRoute ? 'is-invalid' : ''}`}
                                                            placeholder="/surveys/:eventId"
                                                            value={formState.appPageRoute}
                                                            onChange={(event) => handleFieldChange('appPageRoute', event.target.value)}
                                                            required
                                                        />
                                                        {errors.appPageRoute && <div className="invalid-feedback">{errors.appPageRoute}</div>}
                                                        <small className="text-muted d-block mt-2">
                                                            Provide an internal route the mobile app recognises.
                                                        </small>
                                                    </div>
                                                )}
                                            </Col>
                                        </Row>
                                    </div>

                                    <div className="d-flex justify-content-between gap-2 mt-4">
                                        <Button variant="danger" type="button" onClick={handleCancel} disabled={isSubmitting}>
                                            Cancel
                                        </Button>
                                        <Button type="submit" variant="primary" disabled={isSubmitting}>
                                            {isSubmitting
                                                ? isEditing
                                                    ? 'Updating…'
                                                    : 'Creating…'
                                                : isEditing
                                                    ? 'Update Notification'
                                                    : 'Create Notification'}
                                        </Button>
                                    </div>
                                </form>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default AddPushNotificationPage;
