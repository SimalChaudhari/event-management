import React, { useState, useEffect } from 'react';
import { Row, Col, Card, ProgressBar, Badge, Alert, Table, Button, Spinner } from 'react-bootstrap';
import { toast } from 'react-toastify';
import dashboardService from '../../services/dashboardService';

const Default = () => {
    const [currentTime, setCurrentTime] = useState(new Date());
    const [loading, setLoading] = useState(true);
    const [dashboardData, setDashboardData] = useState(null);
    const [recentActivities, setRecentActivities] = useState([]);
    const [topEvents, setTopEvents] = useState([]);
    const [systemHealth, setSystemHealth] = useState(null);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    // Enhanced time formatting function with months and years
    const formatTimeAgo = (timestamp) => {
        const now = new Date();
        const activityTime = new Date(timestamp);
        const diffInSeconds = Math.floor((now - activityTime) / 1000);
        
        if (diffInSeconds < 60) {
            return 'now';
        } else if (diffInSeconds < 3600) {
            const minutes = Math.floor(diffInSeconds / 60);
            return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
        } else if (diffInSeconds < 86400) {
            const hours = Math.floor(diffInSeconds / 3600);
            return `${hours} hour${hours > 1 ? 's' : ''} ago`;
        } else if (diffInSeconds < 172800) {
            return 'yesterday';
        } else if (diffInSeconds < 2592000) { // 30 days
            const days = Math.floor(diffInSeconds / 86400);
            return `${days} day${days > 1 ? 's' : ''} ago`;
        } else if (diffInSeconds < 31536000) { // 365 days
            const months = Math.floor(diffInSeconds / 2592000);
            return `${months} month${months > 1 ? 's' : ''} ago`;
        } else {
            const years = Math.floor(diffInSeconds / 31536000);
            return `${years} year${years > 1 ? 's' : ''} ago`;
        }
    };

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const [stats, activities, topEvents, health] = await Promise.all([
                dashboardService.getDashboardStats(),
                dashboardService.getRecentActivities(),
                dashboardService.getTopEvents(),
                dashboardService.getSystemHealth(),
            ]);

            setDashboardData(stats.data);
            setRecentActivities(activities.data);
            setTopEvents(topEvents.data || []);
            setSystemHealth(health.data);
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            toast.error('Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    };

    // Custom card style
    const cardStyle = {
        borderRadius: '15px',
        boxShadow: '0 8px 25px rgba(0,0,0,0.1)',
        border: 'none',
        transition: 'all 0.3s ease',
        height: '100%',
        position: 'relative',
        overflow: 'hidden'
    };

    // Enhanced icon style
    const iconStyle = {
        position: 'absolute',
        bottom: '-20px',
        right: '15px',
        fontSize: '90px',
        opacity: '0.15',
        color: 'rgba(255,255,255,0.8)'
    };

    // System Health Component
    const SystemHealth = () => {
        if (!systemHealth) return null;

        return (
            <Card className="mb-4" style={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.08)'}}>
                <Card.Body>
                    <h6 className="mb-3">
                        <i className="feather icon-activity mr-2"></i>
                        System Health
                    </h6>
                    <Row>
                        <Col md={3} className="mb-3">
                            <div className="d-flex align-items-center">
                                <div className="bg-success rounded-circle mr-2" style={{width: '10px', height: '10px'}}></div>
                                <div>
                                    <small className="text-muted">Server</small>
                                    <div><strong>{systemHealth.server}</strong></div>
                                </div>
                            </div>
                        </Col>
                        <Col md={3} className="mb-3">
                            <div className="d-flex align-items-center">
                                <div className="bg-success rounded-circle mr-2" style={{width: '10px', height: '10px'}}></div>
                                <div>
                                    <small className="text-muted">Database</small>
                                    <div><strong>{systemHealth.database}</strong></div>
                                </div>
                            </div>
                        </Col>
                        <Col md={3} className="mb-3">
                            <div className="d-flex align-items-center">
                                <div className="bg-success rounded-circle mr-2" style={{width: '10px', height: '10px'}}></div>
                                <div>
                                    <small className="text-muted">API</small>
                                    <div><strong>{systemHealth.api}</strong></div>
                                </div>
                            </div>
                        </Col>
                        <Col md={3} className="mb-3">
                            <div className="d-flex align-items-center">
                                <div className="bg-success rounded-circle mr-2" style={{width: '10px', height: '10px'}}></div>
                                <div>
                                    <small className="text-muted">SSL</small>
                                    <div><strong>{systemHealth.ssl}</strong></div>
                                </div>
                            </div>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>
        );
    };

    // Recent Activities Component
    const RecentActivities = () => {
        return (
            <Card className='h-100' style={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.08)'}}>
                <Card.Body>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <h6 className="mb-0">
                            <i className="feather icon-clock mr-2"></i>
                            Recent Activities
                        </h6>
                        <Button variant="outline-primary" size="sm" onClick={fetchDashboardData}>
                            <i className="feather icon-refresh-cw mr-1"></i>
                            Refresh
                        </Button>
                    </div>
                    <div>
                        {recentActivities.map((activity) => (
                            <div key={activity.id} className="d-flex align-items-center mb-3 p-2" style={{borderRadius: '8px', backgroundColor: '#f8f9fa'}}>
                                <div className={`bg-${activity.status} rounded-circle mr-3`} style={{width: '8px', height: '8px'}}></div>
                                <div className="flex-grow-1">
                                    <div className="d-flex justify-content-between">
                                        <strong>{activity.action}</strong>
                                        <small className="text-muted">
                                            {formatTimeAgo(activity.time)}
                                        </small>
                                    </div>
                                    <small className="text-muted">{activity.title}</small>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card.Body>
            </Card>
        );
    };

    // Top Events Component
    const TopEvents = () => {
        return (
            <Card className='h-100' style={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.08)'}}>
                <Card.Body>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <h6 className="mb-0">
                            <i className="feather icon-star mr-2"></i>
                            Top Performing Events
                        </h6>
                        <Button variant="outline-primary" size="sm" onClick={fetchDashboardData}>
                            <i className="feather icon-refresh-cw mr-1"></i>
                            Refresh
                        </Button>
                    </div>
                    {topEvents.length > 0 ? (
                        <Table responsive className="mb-0">
                            <thead>
                                <tr>
                                    <th>Event</th>
                                    <th>Participants</th>
                                    <th>Revenue</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {topEvents.map((event, index) => (
                                    <tr key={event.id}>
                                        <td>
                                            <div>
                                                <strong>{event.name}</strong>
                                                <div><small className="text-muted">#{index + 1} Top Event</small></div>
                                            </div>
                                        </td>
                                        <td>
                                            <Badge variant="info">{event.totalAttendance}</Badge>
                                        </td>
                                        <td>
                                            <strong>₹{event.totalRevenue.toLocaleString()}</strong>
                                        </td>
                                        <td>
                                            <Badge variant={event.isUpcoming ? 'warning' : 'success'}>
                                                {event.isUpcoming ? 'Upcoming' : 'Completed'}
                                            </Badge>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    ) : (
                        <div className="text-center py-4">
                            <i className="feather icon-calendar text-muted" style={{fontSize: '48px'}}></i>
                            <p className="text-muted mt-2">No events found</p>
                        </div>
                    )}
                </Card.Body>
            </Card>
        );
    };

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{height: '60vh'}}>
                <div className="text-center">
                    <Spinner animation="border" variant="primary" />
                    <p className="mt-3">Loading dashboard data...</p>
                </div>
            </div>
        );
    }

    if (!dashboardData) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{height: '60vh'}}>
                <div className="text-center">
                    <i className="feather icon-alert-circle text-danger" style={{fontSize: '48px'}}></i>
                    <p className="mt-3">Failed to load dashboard data</p>
                    <Button variant="primary" onClick={fetchDashboardData}>
                        Retry
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4">
            {/* System Health */}
            <SystemHealth />

            {/* Main Dashboard Cards */}
            <Row className="justify-content-center">
                <Col lg={3} md={6} sm={12} className="mb-4">
                    <Card style={{...cardStyle, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'}}>
                        <Card.Body className="text-white p-4">
                            <div className="d-flex justify-content-between align-items-start">
                                <div>
                                    <h6 className="text-white-50 mb-2">Total Users</h6>
                                    <h2 className="text-white display-4 font-weight-bold mb-0">
                                        {dashboardData.users.total.toLocaleString()}
                                    </h2>
                                    <div className="mt-2">
                                        <div className="d-flex align-items-center mb-2" style={{gap: '20px'}}>
                                            <small className="text-white-75">
                                                <i className="feather icon-user-check mr-1"></i>
                                                Verified: {dashboardData.users.active.toLocaleString()}
                                            </small>
                                            <small className="text-white-75">
                                                <i className="feather icon-user-x mr-1"></i>
                                                Unverified: {(dashboardData.users.total - dashboardData.users.active).toLocaleString()}
                                            </small>
                                        </div>
                                       
                                        <ProgressBar 
                                            now={dashboardData.users.active} 
                                            max={dashboardData.users.total}
                                            className="mt-2"
                                            style={{height: '4px', backgroundColor: 'rgba(255,255,255,0.2)'}}
                                        />
                                       
                                    </div>
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
                                    <h2 className="text-white display-4 font-weight-bold mb-0">
                                        {dashboardData.events.total}
                                    </h2>
                                    <div className="mt-2">
                                        <small className="text-white-75">
                                            <i className="feather icon-calendar text-white mr-1"></i>
                                            {dashboardData.events.thisMonth} this month
                                        </small>
                                        <div className="mt-2">
                                            <Badge variant="light" className="mr-1">
                                                {dashboardData.events.upcoming} Upcoming
                                            </Badge>
                                           
                                        </div>
                                    </div>
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
                                    <h6 className="text-white-50 mb-2">Total Revenue</h6>
                                    <h2 className="text-white display-4 font-weight-bold mb-0">
                                        ${dashboardData.revenue.total.toLocaleString()}
                                    </h2>
                                   
                                </div>
                            </div>
                            <i className="feather icon-dollar-sign" style={iconStyle}></i>
                        </Card.Body>
                    </Card>
                </Col>

                <Col lg={3} md={6} sm={12} className="mb-4">
                    <Card style={{...cardStyle, background: 'linear-gradient(135deg, #FF512F 0%, #F09819 100%)'}}>
                        <Card.Body className="text-white p-4">
                            <div className="d-flex justify-content-between align-items-start">
                                <div>
                                    <h6 className="text-white-50 mb-2">Participants</h6>
                                    <h2 className="text-white display-4 font-weight-bold mb-0">
                                        {dashboardData.participants.total.toLocaleString()}
                                    </h2>
                                    
                                </div>
                            </div>
                            <i className="feather icon-user-check" style={iconStyle}></i>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Additional Features */}
            <Row className="mt-4">
                <Col lg={6} md={12} className="mb-4">
                    <RecentActivities />
                </Col>

                <Col lg={6} md={12} className="mb-4">
                    <TopEvents />
                </Col>
            </Row>
        </div>
    );
};

export default Default;