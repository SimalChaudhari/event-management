import React from 'react';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';

const DeleteConfirmationModal = ({ 
    show, 
    onHide, 
    onConfirm, 
    title = "Confirm Delete",
    itemName,
    itemType = "event",
    isLoading = false 
}) => {
    return (
        <Modal show={show} onHide={onHide} centered>
            <Modal.Header closeButton>
                <Modal.Title>{title}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                Are you sure you want to delete the {itemType} "{itemName}"? 
                <br />
                <span className="text-danger">This action cannot be undone.</span>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onHide} disabled={isLoading}>
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
        </Modal>
    );
};

export default DeleteConfirmationModal;