import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Button, Form, Container, Spinner } from 'react-bootstrap';
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

    return (
        <Container fluid>
            <Row>
                <Col xs={12}>
                    <Card>
                        <Card.Header className="d-flex align-items-center">
                            <Button variant="light" size="sm" className="mr-2" onClick={handleBack}>
                                <i className="feather icon-arrow-left" />
                            </Button>
                            <h5 className="mb-0">{isEdit ? 'Update Coupon' : 'Create Coupon'}</h5>
                        </Card.Header>
                        <Card.Body>
                            <Form onSubmit={handleSubmit}>
                                <Row>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Coupon code (name)</Form.Label>
                                            <Form.Control
                                                name="name"
                                                value={form.name}
                                                onChange={handleChange}
                                                placeholder="e.g. WELCOME10"
                                                required
                                                disabled={isEdit}
                                            />
                                            {isEdit && (
                                                <Form.Text className="text-muted">Code cannot be changed when editing.</Form.Text>
                                            )}
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Status</Form.Label>
                                            <div className="pt-2">
                                                <Form.Check
                                                    type="switch"
                                                    name="isActive"
                                                    label={form.isActive ? 'Active' : 'Inactive'}
                                                    checked={form.isActive}
                                                    onChange={handleChange}
                                                />
                                            </div>
                                        </Form.Group>
                                    </Col>
                                </Row>
                                <Row>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Discount type</Form.Label>
                                            <Form.Control
                                                as="select"
                                                name="discountType"
                                                value={form.discountType}
                                                onChange={handleChange}
                                            >
                                                <option value="percentage">Percentage</option>
                                                <option value="fixed">Fixed amount</option>
                                            </Form.Control>
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Discount value {form.discountType === 'percentage' ? '(%)' : '($)'}</Form.Label>
                                            <Form.Control
                                                type="number"
                                                name="discountValue"
                                                value={form.discountValue}
                                                onChange={handleChange}
                                                min="0"
                                                step={form.discountType === 'percentage' ? 1 : 0.01}
                                                required
                                            />
                                        </Form.Group>
                                    </Col>
                                </Row>
                                <Row>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Minimum order value ($)</Form.Label>
                                            <Form.Control
                                                type="number"
                                                name="actualValue"
                                                value={form.actualValue}
                                                onChange={handleChange}
                                                min="0"
                                                step="0.01"
                                                required
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Usage limit per user</Form.Label>
                                            <Form.Control
                                                type="number"
                                                name="usageLimit"
                                                value={form.usageLimit}
                                                onChange={handleChange}
                                                min="1"
                                                required
                                            />
                                        </Form.Group>
                                    </Col>
                                </Row>
                                <Row>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Valid from</Form.Label>
                                            <Form.Control
                                                type="datetime-local"
                                                name="validFrom"
                                                value={form.validFrom}
                                                onChange={handleChange}
                                                required
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Valid to</Form.Label>
                                            <Form.Control
                                                type="datetime-local"
                                                name="validTo"
                                                value={form.validTo}
                                                onChange={handleChange}
                                                required
                                            />
                                        </Form.Group>
                                    </Col>
                                </Row>
                                <div className="d-flex gap-2 mt-3">
                                    <Button type="submit" variant="primary" disabled={loading}>
                                        {loading ? <Spinner animation="border" size="sm" className="mr-1" /> : null}
                                        {isEdit ? 'Update' : 'Create'}
                                    </Button>
                                    <Button type="button" variant="outline-secondary" onClick={handleBack}>
                                        Cancel
                                    </Button>
                                </div>
                            </Form>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default AddCouponPage;
