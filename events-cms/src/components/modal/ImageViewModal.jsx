import React, { useEffect } from 'react';
import { Modal, Button } from 'react-bootstrap';

/**
 * ImageViewModal - Reusable component for displaying a single image in a full-screen modal
 * Similar to the image modal used in ViewUserPage
 * 
 * @param {boolean} show - Modal visibility state
 * @param {Function} onHide - Function to close modal
 * @param {string} imageSrc - Image source URL
 * @param {string} imageAlt - Image alt text (default: "Image")
 * @param {string} downloadFileName - Optional file name for download (default: auto-generated)
 * @param {boolean} showDownload - Whether to show download button (default: true)
 */
const ImageViewModal = ({
    show,
    onHide,
    imageSrc,
    imageAlt = "Image",
    downloadFileName,
    showDownload = true
}) => {
    // Handle image download
    const handleDownload = () => {
        if (!imageSrc) return;
        
        const link = document.createElement('a');
        link.href = imageSrc;
        link.download = downloadFileName || `image-${Date.now()}.jpg`;
        link.click();
    };

    // Add CSS to ensure modal dialog fits viewport
    useEffect(() => {
        const style = document.createElement('style');
        style.textContent = `
            .image-modal-dialog {
                max-width: 100vw !important;
                max-height: 100vh !important;
                margin: auto !important;
            }
            .image-modal-dialog .modal-content {
                max-height: 100vh !important;
                overflow: hidden !important;
            }
        `;
        document.head.appendChild(style);
        
        return () => {
            document.head.removeChild(style);
        };
    }, []);

    if (!imageSrc) return null;

    return (
        <Modal
            show={show}
            onHide={onHide}
            size="xl"
            centered
            style={{ backgroundColor: 'rgba(0,0,0,0.95)' }}
            dialogClassName="image-modal-dialog"
        >
            <Modal.Body
                style={{
                    padding: 0,
                    backgroundColor: 'transparent',
                    position: 'relative',
                    height: '100%',
                    overflow: 'hidden',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center'
                }}
            >
                {/* Close Button */}
                <Button
                    variant="light"
                    size="sm"
                    onClick={onHide}
                    style={{
                        position: 'absolute',
                        top: '15px',
                        right: '15px',
                        borderRadius: '50%',
                        width: '40px',
                        height: '40px',
                        zIndex: 1000,
                        backgroundColor: 'rgba(0,0,0,0.7)',
                        border: 'none',
                        color: 'white'
                    }}
                >
                    <i className="fas fa-times"></i>
                </Button>

                {/* Download Button */}
                {showDownload && (
                    <Button
                        variant="light"
                        size="sm"
                        onClick={handleDownload}
                        style={{
                            position: 'absolute',
                            top: '15px',
                            left: '15px',
                            borderRadius: '50%',
                            width: '40px',
                            height: '40px',
                            zIndex: 1000,
                            backgroundColor: 'rgba(0,0,0,0.7)',
                            border: 'none',
                            color: 'white'
                        }}
                    >
                        <i className="fas fa-download"></i>
                    </Button>
                )}

                {/* Image Container */}
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        width: '100%',
                        height: '100%',
                        padding: '20px 20px 20px 20px',
                        boxSizing: 'border-box'
                    }}
                >
                    <img
                        src={imageSrc}
                        alt={imageAlt}
                        style={{
                            maxWidth: '100%',
                            maxHeight: '100%',
                            width: 'auto',
                            height: 'auto',
                            objectFit: 'contain',
                            borderRadius: '8px'
                        }}
                        onError={(e) => {
                            console.error('Modal image failed to load:', imageSrc);
                            e.target.style.display = 'none';
                        }}
                    />
                </div>
            </Modal.Body>
        </Modal>
    );
};

export default ImageViewModal;
