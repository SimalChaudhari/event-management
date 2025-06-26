import * as React from 'react';
import { useEffect, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Table from 'react-bootstrap/Table';
import { useSelector, useDispatch } from 'react-redux';
import * as $ from 'jquery';
import { useLocation } from 'react-router-dom';
import '../../assets/css/event.css';
import DeleteConfirmationModal from '../../components/modal/DeleteConfirmationModal';
import { orderList, orderDelete, updateOrderStatus } from '../../store/actions/orderActions';
import ViewOrderModal from './modal/ViewOrderModal';
import OrderStatusConfirmationModal from './modal/OrderStatusConfirmationModal';

// @ts-ignore
$.DataTable = require('datatables.net-bs');
// This function will need to be replaced with actual order actions when created

function atable(data, handleDelete, handleView, handleStatusClick) {
    let tableZero = '#data-table-zero';
    $.fn.dataTable.ext.errMode = 'throw';

    // Preserve the current page
    let currentPage = 0;
    if ($.fn.DataTable.isDataTable(tableZero)) {
        currentPage = $(tableZero).DataTable().page();
        $(tableZero).DataTable().clear().destroy();
    }

    $(tableZero).DataTable({
        data: data || [],
        order: [[0, 'desc']],
        searching: true,
        searchDelay: 500,
        pageLength: 5,
        lengthMenu: [
            [5, 10, 25, 50, -1],
            [5, 10, 25, 50, 'All']
        ],
        pagingType: 'full_numbers',
        dom:
            "<'row mb-3'<'col-sm-12 col-md-6'l><'col-sm-12 col-md-6 d-flex justify-content-end align-items-center'<'search-container'f>>>" +
            "<'row'<'col-sm-12'tr>>" +
            "<'row'<'col-sm-12 col-md-5'i><'col-sm-12 col-md-7'p>>",
        columns: [
            {
                data: 'orderNo',
                title: 'Order No',
                render: function (data, type, row) {
                    const status = row?.status || 'N/A';
                    let statusColor = '#6c757d'; // default: gray
            
                    if (status.toLowerCase() === 'completed') {
                        statusColor = '#28a745'; // green
                    } else if (status.toLowerCase() === 'cancelled') {
                        statusColor = '#dc3545'; // red
                    } else if (status.toLowerCase() === 'pending') {
                        statusColor = '#ffc107'; // yellow
                    } else if (status.toLowerCase() === 'failed') {
                        statusColor = '#fd7e14'; // orange
                    }
                    return `
                      <div class="d-inline-block align-middle">
                            <div class="d-inline-block">
                                <h6 class="mb-1" style="font-weight: bold;">${row?.orderNo}</h6>
                                <p class="mb-1" style="font-weight: 500;">
                                    <strong>Payment Method:</strong> ${row?.paymentMethod}
                                </p>

                                 <p class="mb-1" style="font-weight: 600;">
                                    <strong>Price:</strong> ${row?.price}
                                </p>
                              
                                <p class="mb-0">
                                    <strong>Status:</strong>
                                    <span style="background-color: ${statusColor}; color: #fff; padding: 3px 7px; border-radius: 4px; margin-left: 4px;">
                                        ${status}
                                    </span>
                                </p>
                            </div>
                        </div> 
                    `;
                }
            },
            {
                data: 'user',
                title: 'Customer',
                render: function (data, type, row) {
                    return `
                        <div class="d-inline-block align-middle">
                            <div class="d-inline-block">
                                <h6 class="mb-1">${row.user.firstName} ${row.user.lastName}</h6>
                                <p class="m-0">${row.user.email}</p>
                                <small>${row.user.mobile || 'N/A'}</small>
                            </div>
                        </div>
                    `;
                }
            },

            {
                data: 'orderItems',
                title: 'Events',
                render: function (data, type, row) {
                    const eventCount = row.orderItems.length;
                    const eventNames = row.orderItems.map((item) => item.event.name).join(', ');

                    return `
                        <div>
                            <span class="badge badge-light-info">${eventCount} event${eventCount > 1 ? 's' : ''}</span>
                            <div class="mt-1 text-truncate" style="max-width: 200px;" title="${eventNames}">
                                ${eventNames}
                            </div>
                        </div>
                    `;
                }
            },
        
            {
                data: 'status',
                title: 'Status',
                render: function (data, type, row) {
                    const orderItem = row.orderItems[0]; // Get the first order item
                    const eventStatus = orderItem?.status || 'Unknown';
                    
                    let statusClass = 'badge-light-warning';
                
                    if (eventStatus === 'Completed') {
                        statusClass = 'badge-light-success';
                    } else if (eventStatus === 'Cancelled') {
                        statusClass = 'badge-light-danger';
                    } else if (eventStatus === 'Pending') {
                        statusClass = 'badge-light-warning';
                    }

                    // Show status buttons for pending orders
                    if (eventStatus === 'Pending') {
                        return `
                            <div style="display: flex; gap: 5px; flex-wrap: wrap;">
                                <button class="btn btn-success btn-sm complete-btn" 
                                        data-id="${orderItem.id}" 
                                        style="font-size: 11px; padding: 2px 6px;">
                                    <i class="feather icon-check"></i> Complete
                                </button>
                                <button class="btn btn-danger btn-sm cancel-btn" 
                                        data-id="${orderItem.id}" 
                                        style="font-size: 11px; padding: 2px 6px;">
                                    <i class="feather icon-x"></i> Cancel
                                </button>
                            </div>
                        `;
                    } else {
                        return `<span class="badge ${statusClass}">${eventStatus}</span>`;
                    }
                }
            },

         
            {
                data: null,
                title: 'Actions',
                orderable: false,
                render: function (data, type, row) {
                    return `
                        <div class="btn-group" role="group" aria-label="Actions">
                            <button type="button" class="btn btn-success btn-circle btn-sm view-btn mr-2" data-id="${row.id}" title="View" 
                                style="width: 40px; height: 40px; border-radius: 50%; display: inline-flex; justify-content: center; align-items: center; margin-right: 8px;">
                                <i class="feather icon-eye"></i>
                            </button>
                            
                        </div>
                    `;
                }
            }
        ]
    });

    // Restore the page
    $(tableZero).DataTable().page(currentPage).draw(false);

    // Attach event listeners for actions
    $(document).on('click', '.delete-btn', function () {
        const orderId = $(this).data('id');
        handleDelete(orderId);
    });

    $(document).on('click', '.view-btn', function () {
        const orderId = $(this).data('id');
        const dataOrder = data.find((user) => user.id === orderId);
        if (dataOrder) {
            handleView(dataOrder);
        }
     
    });

    // Complete button click
    $(document).on('click', '.complete-btn', function (e) {
        e.preventDefault();
        e.stopPropagation();
        const orderItemId = $(this).data('id');
        const orderData = data.find((item) => item.orderItems.some(orderItem => orderItem.id === orderItemId));
        console.log('Complete clicked for OrderItem ID:', orderItemId);
        handleStatusClick(orderItemId, 'Completed', orderData);
    });

    // Cancel button click
    $(document).on('click', '.cancel-btn', function (e) {
        e.preventDefault();
        e.stopPropagation();
        const orderItemId = $(this).data('id');
        const orderData = data.find((item) => item.orderItems.some(orderItem => orderItem.id === orderItemId));
        console.log('Cancel clicked for OrderItem ID:', orderItemId);
        handleStatusClick(orderItemId, 'Cancelled', orderData);
    });
}

const OrderView = () => {
    const dispatch = useDispatch();
    const orders = useSelector((state) => state.orders?.order?.data || []);
    const [currentTable, setCurrentTable] = useState(null);
    const location = useLocation();
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false); // State for view modal
    const [viewData, setViewData] = useState(null); // State for user data to view
    
    // New states for status confirmation
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [statusToUpdate, setStatusToUpdate] = useState(null);
    const [orderToUpdate, setOrderToUpdate] = useState(null);
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

    const destroyTable = () => {
        if ($.fn.DataTable.isDataTable('#data-table-zero')) {
            $('#data-table-zero').off('click', '.delete-btn');
            $('#data-table-zero').DataTable().destroy();
            setCurrentTable(null);
        }
    };

    const initializeTable = () => {
        destroyTable();
        if (Array.isArray(orders) && orders.length >= 0) {
            const table = atable(orders, handleDelete, handleView, handleStatusClick);
            setCurrentTable(table);
        }
    };

    useEffect(() => {
        dispatch(orderList());
        return () => destroyTable();
    }, [dispatch]);

    useEffect(() => {
        initializeTable();
        return () => destroyTable();
    }, [orders]);

    const handleDelete = (orderId) => {
        setItemToDelete({ id: orderId });
        setShowDeleteModal(true);
    };

    const handleConfirmDelete = async () => {
        if (!itemToDelete) return;

        setIsDeleting(true);
        try {
            await dispatch(orderDelete(itemToDelete.id));
            setShowDeleteModal(false);
            setItemToDelete(null);
            destroyTable();
            await dispatch(orderList());
        } catch (error) {
            console.error('Delete failed:', error);
        } finally {
            setIsDeleting(false);
        }
    };

    const handleClose = () => {
        if (!isDeleting) {
            setShowDeleteModal(false);
            setItemToDelete(null);
        }
    };

    const handleView = (data) => {
        setViewData(data);
        setShowViewModal(true);
    };

    const handleStatusClick = (orderItemId, status, orderData) => {
        setStatusToUpdate({ id: orderItemId, status });
        setOrderToUpdate(orderData);
        setShowStatusModal(true);
    };

    const handleStatusConfirm = async () => {
        if (!statusToUpdate) return;
        
        setIsUpdatingStatus(true);
        try {
            console.log(`Updating order item ${statusToUpdate.id} to status: ${statusToUpdate.status}`);
            
            // Use the actual API call
            await dispatch(updateOrderStatus(statusToUpdate.id, statusToUpdate.status));
            
            // Refresh the order list
            await dispatch(orderList());
            
            setShowStatusModal(false);
            setStatusToUpdate(null);
            setOrderToUpdate(null);
            
            console.log('Order status updated successfully');
        } catch (error) {
            console.error('Error updating order status:', error);
        } finally {
            setIsUpdatingStatus(false);
        }
    };

    const handleStatusModalClose = () => {
        if (!isUpdatingStatus) {
            setShowStatusModal(false);
            setStatusToUpdate(null);
            setOrderToUpdate(null);
        }
    };

    return (
        <>
            <DeleteConfirmationModal show={showDeleteModal} onHide={handleClose} onConfirm={handleConfirmDelete} isLoading={isDeleting} />
            <ViewOrderModal  show={showViewModal} handleClose={() => setShowViewModal(false)} orderData={viewData}/>
            <OrderStatusConfirmationModal 
                show={showStatusModal} 
                onHide={handleStatusModalClose} 
                onConfirm={handleStatusConfirm}
                status={statusToUpdate?.status}
                orderData={orderToUpdate}
                isLoading={isUpdatingStatus}
            />

            <Row>
                <Col sm={12} className="btn-page">
                    <Card className="order-list">
                        <Card.Body>
                            <Table striped hover responsive id="data-table-zero">
                                <thead>
                                    <tr>
                                        <th>Order No</th>
                                        <th>Customer</th>
                                        <th>Events</th>
                                        <th>Status</th>
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
