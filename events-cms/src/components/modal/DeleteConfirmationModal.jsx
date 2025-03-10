import React from 'react';
import { Modal, Button } from 'react-bootstrap';

const DeleteConfirmationModal = ({ 
    show, 
    onHide, 
    onConfirm, 
    title = 'Confirm Delete', 
    isLoading = false 
}) => {
    if (!show) return null;

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
            <div onClick={e => e.stopPropagation()}>
                <Modal.Dialog>
                    <Modal.Header>
                        <Modal.Title>{title}</Modal.Title>
                        <button 
                            type="button" 
                            className="btn-close" 
                            onClick={onHide}
                            aria-label="Close"
                        />
                    </Modal.Header>
                    <Modal.Body>
                        Are you sure you want to delete?
                        <br />
                        <span className="text-danger">This action cannot be undone.</span>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button 
                            variant="secondary" 
                            onClick={onHide} 
                            disabled={isLoading}
                        >
                            Cancel
                        </Button>
                        <Button 
                            variant="danger" 
                            onClick={onConfirm} 
                            disabled={isLoading}
                        >
                            {isLoading ? 'Deleting...' : 'Delete'}
                        </Button>
                    </Modal.Footer>
                </Modal.Dialog>
            </div>
        </div>
    );
};

export default DeleteConfirmationModal;