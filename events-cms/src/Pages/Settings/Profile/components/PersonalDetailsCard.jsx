import React from 'react';
import { Row, Col, Card, Badge } from 'react-bootstrap';

const PersonalDetailsCard = ({ 
    user, 
    fullName, 
    isEditMode, 
    onToggleEdit, 
    onSave, 
    onCancel,
    firstNameRef,
    lastNameRef,
    addressRef,
    cityRef,
    stateRef,
    postalCodeRef
}) => {
    const profileStyles = {
        infoCard: {
            borderRadius: '12px',
            border: 'none',
            boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
            transition: 'all 0.3s ease',
            marginBottom: '1.5rem',
            overflow: 'hidden'
        },
        sectionHeader: {
            background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
            padding: '1.25rem 1.5rem',
            borderBottom: '2px solid #e9ecef',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
        },
        formInput: {
            borderRadius: '8px',
            border: '1px solid #e0e0e0',
            padding: '0.75rem 1rem',
            transition: 'all 0.3s ease',
            fontSize: '0.95rem'
        },
        saveButton: {
            borderRadius: '8px',
            padding: '0.75rem 2rem',
            fontWeight: '600',
            fontSize: '0.95rem',
            boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
            transition: 'all 0.3s ease'
        },
        infoItem: {
            padding: '1rem 1.5rem',
            borderBottom: '1px solid #f0f0f0',
            transition: 'background 0.2s ease'
        }
    };

    return (
        <Card style={profileStyles.infoCard} className="info-card-hover">
            <div style={profileStyles.sectionHeader}>
                <div className="d-flex align-items-center">
                    <h5 className="section-title mb-0">Personal details</h5>
                </div>
                <button
                    type="button"
                    className="edit-icon-btn"
                    onClick={onToggleEdit}
                    title={isEditMode ? 'Cancel' : 'Edit'}
                >
                    <i className={isEditMode ? 'feather icon-x' : 'feather icon-edit'} />
                </button>
            </div>

            {/* View Mode */}
            <div className={isEditMode ? 'collapse' : 'collapse show'}>
                <div style={profileStyles.infoItem} className="info-item-hover">
                    <div className="info-label mb-2">Full name</div>
                    <div className="d-flex align-items-center">
                        <Badge className="mr-3" style={{ 
                            width: '32px', 
                            height: '32px', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            borderRadius: '50%',
                            backgroundColor: '#667eea'
                        }}>
                            <i className="feather icon-user text-white" style={{ fontSize: '16px' }} />
                        </Badge>
                        <div className="info-value">{fullName || 'Not provided'}</div>
                    </div>
                </div>
                <div style={profileStyles.infoItem} className="info-item-hover">
                    <div className="info-label mb-2">Location</div>
                    <div className="d-flex align-items-center">
                        <Badge className="mr-3" style={{ 
                            width: '32px', 
                            height: '32px', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            borderRadius: '50%',
                            backgroundColor: '#667eea'
                        }}>
                            <i className="feather icon-map-pin text-white" style={{ fontSize: '16px' }} />
                        </Badge>
                        <div className="info-value">
                            {user?.address && <div>{user.address}</div>}
                            {(user?.city || user?.state) && (
                                <div>{[user.city, user.state].filter(Boolean).join(', ')}</div>
                            )}
                            {user?.postalCode && <div>{user.postalCode}</div>}
                            {!user?.address && !user?.city && !user?.state && !user?.postalCode && (
                                <span style={{ color: '#a0aec0' }}>Not provided</span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Edit Mode */}
            <div className={isEditMode ? 'collapse show' : 'collapse'}>
                <div style={{ padding: '1.5rem' }}>
                    <Row className="mb-3">
                        <Col md={6}>
                            <label className="info-label mb-2 d-block">First name</label>
                            <input
                                type="text"
                                className="form-control"
                                placeholder="First Name"
                                defaultValue={user?.firstName}
                                ref={firstNameRef}
                                style={profileStyles.formInput}
                            />
                        </Col>
                        <Col md={6}>
                            <label className="info-label mb-2 d-block">Last name</label>
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Last Name"
                                defaultValue={user?.lastName}
                                ref={lastNameRef}
                                style={profileStyles.formInput}
                            />
                        </Col>
                    </Row>
                    <Row className="mb-3">
                        <Col md={12}>
                            <label className="info-label mb-2 d-block">Address</label>
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Street Address"
                                defaultValue={user?.address}
                                ref={addressRef}
                                style={profileStyles.formInput}
                            />
                        </Col>
                    </Row>
                    <Row className="mb-3">
                        <Col md={6}>
                            <label className="info-label mb-2 d-block">City</label>
                            <input
                                type="text"
                                className="form-control"
                                placeholder="City"
                                defaultValue={user?.city}
                                ref={cityRef}
                                style={profileStyles.formInput}
                            />
                        </Col>
                        <Col md={3}>
                            <label className="info-label mb-2 d-block">State</label>
                            <input
                                type="text"
                                className="form-control"
                                placeholder="State"
                                defaultValue={user?.state}
                                ref={stateRef}
                                style={profileStyles.formInput}
                            />
                        </Col>
                        <Col md={3}>
                            <label className="info-label mb-2 d-block">Postal code</label>
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Postal Code"
                                defaultValue={user?.postalCode}
                                ref={postalCodeRef}
                                style={profileStyles.formInput}
                            />
                        </Col>
                    </Row>
                    <div className="d-flex justify-content-end gap-2">
                        <button
                            type="button"
                            className="btn btn-light"
                            onClick={onCancel}
                            style={{ borderRadius: '8px', padding: '0.75rem 1.5rem' }}
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            className="btn btn-primary"
                            onClick={onSave}
                            style={profileStyles.saveButton}
                        >
                            <i className="feather icon-save mr-2" />
                            Save Changes
                        </button>
                    </div>
                </div>
            </div>
        </Card>
    );
};

export default PersonalDetailsCard;

