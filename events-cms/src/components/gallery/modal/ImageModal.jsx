import React from 'react';
import { Modal, Button } from 'react-bootstrap';
import { FaTimes, FaDownload, FaChevronLeft, FaChevronRight } from 'react-icons/fa';

const ImageModal = ({
    show,
    onHide,
    selectedImage,
    currentImageIndex,
    totalImages,
    onPrevious,
    onNext,
    apiUrl
}) => {
    const handleDownload = () => {
        if (selectedImage) {
            const link = document.createElement('a');
            link.href = `${apiUrl}/${selectedImage.path}`;
            link.download = `gallery-image.jpg`;
            link.click();
        }
    };

    return (
        <Modal show={show} onHide={onHide} size="xl" centered style={{ backgroundColor: 'rgba(0,0,0,0.95)' }}>
            <Modal.Body
                style={{
                    padding: 0,
                    backgroundColor: 'transparent',
                    position: 'relative',
                    minHeight: '90vh'
                }}
            >
                {/* Close Button */}
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
                    <FaTimes />
                </Button>

                {/* Download Button */}
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
                    <FaDownload />
                </Button>

                {/* Navigation Buttons */}
                <Button
                    variant="light"
                    size="sm"
                    onClick={onPrevious}
                    disabled={totalImages <= 1}
                    style={{
                        position: 'fixed',
                        top: '50%',
                        left: '20px',
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
                    <FaChevronLeft />
                </Button>

                <Button
                    variant="light"
                    size="sm"
                    onClick={onNext}
                    disabled={totalImages <= 1}
                    style={{
                        position: 'fixed',
                        top: '50%',
                        right: '20px',
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
                    <FaChevronRight />
                </Button>

                {/* Image Counter */}
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
                    {currentImageIndex + 1} / {totalImages}
                </div>

                {/* Image Container */}
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        minHeight: '90vh',
                        padding: '60px 80px 80px 80px'
                    }}
                >
                    {selectedImage && (
                        <img
                            src={`${apiUrl}/${selectedImage.path}`}
                            alt={`${selectedImage.eventName} - Image`}
                            style={{
                                maxWidth: '100%',
                                maxHeight: '100%',
                                objectFit: 'contain',
                                borderRadius: '8px',
                                background: 'white',
                                padding: '20px',
                                boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                                border: '1px solid rgba(255,255,255,0.1)'
                            }}
                            onError={(e) => {
                                console.error('Gallery image failed to load:', selectedImage.path);
                                e.target.style.display = 'none';
                            }}
                        />
                    )}
                </div>
            </Modal.Body>
        </Modal>
    );
};

export default ImageModal;