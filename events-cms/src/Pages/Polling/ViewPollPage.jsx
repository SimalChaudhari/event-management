import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Row, Col, Badge, Nav, Tab } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import { getPollById, togglePollLive, getAllPollsForAdmin } from '../../store/actions/pollingActions';
import { POLLING_PATHS } from '../../utils/constants';
import DateTimeFormatter from '../../components/dateTime/DateTimeFormatter';
import '../../assets/css/event.css';

const ViewPollPage = () => {
    const { id } = useParams();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    
    const { pollById, loading } = useSelector((state) => state.polling);
    const [activeTab, setActiveTab] = useState('details');

    useEffect(() => {
        if (id) {
            dispatch(getPollById(id));
        }
    }, [dispatch, id]);


    const handleBack = () => {
        navigate(POLLING_PATHS.LIST_POLLS);
    };

    if (loading) return <div>Loading...</div>;
    if (!pollById) return <div>No poll found.</div>;

    const poll = pollById.question;
    const event = pollById.event;
    const speaker = pollById.speaker;
    const createdBy = pollById.createdBy;
    const totalVotes = poll?.options?.reduce((sum, opt) => sum + opt.voteCount, 0) || 0;

    // Get icon color helper
    const getIconColor = (iconClass) => {
        const colorMap = {
            'fas fa-question-circle': '#007bff',
            'fas fa-info-circle': '#17a2b8',
            'fas fa-calendar': '#007bff',
            'fas fa-mic': '#17a2b8',
            'fas fa-clock': '#ffc107',
            'fas fa-user': '#28a745',
            'fas fa-calendar-plus': '#20c997',
            'fas fa-edit': '#fd7e14',
            'fas fa-check-circle': '#28a745',
            'fas fa-pie-chart': '#007bff',
            'fas fa-users': '#17a2b8'
        };
        return colorMap[iconClass] || '#495057';
    };

    // InfoCard component - same as Event
    const InfoCard = ({ title, iconClass, children, borderColor = '#4680ff', className = '' }) => (
        <div
            className={`mb-4 ${className}`}
            style={{
                backgroundColor: '#fff',
                borderRadius: '8px',
                padding: '20px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                border: '1px solid #e9ecef',
                borderLeft: `4px solid ${borderColor}`
            }}
        >
            <div style={{ padding: '24px' }}>
                <h5
                    style={{
                        fontSize: '18px',
                        fontWeight: '600',
                        color: '#2c3e50',
                        marginBottom: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        borderBottom: `2px solid ${borderColor}`,
                        paddingBottom: '8px',
                        position: 'relative'
                    }}
                >
                    <i className={iconClass} style={{ fontSize: '20px', color: getIconColor(iconClass) }}></i>
                    {title}
                </h5>
                {children}
            </div>
        </div>
    );

    const InfoField = ({ label, value, iconClass = null }) => (
        <div
            className="info-field-container mb-2 py-2"
            style={{
                borderBottom: '1px solid #f1f1f1'
            }}
        >
            <span className="field-label" style={{ fontWeight: 'bold', color: '#495057', fontSize: '14px' }}>
                {iconClass && <i className={iconClass} style={{ marginRight: '8px', color: getIconColor(iconClass) }}></i>}
                {label}:
            </span>
            <span className="field-value" style={{ color: '#212529', fontWeight: 'normal', fontSize: '15px' }}>
                {value}
            </span>
        </div>
    );

    const renderPollStats = () => (
        <Row>
            <Col xs={6} md={3} className="mb-3">
                <div
                    className="text-center p-3"
                    style={{ backgroundColor: '#f8f9fa', borderRadius: '8px', border: '1px solid #e9ecef', padding: '20px' }}
                >
                    <i className="fas fa-chart-bar text-primary mb-2" style={{ fontSize: '1.5rem' }}></i>
                    <h6 className="mb-1" style={{ color: '#495057', fontSize: '0.9rem' }}>
                        Total Votes
                    </h6>
                    <p className="mb-0" style={{ fontSize: '0.95rem', fontWeight: '500', color: '#28a745' }}>
                        {totalVotes}
                    </p>
                </div>
            </Col>
            <Col xs={6} md={3} className="mb-3">
                <div
                    className="text-center p-3"
                    style={{ backgroundColor: '#f8f9fa', borderRadius: '8px', border: '1px solid #e9ecef', padding: '20px' }}
                >
                    <i className="fas fa-users text-primary mb-2" style={{ fontSize: '1.5rem' }}></i>
                    <h6 className="mb-1" style={{ color: '#495057', fontSize: '0.9rem' }}>
                        Voters
                    </h6>
                    <p className="mb-0" style={{ fontSize: '0.95rem', fontWeight: '500' }}>
                        {poll?.totalVoters || 0}
                    </p>
                </div>
            </Col>
            <Col xs={6} md={3} className="mb-3">
                <div
                    className="text-center p-3"
                    style={{ backgroundColor: '#f8f9fa', borderRadius: '8px', border: '1px solid #e9ecef', padding: '20px' }}
                >
                    <i className="fas fa-list text-primary mb-2" style={{ fontSize: '1.5rem' }}></i>
                    <h6 className="mb-1" style={{ color: '#495057', fontSize: '0.9rem' }}>
                        Options
                    </h6>
                    <p className="mb-0" style={{ fontSize: '0.95rem', fontWeight: '500' }}>
                        {poll?.options?.length || 0}
                    </p>
                </div>
            </Col>
            <Col xs={6} md={3} className="mb-3">
                <div
                    className="text-center p-3"
                    style={{ backgroundColor: '#f8f9fa', borderRadius: '8px', border: '1px solid #e9ecef', padding: '20px' }}
                >
                    <i className={`fas ${poll?.isLive ? 'fa-check-circle' : 'fa-times-circle'} mb-2`} 
                       style={{ fontSize: '1.5rem', color: poll?.isLive ? '#28a745' : '#6c757d' }}></i>
                    <h6 className="mb-1" style={{ color: '#495057', fontSize: '0.9rem' }}>
                        Status
                    </h6>
                    <div className="mb-0">
                        <Badge bg={poll?.isLive ? 'success' : 'secondary'} className="px-3 py-1">
                            {poll?.isLive ? 'Live' : 'Offline'}
                        </Badge>
                    </div>
                </div>
            </Col>
        </Row>
    );

    return (
        <>
            <div className="mt-4">
                {/* Header with Stats - Same as Event */}
                <div
                    className="mb-3"
                    style={{ backgroundColor: '#fff', borderRadius: '8px', padding: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
                >
                    <div className="d-flex justify-content-between align-items-center">
                        <h4 className="card-title">View Poll</h4>
                        <div className="d-flex gap-2">
                            <Button variant="secondary" onClick={handleBack}>
                                <i className="fas fa-arrow-left" style={{ marginRight: '8px' }}></i>
                                Back
                            </Button>
                        </div>
                    </div>
                    <hr />
                    {renderPollStats()}
                </div>

                {/* Main Content with Tabs - Same as Event */}
                <div style={{ backgroundColor: '#fff', borderRadius: '8px', padding: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                    <Tab.Container id="poll-tabs" defaultActiveKey="details">
                        <Row>
                            <Col sm={12}>
                                <Nav variant="tabs" className="mb-3">
                                    <Nav.Item>
                                        <Nav.Link eventKey="details">
                                            <i className="fas fa-info-circle me-2" style={{ color: '#4680ff', marginRight: 6 }}></i>
                                            Poll Details
                                        </Nav.Link>
                                    </Nav.Item>
                                    <Nav.Item>
                                        <Nav.Link eventKey="results">
                                            <i className="fas fa-chart-pie me-2" style={{ color: '#4680ff', marginRight: 6 }}></i>
                                            Results & Analytics
                                        </Nav.Link>
                                    </Nav.Item>
                                    <Nav.Item>
                                        <Nav.Link eventKey="voters">
                                            <i className="fas fa-users me-2" style={{ color: '#4680ff', marginRight: 6 }}></i>
                                            Voter Details
                                        </Nav.Link>
                                    </Nav.Item>
                                </Nav>
                            </Col>
                        </Row>

                        <Tab.Content>
                            {/* Poll Details Tab */}
                            <Tab.Pane eventKey="details">
                                <div className="p-2 bg-light">
                                    {/* Poll Overview */}
                                    <InfoCard title="Poll Overview" iconClass="fas fa-info-circle" borderColor="#3498db">
                                        <Row>
                                            <Col lg={6} md={12}>
                                                <div style={{ fontSize: '15px', lineHeight: '1.6' }}>
                                                    <InfoField 
                                                        label="Event Name" 
                                                        value={event?.name || 'N/A'} 
                                                        iconClass="fas fa-calendar" 
                                                    />
                                                    <InfoField 
                                                        label="Speaker" 
                                                        value={speaker?.name || 'No Speaker'} 
                                                        iconClass="fas fa-mic" 
                                                    />
                                                    <InfoField 
                                                        label="Timer Duration" 
                                                        value={
                                                            <Badge bg="warning" text="dark" className="px-3 py-1">
                                                                {poll?.timerSeconds || 30} seconds
                                                            </Badge>
                                                        } 
                                                        iconClass="fas fa-clock" 
                                                    />
                                                </div>
                                            </Col>
                                            <Col lg={6} md={12}>
                                                <div style={{ fontSize: '15px', lineHeight: '1.6' }}>
                                                    <InfoField 
                                                        label="Poll Status" 
                                                        value={
                                                            <Badge bg={poll?.isLive ? 'success' : 'secondary'} className="px-3 py-1">
                                                                {poll?.isLive ? 'Live' : 'Offline'}
                                                                <i className={`fas ${poll?.isLive ? 'fa-check-circle' : 'fa-times-circle'} ms-2`}></i>
                                                            </Badge>
                                                        } 
                                                        iconClass="fas fa-check-circle" 
                                                    />
                                                    <InfoField 
                                                        label="Created By" 
                                                        value={createdBy?.name || 'N/A'} 
                                                        iconClass="fas fa-user" 
                                                    />
                                                    <InfoField 
                                                        label="Created At" 
                                                        value={<DateTimeFormatter date={poll?.createdAt} />} 
                                                        iconClass="fas fa-calendar-plus" 
                                                    />
                                                    {poll?.updatedAt && poll?.updatedAt !== poll?.createdAt && (
                                                        <InfoField 
                                                            label="Last Updated" 
                                                            value={<DateTimeFormatter date={poll?.updatedAt} />} 
                                                            iconClass="fas fa-edit" 
                                                        />
                                                    )}
                                                </div>
                                            </Col>
                                            <Col lg={12} md={12}>
                                                <div className="mb-2 py-2" style={{ borderBottom: '1px solid #f1f1f1' }}>
                                                    <div style={{ fontWeight: 'bold', color: '#495057', fontSize: '14px', marginBottom: '8px' }}>
                                                        <i className="fas fa-question-circle" style={{ marginRight: '8px', color: '#007bff' }}></i>
                                                        Poll Question:
                                                    </div>
                                                    <div style={{ color: '#212529', lineHeight: '1.6', fontSize: '15px', padding: '12px', backgroundColor: '#f0f8ff', borderRadius: '6px', borderLeft: '3px solid #007bff' }}>
                                                        {poll?.question}
                                                    </div>
                                                </div>
                                            </Col>
                                        </Row>
                                    </InfoCard>
                                </div>
                            </Tab.Pane>

                            {/* Results & Analytics Tab */}
                            <Tab.Pane eventKey="results">
                                <div className="p-2">
                                    {/* Vote Distribution Chart */}
                                    <InfoCard title="Vote Distribution" iconClass="fas fa-pie-chart" borderColor="#28a745">
                                        <Row>
                                            <Col lg={8} md={12}>
                                                {poll?.options && poll.options.length > 0 ? (
                                                    <div className="vote-options-container">
                                                        {poll.options.map((option, index) => {
                                                            const percentage = totalVotes > 0
                                                                ? Math.round((option.voteCount / totalVotes) * 100)
                                                                : 0;

                                                            return (
                                                                <div key={option.id} className="vote-option-item">
                                                                    {/* Option Header */}
                                                                    <div className="vote-option-header">
                                                                        <div className="option-info">
                                                                            <Badge 
                                                                                bg="primary" 
                                                                                style={{ 
                                                                                    fontSize: '12px', 
                                                                                    padding: '4px 8px', 
                                                                                    minWidth: '32px',
                                                                                    fontWeight: '600',
                                                                                    borderRadius: '12px'
                                                                                }}
                                                                            >
                                                                                {String.fromCharCode(65 + index)}
                                                                            </Badge>
                                                                            <div className="option-text">
                                                                                <strong style={{ 
                                                                                    fontSize: '14px', 
                                                                                    color: '#2c3e50',
                                                                                    lineHeight: '1.3',
                                                                                    marginLeft: '8px'
                                                                                }}>
                                                                                    {option.optionText}
                                                                                </strong>
                                                                            </div>
                                                                        </div>
                                                                        <div className="vote-stats">
                                                                            <div className="vote-count">
                                                                                <span style={{ 
                                                                                    fontSize: '16px', 
                                                                                    fontWeight: '700', 
                                                                                    color: '#495057',
                                                                                    marginRight: '4px'
                                                                                }}>
                                                                                    {option.voteCount}
                                                                                </span>
                                                                                <span style={{ 
                                                                                    fontSize: '10px', 
                                                                                    color: '#6c757d',
                                                                                    textTransform: 'uppercase',
                                                                                    letterSpacing: '0.5px'
                                                                                }}>
                                                                                    votes
                                                                                </span>
                                                                            </div>
                                                                            <Badge 
                                                                                bg={percentage >= 50 ? 'success' : percentage >= 25 ? 'info' : 'warning'}
                                                                                style={{ 
                                                                                    fontSize: '12px', 
                                                                                    padding: '4px 12px', 
                                                                                    minWidth: '50px',
                                                                                    fontWeight: '600',
                                                                                    borderRadius: '12px'
                                                                                }}
                                                                            >
                                                                                {percentage}%
                                                                            </Badge>
                                                                        </div>
                                                                    </div>
                                                                    
                                                                    {/* Progress Bar */}
                                                                    <div className="progress-container">
                                                                        <div 
                                                                            className="progress" 
                                                                            style={{ 
                                                                                height: '12px', 
                                                                                borderRadius: '6px',
                                                                                backgroundColor: '#e9ecef',
                                                                                overflow: 'hidden',
                                                                                boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.1)'
                                                                            }}
                                                                        >
                                                                            <div
                                                                                className={`progress-bar ${
                                                                                    percentage >= 50 ? 'bg-success' : percentage >= 25 ? 'bg-info' : 'bg-warning'
                                                                                }`}
                                                                                role="progressbar"
                                                                                style={{ 
                                                                                    width: `${percentage}%`,
                                                                                    transition: 'width 0.6s ease-in-out',
                                                                                    borderRadius: '6px'
                                                                                }}
                                                                                aria-valuenow={percentage}
                                                                                aria-valuemin="0"
                                                                                aria-valuemax="100"
                                                                            >
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                ) : (
                                                    <div className="text-center py-5">
                                                        <i className="fas fa-inbox" style={{ fontSize: '4rem', color: '#dee2e6', marginBottom: '20px' }}></i>
                                                        <h5 className="text-muted mb-2">No Options Available</h5>
                                                        <p className="text-muted mb-0">This poll doesn't have any voting options configured.</p>
                                                    </div>
                                                )}
                                            </Col>
                                            
                                            {/* Summary Statistics Sidebar */}
                                            <Col lg={4} md={12} className="mt-lg-0 mt-4">
                                                <div 
                                                    className="summary-stats-card"
                                                    style={{ 
                                                        backgroundColor: '#ffffff', 
                                                        borderRadius: '8px', 
                                                        padding: '16px', 
                                                        border: '1px solid #e9ecef',
                                                        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                                                        height: 'fit-content'
                                                    }}
                                                >
                                                    <div className="d-flex align-items-center mb-3">
                                                        <div 
                                                            style={{ 
                                                                backgroundColor: '#007bff', 
                                                                borderRadius: '6px', 
                                                                padding: '6px', 
                                                                marginRight: '10px'
                                                            }}
                                                        >
                                                            <i className="fas fa-chart-line text-white" style={{ fontSize: '14px' }}></i>
                                                        </div>
                                                        <h6 className="mb-0" style={{ fontSize: '16px', fontWeight: '600', color: '#2c3e50' }}>
                                                            Summary Statistics
                                                        </h6>
                                                    </div>
                                                    
                                                    {/* Stats Items */}
                                                    <div className="stats-items">
                                                        <div className="stat-item">
                                                            <div className="stat-icon">
                                                                <i className="fas fa-vote-yea text-primary"></i>
                                                            </div>
                                                            <div className="stat-content">
                                                                <div className="stat-label">Total Votes</div>
                                                                <div className="stat-value text-primary">{totalVotes}</div>
                                                            </div>
                                                        </div>
                                                        
                                                        <div className="stat-item">
                                                            <div className="stat-icon">
                                                                <i className="fas fa-users text-success"></i>
                                                            </div>
                                                            <div className="stat-content">
                                                                <div className="stat-label">Unique Voters</div>
                                                                <div className="stat-value text-success">{poll?.totalVoters || 0}</div>
                                                            </div>
                                                        </div>
                                                        
                                                        <div className="stat-item">
                                                            <div className="stat-icon">
                                                                <i className="fas fa-percentage text-info"></i>
                                                            </div>
                                                            <div className="stat-content">
                                                                <div className="stat-label">Participation Rate</div>
                                                                <div className="stat-value text-info">{totalVotes > 0 ? '100%' : '0%'}</div>
                                                            </div>
                                                        </div>
                                                        
                                                        <div className="stat-item">
                                                            <div className="stat-icon">
                                                                <i className="fas fa-list text-warning"></i>
                                                            </div>
                                                            <div className="stat-content">
                                                                <div className="stat-label">Total Options</div>
                                                                <div className="stat-value text-warning">{poll?.options?.length || 0}</div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </Col>
                                        </Row>
                                    </InfoCard>
                                </div>
                            </Tab.Pane>

                            {/* Voters Details Tab */}
                            <Tab.Pane eventKey="voters">
                                <div className="p-2 bg-light">
                                    <InfoCard title="Voter Information" iconClass="fas fa-users" borderColor="#6f42c1">
                                        {poll?.options?.some(opt => opt.voters?.length > 0) ? (
                                            <div className="table-responsive">
                                                <table className="table table-hover table-striped">
                                                    <thead>
                                                        <tr>
                                                            <th style={{ width: '5%' }}>#</th>
                                                            <th style={{ width: '25%' }}>Voter Name</th>
                                                            <th style={{ width: '30%' }}>Email</th>
                                                            <th style={{ width: '25%' }}>Selected Option</th>
                                                            <th style={{ width: '15%' }}>Voted At</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {poll.options.flatMap((option, optIndex) =>
                                                            option.voters?.map((voter, voterIndex) => (
                                                                <tr key={`${optIndex}-${voterIndex}`}>
                                                                    <td>{voterIndex + 1}</td>
                                                                    <td>
                                                                        <i className="fas fa-user text-primary me-2"></i>
                                                                        {voter.user?.fullName || 'N/A'}
                                                                    </td>
                                                                    <td>{voter.user?.email || 'N/A'}</td>
                                                                    <td>
                                                                        <Badge bg="light" text="dark" className="me-2">
                                                                            {String.fromCharCode(65 + optIndex)}
                                                                        </Badge>
                                                                        {option.optionText}
                                                                    </td>
                                                                    <td>
                                                                        <DateTimeFormatter date={voter.votedAt} />
                                                                    </td>
                                                                </tr>
                                                            )) || []
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>
                                        ) : (
                                            <div className="text-center py-5">
                                                <i className="fas fa-inbox" style={{ fontSize: '3rem', color: '#ccc' }}></i>
                                                <p className="text-muted mt-3 mb-0">No votes yet</p>
                                                <small className="text-muted">Votes will appear here once users start voting</small>
                                            </div>
                                        )}
                                    </InfoCard>
                                </div>
                            </Tab.Pane>
                        </Tab.Content>
                    </Tab.Container>
                </div>
            </div>

            {/* Custom CSS for Responsive Behavior */}
            <style jsx>{`
                /* Desktop: side-by-side layout */
                .info-field-container {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .field-label {
                    min-width: 140px;
                }

                .field-value {
                    text-align: right;
                    flex: 1;
                }

                /* Results & Analytics Styles */
                .vote-options-container {
                    padding: 8px 0;
                }

                .vote-option-item {
                    margin-bottom: 16px;
                    padding: 12px;
                    background: #ffffff;
                    border: 1px solid #e9ecef;
                    border-radius: 8px;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
                    transition: all 0.3s ease;
                }

                .vote-option-item:hover {
                    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
                    transform: translateY(-2px);
                }

                .vote-option-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 8px;
                }

                .option-info {
                    display: flex;
                    align-items: center;
                    flex: 1;
                    min-width: 0;
                }

                .vote-stats {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    flex-shrink: 0;
                }

                .vote-count {
                    display: flex;
                    align-items: baseline;
                    gap: 4px;
                }

                .progress-container {
                    margin-top: 4px;
                }

                /* Summary Statistics Styles */
                .stats-items {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }

                .stat-item {
                    display: flex;
                    align-items: center;
                    padding: 10px;
                    background: #f8f9fa;
                    border-radius: 6px;
                    border: 1px solid #e9ecef;
                    transition: all 0.3s ease;
                }

                .stat-item:hover {
                    background: #e9ecef;
                    transform: translateX(4px);
                }

                .stat-icon {
                    width: 32px;
                    height: 32px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: #ffffff;
                    border-radius: 6px;
                    margin-right: 12px;
                    box-shadow: 0 1px 2px rgba(0,0,0,0.1);
                }

                .stat-icon i {
                    font-size: 14px;
                }

                .stat-content {
                    flex: 1;
                }

                .stat-label {
                    font-size: 12px;
                    color: #6c757d;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    margin-bottom: 4px;
                    font-weight: 500;
                }

                .stat-value {
                    font-size: 16px;
                    font-weight: 700;
                    margin: 0;
                }

                /* Mobile: stacked layout */
                @media (max-width: 768px) {
                    .info-field-container {
                        display: block !important;
                        text-align: left !important;
                    }

                    .field-label {
                        display: block !important;
                        min-width: auto !important;
                        margin-bottom: 4px !important;
                        font-size: 15px !important;
                        color: #495057 !important;
                    }

                    .field-value {
                        display: block !important;
                        text-align: left !important;
                        font-size: 16px !important;
                        font-weight: 600 !important;
                        color: #212529 !important;
                        padding-left: 0 !important;
                        margin-left: 0 !important;
                    }

                    .vote-option-header {
                        flex-direction: column;
                        align-items: flex-start;
                        gap: 12px;
                    }

                    .vote-stats {
                        align-self: flex-end;
                    }

                    .option-info {
                        width: 100%;
                    }

                    .option-text strong {
                        margin-left: 0 !important;
                        margin-top: 8px;
                        display: block;
                    }

                    .stats-items {
                        gap: 16px;
                    }

                    .stat-item {
                        padding: 12px;
                    }

                    .stat-icon {
                        width: 36px;
                        height: 36px;
                        margin-right: 12px;
                    }

                    .stat-icon i {
                        font-size: 16px;
                    }

                    .stat-value {
                        font-size: 18px;
                    }
                }

                @media (max-width: 576px) {
                    .field-label {
                        font-size: 14px !important;
                    }

                    .field-value {
                        font-size: 15px !important;
                    }

                    .vote-option-item {
                        padding: 16px;
                        margin-bottom: 24px;
                    }

                    .vote-option-header {
                        gap: 8px;
                    }

                    .vote-stats {
                        gap: 12px;
                    }

                    .vote-count span:first-child {
                        font-size: 16px !important;
                    }

                    .vote-count span:last-child {
                        font-size: 11px !important;
                    }

                    .stat-item {
                        padding: 10px;
                    }

                    .stat-icon {
                        width: 32px;
                        height: 32px;
                        margin-right: 10px;
                    }

                    .stat-icon i {
                        font-size: 14px;
                    }

                    .stat-value {
                        font-size: 16px;
                    }
                }
            `}</style>
        </>
    );
};

export default ViewPollPage;
