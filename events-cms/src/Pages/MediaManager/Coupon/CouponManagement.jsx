import * as React from 'react';
import { useEffect, useState, useCallback, useRef } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Table from 'react-bootstrap/Table';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import * as $ from 'jquery';
import DeleteConfirmationModal from '../../../components/modal/DeleteConfirmationModal';
import useTableNavigation from '../../../hooks/useTableNavigation';
import { getCoupons, deleteCoupon } from '../../../store/actions/couponActions';
import { MEDIA_MANAGER_PATHS } from '../../../utils/constants';
import '../../../assets/css/event.css';

// @ts-ignore
$.DataTable = require('datatables.net-bs');

const CouponManagement = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const tableRef = useRef(null);
    const { coupons = [], loading } = useSelector((state) => state.coupon);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const { handleView, handleEdit, handleAdd } = useTableNavigation({
        tableRef,
        listPath: MEDIA_MANAGER_PATHS.COUPON_LIST,
        viewPath: MEDIA_MANAGER_PATHS.VIEW_COUPON,
        editPath: MEDIA_MANAGER_PATHS.EDIT_COUPON,
        addPath: MEDIA_MANAGER_PATHS.ADD_COUPON
    });

    useEffect(() => {
        dispatch(getCoupons());
    }, [dispatch]);

    const handleDelete = useCallback((id) => {
        setItemToDelete({ id });
        setShowDeleteModal(true);
    }, []);

    const handleConfirmDelete = useCallback(async () => {
        if (!itemToDelete) return;
        setIsDeleting(true);
        try {
            const result = await dispatch(deleteCoupon(itemToDelete.id));
            if (result === true) {
                setShowDeleteModal(false);
                setItemToDelete(null);
            }
        } catch (e) {
            // toast handled in action
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

    const formatDate = (d) => {
        if (!d) return 'N/A';
        return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const formatDiscount = (row) => {
        if (row.discountType === 'percentage') return `${Number(row.discountValue)}%`;
        return `$${Number(row.discountValue ?? 0).toFixed(2)}`;
    };

    const handlersRef = useRef({ handleView, handleEdit, handleAdd, handleDelete });
    useEffect(() => {
        handlersRef.current = { handleView, handleEdit, handleAdd, handleDelete };
    }, [handleView, handleEdit, handleAdd, handleDelete]);

    useEffect(() => {
        if (loading) return;

        const tableSelector = '#data-table-zero';
        const columns = [
            {
                data: 'name',
                title: 'Code',
                orderable: true,
                render: function (data, type, row) {
                    if (type === 'sort' || type === 'type') return row.name || '';
                    return `
                        <div class="d-inline-block align-middle">
                            <div class="d-inline-block">
                                <h6 class="m-b-0">${row.name || '—'}</h6>
                            </div>
                        </div>`;
                }
            },
            {
                data: 'discountValue',
                title: 'Discount',
                orderable: true,
                render: function (data, type, row) {
                    if (type === 'sort' || type === 'type') return row.discountValue ?? 0;
                    return `<div class="text-wrap">${formatDiscount(row)}</div>`;
                }
            },
            {
                data: 'actualValue',
                title: 'Min. order',
                orderable: true,
                render: function (data, type, row) {
                    const val = Number(row.actualValue ?? 0).toFixed(2);
                    return type === 'sort' || type === 'type' ? row.actualValue : `$${val}`;
                }
            },
            {
                data: 'usageLimit',
                title: 'Usage limit',
                orderable: true,
                render: function (data, type, row) {
                    return `<div class="text-wrap">${row.usageLimit ?? '—'}</div>`;
                }
            },
            {
                data: 'validFrom',
                title: 'Valid from',
                orderable: true,
                render: function (data, type, row) {
                    const d = formatDate(row.validFrom);
                    return `<span class="badge badge-light">${d}</span>`;
                }
            },
            {
                data: 'validTo',
                title: 'Valid to',
                orderable: true,
                render: function (data, type, row) {
                    const d = formatDate(row.validTo);
                    return `<span class="badge badge-light">${d}</span>`;
                }
            },
            {
                data: 'isActive',
                title: 'Status',
                orderable: true,
                render: function (data, type, row) {
                    const statusClass = row.isActive ? 'badge-light-success' : 'badge-light-secondary';
                    const statusText = row.isActive ? 'Active' : 'Inactive';
                    return `<span class="badge ${statusClass}">${statusText}</span>`;
                }
            },
            {
                data: null,
                title: 'Actions',
                orderable: false,
                render: function (data, type, row) {
                    const id = (row && row.id) ? row.id : '';
                    return `
                        <div class="btn-group" role="group" aria-label="Actions">
                            <button type="button" class="btn btn-icon btn-success view-btn" data-id="${id}" title="View" 
                                style="margin-right: 10px; width: 40px; height: 40px; border-radius: 50%; display: inline-flex; justify-content: center; align-items: center;">
                                <i class="feather icon-eye"></i>
                            </button>
                            <button type="button" class="btn btn-warning btn-circle btn-sm edit-btn" data-id="${id}" title="Edit" 
                                style="margin-right: 10px; width: 40px; height: 40px; border-radius: 50%; display: inline-flex; justify-content: center; align-items: center;">
                                <i class="feather icon-edit"></i>
                            </button>
                            <button type="button" class="btn btn-danger btn-circle btn-sm delete-btn" data-id="${id}" title="Delete" 
                                style="width: 40px; height: 40px; border-radius: 50%; display: inline-flex; justify-content: center; align-items: center;">
                                <i class="feather icon-trash-2"></i>
                            </button>
                        </div>
                    `;
                }
            }
        ];

        if (tableRef.current) {
            tableRef.current.clear();
            tableRef.current.rows.add(coupons);
            tableRef.current.draw();
            return;
        }

        if ($.fn.DataTable.isDataTable(tableSelector)) {
            $(tableSelector).DataTable().destroy();
        }

        const api = $(tableSelector).DataTable({
            data: coupons,
            columns,
            pageLength: 10,
            lengthMenu: [[5, 10, 25, 50, -1], [5, 10, 25, 50, 'All']],
            order: [[0, 'asc']],
            dom: "<'row mb-3'<'col-sm-12 col-md-6'l><'col-sm-12 col-md-6 d-flex justify-content-end align-items-center'<'search-container'f><'add-coupon-button ml-2'>>>" +
                "<'row'<'col-sm-12'tr>>" +
                "<'row'<'col-sm-12 col-md-5'i><'col-sm-12 col-md-7'p>>",
            initComplete: function (settings, json) {
                const api = $(tableSelector).DataTable();
                if (!$('#addCouponBtn').length) {
                    $('.add-coupon-button').html(`
                        <button class="btn btn-primary d-flex align-items-center ml-2" id="addCouponBtn">
                            <i class="feather icon-plus mr-1"></i>
                            Add
                        </button>
                    `);
                    $('#addCouponBtn').on('click', () => handlersRef.current.handleAdd());
                }
                $(settings.nTable).off('click', '.view-btn').on('click', '.view-btn', function () {
                    const rowData = api.row($(this).closest('tr')).data();
                    if (rowData && rowData.id) handlersRef.current.handleView(rowData);
                });
                $(settings.nTable).off('click', '.edit-btn').on('click', '.edit-btn', function () {
                    const rowData = api.row($(this).closest('tr')).data();
                    if (rowData && rowData.id) handlersRef.current.handleEdit(rowData);
                });
                $(settings.nTable).off('click', '.delete-btn').on('click', '.delete-btn', function () {
                    const id = $(this).data('id');
                    if (id) handlersRef.current.handleDelete(id);
                });
            }
        });

        tableRef.current = api;

        return () => {
            if (tableRef.current && $(tableSelector).length) {
                try {
                    $(tableSelector).off('click', '.view-btn').off('click', '.edit-btn').off('click', '.delete-btn');
                    if ($.fn.DataTable.isDataTable(tableSelector)) $(tableSelector).DataTable().destroy();
                } catch (e) {}
                tableRef.current = null;
            }
        };
    }, [loading, coupons]);

    return (
        <>
            <DeleteConfirmationModal
                show={showDeleteModal}
                onHide={handleClose}
                onConfirm={handleConfirmDelete}
                isLoading={isDeleting}
            />
            <Row>
                <Col sm={12} className="btn-page">
                    <Card className="event-list">
                        <Card.Body style={{ position: 'relative' }}>
                            {loading && coupons.length === 0 && (
                                <div className="text-center py-4">
                                    <p className="text-muted mb-0">Loading coupons...</p>
                                </div>
                            )}
                            <Table striped hover responsive id="data-table-zero" style={{ visibility: loading && coupons.length === 0 ? 'hidden' : 'visible' }}>
                                <thead>
                                    <tr>
                                        <th>Code</th>
                                        <th>Discount</th>
                                        <th>Min. order</th>
                                        <th>Usage limit</th>
                                        <th>Valid from</th>
                                        <th>Valid to</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody></tbody>
                            </Table>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </>
    );
};

export default CouponManagement;
