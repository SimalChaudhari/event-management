import React from 'react';
import StandardComponentTemplate from '../StandardComponentTemplate';
import { ExpandableDescription } from '../ExpandableDescription';

/**
 * EventStampsComponent - Component to display event stamps
 * @param {Object} eventStamps - Event stamps data object
 * @param {Function} getImageSrc - Function to get image source URL
 * @param {Function} handleStampImageClick - Function to handle stamp image click
 */
const EventStampsComponent = ({ eventStamps, getImageSrc, handleStampImageClick }) => {
    // Check if event stamps are available
    if (!eventStamps) {
        return (
            <StandardComponentTemplate 
                title="Event Stamps" 
                // icon="🏷️"
                borderColor="red"
            >
                <div className="text-center py-4">
                    <i className="fas fa-store fa-2x text-muted mb-2"></i>
                    <p className="text-muted">No event stamps.</p>
                </div>
            </StandardComponentTemplate>
        );
    }

    // Render individual stamp image
    const renderStampImage = (image, index) => {
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
                onClick={() => handleStampImageClick(index)}
            >
                {/* Stamp Image */}
                <img
                    src={imageSrc}
                    alt={`Event Stamp ${index + 1}`}
                    style={{
                        width: '100%',
                        height: '150px',
                        objectFit: 'cover'
                    }}
                    onError={(e) => {
                        console.error('Stamp image failed to load:', imageSrc);
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

    // Render stamp images section
    const renderStampImages = () => {
        if (!eventStamps.images?.length) {
            return (
                <div className="text-center py-4">
                    <i className="fas fa-store fa-2x text-muted mb-2"></i>
                    <p className="text-muted">No Stamp Images available.</p>
                </div>
            );
        }

        return (
            <div>
                <h6>Stamp Images</h6>
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                        gap: '10px',
                        marginTop: '10px'
                    }}
                >
                    {eventStamps.images.map((image, index) => renderStampImage(image, index))}
                </div>
            </div>
        );
    };

    // Render stamp description
    const renderStampDescription = () => {
        if (!eventStamps.description) {
            return null;
        }

        return (
            <div className="mb-3 mt-3">
                <h6>Description</h6>
                <p style={{ textAlign: 'justify', lineHeight: '1.6' }}>

                    <ExpandableDescription 
                        text={eventStamps.description}
                        maxLines={2}
                    />
                </p>
            </div>
        );
    };

    return (
        <StandardComponentTemplate 
            title="Event Stamps" 
            // icon="🏷️"
            borderColor="red"
        >
            {/* Stamp Images */}
            {renderStampImages()}

            {/* Stamp Description */}
            {renderStampDescription()}
        </StandardComponentTemplate>
    );
};

export default EventStampsComponent;
