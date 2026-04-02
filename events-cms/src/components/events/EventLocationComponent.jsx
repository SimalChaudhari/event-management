import React from 'react';
import { Row, Col, Button } from 'react-bootstrap';
import GoogleMapComponent from './GoogleMapComponent';
import StandardComponentTemplate from '../StandardComponentTemplate';

/**
 * EventLocationComponent - Component to display event location and pricing information
 * @param {Object} eventData - Event data object
 */
const EventLocationComponent = ({ eventData }) => {
    // Handle get directions button click
    const handleGetDirections = () => {
        const url = `https://www.google.com/maps/dir/?api=1&destination=${eventData.latitude},${eventData.longitude}`;
        window.open(url, '_blank');
    };

    // Render coordinates display
    const renderCoordinates = () => (
        <div className="d-flex gap-3">
            {eventData.latitude && (
                <div 
                    className="text-center p-2" 
                    style={{ backgroundColor: '#f8f9fa', borderRadius: '6px', flex: 1 }}
                >
                    <i className="fas fa-location-arrow text-primary"></i>
                    <span className="ms-2">Latitude: {eventData.latitude}</span>
                </div>
            )}
            {eventData.longitude && (
                <div 
                    className="text-center p-2" 
                    style={{ backgroundColor: '#f8f9fa', borderRadius: '6px', flex: 1 }}
                >
                    <i className="fas fa-location-arrow text-primary"></i>
                    <span className="ms-2">Longitude: {eventData.longitude}</span>
                </div>
            )}
        </div>
    );

    // Check if location data is available
    if (!eventData?.latitude && !eventData?.longitude) {
        return (
            <StandardComponentTemplate 
                title="Event Location" 
                // icon="📍"
                borderColor="green"
            >
                <div className="text-center py-4">
                    <i className="fas fa-store fa-2x text-muted mb-2"></i>
                    <p className="text-muted">No location information available.</p>
                </div>
            </StandardComponentTemplate>
        );
    }

    return (
        <StandardComponentTemplate 
            title="Event Location" 
            // icon="📍"
            borderColor="green"
        >
            <div className="p-3" style={{ padding: '20px' }}>
                {/* Map and Coordinates Section */}
                <Row className="mt-4">
                    <Col xs={12}>
                        
                        {/* Google Map */}
                        <div className="mb-3">
                            <GoogleMapComponent
                                latitude={eventData.latitude}
                                longitude={eventData.longitude}
                                eventName={eventData.name}
                                location={eventData.location}
                            />
                        </div>

                        {/* Coordinates Display */}
                        {renderCoordinates()}

                        {/* Directions Button */}
                        <div className="mt-3 text-center">
                            <Button
                                variant="outline-primary"
                                size="sm"
                                onClick={handleGetDirections}
                            >
                                <i className="fas fa-directions me-2"></i>
                                Get Directions
                            </Button>
                        </div>
                    </Col>
                </Row>
            </div>
        </StandardComponentTemplate>
    );
};

export default EventLocationComponent;
