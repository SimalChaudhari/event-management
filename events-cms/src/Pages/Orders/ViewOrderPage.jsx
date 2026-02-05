import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Badge, Button } from 'react-bootstrap';
import axiosInstance from '../../configs/axiosInstance';
import { TRANSACTION_PATHS } from '../../utils/constants';

const ViewOrderPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [orderData, setOrderData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!id) return;
        let cancelled = false;
        setLoading(true);
        setError(null);
        axiosInstance
            .get(`/orders/${id}`)
            .then((res) => {
                if (!cancelled && res.data?.data) setOrderData(res.data.data);
            })
            .catch((err) => {
                if (!cancelled) setError(err?.response?.data?.message || 'Failed to load order');
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => { cancelled = true; };
    }, [id]);

    const formatTimestamp = (ts) => {
        if (!ts) return 'N/A';
        return new Date(ts).toLocaleString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getStatusBadge = (status) => {
        const s = (status || '').toLowerCase();
        if (s === 'completed') return 'success';
        if (s === 'cancelled' || s === 'failed') return 'danger';
        if (s === 'pending') return 'warning';
        return 'secondary';
    };

    const InfoField = ({ label, value, icon = null, colSize = 6 }) => (
        <Col xs={12} sm={12} md={colSize} className="mb-2" style={{ overflow: 'hidden' }}>
            <div
                style={{
                    padding: '8px 12px',
                    borderBottom: '1px solid #e9ecef',
                    width: '100%',
                    maxWidth: '100%',
                    boxSizing: 'border-box',
                }}
                className="px-md-3 px-2 py-md-2 py-2"
            >
                <div className="d-block d-md-none">
                    <div style={{ fontSize: '13px', fontWeight: '600', color: '#4680ff', marginBottom: '4px', wordBreak: 'break-word' }}>
                        <span>{label}</span>
                    </div>
                    <div style={{ fontSize: '14px', color: '#000000', fontWeight: '400', wordBreak: 'break-word', width: '100%', lineHeight: '1.5' }}>
                        {value != null && value !== '' ? value : 'N/A'}
                    </div>
                </div>
                <div className="d-none d-md-flex align-items-start" style={{ width: '100%', minWidth: 0 }}>
                    <div style={{ minWidth: '140px', maxWidth: '140px', fontSize: '13px', fontWeight: '600', color: '#4680ff', marginRight: '12px', flexShrink: 0 }}>
                        <span style={{ wordBreak: 'break-word' }}>{label}</span>
                    </div>
                    <div style={{ fontSize: '14px', color: '#000000', fontWeight: '400', flex: 1, minWidth: 0, wordBreak: 'break-word', overflow: 'hidden' }}>
                        {value != null && value !== '' ? value : 'N/A'}
                    </div>
                </div>
            </div>
        </Col>
    );

    if (loading) {
        return (
            <Container fluid className="mt-4">
                <div style={{ backgroundColor: '#fff', borderRadius: '8px', padding: '24px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                    <p className="mb-0">Loading...</p>
                </div>
            </Container>
        );
    }
    if (error) {
        return (
            <Container fluid className="mt-4">
                <div style={{ backgroundColor: '#fff', borderRadius: '8px', padding: '24px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                    <p className="text-danger mb-3">{error}</p>
                    <Button variant="outline-primary" onClick={() => navigate(TRANSACTION_PATHS.ORDER_LIST)}>
                        <i className="fas fa-arrow-left me-2" /> Back to Orders
                    </Button>
                </div>
            </Container>
        );
    }
    if (!orderData) {
        return (
            <Container fluid className="mt-4">
                <div style={{ backgroundColor: '#fff', borderRadius: '8px', padding: '24px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                    <p className="mb-0">Order not found.</p>
                    <Button variant="outline-secondary" className="mt-3" onClick={() => navigate(TRANSACTION_PATHS.ORDER_LIST)}>
                        Back to Orders
                    </Button>
                </div>
            </Container>
        );
    }

    const checkout = orderData.checkout || {};
    const user = orderData.user || {};
    const items = orderData.orderItems || [];
    const firstItemDate = items.length && items[0].createdAt ? formatTimestamp(items[0].createdAt) : 'N/A';

    return (
        <>
            <Container fluid className="mt-4" style={{ overflowX: 'hidden', width: '100%', maxWidth: '100%' }}>
                {/* Header - same as View User / View Event */}
                <div
                    style={{
                        backgroundColor: '#fff',
                        borderRadius: '8px',
                        padding: '20px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        marginBottom: '24px',
                        borderTop: '4px solid #4680ff',
                    }}
                >
                    <div className="d-flex justify-content-between align-items-center flex-wrap">
                        <div style={{ flex: '1', minWidth: '200px' }}>
                            <h4 style={{ margin: 0, color: '#000000', fontWeight: '600', fontSize: 'clamp(18px, 4vw, 24px)', wordBreak: 'break-word' }}>
                                <i className="fas fa-receipt mr-2" style={{ color: '#4680ff' }} />
                                View Order
                            </h4>
                            {orderData.orderNo && (
                                <p className="mb-0 mt-1 text-muted" style={{ fontSize: '14px' }}>
                                    {orderData.orderNo}
                                </p>
                            )}
                        </div>
                        <Button
                            variant="secondary"
                            onClick={() => navigate(TRANSACTION_PATHS.ORDER_LIST)}
                            className="mt-2 mt-md-0"
                            style={{ borderRadius: '8px', padding: '8px 16px', fontWeight: '500', fontSize: '14px', whiteSpace: 'nowrap' }}
                        >
                            <i className="fas fa-arrow-left me-2" /> Back to Orders
                        </Button>
                    </div>
                </div>

                {/* Stats row - like Event view */}
                <div className="d-none d-md-block mb-4">
                    <Row className="g-2">
                        <Col xs={6} sm={4} md={3}>
                            <div className="text-center p-2" style={{ backgroundColor: '#f8f9fa', borderRadius: '8px', border: '1px solid #e9ecef', padding: '15px', height: '100%' }}>
                                <i className="fas fa-shopping-cart text-primary mb-2" style={{ fontSize: '1.3rem' }} />
                                <h6 className="mb-1" style={{ color: '#495057', fontSize: '0.85rem' }}>Total Items</h6>
                                <p className="mb-0" style={{ fontSize: '0.95rem', fontWeight: '500', color: '#28a745' }}>{items.length}</p>
                            </div>
                        </Col>
                        <Col xs={6} sm={4} md={3}>
                            <div className="text-center p-2" style={{ backgroundColor: '#f8f9fa', borderRadius: '8px', border: '1px solid #e9ecef', padding: '15px', height: '100%' }}>
                                <i className="fas fa-dollar-sign text-primary mb-2" style={{ fontSize: '1.3rem' }} />
                                <h6 className="mb-1" style={{ color: '#495057', fontSize: '0.85rem' }}>Total Amount</h6>
                                <p className="mb-0" style={{ fontSize: '0.95rem', fontWeight: '500' }}>${Number(orderData.price ?? 0).toFixed(2)}</p>
                            </div>
                        </Col>
                        <Col xs={6} sm={4} md={3}>
                            <div className="text-center p-2" style={{ backgroundColor: '#f8f9fa', borderRadius: '8px', border: '1px solid #e9ecef', padding: '15px', height: '100%' }}>
                                <i className="fas fa-calendar text-primary mb-2" style={{ fontSize: '1.3rem' }} />
                                <h6 className="mb-1" style={{ color: '#495057', fontSize: '0.85rem' }}>Order Date</h6>
                                <p className="mb-0" style={{ fontSize: '0.95rem', fontWeight: '500' }}>{firstItemDate}</p>
                            </div>
                        </Col>
                        <Col xs={6} sm={4} md={3}>
                            <div className="text-center p-2" style={{ backgroundColor: '#f8f9fa', borderRadius: '8px', border: '1px solid #e9ecef', padding: '15px', height: '100%' }}>
                                <i className="fas fa-credit-card text-primary mb-2" style={{ fontSize: '1.3rem' }} />
                                <h6 className="mb-1" style={{ color: '#495057', fontSize: '0.85rem' }}>Payment Method</h6>
                                <p className="mb-0" style={{ fontSize: '0.95rem', fontWeight: '500' }}>{orderData.paymentMethod || 'N/A'}</p>
                            </div>
                        </Col>
                    </Row>
                </div>

                {/* Main content card */}
                <Card style={{ backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', border: '1px solid #e9ecef', overflow: 'hidden' }}>
                    <Card.Body style={{ padding: '24px', overflow: 'hidden', width: '100%', maxWidth: '100%' }}>
                        <Row style={{ margin: 0, width: '100%', maxWidth: '100%' }}>
                            {/* Order & Customer Information */}
                            <Col xs={12} className="mb-4" style={{ overflow: 'hidden' }}>
                                <h5 style={{ fontSize: '16px', fontWeight: '600', color: '#000000', marginBottom: '16px', paddingBottom: '8px', borderBottom: '2px solid #4680ff' }}>
                                    <i className="fas fa-receipt mr-2" style={{ color: '#4680ff' }} /> Order & Customer Information
                                </h5>
                                <Row>
                                    <InfoField label="Order No" value={orderData.orderNo} colSize={6} />
                                    <InfoField label="Status" value={<Badge bg={getStatusBadge(orderData.status)}>{orderData.status || 'N/A'}</Badge>} colSize={6} />
                                    <InfoField label="Price" value={`$${Number(orderData.price ?? 0).toFixed(2)}`} colSize={6} />
                                    {orderData.discount != null && Number(orderData.discount) > 0 && (
                                        <InfoField label="Discount" value={`$${Number(orderData.discount).toFixed(2)}`} colSize={6} />
                                    )}
                                    {orderData.originalPrice != null && (
                                        <InfoField label="Original Price" value={`$${Number(orderData.originalPrice).toFixed(2)}`} colSize={6} />
                                    )}
                                    <InfoField label="Payment Method" value={orderData.paymentMethod} colSize={6} />
                                    <InfoField label="Customer" value={[user.firstName, user.lastName].filter(Boolean).join(' ').trim()} colSize={6} />
                                    <InfoField label="Email" value={user.email} colSize={6} />
                                    <InfoField label="Mobile" value={user.mobile} colSize={6} />
                                </Row>
                            </Col>

                            {/* Events in order */}
                            <Col xs={12} className="mb-4" style={{ overflow: 'hidden' }}>
                                <h5 style={{ fontSize: '16px', fontWeight: '600', color: '#000000', marginBottom: '16px', paddingBottom: '8px', borderBottom: '2px solid #4680ff' }}>
                                    <i className="fas fa-calendar-alt mr-2" style={{ color: '#4680ff' }} /> Events ({items.length})
                                </h5>
                                {items.length === 0 ? (
                                    <p className="text-muted mb-0">No events in this order.</p>
                                ) : (
                                    <Row>
                                        {items.map((item) => (
                                            <Col md={6} lg={4} key={item.id} className="mb-3">
                                                <div style={{ padding: '14px', border: '1px solid #e9ecef', borderRadius: '8px', backgroundColor: '#f8f9fa', height: '100%' }}>
                                                    <strong style={{ fontSize: '15px' }}>{item.event?.name || 'Event'}</strong>
                                                    {item.event?.startDate && (
                                                        <p className="mb-1 mt-1 small text-muted">{formatTimestamp(item.event.startDate)}</p>
                                                    )}
                                                    {item.event?.price != null && (
                                                        <p className="mb-1" style={{ fontWeight: '600', color: '#28a745' }}>
                                                            ${Number(item.event.price).toFixed(2)} {item.event.currency || ''}
                                                        </p>
                                                    )}
                                                    {item.event?.location && <p className="mb-0 small">{item.event.location}</p>}
                                                </div>
                                            </Col>
                                        ))}
                                    </Row>
                                )}
                            </Col>

                            {/* Checkout Details */}
                            {checkout && (checkout.checkoutId || checkout.orderNo) && (
                                <Col xs={12} style={{ overflow: 'hidden' }}>
                                    <h5 style={{ fontSize: '16px', fontWeight: '600', color: '#000000', marginBottom: '16px', paddingBottom: '8px', borderBottom: '2px solid #4680ff' }}>
                                        <i className="fas fa-credit-card mr-2" style={{ color: '#4680ff' }} /> Checkout Details
                                    </h5>
                                    <Row>
                                        {checkout.checkoutId && <InfoField label="Checkout ID" value={checkout.checkoutId} colSize={6} />}
                                        {checkout.orderNo && <InfoField label="Order No" value={checkout.orderNo} colSize={6} />}
                                        {(checkout.orderStatus != null || checkout.status != null) && (
                                            <InfoField label="Status" value={<Badge bg={getStatusBadge(checkout.orderStatus || checkout.status)}>{checkout.orderStatus || checkout.status}</Badge>} colSize={6} />
                                        )}
                                        {checkout.thisEventAmountPaid != null && <InfoField label="Amount (this event)" value={`$${Number(checkout.thisEventAmountPaid).toFixed(2)}`} colSize={6} />}
                                        {checkout.orderDiscountPercent != null && <InfoField label="Discount %" value={`${checkout.orderDiscountPercent}%`} colSize={6} />}
                                        {checkout.couponCode && <InfoField label="Coupon Code" value={checkout.couponCode} colSize={6} />}
                                        {checkout.paymentGateway && <InfoField label="Payment Gateway" value={checkout.paymentGateway} colSize={6} />}
                                        {checkout.paymentMethod && <InfoField label="Payment Method" value={checkout.paymentMethod} colSize={6} />}
                                        {checkout.transactionId && <InfoField label="Transaction ID" value={checkout.transactionId} colSize={6} />}
                                        {checkout.createdAt && <InfoField label="Created" value={formatTimestamp(checkout.createdAt)} colSize={6} />}
                                        {checkout.completedAt && <InfoField label="Completed" value={formatTimestamp(checkout.completedAt)} colSize={6} />}
                                        {checkout.paymentNotes && <InfoField label="Payment Notes" value={checkout.paymentNotes} colSize={12} />}
                                    </Row>
                                </Col>
                            )}
                        </Row>
                    </Card.Body>
                </Card>
            </Container>
        </>
    );
};

export default ViewOrderPage;
