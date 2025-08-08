import React from 'react';
import { Button } from 'react-bootstrap';
import StandardComponentTemplate from '../StandardComponentTemplate';

/**
 * EventFloorPlanComponent - Component to display event floor plan
 * @param {Object} floorPlan - Floor plan data object
 * @param {Function} getImageSrc - Function to get image source URL
 */
const EventFloorPlanComponent = ({ floorPlan, getImageSrc }) => {
    // Check if floor plan is available
    if (!floorPlan) {
        return (
            <StandardComponentTemplate 
                title="Event Floor Plan" 
                icon="🏗️"
                borderColor="blue"
            >
                <div className="text-center py-4">
                    <i className="fas fa-store fa-2x text-muted mb-2"></i>
                    <p className="text-muted">No floor plan available.</p>
                </div>
            </StandardComponentTemplate>
        );
    }

    // Get floor plan image source
    const floorPlanSrc = getImageSrc(floorPlan);

    // Handle opening floor plan in new tab
    const handleOpenInNewTab = () => {
        window.open(floorPlanSrc, '_blank');
    };

    // Handle image error
    const handleImageError = (e) => {
        console.error('Floor plan failed to load:', floorPlanSrc);
        e.target.style.display = 'none';
    };

    return (
        <StandardComponentTemplate 
            title="Event Floor Plan" 
            icon="🏗️"
            borderColor="blue"
        >
            <div style={{ textAlign: 'center' }}>
                {/* Floor Plan Container */}
                <div
                    style={{
                        border: '2px solid #ddd',
                        borderRadius: '8px',
                        padding: '10px',
                        backgroundColor: '#f8f9fa'
                    }}
                >
                    {/* Floor Plan Image */}
                    <img
                        src={floorPlanSrc}
                        alt="Event Floor Plan"
                        style={{
                            maxWidth: '100%',
                            height: 'auto',
                            borderRadius: '4px'
                        }}
                        onError={handleImageError}
                    />
                </div>

                {/* Open in New Tab Button */}
                <Button 
                    variant="outline-primary" 
                    size="sm" 
                    className="mt-3" 
                    onClick={handleOpenInNewTab}
                >
                    <i className="fas fa-external-link-alt me-2"></i>
                    Open in New Tab
                </Button>
            </div>
        </StandardComponentTemplate>
    );
};

export default EventFloorPlanComponent;