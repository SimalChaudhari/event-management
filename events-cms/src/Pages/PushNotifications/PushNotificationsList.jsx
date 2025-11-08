import React, { useEffect, useState, useCallback } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Table from 'react-bootstrap/Table';
import Spinner from 'react-bootstrap/Spinner';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import * as $ from 'jquery';
import DeleteConfirmationModal from '../../components/modal/DeleteConfirmationModal';
import SendConfirmationModal from '../../components/modal/SendConfirmationModal';
import {
    fetchPushNotifications,
    deletePushNotification,
    sendPushNotificationNow
} from '../../store/actions/pushNotificationActions.jsx';
import { PUSH_NOTIFICATION_PATHS } from '../../utils/constants.js';
import { setupDateFilter, resetFilters } from '../../utils/dateFilter';
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

const ptable = (data, handlers) => {
    const { onAdd, onView, onSend, onEdit, onDelete } = handlers;
    const tableSelector = TABLE_SELECTOR;

    $.fn.dataTable.ext.errMode = 'throw';

    let currentPage = 0;
    if ($.fn.DataTable.isDataTable(tableSelector)) {
        const existing = $(tableSelector).DataTable();
        currentPage = existing.page();
        existing.clear().destroy();
    }

    const dataTable = $(tableSelector).DataTable({
        data: Array.isArray(data) ? data : [],
        order: [[3, 'desc']],
        searching: true,
        searchDelay: 500,
        pageLength: 5,
        lengthMenu: [
            [5, 10, 25, 50, -1],
            [5, 10, 25, 50, 'All']
        ],
        pagingType: 'full_numbers',
        dom:
            "<'row mb-3'<'col-sm-12 col-md-6'l><'col-sm-12 col-md-6 d-flex justify-content-end align-items-center'<'search-container'f><'add-event-button ml-2'>>>" +
            "<'row'<'col-sm-12'<'date-filter-wrapper'>>>" +
            "<'row'<'col-sm-12'tr>>" +
            "<'row'<'col-sm-12 col-md-5'i><'col-sm-12 col-md-7'p>>",
        columns: [
            {
                data: null,
                title: 'Notification / Schedule',
                render: (_, __, row) => buildNotificationCell(row)
            },
            {
                data: null,
                title: 'Audience',
                render: (_, __, row) => getAudienceDescription(row)
            },
            {
                data: null,
                title: 'Event',
                render: (_, __, row) => buildEventCell(row)
            },
            {
                data: null,
                title: 'Scheduled Date',
                render: (_, __, row) => buildScheduleCell(row)
            },
            {
                data: null,
                title: 'Actions',
                orderable: false,
                render: (_, __, row) => buildActionsCell(row)
            }
        ],
        drawCallback: function () {
            if (window.feather && typeof window.feather.replace === 'function') {
                window.feather.replace();
            }
        },
        initComplete: function () {
            const dateFilterHtml = `
                <div class="date-filter-container d-flex align-items-center">
                    <div class="filter-group mr-3">
                        <label class="small mr-2">From:</label>
                        <input 
                            type="date" 
                            id="startDateFilter" 
                            class="form-control form-control-sm"
                        >
                    </div>
                    <div class="filter-group mr-3">
                        <label class="small mr-2">To:</label>
                        <input 
                            type="date" 
                            id="endDateFilter" 
                            class="form-control form-control-sm"
                        >
                    </div>
                    <div id="clearFilterBtn" class="filter-group" style="display: none;">
                        <button class="btn btn-light">
                            <i class="feather icon-x"></i> Clear Filter
                        </button>
                    </div>
                </div>
            `;

            $('.date-filter-wrapper').html(dateFilterHtml);
            setupDateFilter(this.api());

            if (!$('#addPushNotificationBtn').length && typeof onAdd === 'function') {
                $('.add-event-button').html(`
                    <button class="btn btn-primary d-flex align-items-center ml-2" id="addPushNotificationBtn">
                        <i class="feather icon-plus mr-1"></i>
                        Create
                    </button>
                `);

                $('#addPushNotificationBtn').on('click', () => onAdd());
            }

            if (window.feather && typeof window.feather.replace === 'function') {
                window.feather.replace();
            }
        }
    });

    dataTable.page(currentPage).draw(false);

    $(document)
        .off('click', '.push-view-btn')
        .on('click', '.push-view-btn', function () {
            const notificationId = $(this).data('id');
            if (notificationId && typeof onView === 'function') {
                onView(notificationId);
            }
        });

    $(document)
        .off('click', '.push-send-btn')
        .on('click', '.push-send-btn', function () {
            const notificationId = $(this).data('id');
            const status = $(this).data('status');
            if (notificationId && typeof onSend === 'function') {
                onSend(notificationId, status);
            }
        });

    $(document)
        .off('click', '.push-edit-btn')
        .on('click', '.push-edit-btn', function () {
            const notificationId = $(this).data('id');
            if (notificationId && typeof onEdit === 'function') {
                onEdit(notificationId);
            }
        });

    $(document)
        .off('click', '.push-delete-btn')
        .on('click', '.push-delete-btn', function () {
            const notificationId = $(this).data('id');
            if (notificationId && typeof onDelete === 'function') {
                onDelete(notificationId);
            }
        });

    return dataTable;
};

