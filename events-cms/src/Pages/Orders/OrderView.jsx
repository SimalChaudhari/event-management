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
import { orderList, orderDelete } from '../../store/actions/orderActions';
import ViewOrderModal from './modal/ViewOrderModal';

// @ts-ignore
$.DataTable = require('datatables.net-bs');
// This function will need to be replaced with actual order actions when created

function atable(data, handleDelete, handleView) {
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
                    let statusClass = 'badge-light-warning';

                    if (row.status === 'Completed') {
                        statusClass = 'badge-light-success';
                    } else if (row.status === 'Cancelled') {
                        statusClass = 'badge-light-danger';
                    } else if (row.status === 'Pending') {
                        statusClass = 'badge-light-warning';
                    }

                    return `
                        <div class="d-inline-block align-middle">
                            <div class="d-inline-block">
                                <h6 class="mb-1">${row.orderNo}</h6>
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
                data: 'price',
                title: 'Total',
                render: function (data, type, row) {
                    return `$${parseFloat(data).toFixed(2)}`;
                }
            },
            {
                data: 'paymentMethod',
                title: 'Payment Method'
            },

            {
                data: 'status',
                title: 'Status',
                render: function (data, type, row) {
                    let statusClass = 'badge-light-warning';

                    if (data === 'Completed') {
                        statusClass = 'badge-light-success';
                    } else if (data === 'Cancelled') {
                        statusClass = 'badge-light-danger';
                    } else if (data === 'Pending') {
                        statusClass = 'badge-light-warning';
                    }

                    return `<span class="badge ${statusClass}">${data}</span>`;
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
            const table = atable(orders, handleDelete, handleView);
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


 


    return (
        <>
            <DeleteConfirmationModal show={showDeleteModal} onHide={handleClose} onConfirm={handleConfirmDelete} isLoading={isDeleting} />
            <ViewOrderModal  show={showViewModal} handleClose={() => setShowViewModal(false)} orderData={viewData}/>

            <Row>
                <Col sm={12} className="btn-page">
                    <Card className="order-list">
                        <Card.Body>
                            <Table striped hover responsive id="data-table-zero">
                                <thead>
                                    <tr>
                                        <th>Order No</th>
                                        <th>Customer</th>
                                        <th>Total</th>
                                        <th>Payment Method</th>
                                        <th>Status</th>
                                        <th>Events</th>
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
