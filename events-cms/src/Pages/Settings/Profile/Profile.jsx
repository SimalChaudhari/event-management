import { useState, useRef, useEffect } from 'react';
import { Row, Col } from 'react-bootstrap';
import avatar from '../../../assets/images/user/default.jpg';
import { API_URL } from '../../../configs/env';
import { useSelector, useDispatch } from 'react-redux';
import { editUser, removeProfilePicture } from '../../../store/actions/userActions';
import { AUTH_DATA } from '../../../store/constants/actionTypes';
import { changePassword } from '../../../store/actions/authActions';
import { toast } from 'react-toastify';
import RemoveProfilePictureModal from './RemoveProfilePictureModal';
import ProfileHeader from './components/ProfileHeader';
import PersonalDetailsCard from './components/PersonalDetailsCard';
import ContactInformationCard from './components/ContactInformationCard';
import SecuritySettingsCard from './components/SecuritySettingsCard';

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
    const emailRef = useRef(null);
    const linkedinProfileRef = useRef(null);

    const [data, setData] = useState({
        isPersonalEdit: false,
        isContactEdit: false,
        isPasswordEdit: false
    });

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [mobileValue, setMobileValue] = useState(user?.mobile || '');

    const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
    const profilePicPath = user.profilePicture ? `${API_URL}/${user.profilePicture}` : avatar;

    // Sync mobile value when user data changes
    useEffect(() => {
        if (user?.mobile) {
            setMobileValue(user.mobile);
        }
    }, [user?.mobile]);


    // Update local storage and Redux store with updated user data
    const updateUserState = (updatedData) => {
        const userData = JSON.parse(localStorage.getItem('userData'));
        const updatedUser = { ...user, ...updatedData };
        
        if (!updatedUser.id && user.id) {
            updatedUser.id = user.id;
        }
        
        localStorage.setItem(
            'userData',
            JSON.stringify({
                ...userData,
                user: updatedUser
            })
        );

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

        const response = await dispatch(editUser(user.id, personalData));
        if (response && typeof response === 'object') {
            updateUserState(response);
            setData({ ...data, isPersonalEdit: false });
        } else if (response) {
            updateUserState(personalData);
            setData({ ...data, isPersonalEdit: false });
        }
    };

    // Handle contact information update
    const handleContactUpdate = async () => {
        const contactData = {
            mobile: mobileValue || '',
            email: emailRef.current?.value || '',
            linkedinProfile: linkedinProfileRef.current?.value || ''
        };

        const response = await dispatch(editUser(user.id, contactData));
        if (response && typeof response === 'object') {
            updateUserState(response);
            setData({ ...data, isContactEdit: false });
        } else if (response) {
            updateUserState(contactData);
            setData({ ...data, isContactEdit: false });
        }
    };

    // Handle password change
    const handlePasswordChange = async (values) => {
        const result = await dispatch(changePassword(values));
        if (result.success) {
            setData({ ...data, isPasswordEdit: false });
            return { success: true };
        }
        return { success: false };
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
            const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
            if (!allowedTypes.includes(file.type)) {
                toast.error('Only image files (JPEG, PNG, GIF) are allowed');
                return;
            }

            const maxSize = 5 * 1024 * 1024;
            if (file.size > maxSize) {
                toast.error('File size must be less than 5MB');
                return;
            }

            const formData = new FormData();
            formData.append('profilePicture', file);
            const response = await dispatch(editUser(user.id, formData));
            if (response && typeof response === 'object') {
                updateUserState(response);
            } else if (response && response.profilePicture) {
                updateUserState({ profilePicture: response.profilePicture });
            }
        }
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleRemoveProfilePictureClick = () => {
        setShowDeleteModal(true);
    };

    const handleConfirmRemoveProfilePicture = async () => {
        setIsDeleting(true);
        try {
            const response = await dispatch(removeProfilePicture());
            if (response) {
                const updatedUser = response.data || response;
                if (updatedUser && typeof updatedUser === 'object') {
                    updateUserState(updatedUser);
                } else {
                updateUserState({ profilePicture: '' });
                }
                setShowDeleteModal(false);
            }
        } catch (error) {
            console.error('Remove profile picture failed:', error);
        } finally {
            setIsDeleting(false);
        }
    };

    const handleCloseDeleteModal = () => {
        if (!isDeleting) {
            setShowDeleteModal(false);
        }
    };

    return (
        <>
            <style>{`
                .profile-image-wrapper {
                    position: relative;
                    display: inline-block;
                    margin-top: -80px;
                }
                .profile-image-wrapper:hover img {
                    transform: scale(1.05);
                }
                .profile-image-wrapper::before {
                    content: '';
                    position: absolute;
                    top: -5px;
                    left: -5px;
                    right: -5px;
                    bottom: -5px;
                    border-radius: 50%;
                    background: linear-gradient(135deg, #667eea, #764ba2);
                    z-index: -1;
                    opacity: 0;
                    transition: opacity 0.3s ease;
                }
                .profile-image-wrapper:hover::before {
                    opacity: 0.3;
                }
                .info-card-hover:hover {
                    transform: translateY(-4px);
                    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12) !important;
                }
                .info-item-hover:hover {
                    background: #f8f9fa;
                }
                .form-control:focus {
                    border-color: #667eea;
                    box-shadow: 0 0 0 0.2rem rgba(102, 126, 234, 0.25);
                }
                .btn-primary:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4) !important;
                }
                .section-title {
                    font-size: 1.25rem;
                    font-weight: 700;
                    color: #2d3748;
                    margin: 0;
                }
                .info-label {
                    font-weight: 600;
                    color: #4a5568;
                    font-size: 0.9rem;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                .info-value {
                    color: #2d3748;
                    font-size: 1rem;
                    font-weight: 500;
                }
                .edit-icon-btn {
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: linear-gradient(135deg, #667eea, #764ba2);
                    color: white;
                    border: none;
                    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
                    transition: all 0.3s ease;
                }
                .edit-icon-btn:hover {
                    transform: scale(1.1) rotate(90deg);
                    box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4);
                }
                .status-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.5rem 1rem;
                    border-radius: 20px;
                    font-size: 0.85rem;
                    font-weight: 600;
                }
                .status-verified {
                    background: linear-gradient(135deg, #48bb78, #38a169);
                    color: white;
                }
                .status-unverified {
                    background: linear-gradient(135deg, #f56565, #e53e3e);
                    color: white;
                }
                .status-member {
                    background: linear-gradient(135deg, #4299e1, #3182ce);
                    color: white;
                }
                .status-nonmember {
                    background: #e2e8f0;
                    color: #4a5568;
                }
                .contact-link {
                    color: #667eea;
                    text-decoration: none;
                    transition: all 0.3s ease;
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.5rem;
                    border-radius: 8px;
                }
                .contact-link:hover {
                    color: #764ba2;
                    background: rgba(102, 126, 234, 0.1);
                    transform: translateX(4px);
                }
                .custom-switch .custom-control-input:checked ~ .custom-control-label::before {
                    background-color: #667eea;
                    border-color: #667eea;
                }
                .collapse-transition {
                    transition: all 0.3s ease;
                }
            `}</style>

            <RemoveProfilePictureModal 
                show={showDeleteModal} 
                onHide={handleCloseDeleteModal} 
                onConfirm={handleConfirmRemoveProfilePicture}
                isLoading={isDeleting}
            />
            
            <ProfileHeader
                user={user}
                profilePicPath={profilePicPath}
                fullName={fullName}
                fileInputRef={fileInputRef}
                handleUploadClick={handleUploadClick}
                handleFileChange={handleFileChange}
                handleRemoveProfilePictureClick={handleRemoveProfilePictureClick}
            />

            <Row>
                <Col md={12}>
                    {/* Personal Details */}
                    <PersonalDetailsCard
                        user={user}
                        fullName={fullName}
                        isEditMode={data.isPersonalEdit}
                        onToggleEdit={() => setData({ ...data, isPersonalEdit: !data.isPersonalEdit })}
                        onSave={handlePersonalUpdate}
                        onCancel={() => setData({ ...data, isPersonalEdit: false })}
                        firstNameRef={firstNameRef}
                        lastNameRef={lastNameRef}
                        addressRef={addressRef}
                        cityRef={cityRef}
                        stateRef={stateRef}
                        postalCodeRef={postalCodeRef}
                    />

                    {/* Contact Information */}
                    <ContactInformationCard
                        user={user}
                        isEditMode={data.isContactEdit}
                        onToggleEdit={() => setData({ ...data, isContactEdit: !data.isContactEdit })}
                        onSave={handleContactUpdate}
                        onCancel={() => {
                            setMobileValue(user?.mobile || '');
                            setData({ ...data, isContactEdit: false });
                        }}
                        mobileValue={mobileValue}
                        setMobileValue={setMobileValue}
                        emailRef={emailRef}
                        linkedinProfileRef={linkedinProfileRef}
                    />

                    {/* Security Settings */}
                    <SecuritySettingsCard
                        isEditMode={data.isPasswordEdit}
                        onToggleEdit={() => setData({ ...data, isPasswordEdit: !data.isPasswordEdit })}
                        onSave={handlePasswordChange}
                        dispatch={dispatch}
                    />
                </Col>
            </Row>
        </>
    );
};

export default Profile;
