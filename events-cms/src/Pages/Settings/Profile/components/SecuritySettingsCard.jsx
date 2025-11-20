import React from 'react';
import { Row, Col, Card } from 'react-bootstrap';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';

const SecuritySettingsCard = ({ 
    isEditMode, 
    onToggleEdit, 
    onSave,
    dispatch
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
        }
    };

    const passwordChangeSchema = Yup.object().shape({
        currentPassword: Yup.string()
            .required('Current password is required'),
        newPassword: Yup.string()
            .required('New password is required')
            .min(8, 'Password must be at least 8 characters')
            .matches(
                /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
                'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
            ),
        confirmPassword: Yup.string()
            .required('Confirm password is required')
            .oneOf([Yup.ref('newPassword'), null], 'Passwords must match')
    });

    return (
        <Card style={profileStyles.infoCard} className="info-card-hover">
            <div style={profileStyles.sectionHeader}>
                <div className="d-flex align-items-center">
                    <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '10px',
                        background: 'linear-gradient(135deg, #f56565, #e53e3e)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: '1rem'
                    }}>
                        <i className="feather icon-lock text-white" />
                    </div>
                    <h5 className="section-title mb-0">Change password</h5>
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
            
            {isEditMode && (
                <div style={{ padding: '1.5rem' }}>
                    <Formik
                        initialValues={{
                            currentPassword: '',
                            newPassword: '',
                            confirmPassword: ''
                        }}
                        validationSchema={passwordChangeSchema}
                        onSubmit={async (values, { resetForm }) => {
                            try {
                                const result = await onSave(values);
                                if (result?.success) {
                                    resetForm();
                                    onToggleEdit();
                                }
                            } catch (error) {
                                toast.error('Failed to change password');
                            }
                        }}
                    >
                        {({ values, errors, touched, handleChange, handleBlur, isSubmitting }) => (
                            <Form>
                                <Row className="mb-3">
                                    <Col md={12}>
                                        <label className="info-label mb-2 d-block">Current password</label>
                                        <div className="input-group">
                                            <Field
                                                type="password"
                                                name="currentPassword"
                                                className={`form-control ${errors.currentPassword && touched.currentPassword ? 'is-invalid' : ''}`}
                                                placeholder="Enter current password"
                                                id="current-password"
                                                style={profileStyles.formInput}
                                            />
                                            <div className="input-group-append">
                                                <button
                                                    className="btn btn-outline-secondary"
                                                    type="button"
                                                    onClick={() => {
                                                        const input = document.getElementById('current-password');
                                                        if (input.type === 'password') {
                                                            input.type = 'text';
                                                        } else {
                                                            input.type = 'password';
                                                        }
                                                    }}
                                                    style={{ borderRadius: '0 8px 8px 0' }}
                                                >
                                                    <i className="feather icon-eye" />
                                                </button>
                                            </div>
                                            <ErrorMessage
                                                name="currentPassword"
                                                component="div"
                                                className="invalid-feedback"
                                            />
                                        </div>
                                    </Col>
                                </Row>
                                <Row className="mb-3">
                                    <Col md={12}>
                                        <label className="info-label mb-2 d-block">New password</label>
                                        <div className="input-group">
                                            <Field
                                                type="password"
                                                name="newPassword"
                                                className={`form-control ${errors.newPassword && touched.newPassword ? 'is-invalid' : ''}`}
                                                placeholder="Enter new password"
                                                id="new-password"
                                                style={profileStyles.formInput}
                                            />
                                            <div className="input-group-append">
                                                <button
                                                    className="btn btn-outline-secondary"
                                                    type="button"
                                                    onClick={() => {
                                                        const input = document.getElementById('new-password');
                                                        if (input.type === 'password') {
                                                            input.type = 'text';
                                                        } else {
                                                            input.type = 'password';
                                                        }
                                                    }}
                                                    style={{ borderRadius: '0 8px 8px 0' }}
                                                >
                                                    <i className="feather icon-eye" />
                                                </button>
                                            </div>
                                            <ErrorMessage
                                                name="newPassword"
                                                component="div"
                                                className="invalid-feedback"
                                            />
                                        </div>
                                    </Col>
                                </Row>
                                <Row className="mb-3">
                                    <Col md={12}>
                                        <label className="info-label mb-2 d-block">Confirm new password</label>
                                        <div className="input-group">
                                            <Field
                                                type="password"
                                                name="confirmPassword"
                                                className={`form-control ${errors.confirmPassword && touched.confirmPassword ? 'is-invalid' : ''}`}
                                                placeholder="Confirm new password"
                                                id="confirm-password"
                                                style={profileStyles.formInput}
                                            />
                                            <div className="input-group-append">
                                                <button
                                                    className="btn btn-outline-secondary"
                                                    type="button"
                                                    onClick={() => {
                                                        const input = document.getElementById('confirm-password');
                                                        if (input.type === 'password') {
                                                            input.type = 'text';
                                                        } else {
                                                            input.type = 'password';
                                                        }
                                                    }}
                                                    style={{ borderRadius: '0 8px 8px 0' }}
                                                >
                                                    <i className="feather icon-eye" />
                                                </button>
                                            </div>
                                            <ErrorMessage
                                                name="confirmPassword"
                                                component="div"
                                                className="invalid-feedback"
                                            />
                                        </div>
                                    </Col>
                                </Row>
                                <div className="d-flex justify-content-end gap-2">
                                    <button
                                        type="button"
                                        className="btn btn-light"
                                        onClick={onToggleEdit}
                                        style={{ borderRadius: '8px', padding: '0.75rem 1.5rem' }}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn btn-primary"
                                        disabled={isSubmitting}
                                        style={profileStyles.saveButton}
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm mr-2" />
                                                Changing...
                                            </>
                                        ) : (
                                            <>
                                                <i className="feather icon-save mr-2" />
                                                Change password
                                            </>
                                        )}
                                    </button>
                                </div>
                            </Form>
                        )}
                    </Formik>
                </div>
            )}
        </Card>
    );
};

export default SecuritySettingsCard;

