import * as React from 'react';
import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { NavLink, useNavigate } from 'react-router-dom';
import { Formik, Form, Field, useField } from 'formik';
import { toast } from 'react-toastify';
import { forgetPassword, resetPassword } from '../../../store/actions/authActions';
import { getLogo } from '../../../store/actions/settingsActions';
import { API_URL } from '../../../configs/env';
import { forgotPasswordSchema, resetPasswordSchema } from '../../../utils/validation';
import './../../../assets/scss/style.scss';
import Breadcrumb from '../../../App/layout/AdminLayout/Breadcrumb/index';
import logoDark from '../../../assets/images/logo-dark.png';

// Custom Password Field Component
const PasswordField = ({ name, placeholder, showPassword, setShowPassword }) => {
    const [field, meta] = useField(name);
    
    return (
        <div style={{ position: 'relative' }}>
            <input
                {...field}
                type={showPassword ? 'text' : 'password'}
                id={name}
                className={`form-control ${meta.error && meta.touched ? 'is-invalid' : ''}`}
                placeholder={placeholder}
                autoComplete={name === 'newPassword' ? 'new-password' : 'current-password'}
                style={{
                    border: 'none',
                    borderBottom: '1px solid #d1d3e2',
                    borderRadius: '0',
                    padding: field.value ? '0.75rem 2.5rem 0.75rem 0' : '0.75rem 0',
                    fontSize: '0.875rem',
                    background: 'transparent',
                    color: '#000',
                    boxShadow: 'none',
                    width: '100%'
                }}
                onFocus={(e) => {
                    e.target.style.borderBottomColor = '#4285F4';
                }}
                onBlur={(e) => {
                    e.target.style.borderBottomColor = '#d1d3e2';
                }}
            />
            {field.value && (
                <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                        position: 'absolute',
                        right: '8px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: '#6c757d',
                        cursor: 'pointer',
                        padding: '4px',
                        fontSize: '14px',
                        width: '24px',
                        height: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '4px',
                        transition: 'color 0.2s ease',
                        zIndex: '2'
                    }}
                    onMouseEnter={(e) => { e.target.style.color = '#4285F4'; }}
                    onMouseLeave={(e) => { e.target.style.color = '#6c757d'; }}
                >
                    {showPassword ? (
                        <i className="fas fa-eye-slash" style={{ fontSize: '14px' }}></i>
                    ) : (
                        <i className="fas fa-eye" style={{ fontSize: '14px' }}></i>
                    )}
                </button>
            )}
        </div>
    );
};

// Custom OTP Field Component
const OtpField = ({ name }) => {
    const [field, meta] = useField(name);
    
    const handleOtpChange = (e) => {
        const value = e.target.value.replace(/\D/g, ''); // Only allow digits
        if (value.length <= 6) {
            field.onChange({ target: { name: field.name, value } });
        }
    };
    
    return (
        <div style={{ position: 'relative' }}>
            <input
                {...field}
                type="text"
                id={name}
                className={`form-control ${meta.error && meta.touched ? 'is-invalid' : ''}`}
                placeholder="Enter 6-digit OTP"
                maxLength={6}
                onChange={handleOtpChange}
                style={{
                    border: 'none',
                    borderBottom: '1px solid #d1d3e2',
                    borderRadius: '0',
                    padding: '0.75rem 0',
                    fontSize: '18px',
                    letterSpacing: '4px',
                    textAlign: 'center',
                    background: 'transparent',
                    color: '#000',
                    boxShadow: 'none',
                    width: '100%'
                }}
                onFocus={(e) => {
                    e.target.style.borderBottomColor = '#4285F4';
                }}
                onBlur={(e) => {
                    e.target.style.borderBottomColor = '#d1d3e2';
                }}
            />
        </div>
    );
};

