import * as React from 'react';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Table from 'react-bootstrap/Table';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import { useDispatch } from 'react-redux';
import * as $ from 'jquery';
import '../../assets/css/event.css';
import DeleteConfirmationModal from '../../components/modal/DeleteConfirmationModal';
import { orderDelete, orderDeleteAll, updateOrderStatus, fetchOrderCustomers } from '../../store/actions/orderActions';
import SearchableDropdown from '../../components/common/SearchableDropdown';
import OrderStatusConfirmationModal from './modal/OrderStatusConfirmationModal';
import { initializeServerSideDataTable } from '../../utils/dataTableServerSide';
import axiosInstance from '../../configs/axiosInstance';
import { ORDER_LOADING } from '../../store/constants/actionTypes';
import { TRANSACTION_PATHS } from '../../utils/constants';
import { toast } from 'react-toastify';

// @ts-ignore
$.DataTable = require('datatables.net-bs');

// Normalize order/checkout status for display (backend: Pending, Completed, Cancelled; checkout can add Failed, Processing)
function getOrderStatusDisplay(status) {
    const s = (status || '').toString().trim();
    const lower = s.toLowerCase();
    if (lower === 'completed' || lower === 'success') return { label: 'Completed', color: '#28a745', badgeClass: 'badge-light-success' };
    if (lower === 'cancelled' || lower === 'canceled') return { label: 'Cancelled', color: '#dc3545', badgeClass: 'badge-light-danger' };
    if (lower === 'pending') return { label: 'Pending', color: '#ffc107', badgeClass: 'badge-light-warning' };
    if (lower === 'failed') return { label: 'Failed', color: '#fd7e14', badgeClass: 'badge-light-danger' };
    if (lower === 'processing') return { label: 'Processing', color: '#17a2b8', badgeClass: 'badge-light-info' };
    return { label: s || 'N/A', color: '#6c757d', badgeClass: 'badge-light-secondary' };
}

function formatOrderCreatedDate(value) {
    if (!value) return 'N/A';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return 'N/A';
    return d.toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });
}

function getOrderColumns() {
    return [
        {
            data: 'orderNo',
            title: 'Order No',
            orderable: true,
            render: function (data, type, row) {
                const statusDisplay = getOrderStatusDisplay(row?.status);
                const priceVal = row?.price;
                const amountPaid = (priceVal != null && priceVal !== '') ? '$' + parseFloat(priceVal).toFixed(2) : '—';
                return `
                    <div class="d-inline-block align-middle">
                        <div class="d-inline-block">
                            <h6 class="mb-1" style="font-weight: bold;">${(row && row.orderNo) || ''}</h6>
                            <p class="mb-1" style="font-weight: 500;"><strong>Payment Method:</strong> ${row?.paymentMethod || '—'}</p>
                            <p class="mb-1" style="font-weight: 600;"><strong>Amount Paid:</strong> ${amountPaid}</p>
                            <p class="mb-0"><strong>Status:</strong>
                                <span class="badge ${statusDisplay.badgeClass}" style="background-color: ${statusDisplay.color}; color: #fff;">${statusDisplay.label}</span>
                            </p>
                        </div>
                    </div>`;
            }
        },
        {
            data: 'user',
            title: 'Customer',
            orderable: false,
            render: function (data, type, row) {
                const u = (row && row.user) || {};
                const fullName = [u.firstName, u.lastName].filter(Boolean).join(' ').trim() || '—';
                const email = u.email || '';
                const display = email ? fullName + ' (' + email + ')' : fullName;
                return `
                    <div class="d-inline-block align-middle">
                        <div class="d-inline-block">
                            <h6 class="mb-1">${display}</h6>
                            <small class="text-muted">${u.mobile || 'N/A'}</small>
                        </div>
                    </div>`;
            }
        },
        {
            data: 'orderItems',
            title: 'Events',
            orderable: false,
            render: function (data, type, row) {
                const items = row.orderItems || [];
                const eventCount = items.length;
                const eventNames = eventCount ? items.map((item) => (item.event && item.event.name) || 'Event').join(', ') : '—';
                return `
                    <div>
                        <span class="badge badge-light-info">${eventCount} event${eventCount !== 1 ? 's' : ''}</span>
                        <div class="mt-1 text-truncate" style="max-width: 200px;" title="${eventNames}">${eventNames}</div>
                    </div>`;
            }
        },
        {
            data: 'status',
            title: 'Status',
            orderable: false,
            render: function (data, type, row) {
                const statusDisplay = getOrderStatusDisplay(row?.status);
                return `<span class="badge ${statusDisplay.badgeClass}" style="background-color: ${statusDisplay.color}; color: #fff;">${statusDisplay.label}</span>`;
            }
        },
        {
            data: 'createdAt',
            title: 'Order Created Date',
            orderable: true,
            render: function (data, type, row) {
                if (type === 'sort' || type === 'type') {
                    return row?.createdAt ? new Date(row.createdAt).getTime() : 0;
                }
                return formatOrderCreatedDate(row?.createdAt);
            }
        },
        {
            data: null,
            title: 'Actions',
            orderable: false,
            render: function (data, type, row) {
                const id = (row && row.id) ? row.id : '';
                if (row?.sourceType === 'checkout_failed') {
                    return `
                    <div class="btn-group" role="group" aria-label="Actions">
                        <button type="button" class="btn btn-secondary btn-circle btn-sm" title="No order created for failed payment"
                            style="width: 40px; height: 40px; border-radius: 50%; display: inline-flex; justify-content: center; align-items: center; cursor:not-allowed;" disabled>
                            <i class="feather icon-alert-circle"></i>
                        </button>
                    </div>`;
                }
                return `
                    <div class="btn-group" role="group" aria-label="Actions">
                        <button type="button" class="btn btn-success btn-circle btn-sm view-btn mr-2" data-id="${id}" title="View"
                            style="width: 40px; height: 40px; border-radius: 50%; display: inline-flex; justify-content: center; align-items: center; margin-right: 8px;">
                            <i class="feather icon-eye"></i>
                        </button>
                        <button type="button" class="btn btn-danger btn-circle btn-sm delete-btn" data-id="${id}" title="Delete"
                            style="width: 40px; height: 40px; border-radius: 50%; display: inline-flex; justify-content: center; align-items: center;">
                            <i class="feather icon-trash-2"></i>
                        </button>
                    </div>`;
            }
        }
    ];
}

