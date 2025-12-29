import React, { useEffect, useRef, useCallback } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Table from 'react-bootstrap/Table';
import { useDispatch } from 'react-redux';
import * as $ from 'jquery';
import DeleteConfirmationModal from '../../components/modal/DeleteConfirmationModal';
import SendConfirmationModal from '../../components/modal/SendConfirmationModal';
import {
    deletePushNotification,
    sendPushNotificationNow
} from '../../store/actions/pushNotificationActions.jsx';
import { PUSH_NOTIFICATION_PATHS } from '../../utils/constants.js';
import usePersistedTablePage from '../../hooks/usePersistedTablePage';
import useTableNavigation from '../../hooks/useTableNavigation';
import { initializeServerSideDataTable } from '../../utils/dataTableServerSide';
import axiosInstance from '../../configs/axiosInstance';
import { PUSH_NOTIFICATION_LOADING } from '../../store/constants/actionTypes';
import '../../assets/css/event.css';

// Register DataTable plugin (Bootstrap styling)
// @ts-ignore
$.DataTable = require('datatables.net-bs');

const TABLE_SELECTOR = '#push-notifications-table';

const escapeHtml = (value = '') =>
    String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

const formatDateTime = (date) => {
    if (!date) return '—';
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) {
        return '—';
    }

    return parsed.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });
};

const formatRelativeTiming = (date) => {
    if (!date) return '';
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) return '';

    const diff = parsed.getTime() - Date.now();
    const diffMinutes = Math.round(diff / (1000 * 60));

    if (Math.abs(diffMinutes) < 1) return '(now)';
    if (diffMinutes > 0) {
        if (diffMinutes < 60) return `(in ${diffMinutes} min)`;
        const hours = Math.round(diffMinutes / 60);
        if (hours < 24) return `(in ${hours} hr${hours > 1 ? 's' : ''})`;
        const days = Math.round(hours / 24);
        return `(in ${days} day${days > 1 ? 's' : ''})`;
    }

    const positive = Math.abs(diffMinutes);
    if (positive < 60) return `(${positive} min ago)`;
    const hours = Math.round(positive / 60);
    if (hours < 24) return `(${hours} hr${hours > 1 ? 's' : ''} ago)`;
    const days = Math.round(hours / 24);
    return `(${days} day${days > 1 ? 's' : ''} ago)`;
};

const getAudienceDescription = (notification) => {
    if (notification.sendToAllUsers) {
        return `
            <div>
                <span class="badge badge-success mr-2">All Users</span>
                <div class="text-muted small">Delivered to every registered user</div>
            </div>
        `;
    }

    const eventName = escapeHtml(notification.event?.name || 'N/A');

    const tracks = Array.isArray(notification.tracks)
        ? notification.tracks
        : Array.isArray(notification.trackIds)
            ? notification.trackIds.map((id) => ({ id, title: id }))
            : [];

    const trackBadge = tracks.length
        ? tracks
              .map(
                  (track) => `
                <span class="badge badge-light mr-2 mb-1">
                    <i class="feather icon-git-branch mr-1 text-muted"></i>
                    ${escapeHtml(track.title || track.id)}
                </span>
            `
              )
              .join('')
        : '<span class="text-muted">All registrants for event</span>';

    return `
        <div>
            <div class="mb-1">
                <span class="badge badge-primary mr-2">Event</span>
                <strong>${eventName}</strong>
            </div>
            <div class="d-flex flex-wrap align-items-center">${trackBadge}</div>
        </div>
    `;
};

