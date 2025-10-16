import React from 'react';
import { Modal, Button } from 'react-bootstrap';

const RemoveProfilePictureModal = ({ show, onHide, onConfirm, isLoading = false }) => {
    return (
        <Modal 
            show={show} 
            onHide={onHide}
            centered
        >
            <Modal.Header>
                <Modal.Title>
                    <i className="fas fa-exclamation-triangle text-warning me-2" style={{ marginRight: '8px' }}></i>
                    Remove Profile Picture
                </Modal.Title>
                <button
                    type="button"
                    className="close"
                    aria-label="Close"
                    onClick={onHide}
                    disabled={isLoading}
                >
                    <span aria-hidden="true">&times;</span>
                </button>
            </Modal.Header>
            <Modal.Body className="py-3 px-4">
                <p className="mb-1">Are you sure you want to remove your profile picture?</p>
                <p className="text-muted small mb-0">This action cannot be undone.</p>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onHide} disabled={isLoading}>
                    Cancel
                </Button>
                <Button variant="danger" onClick={onConfirm} disabled={isLoading}>
                    {isLoading ? (
                        <>
                            <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                            Removing...
                        </>
                    ) : (
                        'Remove'
                    )}
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default RemoveProfilePictureModal;