const PushNotificationsList = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { notifications, loading } = useSelector((state) => state.pushNotification || {});

    const [currentTable, setCurrentTable] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [notificationToDelete, setNotificationToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [sendModalState, setSendModalState] = useState({
        show: false,
        notificationId: null,
        status: null
    });

    const handleNavigateToCreate = useCallback(() => {
        navigate(PUSH_NOTIFICATION_PATHS.ADD_NOTIFICATION);
    }, [navigate]);

    const handleViewNotification = useCallback(
        (notificationId) => {
            if (!notificationId) return;
            navigate(`${PUSH_NOTIFICATION_PATHS.VIEW_NOTIFICATION}/${notificationId}`);
        },
        [navigate]
    );

    const handleEditNotification = useCallback(
        (notificationId) => {
            if (!notificationId) return;
            navigate(`${PUSH_NOTIFICATION_PATHS.EDIT_NOTIFICATION}/${notificationId}`);
        },
        [navigate]
    );

    const handleDeleteRequest = useCallback((notificationId) => {
        if (!notificationId) return;
        setNotificationToDelete(notificationId);
        setShowDeleteModal(true);
    }, []);

    const destroyTable = useCallback(() => {
        $(document).off('click', '.push-view-btn');
        $(document).off('click', '.push-send-btn');
        $(document).off('click', '.push-edit-btn');
        $(document).off('click', '.push-delete-btn');
        if ($.fn.DataTable.isDataTable(TABLE_SELECTOR)) {
            $(TABLE_SELECTOR).DataTable().clear().destroy();
        }

        setCurrentTable(null);
    }, []);

    useEffect(() => {
        dispatch(fetchPushNotifications());

        return () => {
            destroyTable();
        };
    }, [dispatch, destroyTable]);

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
            await dispatch(fetchPushNotifications());
        } finally {
            setIsSending(false);
            setSendModalState({
                show: false,
                notificationId: null,
                status: null
            });
        }
    }, [dispatch, sendModalState.notificationId]);

    const initializeTable = useCallback(() => {
        destroyTable();

        if (!Array.isArray(notifications)) {
            return;
        }

        const tableData = notifications.map((notification) => ({
            ...notification,
            startDate: notification.scheduledAt || notification.createdAt || null
        }));

        const tableInstance = ptable(tableData, {
            onAdd: handleNavigateToCreate,
            onView: handleViewNotification,
            onSend: handleOpenSendModal,
            onEdit: handleEditNotification,
            onDelete: handleDeleteRequest
        });

        setCurrentTable(tableInstance);
    }, [destroyTable, notifications, handleNavigateToCreate, handleViewNotification, handleOpenSendModal, handleEditNotification, handleDeleteRequest]);

    useEffect(() => {
        if (loading) {
            return;
        }

        initializeTable();

        return () => {
            destroyTable();
        };
    }, [loading, initializeTable, destroyTable]);

    useEffect(() => {
        return () => {
            if (currentTable && typeof currentTable.search === 'function') {
                resetFilters(currentTable);
            }
        };
    }, [currentTable]);

    const handleCloseDeleteModal = () => {
        if (isDeleting) return;
        setShowDeleteModal(false);
        setNotificationToDelete(null);
    };

    const handleConfirmDelete = async () => {
        if (!notificationToDelete) return;
        setIsDeleting(true);

        const success = await dispatch(deletePushNotification(notificationToDelete));
        if (success) {
            await dispatch(fetchPushNotifications());
            setShowDeleteModal(false);
            setNotificationToDelete(null);
            destroyTable();
        }

        setIsDeleting(false);
    };

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
                            {loading ? (
                                <div className="text-center py-4">
                                    <Spinner animation="border" variant="primary" role="status" />
                                    <p className="mt-2 mb-0 text-muted">Loading push notifications…</p>
                                </div>
                            ) : (
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
                            )}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </>
    );
};

export default PushNotificationsList;

