import * as React from 'react';
import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { NavLink, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { forgetPassword, resetPassword } from '../../../store/actions/authActions';
import './../../../assets/scss/style.scss';
import Breadcrumb from '../../../App/layout/AdminLayout/Breadcrumb';
import logoDark from '../../../assets/images/logo-dark.png';

const ResetPassword = () => {
    const [email, setEmail] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState('forgot'); // 'forgot' or 'reset'
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const handleForgotPassword = async (e) => {
        e.preventDefault();
        if (!email) {
            toast.error('Please enter your email address');
            return;
        }
        setLoading(true);
        const result = await dispatch(forgetPassword({ email }));
        if (result.success) {
            setStep('reset');
        }
        setLoading(false);
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }
        if (!otp || otp.length !== 6) {
            toast.error('Please enter a valid 6-digit OTP');
            return;
        }
        if (!email) {
            toast.error('Email is required');
            return;
        }
        setLoading(true);
        const result = await dispatch(resetPassword({ email, otp, newPassword }));
        if (result.success) {
             navigate('/auth/signin');
        }
        setLoading(false);
    };

    const handleOtpChange = (e) => {
        const value = e.target.value.replace(/\D/g, ''); // Only allow digits
        if (value.length <= 6) {
            setOtp(value);
        }
    };

    const handleBackToForgot = () => {
        setStep('forgot');
        setOtp('');
        setNewPassword('');
        setConfirmPassword('');
    };

    return (
        <>
            <Breadcrumb />
            <div className="auth-wrapper">
                <div className="auth-content">
                    <div className="card">
                        <div className="row align-items-center text-center">
                            <div className="col-md-12">
                                <div className="card-body">
                                    <img src={logoDark} alt="" className="img-fluid mb-4" />
                                    
                                    {step === 'forgot' ? (
                                        <>
                                            <h4 className="mb-3 f-w-400">Forgot Password</h4>
                                            <p className="text-muted mb-4">
                                                Enter your email address and we'll send you an OTP to reset your password.
                                            </p>
                                            <form onSubmit={handleForgotPassword}>
                                                <div className="form-group fill">
                                                    <input
                                                        type="email"
                                                        className="form-control"
                                                        placeholder="Enter your email address"
                                                        value={email}
                                                        onChange={(e) => setEmail(e.target.value)}
                                                        required
                                                    />
                                                </div>
                                                <button className="btn btn-block btn-primary mb-4" type="submit" disabled={loading}>
                                                    {loading ? 'Sending...' : 'Send OTP'}
                                                </button>
                                            </form>
                                        </>
                                    ) : (
                                        <>
                                            <h4 className="mb-3 f-w-400">Reset Password</h4>
                                            <p className="text-muted mb-4">
                                                Enter the OTP sent to <strong>{email}</strong> and your new password.
                                            </p>
                                            <form onSubmit={handleResetPassword}>
                                                <div className="form-group fill">
                                                    <input
                                                        type="text"
                                                        className="form-control text-center"
                                                        placeholder="Enter 6-digit OTP"
                                                        value={otp}
                                                        onChange={handleOtpChange}
                                                        maxLength={6}
                                                        style={{ fontSize: '18px', letterSpacing: '4px' }}
                                                        required
                                                    />
                                                </div>
                                                <div className="form-group fill">
                                                    <input
                                                        type="password"
                                                        className="form-control"
                                                        placeholder="New Password"
                                                        value={newPassword}
                                                        onChange={(e) => setNewPassword(e.target.value)}
                                                        required
                                                    />
                                                </div>
                                                <div className="form-group fill mb-4">
                                                    <input
                                                        type="password"
                                                        className="form-control"
                                                        placeholder="Confirm New Password"
                                                        value={confirmPassword}
                                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                                        required
                                                    />
                                                </div>
                                                <button className="btn btn-block btn-primary mb-4" type="submit" disabled={loading}>
                                                    {loading ? 'Resetting...' : 'Reset Password'}
                                                </button>
                                            </form>
                                            <div className="alert alert-info">
                                                <small>
                                                    <strong>Note:</strong> OTP is valid for 10 minutes. Check your spam folder if you don't see the email.
                                                </small>
                                            </div>
                                            <button 
                                                className="btn btn-link text-muted mb-3" 
                                                onClick={handleBackToForgot}
                                                type="button"
                                            >
                                                ← Back to Forgot Password
                                            </button>
                                        </>
                                    )}
                                    
                                    <p className="mb-0 text-muted">
                                        Remember your password?{' '}
                                        <NavLink to="/auth/signin" className="f-w-400">
                                            SignIn
                                        </NavLink>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default ResetPassword;