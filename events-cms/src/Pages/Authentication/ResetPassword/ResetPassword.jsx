import * as React from 'react';
import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { NavLink, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { resetPassword } from '../../../store/actions/authActions';
import './../../../assets/scss/style.scss';
import Breadcrumb from '../../../App/layout/AdminLayout/Breadcrumb';
import logoDark from '../../../assets/images/logo-dark.png';

const ResetPassword = () => {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [token, setToken] = useState('');
    const [email, setEmail] = useState('');
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    useEffect(() => {
        const urlToken = searchParams.get('token');
        const urlEmail = searchParams.get('email');
        if (urlToken && urlEmail) {
            setToken(urlToken);
            setEmail(urlEmail);
        }
    }, [searchParams]);

    const handleReset = async (e) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }
        if (!token || !email) {
            toast.error('Invalid or expired reset link');
            return;
        }
        setLoading(true);
        const result = await dispatch(resetPassword({ token, email, newPassword }));
        if (result.success) {
            toast.success('Password reset successfully! You can now login.');
            navigate('/auth/signin');
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
                                    <h4 className="mb-3 f-w-400">Reset Password</h4>
                                    <form onSubmit={handleReset}>
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