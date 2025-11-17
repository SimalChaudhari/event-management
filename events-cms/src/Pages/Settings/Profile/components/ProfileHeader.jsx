import React from 'react';
import { Row, Col, Card, Dropdown, Badge } from 'react-bootstrap';
import avatar from '../../../../assets/images/user/default.jpg';
import { API_URL } from '../../../../configs/env';

const ProfileHeader = ({ 
    user, 
    profilePicPath, 
    fullName, 
    fileInputRef, 
    handleUploadClick, 
    handleFileChange,
    handleRemoveProfilePictureClick
}) => {
    const profileStyles = {
        headerCard: {
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '16px',
            boxShadow: '0 10px 40px rgba(102, 126, 234, 0.3)',
            overflow: 'visible',
            marginBottom: '2rem',
            position: 'relative',
            zIndex: 100
        },
        tabButton: {
            borderRadius: '8px 8px 0 0',
            padding: '0.875rem 1.5rem',
            fontWeight: '600',
            transition: 'all 0.3s ease',
            border: 'none',
            background: 'transparent'
        }
    };

    return (
        <>
            <style>{`
                .profile-header-gradient {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    min-height: 200px;
                    position: relative;
                    padding: 2rem;
                }
                @media (max-width: 768px) {
                    .profile-header-gradient {
                        padding: 1.5rem 1rem !important;
                        min-height: auto;
                    }
                    .profile-image-responsive {
                        width: 120px !important;
                        height: 120px !important;
                    }
                    .profile-header-name {
                        font-size: 1.5rem !important;
                        margin-right: 0.5rem !important;
                    }
                    .profile-header-badge {
                        font-size: 0.7rem !important;
                        padding: 0.4rem 0.8rem !important;
                        letter-spacing: 0.5px !important;
                    }
                    .camera-icon-button {
                        bottom: 8px !important;
                        right: 8px !important;
                        width: 44px !important;
                        height: 44px !important;
                    }
                }
                @media (max-width: 576px) {
                    .profile-header-name {
                        font-size: 1.25rem !important;
                    }
                    .profile-image-responsive {
                        width: 100px !important;
                        height: 100px !important;
                    }
                    .camera-icon-button {
                        bottom: 8px !important;
                        right: 8px !important;
                        width: 40px !important;
                        height: 40px !important;
                    }
                    .camera-icon-button i {
                        font-size: 16px !important;
                    }
                }
                .tab-text {
                    display: inline;
                }
                .tab-icon {
                    margin-right: 0.5rem;
                }
                @media (max-width: 768px) {
                    .tab-text {
                        display: none;
                    }
                    .tab-icon {
                        margin-right: 0;
                    }
                    .nav-tabs .nav-link {
                        padding: 1rem !important;
                        min-width: 50px;
                        text-align: center;
                    }
                }
                .nav-tabs .nav-link {
                    color: #6c757d;
                    border: none;
                    position: relative;
                }
                .nav-tabs .nav-link.active {
                    color: #667eea;
                    background: transparent;
                    border-bottom: 3px solid #667eea;
                    font-weight: 600;
                }
                .nav-tabs .nav-link:hover {
                    color: #667eea;
                    background: rgba(102, 126, 234, 0.05);
                }
                .dropdown-menu {
                    z-index: 9999 !important;
                    position: absolute !important;
                }
                .dropdown {
                    position: relative;
                    z-index: 1000;
                }
                .profile-image-wrapper {
                    position: relative;
                    z-index: 1;
                }
                .dropdown-toggle::after {
                    display: none !important;
                }
                .dropdown-toggle {
                    border: none !important;
                }
                @media (max-width: 768px) {
                    .profile-dropdown-menu {
                        left: 50% !important;
                        right: auto !important;
                        transform: translateX(-50%) !important;
                        margin-top: 8px !important;
                        min-width: 220px !important;
                        max-width: 250px !important;
                    }
                }
                @media (max-width: 576px) {
                    .profile-dropdown-menu {
                        left: 50% !important;
                        right: auto !important;
                        transform: translateX(-50%) !important;
                        min-width: 200px !important;
                        max-width: 220px !important;
                    }
                }
            `}</style>

            <Card style={profileStyles.headerCard} className="mb-4 border-0">
                <div className="profile-header-gradient" style={{ padding: '3rem 2.5rem 2rem', position: 'relative' }}>
                    <Row className="align-items-center">
                        <Col xs={12} md={12} lg={6}>
                            <div className="d-flex align-items-center flex-column flex-md-row">
                                <div className="profile-image-wrapper mb-3 mb-md-0 mr-md-4" style={{ position: 'relative', flexShrink: 0 }}>
                                    <Dropdown className="d-inline-block">
                                        <Dropdown.Toggle 
                                            as="a" 
                                            variant="link" 
                                            style={{ 
                                                padding: 0, 
                                                textDecoration: 'none',
                                                position: 'relative',
                                                display: 'block'
                                            }}
                                        >
                                            <img 
                                                src={profilePicPath || avatar} 
                                                alt="Profile" 
                                                onError={(e) => {
                                                    e.target.src = avatar;
                                                }}
                                                className="profile-image-responsive"
                                                style={{
                                                    marginTop: '35px',
                                                    width: '160px',
                                                    height: '160px',
                                                    borderRadius: '50%',
                                                    border: '6px solid rgba(255, 255, 255, 0.3)',
                                                    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
                                                    objectFit: 'cover',
                                                    transition: 'transform 0.3s ease',
                                                    display: 'block'
                                                }}
                                            />
                                            <div 
                                                className="camera-icon-button"
                                                style={{
                                                    position: 'absolute',
                                                    bottom: '8px',
                                                    right: '8px',
                                                    width: '44px',
                                                    height: '44px',
                                                    borderRadius: '50%',
                                                    background: 'white',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.3s ease',
                                                    border: '2px solid #667eea'
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.transform = 'scale(1.1)';
                                                    e.currentTarget.style.background = '#667eea';
                                                    const icon = e.currentTarget.querySelector('i');
                                                    if (icon) icon.style.color = 'white';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.transform = 'scale(1)';
                                                    e.currentTarget.style.background = 'white';
                                                    const icon = e.currentTarget.querySelector('i');
                                                    if (icon) icon.style.color = '#667eea';
                                                }}
                                            >
                                                <i className="feather icon-camera" style={{ fontSize: '18px', color: '#667eea', transition: 'color 0.3s ease' }} />
                                            </div>
                                        </Dropdown.Toggle>
                                        <Dropdown.Menu 
                                            className="profile-dropdown-menu"
                                            style={{ 
                                                borderRadius: '12px', 
                                                border: 'none', 
                                                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)', 
                                                padding: '0.5rem',
                                                zIndex: 9999,
                                                position: 'absolute',
                                                left: '50%',
                                                transform: 'translateX(-50%)',
                                                right: 'auto',
                                                minWidth: '250px',
                                                width: 'auto'
                                            }}
                                        >
                                            <Dropdown.Item onClick={handleUploadClick} style={{ padding: '0.75rem 1.25rem', borderRadius: '8px', marginBottom: '0.25rem' }}>
                                                <i className="feather icon-upload-cloud mr-2" />
                                                Upload New Photo
                                            </Dropdown.Item>
                                            <Dropdown.Item 
                                                onClick={handleRemoveProfilePictureClick}
                                                disabled={!user?.profilePicture}
                                                style={{ 
                                                    padding: '0.75rem 1.25rem',
                                                    borderRadius: '8px',
                                                    opacity: user?.profilePicture ? 1 : 0.5
                                                }}
                                            >
                                                <i className="feather icon-trash-2 mr-2" />
                                                Remove Photo
                                            </Dropdown.Item>
                                        </Dropdown.Menu>
                                    </Dropdown>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        style={{ display: 'none' }}
                                        accept="image/*"
                                        onChange={handleFileChange}
                                    />
                                </div>
                                <div className="text-center text-md-left w-100 w-md-auto">
                                    <h2 className="text-white mb-2 profile-header-name" style={{ 
                                        fontWeight: '700', 
                                        fontSize: '2rem',
                                        lineHeight: '1.2',
                                        textShadow: '0 2px 10px rgba(0, 0, 0, 0.2)'
                                    }}>
                                        {fullName || 'User Name'}
                                    </h2>
                                    <div className="d-flex align-items-center justify-content-center justify-content-md-start flex-wrap gap-2 mb-2">
                                        <span 
                                            className={`status-badge ${user?.isVerify ? 'status-verified' : 'status-unverified'} profile-header-badge`}
                                            style={{
                                                background: user?.isVerify 
                                                    ? 'rgba(72, 187, 120, 0.9)' 
                                                    : 'rgba(245, 101, 101, 0.9)',
                                                color: 'white',
                                                padding: '0.5rem 1.25rem',
                                                fontSize: '0.875rem',
                                                fontWeight: '700',
                                                textTransform: 'uppercase',
                                                letterSpacing: '1.5px',
                                                borderRadius: '20px',
                                                border: '1px solid rgba(255, 255, 255, 0.3)',
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '0.5rem',
                                                backdropFilter: 'blur(10px)',
                                                flexShrink: 0
                                            }}
                                        >
                                            <i className={`feather ${user?.isVerify ? 'icon-check-circle' : 'icon-alert-circle'}`} />
                                            <span className="d-none d-sm-inline">{user?.isVerify ? 'Verified' : 'Not Verified'}</span>
                                        </span>
                                    </div>
                                    <div className="d-flex align-items-center justify-content-center justify-content-md-start">
                                        <Badge 
                                            className="profile-header-badge"
                                            style={{ 
                                                background: 'rgba(255, 255, 255, 0.25)', 
                                                backdropFilter: 'blur(10px)',
                                                color: 'white',
                                                padding: '0.5rem 1.25rem',
                                                fontSize: '0.875rem',
                                                fontWeight: '700',
                                                textTransform: 'uppercase',
                                                letterSpacing: '1.5px',
                                                borderRadius: '20px',
                                                border: '1px solid rgba(255, 255, 255, 0.3)',
                                                display: 'inline-block'
                                            }}
                                        >
                                            {user?.role || 'User'}
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                        </Col>
                    </Row>
                </div>
            </Card>
        </>
    );
};

export default ProfileHeader;

