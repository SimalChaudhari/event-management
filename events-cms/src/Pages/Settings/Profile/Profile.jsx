import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import { Row, Col, Card, Dropdown, Carousel } from 'react-bootstrap';
import DEMO from '../../../store/constant';
import avatar5 from '../../../assets/images/user/avatar-5.jpg';
import { API_URL } from '../../../configs/env';
import { useSelector, useDispatch } from 'react-redux';
import { editUser } from '../../../store/actions/userActions';
import { AUTH_DATA } from '../../../store/constants/actionTypes';
import { useLocation } from 'react-router-dom';
import { changePassword } from '../../../store/actions/authActions';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';

const Profile = () => {
    const dispatch = useDispatch();
    const user = useSelector((state) => state.auth.authUser);

    // Refs for form inputs
    const firstNameRef = useRef(null);
    const lastNameRef = useRef(null);
    const addressRef = useRef(null);
    const cityRef = useRef(null);
    const stateRef = useRef(null);
    const postalCodeRef = useRef(null);
    const mobileRef = useRef(null);
    const emailRef = useRef(null);
    const linkedinProfileRef = useRef(null);
    const biometricToggleRef = useRef(null);
    const currencyRef = useRef(null);


    const [data, setData] = useState({
        activeProfileTab: 'profile',
        isPersonalEdit: false,
        isContactEdit: false,
        isOtherEdit: false,
        isPasswordEdit: false
    });

    const profileTabClass = 'nav-link text-reset';
    const profileTabActiveClass = 'nav-link text-reset active';
    const profilePanClass = 'tab-pane fade';
    const profilePanActiveClass = 'tab-pane fade show active';

    const fullName = `${user.firstName} ${user.lastName}`;
    const profilePicPath = user.profilePicture ? `${API_URL}/${user.profilePicture}` : avatar5;

    const location = useLocation();

    // Add this useEffect to check for tab parameter when component mounts
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const tabParam = params.get('tab');

        if (tabParam === 'settings') {
            setData((prevData) => ({
                ...prevData,
                activeProfileTab: 'settings',
                isPersonalEdit: false,
                isContactEdit: false,
                isOtherEdit: false,
                isPasswordEdit: false
            }));
        } else if (tabParam === 'profile') {
            setData((prevData) => ({
                ...prevData,
                activeProfileTab: 'profile',
                isPersonalEdit: false,
                isContactEdit: false,
                isOtherEdit: false,
                isPasswordEdit: false
            }));
        } else {
            setData((prevData) => ({
                ...prevData,
                activeProfileTab: 'profile',
                isPersonalEdit: false,
                isContactEdit: false,
                isOtherEdit: false,
                isPasswordEdit: false
            }));
        }
    }, [location]);

    // Update local storage and Redux store with updated user data
    const updateUserState = (updatedData) => {
        // Get the current user data from localStorage
        const userData = JSON.parse(localStorage.getItem('userData'));
        // Create updated user object by merging current user with updated fields
        const updatedUser = { ...user, ...updatedData };
        // Update localStorage
        localStorage.setItem(
            'userData',
            JSON.stringify({
                ...userData,
                user: updatedUser
            })
        );

        // Update Redux store
        dispatch({
            type: AUTH_DATA,
            payload: { user: updatedUser }
        });
    };

    // Handle personal details update
    const handlePersonalUpdate = async () => {
        const personalData = {
            firstName: firstNameRef.current.value,
            lastName: lastNameRef.current.value,
            address: addressRef.current.value,
            city: cityRef.current.value,
            state: stateRef.current.value,
            postalCode: postalCodeRef.current.value
        };

        const success = await dispatch(editUser(user.id, personalData));
        if (success) {
            // Update local storage and Redux state
            updateUserState(personalData);
            setData({ ...data, isPersonalEdit: false });
        }
    };

    // Handle contact information update
    const handleContactUpdate = async () => {
        const contactData = {
            mobile: mobileRef.current.value,
            email: emailRef.current.value,
            linkedinProfile: linkedinProfileRef.current.value
        };

        const success = await dispatch(editUser(user.id, contactData));
        if (success) {
            // Update local storage and Redux state
            updateUserState(contactData);
            setData({ ...data, isContactEdit: false });
        }
    };

    // Handle account settings update
    const handleSettingsUpdate = async () => {
        const settingsData = {
            biometricEnabled: biometricToggleRef.current.checked,
            countryCurrency: currencyRef.current.value
        };

        const success = await dispatch(editUser(user.id, settingsData));
        if (success) {
            // Update local storage and Redux state
            updateUserState(settingsData);
            setData({ ...data, isOtherEdit: false });
        }
    };

    const fileInputRef = useRef(null);

    const handleUploadClick = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const handleFileChange = async (event) => {
        const file = event.target.files[0];
        if (file) {
            const formData = new FormData();
            formData.append('profilePicture', file);
            const success = await dispatch(editUser(user.id, formData));
            if (success) {
                updateUserState({ profilePicture: success.data.profilePicture });
            }
        }
    };

    // Password change validation schema
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
        <>
            <div className="user-profile user-card mb-4">
                <Card.Header className="border-0 p-0 pb-0 pt-10">
                    <div className="cover-img-block">
                        <div className="overlay" />
                        <div className="change-cover">
                            <Dropdown>
                                <Dropdown.Toggle variant="link" id="dropdown-basic" className="drp-icon text-white">
                                    <i className="feather icon-camera" />
                                </Dropdown.Toggle>
                                <Dropdown.Menu>
                                    <Dropdown.Item href={DEMO.BLANK_LINK}>
                                        <i className="feather icon-upload-cloud mr-2" />
                                        upload new
                                    </Dropdown.Item>
                                    <Dropdown.Item href={DEMO.BLANK_LINK}>
                                        <i className="feather icon-trash-2 mr-2" />
                                        remove
                                    </Dropdown.Item>
                                </Dropdown.Menu>
                            </Dropdown>
                        </div>
                    </div>
                </Card.Header>
                <Card.Body className="py-0">
                    <div className="user-about-block m-0">
                        <Row>
                            <Col md={4} className="text-center mt-n5">
                                <div className="change-profile text-center">
                                    <Dropdown className="w-auto d-inline-block">
                                        <Dropdown.Toggle as="a" variant="link" id="dropdown-basic">
                                            <div className="profile-dp">
                                                <div className="position-relative d-inline-block">
                                                    {/* <img className="img-radius img-fluid wid-100" src={avatar5} alt="User" /> */}
                                                    <img className="img-radius img-fluid" src={profilePicPath} alt="User" />
                                                </div>
                                                <div className="overlay">
                                                    <span>change</span>
                                                </div>
                                            </div>
                                            <div className="certificated-badge">
                                                <i className="fas fa-certificate text-c-blue bg-icon" />
                                                <i className="fas fa-check front-icon text-white" />
                                            </div>
                                        </Dropdown.Toggle>
                                        <Dropdown.Menu>
                                            <Dropdown.Item onClick={handleUploadClick}>
                                                <i className="feather icon-upload-cloud mr-2" />
                                                upload new
                                            </Dropdown.Item>

                                            <Dropdown.Item href={DEMO.BLANK_LINK}>
                                                <i className="feather icon-trash-2 mr-2" />
                                                remove
                                            </Dropdown.Item>
                                        </Dropdown.Menu>
                                    </Dropdown>

                                    {/* Hidden file input */}
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        style={{ display: 'none' }}
                                        onChange={handleFileChange}
                                        accept="image/*" // optional: limit to images
                                    />
                                </div>
                                <h5 className="mb-1">{fullName}</h5>
                                <p className="mb-2 text-muted">{user.role}</p>
                            </Col>
                            <Col md={8} className="mt-md-4">
                                <Row>
                                    <Col>
                                        {user.linkedinProfile && (
                                            <>
                                                <a
                                                    href={user.linkedinProfile}
                                                    className="mb-1 text-muted d-flex align-items-end text-h-primary"
                                                >
                                                    <i className="feather icon-globe mr-2 f-18" />
                                                    {user.linkedinProfile}
                                                </a>
                                                <div className="clearfix" />
                                            </>
                                        )}
                                        <a href={`mailto:${user.email}`} className="mb-1 text-muted d-flex align-items-end text-h-primary">
                                            <i className="feather icon-mail mr-2 f-18" />
                                            {user.email}
                                        </a>
                                        <div className="clearfix" />
                                        <a href={`tel:${user.mobile}`} className="mb-1 text-muted d-flex align-items-end text-h-primary">
                                            <i className="feather icon-phone mr-2 f-18" />
                                            {user.mobile}
                                        </a>
                                    </Col>
                                    <Col>
                                        <div className="media">
                                            <i className="feather icon-map-pin mr-2 mt-1 f-18" />
                                            <div className="media-body">
                                                <p className="mb-0 text-muted">{user.address}</p>
                                                <p className="mb-0 text-muted">
                                                    {user.city}, {user.state}
                                                </p>
                                                <p className="mb-0 text-muted">{user.postalCode}</p>
                                            </div>
                                        </div>
                                    </Col>
                                </Row>
                                <ul className="nav nav-tabs profile-tabs nav-fill" id="myTab" role="tablist">
                                    <li className="nav-item">
                                        <a
                                            className={data.activeProfileTab === 'profile' ? profileTabActiveClass : profileTabClass}
                                            onClick={() => {
                                                setData({
                                                    ...data,
                                                    activeProfileTab: 'profile',
                                                    isPersonalEdit: false,
                                                    isContactEdit: false,
                                                    isOtherEdit: false,
                                                    isPasswordEdit: false
                                                });
                                            }}
                                            id="profile-tab"
                                            href={DEMO.BLANK_LINK}
                                        >
                                            <i className="feather icon-user mr-2" />
                                            Profile
                                        </a>
                                    </li>
                                    <li className="nav-item">
                                        <a
                                            className={data.activeProfileTab === 'settings' ? profileTabActiveClass : profileTabClass}
                                            onClick={() => {
                                                setData({
                                                    ...data,
                                                    activeProfileTab: 'settings',
                                                    isPersonalEdit: false,
                                                    isContactEdit: false,
                                                    isOtherEdit: false,
                                                    isPasswordEdit: false
                                                });
                                            }}
                                            id="settings-tab"
                                            href={DEMO.BLANK_LINK}
                                        >
                                            <i className="feather icon-settings mr-2" />
                                            Settings
                                        </a>
                                    </li>
                                </ul>
                            </Col>
                        </Row>
                    </div>
                </Card.Body>
            </div>
            <Row>
                <Col md={12} className="order-md-2">
                    <div className="tab-content">
                        <div className={data.activeProfileTab === 'profile' ? profilePanActiveClass : profilePanClass} id="profile">
                            <Card>
                                <Card.Body className="d-flex align-items-center justify-content-between">
                                    <h5 className="mb-0">Personal details</h5>
                                    <button
                                        type="button"
                                        className="btn btn-primary btn-sm rounded m-0 float-right"
                                        onClick={() => setData({ ...data, isPersonalEdit: !data.isPersonalEdit })}
                                    >
                                        <i className={data.isPersonalEdit ? 'feather icon-x' : 'feather icon-edit'} />
                                    </button>
                                </Card.Body>
                                <Card.Body
                                    className={
                                        data.isPersonalEdit ? 'border-top pro-det-edit collapse' : 'border-top pro-det-edit collapse show'
                                    }
                                >
                                    <Row className="form-group">
                                        <label className="col-sm-3 col-form-label font-weight-bolder">Full Name</label>
                                        <Col sm={9}>{fullName}</Col>
                                    </Row>

                                    <Row className="form-group">
                                        <label className="col-sm-3 col-form-label font-weight-bolder">Member Status</label>
                                        <Col sm={9}>{user.isMember ? 'Member' : 'Non-Member'}</Col>
                                    </Row>
                                    <Row className="form-group">
                                        <label className="col-sm-3 col-form-label font-weight-bolder">Verification Status</label>
                                        <Col sm={9}>{user.isVerify ? 'Verified' : 'Not Verified'}</Col>
                                    </Row>
                                    <Row className="form-group">
                                        <label className="col-sm-3 col-form-label font-weight-bolder">Location</label>
                                        <Col sm={9}>
                                            <p className="mb-0 text-muted">{user.address}</p>
                                            <p className="mb-0 text-muted">
                                                {user.city}, {user.state}
                                            </p>
                                            <p className="mb-0 text-muted">{user.postalCode}</p>
                                        </Col>
                                    </Row>
                                </Card.Body>
                                <Card.Body
                                    className={
                                        data.isPersonalEdit ? 'border-top pro-det-edit collapse show' : 'border-top pro-det-edit collapse'
                                    }
                                >
                                    <Row className="form-group">
                                        <label className="col-sm-3 col-form-label font-weight-bolder">First Name</label>
                                        <Col sm={9}>
                                            <input
                                                type="text"
                                                className="form-control"
                                                placeholder="First Name"
                                                defaultValue={user.firstName}
                                                ref={firstNameRef}
                                            />
                                        </Col>
                                    </Row>
                                    <Row className="form-group">
                                        <label className="col-sm-3 col-form-label font-weight-bolder">Last Name</label>
                                        <Col sm={9}>
                                            <input
                                                type="text"
                                                className="form-control"
                                                placeholder="Last Name"
                                                defaultValue={user.lastName}
                                                ref={lastNameRef}
                                            />
                                        </Col>
                                    </Row>

                                    <Row className="form-group">
                                        <label className="col-sm-3 col-form-label font-weight-bolder">Address</label>
                                        <Col sm={9}>
                                            <input
                                                type="text"
                                                className="form-control"
                                                placeholder="Address"
                                                defaultValue={user.address}
                                                ref={addressRef}
                                            />
                                        </Col>
                                    </Row>
                                    <Row className="form-group">
                                        <label className="col-sm-3 col-form-label font-weight-bolder">City</label>
                                        <Col sm={9}>
                                            <input
                                                type="text"
                                                className="form-control"
                                                placeholder="City"
                                                defaultValue={user.city}
                                                ref={cityRef}
                                            />
                                        </Col>
                                    </Row>
                                    <Row className="form-group">
                                        <label className="col-sm-3 col-form-label font-weight-bolder">State</label>
                                        <Col sm={9}>
                                            <input
                                                type="text"
                                                className="form-control"
                                                placeholder="State"
                                                defaultValue={user.state}
                                                ref={stateRef}
                                            />
                                        </Col>
                                    </Row>
                                    <Row className="form-group">
                                        <label className="col-sm-3 col-form-label font-weight-bolder">Postal Code</label>
                                        <Col sm={9}>
                                            <input
                                                type="text"
                                                className="form-control"
                                                placeholder="Postal Code"
                                                defaultValue={user.postalCode}
                                                ref={postalCodeRef}
                                            />
                                        </Col>
                                    </Row>
                                    <Row className="form-group">
                                        <label className="col-sm-3 col-form-label" />
                                        <Col sm={9}>
                                            <button type="submit" className="btn btn-primary" onClick={handlePersonalUpdate}>
                                                Save
                                            </button>
                                        </Col>
                                    </Row>
                                </Card.Body>
                            </Card>
                            <Card>
                                <Card.Body className="d-flex align-items-center justify-content-between">
                                    <h5 className="mb-0">Contact Information</h5>
                                    <button
                                        type="button"
                                        className="btn btn-primary btn-sm rounded m-0 float-right"
                                        onClick={() => setData({ ...data, isContactEdit: !data.isContactEdit })}
                                    >
                                        <i className={data.isContactEdit ? 'feather icon-x' : 'feather icon-edit'} />
                                    </button>
                                </Card.Body>
                                <Card.Body
                                    className={
                                        data.isContactEdit ? 'border-top pro-det-edit collapse' : 'border-top pro-det-edit collapse show'
                                    }
                                >
                                    <Row className="form-group">
                                        <label className="col-sm-3 col-form-label font-weight-bolder">Mobile Number</label>
                                        <Col sm={9}>{user.mobile}</Col>
                                    </Row>
                                    <Row className="form-group">
                                        <label className="col-sm-3 col-form-label font-weight-bolder">Email Address</label>
                                        <Col sm={9}>{user.email}</Col>
                                    </Row>
                                    {user.linkedinProfile && (
                                        <Row className="form-group">
                                            <label className="col-sm-3 col-form-label font-weight-bolder">LinkedIn</label>
                                            <Col sm={9}>{user.linkedinProfile}</Col>
                                        </Row>
                                    )}
                                </Card.Body>
                                <Card.Body
                                    className={
                                        data.isContactEdit ? 'border-top pro-det-edit collapse show' : 'border-top pro-det-edit collapse'
                                    }
                                >
                                    <Row className="form-group">
                                        <label className="col-sm-3 col-form-label font-weight-bolder">Mobile Number</label>
                                        <Col sm={9}>
                                            <input
                                                type="text"
                                                className="form-control"
                                                placeholder="Mobile Number"
                                                defaultValue={user.mobile}
                                                ref={mobileRef}
                                            />
                                        </Col>
                                    </Row>
                                    <Row className="form-group">
                                        <label className="col-sm-3 col-form-label font-weight-bolder">Email Address</label>
                                        <Col sm={9}>
                                            <input
                                                type="email"
                                                className="form-control"
                                                placeholder="Email"
                                                defaultValue={user.email}
                                                ref={emailRef}
                                            />
                                        </Col>
                                    </Row>
                                    <Row className="form-group">
                                        <label className="col-sm-3 col-form-label font-weight-bolder">LinkedIn Profile</label>
                                        <Col sm={9}>
                                            <input
                                                type="text"
                                                className="form-control"
                                                placeholder="LinkedIn Profile"
                                                defaultValue={user.linkedinProfile || ''}
                                                ref={linkedinProfileRef}
                                            />
                                        </Col>
                                    </Row>
                                    <Row className="form-group">
                                        <label className="col-sm-3 col-form-label" />
                                        <Col sm={9}>
                                            <button type="submit" className="btn btn-primary" onClick={handleContactUpdate}>
                                                Save
                                            </button>
                                        </Col>
                                    </Row>
                                </Card.Body>
                            </Card>
                            <Card>
                                <Card.Body className="d-flex align-items-center justify-content-between">
                                    <h5 className="mb-0">Account Settings</h5>
                                    <button
                                        type="button"
                                        className="btn btn-primary btn-sm rounded m-0 float-right"
                                        onClick={() => setData({ ...data, isOtherEdit: !data.isOtherEdit })}
                                    >
                                        <i className={data.isOtherEdit ? 'feather icon-x' : 'feather icon-edit'} />
                                    </button>
                                </Card.Body>
                                <Card.Body
                                    className={
                                        data.isOtherEdit ? 'border-top pro-det-edit collapse' : 'border-top pro-det-edit collapse show'
                                    }
                                >
                                    <Row className="form-group">
                                        <label className="col-sm-3 col-form-label font-weight-bolder">Biometric Authentication</label>
                                        <Col sm={9}>{user.biometricEnabled ? 'Enabled' : 'Disabled'}</Col>
                                    </Row>
                                    <Row className="form-group">
                                        <label className="col-sm-3 col-form-label font-weight-bolder">Membership Status</label>
                                        <Col sm={9}>{user.isMember ? 'Active Member' : 'Not a Member'}</Col>
                                    </Row>
                                    <Row className="form-group">
                                        <label className="col-sm-3 col-form-label font-weight-bolder">Currency</label>
                                        <Col sm={9}>{user.countryCurrency || 'Not Set'}</Col>
                                    </Row>
                                </Card.Body>
                                <Card.Body
                                    className={
                                        data.isOtherEdit ? 'border-top pro-det-edit collapse show' : 'border-top pro-det-edit collapse'
                                    }
                                >
                                    <Row className="form-group">
                                        <label className="col-sm-3 col-form-label font-weight-bolder">Biometric Authentication</label>
                                        <Col sm={9}>
                                            <div className="custom-control custom-switch">
                                                <input
                                                    type="checkbox"
                                                    className="custom-control-input"
                                                    id="biometricToggle"
                                                    defaultChecked={user.biometricEnabled}
                                                    ref={biometricToggleRef}
                                                />
                                                <label className="custom-control-label" htmlFor="biometricToggle">
                                                    {user.biometricEnabled ? 'Enabled' : 'Disabled'}
                                                </label>
                                            </div>
                                        </Col>
                                    </Row>
                                    <Row className="form-group">
                                        <label className="col-sm-3 col-form-label font-weight-bolder">Currency</label>
                                        <Col sm={9}>
                                            <select className="form-control" defaultValue={user.countryCurrency || ''} ref={currencyRef}>
                                                <option value="">Select Currency</option>
                                                <option value="USD">USD - US Dollar</option>
                                                <option value="EUR">EUR - Euro</option>
                                                <option value="GBP">GBP - British Pound</option>
                                                <option value="INR">INR - Indian Rupee</option>
                                            </select>
                                        </Col>
                                    </Row>
                                    <Row className="form-group">
                                        <label className="col-sm-3 col-form-label" />
                                        <Col sm={9}>
                                            <button type="submit" className="btn btn-primary" onClick={handleSettingsUpdate}>
                                                Save
                                            </button>
                                        </Col>
                                    </Row>
                                </Card.Body>
                            </Card>
                        </div>
                    </div>

                    <div className={data.activeProfileTab === 'settings' ? profilePanActiveClass : profilePanClass} id="settings">
                        <Card>
                            <Card.Body className="d-flex align-items-center justify-content-between">
                                <h5 className="mb-0">Change Password</h5>
                                <button
                                    type="button"
                                    className="btn btn-primary btn-sm rounded m-0 float-right"
                                    onClick={() => setData({ ...data, isPasswordEdit: !data.isPasswordEdit })}
                                >
                                    <i className={data.isPasswordEdit ? 'feather icon-x' : 'feather icon-edit'} />
                                </button>
                            </Card.Body>
                            {data.isPasswordEdit && (
                                <Card.Body className="border-top pro-det-edit">
                                    <Formik
                                        initialValues={{
                                            currentPassword: '',
                                            newPassword: '',
                                            confirmPassword: ''
                                        }}
                                        validationSchema={passwordChangeSchema}
                                        onSubmit={async (values, { resetForm }) => {
                                            try {
                                                const result = await dispatch(changePassword(values));
                                                if (result.success) {
                                                    resetForm();
                                                    setData({ ...data, isPasswordEdit: false });
                                                }
                                            } catch (error) {
                                                toast.error('Failed to change password');
                                            }
                                        }}
                                    >
                                        {({ values, errors, touched, handleChange, handleBlur, isSubmitting, setFieldValue }) => (
                                            <Form>
                                                <Row className="form-group">
                                                    <label className="col-sm-3 col-form-label font-weight-bolder">Current Password</label>
                                                    <Col sm={9}>
                                                        <div className="input-group">
                                                            <Field
                                                                type="password"
                                                                name="currentPassword"
                                                                className={`form-control ${errors.currentPassword && touched.currentPassword ? 'is-invalid' : ''}`}
                                                                placeholder="Current Password"
                                                                id="current-password"
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
                                                <Row className="form-group">
                                                    <label className="col-sm-3 col-form-label font-weight-bolder">New Password</label>
                                                    <Col sm={9}>
                                                        <div className="input-group">
                                                            <Field
                                                                type="password"
                                                                name="newPassword"
                                                                className={`form-control ${errors.newPassword && touched.newPassword ? 'is-invalid' : ''}`}
                                                                placeholder="New Password"
                                                                id="new-password"
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
                                                <Row className="form-group">
                                                    <label className="col-sm-3 col-form-label font-weight-bolder">Confirm Password</label>
                                                    <Col sm={9}>
                                                        <div className="input-group">
                                                            <Field
                                                                type="password"
                                                                name="confirmPassword"
                                                                className={`form-control ${errors.confirmPassword && touched.confirmPassword ? 'is-invalid' : ''}`}
                                                                placeholder="Confirm New Password"
                                                                id="confirm-password"
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
                                                <Row className="form-group">
                                                    <label className="col-sm-3 col-form-label" />
                                                    <Col sm={9}>
                                                        <button
                                                            type="submit"
                                                            className="btn btn-primary"
                                                            disabled={isSubmitting}
                                                        >
                                                            {isSubmitting ? 'Changing Password...' : 'Change Password'}
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className="btn btn-light ml-2"
                                                            onClick={() => {
                                                                setData({ ...data, isPasswordEdit: false });
                                                            }}
                                                        >
                                                            Cancel
                                                        </button>
                                                    </Col>
                                                </Row>
                                            </Form>
                                        )}
                                    </Formik>
                                </Card.Body>
                            )}
                        </Card>
                    </div>
                </Col>
            </Row>
        </>
    );
};
export default Profile;
