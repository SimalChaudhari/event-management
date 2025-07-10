import * as React from 'react';
import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { NavLink, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { forgetPassword } from '../../../store/actions/authActions';
import './../../../assets/scss/style.scss';
import Breadcrumb from '../../../App/layout/AdminLayout/Breadcrumb';
import logoDark from '../../../assets/images/logo-dark.png';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    // Handle Forget Password (Send reset link)
    const handleForget = async (e) => {
        e.preventDefault();
        setLoading(true);
        const result = await dispatch(forgetPassword({ email }));
        if (result.success) {
               setEmail(''); // Clear email after successful send
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
                                    <h4 className="mb-3 f-w-400">Forgot Password</h4>
                                    <p className="text-muted mb-4">
                                        Enter your email address and we'll send you a link to reset your password.
                                    </p>
                                    
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
                                            {loading ? 'Sending reset link...' : 'Send Reset Link'}
                                        </button>
                                    </form>
                                    
                                    <div className="alert alert-info">
                                        <small>
                                            <strong>Note:</strong> Check your email inbox and spam folder for the reset link.
                                        </small>
                                    </div>
                                    
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

export default ForgotPassword;
