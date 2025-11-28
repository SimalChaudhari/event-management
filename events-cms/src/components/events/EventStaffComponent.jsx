import React from 'react';
import { Row, Col, Badge } from 'react-bootstrap';
import { API_URL, DUMMY_PATH_USER } from '../../configs/env';
import StandardComponentTemplate from '../StandardComponentTemplate';

/**
 * EventStaffComponent - Component to display event staff (users who switched to exhibitor role)
 * @param {Array} eventStaff - Array of event staff user objects
 * @param {Boolean} showTitle - Whether to show the title and template wrapper (default: true)
 */
const EventStaffComponent = ({ eventStaff, showTitle = true }) => {
    // Check if event staff data exists
    if (!eventStaff?.length) {
        if (!showTitle) {
            return null; // Don't show anything if no staff and title is hidden
        }
        return (
            <StandardComponentTemplate 
                title="Event Staff" 
                borderColor="info"
            >
                <div className="text-center py-4">
                    <i className="fas fa-users fa-2x text-muted mb-2"></i>
                    <p className="text-muted">No event staff available.</p>
                </div>
            </StandardComponentTemplate>
        );
    }

    // Render individual staff member card
    const renderStaffCard = (staff) => {
        const profilePictureUrl = staff.profilePicture 
            ? `${API_URL}/${staff.profilePicture.replace(/\\/g, '/')}` 
            : DUMMY_PATH_USER;

        const fullName = `${staff.firstName || ''} ${staff.lastName || ''}`.trim() || 'N/A';
        const initials = fullName !== 'N/A' 
            ? `${staff.firstName?.charAt(0) || ''}${staff.lastName?.charAt(0) || ''}`.toUpperCase()
            : '?';

        return (
            <Col key={staff.id} xs={12} sm={6} md={4} lg={3} className="mb-3">
                <div className="card border-0 shadow-sm h-100" style={{
                    borderRadius: '12px',
                    transition: 'all 0.3s ease',
                    overflow: 'hidden',
                    border: '1px solid #e9ecef'
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.12)';
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.borderColor = '#17a2b8';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.borderColor = '#e9ecef';
                }}>
                    <div className="card-body p-3">
                        {/* Profile Picture with better styling */}
                        <div className="text-center mb-3">
                            <div style={{
                                position: 'relative',
                                display: 'inline-block',
                                margin: '0 auto'
                            }}>
                                <img
                                    src={profilePictureUrl}
                                    alt={fullName}
                                    onError={(e) => {
                                        e.target.style.display = 'none';
                                        e.target.nextSibling.style.display = 'flex';
                                    }}
                                    style={{
                                        width: '90px',
                                        height: '90px',
                                        borderRadius: '50%',
                                        objectFit: 'cover',
                                        border: '4px solid #f8f9fa',
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                                    }}
                                />
                                {/* Fallback for missing image */}
                                <div style={{
                                    display: 'none',
                                    width: '90px',
                                    height: '90px',
                                    borderRadius: '50%',
                                    backgroundColor: '#17a2b8',
                                    color: 'white',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '32px',
                                    fontWeight: 'bold',
                                    border: '4px solid #f8f9fa',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                    margin: '0 auto'
                                }}>
                                    {initials}
                                </div>
                            </div>
                        </div>

                        {/* Name */}
                        <h6 className="text-center mb-2" style={{
                            fontSize: '16px',
                            fontWeight: '600',
                            color: '#2c3e50',
                            marginBottom: '10px',
                            lineHeight: '1.4'
                        }}>
                            {fullName}
                        </h6>

                        {/* Role Badge */}
                        <div className="text-center mb-3">
                            <Badge 
                                bg="warning" 
                                style={{ 
                                    fontSize: '11px', 
                                    padding: '6px 14px',
                                    fontWeight: '600',
                                    borderRadius: '20px',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px'
                                }}
                            >
                                <i className="fas fa-briefcase" style={{ marginRight: '6px' }}></i>
                                Event Staff
                            </Badge>
                        </div>

                        {/* Contact Information */}
                        <div style={{ 
                            backgroundColor: '#f8f9fa',
                            borderRadius: '8px',
                            padding: '12px',
                            marginBottom: '10px'
                        }}>
                            {/* Email */}
                            {staff.email && (
                                <div className="mb-2" style={{ fontSize: '12px' }}>
                                    <div className="d-flex align-items-start">
                                        <i className="fas fa-envelope text-primary mt-1" style={{ fontSize: '13px', minWidth: '20px', marginRight: '10px' }}></i>
                                        <span className="text-muted" style={{
                                            wordBreak: 'break-word',
                                            overflowWrap: 'break-word',
                                            lineHeight: '1.5'
                                        }}>
                                            {staff.email}
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* Mobile */}
                            {staff.mobile && (
                                <div style={{ fontSize: '12px' }}>
                                    <div className="d-flex align-items-center">
                                        <i className="fas fa-phone text-success" style={{ fontSize: '13px', minWidth: '20px', marginRight: '10px' }}></i>
                                        <span className="text-muted" style={{ lineHeight: '1.5' }}>
                                            {staff.mobile}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Added Date */}
                        {staff.createdAt && (
                            <div className="text-center pt-2" style={{ 
                                borderTop: '1px solid #e9ecef',
                                fontSize: '11px',
                                color: '#6c757d',
                                fontStyle: 'italic'
                            }}>
                                <i className="fas fa-calendar-alt" style={{ marginRight: '8px' }}></i>
                                Added: {new Date(staff.createdAt).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric'
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </Col>
        );
    };

    const content = (
        <div className={showTitle ? "p-3" : ""}>
            {showTitle && (
                <p className="text-muted mb-4" style={{ fontSize: '14px' }}>
                    Users who have switched to exhibitor role for this event using booth code.
                </p>
            )}
            <Row>
                {eventStaff.map(renderStaffCard)}
            </Row>
        </div>
    );

    if (showTitle) {
        return (
            <StandardComponentTemplate 
                title="Event Staff" 
                borderColor="info"
            >
                {content}
            </StandardComponentTemplate>
        );
    }

    return content;
};

export default EventStaffComponent;

