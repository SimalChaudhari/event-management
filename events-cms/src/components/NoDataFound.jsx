import React from 'react';
import { Container, Card, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

const NoDataFound = ({ 
    title = "No Data Found", 
    message = "The requested data could not be found or doesn't exist.",
    icon = "fas fa-search",
    showBackButton = true,
    backButtonText = "Go Back",
    backButtonPath = null,
    variant = "warning", // warning, info, danger, secondary
    size = "medium", // small, medium, large
    customIcon = null,
    customActions = null
}) => {
    const navigate = useNavigate();

    const getVariantStyles = () => {
        switch (variant) {
            case 'warning':
                return {
                    bgColor: '#fff3cd',
                    borderColor: '#ffeaa7',
                    textColor: '#856404',
                    iconColor: '#f39c12'
                };
            case 'info':
                return {
                    bgColor: '#d1ecf1',
                    borderColor: '#bee5eb',
                    textColor: '#0c5460',
                    iconColor: '#17a2b8'
                };
            case 'danger':
                return {
                    bgColor: '#f8d7da',
                    borderColor: '#f5c6cb',
                    textColor: '#721c24',
                    iconColor: '#e74c3c'
                };
            case 'secondary':
                return {
                    bgColor: '#e2e3e5',
                    borderColor: '#d6d8db',
                    textColor: '#383d41',
                    iconColor: '#6c757d'
                };
            default:
                return {
                    bgColor: '#fff3cd',
                    borderColor: '#ffeaa7',
                    textColor: '#856404',
                    iconColor: '#f39c12'
                };
        }
    };

    const getSizeStyles = () => {
        switch (size) {
            case 'small':
                return {
                    padding: '2rem',
                    iconSize: '3rem',
                    titleSize: '1.25rem',
                    messageSize: '0.9rem'
                };
            case 'large':
                return {
                    padding: '4rem',
                    iconSize: '5rem',
                    titleSize: '2rem',
                    messageSize: '1.1rem'
                };
            default: // medium
                return {
                    padding: '3rem',
                    iconSize: '4rem',
                    titleSize: '1.5rem',
                    messageSize: '1rem'
                };
        }
    };

    const styles = getVariantStyles();
    const sizeStyles = getSizeStyles();

    const handleBackClick = () => {
        if (backButtonPath) {
            navigate(backButtonPath);
        } else {
            navigate(-1);
        }
    };


    return (
        <Container fluid className="d-flex align-items-center justify-content-center" style={{ minHeight: '60vh' }}>
            <Card 
                style={{
                    border: 'none',
                    borderRadius: '15px',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                    backgroundColor: styles.bgColor,
                    borderColor: styles.borderColor,
                    maxWidth: '500px',
                    width: '100%'
                }}
            >
                <Card.Body 
                    className="text-center"
                    style={{ padding: sizeStyles.padding }}
                >
                    {/* Icon */}
                    <div className="mb-4">
                        {customIcon ? (
                            customIcon
                        ) : (
                            <i 
                                className={icon}
                                style={{
                                    fontSize: sizeStyles.iconSize,
                                    color: styles.iconColor,
                                    marginBottom: '1rem'
                                }}
                            ></i>
                        )}
                    </div>

                    {/* Title */}
                    <h3 
                        className="mb-3"
                        style={{
                            fontSize: sizeStyles.titleSize,
                            fontWeight: '600',
                            color: styles.textColor
                        }}
                    >
                        {title}
                    </h3>

                    {/* Message */}
                    <p 
                        className="mb-4"
                        style={{
                            fontSize: sizeStyles.messageSize,
                            color: styles.textColor,
                            opacity: '0.8',
                            lineHeight: '1.6'
                        }}
                    >
                        {message}
                    </p>

                    {/* Custom Actions */}
                    {customActions && (
                        <div className="mb-3">
                            {customActions}
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="d-flex flex-column flex-sm-row gap-2 justify-content-center">
                        {showBackButton && (
                            <Button
                                variant="outline-secondary"
                                onClick={handleBackClick}
                                style={{
                                    borderRadius: '8px',
                                    padding: '0.5rem 1.5rem',
                                    fontWeight: '500'
                                }}
                            >
                                <i className="fas fa-arrow-left me-2" style={{ marginRight: '10px' }}></i>
                                {backButtonText}
                            </Button>
                        )}

                    </div>
                </Card.Body>
            </Card>
        </Container>
    );
};

export default NoDataFound; 