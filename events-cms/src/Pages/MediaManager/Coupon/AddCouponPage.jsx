import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Button, Form, Spinner } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { couponById, createCoupon, updateCoupon } from '../../../store/actions/couponActions';
import { MEDIA_MANAGER_PATHS } from '../../../utils/constants';
import 'bootstrap/dist/css/bootstrap.min.css';

const defaultForm = {
    name: '',
    isActive: true,
    actualValue: '',
    discountValue: '',
    discountType: 'percentage',
    usageLimit: '1',
    validFrom: '',
    validTo: ''
};

const sectionLabelStyle = {
    display: 'block',
    marginBottom: '12px',
    marginTop: '24px',
    fontSize: '0.9375rem',
    fontWeight: '600',
    color: '#2c3e50'
};

const sectionDividerStyle = {
    margin: '8px 0 20px 0',
    borderTop: '2px solid #e9ecef'
};

const AddCouponPage = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { id } = useParams();
    const isEdit = Boolean(id);
    const { couponByID, loading: reduxLoading } = useSelector((state) => state.coupon);

    const [form, setForm] = useState(defaultForm);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isEdit && id) {
            dispatch(couponById(id)).catch(() => navigate(MEDIA_MANAGER_PATHS.COUPON_LIST));
        }
    }, [id, isEdit, dispatch, navigate]);

    useEffect(() => {
        if (!isEdit || !couponByID || couponByID.id !== id) return;
        const from = couponByID.validFrom ? new Date(couponByID.validFrom).toISOString().slice(0, 16) : '';
        const to = couponByID.validTo ? new Date(couponByID.validTo).toISOString().slice(0, 16) : '';
        setForm({
            name: couponByID.name || '',
            isActive: Boolean(couponByID.isActive),
            actualValue: couponByID.actualValue != null ? String(couponByID.actualValue) : '',
            discountValue: couponByID.discountValue != null ? String(couponByID.discountValue) : '',
            discountType: couponByID.discountType || 'percentage',
            usageLimit: couponByID.usageLimit != null ? String(couponByID.usageLimit) : '1',
            validFrom: from,
            validTo: to
        });
    }, [id, isEdit, couponByID]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setForm((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleBack = () => navigate(MEDIA_MANAGER_PATHS.COUPON_LIST);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const actualValue = Number(form.actualValue);
        const discountValue = Number(form.discountValue);
        const usageLimit = Number(form.usageLimit);
        if (isNaN(actualValue) || actualValue < 0) {
            toast.error('Minimum order value must be a valid number ≥ 0');
            return;
        }
        if (isNaN(discountValue) || discountValue < 0) {
            toast.error('Discount value must be a valid number ≥ 0');
            return;
        }
        if (form.discountType === 'percentage' && discountValue > 100) {
            toast.error('Percentage discount cannot exceed 100');
            return;
        }
        if (isNaN(usageLimit) || usageLimit < 1) {
            toast.error('Usage limit must be at least 1');
            return;
        }
        if (!form.validFrom || !form.validTo) {
            toast.error('Valid from and valid to dates are required');
            return;
        }
        const validFrom = new Date(form.validFrom).toISOString();
        const validTo = new Date(form.validTo).toISOString();
        if (validFrom >= validTo) {
            toast.error('Valid from must be before valid to');
            return;
        }

        setLoading(true);
        try {
            const payload = {
                name: form.name.trim(),
                isActive: form.isActive,
                actualValue,
                discountValue,
                discountType: form.discountType,
                usageLimit,
                validFrom,
                validTo
            };
            let result;
            if (isEdit) {
                result = await dispatch(updateCoupon(id, payload));
            } else {
                result = await dispatch(createCoupon(payload));
            }
            if (result?.success) navigate(MEDIA_MANAGER_PATHS.COUPON_LIST);
        } catch (err) {
            const msg = err.response?.data?.message || err.message || (isEdit ? 'Update failed' : 'Create failed');
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    const fetchLoading = isEdit && reduxLoading && !couponByID;
    if (fetchLoading) {
        return (
            <Container fluid className="py-5 text-center">
                <Spinner animation="border" variant="primary" />
                <p className="mt-2 text-muted">Loading coupon...</p>
            </Container>
        );
    }

    const discountVal = parseFloat(form.discountValue) || 0;
    const minVal = parseFloat(form.actualValue) || 0;
    const showPreview = form.discountType && discountVal > 0;

    return (
        <Container fluid>
            <div className="row">
                <div className="col-12">
                    <div className="card" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: '1px solid #e9ecef' }}>
                        <div className="card-header" style={{
                            padding: '16px 24px',
                            backgroundColor: '#f8f9fa',
                            borderBottom: '1px solid #e9ecef',
                            fontWeight: '600'
                        }}>
                            <div className="d-flex justify-content-between align-items-center">
                                <h5 className="mb-0" style={{ fontWeight: '600', color: '#2c3e50' }}>
                                    {isEdit ? 'Edit Coupon' : 'Create Coupon'}
                                </h5>
                                <Button variant="secondary" onClick={handleBack}>
                                    <i className="fas fa-arrow-left" style={{ marginRight: '10px' }}></i>
                                    Back
                                </Button>
                            </div>
                        </div>
                        <div className="card-body" style={{ padding: '24px' }}>
                            <form onSubmit={handleSubmit}>
                                {/* Coupon code */}
                                <Row>
                                    <Col sm={12} md={8} lg={6}>
                                        <div className="form-group fill mb-3">
                                            <label className="floating-label" htmlFor="name">
                                                Coupon code <span className="text-danger">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                name="name"
                                                id="name"
                                                value={form.name}
                                                onChange={handleChange}
                                                placeholder="e.g. WELCOME10"
                                                required
                                                disabled={isEdit}
                                                style={{ textTransform: 'uppercase' }}
                                            />
                                            {isEdit && (
                                                <small className="text-muted d-block mt-1">Code cannot be changed when editing.</small>
                                            )}
                                        </div>
                                    </Col>
                                </Row>

                                {/* Discount settings */}
                                <label style={sectionLabelStyle}>
                                    <i className="fas fa-percent" style={{ color: '#4680ff', marginRight: '10px' }}></i>
                                    Discount settings
                                </label>
                                <hr style={sectionDividerStyle} />
                                <Row>
                                    <Col sm={12} md={6} lg={4}>
                                        <div className="form-group fill mb-3">
                                            <label className="floating-label" htmlFor="discountType">
                                                Discount type
                                            </label>
                                            <select
                                                className="form-control"
                                                name="discountType"
                                                id="discountType"
                                                value={form.discountType}
                                                onChange={handleChange}
                                            >
                                                <option value="percentage">Percentage (%)</option>
                                                <option value="fixed">Fixed amount ($)</option>
                                            </select>
                                        </div>
                                    </Col>
                                    <Col sm={12} md={6} lg={4}>
                                        <div className="form-group fill mb-3">
                                            <label className="floating-label" htmlFor="discountValue">
                                                Discount value <span className="text-danger">*</span>
                                            </label>
                                            <input
                                                type="number"
                                                className="form-control"
                                                name="discountValue"
                                                id="discountValue"
                                                value={form.discountValue}
                                                onChange={handleChange}
                                                min="0"
                                                step={form.discountType === 'percentage' ? 1 : 0.01}
                                                required
                                            />
                                        </div>
                                    </Col>
                                </Row>
                                {showPreview && (
                                    <div className="mb-4 p-3 rounded" style={{ backgroundColor: '#f0f7ff', border: '1px solid #d0e3ff' }}>
                                        <small className="text-muted d-block mb-1">Preview</small>
                                        <span style={{ fontWeight: '600', color: '#0066cc' }}>
                                            {form.discountType === 'percentage'
                                                ? `${discountVal}% off`
                                                : `$${discountVal.toFixed(2)} off`}
                                            {minVal > 0 && ` on orders ≥ $${minVal.toFixed(2)}`}
                                        </span>
                                    </div>
                                )}

                                {/* Usage & validity */}
                                <label style={sectionLabelStyle}>
                                    <i className="fas fa-calendar-alt" style={{ color: '#4680ff', marginRight: '10px' }}></i>
                                    Usage & validity
                                </label>
                                <hr style={sectionDividerStyle} />
                                <Row>
                                    <Col sm={12} md={6}>
                                        <div className="form-group fill mb-3">
                                            <label className="floating-label" htmlFor="actualValue">
                                                Minimum order value ($) <span className="text-danger">*</span>
                                            </label>
                                            <input
                                                type="number"
                                                className="form-control"
                                                name="actualValue"
                                                id="actualValue"
                                                value={form.actualValue}
                                                onChange={handleChange}
                                                min="0"
                                                step="0.01"
                                                required
                                            />
                                            <small className="text-muted">Minimum cart value to apply coupon</small>
                                        </div>
                                    </Col>
                                    <Col sm={12} md={6}>
                                        <div className="form-group fill mb-3">
                                            <label className="floating-label" htmlFor="usageLimit">
                                                Usage limit per user <span className="text-danger">*</span>
                                            </label>
                                            <input
                                                type="number"
                                                className="form-control"
                                                name="usageLimit"
                                                id="usageLimit"
                                                value={form.usageLimit}
                                                onChange={handleChange}
                                                min="1"
                                                required
                                            />
                                            <small className="text-muted">How many times each user can use this coupon</small>
                                        </div>
                                    </Col>
                                    <Col sm={12} md={6}>
                                        <div className="form-group fill mb-3">
                                            <label className="floating-label" htmlFor="validFrom">
                                                Valid from <span className="text-danger">*</span>
                                            </label>
                                            <input
                                                type="datetime-local"
                                                className="form-control"
                                                name="validFrom"
                                                id="validFrom"
                                                value={form.validFrom}
                                                onChange={handleChange}
                                                required
                                            />
                                        </div>
                                    </Col>
                                    <Col sm={12} md={6}>
                                        <div className="form-group fill mb-3">
                                            <label className="floating-label" htmlFor="validTo">
                                                Valid to <span className="text-danger">*</span>
                                            </label>
                                            <input
                                                type="datetime-local"
                                                className="form-control"
                                                name="validTo"
                                                id="validTo"
                                                value={form.validTo}
                                                onChange={handleChange}
                                                required
                                            />
                                        </div>
                                    </Col>
                                </Row>

                                {/* Status - Last */}
                                <label style={sectionLabelStyle}>
                                    <i className="fas fa-toggle-on" style={{ color: '#4680ff', marginRight: '10px' }}></i>
                                    Status
                                </label>
                                <hr style={sectionDividerStyle} />
                                <Row>
                                    <Col sm={12}>
                                        <div className="d-flex align-items-center p-3 rounded" style={{ backgroundColor: '#f8f9fa', border: '1px solid #e9ecef' }}>
                                            <Form.Check
                                                type="switch"
                                                name="isActive"
                                                id="isActive"
                                                label={form.isActive ? 'Active – Coupon can be used' : 'Inactive – Coupon is disabled'}
                                                checked={form.isActive}
                                                onChange={handleChange}
                                                style={{ fontSize: '0.95rem' }}
                                            />
                                            <span className={`ms-2 badge ${form.isActive ? 'bg-success' : 'bg-secondary'}`}>
                                                {form.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </div>
                                    </Col>
                                </Row>

                                {/* Actions - same as event form */}
                                <div className="row mt-4">
                                    <div className="col-12">
                                        <div className="d-flex justify-content-between gap-2">
                                            <Button variant="danger" onClick={handleBack} disabled={loading}>
                                                Cancel
                                            </Button>
                                            <Button variant="primary" type="submit" disabled={loading}>
                                                {loading ? <Spinner animation="border" size="sm" className="me-2" /> : null}
                                                {loading ? (isEdit ? 'Updating...' : 'Creating...') : (isEdit ? 'Update' : 'Create')}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </Container>
    );
};

export default AddCouponPage;
