import React, { useEffect, useMemo } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import Badge from 'react-bootstrap/Badge';
import Alert from 'react-bootstrap/Alert';
import Spinner from 'react-bootstrap/Spinner';
import {
    fetchPushNotificationDetail,
    clearPushNotificationDetail
} from '../../store/actions/pushNotificationActions.jsx';
import { PUSH_NOTIFICATION_PATHS } from '../../utils/constants.js';
import useTableNavigation from '../../hooks/useTableNavigation';
import '../../assets/css/event.css';

const badgeVariantMap = {
    scheduled: 'info',
    sent: 'success',
    failed: 'danger',
    cancelled: 'secondary',
    processing: 'warning'
};

const ViewPushNotificationPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const { selectedNotification, loading } = useSelector(
        (state) => state.pushNotification || {}
    );

    const { handleBack } = useTableNavigation({
        tableRef: null,
        listPath: PUSH_NOTIFICATION_PATHS.LIST_NOTIFICATIONS,
        viewPath: PUSH_NOTIFICATION_PATHS.VIEW_NOTIFICATION,
        editPath: PUSH_NOTIFICATION_PATHS.EDIT_NOTIFICATION,
        addPath: PUSH_NOTIFICATION_PATHS.ADD_NOTIFICATION
    });

    useEffect(() => {
        if (id) {
            dispatch(fetchPushNotificationDetail(id));
        }

        return () => {
            dispatch(clearPushNotificationDetail());
        };
    }, [dispatch, id]);

    const audienceDescription = useMemo(() => {
        if (!selectedNotification) return '';
        if (selectedNotification.sendToAllUsers) return 'All registered users';
        if (selectedNotification.event?.name) return `${selectedNotification.event.name}`;
        if (selectedNotification.eventId) return `Event ID: ${selectedNotification.eventId}`;
        return 'Event-specific audience';
    }, [selectedNotification]);

    const resolvedTracks = useMemo(() => {
        if (!selectedNotification) return [];
        const { tracks, trackIds } = selectedNotification;
        if (Array.isArray(tracks) && tracks.length > 0) {
            return tracks;
        }
        if (Array.isArray(trackIds) && trackIds.length > 0) {
            return trackIds.map((trackId) => ({ id: trackId, title: trackId }));
        }
        return [];
    }, [selectedNotification]);

    if (loading && !selectedNotification) {
        return (
            <Row>
                <Col sm={12} className="btn-page">
                    <Card className="event-list">
                        <Card.Body className="text-center py-5">
                            <Spinner animation="border" variant="primary" role="status" />
                            <p className="mt-3 mb-0 text-muted">Loading push notification details…</p>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        );
    }

    if (!selectedNotification) {
        return (
            <Row>
                <Col sm={12} className="btn-page">
                    <Card className="event-list">
                        <Card.Body>
                            <Alert variant="warning" className="mb-3">
                                Push notification not found or you might not have access to view it.
                            </Alert>
                            <Button variant="outline-secondary" onClick={() => handleBack()}>
                                <i className="feather icon-arrow-left me-2" />
                                Back to List
                            </Button>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        );
    }

    const {
        message,
        sendToAllUsers,
        event,
        eventId,
        tracks,
        trackIds,
        redirectType,
        redirectUrl,
        appPageRoute,
        scheduledAt,
        status,
        sentAt,
        sentCount,
        failedCount,
        errorMessage,
        createdAt,
        updatedAt
    } = selectedNotification;

    const formatDateTime = (value) =>
        value ? new Date(value).toLocaleString() : '—';

    const deliveryMetrics = [
        {
            label: 'Status',
            value: (
                <Badge bg={badgeVariantMap[status] || 'secondary'} className="px-3 py-2 text-uppercase">
                    {status || 'scheduled'}
                </Badge>
            )
        },
        {
            label: 'Scheduled at',
            value: formatDateTime(scheduledAt)
        },
        {
            label: 'Last sent',
            value: formatDateTime(sentAt)
        },
        {
            label: 'Recipients (success / failed)',
            value: (
                <>
                    <strong>{sentCount ?? 0}</strong> /{' '}
                    <span className="text-danger">{failedCount ?? 0}</span>
                </>
            )
        }
    ];

    return (
        <>
            <Row>
                <Col sm={12} className="btn-page">
                    <Card className="event-list border-0 shadow-sm">
                        <div
                            className="px-4 py-3 d-flex flex-column flex-md-row align-items-md-center justify-content-between"
                            style={{
                                background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
                                color: '#fff'
                            }}
                        >
                            <div className="mb-3 mb-md-0">
                                <Button
                                    variant="link"
                                    className="text-decoration-none text-white px-0 d-inline-flex align-items-center mb-2"
                                    onClick={() => handleBack()}
                                    style={{ opacity: 0.85 }}
                                >
                                    <i className="feather icon-arrow-left me-2" />
                                    Back to notifications
                                </Button>
                                <h4 className="mb-1 text-white">Push Notification Overview</h4>
                                <span className="text-white-50">
                                    Review content, audience targeting, scheduling, and delivery results.
                                </span>
                            </div>
                            <div
                                className="text-end"
                                style={{
                                    fontSize: '0.85rem',
                                    opacity: 0.85
                                }}
                            >
                                <div>Created: {formatDateTime(createdAt)}</div>
                                <div>Updated: {formatDateTime(updatedAt)}</div>
                            </div>
                        </div>
                        <Card.Body className="p-4 p-lg-5">
                            {errorMessage && (
                                <Alert variant="danger" className="mb-4">
                                    <i className="feather icon-alert-triangle me-2" />
                                    {errorMessage}
                                </Alert>
                            )}

                            <Row className="g-3 mb-4">
                                {deliveryMetrics.map((metric, index) => (
                                    <Col key={index} xs={12} sm={6} xl={3}>
                                        <Card className="border-0 shadow-sm h-100" style={{ background: '#f6f9ff' }}>
                                            <Card.Body className="py-3">
                                                <span className="d-block text-muted text-uppercase small mb-2">
                                                    {metric.label}
                                                </span>
                                                <div className="fw-semibold" style={{ fontSize: '0.95rem' }}>
                                                    {metric.value}
                                                </div>
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                ))}
                            </Row>

                            <Card className="border-0 shadow-sm mb-4">
                                <Card.Body>
                                    <h6 className="text-uppercase text-muted mb-3">Audience</h6>
                                    <p className="mb-3">
                                        <strong>Delivery scope:</strong>
                                        <br />
                                        {audienceDescription}
                                    </p>
                                    {!sendToAllUsers && event?.name && (
                                        <p className="mb-3">
                                            <strong>Event:</strong>
                                            <br />
                                            {event.name}
                                            {eventId && (
                                                <span className="text-muted d-block small mt-1">
                                                    Event ID: {eventId}
                                                </span>
                                            )}
                                        </p>
                                    )}
                                    {resolvedTracks.length > 0 ? (
                                        <>
                                            <h6 className="text-muted text-uppercase small mb-2">Tracks</h6>
                                            <div className="d-flex flex-wrap gap-2">
                                                {resolvedTracks.map((track) => (
                                                    <Badge
                                                        key={track.id || track.title || track}
                                                        bg="light"
                                                        text="dark"
                                                        className="px-3 py-2"
                                                    >
                                                        {track.title || track.name || track.id || track}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </>
                                    ) : (
                                        <p className="text-muted mb-0">
                                            No track filter applied; notification targets all registrants for the selected event.
                                        </p>
                                    )}
                                </Card.Body>
                            </Card>

                            <Card className="border-0 shadow-sm mb-4">
                                <Card.Body>
                                    <h6 className="text-uppercase text-muted mb-3">Redirect Behaviour</h6>
                                    <p className="mb-2">
                                        <strong>Type:</strong> {redirectType || 'none'}
                                    </p>
                                    {redirectType === 'url' && redirectUrl && (
                                        <p className="mb-0">
                                            <strong>Destination URL:</strong>
                                            <br />
                                            <a href={redirectUrl} target="_blank" rel="noopener noreferrer">
                                                {redirectUrl}
                                            </a>
                                        </p>
                                    )}
                                    {redirectType === 'app_page' && appPageRoute && (
                                        <p className="mb-0">
                                            <strong>App route:</strong>
                                            <br />
                                            <code>{appPageRoute}</code>
                                        </p>
                                    )}
                                    {(!redirectType || redirectType === 'none') && (
                                        <p className="text-muted mb-0">
                                            No redirect action configured. Opening the notification keeps the user in the app.
                                        </p>
                                    )}
                                </Card.Body>
                            </Card>

                            <Card className="border-0 shadow-sm mt-4">
                                <Card.Body>
                                    <h6 className="text-uppercase text-muted mb-3">Message</h6>
                                    <p className="mb-0" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                                        {message}
                                    </p>
                                </Card.Body>
                            </Card>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </>
    );
};

export default ViewPushNotificationPage;

