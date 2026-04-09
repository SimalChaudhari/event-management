import { useState, useEffect } from 'react';
import { Row, Col, Card, Table, Button, Badge, Modal, Form } from 'react-bootstrap';
import { toast } from 'react-toastify';
import axiosInstance from '../../../configs/axiosInstance';
import DeleteConfirmationModal from '../../../components/modal/DeleteConfirmationModal';
import SettingsEditor from '../../../App/components/CkEditor/SettingsEditor';

const EmailTemplates = () => {
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showPreviewModal, setShowPreviewModal] = useState(false);
    const [showTemplateGallery, setShowTemplateGallery] = useState(false);
    const [previewData, setPreviewData] = useState(null);
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        subject: '',
        body: '',
        type: 'custom',
        isActive: true,
        variables: ''
    });

    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        setLoading(true);
        try {
            const response = await axiosInstance.get('/email-templates');
            if (response.data.success) {
                setTemplates(response.data.data);
            }
        } catch (error) {
            toast.error('Failed to fetch email templates');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = () => {
        setShowTemplateGallery(true);
    };

    const getTemplateBody = (templateKey) => {
        const templateBodies = {
            'credentials-table': `<table cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; background-color: #f9f9f9;">
    <tr>
        <td style="padding: 20px;">
            <table cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                    <td style="text-align: center; padding-bottom: 20px;">
                        <h2 style="color: #333333; font-size: 24px; margin: 0; font-weight: bold;">🎉 Welcome to Our Event Platform!</h2>
                    </td>
                </tr>
                <tr>
                    <td style="color: #555555; font-size: 16px; padding-bottom: 10px;">
                        Dear <strong style="color: #333333;">{{firstName}} {{lastName}}</strong>,
                    </td>
                </tr>
                <tr>
                    <td style="color: #555555; font-size: 16px; padding-bottom: 20px;">
                        Welcome to our event platform! Your account has been created successfully by our admin team. Here are your login credentials:
                    </td>
                </tr>
                <tr>
                    <td style="padding-bottom: 20px;">
                        <table cellpadding="0" cellspacing="0" border="0" width="100%" style="border: 1px solid #b3d9ff; border-radius: 8px;">
                            <tr>
                                <td style="padding: 20px; background-color: #e7f3ff;">
                                    <table cellpadding="0" cellspacing="0" border="0" width="100%">
                                        <tr>
                                            <td style="text-align: center; padding-bottom: 15px;">
                                                <h3 style="margin: 0; color: #004085; font-size: 18px; font-weight: bold;">🔑 Your Login Credentials</h3>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>
                                                <table cellpadding="0" cellspacing="0" border="0" width="100%" style="border: 1px solid #b3d9ff;">
                                                    <tr>
                                                        <td style="padding: 12px; border-bottom: 1px solid #e0e0e0; font-weight: bold; color: #004085; width: 30%; background-color: #ffffff;">Email:</td>
                                                        <td style="padding: 12px; border-bottom: 1px solid #e0e0e0; background-color: #ffffff;">
                                                            <a href="mailto:{{email}}" style="color: #007bff; text-decoration: none;">{{email}}</a>
                                                        </td>
                                                    </tr>
                                                    <tr>
                                                        <td style="padding: 12px; font-weight: bold; color: #004085; background-color: #ffffff;">Password:</td>
                                                        <td style="padding: 12px; background-color: #ffffff;">
                                                            <div style="background-color: #f8f9fa; border: 1px solid #b3d9ff; padding: 8px; border-radius: 4px; font-family: 'Courier New', Courier, monospace; font-size: 14px; letter-spacing: 2px; color: #004085; word-break: break-all;">
                                                                {{password}}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                </table>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
                <tr>
                    <td style="padding-bottom: 20px;">
                        <table cellpadding="0" cellspacing="0" border="0" width="100%" style="border: 1px solid #ffeeba; border-radius: 5px;">
                            <tr>
                                <td style="padding: 15px; background-color: #fff3cd;">
                                    <h4 style="margin: 0 0 10px 0; color: #856404; text-align: center; font-size: 16px; font-weight: bold;">⚠️ Important Security Notice</h4>
                                    <ul style="margin: 10px 0; padding-left: 20px; font-size: 14px; color: #856404;">
                                        <li style="padding-bottom: 5px;">Please change your password after your first login</li>
                                        <li style="padding-bottom: 5px;">Keep your credentials secure and do not share them</li>
                                        <li>Use a strong, unique password for better security</li>
                                    </ul>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
                <tr>
                    <td style="text-align: center; padding-bottom: 30px;">
                        <a href="#" style="background-color: #007bff; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block; font-size: 16px;">Login to Your Account</a>
                    </td>
                </tr>
                <tr>
                    <td style="border-top: 1px solid #dddddd; padding-top: 20px; padding-bottom: 10px;">
                        <p style="color: #777777; font-size: 12px; text-align: center; margin: 0;">
                            If you have any questions or need assistance, please don't hesitate to contact our support team.<br>
                            Best regards,<br>
                            Event Platform Team
                        </p>
                    </td>
                </tr>
                <tr>
                    <td>
                        <p style="color: #999999; font-size: 11px; text-align: center; margin: 0;">
                            This is an automated email. Please do not reply to this message.
                        </p>
                    </td>
                </tr>
            </table>
        </td>
    </tr>
</table>`,
            'info-table': `<table cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; background-color: #ffffff;">
    <tr>
        <td style="padding: 20px;">
            <table cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                    <td style="text-align: center; padding-bottom: 20px;">
                        <h2 style="color: #333333; font-size: 24px; margin: 0; font-weight: bold;">Event Registration Details</h2>
                    </td>
                </tr>
                <tr>
                    <td style="color: #555555; font-size: 16px; padding-bottom: 10px;">
                        Dear {{userName}},
                    </td>
                </tr>
                <tr>
                    <td style="color: #555555; font-size: 16px; padding-bottom: 20px;">
                        Your registration details are as follows:
                    </td>
                </tr>
                <tr>
                    <td style="padding-bottom: 20px;">
                        <table cellpadding="0" cellspacing="0" border="0" width="100%" style="border: 1px solid #dddddd;">
                            <tr>
                                <td style="padding: 12px; border: 1px solid #dddddd; font-weight: bold; width: 40%; color: #333333; background-color: #f8f9fa;">Event Name:</td>
                                <td style="padding: 12px; border: 1px solid #dddddd; color: #555555; background-color: #f8f9fa;">{{eventName}}</td>
                            </tr>
                            <tr>
                                <td style="padding: 12px; border: 1px solid #dddddd; font-weight: bold; color: #333333; background-color: #ffffff;">Registration Date:</td>
                                <td style="padding: 12px; border: 1px solid #dddddd; color: #555555; background-color: #ffffff;">{{registrationDate}}</td>
                            </tr>
                            <tr>
                                <td style="padding: 12px; border: 1px solid #dddddd; font-weight: bold; color: #333333; background-color: #f8f9fa;">Email:</td>
                                <td style="padding: 12px; border: 1px solid #dddddd; color: #555555; background-color: #f8f9fa;">{{email}}</td>
                            </tr>
                            <tr>
                                <td style="padding: 12px; border: 1px solid #dddddd; font-weight: bold; color: #333333; background-color: #ffffff;">Status:</td>
                                <td style="padding: 12px; border: 1px solid #dddddd; color: #28a745; font-weight: bold; background-color: #ffffff;">Confirmed</td>
                            </tr>
                        </table>
                    </td>
                </tr>
                <tr>
                    <td style="text-align: center; padding-top: 20px;">
                        <p style="color: #555555; font-size: 14px; margin: 0;">
                            Thank you for registering!<br>
                            Event Platform Team
                        </p>
                    </td>
                </tr>
            </table>
        </td>
    </tr>
</table>`,
            'otp-table': `<table cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; background-color: #f9f9f9;">
    <tr>
        <td style="padding: 20px;">
            <table cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                    <td style="text-align: center; padding-bottom: 20px;">
                        <h2 style="color: #333333; font-size: 24px; margin: 0; font-weight: bold;">🔐 Email Verification</h2>
                    </td>
                </tr>
                <tr>
                    <td style="color: #555555; font-size: 16px; padding-bottom: 10px;">
                        Hello {{firstName}},
                    </td>
                </tr>
                <tr>
                    <td style="color: #555555; font-size: 16px; padding-bottom: 30px;">
                        Please use the OTP below to verify your email address:
                    </td>
                </tr>
                <tr>
                    <td style="text-align: center; padding-bottom: 30px;">
                        <table cellpadding="0" cellspacing="0" border="0" align="center" style="background-color: #f0f7ff; border: 2px dashed #2d89ef; border-radius: 8px;">
                            <tr>
                                <td style="font-size: 36px; font-weight: bold; letter-spacing: 10px; color: #2d89ef; background-color: #f0f7ff; padding: 20px 30px; font-family: 'Courier New', Courier, monospace;">
                                    {{otp}}
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
                <tr>
                    <td style="padding-bottom: 20px;">
                        <table cellpadding="0" cellspacing="0" border="0" width="100%" style="border: 1px solid #ffeeba;">
                            <tr>
                                <td style="padding: 15px; text-align: center; color: #856404; background-color: #fff3cd;">
                                    <strong style="font-size: 14px;">⚠️ This OTP is valid for 10 minutes only</strong><br>
                                    <span style="font-size: 12px;">If you didn't request this, please ignore this email.</span>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
                <tr>
                    <td style="text-align: center; padding-top: 20px;">
                        <p style="color: #777777; font-size: 12px; margin: 0;">
                            Best regards,<br>
                            Event Platform Team
                        </p>
                    </td>
                </tr>
            </table>
        </td>
    </tr>
</table>`
        };
        return templateBodies[templateKey] || '';
    };

    const templateGallery = [
        {
            id: 'blank',
            name: 'Blank Template',
            description: 'Start from scratch',
            icon: 'feather icon-file',
            type: 'custom',
            subject: '',
            body: '',
            preview: '#f8f9fa'
        },
        {
            id: 'welcome-credentials',
            name: 'Welcome with Credentials',
            description: 'User registration with login details',
            icon: 'feather icon-lock',
            type: 'welcome',
            subject: 'Welcome to Our Event Platform!',
            templateKey: 'credentials-table'
        },
        {
            id: 'welcome-otp',
            name: 'Welcome with OTP',
            description: 'Email verification template',
            icon: 'feather icon-shield',
            type: 'welcome',
            subject: 'Verify Your Email Address',
            templateKey: 'otp-table'
        },
        {
            id: 'event-registration',
            name: 'Event Registration',
            description: 'Event registration confirmation',
            icon: 'feather icon-calendar',
            type: 'event-registration',
            subject: 'Event Registration Confirmed',
            templateKey: 'info-table'
        },
        {
            id: 'password-reset',
            name: 'Password Reset',
            description: 'Password reset OTP email',
            icon: 'feather icon-key',
            type: 'password-reset',
            subject: 'Reset Your Password',
            templateKey: 'otp-table'
        },
        {
            id: 'event-reminder',
            name: 'Event Reminder',
            description: 'Upcoming event notification',
            icon: 'feather icon-bell',
            type: 'event-reminder',
            subject: 'Reminder: {{eventName}} is Coming Soon',
            body: `<table cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; background-color: #ffffff;">
    <tr>
        <td style="padding: 20px;">
            <table cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                    <td style="text-align: center; padding-bottom: 20px;">
                        <h2 style="color: #333333; font-size: 24px; margin: 0; font-weight: bold;">📅 Event Reminder</h2>
                    </td>
                </tr>
                <tr>
                    <td style="color: #555555; font-size: 16px; padding-bottom: 10px;">
                        Hello {{userName}},
                    </td>
                </tr>
                <tr>
                    <td style="color: #555555; font-size: 16px; padding-bottom: 20px;">
                        This is a reminder that <strong>{{eventName}}</strong> is coming soon!
                    </td>
                </tr>
                <tr>
                    <td style="padding-bottom: 20px;">
                        <table cellpadding="0" cellspacing="0" border="0" width="100%" style="border: 1px solid #b3d9ff; border-radius: 8px;">
                            <tr>
                                <td style="padding: 20px; background-color: #e7f3ff;">
                                    <p style="margin: 0; color: #004085; font-size: 16px; font-weight: bold;">Event: {{eventName}}</p>
                                    <p style="margin: 10px 0 0 0; color: #004085; font-size: 14px;">Date: {{eventDate}}</p>
                                    <p style="margin: 10px 0 0 0; color: #004085; font-size: 14px;">Location: {{eventLocation}}</p>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
                <tr>
                    <td style="text-align: center; padding-bottom: 30px;">
                        <a href="#" style="background-color: #007bff; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">View Event Details</a>
                    </td>
                </tr>
            </table>
        </td>
    </tr>
</table>`,
            preview: '#e7f3ff'
        },
        {
            id: 'notification',
            name: 'General Notification',
            description: 'Simple notification template',
            icon: 'feather icon-mail',
            type: 'notification',
            subject: 'Notification: {{title}}',
            body: `<table cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; background-color: #ffffff;">
    <tr>
        <td style="padding: 20px;">
            <table cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                    <td style="padding-bottom: 20px;">
                        <h2 style="color: #333333; font-size: 20px; margin: 0; font-weight: bold;">{{title}}</h2>
                    </td>
                </tr>
                <tr>
                    <td style="color: #555555; font-size: 16px; padding-bottom: 20px;">
                        {{message}}
                    </td>
                </tr>
                <tr>
                    <td style="border-top: 1px solid #dddddd; padding-top: 20px;">
                        <p style="color: #777777; font-size: 12px; margin: 0;">
                            Best regards,<br>
                            Event Platform Team
                        </p>
                    </td>
                </tr>
            </table>
        </td>
    </tr>
</table>`,
            preview: '#f8f9fa'
        }
    ];

    const handleSelectTemplate = (template) => {
        let body = '';
        
        if (template.templateKey) {
            body = getTemplateBody(template.templateKey);
        } else if (template.body) {
            body = template.body;
        }

        setSelectedTemplate(null);
        setFormData({
            name: template.name,
            subject: template.subject,
            body: body,
            type: template.type,
            isActive: true,
            variables: ''
        });
        setShowTemplateGallery(false);
        setShowModal(true);
        toast.success(`${template.name} template loaded!`);
    };

    const handleEdit = (template) => {
        setSelectedTemplate(template);
        setFormData({
            name: template.name,
            subject: template.subject,
            body: template.body,
            type: template.type,
            isActive: template.isActive,
            variables: template.variables || ''
        });
        setShowModal(true);
    };

    const handleDelete = (template) => {
        setSelectedTemplate(template);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        try {
            const response = await axiosInstance.delete(`/email-templates/delete/${selectedTemplate.id}`);
            if (response.data.success) {
                toast.success('Email template deleted successfully');
                fetchTemplates();
                setShowDeleteModal(false);
                setSelectedTemplate(null);
            }
        } catch (error) {
            toast.error('Failed to delete email template');
            console.error(error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (selectedTemplate) {
                // Update
                const response = await axiosInstance.put(
                    `/email-templates/update/${selectedTemplate.id}`,
                    formData
                );
                if (response.data.success) {
                    toast.success('Email template updated successfully');
                    setShowModal(false);
                    fetchTemplates();
                }
            } else {
                // Create
                const response = await axiosInstance.post('/email-templates/create', formData);
                if (response.data.success) {
                    toast.success('Email template created successfully');
                    setShowModal(false);
                    fetchTemplates();
                }
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to save email template');
            console.error(error);
        }
    };

    const getTypeBadgeVariant = (type) => {
        const variants = {
            welcome: 'success',
            'password-reset': 'warning',
            'event-registration': 'info',
            'event-reminder': 'primary',
            notification: 'secondary',
            custom: 'dark'
        };
        return variants[type] || 'dark';
    };

    const formatType = (type) => {
        return type.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    };

    const handlePreview = async (template) => {
        try {
            // Use sample data for preview
            const sampleVariables = {
                userName: 'John Doe',
                firstName: 'John',
                lastName: 'Doe',
                email: 'john.doe@example.com',
                otp: '123456',
                eventName: 'Tech Conference 2024',
                password: 'TempPass123!'
            };

            const response = await axiosInstance.post('/email-templates/render', {
                templateId: template.id,
                variables: sampleVariables
            });

            if (response.data.success) {
                setPreviewData({
                    subject: response.data.data.subject,
                    body: response.data.data.body
                });
                setShowPreviewModal(true);
            }
        } catch (error) {
            toast.error('Failed to preview template');
            console.error(error);
        }
    };

    const loadTableTemplate = (templateName) => {
        const templates = {
            'credentials-table': getTemplateBody('credentials-table'),
            'info-table': getTemplateBody('info-table'),
            'otp-table': getTemplateBody('otp-table')
        };

        if (templates[templateName]) {
            setFormData({ ...formData, body: templates[templateName] });
            toast.success('Table template loaded successfully!');
        }
    };

    const loadTemplateExample = (type) => {
        let exampleBody = '';
        
        if (type === 'welcome') {
            // Use credentials-table template which is Gmail-compatible
            loadTableTemplate('credentials-table');
            return;
        } else if (type === 'password-reset') {
            exampleBody = `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px;">
    <h2 style="color: #333;">Password Reset Request</h2>
    <p>Hello {{userName}},</p>
    <p>You requested to reset your password. Use this OTP: <strong>{{otp}}</strong></p>
</div>`;
        }

        if (exampleBody) {
            setFormData({ ...formData, body: exampleBody });
            toast.info('Template example loaded! You can customize it.');
        }
    };

    return (
        <>
            <Row>
                <Col>
                    <Card>
                        <Card.Header className="d-flex justify-content-between align-items-center">
                            <Card.Title as="h5">Email Templates</Card.Title>
                            <Button variant="primary" onClick={handleCreate}>
                                <i className="feather icon-plus mr-2" />
                                Create Template
                            </Button>
                        </Card.Header>
                        <Card.Body>
                            {loading ? (
                                <div className="text-center py-5">
                                    <div className="spinner-border" role="status">
                                        <span className="sr-only">Loading...</span>
                                    </div>
                                </div>
                            ) : (
                                <Table responsive>
                                    <thead>
                                        <tr>
                                            <th>Name</th>
                                            <th>Subject</th>
                                            <th>Type</th>
                                            <th>Status</th>
                                            <th>Created</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {templates.length === 0 ? (
                                            <tr>
                                                <td colSpan="6" className="text-center py-4">
                                                    No email templates found
                                                </td>
                                            </tr>
                                        ) : (
                                            templates.map((template) => (
                                                <tr key={template.id}>
                                                    <td>{template.name}</td>
                                                    <td>{template.subject}</td>
                                                    <td>
                                                        <Badge variant={getTypeBadgeVariant(template.type)}>
                                                            {formatType(template.type)}
                                                        </Badge>
                                                    </td>
                                                    <td>
                                                        <Badge variant={template.isActive ? 'success' : 'secondary'}>
                                                            {template.isActive ? 'Active' : 'Inactive'}
                                                        </Badge>
                                                    </td>
                                                    <td>{new Date(template.createdAt).toLocaleDateString()}</td>
                                                    <td>
                                                        <Button
                                                            variant="secondary"
                                                            size="sm"
                                                            className="mr-2"
                                                            onClick={() => handlePreview(template)}
                                                            title="Preview Template"
                                                        >
                                                            <i className="feather icon-eye" />
                                                        </Button>
                                                        <Button
                                                            variant="info"
                                                            size="sm"
                                                            className="mr-2"
                                                            onClick={() => handleEdit(template)}
                                                        >
                                                            <i className="feather icon-edit" />
                                                        </Button>
                                                        <Button
                                                            variant="danger"
                                                            size="sm"
                                                            onClick={() => handleDelete(template)}
                                                        >
                                                            <i className="feather icon-trash-2" />
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </Table>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Create/Edit Modal */}
            <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>
                        {selectedTemplate ? 'Edit Email Template' : 'Create Email Template'}
                    </Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleSubmit}>
                    <Modal.Body>
                        <Form.Group className="mb-3">
                            <Form.Label>Template Name *</Form.Label>
                            <Form.Control
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                                placeholder="e.g., Welcome Email"
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Type *</Form.Label>
                            <div className="d-flex align-items-center gap-2">
                                <Form.Control
                                    as="select"
                                    value={formData.type}
                                    onChange={(e) => {
                                        setFormData({ ...formData, type: e.target.value });
                                        if (!formData.body && e.target.value !== 'custom') {
                                            loadTemplateExample(e.target.value);
                                        }
                                    }}
                                    required
                                    style={{ flex: 1 }}
                                >
                                    <option value="welcome">Welcome</option>
                                    <option value="password-reset">Password Reset</option>
                                    <option value="event-registration">Event Registration</option>
                                    <option value="event-reminder">Event Reminder</option>
                                    <option value="notification">Notification</option>
                                    <option value="custom">Custom</option>
                                </Form.Control>
                                {!selectedTemplate && formData.type !== 'custom' && (
                                    <Button
                                        variant="outline-primary"
                                        size="sm"
                                        onClick={() => loadTemplateExample(formData.type)}
                                        title="Load Example Template"
                                    >
                                        <i className="feather icon-file-text mr-1" />
                                        Load Example
                                    </Button>
                                )}
                            </div>
                            <Form.Text className="text-muted">
                                Select template type. Click "Load Example" to use a pre-designed template.
                            </Form.Text>
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Subject *</Form.Label>
                            <Form.Control
                                type="text"
                                value={formData.subject}
                                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                required
                                placeholder="e.g., Welcome to {{eventName}}"
                            />
                            <Form.Text className="text-muted">
                                Use {'{{'}variableName{'}}'} for dynamic content
                            </Form.Text>
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Email Body *</Form.Label>
                            <div className="mb-2">
                                <div className="alert alert-warning mb-2" role="alert">
                                    <strong>⚠️ Important for Gmail/Email Clients:</strong>
                                    <ul className="mb-0 mt-2" style={{ fontSize: '12px', paddingLeft: '20px' }}>
                                        <li><strong>Always use INLINE styles</strong> - Gmail strips out &lt;style&gt; tags and external CSS</li>
                                        <li>Use <code>style="property: value;"</code> directly on HTML elements</li>
                                        <li>Avoid: flexbox, grid, position: absolute, background-image URLs</li>
                                        <li>Use: tables for layout, inline styles, basic CSS properties only</li>
                                    </ul>
                                </div>
                                <small className="text-muted d-block mb-2">
                                    <strong>💡 Quick Templates:</strong> Choose a pre-built template that works in Gmail, Outlook, and all email clients:
                                </small>
                                <div className="d-flex flex-wrap gap-2 mb-2">
                                    <Button
                                        variant="outline-primary"
                                        size="sm"
                                        onClick={() => loadTableTemplate('credentials-table')}
                                    >
                                        <i className="feather icon-lock mr-1" />
                                        Credentials Table
                                    </Button>
                                    <Button
                                        variant="outline-info"
                                        size="sm"
                                        onClick={() => loadTableTemplate('info-table')}
                                    >
                                        <i className="feather icon-info mr-1" />
                                        Info Table
                                    </Button>
                                    <Button
                                        variant="outline-warning"
                                        size="sm"
                                        onClick={() => loadTableTemplate('otp-table')}
                                    >
                                        <i className="feather icon-shield mr-1" />
                                        OTP Table
                                    </Button>
                                </div>
                                <small className="text-muted d-block">
                                    <strong>Or:</strong> Use the toolbar's <strong>"Insert Table"</strong> button (📊) to create custom tables. 
                                    <strong> Always use inline styles!</strong>
                                </small>
                            </div>
                            <SettingsEditor
                                data={formData.body}
                                onChange={(event, editor) => {
                                    setFormData({ ...formData, body: editor.getData() });
                                }}
                                placeholder="Enter email body content. Use {{variableName}} for dynamic content..."
                            />
                            <Form.Text className="text-muted" style={{ marginTop: '10px', display: 'block' }}>
                                <strong>✅ Email-Compatible CSS Properties:</strong>
                                <br />
                                <code>color</code>, <code>background-color</code>, <code>font-size</code>, <code>font-family</code>, <code>font-weight</code>, 
                                <code>text-align</code>, <code>padding</code>, <code>margin</code>, <code>border</code>, <code>border-radius</code>, 
                                <code>width</code>, <code>height</code>, <code>display: inline-block</code>
                                <br />
                                <strong>❌ NOT Supported in Gmail:</strong> <code>flexbox</code>, <code>grid</code>, <code>position: absolute</code>, 
                                <code>background-image</code> (URLs), <code>transform</code>, <code>box-shadow</code> (limited)
                                <br />
                                <strong>Variables:</strong> Use {'{{'}variableName{'}}'} for dynamic content
                            </Form.Text>
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Available Variables (JSON)</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={3}
                                value={formData.variables}
                                onChange={(e) => setFormData({ ...formData, variables: e.target.value })}
                                placeholder='{"userName": "User Name", "eventName": "Event Name"}'
                            />
                            <Form.Text className="text-muted">
                                Optional: JSON object describing available variables
                            </Form.Text>
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Check
                                type="switch"
                                id="isActive"
                                label="Active"
                                checked={formData.isActive}
                                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                            />
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowModal(false)}>
                            Cancel
                        </Button>
                        <Button variant="primary" type="submit">
                            {selectedTemplate ? 'Update' : 'Create'}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            {/* Preview Modal */}
            <Modal show={showPreviewModal} onHide={() => setShowPreviewModal(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>Email Template Preview</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {previewData && (
                        <>
                            <div className="mb-3">
                                <strong>Subject:</strong> {previewData.subject}
                            </div>
                            <div 
                                style={{
                                    border: '1px solid #ddd',
                                    borderRadius: '8px',
                                    padding: '20px',
                                    backgroundColor: '#f9f9f9',
                                    maxHeight: '600px',
                                    overflow: 'auto'
                                }}
                                dangerouslySetInnerHTML={{ __html: previewData.body }}
                            />
                        </>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowPreviewModal(false)}>
                        Close
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Template Gallery Modal */}
            <Modal show={showTemplateGallery} onHide={() => setShowTemplateGallery(false)} size="xl">
                <Modal.Header closeButton>
                    <Modal.Title>Choose Email Template</Modal.Title>
                </Modal.Header>
                <Modal.Body style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                    <div className="mb-3">
                        <p className="text-muted mb-0">Select a template to get started. You can customize it after selection.</p>
                    </div>
                    <Row>
                        {templateGallery.map((template) => (
                            <Col md={4} sm={6} key={template.id} className="mb-3">
                                <Card 
                                    className="h-100 template-card"
                                    style={{ 
                                        cursor: 'pointer',
                                        transition: 'all 0.3s ease',
                                        border: '2px solid #e9ecef'
                                    }}
                                    onClick={() => handleSelectTemplate(template)}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = 'translateY(-5px)';
                                        e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.15)';
                                        e.currentTarget.style.borderColor = '#667eea';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = 'none';
                                        e.currentTarget.style.borderColor = '#e9ecef';
                                    }}
                                >
                                    <div 
                                        style={{ 
                                            height: '150px',
                                            backgroundColor: template.preview,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            borderTopLeftRadius: '4px',
                                            borderTopRightRadius: '4px'
                                        }}
                                    >
                                        <i className={template.icon} style={{ fontSize: '48px', color: '#667eea' }} />
                                    </div>
                                    <Card.Body>
                                        <Card.Title style={{ fontSize: '16px', marginBottom: '8px' }}>
                                            {template.name}
                                        </Card.Title>
                                        <Card.Text style={{ fontSize: '12px', color: '#6c757d', marginBottom: '10px' }}>
                                            {template.description}
                                        </Card.Text>
                                        <Badge variant="secondary" style={{ fontSize: '11px' }}>
                                            {template.type.replace('-', ' ').toUpperCase()}
                                        </Badge>
                                    </Card.Body>
                                </Card>
                            </Col>
                        ))}
                    </Row>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowTemplateGallery(false)}>
                        Cancel
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Delete Confirmation Modal */}
            <DeleteConfirmationModal
                show={showDeleteModal}
                onHide={() => {
                    setShowDeleteModal(false);
                    setSelectedTemplate(null);
                }}
                onConfirm={confirmDelete}
                title="Delete Email Template"
                message={`Are you sure you want to delete "${selectedTemplate?.name}"? This action cannot be undone.`}
            />
        </>
    );
};

export default EmailTemplates;

