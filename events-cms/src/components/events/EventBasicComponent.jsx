import React from 'react';
import { Row, Col, Badge, Card } from 'react-bootstrap';
import DateTimeFormatter from '../dateTime/DateTimeFormatter';

/**
 * EventBasicComponent - Component to display basic event details with clean card-based UI
 * @param {Object} eventData - Event data object
 * @param {Function} renderCategories - Function to render categories
 */
const EventBasicComponent = ({ eventData }) => {
    // Format timestamp to readable date
    const formatTimestamp = (timestamp) => {
        if (!timestamp) return 'N/A';
        const date = new Date(timestamp);
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    const renderCategories = () => {
        if (!eventData?.categories?.length) {
            return <p className="text-muted">No categories listed.</p>;
        }
        return (
            <Row>
                {eventData?.categories?.map((category, index) => (
                    <Col lg={6} key={category.id} className="mb-4">
                        <div className="category-item">
                            <div className="mb-3">
                                <div className="fw-semibold text-muted mb-1 label-text">
                                    🏷️ Category Name:
                                </div>
                                <div className="fw-bold">{category.name}</div>
                            </div>
                            
                            <div className="mb-3">
                                <div className="fw-semibold text-muted mb-1 label-text">
                                    📝 Description:
                                </div>
                                <div className="fw-bold">{category.description}</div>
                            </div>
                        </div>
                    </Col>
                ))}
            </Row>
        );
    };

    return (
        <div className="p-2 bg-light">
            {/* Event Overview Section */}
            <div className="mb-4">
                <h5 className="fw-bold text-dark mb-3 section-title">Event Overview</h5>
                
                <div className="overview-container">
                    {/* Event Title & Status Row */}
                    <Row className="mb-3">
                        <Col lg={6} className="mb-3">
                            <div className="mb-2">
                                <div className="fw-semibold text-muted mb-1 label-text">
                                    📋 Event Name:
                                </div>
                                <div className="fw-bold">{eventData.name}</div>
                            </div>
                        </Col>
                        
                        <Col lg={6} className="mb-3">
                            <div className="mb-2">
                                <div className="fw-semibold text-muted mb-1 label-text">
                                    🏷️ Event Type:
                                </div>
                                <div>
                                    <Badge bg="secondary" className="px-3 py-2">
                                        {eventData.type || 'N/A'}
                                    </Badge>
                                </div>
                            </div>
                        </Col>
                    </Row>

                    <hr className="my-3" />

                    {/* Start & End Date/Time Row */}
                    <Row className="mb-3">
                        <Col lg={6} className="mb-3">
                            <div className="mb-2">
                                <div className="fw-semibold text-muted mb-1 label-text">
                                    📅 Start Date & Time:
                                </div>
                                <div className="fw-bold">
                                    <DateTimeFormatter date={eventData.startDate} time={eventData.startTime} />
                                </div>
                            </div>
                        </Col>
                        
                        <Col lg={6} className="mb-3">
                            <div className="mb-2">
                                <div className="fw-semibold text-muted mb-1 label-text">
                                    ✅ End Date & Time:
                                </div>
                                <div className="fw-bold">
                                    <DateTimeFormatter date={eventData.endDate} time={eventData.endTime} />
                                </div>
                            </div>
                        </Col>
                    </Row>

                    <hr className="my-3" />

                    {/* Event Description Row - Full Width */}
                    <Row>
                        <Col md={12}>
                            <div className="mb-2">
                                <div className="fw-semibold text-muted mb-1 label-text">
                                    📝 Event Description:
                                </div>
                                <div className="description-content">
                                    {eventData.description || 'No description available'}
                                </div>
                            </div>
                        </Col>
                    </Row>
                </div>
            </div>

            {/* Event Details Section */}
            <div className="mb-4">
                <h5 className="fw-bold text-dark mb-3 section-title">Event Details</h5>
                
                <Row>
                    <Col lg={6} className="mb-4">
                        <div className="details-container">
                            <div className="mb-3">
                                <div className="fw-semibold text-muted mb-1 label-text">
                                    📍 Location:
                                </div>
                                <div className="fw-bold">{eventData.location || 'N/A'}</div>
                            </div>
                            
                            <div className="mb-3">
                                <div className="fw-semibold text-muted mb-1 label-text">
                                    🏢 Venue:
                                </div>
                                <div className="fw-bold">{eventData.venue || 'N/A'}</div>
                            </div>
                            
                            <div className="mb-3">
                                <div className="fw-semibold text-muted mb-1 label-text">
                                    🌍 Country:
                                </div>
                                <div className="fw-bold">{eventData.country || 'N/A'}</div>
                            </div>
                        </div>
                    </Col>
                    
                    <Col lg={6} className="mb-4">
                        <div className="details-container">
                            <div className="mb-3">
                                <div className="fw-semibold text-muted mb-1 label-text">
                                    💰 Ticket Price:
                                </div>
                                <div className="fw-bold text-success fs-5">
                                    {eventData.price ? `${eventData.price} ${eventData.currency || 'USD'}` : 'Free'}
                                </div>
                            </div>
                            
                            <div className="mb-3">
                                <div className="fw-semibold text-muted mb-1 label-text">
                                    📊 Created At:
                                </div>
                                <div className="text-muted">{formatTimestamp(eventData.createdAt)}</div>
                            </div>
                            
                            <div className="mb-3">
                                <div className="fw-semibold text-muted mb-1 label-text">
                                    🔄 Last Updated:
                                </div>
                                <div className="text-muted">{formatTimestamp(eventData.updatedAt)}</div>
                            </div>
                        </div>
                    </Col>
                </Row>
            </div>

            {/* Categories Section */}
            <div className="mb-4">
                <h5 className="fw-bold text-dark mb-3 section-title">Event Categories</h5>
                {renderCategories()}
            </div>

            {/* Custom CSS Styles */}
            <style jsx>{`
                .label-text {
                    font-size: 1rem !important;
                    font-weight: 600 !important;
                    color: #495057 !important;
                    text-transform: none !important;
                    letter-spacing: 0.3px !important;
                    margin-bottom: 8px !important;
                }

                .description-content {
                    background: #f8f9fa;
                    padding: 15px;
                    border-radius: 8px;
                    font-size: 0.95rem;
                    color: #495057;
                    line-height: 1.6;
                    border: 1px solid #e9ecef;
                    font-style: eventData.description ? 'normal' : 'italic';
                }

                .section-title {
                    color: #2c3e50 !important;
                    border-bottom: 2px solid #3498db;
                    padding-bottom: 8px;
                    position: relative;
                }

                .section-title::after {
                    content: '';
                    position: absolute;
                    bottom: -2px;
                    left: 0;
                    width: 50px;
                    height: 2px;
                    background: #e74c3c;
                }

                .overview-container {
                    background: white;
                    border-radius: 8px;
                    padding: 20px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                    border-left: 4px solid #3498db;
                }

                .details-container {
                    background: white;
                    border-radius: 8px;
                    padding: 20px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                    height: 100%;
                    border-left: 4px solid #27ae60;
                }

                .category-item {
                    background: white;
                    border-radius: 8px;
                    padding: 20px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                    height: 100%;
                    border-left: 4px solid #f39c12;
                }

                /* Mobile Responsive Styles */
                @media (max-width: 768px) {
                    .label-text {
                        font-size: 0.9rem !important;
                        color: #2c3e50 !important;
                    }
                    
                    .section-title {
                        font-size: 1.2rem !important;
                        color: #2c3e50 !important;
                        border-bottom: 2px solid #3498db;
                        margin-bottom: 15px;
                    }
                    
                    .overview-container,
                    .details-container,
                    .category-item {
                        background: #ffffff !important;
                        box-shadow: 0 1px 3px rgba(0,0,0,0.1) !important;
                        padding: 15px !important;
                        border-radius: 6px !important;
                        margin-bottom: 10px;
                        border: 1px solid #e9ecef;
                    }
                    
                    .overview-container {
                        border-left: 4px solid #3498db;
                    }
                    
                    .details-container {
                        border-left: 4px solid #27ae60;
                    }
                    
                    .category-item {
                        border-left: 4px solid #f39c12;
                    }
                    
                    .description-content {
                        font-size: 0.9rem;
                        padding: 12px;
                        background: #f8f9fa;
                    }
                    
                    .fw-bold {
                        font-size: 0.95rem !important;
                        color: #2c3e50 !important;
                    }
                    
                    .text-muted {
                        font-size: 0.85rem !important;
                        color: #6c757d !important;
                    }
                    
                    .fs-5 {
                        font-size: 1rem !important;
                    }
                    
                    .px-3.py-2 {
                        padding: 0.5rem 1rem !important;
                        font-size: 0.8rem !important;
                    }
                    
                    hr {
                        border-color: #dee2e6;
                        margin: 15px 0;
                    }
                }

                @media (max-width: 576px) {
                    .label-text {
                        font-size: 0.85rem !important;
                        color: #2c3e50 !important;
                    }
                    
                    .section-title {
                        font-size: 1.1rem !important;
                        color: #2c3e50 !important;
                    }
                    
                    .fw-bold {
                        font-size: 0.9rem !important;
                        color: #2c3e50 !important;
                    }
                    
                    .text-muted {
                        font-size: 0.8rem !important;
                        color: #6c757d !important;
                    }
                    
                    .description-content {
                        font-size: 0.85rem;
                        padding: 10px;
                    }
                    
                    .overview-container,
                    .details-container,
                    .category-item {
                        padding: 12px !important;
                        margin-bottom: 8px;
                    }
                }
            `}</style>
        </div>
    );
};

export default EventBasicComponent;
