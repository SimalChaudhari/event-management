import React from 'react';
import StandardComponentTemplate from '../StandardComponentTemplate';

/**
 * EventImageGridComponent - Component to display event images in a grid layout
 * @param {Array} images - Array of event images
 * @param {Function} getImageSrc - Function to get image source URL
 * @param {Function} handleEventImageClick - Function to handle image click
 */
const EventImageGridComponent = ({ images, getImageSrc, handleEventImageClick }) => {
    // Check if images are available
    if (!images || images.length === 0) {
        return (
            <StandardComponentTemplate 
                title={`Images ${images?.length || 0}`}  
                // icon="🖼️"
                borderColor="purple"
            >
                <div className="text-center py-4">
                    <i className="fas fa-images fa-2x text-muted mb-2"></i>
                    <p className="text-muted">No images available.</p>
                </div>
            </StandardComponentTemplate>
        );
    }

    // Render individual image item
    const renderImageItem = (image, index) => {
        const imageSrc = getImageSrc(image);

        return (
            <div
                key={index}
                style={{
                    position: 'relative',
                    cursor: 'pointer',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    border: '2px solid #ddd',
                    transition: 'transform 0.2s ease, border-color 0.2s ease'
                }}
                onClick={() => handleEventImageClick(index)}
            >
                {/* Image */}
                <img
                    src={imageSrc}
                    alt={`Event ${index + 1}`}
                    style={{
                        width: '100%',
                        height: '120px',
                        objectFit: 'cover'
                    }}
                    onError={(e) => {
                        console.error('Image failed to load:', imageSrc);
                        e.target.style.display = 'none';
                    }}
                />

                {/* Image Index Badge */}
                <div
                    style={{
                        position: 'absolute',
                        top: '5px',
                        left: '5px',
                        backgroundColor: 'rgba(0,0,0,0.7)',
                        color: 'white',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontSize: '10px',
                        fontWeight: 'bold'
                    }}
                >
                    {index + 1}
                </div>

                {/* Zoom Icon */}
                <div
                    style={{
                        position: 'absolute',
                        top: '5px',
                        right: '5px',
                        backgroundColor: 'rgba(0,0,0,0.7)',
                        color: 'white',
                        padding: '2px 6px',
                        borderRadius: '50%',
                        fontSize: '10px'
                    }}
                >
                    <i className="fas fa-search-plus"></i>
                </div>
            </div>
        );
    };

    return (
        <StandardComponentTemplate 
            title={`Images(${images?.length || 0})`} 
            // icon="🖼️"
            borderColor="purple"
        >
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                    gap: '10px',
                    marginTop: '10px'
                }}
            >
                {images.map(renderImageItem)} 
            </div>
        </StandardComponentTemplate>
    );
};

export default EventImageGridComponent;