import React, { useState, useEffect } from 'react';
import { DUMMY_PATH_GALLERY } from '../../configs/env';

/**
 * Reusable Image Component with Fallback to Default Image
 * 
 * This component automatically handles image loading errors and displays
 * a default placeholder image when:
 * - The image fails to load (404, network error, etc.)
 * - The image path is invalid
 * 
 * @param {string} src - The image source URL/path
 * @param {string} alt - Alt text for the image (default: 'Image')
 * @param {function} onClick - Optional click handler
 * @param {object} style - Custom styles for the image
 * @param {string} defaultImage - Custom default image URL (default: DUMMY_PATH_GALLERY)
 * @param {boolean} enableHover - Enable hover effects (default: true if onClick is provided)
 * @param {boolean} showMessage - Show "Image not available" message when fallback is used (default: true)
 * @param {string} errorMessage - Custom error message (default: 'Image not available')
 * 
 * @example
 * <ImageWithFallback
 *   src={`${API_URL}/${imagePath}`}
 *   alt="Gallery Image"
 *   onClick={() => handleClick()}
 *   style={{ width: '100%', height: '200px' }}
 * />
 */
const ImageWithFallback = ({ 
    src, 
    alt = 'Image', 
    onClick, 
    style = {},
    defaultImage = DUMMY_PATH_GALLERY,
    enableHover = true,
    showMessage = true,
    errorMessage = 'Image not available'
}) => {
    const [imageSrc, setImageSrc] = useState(src);
    const [hasError, setHasError] = useState(false);

    useEffect(() => {
        setImageSrc(src);
        setHasError(false);
    }, [src]);

    const handleError = () => {
        if (!hasError) {
            setHasError(true);
            setImageSrc(defaultImage);
        }
    };

    const handleMouseEnter = (e) => {
        if (onClick && enableHover) {
            e.target.style.transform = 'scale(1.05)';
            e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.25)';
        }
    };

    const handleMouseLeave = (e) => {
        if (onClick && enableHover) {
            e.target.style.transform = 'scale(1)';
            // Restore original boxShadow from style prop if exists, otherwise use default
            const originalBoxShadow = style.boxShadow || '0 2px 8px rgba(0,0,0,0.15)';
            e.target.style.boxShadow = originalBoxShadow;
        }
    };

    return (
        <div style={{ position: 'relative', display: 'inline-block', width: '100%' }}>
            <img
                src={imageSrc}
                alt={alt}
                onError={handleError}
                onClick={onClick}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                style={{
                    ...style,
                    cursor: onClick ? 'pointer' : 'default',
                    transition: onClick && enableHover ? 'transform 0.2s, box-shadow 0.2s' : 'none',
                    display: 'block',
                    width: '100%'
                }}
            />
            {hasError && showMessage && (
                <div
                    style={{
                        position: 'absolute',
                        bottom: '10px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        backgroundColor: 'rgba(0, 0, 0, 0.75)',
                        color: 'white',
                        padding: '8px 16px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '500',
                        whiteSpace: 'nowrap',
                        pointerEvents: 'none',
                        zIndex: 10,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                    }}
                >
                    <i className="fas fa-exclamation-triangle" style={{ fontSize: '12px' }}></i>
                    <span>{errorMessage}</span>
                </div>
            )}
        </div>
    );
};

export default ImageWithFallback;

