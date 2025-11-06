import React, { useState, useEffect, memo } from 'react';
import { Row, Col, Card, Form, Button } from 'react-bootstrap';

const FilterComponent = ({
    users = [],
    events = [],
    loadingDropdowns = false,
    onApplyFilters,
    onClearFilters,
    showUserFilter = true,
    showEventFilter = true,
    selectedUserId = '',
    selectedEventId = '',
    onUserChange,
    onEventChange,
    activeFilters = {},
    actionButtons = null
}) => {
    const handleApplyFilters = () => {
        if (onApplyFilters) {
            onApplyFilters({
                userId: selectedUserId,
                eventId: selectedEventId
            });
        }
    };

    const handleClearFilters = () => {
        if (onClearFilters) {
            onClearFilters();
        }
    };

    const hasActiveFilters = selectedUserId || selectedEventId;

    return (
        <Card className="mb-4 shadow-sm border-0" style={{ borderRadius: '8px' }}>
            <Card.Header
                className="bg-light border-0"
                style={{
                    padding: '16px 20px',
                    borderRadius: '8px 8px 0 0'
                }}
            >
                <div className="d-flex align-items-center justify-content-between">
                    <div className="d-flex align-items-center">
                        <i className="feather icon-filter mr-2" style={{ color: '#4680ff', fontSize: '18px' }}></i>
                        <h6 className="mb-0" style={{ fontWeight: '600', color: '#495057' }}>
                            Filter Options
                        </h6>
                    </div>
                    {Object.keys(activeFilters).length > 0 && (
                        <span
                            className="badge badge-primary"
                            style={{
                                backgroundColor: '#4680ff',
                                fontSize: '11px',
                                padding: '4px 8px'
                            }}
                        >
                            {Object.keys(activeFilters).length} Active
                        </span>
                    )}
                </div>
            </Card.Header>
            <Card.Body style={{ padding: '20px' }}>
                <Row className="align-items-end">
                    {/* User Filter */}
                    {showUserFilter && (
                        <Col xl={actionButtons ? 3 : 4} lg={actionButtons ? 3 : 4} md={actionButtons ? 6 : 6} sm={12} xs={12}>
                            <Form.Group className="mb-0">
                                <Form.Label
                                    style={{
                                        fontSize: '14px',
                                        fontWeight: '600',
                                        color: '#495057',
                                        marginBottom: '8px'
                                    }}
                                >
                                    <i className="feather icon-user mr-1"></i>
                                    Filter by User
                                </Form.Label>
                                <Form.Select
                                    value={selectedUserId}
                                    onChange={(e) => onUserChange && onUserChange(e.target.value)}
                                    disabled={loadingDropdowns}
                                    style={{
                                        borderRadius: '6px',
                                        border: '1px solid #ced4da',
                                        padding: '8px 12px',
                                        width: '100%',
                                        maxWidth: '100%',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis'
                                    }}
                                >
                                    <option value="">All Users</option>
                                    {users.map((user) => (
                                        <option key={user.id} value={user.id}>
                                            {user.firstName} {user.lastName} ({user.email})
                                        </option>
                                    ))}
                                </Form.Select>
                                {loadingDropdowns && <small className="text-muted mt-1">Loading users...</small>}
                            </Form.Group>
                        </Col>
                    )}

                    {/* Event Filter */}
                    {showEventFilter && (
                        <Col xl={actionButtons ? 3 : 4} lg={actionButtons ? 3 : 4} md={actionButtons ? 6 : 6} sm={12} xs={12}>
                            <Form.Group className="mb-0">
                                <Form.Label
                                    style={{
                                        fontSize: '14px',
                                        fontWeight: '600',
                                        color: '#495057',
                                        marginBottom: '8px'
                                    }}
                                >
                                    <i className="feather icon-calendar mr-1"></i>
                                    Filter by Event
                                </Form.Label>
                                <Form.Select
                                    value={selectedEventId}
                                    onChange={(e) => onEventChange && onEventChange(e.target.value)}
                                    disabled={loadingDropdowns}
                                    style={{
                                        borderRadius: '6px',
                                        border: '1px solid #ced4da',
                                        padding: '8px 12px',
                                        width: '100%',
                                        maxWidth: '100%',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis'
                                    }}
                                >
                                    <option value="">All Events</option>
                                    {events.map((event) => (
                                        <option key={event.id} value={event.id}>
                                            {event.name} {event.location ? `(${event.location})` : ''}
                                        </option>
                                    ))}
                                </Form.Select>
                                {loadingDropdowns && <small className="text-muted mt-1">Loading events...</small>}
                            </Form.Group>
                        </Col>
                    )}

                    {/* Action Buttons Column */}
                    {actionButtons && (
                        <Col xl={6} lg={6} md={12} sm={12} xs={12} className="d-flex justify-content-xl-end justify-content-lg-end justify-content-md-end justify-content-start align-items-end mt-xl-0 mt-lg-0 mt-md-0 mt-3">
                            <div className="d-flex flex-wrap" style={{ gap: '12px' }}>
                                <Button
                                    variant="primary"
                                    onClick={handleApplyFilters}
                                    disabled={loadingDropdowns}
                                    style={{
                                        backgroundColor: '#4680ff',
                                        border: 'none',
                                        borderRadius: '6px',
                                        padding: '8px 14px',
                                        fontSize: '13px',
                                        fontWeight: '500',
                                        minWidth: '85px',
                                        whiteSpace: 'nowrap'
                                    }}
                                >
                                    <i className="feather icon-search mr-1"></i>
                                    Apply
                                </Button>
                                {hasActiveFilters && (
                                    <Button
                                        variant="outline-secondary"
                                        onClick={handleClearFilters}
                                        style={{
                                            borderRadius: '6px',
                                            padding: '8px 14px',
                                            fontSize: '13px',
                                            fontWeight: '500',
                                            minWidth: '75px',
                                            whiteSpace: 'nowrap'
                                        }}
                                    >
                                        <i className="feather icon-x mr-1"></i>
                                        Clear
                                    </Button>
                                )}
                                {actionButtons}
                            </div>
                        </Col>
                    )}

                    {/* Apply/Clear Buttons - Only show if no action buttons */}
                    {!actionButtons && (
                        <Col xl={4} lg={4} md={12} sm={12} xs={12} className="mt-md-3 mt-sm-3 mt-3">
                            <div
                                className="d-flex align-items-end justify-content-xl-end justify-content-lg-end justify-content-md-start justify-content-sm-start justify-content-start flex-wrap"
                                style={{ gap: '12px' }}
                            >
                                <Button
                                    variant="primary"
                                    onClick={handleApplyFilters}
                                    disabled={loadingDropdowns}
                                    style={{
                                        backgroundColor: '#4680ff',
                                        border: 'none',
                                        borderRadius: '6px',
                                        padding: '8px 14px',
                                        fontSize: '13px',
                                        fontWeight: '500',
                                        minWidth: '85px',
                                        whiteSpace: 'nowrap'
                                    }}
                                >
                                    <i className="feather icon-search mr-1"></i>
                                    Apply
                                </Button>
                                {hasActiveFilters && (
                                    <Button
                                        variant="outline-secondary"
                                        onClick={handleClearFilters}
                                        style={{
                                            borderRadius: '6px',
                                            padding: '8px 14px',
                                            fontSize: '13px',
                                            fontWeight: '500',
                                            minWidth: '75px',
                                            whiteSpace: 'nowrap'
                                        }}
                                    >
                                        <i className="feather icon-x mr-1"></i>
                                        Clear
                                    </Button>
                                )}
                            </div>
                        </Col>
                    )}
                </Row>
            </Card.Body>
        </Card>
    );
};

export default memo(FilterComponent);
