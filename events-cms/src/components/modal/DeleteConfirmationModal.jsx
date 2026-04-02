import React from 'react';
import { Modal, Button } from 'react-bootstrap';

const DeleteConfirmationModal = ({ show, onHide, onConfirm, title = 'Confirm Delete', message, isLoading = false }) => {
    if (!show) return null;

    const defaultMessage = 'Are you sure you want to delete?';

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
                        <Modal.Title>{title}</Modal.Title>
                        <button type="button" onClick={onHide} className="close" aria-label="Close" disabled={isLoading}>
                            <span aria-hidden="true">&times;</span>
                        </button>
                    </Modal.Header>
                    <Modal.Body>
                        {message || defaultMessage}
                        {!message && (
                            <>
                                <br />
                                <span className="text-danger">This action cannot be undone.</span>
                            </>
                        )}
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={onHide} disabled={isLoading}>
                            Cancel
                        </Button>
                        <Button variant="danger" onClick={onConfirm} disabled={isLoading}>
                            {isLoading ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                    Deleting...
                                </>
                            ) : (
                                'Delete'
                            )}
                        </Button>
                    </Modal.Footer>
                </Modal.Dialog>
            </div>
        </div>
    );
};

export default DeleteConfirmationModal;
