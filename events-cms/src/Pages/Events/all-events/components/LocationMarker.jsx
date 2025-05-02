import { useEffect, useRef } from "react";
import { Marker, Popup } from "react-leaflet";
import L from "leaflet";

const LocationMarker = ({ latitude, longitude, location }) => {
    const markerRef = useRef(null);

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
            <Popup>
                <div>
                    <strong> {location} </strong><br />
                    <br />
                    <strong>Latitude:</strong> {latitude} <br />
                    <strong>Longitude:</strong> {longitude}
                </div>
            </Popup>
        </Marker>
    );
};

export default LocationMarker;
