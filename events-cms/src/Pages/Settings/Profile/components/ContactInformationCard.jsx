import React from 'react';
import { Row, Col, Card } from 'react-bootstrap';
import SingaporePhoneInput from '../../../../components/SingaporePhoneInput';
import { formatPhoneDisplay } from '../../../../utils/phoneFormatter';

const ContactInformationCard = ({ 
    user, 
    isEditMode, 
    onToggleEdit, 
    onSave, 
    onCancel,
    mobileValue,
    setMobileValue,
    emailRef,
    linkedinProfileRef
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
                    <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '10px',
                        background: 'linear-gradient(135deg, #4299e1, #3182ce)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: '1rem'
                    }}>
                        <i className="feather icon-phone text-white" />
                    </div>
                    <h5 className="section-title mb-0">Contact Information</h5>
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
                    <div className="info-label mb-2">Mobile Number</div>
                    <a href={`tel:${user?.mobile}`} className="contact-link">
                        <i className="feather icon-phone" />
                        <span className="info-value">{formatPhoneDisplay(user?.mobile)}</span>
                    </a>
                </div>
                <div style={profileStyles.infoItem} className="info-item-hover">
                    <div className="info-label mb-2">Email Address</div>
                    <a href={`mailto:${user?.email}`} className="contact-link">
                        <i className="feather icon-mail" />
                        <span className="info-value">{user?.email}</span>
                    </a>
                </div>
                {user?.linkedinProfile && (
                    <div style={profileStyles.infoItem} className="info-item-hover">
                        <div className="info-label mb-2">LinkedIn Profile</div>
                        <a href={user.linkedinProfile} target="_blank" rel="noopener noreferrer" className="contact-link">
                            <i className="feather icon-globe" />
                            <span className="info-value">{user.linkedinProfile}</span>
                        </a>
                    </div>
                )}
            </div>

            {/* Edit Mode */}
            <div className={isEditMode ? 'collapse show' : 'collapse'}>
                <div style={{ padding: '1.5rem' }}>
                    <Row className="mb-3">
                        <Col md={12}>
                            <label className="info-label mb-2 d-block">Mobile Number</label>
                            <SingaporePhoneInput
                                name="mobile"
                                value={mobileValue || user?.mobile || ''}
                                onChange={(e) => {
                                    setMobileValue(e.target.value);
                                }}
                                placeholder="+65-XXXX-XXXX"
                                required={false}
                                showError={true}
                            />
                        </Col>
                    </Row>
                    <Row className="mb-3">
                        <Col md={12}>
                            <label className="info-label mb-2 d-block">Email Address</label>
                            <input
                                type="email"
                                className="form-control"
                                placeholder="Email"
                                defaultValue={user?.email}
                                ref={emailRef}
                                style={profileStyles.formInput}
                            />
                        </Col>
                    </Row>
                    <Row className="mb-3">
                        <Col md={12}>
                            <label className="info-label mb-2 d-block">LinkedIn Profile</label>
                            <input
                                type="text"
                                className="form-control"
                                placeholder="https://linkedin.com/in/yourprofile"
                                defaultValue={user?.linkedinProfile || ''}
                                ref={linkedinProfileRef}
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

export default ContactInformationCard;

