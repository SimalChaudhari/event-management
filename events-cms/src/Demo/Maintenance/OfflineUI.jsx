import * as React from 'react';
import { NavLink } from 'react-router-dom';
import '../../assets/scss/style.scss';
import Breadcrumb from '../../App/layout/AdminLayout/Breadcrumb';
import imgSparcle1 from '../../assets/images/maintenance/sparcle-1.png';
import imgSparcle2 from '../../assets/images/maintenance/sparcle-2.png';
// import imgShip from '../../assets/images/maintenance/ship.svg';
// import imgSark from '../../assets/images/maintenance/sark.svg';

const sark = "https://www.google.com/url?sa=i&url=https%3A%2F%2Fafrica-ird.org%2F%3Fa%3D79215033740&psig=AOvVaw0hJC-ioPZGdM9lTc0mfbcE&ust=1737019226811000&source=images&cd=vfe&opi=89978449&ved=0CBEQjRxqFwoTCJDS24qz94oDFQAAAAAdAAAAABAa"
const ship = "https://www.google.com/url?sa=i&url=https%3A%2F%2Fwww.pexels.com%2Fsearch%2Fship%2F&psig=AOvVaw1oPt-jsNmT2T_WcEaGU3ww&ust=1737019313176000&source=images&cd=vfe&opi=89978449&ved=0CBEQjRxqFwoTCODIraqz94oDFQAAAAAdAAAAABAE"

const OfflineUI = () => {
    return (
        <>
            <Breadcrumb />
            <div className="auth-wrapper offline">
                <div className="offline-wrapper">
                    <img src={imgSparcle1} alt="User-1" className="img-fluid s-img-1" />
                    <img src={imgSparcle2} alt="User-2" className="img-fluid s-img-2" />
                    <div className="container off-main">
                        <div className="row justify-content-center">
                            <div className="col-6">
                                <div className="text-center">
                                    <div className="moon" />
                                    <img src={ship} alt="" className="img-fluid boat-img" />
                                </div>
                            </div>
                        </div>
                        <div className="row m-0 justify-content-center off-content">
                            <div className="col-sm-12 p-0">
                                <div className="text-center">
                                    <h1 className="text-white text-uppercase">Offline</h1>
                                    <h5 className="text-white font-weight-normal m-b-30">The site is temporarily down</h5>
                                    <NavLink to="/" className="btn btn-warning mb-4">
                                        <i className="feather icon-refresh-ccw mr-2" />
                                        Reload
                                    </NavLink>
                                </div>
                            </div>
                            <div className="sark">
                                <img src={sark} alt="" className="img-fluid img-sark" />
                                <div className="bubble" />
                            </div>
                        </div>
                    </div>
                    <svg width="100%" height="70%" version="1.1" xmlns="http://www.w3.org/2000/svg" className="wave">
                        <title>Wave</title>
                        <defs />
                        <path id="feel-the-wave" d="" />
                    </svg>
                    <svg width="100%" height="70%" version="1.1" xmlns="http://www.w3.org/2000/svg" className="wave">
                        <title>Wave</title>
                        <defs />
                        <path id="feel-the-wave-two" d="" />
                    </svg>
                </div>
            </div>
        </>);
};
export default OfflineUI;
