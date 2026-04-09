// src/components/common/ConfirmationModal.jsx
import React from 'react';
import { Modal, Button } from 'react-bootstrap';

const ConfirmationModal = ({
    show,
    onHide,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    variant = 'danger',
    onConfirm,
    loading = false,
    loadingText = 'Processing...',
    icon = 'fas fa-exclamation-triangle',
    iconColor = 'text-warning'
}) => {
    return (
        <Modal show={show} onHide={onHide} centered>
            <Modal.Header>
                <Modal.Title>
                    <i className={`${icon} ${iconColor} me-2`}></i>
                    {title}
                </Modal.Title>
                <button
                    type="button"
                    className="custom-close-btn"
                    aria-label="Close"
                    onClick={onHide}
                    style={{
                        background: 'none',
                        border: 'none',
                        fontSize: '1.8rem',
                        fontWeight: 'bold',
                        color: '#333',
                        position: 'absolute',
                        top: '10px',
                        right: '24px',
                        cursor: 'pointer',
                        zIndex: 10
                    }}
                >
                    &times;
                </button>
            </Modal.Header>
            <Modal.Body className="py-3 px-4">
                <p className="mb-1">{message}</p>
                <p className="text-muted small mb-0">This action cannot be undone.</p>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onHide}>
                    {cancelText}
                </Button>
                <Button variant={variant} onClick={onConfirm} disabled={loading}>
                    {loading ? (
                        <>
                            <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                            {loadingText}
                        </>
                    ) : (
                        confirmText
                    )}
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default ConfirmationModal;