const ResetPassword = () => {
    const [email, setEmail] = useState('');
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [step, setStep] = useState('forgot'); // 'forgot' or 'reset'
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const logoData = useSelector((state) => state.settings.logo);

    // Fetch logo on component mount
    useEffect(() => {
        dispatch(getLogo());
    }, [dispatch]);

    // Use dynamic logo from API if available, otherwise use static fallback
    const displayLogo = (logoData && logoData.imageUrl) ? `${API_URL}/${logoData.imageUrl}` : logoDark;

    const handleForgotPassword = async (values, { setSubmitting }) => {
        try {
            console.log('Sending forgot password request for:', values.email);
            const result = await dispatch(forgetPassword({ email: values.email }));
            console.log('Forgot password result:', result);
            
            if (result && result.success === true) {
                console.log('Success! Moving to reset step');
                setEmail(values.email);
                setStep('reset');
            }
        } catch (error) {
            console.error('Error in handleForgotPassword:', error);
        } finally {
            setSubmitting(false);
        }
    };

    const handleResetPassword = async (values, { setSubmitting }) => {
        try {
            const result = await dispatch(resetPassword({ 
                email, 
                otp: values.otp, 
                newPassword: values.newPassword 
            }));
            
            if (result && result.success) {
                navigate('/auth/signin');
            }
        } catch (error) {
            console.error('Error in handleResetPassword:', error);
        } finally {
            setSubmitting(false);
        }
    };

    const handleBackToForgot = () => {
        setStep('forgot');
        setEmail('');
    };

    return (
        <>
            <Breadcrumb />
            <div className="auth-wrapper" style={{ 
                background: '#4285F4',
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '20px'
            }}>
                <div className="auth-content">
                    <div className="card" style={{ 
                        border: '1px solid #e3e6f0',
                        borderRadius: '8px',
                        boxShadow: '0 0.15rem 1.75rem 0 rgba(58, 59, 69, 0.15)',
                        background: '#ffffff'
                    }}>
                        <div className="card-body" style={{ padding: '40px' }}>
                            {/* Logo Section */}
                            <div className="text-center mb-4">
                                <img 
                                    src={displayLogo} 
                                    alt="Logo" 
                                    className="img-fluid mb-3" 
                                    style={{ maxWidth: '180px', maxHeight: '60px', objectFit: 'contain' }}
                                />
                                <h3 className="mb-1" style={{ 
                                    color: '#5a5c69',
                                    fontWeight: '400',
                                    fontSize: '24px'
                                }}>
                                    {step === 'forgot' ? 'Forgot Password' : 'Reset Password'}
                                </h3>
                                <p className="text-muted mb-4" style={{ fontSize: '14px', color: '#858796' }}>
                                    {step === 'forgot' 
                                        ? 'Enter your email address and we\'ll send you an OTP to reset your password.'
                                        : `Enter the OTP sent to ${email} and your new password.`
                                    }
                                </p>
                            </div>
                            
                            {step === 'forgot' ? (
                                <Formik
                                    initialValues={{
                                        email: '',
                                    }}
                                    validationSchema={forgotPasswordSchema}
                                    onSubmit={handleForgotPassword}
                                    validateOnChange={true}
                                    validateOnBlur={true}
                                >
                                    {({ errors, touched, isSubmitting }) => (
                                        <Form noValidate>
                                            {/* Email Field */}
                                            <div className="form-group mb-4">
                                                <div style={{ position: 'relative' }}>
                                                    <Field
                                                        name="email"
                                                        type="email"
                                                        id="email"
                                                        className={`form-control ${errors.email && touched.email ? 'is-invalid' : ''}`}
                                                        placeholder="Email Address"
                                                        autoComplete="email"
                                                        style={{
                                                            border: 'none',
                                                            borderBottom: '1px solid #d1d3e2',
                                                            borderRadius: '0',
                                                            padding: '0.75rem 0',
                                                            fontSize: '0.875rem',
                                                            background: 'transparent',
                                                            color: '#000',
                                                            boxShadow: 'none'
                                                        }}
                                                        onFocus={(e) => {
                                                            e.target.style.borderBottomColor = '#4285F4';
                                                        }}
                                                        onBlur={(e) => {
                                                            e.target.style.borderBottomColor = '#d1d3e2';
                                                        }}
                                                    />
                                                </div>
                                                {errors.email ? (
                                                    <div className="invalid-feedback" style={{
                                                        fontSize: '14px',
                                                        marginTop: '8px',
                                                        fontWeight: '500',
                                                        color: '#dc3545',
                                                        display: 'block'
                                                    }}>
                                                        {errors.email}
                                                    </div>
                                                ) : null}
                                            </div>

                                            {/* Submit Button */}
                                            <button 
                                                className="btn btn-primary w-100 mb-4" 
                                                type="submit" 
                                                disabled={isSubmitting}
                                                style={{
                                                    borderRadius: '4px',
                                                    padding: '12px',
                                                    fontSize: '16px',
                                                    fontWeight: '500',
                                                    background: '#4285F4',
                                                    border: 'none',
                                                    color: '#fff',
                                                    transition: 'background-color 0.2s ease'
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.target.style.background = '#3367d6';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.target.style.background = '#4285F4';
                                                }}
                                            >
                                                {isSubmitting ? (
                                                    <>
                                                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                                        Sending...
                                                    </>
                                                ) : (
                                                    'Send OTP'
                                                )}
                                            </button>
                                        </Form>
                                    )}
                                </Formik>
                            ) : (
                                <Formik
                                    initialValues={{
                                        otp: '',
                                        newPassword: '',
                                        confirmPassword: '',
                                    }}
                                    validationSchema={resetPasswordSchema}
                                    onSubmit={handleResetPassword}
                                    validateOnChange={true}
                                    validateOnBlur={true}
                                >
                                    {({ errors, touched, isSubmitting }) => (
                                        <Form noValidate>
                                            {/* OTP Field */}
                                            <div className="form-group mb-3">
                                                <OtpField name="otp" />
                                                {errors.otp ? (
                                                    <div className="invalid-feedback" style={{
                                                        fontSize: '14px',
                                                        marginTop: '8px',
                                                        fontWeight: '500',
                                                        color: '#dc3545',
                                                        display: 'block'
                                                    }}>
                                                        {errors.otp}
                                                    </div>
                                                ) : null}
                                            </div>

                                            {/* New Password Field */}
                                            <div className="form-group mb-3">
                                                <PasswordField 
                                                    name="newPassword"
                                                    placeholder="New Password"
                                                    showPassword={showNewPassword} 
                                                    setShowPassword={setShowNewPassword} 
                                                />
                                                {errors.newPassword ? (
                                                    <div className="invalid-feedback" style={{ 
                                                        fontSize: '14px',
                                                        marginTop: '8px',
                                                        fontWeight: '500',
                                                        color: '#dc3545',
                                                        display: 'block'
                                                    }}>
                                                        {errors.newPassword}
                                                    </div>
                                                ) : null}
                                            </div>

                                            {/* Confirm Password Field */}
                                            <div className="form-group mb-4">
                                                <PasswordField 
                                                    name="confirmPassword"
                                                    placeholder="Confirm New Password"
                                                    showPassword={showConfirmPassword} 
                                                    setShowPassword={setShowConfirmPassword} 
                                                />
                                                {errors.confirmPassword ? (
                                                    <div className="invalid-feedback" style={{ 
                                                        fontSize: '14px',
                                                        marginTop: '8px',
                                                        fontWeight: '500',
                                                        color: '#dc3545',
                                                        display: 'block'
                                                    }}>
                                                        {errors.confirmPassword}
                                                    </div>
                                                ) : null}
                                            </div>

                                            {/* Submit Button */}
                                            <button 
                                                className="btn btn-primary w-100 mb-4" 
                                                type="submit" 
                                                disabled={isSubmitting}
                                                style={{
                                                    borderRadius: '4px',
                                                    padding: '12px',
                                                    fontSize: '16px',
                                                    fontWeight: '500',
                                                    background: '#4285F4',
                                                    border: 'none',
                                                    color: '#fff',
                                                    transition: 'background-color 0.2s ease'
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.target.style.background = '#3367d6';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.target.style.background = '#4285F4';
                                                }}
                                            >
                                                {isSubmitting ? (
                                                    <>
                                                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                                        Resetting...
                                                    </>
                                                ) : (
                                                    'Reset Password'
                                                )}
                                            </button>

                                            {/* Info Alert */}
                                            <div className="alert alert-info mb-3" style={{
                                                fontSize: '12px',
                                                padding: '8px 12px',
                                                borderRadius: '4px',
                                                background: '#e3f2fd',
                                                border: '1px solid #bbdefb',
                                                color: '#1976d2'
                                            }}>
                                                <strong>Note:</strong> OTP is valid for 10 minutes. Check your spam folder if you don't see the email.
                                            </div>

                                            {/* Back Button */}
                                            <div className="text-center">
                                                <button 
                                                    className="btn btn-link" 
                                                    onClick={handleBackToForgot}
                                                    type="button"
                                                    style={{
                                                        fontSize: '14px',
                                                        color: '#667eea',
                                                        textDecoration: 'none',
                                                        fontWeight: '500',
                                                        background: 'none',
                                                        border: 'none',
                                                        padding: '0'
                                                    }}
                                                >
                                                    ← Back to Forgot Password
                                                </button>
                                            </div>
                                        </Form>
                                    )}
                                </Formik>
                            )}
                            
                            {/* Sign In Link */}
                            <div className="text-center mt-4">
                                <p className="mb-0" style={{ fontSize: '14px', color: '#858796' }}>
                                    Remember your password?{' '}
                                    <NavLink 
                                        to="/auth/signin" 
                                        style={{ 
                                            color: '#667eea',
                                            textDecoration: 'none',
                                            fontWeight: '500'
                                        }}
                                    >
                                        Sign In
                                    </NavLink>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default ResetPassword;