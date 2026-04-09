import React from 'react';
import { Modal, Button } from 'react-bootstrap';

const SendConfirmationModal = ({
    show,
    onHide,
    onConfirm,
    isLoading = false,
    title = 'Send Notification',
    description = 'Do you want to send this notification right now?',
    confirmLabel = 'Send Now'
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
            <div onClick={(e) => e.stopPropagation()}>
                <Modal.Dialog>
                    <Modal.Header>
                        <Modal.Title>{title}</Modal.Title>
                        <button type="button" onClick={onHide} className="close" aria-label="Close">
                            <span aria-hidden="true">&times;</span>
                        </button>
                    </Modal.Header>
                    <Modal.Body>
                        {description}
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={onHide} disabled={isLoading}>
                            Cancel
                        </Button>
                        <Button variant="primary" onClick={onConfirm} disabled={isLoading}>
                            {isLoading ? 'Sending…' : confirmLabel}
                        </Button>
                    </Modal.Footer>
                </Modal.Dialog>
            </div>
        </div>
    );
};

export default SendConfirmationModal;


