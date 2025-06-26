import React from 'react';
import { Modal, Button } from 'react-bootstrap';

const OrderStatusConfirmationModal = ({ 
    show, 
    onHide, 
    onConfirm, 
    status, 
    orderData, 
    isLoading = false 
}) => {
    if (!show) return null;

    const getStatusColor = (status) => {
        switch(status) {
            case 'Completed': return 'success';
            case 'Cancelled': return 'danger';
            case 'Pending': return 'warning';
            default: return 'secondary';
        }
    };

    const getStatusIcon = (status) => {
        switch(status) {
            case 'Completed': return '✓';
            case 'Cancelled': return '✗';
            case 'Pending': return '⏱';
            default: return '?';
        }
    };
//
    const getStatusDescription = (status) => {
        switch(status) {
            case 'Completed':
                return 'This will mark the order as completed. All events in this order will be marked as completed and invoice numbers will be generated.';
            case 'Cancelled':
                return 'This will cancel the order. All events in this order will be marked as cancelled and user registrations will be removed.';
            case 'Pending':
                return 'This will mark the order as pending. The order will be in a waiting state.';
            default:
                return '';
        }
    };

    return (
        <div
            className="modal-backdrop"
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1050
            }}
            onClick={onHide}
        >
            <div onClick={(e) => e.stopPropagation()}>
                <Modal.Dialog>
                    <Modal.Header>
                        <Modal.Title>
                            <span style={{ color: getStatusColor(status) === 'success' ? '#28a745' : getStatusColor(status) === 'danger' ? '#dc3545' : '#ffc107' }}>
                                {getStatusIcon(status)} Confirm {status}
                            </span>
                        </Modal.Title>
                        <button type="button" onClick={onHide} className="close" aria-label="Close">
                            <span aria-hidden="true">&times;</span>
                        </button>
                    </Modal.Header>
                    <Modal.Body>
                        <div className="mb-3">
                            <strong>Are you sure you want to change this order status to {status}?</strong>
                        </div>
                        
                        {orderData && (
                            <div className="alert alert-info">
                                <strong>Order Details:</strong>
                                <br />
                                <strong>Order No:</strong> {orderData.orderNo}
                                <br />
                                <strong>Customer:</strong> {orderData.user?.firstName} {orderData.user?.lastName}
                                <br />
                                <strong>Email:</strong> {orderData.user?.email}
                                <br />
                                <strong>Amount:</strong> ${parseFloat(orderData.price).toFixed(2)}
                                <br />
                                <strong>Events:</strong> {orderData.orderItems?.length || 0} event(s)
                                <br />
                                <strong>Current Status:</strong> {orderData.status}
                            </div>
                        )}

                        <div className="alert alert-warning">
                            <strong>⚠️ Important:</strong>
                            <p className="mb-2">{getStatusDescription(status)}</p>
                            <ul className="mb-0">
                                <li>This action will update all events in this order</li>
                                <li>This action cannot be easily undone</li>
                                <li>User will be notified of the status change</li>
                            </ul>
                        </div>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={onHide} disabled={isLoading}>
                            Cancel
                        </Button>
                        <Button 
                            variant={getStatusColor(status)} 
                            onClick={onConfirm} 
                            disabled={isLoading}
                        >
                            {isLoading ? `Updating...` : `Confirm ${status}`}
                        </Button>
                    </Modal.Footer>
                </Modal.Dialog>
            </div>
        </div>
    );
};

export default OrderStatusConfirmationModal;