import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { NavLink, useNavigate } from 'react-router-dom';
import { Form } from 'react-bootstrap';
import './../../../assets/scss/style.scss';
import Breadcrumb from '../../../App/layout/AdminLayout/Breadcrumb';
import logoDark from '../../../assets/images/logo-dark.png';
import { login } from '../../../store/actions/authActions';
import { toast } from 'react-toastify';

const SignUp1 = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
    
        try {
            const data = { email, password }; // Create a single object for data
            const response = await dispatch(login(data)); // Pass `data` directly
            if (response.success) {
                 navigate('/dashboard'); // Redirect to the dashboard or home page
            } else {
                console.log('Invalid credentials, please try again.');
            }
        } catch (error) {
            console.log('An error occurred. Please try again later.');
        } finally {
            setLoading(false);
        }
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
                                    <img src={logoDark} alt="Logo" className="img-fluid mb-4" />
                                    <h4 className="mb-3 f-w-400">Signin</h4>
                                    <form onSubmit={handleSubmit}>
                                        <div className="form-group fill">
                                            <input
                                                type="email"
                                                className="form-control"
                                                id="email"
                                                placeholder="Email Address"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                required
                                            />
                                        </div>
                                        <div className="form-group fill mb-4">
                                            <input
                                                type="password"
                                                className="form-control"
                                                id="password"
                                                placeholder="Password"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                required
                                            />
                                        </div>

                                        <Form.Group className="text-left">
                                            <Form.Check
                                                custom
                                                type="checkbox"
                                                id="save-credentials"
                                                label={'Save credentials'}
                                            />
                                        </Form.Group>

                                        <button
                                            className="btn btn-block btn-primary mb-4"
                                            type="submit"
                                            disabled={loading}
                                        >
                                            {loading ? 'Signing in...' : 'Signin'}
                                        </button>
                                    </form>
                                    <p className="mb-2 text-muted">
                                        Forgot password?{' '}
                                        <NavLink to="/auth/reset-password-1" className="f-w-400">
                                            Reset
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

export default SignUp1;
