import React, { useState, useEffect } from 'react';
import { Button, Row, Col, Card, Container, Alert } from 'react-bootstrap';
import { useDispatch } from 'react-redux';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { createSpeaker, updateSpeaker, speakerById, speakerList } from '../../store/actions/speakerActions';
import SingaporePhoneInput from '../../components/SingaporePhoneInput';
import { API_URL, DUMMY_PATH } from '../../configs/env';
import { SPEAKER_PATHS } from '../../utils/constants';
import useTableNavigation from '../../hooks/useTableNavigation';
import useCalculateTargetPage from '../../hooks/useCalculateTargetPage';

const AddSpeakerPage = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();
    const { id } = useParams(); 

    // Store the page number from where we came from (for edit mode)
    const previousPageRef = React.useRef(null);
    
    // Store original firstName and lastName for edit mode to detect changes
    const originalSpeakerNameRef = React.useRef({ firstName: '', lastName: '' });
    
    // Use reusable hook for calculating target page
    const { calculateTargetPage } = useCalculateTargetPage({
        listAction: speakerList,
        reduxSelector: 'speaker.speakers',
        pageLength: 5,
        sortType: 'string',
        sortDirection: 'asc',
        sortFields: ['firstName', 'lastName']
    });

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        mobile: '',
        position: '',
        companyName: '',

        description: '',
        profilePicture: null
    });
    const [loading, setLoading] = useState(false);
    const [imagePreview, setImagePreview] = useState(null);

    // Capture the page number from URL when entering add/edit page
    useEffect(() => {
        // Get page parameter from URL if it exists (for both add and edit mode)
        const urlParams = new URLSearchParams(location.search || window.location.search);
        const pageParam = urlParams.get('page');
        if (pageParam) {
            previousPageRef.current = parseInt(pageParam, 10);
        } else {
            // Also check if page is in location state (from navigation)
            if (location.state?.page) {
                previousPageRef.current = location.state.page;
            }
        }
    }, [id, location.search, location.state]);

    // Load edit data if id exists
    useEffect(() => {
        if (id) {
            const loadSpeakerData = async () => {
                try {
                    const response = await dispatch(speakerById(id));
                    if (response?.data) {
                        const editData = response.data;
                        setFormData({
                            firstName: editData.firstName || '',
                            lastName: editData.lastName || '',
                            email: editData.email || '',
                            mobile: editData.mobile || '',
                            position: editData.position || '',
                            companyName: editData.companyName || '',

                            description: editData.description || '',
                            profilePicture: null
                        });
                        
                        // Store original name for comparison on update
                        originalSpeakerNameRef.current = {
                            firstName: editData.firstName || '',
                            lastName: editData.lastName || ''
                        };

                       
                        if (editData.profilePicture) {
                            setImagePreview(`${API_URL}/${editData.profilePicture}`);
                        } else {
                            setImagePreview(DUMMY_PATH);
                        }
                    }
                } catch (error) {
                    console.error('Error loading speaker data:', error);
                }
            };
            loadSpeakerData();
        }
    }, [id, dispatch]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        setFormData((prev) => ({
            ...prev,
            profilePicture: file
        }));

        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                setImagePreview(e.target.result);
            };
            reader.readAsDataURL(file);
        } else {
            if (id && formData.profilePicture) {
                setImagePreview(`${API_URL}/${formData.profilePicture}`);
            } else {
                setImagePreview(DUMMY_PATH);
            }
        }
    };

    // Use reusable table navigation hook for back navigation with page preservation
    const { handleBack: handleBackNavigation } = useTableNavigation({
        tableRef: null, // Not needed for back navigation
        listPath: SPEAKER_PATHS.LIST_SPEAKERS,
        viewPath: SPEAKER_PATHS.VIEW_SPEAKER,
        editPath: SPEAKER_PATHS.EDIT_SPEAKER,
        addPath: SPEAKER_PATHS.ADD_SPEAKER
    });
    
    // Handle Back button click - preserve page from URL or location state
    const handleBack = () => {
        const urlParams = new URLSearchParams(location.search || window.location.search);
        const currentPage = urlParams.get('page') || location.state?.page || previousPageRef.current;
        handleBackNavigation(currentPage);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const submitData = new FormData();
            Object.keys(formData).forEach((key) => {
                if (formData[key] !== null) {
                    submitData.append(key, formData[key]);
                }
            });

            if (id) {
                // For edit mode, check if firstName or lastName changed
                const originalFirstName = originalSpeakerNameRef.current.firstName;
                const originalLastName = originalSpeakerNameRef.current.lastName;
                const newFirstName = formData.firstName.trim();
                const newLastName = formData.lastName.trim();
                
                const response = await dispatch(updateSpeaker(id, submitData));
                if (response) {
                    // If firstName or lastName changed, calculate which page the updated speaker will appear on
                    // No need to refresh - Redux already has the updated speaker from updateSpeaker action
                    if (originalFirstName !== newFirstName || originalLastName !== newLastName) {
                        // Convert id to string for consistent comparison (matching reducer and hook logic)
                        const pageNumber = await calculateTargetPage({
                            newItemData: { firstName: newFirstName, lastName: newLastName },
                            entityId: String(id), // Ensure string format for ID comparison
                            shouldRefreshList: false // Redux already updated, no need to fetch again
                        });
                        navigate(`${SPEAKER_PATHS.LIST_SPEAKERS}?page=${pageNumber}`);
                    } else {
                        // Name didn't change, preserve the page number if we were editing from a specific page
                        if (previousPageRef.current) {
                            navigate(`${SPEAKER_PATHS.LIST_SPEAKERS}?page=${previousPageRef.current}`);
                        } else {
                            navigate(SPEAKER_PATHS.LIST_SPEAKERS);
                        }
                    }
                }
            } else {
                // For create mode, calculate which page the new speaker will appear on
                const newFirstName = formData.firstName.trim();
                const newLastName = formData.lastName.trim();
                
                const response = await dispatch(createSpeaker(submitData));
                if (response) {
                    // After creation, calculate the page
                    // createSpeaker already adds the new speaker to Redux, no need to fetch again
                    // We sort the existing Redux data in the hook before calculating
                    // Convert id to string for consistent comparison (matching reducer and hook logic)
                    const pageNumber = await calculateTargetPage({
                        newItemData: { firstName: newFirstName, lastName: newLastName },
                        entityId: response.id ? String(response.id) : null, // Ensure string format for ID comparison
                        shouldRefreshList: false // Redux already updated, no need to fetch again
                    });
                    
                    setFormData({
                        firstName: '',
                        lastName: '',
                        email: '',
                        mobile: '',
                        position: '',
                        companyName: '',

                        description: '',
                        profilePicture: null
                    });
                    setImagePreview(null);

                    // Navigate to the page where the new speaker appears
                    navigate(`${SPEAKER_PATHS.LIST_SPEAKERS}?page=${pageNumber}`);
                }
            }
        } catch (error) {
            setLoading(false);
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        // Use the reusable handleBackNavigation function which preserves page from URL or location state
        const urlParams = new URLSearchParams(location.search || window.location.search);
        const currentPage = urlParams.get('page') || location.state?.page || previousPageRef.current;
        handleBackNavigation(currentPage);
    };

    return (
        <Container fluid>
            <div className="row">
                <div className="col-12">
                    <div className="card">
                        <div className="card-header">
                            <div className="d-flex justify-content-between align-items-center">
                                <h4 className="card-title">{id ? 'Edit Speaker' : 'Add Speaker'}</h4>
                                <Button variant="secondary" onClick={handleBack} disabled={loading}>
                                    <i style={{ marginRight: '10px' }} className="fas fa-arrow-left me-2"></i>
                                    Back
                                </Button>
                            </div>
                        </div>
                        <div className="card-body">
                            <form onSubmit={handleSubmit}>
                                <Row>
                                    <Col sm={6}>
                                        <div className="form-group fill">
                                            <label className="floating-label" htmlFor="firstName">
                                                First Name  <span className="text-danger">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                name="firstName"
                                                value={formData.firstName}
                                                onChange={handleInputChange}
                                                placeholder="Enter first name"
                                                required
                                            />
                                        </div>
                                    </Col>

                                    <Col sm={6}>
                                        <div className="form-group fill">
                                            <label className="floating-label" htmlFor="lastName">
                                                Last Name  <span className="text-danger">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                name="lastName"
                                                value={formData.lastName}
                                                onChange={handleInputChange}
                                                placeholder="Enter last name"
                                                required
                                            />
                                        </div>
                                    </Col>

                                    <Col sm={6}>
                                        <div className="form-group fill">
                                            <label className="floating-label" htmlFor="email">
                                                Email  <span className="text-danger">*</span>
                                            </label>
                                            <input
                                                type="email"
                                                className="form-control"
                                                name="email"
                                                value={formData.email}
                                                onChange={handleInputChange}
                                                placeholder="Enter email address"
                                                required
                                            />
                                        </div>
                                    </Col>

                                    <Col sm={6}>
                                        <div className="form-group fill">
                                            <SingaporePhoneInput
                                                name="mobile"
                                                value={formData.mobile}
                                                onChange={handleInputChange}
                                                label="Mobile"
                                                required={true}
                                            />
                                        </div>
                                    </Col>

                                    <Col sm={6}>
                                        <div className="form-group fill">
                                            <label className="floating-label" htmlFor="position">
                                                Position  <span className="text-danger">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                name="position"
                                                value={formData.position}
                                                onChange={handleInputChange}
                                                placeholder="Enter position/designation"
                                                required
                                            />
                                        </div>
                                    </Col>

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
                                                onChange={handleInputChange}
                                                placeholder="Enter company name"
                                            />
                                        </div>
                                    </Col>

                                    <Col sm={12}>
                                        <div className="form-group fill">
                                            <label className="floating-label" htmlFor="description">
                                                Description
                                            </label>
                                            <textarea
                                                className="form-control"
                                                name="description"
                                                value={formData.description}
                                                onChange={handleInputChange}
                                                placeholder="Enter speaker description"
                                                rows={4}
                                            />
                                        </div>
                                    </Col>

                                    <Col sm={12}>
                                        <div className="form-group fill">
                                            <label className="floating-label" htmlFor="profilePicture">
                                                Profile Image
                                            </label>
                                            <input
                                                type="file"
                                                className="form-control"
                                                name="profilePicture"
                                                onChange={handleFileChange}
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
                                </Row>

                                {/* Form Actions */}
                                <div className="row mt-4">
                                    <div className="col-12">
                                        <div className="d-flex justify-content-between gap-2">
                                            <Button variant="danger" onClick={handleCancel}>
                                                Cancel
                                            </Button>
                                            <Button
                                                variant="primary"
                                                type="submit"
                                                disabled={
                                                    loading ||
                                                    !formData.firstName.trim() ||
                                                    !formData.lastName.trim() ||
                                                    !formData.email.trim() ||
                                                    !formData.mobile.trim() ||
                                                    !formData.position.trim()
                                                }
                                            >
                                                {loading ? (id ? 'Updating...' : 'Creating...') : id ? 'Update' : 'Create'}
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

export default AddSpeakerPage;
