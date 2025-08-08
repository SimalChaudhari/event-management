import React from 'react';

/**
 * StandardComponentTemplate - Reusable template for all content components
 * @param {Object} props
 * @param {string} props.title - Section title
 * @param {string} props.icon - Icon emoji
 * @param {React.ReactNode} props.children - Content to render
 * @param {string} props.borderColor - Border color (blue, green, orange, purple, red)
 * @param {boolean} props.showCard - Whether to show card wrapper
 */
const StandardComponentTemplate = ({ 
    title, 
    icon, 
    children, 
    borderColor = 'blue',
    showCard = true 
}) => {
    const getBorderColor = (color) => {
        const colors = {
            blue: '#3498db',
            green: '#27ae60', 
            orange: '#f39c12',
            purple: '#9b59b6',
            red: '#e74c3c'
        };
        return colors[color] || colors.blue;
    };

    const getBackgroundColor = (color) => {
        const colors = {
            blue: '#ebf3fd',
            green: '#e8f5e8',
            orange: '#fef9e7',
            purple: '#f4f1f8',
            red: '#fdedec'
        };
        return colors[color] || colors.blue;
    };

    return (
        <div className="p-2 bg-light">
            <div className="mb-4">
                <h5 className="fw-bold text-dark mb-3 section-title">
                    {icon} {title}
                </h5>
                
                {showCard ? (
                    <div 
                        className="content-container"
                        style={{
                            borderLeftColor: getBorderColor(borderColor),
                            backgroundColor: getBackgroundColor(borderColor)
                        }}
                    >
                        {children}
                    </div>
                ) : (
                    <div className="content-wrapper">
                        {children}
                    </div>
                )}
            </div>

            <style jsx>{`
                .section-title {
                    color: #2c3e50 !important;
                    border-bottom: 2px solid #3498db;
                    padding-bottom: 8px;
                    position: relative;
                }

                .section-title::after {
                    content: '';
                    position: absolute;
                    bottom: -2px;
                    left: 0;
                    width: 50px;
                    height: 2px;
                    background: #e74c3c;
                }

                .content-container {
                    background: white;
                    border-radius: 8px;
                    padding: 20px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                    border-left: 4px solid;
                }

                .content-wrapper {
                    padding: 10px;
                }

                /* Mobile Responsive Styles */
                @media (max-width: 768px) {
                    .section-title {
                        font-size: 1.2rem !important;
                        color: #2c3e50 !important;
                        border-bottom: 2px solid #3498db;
                        margin-bottom: 15px;
                    }
                    
                    .content-container {
                        background: #ffffff !important;
                        box-shadow: 0 1px 3px rgba(0,0,0,0.1) !important;
                        padding: 15px !important;
                        border-radius: 6px !important;
                        margin-bottom: 10px;
                        border: 1px solid #e9ecef;
                    }
                }

                @media (max-width: 576px) {
                    .section-title {
                        font-size: 1.1rem !important;
                        color: #2c3e50 !important;
                    }
                    
                    .content-container {
                        padding: 12px !important;
                        margin-bottom: 8px;
                    }
                }
            `}</style>
        </div>
    );
};

export default StandardComponentTemplate;
