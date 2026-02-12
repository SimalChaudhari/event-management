import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import { Alert, ProgressBar, Table, Badge } from 'react-bootstrap';
import Select from 'react-select';
import { uploadCsvUsers, downloadSampleCsv } from '../../store/actions/userActions';
import axiosInstance from '../../configs/axiosInstance';
import { useDispatch } from 'react-redux';
import '../../styles/csv-upload.css';
import { formatPhoneDisplay } from '../../utils/phoneFormatter';

const SALUTATION_OPTIONS = ['Mr', 'Ms', 'Mrs', 'Miss', 'Mdm', 'Dr', 'Prof'];

const CsvUploadModal = ({ show, onHide, onUploadSuccess }) => {
    const dispatch = useDispatch();
    const fileInputRef = useRef(null);
    const uploadSuccessNotifiedRef = useRef(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadResult, setUploadResult] = useState(null);
    const [errorMessage, setErrorMessage] = useState('');
    const [csvData, setCsvData] = useState([]);
    const [showPreview, setShowPreview] = useState(false);
    const [showDetailedPreview, setShowDetailedPreview] = useState(false);
    const [isUploadCompleted, setIsUploadCompleted] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [confirmModalData, setConfirmModalData] = useState({ title: '', message: '', onConfirm: null });
    const [validationResults, setValidationResults] = useState({
        validRows: [],
        invalidRows: [],
        totalValid: 0,
        totalInvalid: 0,
        errors: []
    });
    const [selectedEventId, setSelectedEventId] = useState('');
    const [eventOptions, setEventOptions] = useState([]);
    const [isLoadingEvents, setIsLoadingEvents] = useState(false);
    const [eventFetchError, setEventFetchError] = useState('');

    const selectedEvent = useMemo(
        () => eventOptions.find((event) => event.id === selectedEventId) || null,
        [eventOptions, selectedEventId]
    );

    const normalizeSalutation = (value) => {
        if (!value) return '';
        const trimmed = value.trim();
        if (!trimmed) return '';
        const withoutTrailingDot = trimmed.replace(/\.+$/, '');
        const match = SALUTATION_OPTIONS.find(
            (option) => option.toLowerCase() === withoutTrailingDot.toLowerCase()
        );
        if (match) {
            return match;
        }

        // Title-case the salutation as a fallback (e.g. "professor" -> "Professor")
        return withoutTrailingDot
            .toLowerCase()
            .split(/\s+/)
            .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
            .join(' ');
    };

    const fetchEventOptions = useCallback(async () => {
        setIsLoadingEvents(true);
        setEventFetchError('');
        try {
            const response = await axiosInstance.get('/events/dropdown-list');
            const allEvents = Array.isArray(response?.data?.data) ? response.data.data : [];
            
            // Filter out past events - only show upcoming and current events
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            const upcomingEvents = allEvents.filter(event => {
                if (!event.endDate) return true; // Include events without end date
                const endDate = new Date(event.endDate);
                endDate.setHours(0, 0, 0, 0);
                return endDate >= today; // Show events that haven't ended yet
            });
            
            // Sort by start date (upcoming first)
            upcomingEvents.sort((a, b) => {
                const dateA = a.startDate ? new Date(a.startDate) : new Date(0);
                const dateB = b.startDate ? new Date(b.startDate) : new Date(0);
                return dateA - dateB;
            });
            
            setEventOptions(upcomingEvents);
            if (upcomingEvents.length === 0) {
                setEventFetchError('No upcoming events are available for selection.');
            }
        } catch (error) {
            const apiError = error?.response?.data?.message || 'Failed to load events. Please try again.';
            setEventFetchError(apiError);
        } finally {
            setIsLoadingEvents(false);
        }
    }, []);

    const formatEventLabel = (event) => {
        if (!event) return '';
        const { name, startDate, endDate, location } = event;
        const toDate = (value) => {
            if (!value) return null;
            const parsed = new Date(value);
            return Number.isNaN(parsed.getTime()) ? null : parsed;
        };

        const start = toDate(startDate);
        const end = toDate(endDate);
        const formatDate = (date) =>
            date
                ? date.toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                  })
                : null;

        const startLabel = formatDate(start);
        const endLabel = formatDate(end);

        let datePart = '';
        if (startLabel && endLabel) {
            datePart = `${startLabel} - ${endLabel}`;
        } else if (startLabel) {
            datePart = startLabel;
        }

        const locationPart = location ? ` • ${location}` : '';
        return `${name}${datePart ? ` • ${datePart}` : ''}${locationPart}`;
    };

    useEffect(() => {
        if (show) {
            fetchEventOptions();
        }
    }, [show, fetchEventOptions]);

    const parseCSV = (content) => {
        const lines = content.trim().split('\n');
        if (lines.length < 2) {
            throw new Error('CSV must contain at least a header row and one data row');
        }

        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        const requiredHeaders = ['firstname', 'lastname', 'email', 'mobile'];
        const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
        
        if (missingHeaders.length > 0) {
            throw new Error(`Missing required headers: ${missingHeaders.join(', ')}`);
        }

        const users = [];
        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.trim());
            
            if (values.length !== headers.length) {
                throw new Error(`Row ${i + 1}: Number of values doesn't match headers`);
            }

            const user = {
                firstName: values[headers.indexOf('firstname')],
                lastName: values[headers.indexOf('lastname')],
                email: values[headers.indexOf('email')],
                mobile: values[headers.indexOf('mobile')],
            };

            const salutationIndex = headers.indexOf('salutation');
            if (salutationIndex >= 0 && values[salutationIndex]) {
                user.salutation = normalizeSalutation(values[salutationIndex]);
            }

            // Add optional fields if present in headers
            const companyIndex = headers.findIndex(h => ['company', 'company_name', 'organization', 'org'].includes(h));
            if (companyIndex >= 0 && values[companyIndex]) {
                user.company = values[companyIndex];
            }

            const designationIndex = headers.findIndex(h => ['designation', 'job_title', 'position', 'title'].includes(h));
            if (designationIndex >= 0 && values[designationIndex]) {
                user.designation = values[designationIndex];
            }

            users.push(user);
        }

        return users;
    };

    // Enhanced validation function
    const validateCsvData = (data) => {
        const validRows = [];
        const invalidRows = [];
        const errors = [];

        data.forEach((row, index) => {
            const rowErrors = [];
            
            // Check required fields
            if (!row.firstName || row.firstName.trim() === '') {
                rowErrors.push('First name is required');
            }
            if (!row.lastName || row.lastName.trim() === '') {
                rowErrors.push('Last name is required');
            }
            if (!row.email || row.email.trim() === '') {
                rowErrors.push('Email is required');
            }
            if (!row.mobile || row.mobile.trim() === '') {
                rowErrors.push('Mobile is required');
            }

            // Validate email format
            if (row.email && !isValidEmail(row.email)) {
                rowErrors.push('Invalid email format');
            }

            // Validate mobile format using Singapore validation
            if (row.mobile && !isValidMobile(row.mobile)) {
                rowErrors.push('Invalid Singapore mobile number. Must be 8 digits starting with 8 or 9');
            }

            if (row.salutation && row.salutation.trim() !== '') {
                row.salutation = normalizeSalutation(row.salutation);
            }

            if (rowErrors.length === 0) {
                validRows.push({ ...row, rowIndex: index + 1 });
            } else {
                invalidRows.push({ ...row, rowIndex: index + 1, errors: rowErrors });
                errors.push(`Row ${index + 1}: ${rowErrors.join(', ')}`);
            }
        });

        return {
            validRows,
            invalidRows,
            totalValid: validRows.length,
            totalInvalid: invalidRows.length,
            errors
        };
    };

    // Email validation
    const isValidEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    // Mobile validation
    const isValidMobile = (mobile) => {
        if (!mobile) return false;
        
        // Clean the phone number
        const cleaned = mobile.replace(/\D/g, '');
        let phoneDigits = cleaned;
        
        // Remove country code if present
        if (cleaned.startsWith('65')) {
            phoneDigits = cleaned.substring(2);
        }
        
        // Check if 8 digits and starts with 8 or 9
        return phoneDigits.length === 8 && (phoneDigits.startsWith('8') || phoneDigits.startsWith('9'));
    };

    const displayConfirmModal = (title, message, onConfirm) => {
        setConfirmModalData({ title, message, onConfirm });
        setShowConfirmModal(true);
    };

    const handleFileSelect = (event) => {
        const file = event.target.files[0];
        if (file) {
            // Validate file type
            if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
                setSelectedFile(file);
                setErrorMessage('');
                setUploadResult(null);
                setIsUploadCompleted(false); // Reset upload completed state for new file

                // Parse CSV file for preview
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const parsedData = parseCSV(e.target.result);
                        setCsvData(parsedData);
                        
                        // Validate data immediately
                        const validation = validateCsvData(parsedData);
                        setValidationResults(validation);
                        
                        // Always show preview table
                        setShowPreview(true);
                        
                        // Automatically open detailed preview modal
                        setShowDetailedPreview(true);
                        
                        // Show validation summary
                        if (validation.totalInvalid > 0) {
                            setErrorMessage(`Found ${validation.totalInvalid} invalid rows. Please review the preview table.`);
                        } else {
                            setErrorMessage('');
                        }
                    } catch (error) {
                        setErrorMessage(`CSV parsing error: ${error.message}`); 
                        setSelectedFile(null);
                        setShowPreview(false);
                        setValidationResults({
                            validRows: [],
                            invalidRows: [],
                            totalValid: 0,
                            totalInvalid: 0,
                            errors: []
                        });
                    }
                };
                reader.onerror = () => {
                    setErrorMessage('Failed to read file');
                    setSelectedFile(null);
                    setShowPreview(false);
                };
                reader.readAsText(file);
            } else {
                setErrorMessage('Please select a valid CSV file');
                setSelectedFile(null);
                setShowPreview(false);
            }
        }
    };

    const handleUpload = async () => {
        if (!selectedFile) {
            setErrorMessage('Please select a CSV file to upload');
            return;
        }

        if (validationResults.totalValid === 0) {
            setErrorMessage('No valid data found in CSV file. Please check the validation errors below.');
            return;
        }

        setIsUploading(true);
        setUploadProgress(0);
        setErrorMessage('');

        try {
            // Simulate progress updates
            const progressInterval = setInterval(() => {
                setUploadProgress(prev => {
                    if (prev >= 90) {
                        clearInterval(progressInterval);
                        return prev;
                    }
                    return prev + 10;
                });
            }, 200);

            // Only upload valid data
            const result = await dispatch(
                uploadCsvUsers(validationResults.validRows, {
                    eventId: selectedEventId || undefined, // Send undefined if empty string
                    fileName: selectedFile?.name,
                })
            );
            
            clearInterval(progressInterval);
            setUploadProgress(100);
            
            // Add validation summary to result
            const enhancedResult = {
                ...result,
                validationSummary: {
                    totalValid: validationResults.totalValid,
                    totalInvalid: validationResults.totalInvalid,
                    summaryMessage: `Upload successful! ${validationResults.totalValid} users processed successfully. ${validationResults.totalInvalid > 0 ? `${validationResults.totalInvalid} invalid rows were skipped.` : ''}`
                }
            };
            
            setUploadResult(enhancedResult);

            if (result.success) {
                uploadSuccessNotifiedRef.current = false; // Reset so we can notify when user closes
                // Mark upload as completed
                setIsUploadCompleted(true);
                
                // Clear file selection and validation data after successful upload
                setSelectedFile(null);
                setShowPreview(false);
                setCsvData([]);
                setValidationResults({
                    validRows: [],
                    invalidRows: [],
                    totalValid: 0,
                    totalInvalid: 0,
                    errors: []
                });
                
                // Reset file input
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
                
                // Don't call onUploadSuccess to prevent modal from closing
                // Keep modal open - don't close it automatically
            }
        } catch (error) {
            const errorMsg = error.message || 'Upload failed';
            setErrorMessage(errorMsg);
        } finally {
            setIsUploading(false);
            setTimeout(() => {
                setUploadProgress(0);
            }, 1000);
        }
    };

    const handleDownloadSample = async () => {
        try {
            const success = await dispatch(downloadSampleCsv());
            if (!success) {
                setErrorMessage('Failed to download sample CSV');
            }
        } catch (error) {
            setErrorMessage(error.message || 'Download failed');
        }
    };

    const handleClose = () => {
        // Notify parent once to reload table when closing after successful upload (avoid duplicate API calls)
        if (isUploadCompleted && uploadResult?.success && onUploadSuccess && !uploadSuccessNotifiedRef.current) {
            uploadSuccessNotifiedRef.current = true;
            onUploadSuccess();
        }
        // Complete page reset - reset ALL states to initial values
        setSelectedFile(null);
        setUploadProgress(0);
        setUploadResult(null);
        setErrorMessage('');
        setCsvData([]);
        setShowPreview(false);
        setShowDetailedPreview(false);
        setIsUploading(false);
        setIsUploadCompleted(false);
        setValidationResults({
            validRows: [],
            invalidRows: [],
            totalValid: 0,
            totalInvalid: 0,
            errors: []
        });
        setSelectedEventId('');
        setEventOptions([]);
        setEventFetchError('');
        
        // Reset file input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
        
        // Close modal
        onHide();
    };

    const handleRemoveFile = () => {
        // Complete reset - same as handleClose but without closing modal
        setSelectedFile(null);
        setUploadProgress(0);
        setUploadResult(null);
        setErrorMessage('');
        setCsvData([]);
        setShowPreview(false);
        setShowDetailedPreview(false); // Close the detailed table modal
        setIsUploading(false);
        setIsUploadCompleted(false);
        setValidationResults({
            validRows: [],
            invalidRows: [],
            totalValid: 0,
            totalInvalid: 0,
            errors: []
        });
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // Page refresh detection and confirmation
    useEffect(() => {
        const handleBeforeUnload = (e) => {
            // Check if upload result exists (data has been uploaded)
            if (uploadResult && uploadResult.data) {
                e.preventDefault();
                e.returnValue = 'CSV upload completed successfully! Refreshing will clear the upload information. Are you sure you want to refresh?';
                return e.returnValue;
            }
        };

        // Add event listener for page refresh
        window.addEventListener('beforeunload', handleBeforeUnload);

        // Cleanup
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [uploadResult]);

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <Modal 
            show={show} 
            onHide={handleClose} 
            size="lg" 
            centered
            className="csv-upload-modal"
            id="csv-upload-main-modal"
            backdrop="static"
            keyboard={false}
        >
            <Modal.Header>
                <Modal.Title className="d-flex align-items-center">
                    <i className="feather icon-upload mr-2"></i>
                    Upload CSV Users
                </Modal.Title>
            </Modal.Header>
            
            <Modal.Body>
                <div className="mb-4">
                    <h6 className="mb-3">
                        <i className="feather icon-info mr-1"></i>
                        CSV Upload Instructions
                    </h6>
                    <div className="alert alert-info">
                        <p className="mb-2">
                            <strong>Required Columns:</strong> firstName, lastName, email, mobile
                        </p>
                        <p className="mb-2">
                            <strong>Optional Columns:</strong> salutation (Mr, Ms, Mrs, Miss, Mdm, Dr, Prof or your preferred title), company, designation
                        </p>
                        <p className="mb-2">
                            <strong>Mobile Format:</strong> Singapore mobile numbers (8 digits starting with 8 or 9)
                        </p>
                        <p className="mb-0">
                            <strong>File Size:</strong> Maximum 10MB
                        </p>
                        <p className="mb-0">
                            <strong>Format:</strong> CSV file with comma-separated values
                        </p>
                    </div>
                </div>

                <Form.Group controlId="eventSelection" className="mb-4">
                    <Form.Label className="font-weight-600 d-flex align-items-center justify-content-between">
                        <span>
                            <i className="feather icon-calendar mr-1"></i>
                            Associate CSV Users with an Event <span className="text-muted">(Optional)</span>
                        </span>
                        <Button
                            variant="link"
                            size="sm"
                            onClick={fetchEventOptions}
                            disabled={isLoadingEvents}
                            title="Refresh events"
                            className="p-0"
                            style={{ fontSize: '0.875rem' }}
                        >
                            {isLoadingEvents ? (
                                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                            ) : (
                                <><i className="feather icon-refresh-cw mr-1"></i>Refresh</>
                            )}
                        </Button>
                    </Form.Label>
                    
                    {isLoadingEvents ? (
                        <div className="text-center py-3">
                            <span className="spinner-border spinner-border-sm mr-2" role="status" aria-hidden="true"></span>
                            <span className="text-muted">Loading events...</span>
                        </div>
                    ) : (
                        <Select
                            value={selectedEventId ? {
                                value: selectedEventId,
                                label: (() => {
                                    const event = eventOptions.find(e => e.id === selectedEventId);
                                    if (!event) return '';
                                    const isCurrentEvent = event.startDate && new Date(event.startDate) <= new Date() && event.endDate && new Date(event.endDate) >= new Date();
                                    const eventLabel = formatEventLabel(event);
                                    return isCurrentEvent 
                                        ? `${event.name} • ${eventLabel} • [Ongoing]`
                                        : `${event.name} • ${eventLabel}`;
                                })()
                            } : null}
                            onChange={(selectedOption) => {
                                setSelectedEventId(selectedOption?.value || '');
                                if (errorMessage && errorMessage.toLowerCase().includes('event')) {
                                    setErrorMessage('');
                                }
                            }}
                            options={[
                                { value: '', label: 'No Event Association', isNoEvent: true },
                                ...eventOptions.map((event) => {
                                    const isCurrentEvent = event.startDate && new Date(event.startDate) <= new Date() && event.endDate && new Date(event.endDate) >= new Date();
                                    const eventLabel = formatEventLabel(event);
                                    const displayLabel = isCurrentEvent 
                                        ? `${event.name} • ${eventLabel} • [Ongoing]`
                                        : `${event.name} • ${eventLabel}`;
                                    
                                    return {
                                        value: event.id,
                                        label: displayLabel,
                                        event: event
                                    };
                                })
                            ]}
                            placeholder={eventOptions.length === 0 ? 'No upcoming events available' : 'Select an event (Optional)...'}
                            isSearchable
                            isClearable
                            isDisabled={isLoadingEvents}
                            isLoading={isLoadingEvents}
                            menuPortalTarget={document.body}
                            menuPosition="fixed"
                            filterOption={(option, searchText) => {
                                if (option.data && option.data.isNoEvent) {
                                    return searchText === '' || 'no event'.includes(searchText.toLowerCase());
                                }
                                const searchLower = searchText.toLowerCase();
                                const event = option.data?.event;
                                if (!event) return false;
                                
                                const nameMatch = event.name?.toLowerCase().includes(searchLower);
                                const locationMatch = event.location?.toLowerCase().includes(searchLower) || event.venue?.toLowerCase().includes(searchLower);
                                const dateMatch = formatEventLabel(event).toLowerCase().includes(searchLower);
                                
                                return nameMatch || locationMatch || dateMatch;
                            }}
                            styles={{
                                control: (base) => ({
                                    ...base,
                                    fontSize: '14px',
                                    minHeight: '38px',
                                }),
                                menu: (base) => ({
                                    ...base,
                                    zIndex: 9999,
                                    maxHeight: '300px'
                                }),
                                menuPortal: (base) => ({
                                    ...base,
                                    zIndex: 9999
                                }),
                                option: (base, state) => ({
                                    ...base,
                                    backgroundColor: state.isSelected 
                                        ? '#007bff' 
                                        : state.isFocused 
                                        ? '#f8f9fa' 
                                        : 'white',
                                    color: state.isSelected ? 'white' : '#212529',
                                    '&:active': {
                                        backgroundColor: state.isSelected ? '#007bff' : '#e9ecef'
                                    }
                                })
                            }}
                            formatOptionLabel={({ label, data }) => {
                                if (data && data.isNoEvent) {
                                    return (
                                        <div className="text-muted">
                                            <i className="feather icon-x-circle mr-2"></i>
                                            {label}
                                        </div>
                                    );
                                }
                                return label;
                            }}
                        />
                    )}
                    
                    {eventFetchError && (
                        <small className="text-danger d-block mt-2">{eventFetchError}</small>
                    )}
                    
                    {selectedEvent && (
                        <div className="alert alert-info mt-3 mb-0">
                            <i className="feather icon-info mr-2"></i>
                            <strong>Selected:</strong> {selectedEvent.name}
                            <br />
                            <small>New users will receive credentials + QR code. Existing users will receive QR code only.</small>
                        </div>
                    )}
                    
                    {!selectedEventId && (
                        <div className="alert alert-secondary mt-3 mb-0">
                            <i className="feather icon-info mr-2"></i>
                            <strong>No Event Selected:</strong> New users will receive credentials email only. Existing users will not receive any email.
                        </div>
                    )}
                </Form.Group>

                {errorMessage && (
                    <Alert variant="danger" className="mb-3">
                        <i className="feather icon-alert-triangle mr-1"></i>
                        {errorMessage}
                    </Alert>
                )}

                {uploadResult && (
                    <Alert variant={uploadResult.success ? "success" : "warning"} className="mb-3">
                        <div className="text-center">
                            <h6 className="mb-2">
                                <i className="feather icon-check-circle mr-2"></i>
                                {uploadResult.success ? "Upload Successful!" : "Upload Completed with Issues"}
                            </h6>
                            <p className="mb-0">
                                {uploadResult.data && uploadResult.success ? (
                                    <>
                                        <strong>{uploadResult.data.newUsersCreated}</strong> users created successfully
                                        {uploadResult.data.existingUsersSkipped > 0 && (
                                            <> • <strong>{uploadResult.data.existingUsersSkipped}</strong> existing users skipped</>
                                        )}
                                        {uploadResult.data.emailsSent && parseInt(uploadResult.data.emailsSent) > 0 && (
                                            <> • <strong>{uploadResult.data.emailsSent}</strong> credentials emails sent</>
                                        )}
                                        {uploadResult.data.emailsFailed && parseInt(uploadResult.data.emailsFailed) >  0 && (
                                            <> • <strong>{uploadResult.data.emailsFailed}</strong> emails failed</>
                                        )}
                                    </>
                                ) : (
                                    uploadResult.message || "Upload completed"
                                )}
                            </p>
                        </div>
                        
                        {uploadResult.data?.eventAssociation && (
                            <div className="text-center mt-3">
                                <Badge variant="light" className="badge-light-primary px-3 py-2">
                                    <i className="feather icon-map-pin mr-1"></i>
                                    Linked to: {uploadResult.data.eventAssociation.eventName}
                                </Badge>
                                <div className="small text-muted mt-2">
                                    <strong>{uploadResult.data.eventAssociation.registrationsCreated}</strong> new registrations created •{' '}
                                    <strong>{uploadResult.data.eventAssociation.registrationsSkipped}</strong> users already linked
                                </div>
                            </div>
                        )}
                        
                        {/* Enterprise-Grade Professional Summary */}
                        {uploadResult.data && (
                            <div className="mt-4">
                                <div className="border-top pt-3">
                                    <div className="d-flex justify-content-between align-items-center mb-3">
                                        <h6 className="mb-0 text-dark font-weight-600">PROCESSING REPORT</h6>
                                        <small className="text-muted">{new Date().toLocaleString()}</small>
                                    </div>
                                    
                                    <div className="row">
                                        <div className="col-6">
                                            <div className="d-flex justify-content-between py-1">
                                                <span className="text-muted small">Records Processed</span>
                                                <span className="font-weight-bold">{uploadResult.data.totalProcessed}</span>
                                            </div>
                                            <div className="d-flex justify-content-between py-1">
                                                <span className="text-muted small">New Users</span>
                                                <span className="font-weight-bold text-success">{uploadResult.data.newUsersCreated}</span>
                                            </div>
                                            <div className="d-flex justify-content-between py-1">
                                                <span className="text-muted small">Skipped</span>
                                                <span className="font-weight-bold text-warning">{uploadResult.data.existingUsersSkipped}</span>
                                            </div>
                                        </div>
                                        <div className="col-6">
                                            <div className="d-flex justify-content-between py-1">
                                                <span className="text-muted small">Passwords</span>
                                                <span className="font-weight-bold text-info">{uploadResult.data.passwordsGenerated}</span>
                                            </div>
                                            <div className="d-flex justify-content-between py-1">
                                                <span className="text-muted small">Emails Sent</span>
                                                <span className="font-weight-bold text-success">{uploadResult.data.emailsSent}</span>
                                            </div>
                                            <div className="d-flex justify-content-between py-1">
                                                <span className="text-muted small">Emails Failed</span>
                                                <span className="font-weight-bold text-danger">{uploadResult.data.emailsFailed}</span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="border-top mt-3 pt-3">
                                        <div className="d-flex justify-content-between">
                                            <span className="text-muted small">Execution Time</span>
                                            <span className="font-weight-bold text-dark">{uploadResult.data.details}</span>
                                        </div>
                                    </div>
                                    
                                    {/* Email Status Details */}
                                    {uploadResult.data.emailStatus && (
                                        <div className="border-top mt-3 pt-3">
                                            <div className="d-flex justify-content-between align-items-center mb-2">
                                                <span className="text-muted small font-weight-600">EMAIL STATUS</span>
                                                <span className={`badge badge-${uploadResult.data.emailStatus.status === 'completed' ? 'success' : 
                                                    uploadResult.data.emailStatus.status === 'sending' ? 'warning' : 
                                                    uploadResult.data.emailStatus.status === 'background_processing' ? 'info' : 'secondary'}`}>
                                                    {uploadResult.data.emailStatus.status.toUpperCase().replace('_', ' ')}
                                                </span>
                                            </div>
                                            <div className="row">
                                                <div className="col-6">
                                                    <div className="d-flex justify-content-between py-1">
                                                        <span className="text-muted small">Total Emails</span>
                                                        <span className="font-weight-bold">{uploadResult.data.emailStatus.totalEmails}</span>
                                                    </div>
                                                </div>
                                                <div className="col-6">
                                                    <div className="d-flex justify-content-between py-1">
                                                        <span className="text-muted small">Processing</span>
                                                        <span className="font-weight-bold text-warning">{uploadResult.data.emailStatus.emailsProcessing}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    
                                    {/* Enterprise-style Skipped Records */}
                                    {uploadResult.data.skippedUsers && uploadResult.data.skippedUsers.length > 0 && (
                                        <div className="border-top mt-3 pt-3">
                                            <div className="d-flex justify-content-between align-items-center mb-2">
                                                <span className="text-muted small font-weight-600">SKIPPED RECORDS</span>
                                                <span className="badge badge-warning badge-pill">{uploadResult.data.skippedUsers.length}</span>
                                            </div>
                                            <div className="bg-light rounded p-2" style={{maxHeight: '120px', overflowY: 'auto'}}>
                                                {uploadResult.data.skippedUsers.map((user, index) => (
                                                    <div key={index} className="small text-muted py-1 border-bottom border-light">
                                                        {user}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                        
                    </Alert>
                )}

                <div className="upload-section">
                    {showPreview && csvData.length > 0 && (
                        <Alert variant={validationResults.totalInvalid > 0 ? "warning" : "success"} className="mb-3">
                            <div className="d-flex justify-content-between align-items-center mb-2">
                                <h6 className="mb-0">
                                    <i className="feather icon-check-circle mr-1"></i>
                                    Data Validation Summary
                                </h6>
                                <Button 
                                    variant="outline-primary" 
                                    size="sm"
                                    onClick={() => setShowDetailedPreview(true)}
                                    className="d-flex align-items-center"
                                >
                                    <i className="feather icon-table mr-1"></i>
                                    View Full Table
                                </Button>
                            </div>
                            <div className="row mb-2">
                                <div className="col-md-3">
                                    <strong>Total Rows:</strong> {csvData.length}
                                </div>
                                <div className="col-md-3">
                                    <Badge variant="success" className="mr-1">
                                        <i className="feather icon-check mr-1"></i>
                                        Valid: {validationResults.totalValid}
                                    </Badge>
                                </div>
                                <div className="col-md-3">
                                    <Badge variant={validationResults.totalInvalid > 0 ? "danger" : "secondary"} className="mr-1">
                                        <i className="feather icon-x mr-1"></i>
                                        Invalid: {validationResults.totalInvalid}
                                    </Badge>
                                </div>
                                <div className="col-md-3">
                                    <strong>File:</strong> {selectedFile?.name || 'Unknown'}
                                </div>
                            </div>
                            {validationResults.totalInvalid > 0 && (
                                <p className="text-warning mb-0">
                                    <i className="feather icon-alert-triangle mr-1"></i>
                                    {validationResults.totalInvalid} rows have validation errors. Only valid rows will be uploaded.
                                </p>
                            )}
                        </Alert>
                    )}

                    <Form.Group controlId="csvFile" className="mb-4">
                        <Form.Label>
                            <i className="feather icon-file mr-1"></i>
                            Select CSV File
                        </Form.Label>
                        <Form.Control
                            ref={fileInputRef}
                            type="file"
                            accept=".csv"
                            onChange={handleFileSelect}
                            disabled={isUploading}
                            className="form-control-file"
                        />
                        {selectedFile && (
                            <div className="file-info mt-2 p-2 bg-light rounded">
                                <div className="d-flex justify-content-between align-items-center">
                                    <div>
                                        <strong>{selectedFile.name}</strong>
                                        <br />
                                        <small className="text-muted">
                                            Size: {formatFileSize(selectedFile.size)}
                                        </small>
                                    </div>
                                    <Button 
                                        variant="outline-danger" 
                                        size="sm"
                                        onClick={handleRemoveFile}
                                        disabled={isUploading}
                                    >
                                        <i className="feather icon-x"></i>
                                    </Button>
                                </div>
                            </div>
                        )}
                    </Form.Group>

                    {isUploading && (
                        <div className="mb-3">
                            <div className="d-flex justify-content-between mb-1">
                                <span>Uploading...</span>
                                <span>{uploadProgress}%</span>
                            </div>
                            <ProgressBar now={uploadProgress} />
                        </div>
                    )}
                </div>

                <div className="sample-section">
                    <hr />
                    <div className="d-flex justify-content-between align-items-center">
                        <div>
                            <h6 className="mb-1">
                                <i className="feather icon-download mr-1"></i>
                                Need a Sample File?
                            </h6>
                            <p className="text-muted mb-0">
                                Download a sample CSV file to see the correct format
                            </p>
                        </div>
                        <Button 
                            variant="outline-primary" 
                            onClick={handleDownloadSample}
                            disabled={isUploading}
                        >
                            <i className="feather icon-download mr-1"></i>
                            Download Sample
                        </Button>
                    </div>
                </div>
            </Modal.Body>
            
            <Modal.Footer>
                <Button variant="secondary" onClick={() => {
                    displayConfirmModal(
                        'Confirm Close',
                        'Are you sure you want to close? Upload progress will be lost.',
                        () => handleClose()
                    );
                }} disabled={isUploading}>
                    Close
                </Button>
                {!isUploadCompleted && (
                    <Button 
                        variant="primary" 
                        onClick={handleUpload}
                        disabled={
                            !selectedFile ||
                            isUploading ||
                            validationResults.totalValid === 0
                        }
                    >
                        {isUploading ? (
                            <>
                                <span className="spinner-border spinner-border-sm mr-2" role="status" aria-hidden="true"></span>
                                Uploading...
                            </>
                        ) : (
                            <>
                                <i className="feather icon-upload mr-1"></i>
                                {validationResults.totalValid > 0 ? 
                                    `Upload ${validationResults.totalValid} Valid Users` : 
                                    (csvData.length > 0 ? 'No Valid Data to Upload' : 'Upload CSV')
                                }
                            </>
                        )}
                    </Button>
                )}
            </Modal.Footer>
            
            {/* Detailed Preview Modal */}
            <Modal 
                show={showDetailedPreview} 
                onHide={() => setShowDetailedPreview(false)} 
                size="xl" 
                centered
                className="csv-detailed-preview-modal"
            >
                <Modal.Header>
                    <Modal.Title className="d-flex align-items-center">
                        <i className="feather icon-table mr-2"></i>
                        Detailed CSV Preview
                    </Modal.Title>
                </Modal.Header>
                
                <Modal.Body>
                    <div className="mb-3">
                        <div className="row text-sm mb-2">
                            <div className="col-md-4">
                                <strong>File:</strong> {selectedFile?.name || 'Unknown file'}
                            </div>
                            <div className="col-md-4">
                                <strong>Total Rows:</strong> {csvData.length}
                            </div>
                            <div className="col-md-4">
                                <strong>Size:</strong> {selectedFile ? formatFileSize(selectedFile.size) : 'Unknown'}
                            </div>
                        </div>
                    </div>
                    
                    <div className="table-responsive" style={{ maxHeight: '60vh', overflowY: 'auto', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' }}>
                        <Table hover size="sm" className="mb-0" style={{ borderRadius: '12px', overflow: 'hidden' }}>
                            <thead>
                                <tr>
                                    <th style={{ width: '60px', padding: '15px 8px', backgroundColor: '#4680ff' }} className="text-center text-white fw-bold">#</th>
                                    <th style={{ padding: '15px 12px', backgroundColor: '#4680ff' }} className="text-center text-white fw-bold">Salutation</th>
                                    <th style={{ padding: '15px 12px', backgroundColor: '#4680ff' }} className="text-center text-white fw-bold">First Name</th>
                                    <th style={{ padding: '15px 12px', backgroundColor: '#4680ff' }} className="text-center text-white fw-bold">Last Name</th>
                                    <th style={{ padding: '15px 12px', backgroundColor: '#4680ff' }} className="text-center text-white fw-bold">Email</th>
                                    <th style={{ padding: '15px 12px', backgroundColor: '#4680ff' }} className="text-center text-white fw-bold">Mobile</th>
                                    <th style={{ padding: '15px 12px', backgroundColor: '#4680ff' }} className="text-center text-white fw-bold">Company</th>
                                    <th style={{ padding: '15px 12px', backgroundColor: '#4680ff' }} className="text-center text-white fw-bold">Designation</th>
                                    <th style={{ width: '120px', padding: '15px 12px', backgroundColor: '#4680ff' }} className="text-center text-white fw-bold">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {csvData.map((row, index) => {
                                    const isValid = validationResults.validRows.some(validRow => validRow.rowIndex === index + 1);
                                    const invalidRow = validationResults.invalidRows.find(invalidRow => invalidRow.rowIndex === index + 1);
                                    
                                    return (
                                        <tr 
                                            key={index} 
                                            style={{ 
                                                backgroundColor: isValid ? '#f0f9ff' : '#fef2f2',
                                                borderBottom: '1px solid #e5e7eb',
                                                transition: 'all 0.3s ease'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.backgroundColor = isValid ? '#e0f2fe' : '#fee2e2';
                                                e.currentTarget.style.transform = 'translateY(-1px)';
                                                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.backgroundColor = isValid ? '#f0f9ff' : '#fef2f2';
                                                e.currentTarget.style.transform = 'translateY(0)';
                                                e.currentTarget.style.boxShadow = 'none';
                                            }}
                                        >
                                            <td style={{ padding: '12px 8px' }} className="text-center fw-bold text-muted">{index + 1}</td>
                                            <td style={{ padding: '12px' }} className="fw-medium">{row.salutation || <span className="text-muted">N/A</span>}</td>
                                            <td style={{ padding: '12px' }} className="fw-medium">{row.firstName || <span className="text-muted">N/A</span>}</td>
                                            <td style={{ padding: '12px' }} className="fw-medium">{row.lastName || <span className="text-muted">N/A</span>}</td>
                                            <td style={{ padding: '12px' }} className="fw-medium">{row.email || <span className="text-muted">N/A</span>}</td>
                                            <td style={{ padding: '12px' }} className="fw-medium">
                                                {row.mobile ? formatPhoneDisplay(row.mobile) : <span className="text-muted">N/A</span>}
                                            </td>
                                            <td style={{ padding: '12px' }} className="fw-medium">{row.company || <span className="text-muted">N/A</span>}</td>
                                            <td style={{ padding: '12px' }} className="fw-medium">{row.designation || <span className="text-muted">N/A</span>}</td>
                                            <td style={{ padding: '12px' }} className="text-center">
                                                {isValid ? (
                                                    <Badge 
                                                        className="px-4 py-2 fw-bold text-white rounded-pill shadow-sm" 
                                                        style={{ 
                                                            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                                            fontSize: '0.8rem',
                                                            letterSpacing: '0.5px',
                                                            minWidth: '85px',
                                                            border: 'none',
                                                            boxShadow: '0 2px 4px rgba(16, 185, 129, 0.3)'
                                                        }}
                                                    >
                                                        <i className="feather icon-check mr-2"></i>Valid
                                                    </Badge>
                                                ) : (
                                                    <Badge 
                                                        className="px-4 py-2 fw-bold text-white rounded-pill shadow-sm" 
                                                        style={{ 
                                                            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                                                            fontSize: '0.8rem',
                                                            letterSpacing: '0.5px',
                                                            minWidth: '85px',
                                                            border: 'none',
                                                            boxShadow: '0 2px 4px rgba(239, 68, 68, 0.3)'
                                                        }}
                                                        title={invalidRow?.errors?.join(', ')}
                                                    >
                                                        <i className="feather icon-x mr-2"></i>Invalid
                                                    </Badge>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </Table>
                    </div>
                    
                    {csvData.length === 0 && (
                        <div className="text-center py-4">
                            <p className="text-muted">No data to preview</p>
                        </div>
                    )}
                </Modal.Body>
                
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowDetailedPreview(false)}>
                        Close Preview
                    </Button>
                    {!isUploadCompleted && (
                        <Button 
                            variant="primary" 
                            onClick={() => {
                                setShowDetailedPreview(false);
                                // Trigger the upload directly
                                handleUpload();
                            }}
                        >
                            <i className="feather icon-upload mr-1"></i>
                            Proceed to Upload
                        </Button>
                    )}
                </Modal.Footer>
            </Modal>
            
            {/* Confirmation Modal */}
            <Modal 
                show={showConfirmModal} 
                onHide={() => setShowConfirmModal(false)} 
                size="md" 
                centered
            >
                <Modal.Header className="text-dark">
                    <Modal.Title className="d-flex align-items-center">
                        <i className="feather icon-alert-triangle mr-2"></i>
                        {confirmModalData.title}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div className="text-center">
                        <div className="mb-3 text-warning">
                            <i className="feather icon-alert-triangle mr-2" style={{ fontSize: '2rem' }}></i>
                        </div>
                        <p className="mb-0">{confirmModalData.message}</p>
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <Button 
                        variant="secondary" 
                        onClick={() => setShowConfirmModal(false)}
                        className="mr-2"
                    >
                        Cancel
                    </Button>
                    <Button 
                        variant="danger" 
                        onClick={() => {
                            setShowConfirmModal(false);
                            if (confirmModalData.onConfirm) {
                                confirmModalData.onConfirm();
                            }
                        }}
                    >
                        Confirm
                    </Button>
                </Modal.Footer>
            </Modal>
        </Modal>
    );
};

export default CsvUploadModal;
