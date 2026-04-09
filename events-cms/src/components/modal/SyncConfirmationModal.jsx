import React from 'react';
import { Modal, Button } from 'react-bootstrap';

const SyncConfirmationModal = ({ show, onHide, onConfirm, isLoading = false }) => {
    return (
        <Modal
            show={show}
            onHide={onHide}
            centered
            contentClassName="border-0 shadow-lg"
            style={{ borderRadius: '12px', overflow: 'hidden' }}
        >
            <Modal.Header
                className="border-0 py-3 px-4 d-flex align-items-center justify-content-between"
                style={{
                    background: 'linear-gradient(135deg, #0d6efd 0%, #0a58ca 100%)',
                    color: '#fff',
                }}
            >
                <Modal.Title className="mb-0" style={{ fontSize: '1.15rem', fontWeight: 600 }}>
                    Sync events from Salesforce
                </Modal.Title>
                <button
                    type="button"
                    onClick={onHide}
                    aria-label="Close"
                    className="btn btn-link p-0 m-0 ms-2"
                    style={{ color: '#fff', fontSize: '1.5rem', lineHeight: 1, textDecoration: 'none', opacity: 0.9 }}
                    disabled={isLoading}
                    onMouseOver={(e) => { e.currentTarget.style.opacity = '1'; }}
                    onMouseOut={(e) => { e.currentTarget.style.opacity = '0.9'; }}
                >
                    &times;
                </button>
            </Modal.Header>
            <Modal.Body className="px-4 py-4" style={{ backgroundColor: '#fafbfc' }}>
                <p className="mb-0 text-secondary">
                    Sync events from Salesforce? This will fetch and create or update events in the list.
                </p>
            </Modal.Body>
            <Modal.Footer className="border-top px-4 py-3" style={{ backgroundColor: '#fff' }}>
                <Button variant="outline-secondary" onClick={onHide} disabled={isLoading} style={{ borderRadius: '8px' }}>
                    Cancel
                </Button>
                <Button variant="primary" onClick={onConfirm} disabled={isLoading} style={{ borderRadius: '8px', minWidth: '90px' }}>
                    {isLoading ? (
                        <>
                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                            Syncing...
                        </>
                    ) : (
                        'Sync'
                    )}
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default SyncConfirmationModal;
