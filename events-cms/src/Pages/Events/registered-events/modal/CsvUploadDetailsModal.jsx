import React, { useState } from 'react';
import { Modal, Button, Row, Col, Alert } from 'react-bootstrap';

const CsvUploadDetailsModal = ({ show, onHide, csvUploadDetails }) => {
    const [modalView, setModalView] = useState('failed'); // 'summary', 'success', or 'failed' - default to failed

    const handleClose = () => {
        setModalView('failed'); // Reset to failed view when closing
        onHide();
    };

    return (
        <Modal
            show={show}
            onHide={handleClose}
            size="lg"
            centered
        >
            <Modal.Header>
                <Modal.Title>
                    <i className="feather icon-file-text mr-2 text-primary"></i>
                    Record Details
                </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {csvUploadDetails && (
                    <>
                        {/* Summary Cards - Always Visible */}
                        <div className="mb-4">
                            <Row>
                                <Col md={4}>
                                    <div className="text-center p-3 border rounded">
                                        <h5 className="mb-1 text-primary">{csvUploadDetails.total}</h5>
                                        <small className="text-muted">Total Processed</small>
                                    </div>
                                </Col>
                                <Col md={4}>
                                    <div 
                                        className={`text-center p-3 border rounded ${modalView === 'success' ? 'border-success border-3' : 'border-success'}`}
                                        style={{ 
                                            cursor: csvUploadDetails.successful > 0 ? 'pointer' : 'default', 
                                            opacity: csvUploadDetails.successful > 0 ? 1 : 0.6,
                                            backgroundColor: modalView === 'success' ? '#d4edda' : '#f8f9fa',
                                            color: modalView === 'success' ? '#155724' : '#6c757d',
                                            borderColor: modalView === 'success' ? '#28a745' : '#dee2e6',
                                            boxShadow: modalView === 'success' ? '0 0 0 0.2rem rgba(40, 167, 69, 0.25)' : 'none',
                                            transition: 'all 0.2s'
                                        }}
                                        onClick={() => csvUploadDetails.successful > 0 && setModalView('success')}
                                        onMouseEnter={(e) => {
                                            if (csvUploadDetails.successful > 0 && modalView !== 'success') {
                                                e.currentTarget.style.transform = 'scale(1.05)';
                                                e.currentTarget.style.backgroundColor = '#d4edda';
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            if (modalView !== 'success') {
                                                e.currentTarget.style.transform = 'scale(1)';
                                                e.currentTarget.style.backgroundColor = '#f8f9fa';
                                            }
                                        }}
                                    >
                                        <h5 className="mb-1" style={{ color: modalView === 'success' ? '#28a745' : '#6c757d' }}>
                                            {csvUploadDetails.successful}
                                        </h5>
                                        <small>
                                            Successful 
                                            {csvUploadDetails.successful > 0 && (
                                                modalView === 'success' ? (
                                                    <i className="feather icon-check ml-1"></i>
                                                ) : (
                                                    <i className="feather icon-arrow-right ml-1"></i>
                                                )
                                            )}
                                        </small>
                                    </div>
                                </Col>
                                <Col md={4}>
                                    <div 
                                        className={`text-center p-3 border rounded ${modalView === 'failed' ? 'border-danger border-3' : 'border-danger'}`}
                                        style={{ 
                                            cursor: csvUploadDetails.failed > 0 ? 'pointer' : 'default', 
                                            opacity: csvUploadDetails.failed > 0 ? 1 : 0.6,
                                            backgroundColor: modalView === 'failed' ? '#f8d7da' : '#f8f9fa',
                                            color: modalView === 'failed' ? '#721c24' : '#6c757d',
                                            borderColor: modalView === 'failed' ? '#dc3545' : '#dee2e6',
                                            boxShadow: modalView === 'failed' ? '0 0 0 0.2rem rgba(220, 53, 69, 0.25)' : 'none',
                                            transition: 'all 0.2s'
                                        }}
                                        onClick={() => csvUploadDetails.failed > 0 && setModalView('failed')}
                                        onMouseEnter={(e) => {
                                            if (csvUploadDetails.failed > 0 && modalView !== 'failed') {
                                                e.currentTarget.style.transform = 'scale(1.05)';
                                                e.currentTarget.style.backgroundColor = '#f8d7da';
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            if (modalView !== 'failed') {
                                                e.currentTarget.style.transform = 'scale(1)';
                                                e.currentTarget.style.backgroundColor = '#f8f9fa';
                                            }
                                        }}
                                    >
                                        <h5 className="mb-1" style={{ color: modalView === 'failed' ? '#dc3545' : '#6c757d' }}>
                                            {csvUploadDetails.failed}
                                        </h5>
                                        <small>
                                            Failed 
                                            {csvUploadDetails.failed > 0 && (
                                                modalView === 'failed' ? (
                                                    <i className="feather icon-check ml-1"></i>
                                                ) : (
                                                    <i className="feather icon-arrow-right ml-1"></i>
                                                )
                                            )}
                                        </small>
                                    </div>
                                </Col>
                            </Row>
                        </div>

                        {/* Content Below - Changes based on selection */}
                        {modalView === 'summary' && (
                            <div className="text-center text-muted">
                                <i className="feather icon-info mr-2"></i>
                                Click on Success or Failed card above to view details
                            </div>
                        )}

                        {modalView === 'success' && (
                            <div>
                                <h6 className="mb-3">
                                    <i className="feather icon-check-circle mr-2 text-success"></i>
                                    Successful Records ({csvUploadDetails.successful})
                                </h6>
                                <Alert variant="success">
                                    <i className="feather icon-check-circle mr-2"></i>
                                    <strong>Great!</strong> {csvUploadDetails.successful} record(s) were successfully uploaded and table numbers have been assigned.
                                </Alert>
                            </div>
                        )}

                        {modalView === 'failed' && csvUploadDetails.errors && csvUploadDetails.errors.length > 0 && (
                            <div>
                                <h6 className="mb-3">
                                    <i className="feather icon-alert-circle mr-2 text-danger"></i>
                                    Failed Records ({csvUploadDetails.failed})
                                </h6>
                                <div style={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid #dee2e6', borderRadius: '4px', padding: '15px' }}>
                                    <ul className="mb-0" style={{ paddingLeft: '20px' }}>
                                        {csvUploadDetails.errors.map((error, index) => (
                                            <li key={index} className="mb-2" style={{ fontSize: '14px' }}>
                                                <code style={{ 
                                                    color: '#dc3545', 
                                                    backgroundColor: '#f8f9fa', 
                                                    padding: '4px 8px', 
                                                    borderRadius: '4px',
                                                    display: 'inline-block',
                                                    width: '100%'
                                                }}>
                                                    {error}
                                                </code>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={handleClose}>
                    <i className="feather icon-x mr-1"></i>
                    Close
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default CsvUploadDetailsModal;

