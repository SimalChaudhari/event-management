import { useEffect, useRef, useState } from "react";
import { Marker, Popup } from "react-leaflet";
import L from "leaflet";

const LocationMarker = ({ latitude, longitude, location }) => {
    const markerRef = useRef(null);
    const [copied, setCopied] = useState(false);

    const handleCopyCoordinates = () => {
        const coordinates = `${latitude}, ${longitude}`;
        navigator.clipboard.writeText(coordinates).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
        }).catch((err) => {
            console.error('Failed to copy coordinates: ', err);
        });
    };

    useEffect(() => {
        if (markerRef.current) {
            markerRef.current.openPopup();
        }
    }, [latitude, longitude]);

    const customIcon = L.icon({
        // iconUrl: "https://i.pinimg.com/736x/22/11/f8/2211f8cc5b35a7cd807586328bc33e35.jpg",
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',

        iconSize: [25, 41],
        iconAnchor: [12, 41],
    });

    return (
        <Marker
            ref={markerRef}
            position={[latitude || 0, longitude || 0]}
            icon={customIcon}
        >
            <Popup 
                closeButton={false}
                className="custom-popup"
                minWidth={200}
            >
                <div style={{ 
                    padding: '8px', 
                    fontSize: '12px', 
                    fontFamily: 'Arial, sans-serif',
                    lineHeight: '1.4'
                }}>
                    {/* Location Header */}
                    <div style={{ 
                        backgroundColor: '#1591EA', 
                        color: 'white', 
                        padding: '6px 8px', 
                        margin: '-8px -8px 8px -8px',
                        borderRadius: '4px 4px 0 0',
                        fontWeight: 'bold',
                        fontSize: '11px',
                        textAlign: 'center'
                    }}>
                        <i className="fas fa-map-marker-alt" style={{ marginRight: '4px' }}></i>
                        Seleted Location
                    </div>

                    {/* Location Name */}
                    <div style={{ 
                        padding: '4px 0', 
                        borderBottom: '1px solid #e0e0e0',
                        marginBottom: '6px'
                    }}>
                        <div style={{ fontWeight: 'bold', color: '#333', fontSize: '11px' }}>
                            {location || 'Unknown Location'}
                        </div>
                    </div>

                    {/* Coordinates */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ color: '#666', fontSize: '12px' }}>
                                <i className="fas fa-crosshairs" style={{ marginRight: '4px', color: '#28a745' }}></i>
                                Latitude
                            </span>
                            <span style={{ 
                                fontWeight: 'bold', 
                                color: '#333', 
                                fontSize: '10px',
                                backgroundColor: '#f8f9fa',
                                padding: '2px 4px',
                                borderRadius: '3px',
                                border: '1px solid #28a745'
                            }}>
                                {latitude ? Number(latitude).toFixed(6) : 'N/A'}
                            </span>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ color: '#666', fontSize: '12px' }}>
                                <i className="fas fa-crosshairs" style={{ marginRight: '4px', color: '#dc3545' }}></i>
                                Longitude
                            </span>
                            <span style={{ 
                                fontWeight: 'bold', 
                                color: '#333', 
                                fontSize: '10px',
                                backgroundColor: '#f8f9fa',
                                padding: '2px 4px',
                                borderRadius: '3px',
                                border: '1px solid #dc3545'
                            }}>
                                {longitude ? Number(longitude).toFixed(6) : 'N/A'}
                            </span>
                        </div>
                    </div>

                    {/* Copy Icon */}
                    <div style={{ 
                        marginTop: '8px', 
                        padding: '4px 0',
                        borderTop: '1px solid #e0e0e0',
                        textAlign: 'center',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        gap: '8px'
                    }}>
                        <small style={{ color: '#999', fontSize: '12px' }}>
                            Coordinates:
                        </small>
                        <button
                            onClick={handleCopyCoordinates}
                            style={{
                                backgroundColor: 'transparent',
                                color: copied ? '#28a745' : '#1591EA',
                                border: 'none',
                                padding: '2px',
                                borderRadius: '3px',
                                fontSize: '12px',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                            title={copied ? 'Copied!' : 'Click to copy coordinates'}
                            onMouseOver={(e) => {
                                if (!copied) {
                                    e.target.style.color = '#0d6efd';
                                    e.target.style.transform = 'scale(1.1)';
                                }
                            }}
                            onMouseOut={(e) => {
                                if (!copied) {
                                    e.target.style.color = '#1591EA';
                                    e.target.style.transform = 'scale(1)';
                                }
                            }}
                        >
                            {copied ? (
                                <i className="fas fa-check"></i>
                            ) : (
                                <i className="fas fa-copy"></i>
                            )}
                        </button>
                    </div>
                </div>
            </Popup>
        </Marker>
    );
};

export default LocationMarker;
