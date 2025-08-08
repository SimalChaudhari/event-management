import React from 'react';
import { Button, Badge } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { EXHIBITOR_PATHS } from '../../utils/constants';
import StandardComponentTemplate from '../StandardComponentTemplate';

/**
 * EventExhibitorsComponent - Component to display event exhibitors
 * @param {Object} exhibitors - Exhibitors data object
 * @param {Function} getImageSrc - Function to get image source URL
 */
const EventExhibitorsComponent = ({ exhibitors, getImageSrc }) => {
    const navigate = useNavigate();

    // Check if exhibitors are available
    if (!exhibitors?.exhibitors?.length) {
        return (
            <StandardComponentTemplate 
                title="Event Exhibitors" 
                icon="🏢"
                borderColor="orange"
            >
                <div className="text-center py-4">
                    <i className="fas fa-store fa-2x text-muted mb-2"></i>
                    <p className="text-muted">No exhibitors available.</p>
                </div>
            </StandardComponentTemplate>
        );
    }

    // Render exhibitor description
    const renderExhibitorDescription = () => {
        if (!exhibitors.exhibitorDescription) {
            return null;
        }

        return (
            <div className="mb-4">
                <h6>Exhibitor Description</h6>
                <p style={{ textAlign: 'justify', lineHeight: '1.6' }}>
                    {exhibitors.exhibitorDescription}
                </p>
                <hr />
            </div>
        );
    };

    // Render individual exhibitor
    const renderExhibitor = (exhibitor) => (
        <div key={exhibitor.id} className="mb-5">
            {/* Exhibitor Header */}
            <div className="d-flex align-items-center mb-4" style={{ gap: 24 }}>
                {/* Exhibitor Profile Image */}
                <img
                    src={getImageSrc(exhibitor.profile)}
                    alt={exhibitor.name}
                    style={{
                        width: 90,
                        height: 90,
                        borderRadius: '12px',
                        objectFit: 'cover',
                        boxShadow: '0 4px 16px rgba(0,0,0,0.08)'
                    }}
                />

                {/* Exhibitor Info */}
                <div>
                    <h4 className="mb-1 fw-bold">{exhibitor.name}</h4>
                    <div className="mb-1 text-primary">{exhibitor.companyName}</div>
                    <Badge bg={exhibitor.isActive ? 'success' : 'secondary'}>
                        {exhibitor.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                </div>

                {/* View More Button */}
                <Button
                    variant="outline-primary"
                    size="sm"
                    onClick={() => navigate(`${EXHIBITOR_PATHS.VIEW_EXHIBITOR}/${exhibitor.id}`)}
                    style={{
                        borderRadius: '8px',
                        padding: '8px 16px',
                        fontSize: '14px',
                        fontWeight: '500'
                    }}
                >
                    <i className="fas fa-eye me-2" style={{ marginRight: 5 }}></i>
                    View More
                </Button>
            </div>
        </div>
    );

    return (
        <StandardComponentTemplate 
            title="Event Exhibitors" 
            icon="🏢"
            borderColor="orange"
        >
            {/* Exhibitor Description */}
            {renderExhibitorDescription()}

            {/* Exhibitors List */}
            <div>
                {exhibitors.exhibitors.map(renderExhibitor)}
            </div>
        </StandardComponentTemplate>
    );
};

export default EventExhibitorsComponent;