import React, { useEffect, useMemo } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Row, Col, Card, Container, Badge, Alert, Spinner } from 'react-bootstrap';
import {
    fetchPushNotificationDetail,
    clearPushNotificationDetail
} from '../../store/actions/pushNotificationActions.jsx';
import { PUSH_NOTIFICATION_PATHS } from '../../utils/constants.js';
import useTableNavigation from '../../hooks/useTableNavigation';
import NoDataFound from '../../components/NoDataFound';
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
            <Container fluid className="mt-4">
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
            </Container>
        );
    }

    if (!selectedNotification) {
        return (
            <NoDataFound
                title="Push Notification Not Found"
                message="The push notification you're looking for doesn't exist or has been removed."
                icon="feather icon-bell-off"
                variant="warning"
                size="medium"
                showBackButton={true}
                backButtonText="Back"
                backButtonPath={PUSH_NOTIFICATION_PATHS.LIST_NOTIFICATIONS}
            />
        );
    }

    const {
        message,
        sendToAllUsers,
        event,
        eventId,
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
        value ? new Date(value).toLocaleString() : 'N/A';

    const InfoField = ({ label, value, icon = null, colSize = 6 }) => (
        <Col xs={12} sm={12} md={colSize} className="mb-2" style={{ overflow: 'hidden' }}>
            <div style={{ 
                padding: '8px 12px',
                borderBottom: '1px solid #e9ecef',
                width: '100%',
                maxWidth: '100%',
                boxSizing: 'border-box'
            }}>
                {/* Mobile & Tablet: Label on top */}
                <div className="d-block d-md-none mb-2">
                    <div style={{ 
                        fontSize: '13px', 
                        fontWeight: '600', 
                        color: '#000000',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginBottom: '4px',
                        wordBreak: 'break-word',
                        overflowWrap: 'break-word'
                    }}>
                        {icon && (
                            <i 
                                className={icon} 
                                style={{ 
                                    fontSize: '14px', 
                                    flexShrink: 0,
                                    width: '16px',
                                    textAlign: 'center',
                                    color: '#4680ff'
                                }}
                            ></i>
                        )}
                        <span>{label}:</span>
                    </div>
                    <div style={{ 
                        fontSize: '14px', 
                        color: '#000000',
                        fontWeight: '400',
                        wordBreak: 'break-word',
                        overflowWrap: 'break-word',
                        width: '100%',
                        paddingLeft: icon ? '24px' : '0',
                        lineHeight: '1.5'
                    }}>
                        {value || 'N/A'}
                    </div>
                </div>
                {/* Desktop: Label and value side by side */}
                <div className="d-none d-md-flex align-items-start" style={{ width: '100%', minWidth: 0 }}>
                    <div style={{ 
                        minWidth: '140px',
                        maxWidth: '140px',
                        fontSize: '13px', 
                        fontWeight: '600', 
                        color: '#000000',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        marginRight: '12px',
                        flexShrink: 0
                    }}>
                        {icon && <i className={icon} style={{ fontSize: '12px', color: '#4680ff' }}></i>}
                        <span style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>{label}:</span>
                    </div>
                    <div style={{ 
                        fontSize: '14px', 
                        color: '#000000',
                        fontWeight: '400',
                        flex: 1,
                        minWidth: 0,
                        wordBreak: 'break-word',
                        overflowWrap: 'break-word',
                        overflow: 'hidden'
                    }}>
                        {value || 'N/A'}
                    </div>
                </div>
            </div>
        </Col>
    );

    return (
        <>
            <Container fluid className="mt-4" style={{ overflowX: 'hidden', width: '100%', maxWidth: '100%' }}>
                {/* Header */}
                <div style={{ 
                    backgroundColor: '#fff', 
                    borderRadius: '8px', 
                    padding: '20px', 
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    marginBottom: '24px',
                    borderTop: '4px solid #4680ff'
                }}>
                    <div className="d-flex justify-content-between align-items-center">
                        <div>
                            <h4 style={{ 
                                margin: 0, 
                                color: '#000000',
                                fontWeight: '600'
                            }}>
                                <i className="feather icon-bell mr-2" style={{ color: '#4680ff' }}></i>
                                Push Notification Details
                            </h4>
                            <p style={{ 
                                margin: '8px 0 0 0', 
                                color: '#000000',
                                fontSize: '14px'
                            }}>
                                View detailed information about this push notification
                            </p>
                        </div>
                        <Button 
                            variant="outline-secondary" 
                            onClick={() => handleBack()}
                            style={{ 
                                borderRadius: '8px',
                                padding: '8px 16px',
                                border: '1px solid #dee2e6',
                                fontWeight: '500'
                            }}
                        >
                            <i className="fas fa-arrow-left me-2" style={{marginRight: '10px'}}></i>
                            Back
                        </Button>
                    </div>
                </div>

                {/* Main Content Card */}
                <Card style={{ 
                    backgroundColor: '#fff', 
                    borderRadius: '8px', 
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    border: '1px solid #e9ecef',
                    overflow: 'hidden'
                }}>
                    <Card.Body style={{ padding: '24px', overflow: 'hidden', width: '100%', maxWidth: '100%' }}>
                        {errorMessage && (
                            <Alert variant="danger" className="mb-4">
                                <i className="feather icon-alert-triangle me-2" />
                                <strong>Error:</strong> {errorMessage}
                            </Alert>
                        )}

                        <Row style={{ margin: 0, width: '100%', maxWidth: '100%' }}>
                            {/* Delivery Status & Metrics */}
                            <Col xs={12} style={{ overflow: 'hidden', width: '100%', maxWidth: '100%' }}>
                                <h5 style={{ 
                                    fontSize: '16px', 
                                    fontWeight: '600', 
                                    color: '#000000',
                                    marginBottom: '16px',
                                    paddingBottom: '8px',
                                    borderBottom: '2px solid #4680ff'
                                }}>
                                    <i className="feather icon-activity mr-2" style={{ color: '#4680ff' }}></i>
                                    Delivery Status & Metrics
                                </h5>
                                <Row>
                                    <InfoField 
                                        label="Status" 
                                        value={
                                            <Badge bg={badgeVariantMap[status] || 'secondary'} className="px-3 py-2 text-uppercase">
                                                {status || 'scheduled'}
                                            </Badge>
                                        }
                                        icon="feather icon-activity"
                                        colSize={6}
                                    />
                                    <InfoField 
                                        label="Scheduled At" 
                                        value={formatDateTime(scheduledAt)}
                                        icon="feather icon-clock"
                                        colSize={6}
                                    />
                                    <InfoField 
                                        label="Last Sent" 
                                        value={formatDateTime(sentAt)}
                                        icon="feather icon-send"
                                        colSize={6}
                                    />
                                    <InfoField 
                                        label="Recipients" 
                                        value={
                                            <>
                                                <strong style={{ color: '#28a745' }}>{sentCount ?? 0}</strong> successful /{' '}
                                                <strong style={{ color: '#dc3545' }}>{failedCount ?? 0}</strong> failed
                                            </>
                                        }
                                        icon="feather icon-users"
                                        colSize={6}
                                    />
                                </Row>
                            </Col>

                            {/* Audience Information */}
                            <Col xs={12} className="mt-4" style={{ overflow: 'hidden', width: '100%', maxWidth: '100%' }}>
                                <h5 style={{ 
                                    fontSize: '16px', 
                                    fontWeight: '600', 
                                    color: '#000000',
                                    marginBottom: '16px',
                                    paddingBottom: '8px',
                                    borderBottom: '2px solid #4680ff'
                                }}>
                                    <i className="feather icon-users mr-2" style={{ color: '#4680ff' }}></i>
                                    Audience Information
                                </h5>
                                <Row>
                                    <InfoField 
                                        label="Delivery Scope" 
                                        value={audienceDescription}
                                        icon="feather icon-target"
                                        colSize={12}
                                    />
                                    {!sendToAllUsers && event?.name && (
                                        <InfoField 
                                            label="Event Name" 
                                            value={event.name}
                                            icon="feather icon-calendar"
                                            colSize={6}
                                        />
                                    )}
                                    {!sendToAllUsers && eventId && (
                                        <InfoField 
                                            label="Event ID" 
                                            value={eventId}
                                            icon="feather icon-hash"
                                            colSize={6}
                                        />
                                    )}
                                    {resolvedTracks.length > 0 && (
                                        <Col xs={12} className="mb-2" style={{ padding: '8px 12px' }}>
                                            <div className="d-block d-md-none mb-2">
                                                <div style={{ 
                                                    fontSize: '13px', 
                                                    fontWeight: '600', 
                                                    color: '#000000',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '8px',
                                                    marginBottom: '8px'
                                                }}>
                                                    <i className="feather icon-list" style={{ fontSize: '14px', color: '#4680ff' }}></i>
                                                    <span>Tracks:</span>
                                                </div>
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
                                            </div>
                                            <div className="d-none d-md-flex align-items-start">
                                                <div style={{ 
                                                    minWidth: '140px',
                                                    maxWidth: '140px',
                                                    fontSize: '13px', 
                                                    fontWeight: '600', 
                                                    color: '#000000',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '6px',
                                                    marginRight: '12px',
                                                    flexShrink: 0
                                                }}>
                                                    <i className="feather icon-list" style={{ fontSize: '12px', color: '#4680ff' }}></i>
                                                    <span>Tracks:</span>
                                                </div>
                                                <div className="d-flex flex-wrap gap-2" style={{ flex: 1 }}>
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
                                            </div>
                                        </Col>
                                    )}
                                    {resolvedTracks.length === 0 && !sendToAllUsers && (
                                        <InfoField 
                                            label="Track Filter" 
                                            value="No track filter applied; notification targets all registrants for the selected event."
                                            icon="feather icon-list"
                                            colSize={12}
                                        />
                                    )}
                                </Row>
                            </Col>

                            {/* Redirect Configuration */}
                            <Col xs={12} className="mt-4" style={{ overflow: 'hidden', width: '100%', maxWidth: '100%' }}>
                                <h5 style={{ 
                                    fontSize: '16px', 
                                    fontWeight: '600', 
                                    color: '#000000',
                                    marginBottom: '16px',
                                    paddingBottom: '8px',
                                    borderBottom: '2px solid #4680ff'
                                }}>
                                    <i className="feather icon-navigation mr-2" style={{ color: '#4680ff' }}></i>
                                    Redirect Configuration
                                </h5>
                                <Row>
                                    <InfoField 
                                        label="Redirect Type" 
                                        value={redirectType || 'none'}
                                        icon="feather icon-arrow-right"
                                        colSize={6}
                                    />
                                    {redirectType === 'url' && redirectUrl && (
                                        <InfoField 
                                            label="Destination URL" 
                                            value={
                                                <a href={redirectUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#4680ff', wordBreak: 'break-all' }}>
                                                    {redirectUrl}
                                                </a>
                                            }
                                            icon="feather icon-link"
                                            colSize={6}
                                        />
                                    )}
                                    {redirectType === 'app_page' && appPageRoute && (
                                        <InfoField 
                                            label="App Route" 
                                            value={<code style={{ backgroundColor: '#f8f9fa', padding: '2px 6px', borderRadius: '4px' }}>{appPageRoute}</code>}
                                            icon="feather icon-smartphone"
                                            colSize={6}
                                        />
                                    )}
                                    {(!redirectType || redirectType === 'none') && (
                                        <InfoField 
                                            label="Redirect Action" 
                                            value="No redirect action configured. Opening the notification keeps the user in the app."
                                            icon="feather icon-x-circle"
                                            colSize={12}
                                        />
                                    )}
                                </Row>
                            </Col>

                            {/* Message Content */}
                            <Col xs={12} className="mt-4" style={{ overflow: 'hidden', width: '100%', maxWidth: '100%' }}>
                                <h5 style={{ 
                                    fontSize: '16px', 
                                    fontWeight: '600', 
                                    color: '#000000',
                                    marginBottom: '16px',
                                    paddingBottom: '8px',
                                    borderBottom: '2px solid #4680ff'
                                }}>
                                    <i className="feather icon-message-square mr-2" style={{ color: '#4680ff' }}></i>
                                    Message Content
                                </h5>
                                <Row>
                                    <Col xs={12} style={{ padding: '8px 12px' }}>
                                        <div style={{ 
                                            fontSize: '14px', 
                                            color: '#000000',
                                            fontWeight: '400',
                                            whiteSpace: 'pre-wrap',
                                            lineHeight: '1.6',
                                            padding: '12px',
                                            backgroundColor: '#f8f9fa',
                                            borderRadius: '4px',
                                            border: '1px solid #e9ecef'
                                        }}>
                                            {message || 'N/A'}
                                        </div>
                                    </Col>
                                </Row>
                            </Col>

                            {/* Timestamps */}
                            <Col xs={12} className="mt-4" style={{ overflow: 'hidden', width: '100%', maxWidth: '100%' }}>
                                <h5 style={{ 
                                    fontSize: '16px', 
                                    fontWeight: '600', 
                                    color: '#000000',
                                    marginBottom: '16px',
                                    paddingBottom: '8px',
                                    borderBottom: '2px solid #4680ff'
                                }}>
                                    <i className="feather icon-clock mr-2" style={{ color: '#4680ff' }}></i>
                                    Timestamps
                                </h5>
                                <Row>
                                    <InfoField 
                                        label="Created At" 
                                        value={formatDateTime(createdAt)}
                                        icon="feather icon-plus-circle"
                                        colSize={6}
                                    />
                                    <InfoField 
                                        label="Last Updated" 
                                        value={formatDateTime(updatedAt)}
                                        icon="feather icon-edit"
                                        colSize={6}
                                    />
                                </Row>
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>
            </Container>
        </>
    );
};

export default ViewPushNotificationPage;
