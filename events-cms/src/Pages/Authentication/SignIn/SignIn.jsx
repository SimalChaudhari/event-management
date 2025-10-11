import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { NavLink, useNavigate } from 'react-router-dom';
import { Formik, Form, Field, useField } from 'formik';
import * as Yup from 'yup';
import './../../../assets/scss/style.scss';
import Breadcrumb from '../../../App/layout/AdminLayout/Breadcrumb/index';
import logoDark from '../../../assets/images/logo-dark.png';
import { login } from '../../../store/actions/authActions';
import { getLogo } from '../../../store/actions/settingsActions';
import { API_URL } from '../../../configs/env';
import { signInSchema } from '../../../utils/validation';

// Custom Password Field Component
const PasswordField = ({ showPassword, setShowPassword }) => {
    const [field, meta] = useField('password');
    
    return (
        <div style={{ position: 'relative' }}>
            <input
                {...field}
                type={showPassword ? 'text' : 'password'}
                id="password"
                className={`form-control ${meta.error && meta.touched ? 'is-invalid' : ''}`}
                placeholder="Password"
                autoComplete="current-password"
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

const SignIn = () => {
    const [showPassword, setShowPassword] = useState(false);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const logoData = useSelector((state) => state.settings.logo);

    // Fetch logo on component mount
    useEffect(() => {
        dispatch(getLogo());
    }, [dispatch]);

    // Use dynamic logo from API if available, otherwise use static fallback
    const displayLogo = (logoData && logoData.imageUrl) ? `${API_URL}/${logoData.imageUrl}` : logoDark;

    // Using centralized validation schema

    const handleSubmit = async (values, { setSubmitting }) => {
        try {
            const response = await dispatch(login(values));
            
            console.log('Login response:', response);
            
            // Only navigate if login was successful
            if (response && response.success) {
                navigate('/');
            }
            // If login failed, stay on the login page (no navigation)
            
        } catch (error) {
            console.error('Login error:', error);
            // Error handling is done in the authActions with toast notifications
            // Stay on login page when there's an error
        } finally {
            setSubmitting(false);
        }
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
                                    Welcome Back!
                                </h3>
                                <p className="text-muted mb-4" style={{ fontSize: '14px', color: '#858796' }}>
                                    Please sign in to your account
                                </p>
                            </div>
                            
                                    <Formik
                                        initialValues={{
                                            email: '',
                                            password: '',
                                        }}
                                        validationSchema={signInSchema}
                                        onSubmit={handleSubmit}
                                        validateOnChange={true}
                                        validateOnBlur={true}
                                        validateOnMount={false}
                                    >
                                {({ errors, touched, isSubmitting }) => (
                                    <Form noValidate>
                                        {/* Email Field */}
                                        <div className="form-group mb-3">
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

                                        {/* Password Field */}
                                        <div className="form-group mb-4">
                                            <PasswordField 
                                                showPassword={showPassword} 
                                                setShowPassword={setShowPassword} 
                                            />
                                            {errors.password ? (
                                                <div className="invalid-feedback" style={{ 
                                                    fontSize: '14px',
                                                    marginTop: '8px',
                                                    fontWeight: '500',
                                                    color: '#dc3545',
                                                    display: 'block'
                                                }}>
                                                    {errors.password}
                                                </div>
                                            ) : null}
                                        </div>

                                        {/* Submit Button */}
                                        <button 
                                            className="btn btn-primary w-100 mb-3" 
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
                                                    Signing in...
                                                </>
                                            ) : (
                                                'Sign In'
                                            )}
                                        </button>

                                        {/* Forgot Password */}
                                        <div className="text-center">
                                            <NavLink 
                                                to="/auth/reset-password" 
                                                style={{ 
                                                    fontSize: '14px',
                                                    color: '#667eea',
                                                    textDecoration: 'none',
                                                    fontWeight: '500'
                                                }}
                                            >
                                                Forgot password?
                                            </NavLink>
                                        </div>


                                    </Form>
                                )}
                            </Formik>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default SignIn;
