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
    const [step, setStep] = useState(1); // 1: Email, 2: OTP+Password
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    // Reset form function
    const resetForm = () => {
        setOtp('');
        setNewPassword('');
        setConfirmPassword('');
    };

    // Step 1: Forget Password (Send OTP)
    const handleForget = async (e) => {
        e.preventDefault();
        setLoading(true);
        const result = await dispatch(forgetPassword({ email }));
        if (result.success) {
            setStep(2);
        }
        setLoading(false);
    };

    // Step 2: Reset Password (OTP + New Password)
    const handleReset = async (e) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }
        setLoading(true);
        const result = await dispatch(resetPassword({ email, otp, newPassword }));
        if (result.success) {
            navigate('/auth/signin');
        } else {
            resetForm();
        }
        setLoading(false);
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
                                    <h4 className="mb-3 f-w-400">Reset your password</h4>
                                    {step === 1 && (
                                        <form onSubmit={handleForget}>
                                            <div className="form-group fill">
                                                <input
                                                    type="email"
                                                    className="form-control"
                                                    placeholder="Email Address"
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                    required
                                                />
                                            </div>
                                            <button className="btn btn-block btn-primary mb-4" type="submit" disabled={loading}>
                                                {loading ? 'Sending OTP...' : 'Send OTP'}
                                            </button>
                                        </form>
                                    )}
                                    {step === 2 && (
                                        <form onSubmit={handleReset}>
                                            <div className="form-group fill">
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    placeholder="OTP"
                                                    value={otp}
                                                    onChange={(e) => setOtp(e.target.value)}
                                                    required
                                                />
                                            </div>
                                            <div className="form-group fill mb-4">
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
