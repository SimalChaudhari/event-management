import { useState, useRef, useEffect } from 'react';
import { Row, Col } from 'react-bootstrap';
import avatar from '../../../assets/images/user/default.jpg';
import { API_URL, CACHE_CONFIG } from '../../../configs/env';
import { getCookie, setCookie } from '../../../utils/cookieUtils';
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


    // Update cookie and Redux store with updated user data
    const updateUserState = (updatedData) => {
        const userDataEnc = getCookie(CACHE_CONFIG.USER_KEY);
        const userData = userDataEnc ? JSON.parse(decodeURIComponent(userDataEnc)) : {};
        const updatedUser = { ...user, ...updatedData };
        
        if (!updatedUser.id && user.id) {
            updatedUser.id = user.id;
        }
        
        setCookie(
            CACHE_CONFIG.USER_KEY,
            encodeURIComponent(JSON.stringify({ ...userData, user: updatedUser })),
            1
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