const OrderView = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const tableRef = useRef(null);
    const filtersRef = useRef({ customerId: '', status: '', dateFrom: '', dateTo: '' });

    const [filters, setFilters] = useState({ customerId: '', status: '', dateFrom: '', dateTo: '' });
    const [customerOptions, setCustomerOptions] = useState([]);
    const [customerLoading, setCustomerLoading] = useState(false);
    const [customerSearch, setCustomerSearch] = useState('');
    const [customerPage, setCustomerPage] = useState(1);
    const [customerPagination, setCustomerPagination] = useState({ totalPages: 1 });
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
    const [isDeletingAll, setIsDeletingAll] = useState(false);
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [statusToUpdate, setStatusToUpdate] = useState(null);
    const [orderToUpdate, setOrderToUpdate] = useState(null);
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

    const handleDelete = useCallback((orderId) => {
        setItemToDelete({ id: orderId });
        setShowDeleteModal(true);
    }, []);

    const handleView = useCallback((data) => {
        if (data?.id) navigate(`${TRANSACTION_PATHS.VIEW_ORDER}/${data.id}`);
    }, [navigate]);

    const handleStatusClick = useCallback((orderItemId, status, orderData) => {
        setStatusToUpdate({ id: orderItemId, status });
        setOrderToUpdate(orderData);
        setShowStatusModal(true);
    }, []);

    const handleConfirmDelete = useCallback(async () => {
        if (!itemToDelete) return;
        setIsDeleting(true);
        try {
            await dispatch(orderDelete(itemToDelete.id));
            toast.success('Order deleted successfully.');
            setShowDeleteModal(false);
            setItemToDelete(null);
            if (tableRef.current) tableRef.current.ajax.reload();
        } catch (e) {
            console.error('Delete failed:', e);
            toast.error(e?.response?.data?.message || 'Failed to delete order.');
        } finally {
            setIsDeleting(false);
        }
    }, [itemToDelete, dispatch]);

    const handleClose = useCallback(() => {
        if (!isDeleting) {
            setShowDeleteModal(false);
            setItemToDelete(null);
        }
    }, [isDeleting]);

    const handleDeleteAll = useCallback(() => setShowDeleteAllModal(true), []);

    const handleConfirmDeleteAll = useCallback(async () => {
        setIsDeletingAll(true);
        try {
            await dispatch(orderDeleteAll());
            toast.success('All orders deleted successfully.');
            setShowDeleteAllModal(false);
            if (tableRef.current) tableRef.current.ajax.reload();
        } catch (e) {
            console.error('Delete all failed:', e);
            toast.error(e?.response?.data?.message || 'Failed to delete all orders.');
        } finally {
            setIsDeletingAll(false);
        }
    }, [dispatch]);

    const handleCloseDeleteAll = useCallback(() => {
        if (!isDeletingAll) setShowDeleteAllModal(false);
    }, [isDeletingAll]);

    const handleStatusConfirm = useCallback(async () => {
        if (!statusToUpdate) return;
        setIsUpdatingStatus(true);
        try {
            await dispatch(updateOrderStatus(statusToUpdate.id, statusToUpdate.status));
            setShowStatusModal(false);
            setStatusToUpdate(null);
            setOrderToUpdate(null);
            if (tableRef.current) tableRef.current.ajax.reload();
        } catch (e) {
            console.error('Error updating order status:', e);
        } finally {
            setIsUpdatingStatus(false);
        }
    }, [statusToUpdate, dispatch]);

    const handleStatusModalClose = useCallback(() => {
        if (!isUpdatingStatus) {
            setShowStatusModal(false);
            setStatusToUpdate(null);
            setOrderToUpdate(null);
        }
    }, [isUpdatingStatus]);

    const applyFilters = useCallback(() => {
        filtersRef.current = { ...filters };
        if (tableRef.current) tableRef.current.ajax.reload();
    }, [filters]);

    const clearFilters = useCallback(() => {
        setFilters({ customerId: '', status: '', dateFrom: '', dateTo: '' });
        filtersRef.current = { customerId: '', status: '', dateFrom: '', dateTo: '' };
        if (tableRef.current) tableRef.current.ajax.reload();
    }, []);

    const activeFiltersCount = [filters.customerId, filters.status, filters.dateFrom, filters.dateTo].filter(Boolean).length;

    const loadCustomers = useCallback(async (search = '', page = 1, append = false) => {
        setCustomerLoading(true);
        try {
            const result = await dispatch(fetchOrderCustomers({ search, page, limit: 20 }));
            if (result?.data) {
                if (append) {
                    setCustomerOptions((prev) => [...prev, ...result.data]);
                } else {
                    setCustomerOptions(result.data);
                }
                setCustomerPagination({ total: result.total, totalPages: result.totalPages || 1 });
                setCustomerPage(page);
            }
        } catch (e) {
            if (!append) setCustomerOptions([]);
        } finally {
            setCustomerLoading(false);
        }
    }, [dispatch]);

    const handleCustomerOpen = useCallback(() => {
        if (customerOptions.length === 0) loadCustomers('', 1, false);
    }, [customerOptions.length, loadCustomers]);

    const handleCustomerSearch = useCallback((searchTerm) => {
        setCustomerSearch(searchTerm);
        setCustomerPage(1);
        loadCustomers(searchTerm, 1, false);
    }, [loadCustomers]);

    const handleLoadMoreCustomers = useCallback(() => {
        if (!customerLoading && customerPage < customerPagination.totalPages) {
            const nextPage = customerPage + 1;
            setCustomerPage(nextPage);
            loadCustomers(customerSearch, nextPage, true);
        }
    }, [customerLoading, customerPage, customerPagination.totalPages, customerSearch, loadCustomers]);

    useEffect(() => {
        filtersRef.current = filters;
    }, [filters]);

    useEffect(() => {
        if (tableRef.current) return;
        const tableZero = '#data-table-zero';
        if ($.fn.DataTable.isDataTable(tableZero)) $(tableZero).DataTable().destroy();

        const instance = initializeServerSideDataTable({
            tableSelector: tableZero,
            ajaxUrl: '/orders',
            ajaxMethod: 'GET',
            columns: getOrderColumns(),
            ajaxParams: () => {
                const f = filtersRef.current || {};
                const out = {};
                if (f.customerId) out.userId = f.customerId;
                if (f.status) out.status = f.status;
                if (f.dateFrom) out.dateFrom = f.dateFrom;
                if (f.dateTo) out.dateTo = f.dateTo;
                return out;
            },
            axiosInstance,
            dispatch,
            loadingActionType: ORDER_LOADING,
            searchParamName: 'search',
            pageLength: 10,
            lengthMenu: [[5, 10, 25, 50, -1], [5, 10, 25, 50, 'All']],
            order: [[0, 'desc']],
            dom: "<'row mb-3'<'col-sm-12 col-md-6'l><'col-sm-12 col-md-6 d-flex justify-content-end align-items-center'<'search-container'f>>>" +
                "<'row'<'col-sm-12'tr>>" +
                "<'row'<'col-sm-12 col-md-5'i><'col-sm-12 col-md-7'p>>",
            initCompleteCallback: function (settings, json, api) {
                $(tableZero + ' tbody').off('click', '.view-btn').on('click', '.view-btn', function () {
                    const rowData = api.row($(this).closest('tr')).data();
                    if (rowData) handleView(rowData);
                });
                $(tableZero + ' tbody').off('click', '.delete-btn').on('click', '.delete-btn', function () {
                    const id = $(this).data('id');
                    if (id) handleDelete(id);
                });
            }
        });
        tableRef.current = instance;

        return () => {
            if ($.fn.DataTable.isDataTable(tableZero)) {
                $(tableZero)
                    .off('click', '.view-btn')
                    .off('click', '.delete-btn');
                $(tableZero).DataTable().destroy();
            }
            tableRef.current = null;
        };
    }, []);

    return (
        <>
            {/* Filter – same pattern as Event listing (FilterComponent style) */}
            <Card className="mb-4 shadow-sm border-0" style={{ borderRadius: '8px' }}>
                <Card.Header
                    className="bg-light border-0"
                    style={{ padding: '16px 20px', borderRadius: '8px 8px 0 0' }}
                >
                    <div className="d-flex align-items-center justify-content-between">
                        <div className="d-flex align-items-center">
                            <i className="feather icon-filter mr-2" style={{ color: '#4680ff', fontSize: '18px' }}></i>
                            <h6 className="mb-0" style={{ fontWeight: '600', color: '#495057' }}>Filter Options</h6>
                        </div>
                        <div className="d-flex align-items-center gap-2">
                            {activeFiltersCount > 0 && (
                                <span className="badge badge-primary" style={{ backgroundColor: '#4680ff', fontSize: '11px', padding: '4px 8px' }}>
                                    {activeFiltersCount} Active
                                </span>
                            )}
                            <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={handleDeleteAll}
                                style={{ borderRadius: '6px', fontSize: '13px', fontWeight: '500' }}
                            >
                                <i className="feather icon-trash-2 mr-1"></i>Delete All Orders
                            </Button>
                        </div>
                    </div>
                </Card.Header>
                <Card.Body style={{ padding: '20px' }}>
                    <Row className="align-items-end">
                        <Col xl={2} lg={2} md={6} sm={12} >
                            <Form.Group className="mb-0">
                            <Form.Label style={{ fontSize: '14px', fontWeight: '600', color: '#495057' }}>
                                    <i className="feather icon-activity mr-1"></i>Customer
                                </Form.Label>
                                <SearchableDropdown
                                    // label="Customer"
                                    name="customerId"
                                    value={filters.customerId}
                                    onChange={(e) => setFilters((f) => ({ ...f, customerId: e.target.value || '' }))}
                                    options={customerOptions.map((c) => ({
                                        id: c.id,
                                        name: [c.firstName, c.lastName].filter(Boolean).join(' ').trim() + (c.email ? ` (${c.email})` : ''),
                                    }))}
                                    onLoadMore={handleLoadMoreCustomers}
                                    hasMore={customerPage < customerPagination.totalPages}
                                    loading={customerLoading}
                                    placeholder="All customers"
                                    displayKey="name"
                                    valueKey="id"
                                    searchPlaceholder="Search by name or email..."
                                    onOpen={handleCustomerOpen}
                                    onSearch={handleCustomerSearch}
                                />
                            </Form.Group>
                        </Col>
                        <Col xl={2} lg={2} md={6} sm={12} className="mb-3">
                            <Form.Group className="mb-0">
                                <Form.Label style={{ fontSize: '14px', fontWeight: '600', color: '#495057', marginBottom: '8px' }}>
                                    <i className="feather icon-activity mr-1"></i>Status
                                </Form.Label>
                                <Form.Select
                                    value={filters.status}
                                    onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
                                    style={{ borderRadius: '6px', border: '1px solid #ced4da', padding: '8px 12px', width: '100%' }}
                                >
                                    <option value="">All statuses</option>
                                    <option value="Pending">Pending</option>
                                    <option value="Completed">Completed</option>
                                    <option value="Cancelled">Cancelled</option>
                                    <option value="Failed">Failed</option>
                                    <option value="Processing">Processing</option>
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col xl={2} lg={2} md={6} sm={12} className="mb-3">
                            <Form.Group className="mb-0">
                                <Form.Label style={{ fontSize: '14px', fontWeight: '600', color: '#495057', marginBottom: '8px' }}>
                                    <i className="feather icon-calendar mr-1"></i>From Date
                                </Form.Label>
                                <Form.Control
                                    type="date"
                                    value={filters.dateFrom}
                                    onChange={(e) => setFilters((f) => ({ ...f, dateFrom: e.target.value }))}
                                    max={filters.dateTo || undefined}
                                    style={{ borderRadius: '6px', border: '1px solid #ced4da', padding: '8px 12px' }}
                                />
                            </Form.Group>
                        </Col>
                        <Col xl={2} lg={2} md={6} sm={12} className="mb-3">
                            <Form.Group className="mb-0">
                                <Form.Label style={{ fontSize: '14px', fontWeight: '600', color: '#495057', marginBottom: '8px' }}>
                                    <i className="feather icon-calendar mr-1"></i>To Date
                                </Form.Label>
                                <Form.Control
                                    type="date"
                                    value={filters.dateTo}
                                    onChange={(e) => setFilters((f) => ({ ...f, dateTo: e.target.value }))}
                                    min={filters.dateFrom || undefined}
                                    style={{ borderRadius: '6px', border: '1px solid #ced4da', padding: '8px 12px' }}
                                />
                            </Form.Group>
                        </Col>
                        {activeFiltersCount > 0 && (
                            <Col xl={2} lg={2} md={6} sm={12} className="mb-3">
                                <div className="d-flex align-items-end flex-wrap" style={{ gap: '8px' }}>
                                    <Button
                                        variant="primary"
                                        onClick={applyFilters}
                                        style={{ backgroundColor: '#4680ff', border: 'none', borderRadius: '6px', padding: '8px 14px', fontSize: '13px', fontWeight: '500', minWidth: '85px' }}
                                    >
                                        <i className="feather icon-search mr-1"></i>Apply
                                    </Button>
                                    <Button
                                        variant="outline-secondary"
                                        onClick={clearFilters}
                                        style={{ borderRadius: '6px', padding: '8px 14px', fontSize: '13px', fontWeight: '500', minWidth: '75px' }}
                                    >
                                        <i className="feather icon-x mr-1"></i>Clear
                                    </Button>
                                </div>
                            </Col>
                        )}
                    </Row>
                </Card.Body>
            </Card>

            <DeleteConfirmationModal show={showDeleteModal} onHide={handleClose} onConfirm={handleConfirmDelete} isLoading={isDeleting} />
            <DeleteConfirmationModal
                show={showDeleteAllModal}
                onHide={handleCloseDeleteAll}
                onConfirm={handleConfirmDeleteAll}
                isLoading={isDeletingAll}
                title="Delete All Orders?"
                message="Are you sure you want to delete all orders? Registrations will be unlinked. This cannot be undone."
            />
            <OrderStatusConfirmationModal
                show={showStatusModal}
                onHide={handleStatusModalClose}
                onConfirm={handleStatusConfirm}
                status={statusToUpdate?.status}
                orderData={orderToUpdate}
                isLoading={isUpdatingStatus}
            />

            {/* Table – same pattern as Event listing (event-list card + table) */}
            <Row>
                <Col sm={12} className="btn-page">
                    <Card className="event-list">
                        <Card.Body>
                            <Table striped hover responsive id="data-table-zero">
                                <thead>
                                    <tr>
                                        <th>Order No</th>
                                        <th>Customer</th>
                                        <th>Events</th>
                                        <th>Status</th>
                                        <th>Order Created Date</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                            </Table>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </>
    );
};

export default OrderView;
