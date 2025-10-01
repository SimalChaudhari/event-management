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

    const handleToggleLive = async () => {
        try {
            await dispatch(togglePollLive(id));
            dispatch(getPollById(id));
        } catch (error) {
            console.error('Error toggling poll status:', error);
        }
    };

    const handleEdit = () => {
        navigate(`${POLLING_PATHS.EDIT_POLL}/${id}`);
    };

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
                            <Button 
                                variant={poll?.isLive ? 'success' : 'secondary'} 
                                onClick={handleToggleLive}
                            >
                                <i className={`fas ${poll?.isLive ? 'fa-pause' : 'fa-play'}`} style={{ marginRight: '8px' }}></i>
                                {poll?.isLive ? 'Live' : 'Go Live'}
                            </Button>
                            <Button variant="primary" onClick={handleEdit}>
                                <i className="fas fa-edit" style={{ marginRight: '8px' }}></i>
                                Edit
                            </Button>
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
                                <div className="p-2 bg-light">
                                    <InfoCard title="Vote Distribution" iconClass="fas fa-pie-chart" borderColor="#28a745">
                                        <Row>
                                            <Col lg={8} md={12}>
                                                {poll?.options && poll.options.length > 0 ? (
                                                    poll.options.map((option, index) => {
                                                        const percentage = totalVotes > 0
                                                            ? Math.round((option.voteCount / totalVotes) * 100)
                                                            : 0;

                                                        return (
                                                            <div key={option.id} className="mb-3">
                                                                <div className="d-flex justify-content-between align-items-center mb-2">
                                                                    <div className="d-flex align-items-center gap-2" style={{ flex: '1', minWidth: '0' }}>
                                                                        <Badge bg="light" text="dark" style={{ fontSize: '0.9rem', padding: '6px 12px', minWidth: '40px', flexShrink: '0' }}>
                                                                            {String.fromCharCode(65 + index)}
                                                                        </Badge>
                                                                        <strong style={{ fontSize: '0.95rem', wordWrap: 'break-word', overflowWrap: 'break-word' }}>
                                                                            {option.optionText}
                                                                        </strong>
                                                                    </div>
                                                                    <div className="d-flex align-items-center gap-2" style={{ flexShrink: '0', marginLeft: '10px' }}>
                                                                        <span className="text-muted" style={{ fontSize: '0.85rem' }}>
                                                                            {option.voteCount}
                                                                        </span>
                                                                        <Badge bg="primary" style={{ fontSize: '0.85rem', padding: '6px 12px', minWidth: '55px' }}>
                                                                            {percentage}%
                                                                        </Badge>
                                                                    </div>
                                                                </div>
                                                                <div className="progress" style={{ height: '24px', borderRadius: '5px' }}>
                                                                    <div
                                                                        className={`progress-bar ${
                                                                            percentage >= 50 ? 'bg-success' : percentage >= 25 ? 'bg-info' : 'bg-warning'
                                                                        }`}
                                                                        role="progressbar"
                                                                        style={{ width: `${percentage}%`, fontSize: '0.85rem' }}
                                                                        aria-valuenow={percentage}
                                                                        aria-valuemin="0"
                                                                        aria-valuemax="100"
                                                                    >
                                                                        {percentage}%
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })
                                                ) : (
                                                    <div className="text-center py-4">
                                                        <i className="fas fa-inbox" style={{ fontSize: '3rem', color: '#ccc' }}></i>
                                                        <p className="text-muted mt-3">No options available</p>
                                                    </div>
                                                )}
                                            </Col>
                                            <Col lg={4} md={12}>
                                                <div style={{ backgroundColor: '#f8f9fa', borderRadius: '8px', padding: '20px', border: '1px solid #e9ecef' }}>
                                                    <h6 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: '#2c3e50' }}>
                                                        <i className="fas fa-chart-line text-primary me-2"></i>
                                                        Summary Statistics
                                                    </h6>
                                                    <div className="mb-3 pb-3" style={{ borderBottom: '1px solid #dee2e6' }}>
                                                        <small className="text-muted d-block mb-1">Total Responses</small>
                                                        <h4 className="mb-0 text-primary">{totalVotes}</h4>
                                                    </div>
                                                    <div className="mb-3 pb-3" style={{ borderBottom: '1px solid #dee2e6' }}>
                                                        <small className="text-muted d-block mb-1">Unique Voters</small>
                                                        <h4 className="mb-0 text-success">{poll?.totalVoters || 0}</h4>
                                                    </div>
                                                    <div>
                                                        <small className="text-muted d-block mb-1">Response Rate</small>
                                                        <h4 className="mb-0 text-info">{totalVotes > 0 ? '100%' : '0%'}</h4>
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

            {/* Custom CSS for Responsive Behavior - Same as Event */}
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
                }

                @media (max-width: 576px) {
                    .field-label {
                        font-size: 14px !important;
                    }

                    .field-value {
                        font-size: 15px !important;
                    }
                }
            `}</style>
        </>
    );
};

export default ViewPollPage;
