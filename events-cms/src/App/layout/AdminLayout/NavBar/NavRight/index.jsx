import * as React from 'react';
import { Dropdown } from 'react-bootstrap';
import PerfectScrollbar from 'react-perfect-scrollbar';
import DEMO from '../../../../../store/constant';
import Avatar1 from '../../../../../assets/images/user/avatar-1.jpg';
import Avatar2 from '../../../../../assets/images/user/avatar-2.jpg';
import { useNavigate } from 'react-router-dom';
import { logout } from '../../../../../store/actions/authActions';
import { useDispatch } from 'react-redux';
const NavRight = (props) => {

    const navigate = useNavigate();
    const dispatch = useDispatch();

    const handleLogout = async (e) => {
        e.preventDefault();
        const result = await dispatch(logout());
        if (result.success) {
            navigate('/auth/signin-1');
        }
    };


    return (<>
            <ul className="navbar-nav ml-auto">
                <li>
                    <Dropdown drop={!props.rtlLayout ? 'left' : 'right'} className="dropdown" alignRight={!props.rtlLayout}>
                        <Dropdown.Toggle variant={'link'} id="dropdown-basic">
                            <i className="feather icon-bell icon"/>
                        </Dropdown.Toggle>
                        <Dropdown.Menu alignRight className="notification">
                            <div className="noti-head bg-dark">
                                <h6 className="d-inline-block m-b-0">Notifications</h6>
                                <div className="float-right">
                                    <a href={DEMO.BLANK_LINK} className="m-r-10">
                                        mark as read
                                    </a>
                                    <a href={DEMO.BLANK_LINK}>clear all</a>
                                </div>
                            </div>
                            <div style={{ height: '300px' }}>
                                <PerfectScrollbar>
                                    <ul className="noti-body">
                                        <li className="n-title">
                                            <p className="m-b-0">NEW</p>
                                        </li>
                                        <li className="notification">
                                            <div className="media">
                                                <img className="img-radius" src={Avatar1} alt="Generic placeholder"/>
                                                <div className="media-body">
                                                    <p>
                                                        <strong>John Doe</strong>
                                                        <span className="n-time text-muted">
                                                            <i className="icon feather icon-clock m-r-10"/>5 min
                                                        </span>
                                                    </p>
                                                    <p>New ticket Added</p>
                                                </div>
                                            </div>
                                        </li>
                                        <li className="n-title">
                                            <p className="m-b-0">EARLIER</p>
                                        </li>
                                        <li className="notification">
                                            <div className="media">
                                                <img className="img-radius" src={Avatar2} alt="Generic placeholder"/>
                                                <div className="media-body">
                                                    <p>
                                                        <strong>Joseph William</strong>
                                                        <span className="n-time text-muted">
                                                            <i className="icon feather icon-clock m-r-10"/>
                                                            10 min
                                                        </span>
                                                    </p>
                                                    <p>Prchace New Theme and make payment</p>
                                                </div>
                                            </div>
                                        </li>
                                        <li className="notification">
                                            <div className="media">
                                                <img className="img-radius" src={Avatar1} alt="Generic placeholder"/>
                                                <div className="media-body">
                                                    <p>
                                                        <strong>Sara Soudein</strong>
                                                        <span className="n-time text-muted">
                                                            <i className="icon feather icon-clock m-r-10"/>
                                                            12 min
                                                        </span>
                                                    </p>
                                                    <p>currently login</p>
                                                </div>
                                            </div>
                                        </li>
                                        <li className="notification">
                                            <div className="media">
                                                <img className="img-radius" src={Avatar2} alt="Generic placeholder"/>
                                                <div className="media-body">
                                                    <p>
                                                        <strong>Joseph William</strong>
                                                        <span className="n-time text-muted">
                                                            <i className="icon feather icon-clock m-r-10"/>
                                                            30 min
                                                        </span>
                                                    </p>
                                                    <p>Prchace New Theme and make payment</p>
                                                </div>
                                            </div>
                                        </li>
                                    </ul>
                                </PerfectScrollbar>
                            </div>
                            <div className="noti-footer">
                                <a href={DEMO.BLANK_LINK}>show all</a>
                            </div>
                        </Dropdown.Menu>
                    </Dropdown>
                </li>
                <li>
                    <Dropdown drop={!props.rtlLayout ? 'left' : 'right'} className="dropdown" alignRight={!props.rtlLayout}>
                        <Dropdown.Toggle variant={'link'} id="dropdown-basic">
                            <i className="icon feather icon-user"/>
                        </Dropdown.Toggle>
                        <Dropdown.Menu alignRight className="profile-notification">
                            <div className="pro-head bg-dark">
                                <img src={Avatar1} className="img-radius" alt="User Profile"/>
                                <span>John Doe</span>
                                <a href={DEMO.BLANK_LINK} className="dud-logout" onClick={handleLogout} title="Logout">
                                    <i className="feather icon-log-out"/>
                                </a>
                            </div>
                            <ul className="pro-body">
                                <li>
                                    <a href={DEMO.BLANK_LINK} className="dropdown-item">
                                        <i className="feather icon-settings"/> Settings
                                    </a>
                                </li>
                                <li>
                                    <a href={DEMO.BLANK_LINK} className="dropdown-item">
                                        <i className="feather icon-user"/> Profile
                                    </a>
                                </li>
                                <li>
                                    <a href={DEMO.BLANK_LINK} className="dropdown-item">
                                        <i className="feather icon-mail"/> My Messages
                                    </a>
                                </li>
                                <li>
                                    <a href={DEMO.BLANK_LINK} className="dropdown-item">
                                        <i className="feather icon-lock"/> Lock Screen
                                    </a>
                                </li>
                            </ul>
                        </Dropdown.Menu>
                    </Dropdown>
                </li>
            </ul>
        </>);
};
export default NavRight;
