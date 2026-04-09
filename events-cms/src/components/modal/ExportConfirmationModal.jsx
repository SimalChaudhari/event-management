import React from 'react';
import { Modal, Button } from 'react-bootstrap';

const ExportConfirmationModal = ({ show, onHide, onConfirm, isLoading = false, exportType = 'users', eventName = '' }) => {
    if (!show) return null;

    const isRegistrations = exportType === 'registrations';
    const exportTitle = isRegistrations ? 'Export Event Registrations to CSV' : 'Export Users to CSV';
    const exportMessage = isRegistrations 
        ? `Are you sure you want to export all registered users for "${eventName || 'the selected event'}" to CSV?`
        : 'Are you sure you want to export all users to CSV?';
    
    const exportFields = isRegistrations 
        ? [
            <li key="name">User Name (First Name + Last Name)</li>,
            <li key="company">Company</li>,
            <li key="designation">Designation</li>,
            <li key="email">Email Address</li>,
            <li key="uid">Unique ID (UID)</li>
          ]
        : [
            <li key="name">User Name (First Name + Last Name)</li>,
            <li key="email">Email Address</li>,
            <li key="uid">Unique ID</li>
          ];

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
                            <i className="feather icon-download mr-2"></i>
                            {exportTitle}
                        </Modal.Title>
                        <button type="button" onClick={onHide} className="close" aria-label="Close">
                            <span aria-hidden="true">&times;</span>
                        </button>
                    </Modal.Header>
                    <Modal.Body>
                        <div>
                            <p>{exportMessage}</p>
                            <div className="alert alert-info" style={{ marginBottom: 0 }}>
                                <i className="feather icon-info mr-2"></i>
                                <strong>Note:</strong> This will download a CSV file containing:
                                <ul style={{ marginTop: '8px', marginBottom: 0, paddingLeft: '20px' }}>
                                    {exportFields}
                                </ul>
                            </div>
                        </div>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={onHide} disabled={isLoading}>
                            <i className="feather icon-x mr-1"></i>
                            Cancel
                        </Button>
                        <Button variant="info" onClick={onConfirm} disabled={isLoading}>
                            {isLoading ? (
                                <>
                                    <span className="spinner-border spinner-border-sm mr-2" role="status" aria-hidden="true"></span>
                                    Exporting...
                                </>
                            ) : (
                                <>
                                    <i className="feather icon-download mr-1"></i>
                                    Export
                                </>
                            )}
                        </Button>
                    </Modal.Footer>
                </Modal.Dialog>
            </div>
        </div>
    );
};

export default ExportConfirmationModal;

