import React from 'react';
import { Row, Col, Card } from 'react-bootstrap';

const Default = () => {
    // Dummy data
    const userCount = 42;
    const totalEventsCount = 15;
    const upcomingEventsCount = 8;
    const pastEventsCount = 7;
    const participantsCount = 128;

    // Custom card style
    const cardStyle = {
        borderRadius: '10px',
        boxShadow: '0 6px 10px rgba(0,0,0,0.08)',
        border: 'none',
        transition: 'all 0.3s ease',
        height: '100%',
        position: 'relative',
        overflow: 'hidden'
    };

    // Big icon style
    const iconStyle = {
        position: 'absolute',
        bottom: '-15px',
        right: '10px',
        fontSize: '80px',
        opacity: '0.2'
    };

    return (
        <Row className="justify-content-center mt-4">
            {/* First row with 4 cards */}
            <Col lg={3} md={6} sm={12} className="mb-4">
                <Card style={{...cardStyle, background: 'linear-gradient(135deg, #6a11cb 0%, #2575fc 100%)'}}>
                    <Card.Body className="text-white p-4">
                        <div className="d-flex justify-content-between align-items-start">
                            <div>
                                <h6 className="text-white-50 mb-2">Total Users</h6>
                                <h2 className="text-white display-4 font-weight-bold mb-0">{userCount}</h2>
                                <p className="mt-2 mb-0">
                                    <i className="feather icon-arrow-up text-success mr-1"></i>
                                    <span>12% increase</span>
                                </p>
                            </div>
                        </div>
                        <i className="feather icon-users" style={iconStyle}></i>
                    </Card.Body>
                </Card>
            </Col>

            <Col lg={3} md={6} sm={12} className="mb-4">
                <Card style={{...cardStyle, background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)'}}>
                    <Card.Body className="text-white p-4">
                        <div className="d-flex justify-content-between align-items-start">
                            <div>
                                <h6 className="text-white-50 mb-2">Total Events</h6>
                                <h2 className="text-white display-4 font-weight-bold mb-0">{totalEventsCount}</h2>
                                <p className="mt-2 mb-0">
                                    <i className="feather icon-arrow-up text-success mr-1"></i>
                                    <span>4 this month</span>
                                </p>
                            </div>
                        </div>
                        <i className="feather icon-calendar" style={iconStyle}></i>
                    </Card.Body>
                </Card>
            </Col>

            <Col lg={3} md={6} sm={12} className="mb-4">
                <Card style={{...cardStyle, background: 'linear-gradient(135deg, #FF8008 0%, #FFC837 100%)'}}>
                    <Card.Body className="text-white p-4">
                        <div className="d-flex justify-content-between align-items-start">
                            <div>
                                <h6 className="text-white-50 mb-2">Upcoming Events</h6>
                                <h2 className="text-white display-4 font-weight-bold mb-0">{upcomingEventsCount}</h2>
                                <p className="mt-2 mb-0">
                                    <i className="feather icon-calendar text-white mr-1"></i>
                                    <span>Next: Oct 15</span>
                                </p>
                            </div>
                        </div>
                        <i className="feather icon-trending-up" style={iconStyle}></i>
                    </Card.Body>
                </Card>
            </Col>

            <Col lg={3} md={6} sm={12} className="mb-4">
                <Card style={{...cardStyle, background: 'linear-gradient(135deg, #FF512F 0%, #F09819 100%)'}}>
                    <Card.Body className="text-white p-4">
                        <div className="d-flex justify-content-between align-items-start">
                            <div>
                                <h6 className="text-white-50 mb-2">Past Events</h6>
                                <h2 className="text-white display-4 font-weight-bold mb-0">{pastEventsCount}</h2>
                                <p className="mt-2 mb-0">
                                    <i className="feather icon-check-circle text-white mr-1"></i>
                                    <span>All successful</span>
                                </p>
                            </div>
                        </div>
                        <i className="feather icon-clock" style={iconStyle}></i>
                    </Card.Body>
                </Card>
            </Col>

        </Row>
    );
};

export default Default;