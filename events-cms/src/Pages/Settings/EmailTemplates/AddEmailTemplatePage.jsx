import React, { useState, useEffect } from 'react';
import { Button, Row, Col, Container, Form, Modal, Badge, Card } from 'react-bootstrap';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import axiosInstance from '../../../configs/axiosInstance';
import { SETTINGS_PATHS } from '../../../utils/constants';
import useTableNavigation from '../../../hooks/useTableNavigation';
// import CkUpdateEditor, { uploadEditorImages } from '../../../App/components/CkEditor/CkUpdateEditor';
import SettingsEditor from '../../../App/components/CkEditor/SettingsEditor';

const AddEmailTemplatePage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { id } = useParams(); // Edit mode
    const [loading, setLoading] = useState(false);
    const previousPageRef = React.useRef(null);
    const [editorKey, setEditorKey] = useState(0);

    const [formData, setFormData] = useState({
        name: '',
        subject: '',
        body: '',
        type: 'custom',
        isActive: true,
        variables: ''
    });

    const { handleBack: handleBackNavigation } = useTableNavigation({
        tableRef: null,
        listPath: SETTINGS_PATHS.EMAIL_TEMPLATES,
        viewPath: SETTINGS_PATHS.VIEW_EMAIL_TEMPLATE,
        editPath: SETTINGS_PATHS.EDIT_EMAIL_TEMPLATE,
        addPath: SETTINGS_PATHS.ADD_EMAIL_TEMPLATE
    });

    useEffect(() => {
        const params = new URLSearchParams(location.search || window.location.search);
        const pageParam = params.get('page');
        if (pageParam) {
            previousPageRef.current = parseInt(pageParam, 10);
        } else if (location.state?.page) {
            previousPageRef.current = location.state.page;
        }
    }, [location.search, location.state, id]);

    // Load edit data if id exists, or load template data from state
    useEffect(() => {
        if (id) {
            const loadTemplateData = async () => {
                try {
                    const response = await axiosInstance.get(`/email-templates/${id}`);
                    if (response.data.success && response.data.data) {
                        const editData = response.data.data;
                        setFormData({
                            name: editData.name || '',
                            subject: editData.subject || '',
                            body: editData.body || '',
                            type: editData.type || 'custom',
                            isActive: editData.isActive !== undefined ? editData.isActive : true,
                            variables: editData.variables || ''
                        });
                    }
                } catch (error) {
                    toast.error('Failed to load template data');
                    console.error(error);
                }
            };
            loadTemplateData();
        } else if (location.state?.templateData) {
            // Load template data from navigation state (from ChooseTemplatePage)
            const templateData = location.state.templateData;
            setFormData({
                name: templateData.name || '',
                subject: templateData.subject || '',
                body: templateData.body || '',
                type: templateData.type || 'custom',
                isActive: templateData.isActive !== undefined ? templateData.isActive : true,
                variables: templateData.variables || ''
            });
            // Force editor to re-render with new data after a small delay
            // This allows the previous editor instance to fully unmount
            setTimeout(() => {
                setEditorKey(prev => prev + 1);
            }, 100);
            toast.success(`${templateData.name || 'Template'} loaded successfully!`);
        }
    }, [id, location.state]);

    const handleChooseTemplate = () => {
        const currentPage = getCurrentPage();
        navigate(SETTINGS_PATHS.CHOOSE_EMAIL_TEMPLATE, {
            state: {
                returnPath: SETTINGS_PATHS.ADD_EMAIL_TEMPLATE,
                page: currentPage
            }
        });
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const getReturnPage = () => {
                const params = new URLSearchParams(location.search || window.location.search);
                return params.get('page') || location.state?.page || previousPageRef.current;
            };

            // Upload base64 images and replace with server URLs
            let finalBody = formData.body;
            if (formData.body) {
                // finalBody = await uploadEditorImages(formData.body);
            }

            const submitData = {
                ...formData,
                body: finalBody
            };

            if (id) {
                const response = await axiosInstance.put(`/email-templates/update/${id}`, submitData);
                if (response.data.success) {
                    toast.success('Email template updated successfully');
                    const targetPage = getReturnPage();
                    if (targetPage) {
                        navigate(`${SETTINGS_PATHS.EMAIL_TEMPLATES}?page=${targetPage}`);
                    } else {
                        navigate(SETTINGS_PATHS.EMAIL_TEMPLATES);
                    }
                }
            } else {
                const response = await axiosInstance.post('/email-templates/create', submitData);
                if (response.data.success) {
                    toast.success('Email template created successfully');
                    navigate(SETTINGS_PATHS.EMAIL_TEMPLATES);
                }
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to save email template');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const getCurrentPage = () => {
        const params = new URLSearchParams(location.search || window.location.search);
        return params.get('page') || location.state?.page || previousPageRef.current;
    };

    const handleCancel = () => {
        const targetPage = getCurrentPage();
        handleBackNavigation(targetPage);
    };

    return (
        <Container fluid>
            <div className="row">
                <div className="col-12">
                    <div className="card">
                        <div className="card-header">
                            <div className="d-flex justify-content-between align-items-center">
                                <h4 className="card-title">{id ? 'Edit Email Template' : 'Add Email Template'}</h4>
                                <Button variant="secondary" onClick={handleCancel}>
                                    <i style={{ marginRight: '10px' }} className="fas fa-arrow-left me-2"></i>
                                    Back
                                </Button>
                            </div>
                        </div>
                        <div className="card-body">
                            <form onSubmit={handleSubmit}>
                                <Row>
                                    <Col sm={12}>
                                        <div className="form-group fill">
                                            <label className="floating-label" htmlFor="name">
                                                Template Name <span style={{ color: 'red' }}>*</span>
                                            </label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                name="name"
                                                id="name"
                                                value={formData.name}
                                                onChange={handleInputChange}
                                                placeholder="e.g., Welcome Email"
                                                required
                                            />
                                        </div>
                                    </Col>

                                    <Col sm={12}>
                                        <div className="form-group fill">
                                            <label className="floating-label" htmlFor="type">
                                                Type <span style={{ color: 'red' }}>*</span>
                                            </label>
                                            <select
                                                className="form-control"
                                                name="type"
                                                id="type"
                                                value={formData.type}
                                                onChange={handleInputChange}
                                                required
                                            >
                                                <option value="welcome">Welcome</option>
                                                <option value="password-reset">Password Reset</option>
                                                <option value="event-registration">Event Registration</option>
                                                <option value="event-reminder">Event Reminder</option>
                                                <option value="notification">Notification</option>
                                                <option value="custom">Custom</option>
                                            </select>
                                        </div>
                                    </Col>

                                    <Col sm={12}>
                                        <div className="form-group fill">
                                            <label className="floating-label" htmlFor="subject">
                                                Subject <span style={{ color: 'red' }}>*</span>
                                            </label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                name="subject"
                                                id="subject"
                                                value={formData.subject}
                                                onChange={handleInputChange}
                                                placeholder="e.g., Welcome to {{eventName}}"
                                                required
                                            />
                                            <small className="form-text text-muted" style={{ marginTop: '5px', display: 'block' }}>
                                                Use {'{{'}variableName{'}}'} for dynamic content
                                            </small>
                                        </div>
                                    </Col>

                                    <Col sm={12}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>
                                                Email Body <span style={{ color: 'red' }}>*</span>
                                            </Form.Label>
                                            {!id && (
                                                <div className="mb-2">
                                                    <Button
                                                        variant="outline-primary"
                                                        size="sm"
                                                        type="button"
                                                        onClick={handleChooseTemplate}
                                                    >
                                                        <i className="feather icon-grid mr-1" />
                                                        Choose Template
                                                    </Button>
                                                </div>
                                            )}
                                            {/* <SettingsEditor
                                                key={editorKey}
                                                data={formData.body}
                                                onChange={(event, editor) => {
                                                    setFormData({ ...formData, body: editor.getData() });
                                                }}
                                                placeholder="Enter email body content. Use {{variableName}} for dynamic content..."
                                            /> */}
                                            <Form.Text className="text-muted" style={{ marginTop: '10px', display: 'block' }}>
                                                <strong>Variables:</strong> Use {'{{'}variableName{'}}'} for dynamic content
                                            </Form.Text>
                                        </Form.Group>
                                    </Col>

                                    <Col sm={12}>
                                        <div className="form-group fill">
                                            <label className="floating-label" htmlFor="variables">
                                                Available Variables (JSON)
                                            </label>
                                            <textarea
                                                className="form-control"
                                                name="variables"
                                                id="variables"
                                                value={formData.variables}
                                                onChange={handleInputChange}
                                                placeholder='{"userName": "User Name", "eventName": "Event Name"}'
                                                rows={3}
                                            />
                                            <small className="form-text text-muted" style={{ marginTop: '5px', display: 'block' }}>
                                                Optional: JSON object describing available variables
                                            </small>
                                        </div>
                                    </Col>

                                    <Col sm={12}>
                                        <Form.Group className="mb-3">
                                            <Form.Check
                                                type="switch"
                                                id="isActive"
                                                label="Active"
                                                name="isActive"
                                                checked={formData.isActive}
                                                onChange={handleInputChange}
                                            />
                                        </Form.Group>
                                    </Col>
                                </Row>

                                <div className="row mt-4">
                                    <div className="col-12">
                                        <div className="d-flex justify-content-between gap-2">
                                            <Button variant="danger" onClick={handleCancel}>
                                                Cancel
                                            </Button>
                                            <Button variant="primary" type="submit" disabled={loading || !formData.name.trim() || !formData.subject.trim() || !formData.body.trim()}>
                                                {loading
                                                    ? id
                                                        ? 'Updating...'
                                                        : 'Creating...'
                                                    : id
                                                    ? 'Update'
                                                    : 'Create'}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>

        </Container>
    );
};

export default AddEmailTemplatePage;