const getScheduleBadgeMeta = (scheduledAt) => {
    if (!scheduledAt) {
        return {
            badgeClass: 'badge-light-secondary',
            statusText: 'No schedule'
        };
    }

    const scheduleDate = new Date(scheduledAt);
    if (Number.isNaN(scheduleDate.getTime())) {
        return {
            badgeClass: 'badge-light-secondary',
            statusText: 'Invalid date'
        };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const scheduleDay = new Date(scheduleDate);
    scheduleDay.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((scheduleDay - today) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
        return {
            badgeClass: 'badge-light-secondary',
            statusText: `${Math.abs(diffDays)} day${Math.abs(diffDays) > 1 ? 's' : ''} ago`
        };
    }

    if (diffDays === 0) {
        return {
            badgeClass: 'badge-light-success',
            statusText: 'Today'
        };
    }

    if (diffDays <= 3) {
        return {
            badgeClass: 'badge-light-danger',
            statusText: `in ${diffDays} day${diffDays > 1 ? 's' : ''}`
        };
    }

    if (diffDays <= 7) {
        return {
            badgeClass: 'badge-light-warning',
            statusText: `in ${diffDays} days`
        };
    }

    return {
        badgeClass: 'badge-light-info',
        statusText: `in ${diffDays} days`
    };
};

const statusBadgeClassMap = {
    scheduled: 'badge-light-warning',
    processing: 'badge-light-info',
    sent: 'badge-light-success',
    failed: 'badge-light-danger',
    cancelled: 'badge-light-secondary'
};

const buildNotificationCell = (notification) => {
    const message = escapeHtml(notification.message || 'No message');
    const truncatedMessage = message.length > 180 ? `${message.slice(0, 180)}…` : message;
    const scheduledBadgeMeta = getScheduleBadgeMeta(notification.scheduledAt);
    const scheduledDisplay = escapeHtml(formatDateTime(notification.scheduledAt));
    const relativeTiming = escapeHtml(formatRelativeTiming(notification.scheduledAt) || '');
    const statusLabel = escapeHtml(notification.status || 'scheduled');
    const statusBadgeClass = statusBadgeClassMap[notification.status] || 'badge-light-info';
    const notificationId = escapeHtml(notification.id || '');

    const redirectInfo = (() => {
        if (notification.redirectType === 'url' && notification.redirectUrl) {
            return `
                <div class="small text-muted mt-2">
                    <i class="feather icon-external-link mr-1 text-primary"></i>
                    Opens URL: <span class="text-primary">${escapeHtml(notification.redirectUrl)}</span>
                </div>
            `;
        }

        if (notification.redirectType === 'app_page' && notification.appPageRoute) {
            return `
                <div class="small text-muted mt-2">
                    <i class="feather icon-navigation mr-1 text-primary"></i>
                    Navigates to app route: <span class="text-primary">${escapeHtml(notification.appPageRoute)}</span>
                </div>
            `;
        }

        return '';
    })();

    return `
        <div class="d-inline-block align-middle w-100">
            <div class="d-inline-block">
                <p class="m-b-0">
                    <h6 class="mb-1 text-wrap" style="max-width: 420px;">${truncatedMessage}</h6>
                    <span class="badge ${scheduledBadgeMeta.badgeClass}">
                        ${scheduledDisplay}
                        ${scheduledBadgeMeta.statusText ? `<span class="ml-1">${escapeHtml(scheduledBadgeMeta.statusText)}</span>` : ''}
                        ${relativeTiming ? `<span class="ml-1 text-muted">${relativeTiming}</span>` : ''}
                    </span>
                </p>
                <span class="badge ${statusBadgeClass} font-weight-bold text-uppercase mr-2">${statusLabel}</span>
                <!-- <span class="badge badge-primary font-weight-bold">ID: ${notificationId}</span> -->
            </div>
            ${redirectInfo}
        </div>
    `;
};

const buildEventCell = (notification) => {
    const eventName = notification.event?.name || notification.eventId || '—';
    const location = notification.event?.location || notification.event?.venue || '';

    return `
        <div class="d-inline-block align-middle">
            <h6 class="m-b-5">${escapeHtml(eventName)}</h6>
            ${location
                ? `
                    <p class="m-b-0">
                        <span class="badge badge-success">
                            <i class="feather icon-map-pin mr-1"></i>
                            ${escapeHtml(location)}
                        </span>
                    </p>
                `
                : ''}
        </div>
    `;
};

const buildScheduleCell = (notification) => {
    const scheduledDisplay = escapeHtml(formatDateTime(notification.scheduledAt));
    const relativeTiming = formatRelativeTiming(notification.scheduledAt);
    const sentDisplay = notification.sentAt ? escapeHtml(`Sent ${formatDateTime(notification.sentAt)}`) : '';

    return `
        <div>
            <div>${scheduledDisplay}</div>
            ${relativeTiming ? `<div class="text-muted small">${escapeHtml(relativeTiming)}</div>` : ''}
            ${sentDisplay ? `<div class="badge badge-light mt-2">${sentDisplay}</div>` : ''}
        </div>
    `;
};

const buildActionsCell = (notification) => {
    const sendLabel = notification.status === 'sent' ? 'Resend' : 'Send Now';
    const disableSendButton = notification.status === 'processing';
    const buttonStyle = 'margin-right: 10px; width: 40px; height: 40px; border-radius: 50%; display: inline-flex; justify-content: center; align-items: center;';
    const idAttr = escapeHtml(notification.id || '');
    const statusAttr = escapeHtml(notification.status || '');

    return `
        <div class="btn-group" role="group" aria-label="Actions">
            <button type="button" class="btn btn-icon btn-success push-view-btn" data-id="${idAttr}" title="View" style="${buttonStyle}">
                <i class="feather icon-eye"></i>
            </button>
            <button type="button" class="btn btn-primary btn-circle btn-sm push-send-btn" data-id="${idAttr}" data-status="${statusAttr}" title="${sendLabel}" ${disableSendButton ? 'disabled' : ''} style="${buttonStyle}">
                <i class="feather icon-navigation"></i>
            </button>
            <button type="button" class="btn btn-warning btn-circle btn-sm push-edit-btn" data-id="${idAttr}" title="Edit" style="${buttonStyle}">
                <i class="feather icon-edit"></i>
            </button>
            <button type="button" class="btn btn-danger btn-circle btn-sm push-delete-btn" data-id="${idAttr}" title="Delete" style="width: 40px; height: 40px; border-radius: 50%; display: inline-flex; justify-content: center; align-items: center;">
                <i class="feather icon-trash-2"></i>
            </button>
        </div>
    `;
};


const PushNotificationsList = () => {
    const dispatch = useDispatch();
    const tableRef = useRef(null);

    const [showDeleteModal, setShowDeleteModal] = React.useState(false);
    const [notificationToDelete, setNotificationToDelete] = React.useState(null);
    const [isDeleting, setIsDeleting] = React.useState(false);
    const [isSending, setIsSending] = React.useState(false);
    const [sendModalState, setSendModalState] = React.useState({
        show: false,
        notificationId: null,
        status: null
    });

    // Use pagination persistence hook
    const { restoreTablePage } = usePersistedTablePage();

    // Use reusable table navigation hook for page preservation
    const { handleView, handleEdit, handleAdd } = useTableNavigation({
        tableRef,
        listPath: PUSH_NOTIFICATION_PATHS.LIST_NOTIFICATIONS,
        viewPath: PUSH_NOTIFICATION_PATHS.VIEW_NOTIFICATION,
        editPath: PUSH_NOTIFICATION_PATHS.EDIT_NOTIFICATION,
        addPath: PUSH_NOTIFICATION_PATHS.ADD_NOTIFICATION
    });

    const handleOpenSendModal = useCallback(
        (notificationId, status) => {
            if (!notificationId || isSending || status === 'processing') return;
            setSendModalState({
                show: true,
                notificationId,
                status
            });
        },
        [isSending]
    );

    const handleCloseSendModal = useCallback(() => {
        if (isSending) return;
        setSendModalState({
            show: false,
            notificationId: null,
            status: null
        });
    }, [isSending]);

    const handleConfirmSend = useCallback(async () => {
        if (!sendModalState.notificationId) return;
        setIsSending(true);
        try {
            await dispatch(sendPushNotificationNow(sendModalState.notificationId));
            // Reload table after sending
            if (tableRef.current) {
                tableRef.current.ajax.reload(null, false);
            }
        } finally {
            setIsSending(false);
            setSendModalState({
                show: false,
                notificationId: null,
                status: null
            });
        }
    }, [dispatch, sendModalState.notificationId]);

    const handleDeleteRequest = useCallback((notificationId) => {
        if (!notificationId) return;
        setNotificationToDelete(notificationId);
        setShowDeleteModal(true);
    }, []);

    const handleCloseDeleteModal = useCallback(() => {
        if (isDeleting) return;
        setShowDeleteModal(false);
        setNotificationToDelete(null);
    }, [isDeleting]);

    const handleConfirmDelete = useCallback(async () => {
        if (!notificationToDelete) return;
        setIsDeleting(true);
        try {
            const success = await dispatch(deletePushNotification(notificationToDelete));
            if (success) {
                setShowDeleteModal(false);
                setNotificationToDelete(null);
                // Reload table after deletion
                if (tableRef.current) {
                    tableRef.current.ajax.reload(null, false);
                }
            }
        } finally {
            setIsDeleting(false);
        }
    }, [dispatch, notificationToDelete]);

    useEffect(() => {
        const columns = [
            {
                data: 'message',
                title: 'Notification / Schedule',
                render: function (data, type, row) {
                    if (type === 'sort' || type === 'type') {
                        return row.message || '';
                    }
                    return buildNotificationCell(row);
                }
            },
            {
                data: null,
                title: 'Audience',
                orderable: false,
                render: function (data, type, row) {
                    return getAudienceDescription(row);
                }
            },
            {
                data: 'event.name',
                title: 'Event',
                render: function (data, type, row) {
                    if (type === 'sort' || type === 'type') {
                        return row.event?.name || '';
                    }
                    return buildEventCell(row);
                }
            },
            {
                data: 'scheduledAt',
                title: 'Scheduled Date',
                render: function (data, type, row) {
                    if (type === 'sort' || type === 'type') {
                        return row.scheduledAt || '';
                    }
                    return buildScheduleCell(row);
                }
            },
            {
                data: null,
                title: 'Actions',
                orderable: false,
                render: function (data, type, row) {
                    return buildActionsCell(row);
                }
            }
        ];

        // Initialize server-side DataTable
        tableRef.current = initializeServerSideDataTable({
            tableSelector: TABLE_SELECTOR,
            ajaxUrl: '/scheduled-push-notifications',
            ajaxMethod: 'GET',
            columns: columns,
            ajaxParams: {},
            axiosInstance: axiosInstance,
            dispatch: dispatch,
            loadingActionType: PUSH_NOTIFICATION_LOADING,
            dom: "<'row mb-3'<'col-sm-12 col-md-6'l><'col-sm-12 col-md-6 d-flex justify-content-end align-items-center'<'search-container'f><'add-event-button ml-2'>>>" +
                 "<'row'<'col-sm-12'tr>>" +
                 "<'row'<'col-sm-12 col-md-5'i><'col-sm-12 col-md-7'p>>",
            pageLength: 10,
            lengthMenu: [[5, 10, 25, 50, -1], [5, 10, 25, 50, 'All']],
            order: [[3, 'desc']], // Sort by Scheduled Date column (index 3) in descending order
            onDataLoaded: (data, metadata) => {
                // Optional: Handle data if needed
            },
            restoreTablePage: restoreTablePage,
            initCompleteCallback: function (settings, json, api) {
                // Add button initialization
                if (!$('#addPushNotificationBtn').length) {
                    $('.add-event-button').html(`
                        <button class="btn btn-primary d-flex align-items-center ml-2" id="addPushNotificationBtn">
                            <i class="feather icon-plus mr-1"></i>
                            Create
                        </button>
                    `);
                    $('#addPushNotificationBtn').on('click', handleAdd);
                }

                // Attach event listeners for actions
                $(settings.nTable).off('click', '.push-view-btn').on('click', '.push-view-btn', function () {
                    const rowData = api.row($(this).closest('tr')).data();
                    if (rowData && rowData.id) {
                        handleView(rowData);
                    }
                });

                $(settings.nTable).off('click', '.push-send-btn').on('click', '.push-send-btn', function () {
                    const rowData = api.row($(this).closest('tr')).data();
                    if (rowData && rowData.id) {
                        handleOpenSendModal(rowData.id, rowData.status);
                    }
                });

                $(settings.nTable).off('click', '.push-edit-btn').on('click', '.push-edit-btn', function () {
                    const rowData = api.row($(this).closest('tr')).data();
                    if (rowData && rowData.id) {
                        handleEdit(rowData);
                    }
                });

                $(settings.nTable).off('click', '.push-delete-btn').on('click', '.push-delete-btn', function () {
                    const rowData = api.row($(this).closest('tr')).data();
                    if (rowData && rowData.id) {
                        handleDeleteRequest(rowData.id);
                    }
                });

                // Feather icons replacement
                if (window.feather && typeof window.feather.replace === 'function') {
                    window.feather.replace();
                }
            },
            drawCallback: function () {
                if (window.feather && typeof window.feather.replace === 'function') {
                    window.feather.replace();
                }
            }
        });

        return () => {
            if (tableRef.current) {
                tableRef.current.destroy();
                tableRef.current = null;
            }
        };
    }, []); // Only run once on mount

    return (
        <>
            <DeleteConfirmationModal
                show={showDeleteModal}
                onHide={handleCloseDeleteModal}
                onConfirm={handleConfirmDelete}
                isLoading={isDeleting}
                title="Delete notification"
            />
            <SendConfirmationModal
                show={sendModalState.show}
                onHide={handleCloseSendModal}
                onConfirm={handleConfirmSend}
                isLoading={isSending}
                title={sendModalState.status === 'sent' ? 'Resend Notification' : 'Send Notification'}
                description={
                    sendModalState.status === 'sent'
                        ? 'This notification has already been sent. Do you want to resend it to the recipients now?'
                        : 'Do you want to send this notification to the targeted recipients right now?'
                }
                confirmLabel={sendModalState.status === 'sent' ? 'Resend' : 'Send Now'}
            />

            <Row>
                <Col sm={12} className="btn-page">
                    <Card className="event-list">
                        <Card.Body>
                            <Table striped hover responsive id="push-notifications-table">
                                <thead>
                                    <tr>
                                        <th>Notification / Schedule</th>
                                        <th>Audience</th>
                                        <th>Event</th>
                                        <th>Scheduled Date</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                            </Table>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </>
    );
};

export default PushNotificationsList;

