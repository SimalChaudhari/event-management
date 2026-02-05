import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Container, Row, Col, Card, Badge, Button, Spinner } from 'react-bootstrap';
import { couponById } from '../../../store/actions/couponActions';
import { MEDIA_MANAGER_PATHS } from '../../../utils/constants';
import 'bootstrap/dist/css/bootstrap.min.css';

const ViewCouponPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { couponByID: coupon, loading } = useSelector((state) => state.coupon);

    useEffect(() => {
        if (id) dispatch(couponById(id));
    }, [id, dispatch]);

    const formatDate = (d) => {
        if (!d) return 'N/A';
        return new Date(d).toLocaleString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const InfoField = ({ label, value, colSize = 6 }) => (
        <Col xs={12} sm={12} md={colSize} className="mb-2" style={{ overflow: 'hidden' }}>
            <div
                style={{
                    padding: '8px 12px',
                    borderBottom: '1px solid #e9ecef',
                    width: '100%',
                    maxWidth: '100%',
                    boxSizing: 'border-box'
                }}
                className="px-md-3 px-2 py-md-2 py-2"
            >
                <div className="d-block d-md-none">
                    <div style={{ fontSize: '13px', fontWeight: '600', color: '#4680ff', marginBottom: '4px', wordBreak: 'break-word' }}>
                        {label}
                    </div>
                    <div style={{ fontSize: '14px', color: '#000', fontWeight: '400', wordBreak: 'break-word', width: '100%', lineHeight: '1.5' }}>
                        {value != null && value !== '' ? value : 'N/A'}
                    </div>
                </div>
                <div className="d-none d-md-flex align-items-start" style={{ width: '100%', minWidth: 0 }}>
                    <div style={{ minWidth: '140px', maxWidth: '140px', fontSize: '13px', fontWeight: '600', color: '#4680ff', marginRight: '12px', flexShrink: 0 }}>
                        {label}
                    </div>
                    <div style={{ fontSize: '14px', color: '#000', fontWeight: '400', flex: 1, minWidth: 0, wordBreak: 'break-word', overflow: 'hidden' }}>
                        {value != null && value !== '' ? value : 'N/A'}
                    </div>
                </div>
            </div>
        </Col>
    );

    if (loading) {
        return (
            <Container fluid className="mt-4">
                <Card>
                    <Card.Body className="text-center py-5">
                        <Spinner animation="border" variant="primary" />
                        <p className="mt-2 text-muted mb-0">Loading coupon...</p>
                    </Card.Body>
                </Card>
            </Container>
        );
    }

    if (!loading && !coupon) {
        return (
            <Container fluid className="mt-4">
                <Card>
                    <Card.Body>
                        <p className="text-danger mb-3">Coupon not found.</p>
                        <Button variant="outline-primary" onClick={() => navigate(MEDIA_MANAGER_PATHS.COUPON_LIST)}>
                            <i className="feather icon-arrow-left mr-2" /> Back to Coupons
                        </Button>
                    </Card.Body>
                </Card>
            </Container>
        );
    }

    const discountDisplay = coupon.discountType === 'percentage'
        ? `${Number(coupon.discountValue)}%`
        : `$${Number(coupon.discountValue ?? 0).toFixed(2)}`;

    return (
        <Container fluid className="mt-4">
            <Row>
                <Col xs={12}>
                    <div className="d-flex flex-wrap align-items-center justify-content-between mb-3">
                        <div className="d-flex align-items-center flex-wrap gap-2">
                            <Button variant="light" size="sm" onClick={() => navigate(MEDIA_MANAGER_PATHS.COUPON_LIST)}>
                                <i className="feather icon-arrow-left" />
                            </Button>
                            <h5 className="mb-0">Coupon Details</h5>
                            <Badge variant={coupon.isActive ? 'success' : 'secondary'} className="ml-2">
                                {coupon.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                        </div>
                        <Button variant="primary" size="sm" onClick={() => navigate(`${MEDIA_MANAGER_PATHS.EDIT_COUPON}/${id}`)}>
                            <i className="feather icon-edit mr-1" /> Edit
                        </Button>
                    </div>

                    <Card>
                        <Card.Header style={{ backgroundColor: '#f8f9fa', fontWeight: '600' }}>
                            {coupon.name}
                        </Card.Header>
                        <Card.Body>
                            <Row>
                                <InfoField label="Coupon code" value={coupon.name} />
                                <InfoField label="Status" value={coupon.isActive ? 'Active' : 'Inactive'} />
                                <InfoField label="Discount type" value={coupon.discountType === 'percentage' ? 'Percentage' : 'Fixed amount'} />
                                <InfoField label="Discount value" value={discountDisplay} />
                                <InfoField label="Minimum order value" value={`$${Number(coupon.actualValue ?? 0).toFixed(2)}`} />
                                <InfoField label="Usage limit per user" value={coupon.usageLimit ?? 'N/A'} />
                                <InfoField label="Valid from" value={formatDate(coupon.validFrom)} />
                                <InfoField label="Valid to" value={formatDate(coupon.validTo)} />
                                <InfoField label="Created" value={formatDate(coupon.createdAt)} />
                                <InfoField label="Last updated" value={formatDate(coupon.updatedAt)} />
                            </Row>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default ViewCouponPage;
