import React from 'react';
import { Modal, Button } from 'react-bootstrap';

const StatusConfirmationModal = ({ 
    show, 
    onHide, 
    onConfirm, 
    status, 
    withdrawalData, 
    isLoading = false 
}) => {
    if (!show) return null;

    const getStatusColor = (status) => {
        return status === 'approved' ? 'success' : 'danger';
    };

    const getStatusIcon = (status) => {
        return status === 'approved' ? '✓' : '✗';
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
                            <span style={{ color: getStatusColor(status) === 'success' ? '#28a745' : '#dc3545' }}>
                                {getStatusIcon(status)} Confirm {status.charAt(0).toUpperCase() + status.slice(1)}
                            </span>
                        </Modal.Title>
                        <button type="button" onClick={onHide} className="close" aria-label="Close">
                            <span aria-hidden="true">&times;</span>
                        </button>
                    </Modal.Header>
                    <Modal.Body>
                        <div className="mb-3">
                            <strong>Are you sure you want to {status} this withdrawal request?</strong>
                        </div>
                        
                        {withdrawalData && (
                            <div className="alert alert-info">
                                <strong>Withdrawal Details:</strong>
                                <br />
                                <strong>User:</strong> {withdrawalData.order?.user?.firstName} {withdrawalData.order?.user?.lastName}
                                <br />
                                <strong>Order:</strong> {withdrawalData.order?.orderNo}
                                <br />
                                <strong>Reason:</strong> {withdrawalData.reason}
                                <br />
                                <strong>Amount:</strong> ${withdrawalData.order?.price}
                            </div>
                        )}

                        <div className="alert alert-warning">
                            <strong>⚠️ Important:</strong>
                            <ul className="mb-0 mt-2">
                                <li>This action will permanently change the withdrawal status</li>
                                <li>If approved, the order will be cancelled and refund processed</li>
                                <li>If rejected, the withdrawal request will be closed</li>
                                <li>This action cannot be easily undone</li>
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
                            {isLoading ? `${status.charAt(0).toUpperCase() + status.slice(1)}ing...` : `Confirm ${status.charAt(0).toUpperCase() + status.slice(1)}`}
                        </Button>
                    </Modal.Footer>
                </Modal.Dialog>
            </div>
        </div>
    );
};

export default StatusConfirmationModal;