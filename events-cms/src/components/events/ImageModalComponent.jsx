import React from 'react';
import { Modal, Button } from 'react-bootstrap';

/**
 * ImageModalComponent - Reusable component for displaying images in modal
 * @param {boolean} show - Modal visibility state
 * @param {Function} onHide - Function to close modal
 * @param {string} imageSrc - Image source URL
 * @param {string} imageAlt - Image alt text
 * @param {string} downloadFileName - File name for download
 * @param {number} currentIndex - Current image index
 * @param {number} totalImages - Total number of images
 * @param {Function} onPrevious - Function to go to previous image
 * @param {Function} onNext - Function to go to next image
 * @param {string} title - Optional title to display
 */
const ImageModalComponent = ({
    show,
    onHide,
    imageSrc,
    imageAlt,
    downloadFileName,
    currentIndex,
    totalImages,
    onPrevious,
    onNext,
    title
}) => {
    // Handle image download
    const handleDownload = () => {
        const link = document.createElement('a');
        link.href = imageSrc;
        link.download = downloadFileName;
        link.click();
    };

    // Render close button
    const renderCloseButton = () => (
        <Button
            variant="light"
            size="sm"
            onClick={onHide}
            style={{
                position: 'fixed',
                top: '20px',
                right: '20px',
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
    );

    // Render download button
    const renderDownloadButton = () => (
        <Button
            variant="light"
            size="sm"
            onClick={handleDownload}
            style={{
                position: 'fixed',
                top: '20px',
                left: '20px',
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
    );

    // Render title if provided
    const renderTitle = () => {
        if (!title) return null;
        
        return (
            <div
                style={{
                    position: 'fixed',
                    top: '20px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    backgroundColor: 'rgba(0,0,0,0.7)',
                    color: 'white',
                    padding: '8px 16px',
                    borderRadius: '20px',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    zIndex: 1000
                }}
            >
                {title}
            </div>
        );
    };

    // Render navigation arrows
    const renderNavigationArrows = () => {
        if (totalImages <= 1) return null;

        return (
            <>
                <Button
                    variant="light"
                    size="lg"
                    onClick={onPrevious}
                    style={{
                        position: 'fixed',
                        left: '20px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        borderRadius: '50%',
                        width: '50px',
                        height: '50px',
                        zIndex: 1000,
                        backgroundColor: 'rgba(0,0,0,0.7)',
                        border: 'none',
                        color: 'white'
                    }}
                >
                    <i className="fas fa-chevron-left"></i>
                </Button>

                <Button
                    variant="light"
                    size="lg"
                    onClick={onNext}
                    style={{
                        position: 'fixed',
                        right: '20px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        borderRadius: '50%',
                        width: '50px',
                        height: '50px',
                        zIndex: 1000,
                        backgroundColor: 'rgba(0,0,0,0.7)',
                        border: 'none',
                        color: 'white'
                    }}
                >
                    <i className="fas fa-chevron-right"></i>
                </Button>
            </>
        );
    };

    // Render image counter
    const renderImageCounter = () => {
        if (totalImages <= 1) return null;

        return (
            <div
                style={{
                    position: 'fixed',
                    bottom: '20px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    backgroundColor: 'rgba(0,0,0,0.7)',
                    color: 'white',
                    padding: '8px 16px',
                    borderRadius: '20px',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    zIndex: 1000
                }}
            >
                {currentIndex + 1} / {totalImages}
            </div>
        );
    };

    // Render image container
    const renderImageContainer = () => (
        <div
            style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '90vh',
                padding: '60px 80px 80px 80px'
            }}
        >
            <img
                src={imageSrc}
                alt={imageAlt}
                style={{
                    maxWidth: '100%',
                    maxHeight: '100%',
                    objectFit: 'contain',
                    borderRadius: '8px'
                }}
                onError={(e) => {
                    console.error('Modal image failed to load:', imageSrc);
                    e.target.style.display = 'none';
                }}
            />
        </div>
    );

    return (
        <Modal
            show={show}
            onHide={onHide}
            size="xl"
            centered
            style={{ backgroundColor: 'rgba(0,0,0,0.95)' }}
        >
            <Modal.Body>
                {renderCloseButton()}
                {renderDownloadButton()}
                {renderTitle()}
                {renderNavigationArrows()}
                {renderImageCounter()}
                {renderImageContainer()}
            </Modal.Body>
        </Modal>
    );
};

export default ImageModalComponent;