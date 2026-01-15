import React from 'react';
import StandardComponentTemplate from '../StandardComponentTemplate';
import { ExpandableDescription } from '../ExpandableDescription';

/**
 * EventStampsComponent - Component to display event stamps
 * @param {Object|Array} eventStamps - Object with { description, stamps: [...] } or Array of stamp objects
 * @param {Function} getImageSrc - Function to get image source URL
 * @param {Function} handleStampImageClick - Function to handle stamp image click
 */
const EventStampsComponent = ({ eventStamps, getImageSrc, handleStampImageClick }) => {
    // Handle both new structure { description, stamps: [...] } and old structure (array)
    let stamps = [];
    let description = '';
    
    if (eventStamps) {
        if (Array.isArray(eventStamps)) {
            // Old structure: array of stamps
            stamps = eventStamps;
        } else if (eventStamps.stamps && Array.isArray(eventStamps.stamps)) {
            // New structure: object with description and stamps
            stamps = eventStamps.stamps;
            description = eventStamps.description || '';
        }
    }

    // Check if event stamps are available
    if (!stamps || stamps.length === 0) {
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

    // Render individual stamp
    const renderStamp = (stamp, index) => {
      
        // Handle image path - API returns: "uploads/eventStamps/xxx.png"
        const imageSrc = stamp.image ? getImageSrc(stamp.image) : null;
        
        // Get booth number from stamp (boothNumber field or name field as fallback)
        const boothNumber = stamp.boothNumber || stamp.name || `Booth ${index + 1}`;
        
        // Debug logging
        if (stamp.image && !imageSrc) {
          
        }

        return (
            <div
                key={stamp.id || index}
                style={{
                    position: 'relative',
                    cursor: 'pointer',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    border: '2px solid #ddd',
                    transition: 'transform 0.2s ease, border-color 0.2s ease',
                    backgroundColor: '#f8f9fa'
                }}
                onClick={() => handleStampImageClick(index)}
            >
                {/* Stamp Image */}
                {imageSrc ? (
                    <>
                        <img
                            src={imageSrc}
                            alt={boothNumber || `Event Stamp ${index + 1}`}
                            style={{
                                width: '100%',
                                height: '150px',
                                objectFit: 'cover'
                            }}
                            onError={(e) => {
                                // Show placeholder instead of hiding
                                e.target.style.display = 'none';
                                const placeholder = e.target.parentElement.querySelector('.image-placeholder');
                                if (placeholder) {
                                    placeholder.style.display = 'flex';
                                }
                            }}
                        />
                        <div style={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            padding: '8px',
                            backgroundColor: 'rgba(0, 0, 0, 0.7)',
                            color: 'white',
                            textAlign: 'center'
                        }}>
                            <div style={{ fontSize: '12px', fontWeight: '600' }}>
                                Booth: {boothNumber}
                            </div>
                        </div>
                    </>
                ) : (
                    <div style={{
                        width: '100%',
                        height: '150px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: '#e9ecef',
                        padding: '10px'
                    }}>
                        <i className="fas fa-image fa-2x text-muted mb-2"></i>
                        <div style={{ fontSize: '12px', fontWeight: '600', textAlign: 'center', color: '#6c757d' }}>
                            Booth: {boothNumber}
                        </div>
                    </div>
                )}

                {/* Zoom Icon */}
                {imageSrc && (
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
                )}
            </div>
        );
    };

    // Render stamps section
    const renderStamps = () => {
        return (
            <div>
                <h6>Event Stamps</h6>
                {description && description.trim().length > 0 ? (
                    <div style={{ marginBottom: '15px' }}>
                        <ExpandableDescription 
                            text={description}
                            maxLines={3}
                        />
                    </div>
                ) : null}
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                        gap: '10px',
                        marginTop: '10px'
                    }}
                >
                    {stamps.map((stamp, index) => renderStamp(stamp, index))}
                </div>
            </div>
        );
    };

    return (
        <StandardComponentTemplate 
            title="Event Stamps" 
            // icon="🏷️"
            borderColor="red"
        >
            {/* Stamps */}
            {renderStamps()}
        </StandardComponentTemplate>
    );
};

export default EventStampsComponent;
