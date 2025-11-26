import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Button, Row, Col, Badge, Nav, Tab, Container } from 'react-bootstrap';
import { useDispatch } from 'react-redux';
import { registerEventById } from '../../../store/actions/eventActions';
import { EVENT_PATHS } from '../../../utils/constants';
import EventBasicComponent from '../../../components/events/EventBasicComponent';

const ViewRegisterEventPage = () => {
    const { id } = useParams();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();
    const [eventData, setEventData] = useState(null);
    const [loading, setLoading] = useState(true);

    // Get current registration page from URL for preservation
    const [registrationPageFromUrl, setRegistrationPageFromUrl] = useState(null);
    
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search || location.search);
        const pageParam = urlParams.get('page');
        if (pageParam) {
            setRegistrationPageFromUrl(pageParam);
        } else {
            if (location.state?.page) {
                setRegistrationPageFromUrl(location.state.page);
            }
        }
    }, [location.search, location.state]);

    // Custom handleBack that uses the captured page parameter
    const handleBack = useCallback(() => {
        const urlParams = new URLSearchParams(window.location.search || location.search);
        const pageFromUrl = urlParams.get('page');
        const currentPage = registrationPageFromUrl || pageFromUrl || location.state?.page;
        
        if (currentPage) {
            navigate(`${EVENT_PATHS.REGISTERED_EVENTS}?page=${currentPage}`);
        } else {
            navigate(EVENT_PATHS.REGISTERED_EVENTS);
        }
    }, [navigate, registrationPageFromUrl, location.search, location.state]);

    useEffect(() => {
        const loadRegisterEventData = async () => {
            try {
                const response = await dispatch(registerEventById(id));
                if (response) {
                    setEventData(response.data);
                }
                setLoading(false);
            } catch (error) {
                console.error('Error loading register event data:', error);
                setLoading(false);
            }
        };

        if (id) {
            loadRegisterEventData();
        }
    }, [id, dispatch]);

    if (loading) return <div>Loading...</div>;
    if (!eventData) return <div>No register event found.</div>;

    const regDate = new Date(eventData.createdAt).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    return (
        <>
            <Container fluid className="mt-4">
                <div
                    className="mb-3"
                    style={{ backgroundColor: '#fff', borderRadius: '8px', padding: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
                >
                    <div className="d-flex justify-content-between align-items-center">
                        <h4 className="card-title">View Registration</h4>
                        <Button variant="secondary" onClick={handleBack}>
                            <i className="fas fa-arrow-left" style={{ marginRight: '8px' }}></i>
                            Back
                        </Button>
                    </div>
                </div>

                <div style={{ backgroundColor: '#fff', borderRadius: '8px', padding: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                    {/* Tabbed Content */}
                    <Tab.Container id="event-tabs" defaultActiveKey="registration">
                        <Row>
                            <Col sm={12}>
                                <Nav variant="tabs" className="mb-3">
                                    <Nav.Item>
                                        <Nav.Link eventKey="registration">
                                            <i className="fas fa-user-check" style={{ marginRight: '8px', color: '#4680ff' }}></i>
                                            Registration Information
                                        </Nav.Link>
                                    </Nav.Item>
                                    {eventData?.adminInfo && (
                                        <Nav.Item>
                                            <Nav.Link eventKey="adminInfo">
                                                <i className="fas fa-info-circle" style={{ marginRight: '8px', color: '#6f42c1' }}></i>
                                                Admin Information
                                            </Nav.Link>
                                        </Nav.Item>
                                    )}
                                    <Nav.Item>
                                        <Nav.Link eventKey="details">
                                            <i className="fas fa-calendar-alt" style={{ marginRight: '8px', color: '#4680ff' }}></i>
                                            Event Details
                                        </Nav.Link>
                                    </Nav.Item>
                                </Nav>
                            </Col>
                        </Row>

                        <Tab.Content>
                            {/* Registration Information Tab */}
                            <Tab.Pane eventKey="registration">
                                <div className="p-2 bg-light">
                                    {/* User Information Section */}
                                    <div
                                        className="mb-4"
                                        style={{
                                            backgroundColor: '#fff',
                                            borderRadius: '8px',
                                            padding: '20px',
                                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                            border: '1px solid #e9ecef',
                                            borderLeft: '4px solid #3498db'
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
                                                    borderBottom: '2px solid #3498db',
                                                    paddingBottom: '8px'
                                                }}
                                            >
                                                <i className="fas fa-user-circle" style={{ fontSize: '20px', color: '#3498db' }}></i>
                                                User Information
                                            </h5>
                                            <Row>
                                                <Col lg={6} md={12}>
                                                    <div style={{ fontSize: '15px', lineHeight: '1.6' }}>
                                                        <div className="mb-2 py-2" style={{ borderBottom: '1px solid #f1f1f1' }}>
                                                            <div className="info-field-container">
                                                                <div
                                                                    className="field-label"
                                                                    style={{ fontWeight: 'bold', color: '#495057', fontSize: '14px' }}
                                                                >
                                                                    <i
                                                                        className="fas fa-user"
                                                                        style={{ marginRight: '8px', color: '#007bff' }}
                                                                    ></i>
                                                                    Registered By:
                                                                </div>
                                                                <div
                                                                    className="field-value"
                                                                    style={{ color: '#2c3e50', fontSize: '14px', fontWeight: '500' }}
                                                                >
                                                                    {eventData.user?.firstName} {eventData.user?.lastName}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="mb-2 py-2" style={{ borderBottom: '1px solid #f1f1f1' }}>
                                                            <div className="info-field-container">
                                                                <div
                                                                    className="field-label"
                                                                    style={{ fontWeight: 'bold', color: '#495057', fontSize: '14px' }}
                                                                >
                                                                    <i
                                                                        className="fas fa-envelope"
                                                                        style={{ marginRight: '8px', color: '#17a2b8' }}
                                                                    ></i>
                                                                    Email:
                                                                </div>
                                                                <div
                                                                    className="field-value"
                                                                    style={{ color: '#2c3e50', fontSize: '14px', fontWeight: '500' }}
                                                                >
                                                                    {eventData.user?.email}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="mb-2 py-2" style={{ borderBottom: '1px solid #f1f1f1' }}>
                                                            <div className="info-field-container">
                                                                <div
                                                                    className="field-label"
                                                                    style={{ fontWeight: 'bold', color: '#495057', fontSize: '14px' }}
                                                                >
                                                                    <i
                                                                        className="fas fa-phone"
                                                                        style={{ marginRight: '8px', color: '#28a745' }}
                                                                    ></i>
                                                                    Mobile:
                                                                </div>
                                                                <div
                                                                    className="field-value"
                                                                    style={{ color: '#2c3e50', fontSize: '14px', fontWeight: '500' }}
                                                                >
                                                                    {eventData.user?.mobile || 'N/A'}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </Col>

                                                <Col lg={6} md={12}>
                                                    <div style={{ fontSize: '15px', lineHeight: '1.6' }}>
                                                        <div className="mb-2 py-2" style={{ borderBottom: '1px solid #f1f1f1' }}>
                                                            <div className="info-field-container">
                                                                <div
                                                                    className="field-label"
                                                                    style={{ fontWeight: 'bold', color: '#495057', fontSize: '14px' }}
                                                                >
                                                                    <i
                                                                        className="fas fa-calendar-alt"
                                                                        style={{ marginRight: '8px', color: '#fd7e14' }}
                                                                    ></i>
                                                                    Registration Date:
                                                                </div>
                                                                <div
                                                                    className="field-value"
                                                                    style={{ color: '#2c3e50', fontSize: '14px', fontWeight: '500' }}
                                                                >
                                                                    {regDate}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="mb-2 py-2" style={{ borderBottom: '1px solid #f1f1f1' }}>
                                                            <div className="info-field-container">
                                                                <div
                                                                    className="field-label"
                                                                    style={{ fontWeight: 'bold', color: '#495057', fontSize: '14px' }}
                                                                >
                                                                    <i
                                                                        className="fas fa-tag"
                                                                        style={{ marginRight: '8px', color: '#6f42c1' }}
                                                                    ></i>
                                                                    User Type:
                                                                </div>
                                                                <div className="field-value">
                                                                    <Badge bg="secondary" className="px-3 py-1">
                                                                        {eventData.type || 'N/A'}
                                                                    </Badge>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {eventData.isCreatedByAdmin && (
                                                            <div className="mb-2 py-2" style={{ borderBottom: '1px solid #f1f1f1' }}>
                                                                <div className="info-field-container">
                                                                    <div
                                                                        className="field-label"
                                                                        style={{ fontWeight: 'bold', color: '#495057', fontSize: '14px' }}
                                                                    >
                                                                        <i
                                                                            className="fas fa-shield-alt"
                                                                            style={{ marginRight: '8px', color: '#dc3545' }}
                                                                        ></i>
                                                                        Created By:
                                                                    </div>
                                                                    <div className="field-value">
                                                                        <Badge bg="danger" className="px-3 py-1">
                                                                            Admin
                                                                        </Badge>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </Col>
                                            </Row>
                                        </div>
                                    </div>

                                    {/* Order Details Section */}
                                    {eventData?.order && (
                                        <div
                                            className="mb-4"
                                            style={{
                                                backgroundColor: '#fff',
                                                borderRadius: '8px',
                                                padding: '20px',
                                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                                border: '1px solid #e9ecef',
                                                borderLeft: '4px solid #ffc107'
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
                                                        borderBottom: '2px solid #ffc107',
                                                        paddingBottom: '8px'
                                                    }}
                                                >
                                                    <i className="fas fa-receipt" style={{ fontSize: '20px', color: '#ffc107' }}></i>
                                                    Order Details
                                                </h5>
                                                <Row>
                                                    <Col lg={6} md={12}>
                                                        <div style={{ fontSize: '15px', lineHeight: '1.6' }}>
                                                            <div className="mb-2 py-2" style={{ borderBottom: '1px solid #f1f1f1' }}>
                                                                <div className="info-field-container">
                                                                    <div className="field-label" style={{ fontWeight: 'bold', color: '#495057', fontSize: '14px' }}>
                                                                        <i className="fas fa-hashtag" style={{ marginRight: '8px', color: '#007bff' }}></i>
                                                                        Order Number:
                                                                    </div>
                                                                    <div className="field-value" style={{ color: '#2c3e50', fontSize: '14px', fontWeight: '500' }}>
                                                                        {eventData.order?.orderNo || 'N/A'}
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div className="mb-2 py-2" style={{ borderBottom: '1px solid #f1f1f1' }}>
                                                                <div className="info-field-container">
                                                                    <div className="field-label" style={{ fontWeight: 'bold', color: '#495057', fontSize: '14px' }}>
                                                                        <i className="fas fa-credit-card" style={{ marginRight: '8px', color: '#6f42c1' }}></i>
                                                                        Payment Status:
                                                                    </div>
                                                                    <div className="field-value">
                                                                        <Badge
                                                                            bg={
                                                                                eventData.order?.status === 'Success'
                                                                                    ? 'success'
                                                                                    : eventData.order?.status === 'Withdraw'
                                                                                    ? 'danger'
                                                                                    : 'warning'
                                                                            }
                                                                            className="px-3 py-1"
                                                                        >
                                                                            {eventData.order?.status || 'N/A'}
                                                                        </Badge>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div className="mb-2 py-2" style={{ borderBottom: '1px solid #f1f1f1' }}>
                                                                <div className="info-field-container">
                                                                    <div className="field-label" style={{ fontWeight: 'bold', color: '#495057', fontSize: '14px' }}>
                                                                        <i className="fas fa-dollar-sign" style={{ marginRight: '8px', color: '#28a745' }}></i>
                                                                        Amount Paid:
                                                                    </div>
                                                                    <div className="field-value" style={{ color: '#2c3e50', fontSize: '14px', fontWeight: '500' }}>
                                                                        {eventData.order.price || 'N/A'} {eventData.order.currency || ''}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </Col>

                                                    <Col lg={6} md={12}>
                                                        <div style={{ fontSize: '15px', lineHeight: '1.6' }}>
                                                            <div className="mb-2 py-2" style={{ borderBottom: '1px solid #f1f1f1' }}>
                                                                <div className="info-field-container">
                                                                    <div className="field-label" style={{ fontWeight: 'bold', color: '#495057', fontSize: '14px' }}>
                                                                        <i className="fas fa-wallet" style={{ marginRight: '8px', color: '#17a2b8' }}></i>
                                                                        Payment Method:
                                                                    </div>
                                                                    <div className="field-value" style={{ color: '#2c3e50', fontSize: '14px', fontWeight: '500' }}>
                                                                        {eventData.order.paymentMethod || 'N/A'}
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div className="mb-2 py-2" style={{ borderBottom: '1px solid #f1f1f1' }}>
                                                                <div className="info-field-container">
                                                                    <div className="field-label" style={{ fontWeight: 'bold', color: '#495057', fontSize: '14px' }}>
                                                                        <i className="fas fa-calendar-check" style={{ marginRight: '8px', color: '#fd7e14' }}></i>
                                                                        Transaction Date:
                                                                    </div>
                                                                    <div className="field-value" style={{ color: '#2c3e50', fontSize: '14px', fontWeight: '500' }}>
                                                                        {regDate || 'N/A'}
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div className="mb-2 py-2" style={{ borderBottom: '1px solid #f1f1f1' }}>
                                                                <div className="info-field-container">
                                                                    <div className="field-label" style={{ fontWeight: 'bold', color: '#495057', fontSize: '14px' }}>
                                                                        <i className="fas fa-file-invoice" style={{ marginRight: '8px', color: '#dc3545' }}></i>
                                                                        Receipt/Invoice:
                                                                    </div>
                                                                    <div className="field-value">
                                                                        {eventData.receiptUrl && (
                                                                            <Button
                                                                                size="sm"
                                                                                variant="outline-info"
                                                                                className="me-2"
                                                                                onClick={() => window.open(eventData.receiptUrl, '_blank')}
                                                                            >
                                                                                <i className="fas fa-download" style={{ marginRight: '6px' }}></i>
                                                                                Receipt
                                                                            </Button>
                                                                        )}
                                                                        {eventData.invoiceUrl && (
                                                                            <Button
                                                                                size="sm"
                                                                                variant="outline-primary"
                                                                                onClick={() => window.open(eventData.invoiceUrl, '_blank')}
                                                                            >
                                                                                <i className="fas fa-file-invoice" style={{ marginRight: '6px' }}></i>
                                                                                Invoice
                                                                            </Button>
                                                                        )}
                                                                        {!eventData.receiptUrl && !eventData.invoiceUrl && (
                                                                            <span className="text-muted">N/A</span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </Col>
                                                </Row>
                                            </div>
                                        </div>
                                    )}

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

                                        /* Mobile: stacked layout */
                                        @media (max-width: 768px) {
                                            .info-field-container {
                                                display: block !important;
                                                text-align: left !important;
                                            }

                                            .field-label {
                                                margin-bottom: 5px;
                                            }

                                            .field-value {
                                                text-align: left !important;
                                                margin-left: 20px;
                                            }
                                        }
                                    `}</style>
                                </div>
                            </Tab.Pane>

                            {/* Admin Information Tab */}
                            {eventData?.adminInfo && (
                                <Tab.Pane eventKey="adminInfo">
                                    <div className="p-2 bg-light">
                                        <div
                                            className="mb-4"
                                            style={{
                                                backgroundColor: '#fff',
                                                borderRadius: '8px',
                                                padding: '20px',
                                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                                border: '1px solid #e9ecef',
                                                borderLeft: '4px solid #6f42c1'
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
                                                        borderBottom: '2px solid #6f42c1',
                                                        paddingBottom: '8px'
                                                    }}
                                                >
                                                    <i className="fas fa-info-circle" style={{ fontSize: '20px', color: '#6f42c1' }}></i>
                                                    Admin Information
                                                </h5>
                                                <Row>
                                                    <Col lg={6} md={12}>
                                                        <div style={{ fontSize: '15px', lineHeight: '1.6' }}>
                                                            {eventData.adminInfo.tableNumber && (
                                                                <div className="mb-2 py-2" style={{ borderBottom: '1px solid #f1f1f1' }}>
                                                                    <div className="info-field-container">
                                                                        <div className="field-label" style={{ fontWeight: 'bold', color: '#495057', fontSize: '14px' }}>
                                                                            <i className="fas fa-table" style={{ marginRight: '8px', color: '#007bff' }}></i>
                                                                            Table Number:
                                                                        </div>
                                                                        <div className="field-value" style={{ color: '#2c3e50', fontSize: '14px', fontWeight: '500' }}>
                                                                            {eventData.adminInfo.tableNumber}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {eventData.adminInfo.dressCode && (
                                                                <div className="mb-2 py-2" style={{ borderBottom: '1px solid #f1f1f1' }}>
                                                                    <div className="info-field-container">
                                                                        <div className="field-label" style={{ fontWeight: 'bold', color: '#495057', fontSize: '14px' }}>
                                                                            <i className="fas fa-tshirt" style={{ marginRight: '8px', color: '#17a2b8' }}></i>
                                                                            Dress Code:
                                                                        </div>
                                                                        <div className="field-value" style={{ color: '#2c3e50', fontSize: '14px', fontWeight: '500' }}>
                                                                            {eventData.adminInfo.dressCode}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {eventData.adminInfo.luckyDrawNumber && (
                                                                <div className="mb-2 py-2" style={{ borderBottom: '1px solid #f1f1f1' }}>
                                                                    <div className="info-field-container">
                                                                        <div className="field-label" style={{ fontWeight: 'bold', color: '#495057', fontSize: '14px' }}>
                                                                            <i className="fas fa-ticket-alt" style={{ marginRight: '8px', color: '#ffc107' }}></i>
                                                                            Lucky Draw Number:
                                                                        </div>
                                                                        <div className="field-value">
                                                                            <Badge bg="warning" className="px-3 py-1" style={{ fontSize: '14px' }}>
                                                                                {eventData.adminInfo.luckyDrawNumber}
                                                                            </Badge>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </Col>

                                                    <Col lg={6} md={12}>
                                                        <div style={{ fontSize: '15px', lineHeight: '1.6' }}>
                                                            {eventData.adminInfo.hall && (
                                                                <div className="mb-2 py-2" style={{ borderBottom: '1px solid #f1f1f1' }}>
                                                                    <div className="info-field-container">
                                                                        <div className="field-label" style={{ fontWeight: 'bold', color: '#495057', fontSize: '14px' }}>
                                                                            <i className="fas fa-building" style={{ marginRight: '8px', color: '#28a745' }}></i>
                                                                            Hall:
                                                                        </div>
                                                                        <div className="field-value" style={{ color: '#2c3e50', fontSize: '14px', fontWeight: '500' }}>
                                                                            {eventData.adminInfo.hall}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {eventData.adminInfo.additionalInformation && (
                                                                <div className="mb-2 py-2" style={{ borderBottom: '1px solid #f1f1f1' }}>
                                                                    <div className="info-field-container">
                                                                        <div className="field-label" style={{ fontWeight: 'bold', color: '#495057', fontSize: '14px' }}>
                                                                            <i className="fas fa-sticky-note" style={{ marginRight: '8px', color: '#6f42c1' }}></i>
                                                                            Additional Information:
                                                                        </div>
                                                                        <div className="field-value" style={{ color: '#2c3e50', fontSize: '14px', fontWeight: '500' }}>
                                                                            {eventData.adminInfo.additionalInformation}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {eventData.adminInfo.luckyDrawDateTime && (
                                                                <div className="mb-2 py-2" style={{ borderBottom: '1px solid #f1f1f1' }}>
                                                                    <div className="info-field-container">
                                                                        <div className="field-label" style={{ fontWeight: 'bold', color: '#495057', fontSize: '14px' }}>
                                                                            <i className="fas fa-calendar-alt" style={{ marginRight: '8px', color: '#fd7e14' }}></i>
                                                                            Lucky Draw Date/Time:
                                                                        </div>
                                                                        <div className="field-value" style={{ color: '#2c3e50', fontSize: '14px', fontWeight: '500' }}>
                                                                            {new Date(eventData.adminInfo.luckyDrawDateTime).toLocaleString('en-GB', {
                                                                                day: '2-digit',
                                                                                month: 'short',
                                                                                year: 'numeric',
                                                                                hour: '2-digit',
                                                                                minute: '2-digit'
                                                                            })}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </Col>
                                                </Row>
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

                                            /* Mobile: stacked layout */
                                            @media (max-width: 768px) {
                                                .info-field-container {
                                                    display: block !important;
                                                    text-align: left !important;
                                                }

                                                .field-label {
                                                    margin-bottom: 5px;
                                                }

                                                .field-value {
                                                    text-align: left !important;
                                                    margin-left: 20px;
                                                }
                                            }
                                        `}</style>
                                    </div>
                                </Tab.Pane>
                            )}

                            {/* Event Details Tab */}
                            <Tab.Pane eventKey="details">
                                <EventBasicComponent eventData={eventData?.event} />
                            </Tab.Pane>
                        </Tab.Content>
                    </Tab.Container>
                </div>
            </Container>
        </>
    );
};

export default ViewRegisterEventPage;
