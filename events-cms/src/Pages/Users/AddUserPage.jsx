import React, { useState, useEffect } from 'react';
import { Button, Row, Col, Card, Container, Alert } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { createUser, editUser, userById, userList } from '../../store/actions/userActions';
import { API_URL } from '../../configs/env';
import { USER_PATHS } from '../../utils/constants';
import SingaporePhoneInput from '../../components/SingaporePhoneInput';
import useTableNavigation from '../../hooks/useTableNavigation';
import useCalculateTargetPage from '../../hooks/useCalculateTargetPage';

const AddUserPage = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();
    const { id } = useParams(); // Edit mode
    const { error, userByID } = useSelector((state) => state.user); // Use state.user as per store structure
    const [loading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        mobile: '',
        role: 'user',
        salutation: '',
        company: '',
        industry: '',
        designation: '',
        street: '',
        city: '',
        state: '',
        postalCode: '',
        country: '',
        addressType: 'home',
        isDefaultAddress: true,
        apartment: '',
        landmark: '',
        addressLabel: '',
        deliveryInstructions: '',
        acceptTerms: false,
        companyName: '',
        position: '',
        description: '',
        linkedinProfile: '',
        profilePicture: null
    });
    const [imagePreview, setImagePreview] = useState(null);
    const previousPageRef = React.useRef(null);
    const originalUserNameRef = React.useRef({ firstName: '', lastName: '' });

    const { handleBack: handleBackNavigation } = useTableNavigation({
        tableRef: null,
        listPath: USER_PATHS.LIST_USERS,
        viewPath: USER_PATHS.VIEW_USER,
        editPath: USER_PATHS.EDIT_USER,
        addPath: USER_PATHS.ADD_USER
    });

    const { calculateTargetPage } = useCalculateTargetPage({
        listAction: userList,
        reduxSelector: 'user.user',
        pageLength: 5,
        sortType: 'string',
        sortDirection: 'asc',
        sortFields: ['firstName', 'lastName']
    });

    useEffect(() => {
        const urlParams = new URLSearchParams(location.search || window.location.search);
        const pageParam = urlParams.get('page');
        if (pageParam) {
            previousPageRef.current = parseInt(pageParam, 10);
        } else if (location.state?.page) {
            previousPageRef.current = location.state.page;
        }
    }, [id ,location.search, location.state]);

    // Load edit data if id exists
    useEffect(() => {
        if (id) {
            const loadUserData = async () => {
                try {
                    await dispatch(userById(id));
                } catch (error) {
                    console.error('Error loading user data:', error);
                }
            };
            loadUserData();
        }
    }, [id, dispatch]);

    // Watch for userByID changes in Redux store
    useEffect(() => {
        if (id && userByID) {
            const editData = userByID;

            // Get default/first address from addresses array
            const defaultAddress =
                editData.addresses && editData.addresses.length > 0
                    ? editData.addresses.find((addr) => addr.isDefault) || editData.addresses[0]
                    : {};

            setFormData({
                firstName: editData.firstName || '',
                lastName: editData.lastName || '',
                email: editData.email || '',

                mobile: editData.mobile || '',
                role: editData.role || 'user',
                salutation: editData.salutation || '',
                company: editData.company || '',
                industry: editData.industry || '',
                designation: editData.designation || '',
                street: defaultAddress.street || '',
                city: defaultAddress.city || '',
                state: defaultAddress.state || '',
                postalCode: defaultAddress.postalCode || '',
                country: defaultAddress.country || '',
                addressType: defaultAddress.type || 'home',
                isDefaultAddress: defaultAddress.isDefault || true,
                apartment: defaultAddress.apartment || '',
                landmark: defaultAddress.landmark || '',
                addressLabel: defaultAddress.label || '',
                deliveryInstructions: defaultAddress.instructions || '',
                acceptTerms: editData.acceptTerms || false,
                companyName: editData.companyName || '',
                position: editData.position || '',
                description: editData.description || '',
                linkedinProfile: editData.linkedinProfile || '',
                profilePicture: null
            });

            originalUserNameRef.current = {
                firstName: editData.firstName || '',
                lastName: editData.lastName || ''
            };

            if (editData.profilePicture) {
                setImagePreview(`${API_URL}/${editData.profilePicture.replace(/\\/g, '/')}`);
            } else {
                setImagePreview(null);
            }
        }
    }, [id, userByID]);

    const handleChange = (e) => {
        const { name, value, type, checked, files } = e.target;

        if (type === 'file') {
            const file = files[0];
            setFormData((prev) => ({
                ...prev,
                [name]: file
            }));

            // Image preview
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    setImagePreview(e.target.result);
                };
                reader.readAsDataURL(file);
            } else {
                setImagePreview(null);
            }
        } else {
            setFormData((prev) => ({
                ...prev,
                [name]: type === 'checkbox' ? checked : value
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const formDataToSend = new FormData();
            Object.keys(formData).forEach((key) => {
                const value = formData[key];
                if (value === null) {
                    return;
                }
                if (key === 'industry' && (value === '' || value === undefined)) {
                    return;
                }
                const optionalFields = [
                    'salutation',
                    'company',
                    'designation',
                    'linkedinProfile',
                    'street',
                    'city',
                    'state',
                    'postalCode',
                    'country',
                    'apartment',
                    'landmark',
                    'addressLabel',
                    'deliveryInstructions',
                    'companyName',
                    'position',
                    'description'
                ];
                if (optionalFields.includes(key) && value === '') {
                    return;
                }
                formDataToSend.append(key, value);
            });

            const getReturnPage = () => {
                const urlParams = new URLSearchParams(location.search || window.location.search);
                return urlParams.get('page') || location.state?.page || previousPageRef.current;
            };

            if (id) {
                const originalFirstName = originalUserNameRef.current.firstName?.trim() || '';
                const originalLastName = originalUserNameRef.current.lastName?.trim() || '';
                const newFirstName = formData.firstName.trim();
                const newLastName = formData.lastName.trim();

                const response = await dispatch(editUser(id, formDataToSend));
                if (response) {
                    if (originalFirstName !== newFirstName || originalLastName !== newLastName) {
                        const pageNumber = await calculateTargetPage({
                            newItemData: { firstName: newFirstName, lastName: newLastName },
                            entityId:  String(id),
                            shouldRefreshList: false
                        });
                        navigate(`${USER_PATHS.LIST_USERS}?page=${pageNumber}`);
                    } else {
                        const targetPage = previousPageRef.current;
                        if (targetPage) {
                            navigate(`${USER_PATHS.LIST_USERS}?page=${targetPage}`);
                        } else {
                            navigate(USER_PATHS.LIST_USERS);
                        }
                    }
                }
            } else {
                const newFirstName = formData.firstName.trim();
                const newLastName = formData.lastName.trim();
                const response = await dispatch(createUser(formDataToSend));
                if (response) {
                

                    const pageNumber = await calculateTargetPage({
                        newItemData: { firstName: newFirstName, lastName: newLastName },
                        entityId: response?.id ? String(response.id) : null,
                        shouldRefreshList: true
                    });
                    setFormData({
                        firstName: '',
                        lastName: '',
                        email: '',
                        mobile: '',
                        role: 'user',
                        salutation: '',
                        company: '',
                        industry: '',
                        designation: '',
                        street: '',
                        city: '',
                        state: '',
                        postalCode: '',
                        country: '',
                        addressType: 'home',
                        isDefaultAddress: true,
                        apartment: '',
                        landmark: '',
                        addressLabel: '',
                        deliveryInstructions: '',
                        acceptTerms: false,
                        companyName: '',
                        position: '',
                        description: '',
                        linkedinProfile: '',
                        profilePicture: null
                    });
                    setImagePreview(null);
                    navigate(`${USER_PATHS.LIST_USERS}?page=${pageNumber}`);
                }
            }
        } catch (error) {
            console.error('Error submitting form:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const getCurrentPageForNavigation = () => {
        const urlParams = new URLSearchParams(location.search || window.location.search);
        return urlParams.get('page') || location.state?.page || previousPageRef.current;
    };

    const handleCancel = () => {
        const targetPage = getCurrentPageForNavigation();
        handleBackNavigation(targetPage);
    };

    const handleBack = () => {
        const targetPage = getCurrentPageForNavigation();
        handleBackNavigation(targetPage);
    };

    return (
        <Container fluid>
            <div className="row">
                <div className="col-12">
                    <div className="card">
                        <div className="card-header">
                            <div className="d-flex justify-content-between align-items-center">
                                <h4 className="card-title">{id ? 'Edit User' : 'Add User'}</h4>
                                <Button variant="secondary" onClick={handleBack}>
                                    <i style={{ marginRight: '10px' }} className="fas fa-arrow-left me-2"></i>
                                    Back
                                </Button>
                            </div>
                        </div>
                        <div className="card-body">
                            {/* Show error if any */}
                            {error && (
                                <Alert variant="danger" className="mb-3">
                                    <strong>Error: </strong>
                                    {error}
                                </Alert>
                            )}

                            <form onSubmit={handleSubmit}>
                                <Row>
                                    <Col sm={6}>
                                        <div className="form-group fill">
                                            <label className="floating-label" htmlFor="firstName">
                                                First Name<span className="text-danger">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                name="firstName"
                                                value={formData.firstName}
                                                onChange={handleChange}
                                                placeholder="First Name"
                                                required
                                            />
                                        </div>
                                    </Col>
                                    <Col sm={6}>
                                        <div className="form-group fill">
                                            <label className="floating-label" htmlFor="lastName">
                                                Last Name<span className="text-danger">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                name="lastName"
                                                value={formData.lastName}
                                                onChange={handleChange}
                                                placeholder="Last Name"
                                                required
                                            />
                                        </div>
                                    </Col>
                                    <Col sm={6}>
                                        <div className="form-group fill">
                                            <label className="floating-label" htmlFor="email">
                                                Email<span className="text-danger">*</span>
                                            </label>
                                            <input
                                                type="email"
                                                className="form-control"
                                                name="email"
                                                value={formData.email}
                                                onChange={handleChange}
                                                placeholder="Email"
                                                required
                                            />
                                        </div>
                                    </Col>

                                    <Col sm={6}>
                                        <div className="form-group fill">
                                            <label className="floating-label" htmlFor="moible">
                                                Mobile<span className="text-danger">*</span>
                                            </label>
                                            <SingaporePhoneInput
                                                name="mobile"
                                                value={formData.mobile}
                                                onChange={handleChange}
                                                label="Mobile"
                                                required={false}
                                            />
                                        </div>
                                    </Col>
                                    <Col sm={6}>
                                        <div className="form-group fill">
                                            <label className="floating-label" htmlFor="role">
                                                Role<span className="text-danger">*</span>
                                            </label>
                                            <select
                                                className="form-control"
                                                name="role"
                                                value={formData.role}
                                                onChange={handleChange}
                                                required
                                            >
                                                <option value="user">User</option>
                                                <option value="admin">Admin</option>
                                                <option value="speaker">Speaker</option>
                                                <option value="exhibitor">Exhibitor</option>
                                            </select>
                                        </div>
                                    </Col>
                                    <Col sm={6}>
                                        <div className="form-group fill">
                                            <label className="floating-label" htmlFor="salutation">
                                                Salutation
                                            </label>
                                            <select
                                                className="form-control"
                                                name="salutation"
                                                value={formData.salutation}
                                                onChange={handleChange}
                                            >
                                                <option value="">Select Salutation</option>
                                                <option value="Mr.">Mr.</option>
                                                <option value="Mrs.">Mrs.</option>
                                                <option value="Miss">Miss</option>
                                                <option value="Ms.">Ms.</option>
                                                <option value="Dr.">Dr.</option>
                                                <option value="Prof.">Prof.</option>
                                            </select>
                                        </div>
                                    </Col>
                                    <Col sm={6}>
                                        <div className="form-group fill">
                                            <label className="floating-label" htmlFor="company">
                                                Company
                                            </label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                name="company"
                                                value={formData.company}
                                                onChange={handleChange}
                                                placeholder="Company/Organization"
                                            />
                                        </div>
                                    </Col>
                                    <Col sm={6}>
                                        <div className="form-group fill">
                                            <label className="floating-label" htmlFor="designation">
                                                Designation
                                            </label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                name="designation"
                                                value={formData.designation}
                                                onChange={handleChange}
                                                placeholder="Job Title/Designation"
                                            />
                                        </div>
                                    </Col>
                                    <Col sm={6}>
                                        <div className="form-group fill">
                                            <label className="floating-label" htmlFor="industry">
                                                Industry
                                            </label>
                                            <select
                                                className="form-control"
                                                name="industry"
                                                value={formData.industry}
                                                onChange={handleChange}
                                            >
                                                <option value="">Select Industry</option>
                                                <option value="Accounting">Accounting</option>
                                                <option value="Administration & Office Support">Administration & Office Support</option>
                                                <option value="Advertising, Arts & Media">Advertising, Arts & Media</option>
                                                <option value="Banking & Financial Services">Banking & Financial Services</option>
                                                <option value="Call Centre & Customer Service">Call Centre & Customer Service</option>
                                                <option value="Community Services & Development">Community Services & Development</option>
                                                <option value="Construction">Construction</option>
                                                <option value="Consulting & Strategy">Consulting & Strategy</option>
                                                <option value="Design & Architechture">Design & Architechture</option>
                                                <option value="Education & Training">Education & Training</option>
                                                <option value="Engineering">Engineering</option>
                                                <option value="Farming, Animals & Conservation">Farming, Animals & Conservation</option>
                                                <option value="Government & Defence">Government & Defence</option>
                                                <option value="Healthcare & Medical">Healthcare & Medical</option>
                                                <option value="Hospitality & Tourism">Hospitality & Tourism</option>
                                                <option value="Human Resources & Recruitment">Human Resources & Recruitment</option>
                                                <option value="Information & Communication Technology">
                                                    Information & Communication Technology
                                                </option>
                                                <option value="Insurance & Superannuation">Insurance & Superannuation</option>
                                                <option value="Legal">Legal</option>
                                                <option value="Manufacturing, Transport & Logistics">
                                                    Manufacturing, Transport & Logistics
                                                </option>
                                                <option value="Marketing & Communications">Marketing & Communications</option>
                                                <option value="Mining, Resources & Energy">Mining, Resources & Energy</option>
                                                <option value="Real Estate & Property">Real Estate & Property</option>
                                                <option value="Retail & Consumer Products">Retail & Consumer Products</option>
                                                <option value="Sales">Sales</option>
                                                <option value="Science & Technology">Science & Technology</option>
                                                <option value="Sport & Recreation">Sport & Recreation</option>
                                                <option value="Trades & Services">Trades & Services</option>
                                                <option value="Others">Others</option>
                                            </select>
                                        </div>
                                    </Col>
                                    <Col sm={6}>
                                        <div className="form-group fill">
                                            <label className="floating-label" htmlFor="addressType">
                                                Address Type
                                            </label>
                                            <select
                                                className="form-control"
                                                name="addressType"
                                                value={formData.addressType}
                                                onChange={handleChange}
                                            >
                                                <option value="home">Home</option>
                                                <option value="work">Work</option>
                                                <option value="billing">Billing</option>
                                                <option value="shipping">Shipping</option>
                                                <option value="other">Other</option>
                                            </select>
                                        </div>
                                    </Col>
                                    <Col sm={12}>
                                        <div className="form-group fill">
                                            <label className="floating-label" htmlFor="street">
                                                Street Address
                                            </label>
                                            <textarea
                                                className="form-control"
                                                name="street"
                                                value={formData.street}
                                                onChange={handleChange}
                                                placeholder="street"
                                                rows={3}
                                            />
                                        </div>
                                    </Col>
                                    <Col sm={4}>
                                        <div className="form-group fill">
                                            <label className="floating-label" htmlFor="city">
                                                City
                                            </label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                name="city"
                                                value={formData.city}
                                                onChange={handleChange}
                                                placeholder="City"
                                            />
                                        </div>
                                    </Col>
                                    <Col sm={4}>
                                        <div className="form-group fill">
                                            <label className="floating-label" htmlFor="state">
                                                State
                                            </label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                name="state"
                                                value={formData.state}
                                                onChange={handleChange}
                                                placeholder="State"
                                            />
                                        </div>
                                    </Col>
                                    <Col sm={4}>
                                        <div className="form-group fill">
                                            <label className="floating-label" htmlFor="postalCode">
                                                Postal Code
                                            </label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                name="postalCode"
                                                value={formData.postalCode}
                                                onChange={handleChange}
                                                placeholder="Postal Code"
                                            />
                                        </div>
                                    </Col>
                                    <Col sm={6}>
                                        <div className="form-group fill">
                                            <label className="floating-label" htmlFor="country">
                                                Country
                                            </label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                name="country"
                                                value={formData.country}
                                                onChange={handleChange}
                                                placeholder="Country"
                                            />
                                        </div>
                                    </Col>
                                    <Col sm={6}>
                                        <div className="form-group fill">
                                            <label className="floating-label" htmlFor="apartment">
                                                Apartment/Suite
                                            </label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                name="apartment"
                                                value={formData.apartment}
                                                onChange={handleChange}
                                                placeholder="Apartment, Suite, Unit"
                                            />
                                        </div>
                                    </Col>
                                    <Col sm={6}>
                                        <div className="form-group fill">
                                            <label className="floating-label" htmlFor="landmark">
                                                Landmark
                                            </label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                name="landmark"
                                                value={formData.landmark}
                                                onChange={handleChange}
                                                placeholder="Nearby Landmark"
                                            />
                                        </div>
                                    </Col>
                                    <Col sm={6}>
                                        <div className="form-group fill">
                                            <label className="floating-label" htmlFor="addressLabel">
                                                Address Label
                                            </label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                name="addressLabel"
                                                value={formData.addressLabel}
                                                onChange={handleChange}
                                                placeholder="Home, Office, etc."
                                            />
                                        </div>
                                    </Col>
                                    <Col sm={12}>
                                        <div className="form-group fill">
                                            <label className="floating-label" htmlFor="deliveryInstructions">
                                                Delivery Instructions
                                            </label>
                                            <textarea
                                                className="form-control"
                                                name="deliveryInstructions"
                                                value={formData.deliveryInstructions}
                                                onChange={handleChange}
                                                placeholder="Special delivery instructions"
                                                rows={2}
                                            />
                                        </div>
                                    </Col>

                                    <Col sm={12}>
                                        <div className="form-group fill">
                                            <label className="floating-label" htmlFor="linkedinProfile">
                                                LinkedIn Profile URL
                                            </label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                name="linkedinProfile"
                                                value={formData.linkedinProfile}
                                                onChange={handleChange}
                                                placeholder="https://linkedin.com/in/username"
                                            />
                                        </div>
                                    </Col>

                                    <Col sm={12}>
                                        <div className="form-group fill">
                                            <label className="floating-label" htmlFor="profilePicture">
                                                Profile Picture
                                            </label>
                                            <input
                                                type="file"
                                                className="form-control"
                                                name="profilePicture"
                                                onChange={handleChange}
                                                accept="image/*"
                                            />

                                            {/* Image Preview */}
                                            {imagePreview && (
                                                <div className="mt-3 text-start">
                                                    <img
                                                        src={imagePreview}
                                                        alt="Profile Preview"
                                                        style={{
                                                            width: '120px',
                                                            height: '120px',
                                                            objectFit: 'cover',
                                                            borderRadius: '10px',
                                                            border: '2px solid #4680ff',
                                                            marginTop: '10px'
                                                        }}
                                                    />
                                                    <p className="text-muted mt-2" style={{ fontSize: '12px' }}>
                                                        {id ? 'Current Profile Image' : 'Image Preview'}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </Col>
                                    {/* Speaker Profile Fields - Show only when role is speaker */}
                                    {formData.role === 'speaker' && (
                                        <>
                                            <Col sm={6}>
                                                <div className="form-group fill">
                                                    <label className="floating-label" htmlFor="companyName">
                                                        Company Name
                                                    </label>
                                                    <input
                                                        type="text"
                                                        className="form-control"
                                                        name="companyName"
                                                        value={formData.companyName}
                                                        onChange={handleChange}
                                                        placeholder="Company/Organization"
                                                    />
                                                </div>
                                            </Col>
                                            <Col sm={6}>
                                                <div className="form-group fill">
                                                    <label className="floating-label" htmlFor="position">
                                                        Position/Title
                                                    </label>
                                                    <input
                                                        type="text"
                                                        className="form-control"
                                                        name="position"
                                                        value={formData.position}
                                                        onChange={handleChange}
                                                        placeholder="Job Title/Position"
                                                    />
                                                </div>
                                            </Col>
                                            <Col sm={12}>
                                                <div className="form-group fill">
                                                    <label className="floating-label" htmlFor="description">
                                                        Bio/Description
                                                    </label>
                                                    <textarea
                                                        className="form-control"
                                                        name="description"
                                                        value={formData.description}
                                                        onChange={handleChange}
                                                        placeholder="Speaker biography and description"
                                                        rows={4}
                                                    />
                                                </div>
                                            </Col>
                                        </>
                                    )}

                                    <Col sm={6}>
                                        <div className="form-group">
                                            <div className="custom-control custom-switch">
                                                <input
                                                    type="checkbox"
                                                    className="custom-control-input"
                                                    id="isDefaultAddress"
                                                    name="isDefaultAddress"
                                                    checked={formData.isDefaultAddress}
                                                    onChange={handleChange}
                                                />
                                                <label className="custom-control-label" htmlFor="isDefaultAddress">
                                                    Default Address
                                                </label>
                                            </div>
                                        </div>
                                    </Col>
                                    <Col sm={6}>
                                        <div className="form-group">
                                            <div className="custom-control custom-switch">
                                                <input
                                                    type="checkbox"
                                                    className="custom-control-input"
                                                    id="acceptTerms"
                                                    name="acceptTerms"
                                                    checked={formData.acceptTerms}
                                                    onChange={handleChange}
                                                />
                                                <label className="custom-control-label" htmlFor="acceptTerms">
                                                    Accept Terms & Conditions
                                                </label>
                                            </div>
                                        </div>
                                    </Col>
                                </Row>

                                {/* Form Actions */}
                                <div className="row mt-4">
                                    <div className="col-12">
                                        <div className="d-flex justify-content-between gap-2">
                                            <Button variant="danger" onClick={handleCancel} disabled={loading}>
                                                Cancel
                                            </Button>
                                            <Button
                                                variant="primary"
                                                type="submit"
                                                disabled={
                                                    loading ||
                                                    !formData.firstName.trim() ||
                                                    !formData.lastName.trim() ||
                                                    !formData.email.trim()
                                                }
                                            >
                                                {loading ? <>{id ? 'Updating...' : 'Creating...'}</> : id ? 'Update User' : 'Create User'}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </Container>
    );
};

export default AddUserPage;
