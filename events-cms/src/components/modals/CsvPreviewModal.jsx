import React, { useState, useRef, useEffect } from 'react';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import { Alert, Table, Badge } from 'react-bootstrap';
import { uploadCsvUsers } from '../../store/actions/userActions';
import { useDispatch } from 'react-redux';

const CsvPreviewModal = ({ show, onHide, csvData, onUploadSuccess }) => {
    const dispatch = useDispatch();
    const [isUploading, setIsUploading] = useState(false);
    const [uploadResult, setUploadResult] = useState(null);
    const [errorMessage, setErrorMessage] = useState('');
    const [previewData, setPreviewData] = useState([]);
    const [totalRows, setTotalRows] = useState(0);
    const [validRows, setValidRows] = useState(0);
    const [invalidRows, setInvalidRows] = useState(0);

    useEffect(() => {
        if (csvData && Array.isArray(csvData)) {
            setPreviewData(csvData.slice(0, 5)); // Show first 5 rows for preview
            setTotalRows(csvData.length);
            
            // Validate rows
//  with valid data
            const validCount = csvData.filter(row => 
                row.firstName && 
                row.lastName && 
                row.email && 
                row.mobile &&
                row.email.includes('@') && 
                row.mobile.length >= 10
            ).length;
            
            setValidRows(validCount);
            setInvalidRows(csvData.length - validCount);
        }
    }, [csvData]);

    const handleUpload = async () => {
        if (!csvData || csvData.length === 0) {
            setErrorMessage('No data to upload');
            return;
        }

        setIsUploading(true);
        setErrorMessage('');
        setUploadResult(null);

        try {
            const result = await dispatch(uploadCsvUsers(csvData));
            setUploadResult(result);

            if (result.success) {
                setTimeout(() => {
                    onUploadSuccess && onUploadSuccess();
                    onHide();
                }, 2000);
            }
        } catch (error) {
            setErrorMessage(error.message || 'Upload failed');
        } finally {
            setIsUploading(false);
        }
    };

    const handleClose = () => {
        setUploadResult(null);
        setErrorMessage('');
        onHide();
    };

    const getValidationStatus = (row) => {
        const errors = [];
        
        if (!row.firstName || row.firstName.trim() === '') {
            errors.push('Missing first name');
        }
        if (!row.lastName || row.lastName.trim() === '') {
            errors.push('Missing last name');
        }
        if (!row.email || row.email.trim() === '') {
            errors.push('Missing email');
        } else if (!row.email.includes('@')) {
            errors.push('Invalid email format');
        }
        if (!row.mobile || row.mobile.trim() === '') {
            errors.push('Missing mobile');
        } else if (row.mobile.length < 10) {
            errors.push('Invalid mobile (too short)');
        }

        return errors.length === 0 ? 'valid' : errors.join(', ');
    };

    return (
        <Modal 
            show={show} 
            onHide={handleClose} 
            size="xl" 
            centered
            className="csv-preview-modal"
        >
            <Modal.Header>
                <Modal.Title className="d-flex align-items-center">
                    <i className="feather icon-eye mr-2"></i>
                    CSV Preview & Upload
                </Modal.Title>
            </Modal.Header>
            
            <Modal.Body>
                <div className="mb-4">
                    <h6 className="mb-3">
                        <i className="feather icon-bar-chart-2 mr-1"></i>
                        Upload Summary
                    </h6>
                    <div className="row">
                        <div className="col-md-3">
                            <div className="card bg-light text-center p-3">
                                <h5 className="mb-1">{totalRows}</h5>
                                <small className="text-muted">Total Rows</small>
                            </div>
                        </div>
                        <div className="col-md-3">
                            <div className="card bg-success text-white text-center p-3">
                                <h5 className="mb-1">{validRows}</h5>
                                <small>Valid Rows</small>
                            </div>
                        </div>
                        <div className="col-md-3">
                            <div className="card bg-danger text-white text-center p-3">
                                <h5 className="mb-1">{invalidRows}</h5>
                                <small>Invalid Rows</small>
                            </div>
                        </div>
                        <div className="col-md-3">
                            <div className="card bg-info text-white text-center p-3">
                                <h5 className="mb-1">
                                    {totalRows > 0 ? Math.round((validRows / totalRows) * 100) : 0}%
                                </h5>
                                <small>Success Rate</small>
                            </div>
                        </div>
                    </div>
                </div>

                {errorMessage && (
                    <Alert variant="danger" className="mb-3">
                        <i className="feather icon-alert-triangle mr-1"></i>
                        {errorMessage}
                    </Alert>
                )}

                {uploadResult && (
                    <Alert variant={uploadResult.success ? "success" : "warning"} className="mb-3">
                        <h6>{uploadResult.success ? "Upload Successful!" : "Upload Completed with Issues"}</h6>
                        {uploadResult.data && (
                            <div className="mt-2">
                                <div className="row text-sm">
                                    <div className="col-6">
                                        <strong>Total Processed:</strong> {uploadResult.data.totalProcessed}
                                    </div>
                                    <div className="col-6">
                                        <strong>New Users Created:</strong> {uploadResult.data.newUsersCreated}
                                    </div>
                                </div>
                                <div className="row text-sm mt-1">
                                    <div className="col-6">
                                        <strong>Existing Users Skipped:</strong> {uploadResult.data.existingUsersSkipped}
                                    </div>
                                    <div className="col-6">
                                        <strong>Passwords Generated:</strong> {uploadResult.data.passwordsGenerated}
                                    </div>
                                </div>
                                <div className="row text-sm mt-1">
                                    <div className="col-6">
                                        <strong>Emails Sent:</strong> {uploadResult.data.emailsSent}
                                    </div>
                                    <div className="col-6">
                                        <strong>Emails Failed:</strong> {uploadResult.data.emailsFailed}
                                    </div>
                                </div>
                            </div>
                        )}
                    </Alert>
                )}

                <div className="preview-section">
                    <h6 className="mb-3">
                        <i className="feather icon-table mr-1"></i>
                        Data Preview (First 5 rows)
                    </h6>
                    <Table responsive striped bordered hover>
                        <thead className="bg-light">
                            <tr>
                                <th>#</th>
                                <th>First Name</th>
                                <th>Last Name</th>
                                <th>Email</th>
                                <th>Mobile</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {previewData.map((row, index) => {
                                const validationStatus = getValidationStatus(row);
                                return (
                                    <tr key={index}>
                                        <td>{index + 1}</td>
                                        <td>{row.firstName || <span className="text-muted">N/A</span>}</td>
                                        <td>{row.lastName || <span className="text-muted">N/A</span>}</td>
                                        <td>{row.email || <span className="text-muted">N/A</span>}</td>
                                        <td>{row.mobile || <span className="text-muted">N/A</span>}</td>
                                        <td>
                                            {validationStatus === 'valid' ? (
                                                <Badge className="badge-success">Valid</Badge>
                                            ) : (
                                                <Badge className="badge-danger" title={validationStatus}>
                                                    Invalid
                                                </Badge>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </Table>

                    {totalRows > 5 && (
                        <div className="mt-2 text-center">
                            <small className="text-muted">
                                Showing first 5 rows of {totalRows} total rows
                            </small>
                        </div>
                    )}
                </div>

                {invalidRows > 0 && (
                    <Alert variant="warning" className="mt-3">
                        <i className="feather icon-alert-circle mr-1"></i>
                        <strong>Warning:</strong> {invalidRows} rows contain validation errors and will be skipped during upload. 
                        Only {validRows} valid rows will be processed.
                    </Alert>
                )}
            </Modal.Body>
            
            <Modal.Footer>
                <Button variant="secondary" onClick={handleClose} disabled={isUploading}>
                    {uploadResult?.success ? 'Close' : 'Cancel'}
                </Button>
                {!uploadResult?.success && (
                    <Button 
                        variant={invalidRows === 0 ? "primary" : "warning"} 
                        onClick={handleUpload}
                        disabled={isUploading || validRows === 0}
                    >
                        {isUploading ? (
                            <>
                                <span className="spinner-border spinner-border-sm mr-2" role="status" aria-hidden="true"></span>
                                Uploading...
                            </>
                        ) : (
                            <>
                                <i className="feather icon-upload mr-1"></i>
                                Upload {validRows} Valid Rows
                            </>
                        )}
                    </Button>
                )}
            </Modal.Footer>
        </Modal>
    );
};

export default CsvPreviewModal;
