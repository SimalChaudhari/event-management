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
    showDateFilter = true,
    selectedUserId = '',
    selectedEventId = '',
    startDate = '',
    endDate = '',
    onUserChange,
    onEventChange,
    onStartDateChange,
    onEndDateChange,
    activeFilters = {},
    actionButtons = null,
    headerActions = null
}) => {
    const handleApplyFilters = () => {
        if (onApplyFilters) {
            // Find the selected event to get its name directly
            // This ensures we have the event name even if events array isn't populated in the hook yet
            let eventName = null;
            if (selectedEventId && events.length > 0) {
                const selectedEvent = events.find(event => {
                    const eventId = String(event.id || event.eventId || '');
                    const searchId = String(selectedEventId);
                    return eventId === searchId;
                });
                if (selectedEvent) {
                    eventName = selectedEvent.name || selectedEvent.eventName || selectedEvent.event_name || null;
                }
            }
            
            onApplyFilters({
                userId: selectedUserId,
                eventId: selectedEventId,
                eventName: eventName, // Pass event name directly to avoid lookup issues
                startDate: startDate,
                endDate: endDate
            });
        }
    };

    const handleClearFilters = () => {
        if (onClearFilters) {
            onClearFilters();
        }
    };

    const hasActiveFilters = selectedUserId || selectedEventId || startDate || endDate;
    
    // Check if filters need to be applied (selected filters differ from active filters)
    // Show Apply button when selected filters are different from currently active filters
    const needsApply = (selectedUserId && selectedUserId !== activeFilters.user) || 
                      (selectedEventId && selectedEventId !== activeFilters.event) ||
                      (startDate && startDate !== activeFilters.startDate) ||
                      (endDate && endDate !== activeFilters.endDate) ||
                      (!selectedUserId && activeFilters.user) ||
                      (!selectedEventId && activeFilters.event) ||
                      (!startDate && activeFilters.startDate) ||
                      (!endDate && activeFilters.endDate);

    return (
        <Card className="mb-4 shadow-sm border-0" style={{ borderRadius: '8px' }}>
            <Card.Header
                className="bg-light border-0"
                style={{
                    padding: '16px 20px',
                    borderRadius: '8px 8px 0 0'
                }}
            >
                <div className="d-flex align-items-center justify-content-between flex-wrap">
                    <div className="d-flex align-items-center">
                        <i className="feather icon-filter mr-2" style={{ color: '#4680ff', fontSize: '18px' }}></i>
                        <h6 className="mb-0" style={{ fontWeight: '600', color: '#495057' }}>
                            Filter Options
                        </h6>
                    </div>
                    <div className="d-flex align-items-center">
                        {Object.keys(activeFilters).length > 0 && (
                            <span
                                className="badge badge-primary mr-2"
                                style={{
                                    backgroundColor: '#4680ff',
                                    fontSize: '11px',
                                    padding: '4px 8px'
                                }}
                            >
                                {Object.keys(activeFilters).length} Active
                            </span>
                        )}
                        {headerActions}
                    </div>
                </div>
            </Card.Header>
            <Card.Body style={{ padding: '20px' }}>
                <Row className="align-items-end">
                    {/* User Filter */}
                    {showUserFilter && (
                        <Col xl={actionButtons && showDateFilter ? 2 : actionButtons ? 3 : showDateFilter ? 2 : 4} lg={actionButtons && showDateFilter ? 2 : actionButtons ? 3 : showDateFilter ? 2 : 4} md={actionButtons ? 6 : 6} sm={12} xs={12} className="mb-xl-0 mb-lg-0 mb-md-3 mb-sm-3 mb-3">
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
                        <Col xl={actionButtons && showDateFilter ? 2 : actionButtons ? 3 : showDateFilter ? 2 : 4} lg={actionButtons && showDateFilter ? 2 : actionButtons ? 3 : showDateFilter ? 2 : 4} md={actionButtons ? 6 : 6} sm={12} xs={12} className="mb-xl-0 mb-lg-0 mb-md-3 mb-sm-3 mb-3">
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

                    {/* Date Filters */}
                    {showDateFilter && (
                        <>
                            <Col key="start-date-filter" xl={actionButtons ? 2 : 3} lg={actionButtons ? 2 : 3} md={actionButtons ? 6 : 6} sm={12} xs={12} className="mb-xl-0 mb-lg-0 mb-md-3 mb-sm-3 mb-3">
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
                                        From Date
                                    </Form.Label>
                                    <Form.Control
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => {
                                            const selectedStartDate = e.target.value;
                                            if (onStartDateChange) {
                                                onStartDateChange(selectedStartDate);
                                            }
                                            // Set max date for end date
                                            if (selectedStartDate && endDate && new Date(selectedStartDate) > new Date(endDate)) {
                                                if (onEndDateChange) {
                                                    onEndDateChange('');
                                                }
                                            }
                                        }}
                                        max={endDate || undefined}
                                        style={{
                                            borderRadius: '6px',
                                            border: '1px solid #ced4da',
                                            padding: '8px 12px'
                                        }}
                                    />
                                </Form.Group>
                            </Col>
                            <Col key="end-date-filter" xl={actionButtons ? 2 : 3} lg={actionButtons ? 2 : 3} md={actionButtons ? 6 : 6} sm={12} xs={12} className="mb-xl-0 mb-lg-0 mb-md-3 mb-sm-3 mb-3">
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
                                        To Date
                                    </Form.Label>
                                    <Form.Control
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => {
                                            const selectedEndDate = e.target.value;
                                            if (selectedEndDate && startDate && new Date(selectedEndDate) < new Date(startDate)) {
                                                alert('End date cannot be earlier than start date');
                                                return;
                                            }
                                            if (onEndDateChange) {
                                                onEndDateChange(selectedEndDate);
                                            }
                                        }}
                                        min={startDate || undefined}
                                        style={{
                                            borderRadius: '6px',
                                            border: '1px solid #ced4da',
                                            padding: '8px 12px'
                                        }}
                                    />
                                </Form.Group>
                            </Col>
                        </>
                    )}

                    {/* Action Buttons Column */}
                    {actionButtons && (
                        <Col xl={showDateFilter ? 4 : 6} lg={showDateFilter ? 4 : 6} md={12} sm={12} xs={12} className="d-flex justify-content-xl-end justify-content-lg-end justify-content-md-start justify-content-sm-start justify-content-start align-items-center mt-xl-0 mt-lg-0 mt-md-4 mt-sm-4 mt-4">
                            <div className="d-flex flex-wrap align-items-center" style={{ gap: '10px', width: '100%' }}>
                                {needsApply && (
                                    <Button
                                        variant="primary"
                                        onClick={handleApplyFilters}
                                        disabled={loadingDropdowns}
                                        className="mb-2 mb-xl-0 mb-lg-0 mb-md-0 mb-sm-0"
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
                                )}
                                {hasActiveFilters && (
                                    <Button
                                        variant="outline-secondary"
                                        onClick={handleClearFilters}
                                        className="mb-2 mb-xl-0 mb-lg-0 mb-md-0 mb-sm-0"
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
                                {needsApply && (
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
                                )}
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
