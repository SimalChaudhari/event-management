import React, { useState, useRef } from 'react';
import { Modal, Button, Card, Row, Col, Form, InputGroup, ListGroup } from 'react-bootstrap';
import { MapContainer, TileLayer, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import LocationMarker from './LocationMarker';

const MapLocationModal = ({ 
    show, 
    onHide, 
    formData, 
    onLocationSave, 
    display 
}) => {
    const [tempLatLng, setTempLatLng] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const [mapCenter, setMapCenter] = useState([formData.latitude || 51.505, formData.longitude || -0.09]);
    const mapRef = useRef(null);

    // Search functionality
    const searchLocation = async (query) => {
        if (!query || query.trim().length < 3) {
            setSearchResults([]);
            setShowResults(false);
            return;
        }

        setIsSearching(true);
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&addressdetails=1&limit=5`
            );
            const data = await response.json();
            
            const formattedResults = data.map(item => ({
                place_id: item.place_id,
                display_name: item.display_name,
                lat: parseFloat(item.lat),
                lon: parseFloat(item.lon),
                address: item.address || {}
            }));
            
            setSearchResults(formattedResults);
            setShowResults(true);
        } catch (error) {
            console.error('Error searching location:', error);
            setSearchResults([]);
        }
        setIsSearching(false);
    };

    const handleSearchInputChange = (e) => {
        const value = e.target.value;
        setSearchQuery(value);
        
        // Debounce search
        clearTimeout(window.searchTimeout);
        window.searchTimeout = setTimeout(() => {
            searchLocation(value);
        }, 500);
    };

    const selectSearchResult = (result) => {
        const locationData = {
            latitude: result.lat,
            longitude: result.lon,
            address: result.address
        };
        
        setTempLatLng(locationData);
        setMapCenter([result.lat, result.lon]);
        setSearchQuery(result.display_name);
        setShowResults(false);
        
        // Update map center
        if (mapRef.current) {
            mapRef.current.setView([result.lat, result.lon], 15);
        }
    };

    // Map click handler component
    const MapClickHandler = () => {
        useMapEvents({
            click: async (e) => {
                const { lat, lng } = e.latlng;
                setShowResults(false); // Hide search results when clicking map
                
                try {
                    // Reverse geocoding to get address
                    const response = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`
                    );
                    const data = await response.json();
                    
                    setTempLatLng({
                        latitude: lat,
                        longitude: lng,
                        address: data.address || {}
                    });
                } catch (error) {
                    console.error('Error fetching address:', error);
                    setTempLatLng({
                        latitude: lat,
                        longitude: lng,
                        address: null
                    });
                }
            }
        });
        return null;
    };

    const handleSaveLocation = () => {
        if (tempLatLng) {
            const locationData = {
                latitude: tempLatLng.latitude,
                longitude: tempLatLng.longitude,
                location: [
                    tempLatLng.address?.state,
                    tempLatLng.address?.state_district || tempLatLng.address?.district
                ]
                    .filter(Boolean)
                    .join(', '),
                venue: tempLatLng.address?.town || tempLatLng.address?.village,
                country: tempLatLng.address?.country
            };
            
            onLocationSave(locationData);
            setTempLatLng(null);
            onHide();
        }
    };

    const handleClose = () => {
        setTempLatLng(null);
        setSearchQuery('');
        setSearchResults([]);
        setShowResults(false);
        clearTimeout(window.searchTimeout);
        onHide();
    };

    return (
        <Modal 
            show={show} 
            onHide={handleClose} 
            size="xl"
            style={{ zIndex: 9999 }}
            backdrop="static"
        >
            
            {/* Search Section */}
            <div className="p-4 position-relative" style={{ background: '#ffffff', borderBottom: '1px solid #e8eaed' }}>
                {/* Close Button */}
                <button
                    onClick={handleClose}
                    className="position-absolute btn btn-sm"
                    style={{
                        top: '15px',
                        right: '15px',
                        background: '#f8f9fa',
                        border: '1px solid #dadce0',
                        borderRadius: '50%',
                        padding: '8px',
                        width: '36px',
                        height: '36px',
                        transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                        e.target.style.background = '#e8eaed';
                    }}
                    onMouseLeave={(e) => {
                        e.target.style.background = '#f8f9fa';
                    }}
                >
                    <i className="fas fa-times" style={{ fontSize: '14px', color: '#5f6368' }}></i>
                </button>

                <div className="mb-3 pe-5">
                    <h5 className="mb-1 fw-normal" style={{ color: '#3c4043', fontSize: '22px' }}>
                        Choose a location
                    </h5>
                    <small style={{ color: '#5f6368' }}>Search for places or click on the map</small>
                </div>
                
                <div className="position-relative">
                    <div className="position-relative" style={{ 
                        // borderRadius: '15px', 
                        overflow: 'hidden', 
                        boxShadow: '0 8px 30px rgba(102, 126, 234, 0.15)',
                        transition: 'all 0.3s ease'
                    }}>
                        <div className="d-flex align-items-center bg-white position-relative" style={{ 
                            // borderRadius: '12px',
                            minHeight: '48px'
                        }}>
                            {/* Search Icon Container */}
                            <div className="d-flex align-items-center justify-content-center" style={{
                                width: '44px',
                                height: '48px',
                                //default blue color
                                background: '#4680ff',
                                // borderRadius: '12px 0 0 12px',
                                position: 'relative'
                            }}>
                                <i className="fas fa-search text-white" style={{ 
                                    fontSize: '14px',
                                    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
                                }}></i>
                            </div>
                            
                            {/* Input Field */}
                            <input
                                type="text"
                                className="form-control border-0 flex-grow-1"
                                placeholder="Search cities, addresses, landmarks..."
                                value={searchQuery}
                                onChange={handleSearchInputChange}
                                onFocus={() => searchResults.length > 0 && setShowResults(true)}
                                style={{ 
                                    fontSize: '17px',
                                    backgroundColor: 'transparent',
                                    boxShadow: 'none',
                                    paddingLeft: '16px',
                                    paddingRight: isSearching ? '50px' : '16px',
                                    paddingTop: '14px',
                                    paddingBottom: '14px',
                                    fontWeight: '400',
                                    color: '#2d3748',
                                    // borderRadius: '0 12px 12px 0'
                                }}
                            />
                            
                            {/* Loading Spinner */}
                            {isSearching && (
                                <div 
                                    className="position-absolute d-flex align-items-center justify-content-center"
                                    style={{ 
                                        right: '12px',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        width: '28px',
                                        height: '28px',
                                        background: 'rgba(30, 64, 175, 0.1)',
                                        borderRadius: '50%'
                                    }}
                                >
                                    <div 
                                        className="spinner-border"
                                        role="status"
                                        style={{ 
                                            width: '16px', 
                                            height: '16px', 
                                            borderWidth: '2px',
                                            color: '#3b82f6'
                                        }}
                                    >
                                     
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                
            </div>
            <Modal.Body className="p-0 position-relative">
                <MapContainer
                    center={mapCenter}
                    zoom={13}
                    style={{ width: '100%', height: '400px' }}
                    ref={mapRef}
                    key={`${mapCenter[0]}-${mapCenter[1]}`}
                    zoomControl={!showResults} // Hide zoom controls when showing results
                >
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <MapClickHandler />
                    <LocationMarker
                        latitude={tempLatLng?.latitude || formData.latitude}
                        longitude={tempLatLng?.longitude || formData.longitude}
                        location={tempLatLng?.address ? 
                            (tempLatLng.address.town || tempLatLng.address.village || 'Selected Location') :
                            (display ? display : formData?.venue)
                        }
                    />
                </MapContainer>

                {/* Search Results Dropdown - Inside Map */}
                {showResults && searchResults.length > 0 && (
                    <div 
                        className="position-absolute" 
                        style={{ 
                            top: '15px',
                            left: '15px',
                            right: '15px',
                            zIndex: 1000, 
                            maxHeight: '350px', 
                            overflowY: 'auto',
                            borderRadius: '15px',
                            boxShadow: '0 15px 40px rgba(102, 126, 234, 0.35)',
                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                            border: '2px solid rgba(102, 126, 234, 0.2)',
                            backdropFilter: 'blur(15px)'
                        }}
                    >
                        {/* Header */}
                        <div className="px-4 py-3 border-bottom" style={{ 
                            borderBottom: '2px solid rgba(102, 126, 234, 0.1)',
                            background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.08) 0%, rgba(118, 75, 162, 0.08) 100%)',
                            borderRadius: '13px 13px 0 0'
                        }}>
                            <div className="d-flex align-items-center justify-content-between">
                                <h6 className="mb-0 text-muted fw-bold" style={{ fontSize: '12px', letterSpacing: '0.5px' }}>
                                    <i className="fas fa-location-arrow me-2" style={{ color: '#667eea',marginRight: '5px' }}></i>
                                    Search Results ({searchResults.length})
                                </h6>
                                <button
                                    className="btn btn-sm"
                                    onClick={() => setShowResults(false)}
                                    style={{
                                        background: 'rgba(220, 53, 69, 0.1)',
                                        border: '1px solid rgba(220, 53, 69, 0.2)',
                                        borderRadius: '8px',
                                        padding: '4px 8px'
                                    }}
                                >
                                    <i className="fas fa-times" style={{ fontSize: '12px', color: '#dc3545' }}></i>
                                </button>
                            </div>
                        </div>
                        
                        {/* Results List */}
                        <div className="py-2">
                            {searchResults.map((result, index) => (
                                <div
                                    key={result.place_id}
                                    onClick={() => selectSearchResult(result)}
                                    className="mx-2 mb-2 rounded-3"
                                    style={{ 
                                        cursor: 'pointer',
                                        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                                        padding: '14px',
                                        border: '1px solid transparent',
                                        background: 'linear-gradient(135deg, rgba(255,255,255,0.8) 0%, rgba(248,250,252,0.8) 100%)'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.backgroundColor = 'rgba(102, 126, 234, 0.12)';
                                        e.currentTarget.style.transform = 'translateY(-1px) translateX(2px)';
                                        e.currentTarget.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.2)';
                                        e.currentTarget.style.borderColor = 'rgba(102, 126, 234, 0.3)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.8)';
                                        e.currentTarget.style.transform = 'translateY(0) translateX(0)';
                                        e.currentTarget.style.boxShadow = 'none';
                                        e.currentTarget.style.borderColor = 'transparent';
                                    }}
                                >
                                    <div className="d-flex align-items-start">
                                        {/* Icon */}
                                        <div 
                                            className="me-3 d-flex align-items-center justify-content-center flex-shrink-0"
                                            style={{ 
                                                width: '38px', 
                                                height: '38px', 
                                                marginRight:"10px",
                                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
                                                borderRadius: '10px',
                                                boxShadow: '0 3px 10px rgba(102, 126, 234, 0.3)'
                                            }}
                                        >
                                            <i className="fas fa-map-marker-alt text-white" style={{ 
                                                fontSize: '14px',
                                                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))'
                                            }}></i>
                                        </div>
                                        
                                        {/* Content */}
                                        <div className="flex-grow-1" style={{ minWidth: 0 }}>
                                            <div className="fw-bold text-dark mb-1" style={{ 
                                                fontSize: '14px', 
                                                lineHeight: '1.3',
                                                color: '#1a202c'
                                            }}>
                                                {result.display_name.split(',').slice(0, 2).join(', ')}
                                            </div>
                                            {result.display_name.split(',').length > 2 && (
                                                <div className="text-muted mb-2" style={{ 
                                                    fontSize: '12px',
                                                    lineHeight: '1.3'
                                                }}>
                                                    {result.display_name.split(',').slice(2).join(', ')}
                                                </div>
                                            )}
                                            <div className="d-flex align-items-center justify-content-between">
                                                <small className="text-muted d-flex align-items-center">
                                                    <i className="fas fa-crosshairs me-1" style={{ 
                                                        fontSize: '10px',
                                                        color: '#667eea'
                                                    }}></i>
                                                    <span style={{ fontFamily: 'monospace', fontSize: '10px' }}>
                                                        {result.lat.toFixed(4)}, {result.lon.toFixed(4)}
                                                    </span>
                                                </small>
                                               
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                <div className="text-center py-3" style={{ backgroundColor: '#f8f9fa', borderTop: '2px solid #e9ecef' }}>
                    <small className="text-muted fw-medium">
                        <i className="fa fa-info-circle me-2" style={{color: '#4680ff',fontSize: '14px',marginRight: '5px'}}></i>
                        Search above or click anywhere on the map to pin your location
                    </small>
                </div>
            </Modal.Body>

            {tempLatLng && (
                <div className="p-4" style={{ backgroundColor: '#f8f9fa' }}>
                    <Row className="g-4">
                        {/* Coordinates Information */}
                        <Col md={6}>
                            <div 
                                className="bg-white p-4 h-100"
                                style={{ 
                                    borderLeft: '4px solid #28a745',
                                    borderRadius: '0.375rem',
                                    boxShadow: '0 0.125rem 0.25rem rgba(0, 0, 0, 0.075)'
                                }}
                            >
                                <h6 className="text-uppercase fw-bold mb-3" style={{ color: '#28a745', fontSize: '0.875rem' }}>
                                    COORDINATE INFORMATION
                                </h6>
                                <hr style={{ borderColor: '#28a745', margin: '0.75rem 0' }} />
                                
                                <div className="mb-3">
                                    <div className="d-flex justify-content-between align-items-center pb-2" style={{ borderBottom: '2px solid #1591EA' }}>
                                        <span style={{ color: '#6c757d', fontSize: '0.875rem' }}>Latitude:</span>
                                        <span className="fw-normal" style={{ fontSize: '0.875rem' }}>
                                            {tempLatLng.latitude?.toFixed(6) || 'Not Available'}
                                        </span>
                                    </div>
                                </div>

                                <div className="mb-3">
                                    <div className="d-flex justify-content-between align-items-center pb-2" style={{ borderBottom: '2px solid #28a745' }}>
                                        <span style={{ color: '#6c757d', fontSize: '0.875rem' }}>Longitude:</span>
                                        <span className="fw-normal" style={{ fontSize: '0.875rem' }}>
                                            {tempLatLng.longitude?.toFixed(6) || 'Not Available'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </Col>

                        {/* Address Details */}
                        <Col md={6}>
                            <div 
                                className="bg-white p-4 h-100"
                                style={{ 
                                    borderLeft: '4px solid #fd7e14',
                                    borderRadius: '0.375rem',
                                    boxShadow: '0 0.125rem 0.25rem rgba(0, 0, 0, 0.075)'
                                }}
                            >
                                <h6 className="text-uppercase fw-bold mb-3" style={{ color: '#fd7e14', fontSize: '0.875rem' }}>
                                    ADDRESS DETAILS
                                </h6>
                                <hr style={{ borderColor: '#fd7e14', margin: '0.75rem 0' }} />
                                
                                {tempLatLng.address ? (
                                    <>
                                        <div className="mb-3">
                                            <div className="d-flex justify-content-between align-items-center pb-2" style={{ borderBottom: '2px solid #17a2b8' }}>
                                                <span style={{ color: '#6c757d', fontSize: '0.875rem' }}>City/Town:</span>
                                                <span className="fw-normal text-end text-truncate" style={{ fontSize: '0.875rem', maxWidth: '60%' }} title={tempLatLng.address.town || tempLatLng.address.village || 'Not provided'}>
                                                    {tempLatLng.address.town || tempLatLng.address.village || 'Not provided'}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="mb-3">
                                            <div className="d-flex justify-content-between align-items-center pb-2" style={{ borderBottom: '2px solid #28a745' }}>
                                                <span style={{ color: '#6c757d', fontSize: '0.875rem' }}>State:</span>
                                                <span className="fw-normal text-end text-truncate" style={{ fontSize: '0.875rem', maxWidth: '60%' }} title={tempLatLng.address.state || 'Not provided'}>
                                                    {tempLatLng.address.state || 'Not provided'}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="mb-3">
                                            <div className="d-flex justify-content-between align-items-center pb-2" style={{ borderBottom: '2px solid #ffc107' }}>
                                                <span style={{ color: '#6c757d', fontSize: '0.875rem' }}>District:</span>
                                                <span className="fw-normal text-end text-truncate" style={{ fontSize: '0.875rem', maxWidth: '60%' }} title={tempLatLng.address.state_district || tempLatLng.address.district || 'Not provided'}>
                                                    {tempLatLng.address.state_district || tempLatLng.address.district || 'Not provided'}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="mb-3">
                                            <div className="d-flex justify-content-between align-items-center pb-2" style={{ borderBottom: '2px solid #dc3545' }}>
                                                <span style={{ color: '#6c757d', fontSize: '0.875rem' }}>Country:</span>
                                                <span className="fw-normal text-end text-truncate" style={{ fontSize: '0.875rem', maxWidth: '60%' }} title={tempLatLng.address.country || 'Not provided'}>
                                                    {tempLatLng.address.country || 'Not provided'}
                                                </span>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-center p-3">
                                        <div className="spinner-border spinner-border-sm me-2" style={{ color: '#fd7e14' }} role="status">
                                            <span className="visually-hidden">Loading...</span>
                                        </div>
                                        <span style={{ color: '#6c757d', fontSize: '0.875rem' }}>Fetching address details...</span>
                                    </div>
                                )}
                            </div>
                        </Col>
                    </Row>

                    {/* Save Button */}
                    <div className="text-center mt-4">
                        <Button
                            variant="success"
                            size="sm"
                            onClick={handleSaveLocation}
                            className="px-4 py-2 fw-bold"
                            style={{ borderRadius: '0.375rem' }}
                        >
                            Save
                        </Button>
                    </div>
                </div>
            )}

        </Modal>
    );
};

export default MapLocationModal;
