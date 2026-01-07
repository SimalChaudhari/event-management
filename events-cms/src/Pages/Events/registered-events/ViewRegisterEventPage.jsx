import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Button, Row, Col, Badge, Nav, Tab, Container, Card } from 'react-bootstrap';
import { useDispatch } from 'react-redux';
import { registerEventById } from '../../../store/actions/eventActions';
import { EVENT_PATHS } from '../../../utils/constants';
import EventBasicComponent from '../../../components/events/EventBasicComponent';
import axiosInstance from '../../../configs/axiosInstance';
import { toast } from 'react-toastify';
import { formatPhoneDisplay } from '../../../utils/phoneFormatter';
import { ExpandableDescription } from '../../../components/ExpandableDescription';

const ViewRegisterEventPage = () => {
    const { id } = useParams();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();
    const [eventData, setEventData] = useState(null);
    const [loading, setLoading] = useState(true);




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

    const regDate = formatTimestamp(eventData.createdAt);

    // InfoField component matching EventBasicComponent pattern - responsive design
    const InfoField = ({ label, value, icon = null, colSize = 6 }) => (
        <Col xs={12} sm={12} md={colSize} className="mb-2" style={{ overflow: 'hidden' }}>
            <div style={{ 
                padding: '8px 12px',
                borderBottom: '1px solid #e9ecef',
                width: '100%',
                maxWidth: '100%',
                boxSizing: 'border-box'
            }}
            className="px-md-3 px-2 py-md-2 py-2"
            >
                {/* Mobile & Tablet: Label on top */}
                <div className="d-block d-md-none">
                    <div style={{ 
                        fontSize: '13px', 
                        fontWeight: '600', 
                        color: '#4680ff',
                        marginBottom: '4px',
                        wordBreak: 'break-word',
                        overflowWrap: 'break-word'
                    }}>
                        <span>{label}:</span>
                    </div>
                    <div style={{ 
                        fontSize: '14px', 
                        color: '#000000',
                        fontWeight: '400',
                        wordBreak: 'break-word',
                        overflowWrap: 'break-word',
                        width: '100%',
                        lineHeight: '1.5'
                    }}>
                        {value || 'N/A'}
                    </div>
                </div>
                {/* Desktop: Label and value side by side */}
                <div className="d-none d-md-flex align-items-start" style={{ width: '100%', minWidth: 0 }}>
                    <div style={{ 
                        minWidth: '140px',
                        maxWidth: '140px',
                        fontSize: '13px', 
                        fontWeight: '600', 
                        color: '#4680ff',
                        marginRight: '12px',
                        flexShrink: 0
                    }}>
                        <span style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>{label}:</span>
                    </div>
                    <div style={{ 
                        fontSize: '14px', 
                        color: '#000000',
                        fontWeight: '400',
                        flex: 1,
                        minWidth: 0,
                        wordBreak: 'break-word',
                        overflowWrap: 'break-word',
                        overflow: 'hidden'
                    }}>
                        {value || 'N/A'}
                    </div>
                </div>
            </div>
        </Col>
    );

    return (
        <>
            <Container fluid className="mt-4">
                <div
                    className="mb-3"
                    style={{ backgroundColor: '#fff', borderRadius: '8px', padding: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
                >
                    <div className="d-flex justify-content-between align-items-center">
                        <h4 className="card-title">View Registration</h4>
                        <Button variant="secondary" onClick={() => navigate(-1)}>
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
                                    {eventData?.checkout && (
                                        <Nav.Item>
                                            <Nav.Link eventKey="payment">
                                                <i className="fas fa-credit-card" style={{ marginRight: '8px', color: '#28a745' }}></i>
                                                Payment Details
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
                                <div>
                                    {/* Desktop: Card wrapper */}
                                    <div className="d-none d-md-block">
                                        <Card style={{ 
                                            backgroundColor: '#fff', 
                                            borderRadius: '8px', 
                                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                            border: '1px solid #e9ecef',
                                            overflow: 'hidden'
                                        }}>
                                            <Card.Body style={{ padding: '24px', overflow: 'hidden', width: '100%', maxWidth: '100%' }}>
                                                <Row className="m-0" style={{ width: '100%', maxWidth: '100%' }}>
                                                    {/* User Information Section */}
                                                    <Col xs={12} className="p-0" style={{ overflow: 'hidden', width: '100%', maxWidth: '100%' }}>
                                                        <h5 className="mb-md-3 mb-3 pb-md-2 pb-2" style={{ 
                                                            fontSize: '16px', 
                                                            fontWeight: '600', 
                                                            color: '#000000',
                                                            borderBottom: '2px solid #4680ff'
                                                        }}>
                                                            <i className="fas fa-user mr-2" style={{ color: '#4680ff' }}></i>
                                                            User Information
                                                        </h5>
                                                        <Row>
                                                            <InfoField 
                                                                label="Registered By" 
                                                                value={`${eventData.user?.firstName || ''} ${eventData.user?.lastName || ''}`.trim() || 'N/A'}
                                                                icon="fas fa-user"
                                                                colSize={6}
                                                            />
                                                            <InfoField 
                                                                label="Email" 
                                                                value={eventData.user?.email || 'N/A'}
                                                                icon="fas fa-envelope"
                                                                colSize={6}
                                                            />
                                                            <InfoField 
                                                                label="Mobile Number" 
                                                                value={formatPhoneDisplay(eventData.user?.mobile)}
                                                                icon="fas fa-phone"
                                                                colSize={6}
                                                            />
                                                            <InfoField 
                                                                label="Registration Date" 
                                                                value={regDate}
                                                                icon="fas fa-calendar-alt"
                                                                colSize={6}
                                                            />
                                                            <InfoField 
                                                                label="User Type" 
                                                                value={
                                                                    <Badge bg="secondary" style={{ fontSize: '12px', padding: '6px 12px', fontWeight: '600' }}>
                                                                        {eventData.type || 'N/A'}
                                                                    </Badge>
                                                                }
                                                                icon="fas fa-tag"
                                                                colSize={6}
                                                            />
                                                            {eventData.isCreatedByAdmin && (
                                                                <InfoField 
                                                                    label="Created By" 
                                                                    value={
                                                                        <Badge bg="danger" style={{ fontSize: '12px', padding: '6px 12px', fontWeight: '600' }}>
                                                                            Admin
                                                                        </Badge>
                                                                    }
                                                                    icon="fas fa-shield-alt"
                                                                    colSize={6}
                                                                />
                                                            )}
                                                        </Row>
                                                    </Col>

                                                    {/* Order Details Section */}
                                                    {eventData?.order && (
                                                        <Col xs={12} className="mt-md-4 mt-3 p-0" style={{ overflow: 'hidden', width: '100%', maxWidth: '100%' }}>
                                                            <h5 className="mb-md-3 mb-3 pb-md-2 pb-2" style={{ 
                                                                fontSize: '16px', 
                                                                fontWeight: '600', 
                                                                color: '#000000',
                                                                borderBottom: '2px solid #4680ff'
                                                            }}>
                                                                <i className="fas fa-receipt mr-2" style={{ color: '#4680ff' }}></i>
                                                                Order Details
                                                            </h5>
                                                            <Row>
                                                                <InfoField 
                                                                    label="Order Number" 
                                                                    value={eventData.order?.orderNo || 'N/A'}
                                                                    icon="fas fa-hashtag"
                                                                    colSize={6}
                                                                />
                                                                <InfoField 
                                                                    label="Payment Status" 
                                                                    value={
                                                                        <Badge 
                                                                            bg={
                                                                                eventData.order?.status === 'Success'
                                                                                    ? 'success'
                                                                                    : eventData.order?.status === 'Withdraw'
                                                                                    ? 'danger'
                                                                                    : 'warning'
                                                                            } 
                                                                            style={{ fontSize: '12px', padding: '6px 12px', fontWeight: '600' }}
                                                                        >
                                                                            {eventData.order?.status || 'N/A'}
                                                                        </Badge>
                                                                    }
                                                                    icon="fas fa-credit-card"
                                                                    colSize={6}
                                                                />
                                                                <InfoField 
                                                                    label="Amount Paid" 
                                                                    value={
                                                                        <span style={{ color: '#28a745', fontWeight: 'bold', fontSize: '14px' }}>
                                                                            {eventData.order.price || 'N/A'} {eventData.order.currency || ''}
                                                                        </span>
                                                                    }
                                                                    icon="fas fa-dollar-sign"
                                                                    colSize={6}
                                                                />
                                                                <InfoField 
                                                                    label="Payment Method" 
                                                                    value={eventData.order.paymentMethod || 'N/A'}
                                                                    icon="fas fa-wallet"
                                                                    colSize={6}
                                                                />
                                                                <InfoField 
                                                                    label="Transaction Date" 
                                                                    value={regDate}
                                                                    icon="fas fa-calendar-check"
                                                                    colSize={6}
                                                                />
                                                                <InfoField 
                                                                    label="Receipt/Invoice" 
                                                                    value={
                                                                        <div>
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
                                                                    }
                                                                    icon="fas fa-file-invoice"
                                                                    colSize={6}
                                                                />
                                                            </Row>
                                                        </Col>
                                                    )}
                                                </Row>
                                            </Card.Body>
                                        </Card>
                                    </div>
                                    {/* Mobile: No card wrapper, minimal padding */}
                                    <div className="d-block d-md-none px-2 py-2">
                                        <Row className="m-0" style={{ width: '100%', maxWidth: '100%' }}>
                                            {/* User Information Section */}
                                            <Col xs={12} className="p-0" style={{ overflow: 'hidden', width: '100%', maxWidth: '100%' }}>
                                                <h5 className="mb-md-3 mb-3 pb-md-2 pb-2" style={{ 
                                                    fontSize: '16px', 
                                                    fontWeight: '600', 
                                                    color: '#000000',
                                                    borderBottom: '2px solid #4680ff'
                                                }}>
                                                    <i className="fas fa-user mr-2" style={{ color: '#4680ff' }}></i>
                                                    User Information
                                                </h5>
                                                <Row>
                                                    <InfoField 
                                                        label="Registered By" 
                                                        value={`${eventData.user?.firstName || ''} ${eventData.user?.lastName || ''}`.trim() || 'N/A'}
                                                        icon="fas fa-user"
                                                        colSize={6}
                                                    />
                                                    <InfoField 
                                                        label="Email" 
                                                        value={eventData.user?.email || 'N/A'}
                                                        icon="fas fa-envelope"
                                                        colSize={6}
                                                    />
                                                    <InfoField 
                                                        label="Mobile Number" 
                                                        value={formatPhoneDisplay(eventData.user?.mobile)}
                                                        icon="fas fa-phone"
                                                        colSize={6}
                                                    />
                                                    <InfoField 
                                                        label="Registration Date" 
                                                        value={regDate}
                                                        icon="fas fa-calendar-alt"
                                                        colSize={6}
                                                    />
                                                    <InfoField 
                                                        label="User Type" 
                                                        value={
                                                            <Badge bg="secondary" style={{ fontSize: '12px', padding: '6px 12px', fontWeight: '600' }}>
                                                                {eventData.type || 'N/A'}
                                                            </Badge>
                                                        }
                                                        icon="fas fa-tag"
                                                        colSize={6}
                                                    />
                                                    {eventData.isCreatedByAdmin && (
                                                        <InfoField 
                                                            label="Created By" 
                                                            value={
                                                                <Badge bg="danger" style={{ fontSize: '12px', padding: '6px 12px', fontWeight: '600' }}>
                                                                    Admin
                                                                </Badge>
                                                            }
                                                            icon="fas fa-shield-alt"
                                                            colSize={6}
                                                        />
                                                    )}
                                                </Row>
                                            </Col>

                                            {/* Order Details Section */}
                                            {eventData?.order && (
                                                <Col xs={12} className="mt-md-4 mt-3 p-0" style={{ overflow: 'hidden', width: '100%', maxWidth: '100%' }}>
                                                    <h5 className="mb-md-3 mb-3 pb-md-2 pb-2" style={{ 
                                                        fontSize: '16px', 
                                                        fontWeight: '600', 
                                                        color: '#000000',
                                                        borderBottom: '2px solid #4680ff'
                                                    }}>
                                                        <i className="fas fa-receipt mr-2" style={{ color: '#4680ff' }}></i>
                                                        Order Details
                                                    </h5>
                                                    <Row>
                                                        <InfoField 
                                                            label="Order Number" 
                                                            value={eventData.order?.orderNo || 'N/A'}
                                                            icon="fas fa-hashtag"
                                                            colSize={6}
                                                        />
                                                        <InfoField 
                                                            label="Payment Status" 
                                                            value={
                                                                <Badge 
                                                                    bg={
                                                                        eventData.order?.status === 'Success'
                                                                            ? 'success'
                                                                            : eventData.order?.status === 'Withdraw'
                                                                            ? 'danger'
                                                                            : 'warning'
                                                                    } 
                                                                    style={{ fontSize: '12px', padding: '6px 12px', fontWeight: '600' }}
                                                                >
                                                                    {eventData.order?.status || 'N/A'}
                                                                </Badge>
                                                            }
                                                            icon="fas fa-credit-card"
                                                            colSize={6}
                                                        />
                                                        <InfoField 
                                                            label="Amount Paid" 
                                                            value={
                                                                <span style={{ color: '#28a745', fontWeight: 'bold', fontSize: '14px' }}>
                                                                    {eventData.order.price || 'N/A'} {eventData.order.currency || ''}
                                                                </span>
                                                            }
                                                            icon="fas fa-dollar-sign"
                                                            colSize={6}
                                                        />
                                                        <InfoField 
                                                            label="Payment Method" 
                                                            value={eventData.order.paymentMethod || 'N/A'}
                                                            icon="fas fa-wallet"
                                                            colSize={6}
                                                        />
                                                        <InfoField 
                                                            label="Transaction Date" 
                                                            value={regDate}
                                                            icon="fas fa-calendar-check"
                                                            colSize={6}
                                                        />
                                                        <InfoField 
                                                            label="Receipt/Invoice" 
                                                            value={
                                                                <div>
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
                                                            }
                                                            icon="fas fa-file-invoice"
                                                            colSize={6}
                                                        />
                                                    </Row>
                                                </Col>
                                            )}
                                        </Row>
                                    </div>
                                </div>
                            </Tab.Pane>

                            {/* Admin Information Tab */}
                            {eventData?.adminInfo && (
                                <Tab.Pane eventKey="adminInfo">
                                    <div>
                                        {/* Desktop: Card wrapper */}
                                        <div className="d-none d-md-block">
                                            <Card style={{ 
                                                backgroundColor: '#fff', 
                                                borderRadius: '8px', 
                                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                                border: '1px solid #e9ecef',
                                                overflow: 'hidden'
                                            }}>
                                                <Card.Body style={{ padding: '24px', overflow: 'hidden', width: '100%', maxWidth: '100%' }}>
                                                    <Row className="m-0" style={{ width: '100%', maxWidth: '100%' }}>
                                                        <Col xs={12} className="p-0" style={{ overflow: 'hidden', width: '100%', maxWidth: '100%' }}>
                                                            <h5 className="mb-md-3 mb-3 pb-md-2 pb-2" style={{ 
                                                                fontSize: '16px', 
                                                                fontWeight: '600', 
                                                                color: '#000000',
                                                                borderBottom: '2px solid #4680ff'
                                                            }}>
                                                                <i className="fas fa-info-circle mr-2" style={{ color: '#4680ff' }}></i>
                                                                Admin Information
                                                            </h5>
                                                            <Row>
                                                                {eventData.adminInfo.tableNumber && (
                                                                    <InfoField 
                                                                        label="Table Number" 
                                                                        value={eventData.adminInfo.tableNumber}
                                                                        icon="fas fa-table"
                                                                        colSize={6}
                                                                    />
                                                                )}
                                                                {eventData.adminInfo.dressCode && (
                                                                    <InfoField 
                                                                        label="Dress Code" 
                                                                        value={eventData.adminInfo.dressCode}
                                                                        icon="fas fa-tshirt"
                                                                        colSize={6}
                                                                    />
                                                                )}
                                                                {eventData.adminInfo.luckyDrawNumber && (
                                                                    <InfoField 
                                                                        label="Lucky Draw Number" 
                                                                        value={
                                                                            <Badge bg="warning" style={{ fontSize: '12px', padding: '6px 12px', fontWeight: '600' }}>
                                                                                {eventData.adminInfo.luckyDrawNumber}
                                                                            </Badge>
                                                                        }
                                                                        icon="fas fa-ticket-alt"
                                                                        colSize={6}
                                                                    />
                                                                )}
                                                                {eventData.adminInfo.hall && (
                                                                    <InfoField 
                                                                        label="Hall" 
                                                                        value={eventData.adminInfo.hall}
                                                                        icon="fas fa-building"
                                                                        colSize={6}
                                                                    />
                                                                )}
                                                                {eventData.adminInfo.luckyDrawDateTime && (
                                                                    <InfoField 
                                                                        label="Lucky Draw Date/Time" 
                                                                        value={formatTimestamp(eventData.adminInfo.luckyDrawDateTime)}
                                                                        icon="fas fa-calendar-alt"
                                                                        colSize={6}
                                                                    />
                                                                )}
                                                                {eventData.adminInfo.additionalInformation && (
                                                                    <Col xs={12} sm={12} md={12} className="mb-2" style={{ overflow: 'hidden' }}>
                                                                        <div style={{ 
                                                                            padding: '8px 12px',
                                                                            borderBottom: '1px solid #e9ecef',
                                                                            backgroundColor: '#f8f9fa',
                                                                            borderRadius: '4px',
                                                                            width: '100%',
                                                                            maxWidth: '100%',
                                                                            boxSizing: 'border-box'
                                                                        }}
                                                                        className="px-md-3 px-2 py-md-2 py-2"
                                                                        >
                                                                            {/* Mobile & Tablet: Label on top */}
                                                                            <div className="d-block d-md-none">
                                                                                <div style={{ 
                                                                                    fontSize: '13px', 
                                                                                    fontWeight: '600', 
                                                                                    color: '#4680ff',
                                                                                    marginBottom: '4px',
                                                                                    wordBreak: 'break-word',
                                                                                    overflowWrap: 'break-word'
                                                                                }}>
                                                                                    <span>Additional Information:</span>
                                                                                </div>
                                                                                <div style={{ 
                                                                                    fontSize: '14px', 
                                                                                    color: '#000000',
                                                                                    fontWeight: '400',
                                                                                    wordBreak: 'break-word',
                                                                                    overflowWrap: 'break-word',
                                                                                    width: '100%',
                                                                                    lineHeight: '1.5'
                                                                                }}>
                                                                                    <ExpandableDescription text={eventData.adminInfo.additionalInformation} maxLines={2} />
                                                                                </div>
                                                                            </div>
                                                                            {/* Desktop: Label and value side by side */}
                                                                            <div className="d-none d-md-flex align-items-start" style={{ width: '100%', minWidth: 0 }}>
                                                                                <div style={{ 
                                                                                    minWidth: '140px',
                                                                                    maxWidth: '140px',
                                                                                    fontSize: '13px', 
                                                                                    fontWeight: '600', 
                                                                                    color: '#4680ff',
                                                                                    marginRight: '12px',
                                                                                    flexShrink: 0
                                                                                }}>
                                                                                    <span style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>Additional Information:</span>
                                                                                </div>
                                                                                <div style={{ 
                                                                                    fontSize: '14px', 
                                                                                    color: '#000000',
                                                                                    fontWeight: '400',
                                                                                    flex: 1,
                                                                                    minWidth: 0,
                                                                                    wordBreak: 'break-word',
                                                                                    overflowWrap: 'break-word',
                                                                                    overflow: 'hidden'
                                                                                }}>
                                                                                    <ExpandableDescription text={eventData.adminInfo.additionalInformation} maxLines={2} />
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </Col>
                                                                )}
                                                            </Row>
                                                        </Col>
                                                    </Row>
                                                </Card.Body>
                                            </Card>
                                        </div>
                                        {/* Mobile: No card wrapper, minimal padding */}
                                        <div className="d-block d-md-none px-2 py-2">
                                            <Row className="m-0" style={{ width: '100%', maxWidth: '100%' }}>
                                                <Col xs={12} className="p-0" style={{ overflow: 'hidden', width: '100%', maxWidth: '100%' }}>
                                                    <h5 className="mb-md-3 mb-3 pb-md-2 pb-2" style={{ 
                                                        fontSize: '16px', 
                                                        fontWeight: '600', 
                                                        color: '#000000',
                                                        borderBottom: '2px solid #4680ff'
                                                    }}>
                                                        <i className="fas fa-info-circle mr-2" style={{ color: '#4680ff' }}></i>
                                                        Admin Information
                                                    </h5>
                                                    <Row>
                                                        {eventData.adminInfo.tableNumber && (
                                                            <InfoField 
                                                                label="Table Number" 
                                                                value={eventData.adminInfo.tableNumber}
                                                                icon="fas fa-table"
                                                                colSize={6}
                                                            />
                                                        )}
                                                        {eventData.adminInfo.dressCode && (
                                                            <InfoField 
                                                                label="Dress Code" 
                                                                value={eventData.adminInfo.dressCode}
                                                                icon="fas fa-tshirt"
                                                                colSize={6}
                                                            />
                                                        )}
                                                        {eventData.adminInfo.luckyDrawNumber && (
                                                            <InfoField 
                                                                label="Lucky Draw Number" 
                                                                value={
                                                                    <Badge bg="warning" style={{ fontSize: '12px', padding: '6px 12px', fontWeight: '600' }}>
                                                                        {eventData.adminInfo.luckyDrawNumber}
                                                                    </Badge>
                                                                }
                                                                icon="fas fa-ticket-alt"
                                                                colSize={6}
                                                            />
                                                        )}
                                                        {eventData.adminInfo.hall && (
                                                            <InfoField 
                                                                label="Hall" 
                                                                value={eventData.adminInfo.hall}
                                                                icon="fas fa-building"
                                                                colSize={6}
                                                            />
                                                        )}
                                                        {eventData.adminInfo.luckyDrawDateTime && (
                                                            <InfoField 
                                                                label="Lucky Draw Date/Time" 
                                                                value={formatTimestamp(eventData.adminInfo.luckyDrawDateTime)}
                                                                icon="fas fa-calendar-alt"
                                                                colSize={6}
                                                            />
                                                        )}
                                                        {eventData.adminInfo.additionalInformation && (
                                                            <Col xs={12} sm={12} md={12} className="mb-2" style={{ overflow: 'hidden' }}>
                                                                <div style={{ 
                                                                    padding: '8px 12px',
                                                                    borderBottom: '1px solid #e9ecef',
                                                                    backgroundColor: '#f8f9fa',
                                                                    borderRadius: '4px',
                                                                    width: '100%',
                                                                    maxWidth: '100%',
                                                                    boxSizing: 'border-box'
                                                                }}
                                                                className="px-md-3 px-2 py-md-2 py-2"
                                                                >
                                                                    {/* Mobile & Tablet: Label on top */}
                                                                    <div className="d-block d-md-none">
                                                                        <div style={{ 
                                                                            fontSize: '13px', 
                                                                            fontWeight: '600', 
                                                                            color: '#4680ff',
                                                                            marginBottom: '4px',
                                                                            wordBreak: 'break-word',
                                                                            overflowWrap: 'break-word'
                                                                        }}>
                                                                            <span>Additional Information:</span>
                                                                        </div>
                                                                        <div style={{ 
                                                                            fontSize: '14px', 
                                                                            color: '#000000',
                                                                            fontWeight: '400',
                                                                            wordBreak: 'break-word',
                                                                            overflowWrap: 'break-word',
                                                                            width: '100%',
                                                                            lineHeight: '1.5'
                                                                        }}>
                                                                            <ExpandableDescription text={eventData.adminInfo.additionalInformation} maxLines={2} />
                                                                        </div>
                                                                    </div>
                                                                    {/* Desktop: Label and value side by side */}
                                                                    <div className="d-none d-md-flex align-items-start" style={{ width: '100%', minWidth: 0 }}>
                                                                        <div style={{ 
                                                                            minWidth: '140px',
                                                                            maxWidth: '140px',
                                                                            fontSize: '13px', 
                                                                            fontWeight: '600', 
                                                                            color: '#4680ff',
                                                                            marginRight: '12px',
                                                                            flexShrink: 0
                                                                        }}>
                                                                            <span style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>Additional Information:</span>
                                                                        </div>
                                                                        <div style={{ 
                                                                            fontSize: '14px', 
                                                                            color: '#000000',
                                                                            fontWeight: '400',
                                                                            flex: 1,
                                                                            minWidth: 0,
                                                                            wordBreak: 'break-word',
                                                                            overflowWrap: 'break-word',
                                                                            overflow: 'hidden'
                                                                        }}>
                                                                            <ExpandableDescription text={eventData.adminInfo.additionalInformation} maxLines={2} />
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </Col>
                                                        )}
                                                    </Row>
                                                </Col>
                                            </Row>
                                        </div>
                                    </div>
                                </Tab.Pane>
                            )}

                            {/* Payment Details Tab */}
                            {eventData?.checkout && (
                                <Tab.Pane eventKey="payment">
                                    <div>
                                        {/* Desktop: Card wrapper */}
                                        <div className="d-none d-md-block">
                                            <Card style={{ 
                                                backgroundColor: '#fff', 
                                                borderRadius: '8px', 
                                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                                border: '1px solid #e9ecef',
                                                overflow: 'hidden'
                                            }}>
                                                <Card.Body style={{ padding: '24px', overflow: 'hidden', width: '100%', maxWidth: '100%' }}>
                                                    {eventData.checkout?.status === 'Completed' && (
                                                        <div className="mb-3 text-center">
                                                            <Button
                                                                variant="success"
                                                                size="sm"
                                                                onClick={async () => {
                                                                    try {
                                                                        const response = await axiosInstance.get(
                                                                            `/register-events/${id}/receipt`,
                                                                            {
                                                                                responseType: 'blob',
                                                                            }
                                                                        );
                                                                        
                                                                        // Create blob URL and download
                                                                        const blob = new Blob([response.data], { type: 'application/pdf' });
                                                                        const url = window.URL.createObjectURL(blob);
                                                                        const link = document.createElement('a');
                                                                        link.href = url;
                                                                        link.download = `Receipt-${eventData.checkout?.checkoutId || id}.pdf`;
                                                                        document.body.appendChild(link);
                                                                        link.click();
                                                                        document.body.removeChild(link);
                                                                        window.URL.revokeObjectURL(url);
                                                                    } catch (error) {
                                                                        toast.error('Failed to download receipt. Please try again.');
                                                                        console.error('Receipt download error:', error);
                                                                    }
                                                                }}
                                                                className="px-4"
                                                            >
                                                                <i className="fas fa-file-pdf mr-2"></i>
                                                                Download Receipt (PDF)
                                                            </Button>
                                                        </div>
                                                    )}
                                                    <Row className="m-0" style={{ width: '100%', maxWidth: '100%' }}>
                                                        <Col xs={12} className="p-0" style={{ overflow: 'hidden', width: '100%', maxWidth: '100%' }}>
                                                            <h5 className="mb-md-3 mb-3 pb-md-2 pb-2" style={{ 
                                                                fontSize: '16px', 
                                                                fontWeight: '600', 
                                                                color: '#000000',
                                                                borderBottom: '2px solid #4680ff'
                                                            }}>
                                                                <i className="fas fa-credit-card mr-2" style={{ color: '#4680ff' }}></i>
                                                                Payment Details
                                                            </h5>
                                                            <Row>
                                                                <InfoField 
                                                                    label="Checkout ID" 
                                                                    value={eventData.checkout?.checkoutId || 'N/A'}
                                                                    icon="fas fa-hashtag"
                                                                    colSize={6}
                                                                />
                                                                <InfoField 
                                                                    label="Total Amount" 
                                                                    value={
                                                                        <span style={{ color: '#28a745', fontWeight: 'bold', fontSize: '14px' }}>
                                                                            {eventData.checkout?.totalAmount ? `$${parseFloat(eventData.checkout.totalAmount).toFixed(2)}` : 'N/A'}
                                                                        </span>
                                                                    }
                                                                    icon="fas fa-dollar-sign"
                                                                    colSize={6}
                                                                />
                                                                <InfoField 
                                                                    label="Discount" 
                                                                    value={
                                                                        <span style={{ color: '#ffc107', fontWeight: 'bold', fontSize: '14px' }}>
                                                                            {eventData.checkout?.discount ? `$${parseFloat(eventData.checkout.discount).toFixed(2)}` : '$0.00'}
                                                                        </span>
                                                                    }
                                                                    icon="fas fa-tag"
                                                                    colSize={6}
                                                                />
                                                                <InfoField 
                                                                    label="Coupon Code" 
                                                                    value={eventData.checkout?.couponCode || 'N/A'}
                                                                    icon="fas fa-ticket-alt"
                                                                    colSize={6}
                                                                />
                                                                <InfoField 
                                                                    label="Promo Code" 
                                                                    value={eventData.checkout?.promoCode || 'N/A'}
                                                                    icon="fas fa-tag"
                                                                    colSize={6}
                                                                />
                                                                <InfoField 
                                                                    label="Payment Gateway" 
                                                                    value={
                                                                        <Badge bg="info" style={{ fontSize: '12px', padding: '6px 12px', fontWeight: '600' }}>
                                                                            {eventData.checkout?.paymentGateway || 'N/A'}
                                                                        </Badge>
                                                                    }
                                                                    icon="fas fa-wallet"
                                                                    colSize={6}
                                                                />
                                                                <InfoField 
                                                                    label="Payment Method" 
                                                                    value={eventData.checkout?.paymentMethod || 'N/A'}
                                                                    icon="fas fa-credit-card"
                                                                    colSize={6}
                                                                />
                                                                <InfoField 
                                                                    label="Transaction ID" 
                                                                    value={eventData.checkout?.transactionId || 'N/A'}
                                                                    icon="fas fa-receipt"
                                                                    colSize={6}
                                                                />
                                                                <InfoField 
                                                                    label="Status" 
                                                                    value={
                                                                        <Badge 
                                                                            bg={eventData.checkout?.status === 'Completed' ? 'success' : eventData.checkout?.status === 'Pending' ? 'warning' : 'danger'} 
                                                                            style={{ fontSize: '12px', padding: '6px 12px', fontWeight: '600' }}
                                                                        >
                                                                            {eventData.checkout?.status || 'N/A'}
                                                                        </Badge>
                                                                    }
                                                                    icon="fas fa-info-circle"
                                                                    colSize={6}
                                                                />
                                                                <InfoField 
                                                                    label="Created At" 
                                                                    value={<span style={{ color: '#6c757d', fontSize: '13px' }}>{formatTimestamp(eventData.checkout?.createdAt)}</span>}
                                                                    icon="fas fa-calendar-check"
                                                                    colSize={6}
                                                                />
                                                                {eventData.checkout?.completedAt && (
                                                                    <InfoField 
                                                                        label="Completed At" 
                                                                        value={<span style={{ color: '#6c757d', fontSize: '13px' }}>{formatTimestamp(eventData.checkout.completedAt)}</span>}
                                                                        icon="fas fa-check-circle"
                                                                        colSize={6}
                                                                    />
                                                                )}
                                                                {eventData.checkout?.paymentNotes && (
                                                                    <Col xs={12} sm={12} md={12} className="mb-2" style={{ overflow: 'hidden' }}>
                                                                        <div style={{ 
                                                                            padding: '8px 12px',
                                                                            borderBottom: '1px solid #e9ecef',
                                                                            backgroundColor: '#f8f9fa',
                                                                            borderRadius: '4px',
                                                                            width: '100%',
                                                                            maxWidth: '100%',
                                                                            boxSizing: 'border-box'
                                                                        }}
                                                                        className="px-md-3 px-2 py-md-2 py-2"
                                                                        >
                                                                            {/* Mobile & Tablet: Label on top */}
                                                                            <div className="d-block d-md-none">
                                                                                <div style={{ 
                                                                                    fontSize: '13px', 
                                                                                    fontWeight: '600', 
                                                                                    color: '#4680ff',
                                                                                    marginBottom: '4px',
                                                                                    wordBreak: 'break-word',
                                                                                    overflowWrap: 'break-word'
                                                                                }}>
                                                                                    <span>Payment Notes:</span>
                                                                                </div>
                                                                                <div style={{ 
                                                                                    fontSize: '14px', 
                                                                                    color: '#000000',
                                                                                    fontWeight: '400',
                                                                                    wordBreak: 'break-word',
                                                                                    overflowWrap: 'break-word',
                                                                                    width: '100%',
                                                                                    lineHeight: '1.5'
                                                                                }}>
                                                                                    {eventData.checkout.paymentNotes}
                                                                                </div>
                                                                            </div>
                                                                            {/* Desktop: Label and value side by side */}
                                                                            <div className="d-none d-md-flex align-items-start" style={{ width: '100%', minWidth: 0 }}>
                                                                                <div style={{ 
                                                                                    minWidth: '140px',
                                                                                    maxWidth: '140px',
                                                                                    fontSize: '13px', 
                                                                                    fontWeight: '600', 
                                                                                    color: '#4680ff',
                                                                                    marginRight: '12px',
                                                                                    flexShrink: 0
                                                                                }}>
                                                                                    <span style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>Payment Notes:</span>
                                                                                </div>
                                                                                <div style={{ 
                                                                                    fontSize: '14px', 
                                                                                    color: '#000000',
                                                                                    fontWeight: '400',
                                                                                    flex: 1,
                                                                                    minWidth: 0,
                                                                                    wordBreak: 'break-word',
                                                                                    overflowWrap: 'break-word',
                                                                                    overflow: 'hidden'
                                                                                }}>
                                                                                    {eventData.checkout.paymentNotes}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </Col>
                                                                )}
                                                            </Row>
                                                        </Col>
                                                    </Row>
                                                </Card.Body>
                                            </Card>
                                        </div>
                                        {/* Mobile: No card wrapper, minimal padding */}
                                        <div className="d-block d-md-none px-2 py-2">
                                            {eventData.checkout?.status === 'Completed' && (
                                                <div className="mb-3 text-center">
                                                    <Button
                                                        variant="success"
                                                        size="sm"
                                                        onClick={async () => {
                                                            try {
                                                                const response = await axiosInstance.get(
                                                                    `/register-events/${id}/receipt`,
                                                                    {
                                                                        responseType: 'blob',
                                                                    }
                                                                );
                                                                
                                                                // Create blob URL and download
                                                                const blob = new Blob([response.data], { type: 'application/pdf' });
                                                                const url = window.URL.createObjectURL(blob);
                                                                const link = document.createElement('a');
                                                                link.href = url;
                                                                link.download = `Receipt-${eventData.checkout?.checkoutId || id}.pdf`;
                                                                document.body.appendChild(link);
                                                                link.click();
                                                                document.body.removeChild(link);
                                                                window.URL.revokeObjectURL(url);
                                                            } catch (error) {
                                                                toast.error('Failed to download receipt. Please try again.');
                                                                console.error('Receipt download error:', error);
                                                            }
                                                        }}
                                                        className="px-4"
                                                    >
                                                        <i className="fas fa-file-pdf mr-2"></i>
                                                        Download Receipt (PDF)
                                                    </Button>
                                                </div>
                                            )}
                                            <Row className="m-0" style={{ width: '100%', maxWidth: '100%' }}>
                                                <Col xs={12} className="p-0" style={{ overflow: 'hidden', width: '100%', maxWidth: '100%' }}>
                                                    <h5 className="mb-md-3 mb-3 pb-md-2 pb-2" style={{ 
                                                        fontSize: '16px', 
                                                        fontWeight: '600', 
                                                        color: '#000000',
                                                        borderBottom: '2px solid #4680ff'
                                                    }}>
                                                        <i className="fas fa-credit-card mr-2" style={{ color: '#4680ff' }}></i>
                                                        Payment Details
                                                    </h5>
                                                    <Row>
                                                        <InfoField 
                                                            label="Checkout ID" 
                                                            value={eventData.checkout?.checkoutId || 'N/A'}
                                                            icon="fas fa-hashtag"
                                                            colSize={6}
                                                        />
                                                        <InfoField 
                                                            label="Total Amount" 
                                                            value={
                                                                <span style={{ color: '#28a745', fontWeight: 'bold', fontSize: '14px' }}>
                                                                    {eventData.checkout?.totalAmount ? `$${parseFloat(eventData.checkout.totalAmount).toFixed(2)}` : 'N/A'}
                                                                </span>
                                                            }
                                                            icon="fas fa-dollar-sign"
                                                            colSize={6}
                                                        />
                                                        <InfoField 
                                                            label="Discount" 
                                                            value={
                                                                <span style={{ color: '#ffc107', fontWeight: 'bold', fontSize: '14px' }}>
                                                                    {eventData.checkout?.discount ? `$${parseFloat(eventData.checkout.discount).toFixed(2)}` : '$0.00'}
                                                                </span>
                                                            }
                                                            icon="fas fa-tag"
                                                            colSize={6}
                                                        />
                                                        <InfoField 
                                                            label="Coupon Code" 
                                                            value={eventData.checkout?.couponCode || 'N/A'}
                                                            icon="fas fa-ticket-alt"
                                                            colSize={6}
                                                        />
                                                        <InfoField 
                                                            label="Promo Code" 
                                                            value={eventData.checkout?.promoCode || 'N/A'}
                                                            icon="fas fa-tag"
                                                            colSize={6}
                                                        />
                                                        <InfoField 
                                                            label="Payment Gateway" 
                                                            value={
                                                                <Badge bg="info" style={{ fontSize: '12px', padding: '6px 12px', fontWeight: '600' }}>
                                                                    {eventData.checkout?.paymentGateway || 'N/A'}
                                                                </Badge>
                                                            }
                                                            icon="fas fa-wallet"
                                                            colSize={6}
                                                        />
                                                        <InfoField 
                                                            label="Payment Method" 
                                                            value={eventData.checkout?.paymentMethod || 'N/A'}
                                                            icon="fas fa-credit-card"
                                                            colSize={6}
                                                        />
                                                        <InfoField 
                                                            label="Transaction ID" 
                                                            value={eventData.checkout?.transactionId || 'N/A'}
                                                            icon="fas fa-receipt"
                                                            colSize={6}
                                                        />
                                                        <InfoField 
                                                            label="Status" 
                                                            value={
                                                                <Badge 
                                                                    bg={eventData.checkout?.status === 'Completed' ? 'success' : eventData.checkout?.status === 'Pending' ? 'warning' : 'danger'} 
                                                                    style={{ fontSize: '12px', padding: '6px 12px', fontWeight: '600' }}
                                                                >
                                                                    {eventData.checkout?.status || 'N/A'}
                                                                </Badge>
                                                            }
                                                            icon="fas fa-info-circle"
                                                            colSize={6}
                                                        />
                                                        <InfoField 
                                                            label="Created At" 
                                                            value={<span style={{ color: '#6c757d', fontSize: '13px' }}>{formatTimestamp(eventData.checkout?.createdAt)}</span>}
                                                            icon="fas fa-calendar-check"
                                                            colSize={6}
                                                        />
                                                        {eventData.checkout?.completedAt && (
                                                            <InfoField 
                                                                label="Completed At" 
                                                                value={<span style={{ color: '#6c757d', fontSize: '13px' }}>{formatTimestamp(eventData.checkout.completedAt)}</span>}
                                                                icon="fas fa-check-circle"
                                                                colSize={6}
                                                            />
                                                        )}
                                                        {eventData.checkout?.paymentNotes && (
                                                            <Col xs={12} sm={12} md={12} className="mb-2" style={{ overflow: 'hidden' }}>
                                                                <div style={{ 
                                                                    padding: '8px 12px',
                                                                    borderBottom: '1px solid #e9ecef',
                                                                    backgroundColor: '#f8f9fa',
                                                                    borderRadius: '4px',
                                                                    width: '100%',
                                                                    maxWidth: '100%',
                                                                    boxSizing: 'border-box'
                                                                }}
                                                                className="px-md-3 px-2 py-md-2 py-2"
                                                                >
                                                                    {/* Mobile & Tablet: Label on top */}
                                                                    <div className="d-block d-md-none">
                                                                        <div style={{ 
                                                                            fontSize: '13px', 
                                                                            fontWeight: '600', 
                                                                            color: '#4680ff',
                                                                            marginBottom: '4px',
                                                                            wordBreak: 'break-word',
                                                                            overflowWrap: 'break-word'
                                                                        }}>
                                                                            <span>Payment Notes:</span>
                                                                        </div>
                                                                        <div style={{ 
                                                                            fontSize: '14px', 
                                                                            color: '#000000',
                                                                            fontWeight: '400',
                                                                            wordBreak: 'break-word',
                                                                            overflowWrap: 'break-word',
                                                                            width: '100%',
                                                                            lineHeight: '1.5'
                                                                        }}>
                                                                            {eventData.checkout.paymentNotes}
                                                                        </div>
                                                                    </div>
                                                                    {/* Desktop: Label and value side by side */}
                                                                    <div className="d-none d-md-flex align-items-start" style={{ width: '100%', minWidth: 0 }}>
                                                                        <div style={{ 
                                                                            minWidth: '140px',
                                                                            maxWidth: '140px',
                                                                            fontSize: '13px', 
                                                                            fontWeight: '600', 
                                                                            color: '#4680ff',
                                                                            marginRight: '12px',
                                                                            flexShrink: 0
                                                                        }}>
                                                                            <span style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>Payment Notes:</span>
                                                                        </div>
                                                                        <div style={{ 
                                                                            fontSize: '14px', 
                                                                            color: '#000000',
                                                                            fontWeight: '400',
                                                                            flex: 1,
                                                                            minWidth: 0,
                                                                            wordBreak: 'break-word',
                                                                            overflowWrap: 'break-word',
                                                                            overflow: 'hidden'
                                                                        }}>
                                                                            {eventData.checkout.paymentNotes}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </Col>
                                                        )}
                                                    </Row>
                                                </Col>
                                            </Row>
                                        </div>
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
