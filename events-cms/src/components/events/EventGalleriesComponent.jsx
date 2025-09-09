import React from 'react';
import { Badge } from 'react-bootstrap';
import StandardComponentTemplate from '../StandardComponentTemplate';

/**
 * EventGalleriesComponent - Component to display event galleries
 * @param {Array} galleries - Array of gallery objects
 * @param {Function} getImageSrc - Function to get image source URL
 * @param {Function} handleGalleryImageClick - Function to handle gallery image click
 */
const EventGalleriesComponent = ({ galleries, getImageSrc, handleGalleryImageClick }) => {
    // Check if galleries are available
    if (!galleries?.length) {
        return (
            <StandardComponentTemplate 
                title="Event Galleries" 
                // icon="🖼️"
                borderColor="purple"
            >
                <div className="text-center py-4">    
                    <i className="fas fa-store fa-2x text-muted mb-2"></i>
                    <p className="text-muted">No Galleries available.</p>
                </div>
            </StandardComponentTemplate>
        )
    }

    // Render individual gallery image
    const renderGalleryImage = (image, index, galleryIndex, galleryTitle) => {
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
                onClick={() => handleGalleryImageClick(galleryTitle, index)}
            >
                {/* Gallery Image */}
                <img
                    src={imageSrc}
                    alt={`Gallery ${galleryIndex + 1} - Image ${index + 1}`}
                    style={{
                        width: '100%',
                        height: '150px',
                        objectFit: 'cover'
                    }}
                    onError={(e) => {
                        console.error('Gallery image failed to load:', imageSrc);
                        e.target.style.display = 'none';
                    }}
                />

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

    // Render individual gallery
    const renderGallery = (gallery, galleryIndex) => {
        const imageCount = gallery.galleryImages?.length || 0;

        return (
            <div key={gallery.id} className="mb-4">
                {/* Gallery Header */}
                <h5>
                    {gallery.title} <Badge bg="info">{imageCount}</Badge>
                </h5>
                <hr />

                {/* Gallery Images Grid */}
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                        gap: '10px',
                        marginTop: '10px'
                    }}
                >
                    {gallery.galleryImages?.map((image, index) => 
                        renderGalleryImage(image, index, galleryIndex, gallery.title)
                    )}
                </div>
            </div>
        );
    };

    return (
        <StandardComponentTemplate 
            title="Event Galleries" 
            // icon="🖼️"
            borderColor="purple"
        >
            {galleries.map((gallery, index) => renderGallery(gallery, index))}
        </StandardComponentTemplate>
    );
};

export default EventGalleriesComponent;