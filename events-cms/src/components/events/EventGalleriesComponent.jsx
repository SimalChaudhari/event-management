import React from 'react';
import { Badge } from 'react-bootstrap';
import StandardComponentTemplate from '../StandardComponentTemplate';

/**
 * EventGalleriesComponent - Component to display event galleries
 * @param {Array} galleries - Array of gallery objects
 * @param {Function} getImageSrc - Function to get image source URL
 * @param {Function} handleGalleryImageClick - Function to handle gallery image click
 * @param {Function} [getSingleImageDownloadUrl] - (imagePath) => single image download URL
 * @param {Function} [getDownloadAllUrl] - (galleryId) => all images ZIP download URL
 */
const EventGalleriesComponent = ({
    galleries,
    getImageSrc,
    handleGalleryImageClick,
    getSingleImageDownloadUrl,
    getDownloadAllUrl
}) => {
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
    const renderGalleryImage = (image, index, galleryIndex, galleryTitle, galleryId) => {
        const imageSrc = getImageSrc(image);
        const singleDownloadUrl = typeof getSingleImageDownloadUrl === 'function' ? getSingleImageDownloadUrl(image) : null;

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

                {/* Icons: Download (if URL provided) + Zoom */}
                <div style={{ position: 'absolute', top: '5px', right: '5px', display: 'flex', gap: '4px' }}>
                    {singleDownloadUrl && (
                        <a
                            href={singleDownloadUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            download
                            style={{
                                backgroundColor: 'rgba(0,0,0,0.7)',
                                color: 'white',
                                padding: '4px 8px',
                                borderRadius: '50%',
                                fontSize: '10px',
                                textDecoration: 'none',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <i className="fas fa-download"></i>
                        </a>
                    )}
                    <div
                        style={{
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
            </div>
        );
    };

    // Render individual gallery
    const renderGallery = (gallery, galleryIndex) => {
        const imageCount = gallery.galleryImages?.length || 0;
        const trackTitle = gallery.trackTitle || gallery.title;
        const downloadAllUrl = typeof getDownloadAllUrl === 'function' && gallery.id ? getDownloadAllUrl(gallery.id) : null;

        return (
            <div key={gallery.id || galleryIndex} className="mb-4">
                {/* Gallery Header */}
                <div className="d-flex flex-wrap align-items-center justify-content-between gap-2">
                    <h5 className="mb-0">
                        {trackTitle} <Badge bg="info">{imageCount}</Badge>
                    </h5>
                    {downloadAllUrl && imageCount > 0 && (
                        <a
                            href={downloadAllUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-sm btn-outline-primary"
                            style={{ textDecoration: 'none' }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <i className="fas fa-download me-1"></i>
                            Download all
                        </a>
                    )}
                </div>
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
                        renderGalleryImage(image, index, galleryIndex, trackTitle, gallery.id)
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