import * as React from 'react';
import { Dropdown } from 'react-bootstrap';
import PerfectScrollbar from 'react-perfect-scrollbar';
import DEMO from '../../../../../store/constant';
import avatar5 from '../../../../../assets/images/user/avatar-5.jpg';
import Avatar2 from '../../../../../assets/images/user/avatar-2.jpg';
import { useNavigate } from 'react-router-dom';
import { logout } from '../../../../../store/actions/authActions';
import { useDispatch, useSelector } from 'react-redux';
import { API_URL } from '../../../../../configs/env';


const NavRight = (props) => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const user = useSelector((state) => state.auth.authUser);
    const profilePicPath = user.profilePicture ? `${API_URL}/${user.profilePicture}` : avatar5;
    const fullName = `${user.firstName} ${user.lastName}`;


    // Add state to control dropdown visibility
    const [showDropdown, setShowDropdown] = React.useState(false);
    
    const handleLogout = async (e) => {
        e.preventDefault();
        const result = await dispatch(logout());
        if (result.success) {
            navigate('/auth/signin');
        }
    };
    const handleProfile = async (e,tab) => {
        e.preventDefault();
        setShowDropdown(false); // Close dropdown
        if (tab) {
            navigate(`/profile?tab=${tab}`);
        } else {
            navigate('/profile');
        }
    };

    const handleSettings = async (e,tab) => {
        e.preventDefault();
        setShowDropdown(false); // Close dropdown
        if (tab) {
            navigate(`/profile?tab=${tab}`);
        } else {
            navigate('/profile');
        }
    };
    return (
        <>
            <ul className="navbar-nav ml-auto">
                <li>
                    <Dropdown 
                    drop={!props.rtlLayout ? 'left' : 'right'}
                     className="dropdown" 
                     alignRight={!props.rtlLayout}
                     show={showDropdown}
                     onToggle={(isOpen) => setShowDropdown(isOpen)}
                     >
                        <Dropdown.Toggle variant={'link'} id="dropdown-basic">
                            <i className="icon feather icon-user" />
                        </Dropdown.Toggle>
                        <Dropdown.Menu alignRight className="profile-notification">
                            <div className="pro-head bg-dark">
                                <img src={profilePicPath} className="img-radius" alt="User Profile" />
                                <span>{fullName}</span>
                            </div>
                            <ul className="pro-body">
                                <li>
                                    <a href={DEMO.BLANK_LINK} className="dropdown-item" onClick={(e) => handleSettings(e, 'settings')}>
                                        <i className="feather icon-settings" /> Settings
                                    </a>
                                </li>
                                <li>
                                    <a href={DEMO.BLANK_LINK} className="dropdown-item"  onClick={(e) => handleProfile(e, 'profile')}>
                                        <i className="feather icon-user" /> Profile
                                    </a>
                                </li>

                                <li>
                                    <a className="dropdown-item" onClick={handleLogout}>
                                        <i className="feather icon-log-out" /> Logout
                                    </a>
                                </li>
                            </ul>
                        </Dropdown.Menu>
                    </Dropdown>
                </li>
            </ul>
        </>
    );
};
export default NavRight;
