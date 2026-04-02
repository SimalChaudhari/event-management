import React, { memo } from 'react';
import { Row, Col, Card, Form, Button } from 'react-bootstrap';

/**
 * Reusable User Filter Component
 * Can be used in any page that needs user role filtering
 * 
 * @param {Array} filterOptions - Array of filter options {value, label}
 * @param {string} selectedFilter - Currently selected filter value
 * @param {Function} onFilterChange - Callback when filter changes
 * @param {string} filterLabel - Label for the filter dropdown
 * @param {string} filterIcon - Feather icon class name
 * @param {string} title - Card header title
 * @param {boolean} loading - Loading state
 * @param {Object} activeFilters - Object containing active filter information
 * @param {Function} onClearFilters - Callback to clear all filters
 * @param {string} allOptionLabel - Label for "all" option
 * @param {string} allOptionValue - Value for "all" option
 * @param {ReactNode} actionButtons - Additional action buttons to display on the right side
 */
const UserFilterComponent = ({
    filterOptions = [],
    selectedFilter = '',
    onFilterChange,
    filterLabel = 'Filter by Role',
    filterIcon = 'users',
    title = 'Filter Options',
    loading = false,
    activeFilters = {},
    onClearFilters,
    allOptionLabel = 'All Items',
    allOptionValue = 'all',
    actionButtons = null
}) => {
    // Auto-apply filter when dropdown changes
    const handleFilterChange = async (event) => {
        const newFilterValue = event.target.value;
        
        if (onFilterChange) {
            await onFilterChange(newFilterValue);
        }
    };

    const handleClearFilters = () => {
        if (onClearFilters) {
            onClearFilters();
        }
    };

    // Check if filter is active
    const hasActiveFilters = selectedFilter && selectedFilter !== allOptionValue;
    const activeFilterCount = Object.keys(activeFilters).length;

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
                            {title}
                        </h6>
                    </div>
                    {(hasActiveFilters || activeFilterCount > 0) && (
                        <span
                            className="badge badge-primary"
                            style={{
                                backgroundColor: '#4680ff',
                                fontSize: '11px',
                                padding: '4px 8px'
                            }}
                        >
                            {activeFilterCount > 0 ? `${activeFilterCount} Active` : '1 Active'}
                        </span>
                    )}
                </div>
            </Card.Header>
            <Card.Body style={{ padding: '20px' }}>
                <Row className="align-items-end">
                    <Col xl={actionButtons ? 4 : 12} lg={actionButtons ? 4 : 12} md={actionButtons ? 6 : 12} sm={12} xs={12}>
                        <Form.Group className="mb-0">
                            <Form.Label
                                style={{
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    color: '#495057',
                                    marginBottom: '8px'
                                }}
                            >
                                <i className={`feather icon-${filterIcon} mr-1`}></i>
                                {filterLabel}
                            </Form.Label>
                            <Form.Select
                                value={selectedFilter}
                                onChange={handleFilterChange}
                                disabled={loading}
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
                                <option value={allOptionValue}>{allOptionLabel}</option>
                                {filterOptions.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </Form.Select>
                            {loading && <small className="text-muted mt-1">Loading...</small>}
                        </Form.Group>
                    </Col>

                    {/* Action Buttons Column */}
                    {actionButtons && (
                        <Col xl={8} lg={8} md={6} sm={12} xs={12} className="d-flex justify-content-xl-end justify-content-lg-end justify-content-md-end justify-content-start align-items-end mt-xl-0 mt-lg-0 mt-md-0 mt-3">
                            <div className="d-flex flex-wrap" style={{ gap: '12px' }}>
                                {actionButtons}
                            </div>
                        </Col>
                    )}

                    {/* Clear Button - Only show if filters are active and no action buttons */}
                    {!actionButtons && (hasActiveFilters || activeFilterCount > 0) && (
                        <Col xl={4} lg={4} md={12} sm={12} xs={12} className="mt-md-3 mt-sm-3 mt-3">
                            <div
                                className="d-flex align-items-end justify-content-xl-end justify-content-lg-end justify-content-md-start justify-content-sm-start justify-content-start flex-wrap"
                                style={{ gap: '12px' }}
                            >
                                <Button
                                    variant="outline-secondary"
                                    onClick={handleClearFilters}
                                    disabled={loading}
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
                            </div>
                        </Col>
                    )}
                </Row>
            </Card.Body>
        </Card>
    );
};

export default memo(UserFilterComponent);
