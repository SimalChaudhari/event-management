import React, { useEffect, useState } from 'react';

// Google Maps API Key - should be moved to environment variables
const GOOGLE_API_KEY = 'AIzaSyAh43XIafkwl_7xaqeES90e8FQWqhN4DEc';

/**
 * GoogleMapComponent - Component to display Google Maps with event location
 * @param {string} latitude - Event latitude coordinate
 * @param {string} longitude - Event longitude coordinate
 * @param {string} eventName - Name of the event
 * @param {string} location - Event location/venue
 */
const GoogleMapComponent = ({ latitude, longitude, eventName, location }) => {
    const [mapLoaded, setMapLoaded] = useState(false);

    // Load Google Maps script
    useEffect(() => {
        const loadGoogleMapsScript = () => {
            const script = document.createElement('script');
            script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_API_KEY}&libraries=places`;
            script.async = true;
            script.defer = true;
            script.onload = () => setMapLoaded(true);
            document.head.appendChild(script);

            return () => {
                if (document.head.contains(script)) {
                    document.head.removeChild(script);
                }
            };
        };

        return loadGoogleMapsScript();
    }, []);

    // Initialize map when script is loaded
    useEffect(() => {
        if (mapLoaded && latitude && longitude) {
            initializeMap();
        }
    }, [mapLoaded, latitude, longitude, eventName, location]);

    // Initialize Google Maps
    const initializeMap = () => {
        const mapElement = document.getElementById('map');
        if (!mapElement) return;

        // Create map instance
        const map = new window.google.maps.Map(mapElement, {
            center: { lat: parseFloat(latitude), lng: parseFloat(longitude) },
            zoom: 15,
            mapTypeId: window.google.maps.MapTypeId.ROADMAP,
            styles: getMapStyles()
        });

        // Add marker to map
        const marker = new window.google.maps.Marker({
            position: { lat: parseFloat(latitude), lng: parseFloat(longitude) },
            map: map,
            title: eventName || 'Event Location',
            animation: window.google.maps.Animation.DROP
        });

        // Create and show info window
        const infoWindow = createInfoWindow();
        infoWindow.open(map, marker);
    };

    // Get custom map styles
    const getMapStyles = () => [
        {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
        }
    ];

    // Create info window with event details
    const createInfoWindow = () => {
        return new window.google.maps.InfoWindow({
            content: `
                <div style="padding: 10px; max-width: 200px;">
                    <h6 style="margin: 0 0 5px 0; color: #333;">
                        ${eventName || 'Event Location'}
                    </h6>
                    <p style="margin: 0; color: #666; font-size: 12px;">
                        ${location || 'Event Venue'}
                    </p>
                </div>
            `
        });
    };

    // Render loading state
    const renderLoadingState = () => (
        <div
            style={{
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#f8f9fa'
            }}
        >
            <div className="text-center">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-2 mb-0 text-muted">Loading map...</p>
            </div>
        </div>
    );

    // Render no coordinates state
    const renderNoCoordinatesState = () => (
        <div
            style={{
                height: '300px',
                backgroundColor: '#f8f9fa',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '8px',
                border: '1px solid #e9ecef'
            }}
        >
            <div className="text-center">
                <i 
                    className="fas fa-map-marker-alt text-muted" 
                    style={{ fontSize: '3rem', marginBottom: '10px' }}
                ></i>
                <p className="text-muted mb-0">No coordinates available</p>
            </div>
        </div>
    );

    // Check if coordinates are available
    if (!latitude || !longitude) {
        return renderNoCoordinatesState();
    }

    return (
        <div
            id="map"
            style={{
                height: '300px',
                width: '100%',
                borderRadius: '8px',
                border: '1px solid #e9ecef',
                overflow: 'hidden'
            }}
        >
            {!mapLoaded && renderLoadingState()}
        </div>
    );
};

export default GoogleMapComponent;
