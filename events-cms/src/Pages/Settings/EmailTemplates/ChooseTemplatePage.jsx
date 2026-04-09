import React, { useState } from 'react';
import { Button, Row, Col, Container, Card, Badge, Modal } from 'react-bootstrap';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { SETTINGS_PATHS } from '../../../utils/constants';
import useTableNavigation from '../../../hooks/useTableNavigation';
import { getTemplateBody } from './components/TemplateBodies';
import { welcomeTemplates } from './components/WelcomeTemplates';
import { passwordResetTemplates } from './components/PasswordResetTemplates';
import { eventRegistrationTemplates } from './components/EventRegistrationTemplates';
import { eventReminderTemplates } from './components/EventReminderTemplates';
import { notificationTemplates } from './components/NotificationTemplates';

const ChooseTemplatePage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const previousPageRef = React.useRef(null);
    const [showPreviewModal, setShowPreviewModal] = useState(false);
    const [currentPreviewData, setCurrentPreviewData] = useState(null);
    const [showVariationsModal, setShowVariationsModal] = useState(false);
    const [currentTemplateVariations, setCurrentTemplateVariations] = useState([]);
    const [selectedTemplateType, setSelectedTemplateType] = useState(null);

    const { handleBack: handleBackNavigation } = useTableNavigation({
        tableRef: null,
        listPath: SETTINGS_PATHS.EMAIL_TEMPLATES,
        viewPath: SETTINGS_PATHS.VIEW_EMAIL_TEMPLATE,
        editPath: SETTINGS_PATHS.EDIT_EMAIL_TEMPLATE,
        addPath: SETTINGS_PATHS.ADD_EMAIL_TEMPLATE
    });

    React.useEffect(() => {
        const params = new URLSearchParams(location.search || window.location.search);
        const pageParam = params.get('page');
        const returnPath = params.get('return');
        if (pageParam) {
            previousPageRef.current = parseInt(pageParam, 10);
        } else if (location.state?.page) {
            previousPageRef.current = location.state.page;
        }
        if (returnPath) {
            previousPageRef.current = { returnPath };
        }
    }, [location.search, location.state]);

    // Template variations grouped by type - imported from separate components
    const templateVariations = {
        welcome: welcomeTemplates,
        'password-reset': passwordResetTemplates,
        'event-registration': eventRegistrationTemplates,
        'event-reminder': eventReminderTemplates,
        notification: notificationTemplates
    };

    // Main template gallery - showing first variation of each type
    const templateGallery = [
        {
            id: 'blank',
            name: 'Blank Template',
            description: 'Start from scratch',
            icon: 'feather icon-file',
            type: 'custom',
            subject: '',
            body: '',
            preview: '#f8f9fa',
            hasVariations: false
        },
        {
            ...templateVariations.welcome[0],
            hasVariations: true,
            variationCount: templateVariations.welcome.length
        },
        {
            ...templateVariations['password-reset'][0],
            hasVariations: true,
            variationCount: templateVariations['password-reset'].length
        },
        {
            ...templateVariations['event-registration'][0],
            hasVariations: true,
            variationCount: templateVariations['event-registration'].length
        },
        {
            ...templateVariations['event-reminder'][0],
            hasVariations: true,
            variationCount: templateVariations['event-reminder'].length
        },
        {
            ...templateVariations.notification[0],
            hasVariations: true,
            variationCount: templateVariations.notification.length
        }
    ];

    const handleSelectTemplate = (template) => {
        let body = '';
        
        if (template.templateKey) {
            body = getTemplateBody(template.templateKey);
        } else if (template.body) {
            body = template.body;
        }

        const templateData = {
            name: template.name,
            subject: template.subject,
            body: body,
            type: template.type,
            isActive: true,
            variables: ''
        };

        // Navigate back to add page with template data
        const returnPath = location.state?.returnPath || SETTINGS_PATHS.ADD_EMAIL_TEMPLATE;
        navigate(returnPath, {
            state: {
                templateData: templateData,
                page: previousPageRef.current
            }
        });
    };

    const handlePreviewClick = (template) => {
        let previewBody = '';
        if (template.templateKey) {
            previewBody = getTemplateBody(template.templateKey);
        } else if (template.body) {
            previewBody = template.body;
        }

        // Replace variables with sample data for preview
        const samplePreview = previewBody
            .replace(/\{\{firstName\}\}/g, 'John')
            .replace(/\{\{lastName\}\}/g, 'Doe')
            .replace(/\{\{userName\}\}/g, 'John Doe')
            .replace(/\{\{email\}\}/g, 'john.doe@example.com')
            .replace(/\{\{password\}\}/g, 'TempPass123!')
            .replace(/\{\{otp\}\}/g, '123456')
            .replace(/\{\{eventName\}\}/g, 'Tech Conference 2024')
            .replace(/\{\{eventDate\}\}/g, '15 Dec 2024')
            .replace(/\{\{eventLocation\}\}/g, 'New York')
            .replace(/\{\{title\}\}/g, 'Important Update')
            .replace(/\{\{message\}\}/g, 'This is a sample notification message.')
            .replace(/\{\{registrationDate\}\}/g, '10 Dec 2024');

        setCurrentPreviewData({
            name: template.name,
            subject: template.subject,
            body: samplePreview
        });
        setShowPreviewModal(true);
    };

    const handleCancel = () => {
        const returnPath = location.state?.returnPath || SETTINGS_PATHS.ADD_EMAIL_TEMPLATE;
        navigate(returnPath);
    };

    const handleViewMore = (templateType) => {
        const variations = templateVariations[templateType] || [];
        setCurrentTemplateVariations(variations.slice(0, 5)); // Show up to 5 variations
        setSelectedTemplateType(templateType);
        setShowVariationsModal(true);
    };

    return (
        <Container fluid className="mt-4">
            <Row>
                <Col>
                    <Card>
                        <Card.Header className="d-flex justify-content-between align-items-center">
                            <Card.Title as="h5">Choose Email Template</Card.Title>
                            <Button variant="secondary" onClick={handleCancel}>
                                <i style={{ marginRight: '10px' }} className="fas fa-arrow-left me-2"></i>
                                Back
                            </Button>
                        </Card.Header>
                        <Card.Body>
                            <div className="mb-3">
                                <p className="text-muted mb-0">Select a template to see preview and apply it to your form. You can customize it after selection.</p>
                            </div>
                            <Row>
                                {templateGallery.map((template) => {
                                    let previewBody = '';
                                    if (template.templateKey) {
                                        previewBody = getTemplateBody(template.templateKey);
                                    } else if (template.body) {
                                        previewBody = template.body;
                                    }
                                    
                                    // Replace variables with sample data for preview
                                    const samplePreview = previewBody
                                        .replace(/\{\{firstName\}\}/g, 'John')
                                        .replace(/\{\{lastName\}\}/g, 'Doe')
                                        .replace(/\{\{userName\}\}/g, 'John Doe')
                                        .replace(/\{\{email\}\}/g, 'john.doe@example.com')
                                        .replace(/\{\{password\}\}/g, 'TempPass123!')
                                        .replace(/\{\{otp\}\}/g, '123456')
                                        .replace(/\{\{eventName\}\}/g, 'Tech Conference 2024')
                                        .replace(/\{\{eventDate\}\}/g, '15 Dec 2024')
                                        .replace(/\{\{eventLocation\}\}/g, 'New York')
                                        .replace(/\{\{title\}\}/g, 'Important Update')
                                        .replace(/\{\{message\}\}/g, 'This is a sample notification message.')
                                        .replace(/\{\{registrationDate\}\}/g, '10 Dec 2024');

                                    return (
                                        <Col md={6} sm={12} key={template.id} className="mb-4">
                                            <Card 
                                                className="h-100 template-card"
                                                style={{ 
                                                    cursor: 'pointer',
                                                    transition: 'all 0.3s ease',
                                                    border: '2px solid #e9ecef'
                                                }}
                                                onClick={() => handlePreviewClick(template)}
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
                                                <Card.Header style={{ backgroundColor: template.preview, padding: '15px' }}>
                                                    <div className="d-flex justify-content-between align-items-center">
                                                        <div>
                                                            <Card.Title style={{ fontSize: '16px', margin: 0, color: '#333' }}>
                                                                {template.name}
                                                            </Card.Title>
                                                            <Card.Text style={{ fontSize: '12px', color: '#6c757d', margin: '5px 0 0 0' }}>
                                                                {template.description}
                                                            </Card.Text>
                                                        </div>
                                                        <Badge variant="secondary" style={{ fontSize: '11px' }}>
                                                            {template.type.replace('-', ' ').toUpperCase()}
                                                        </Badge>
                                                    </div>
                                                </Card.Header>
                                                <Card.Body style={{ padding: '15px', display: 'flex', flexDirection: 'column', height: '100%' }}>
                                                    {previewBody ? (
                                                        <div 
                                                            style={{
                                                                border: '1px solid #ddd',
                                                                borderRadius: '4px',
                                                                overflow: 'hidden',
                                                                height: '350px',
                                                                backgroundColor: '#fff',
                                                                position: 'relative',
                                                                padding: '8px'
                                                            }}
                                                        >
                                                            <div 
                                                                style={{
                                                                    transform: 'scale(0.45)',
                                                                    transformOrigin: 'top left',
                                                                    width: '222.22%',
                                                                    height: '222.22%',
                                                                    position: 'absolute',
                                                                    top: '0',
                                                                    left: '0'
                                                                }}
                                                                dangerouslySetInnerHTML={{ __html: samplePreview }}
                                                            />
                                                        </div>
                                                    ) : (
                                                        <div 
                                                            style={{
                                                                height: '350px',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                backgroundColor: template.preview,
                                                                borderRadius: '4px'
                                                            }}
                                                        >
                                                            <i className={template.icon} style={{ fontSize: '48px', color: '#667eea' }} />
                                                        </div>
                                                    )}
                                                    <div className="mt-3 text-center" style={{ marginTop: '15px', flexShrink: 0 }}>
                                                        <div className="d-flex gap-2 justify-content-center">
                                                            <Button 
                                                                variant="primary" 
                                                                size="sm"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleSelectTemplate(template);
                                                                }}
                                                            >
                                                                <i className="feather icon-check mr-1" />
                                                                Use This Template
                                                            </Button>
                                                            {template.hasVariations && template.variationCount > 1 && (
                                                                <Button 
                                                                    variant="outline-info" 
                                                                    size="sm"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleViewMore(template.type);
                                                                    }}
                                                                >
                                                                    <i className="feather icon-eye mr-1" />
                                                                    View More ({template.variationCount})
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </Card.Body>
                                            </Card>
                                        </Col>
                                    );
                                })}
                            </Row>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Full Preview Modal */}
            <Modal show={showPreviewModal} onHide={() => setShowPreviewModal(false)} size="lg" centered>
                <Modal.Header closeButton>
                    <Modal.Title>
                        {currentPreviewData?.name && `${currentPreviewData.name} - `}Template Preview
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {currentPreviewData && (
                        <>
                            <div className="mb-3">
                                <strong>Subject:</strong> {currentPreviewData.subject || 'No subject'}
                            </div>
                            <div 
                                style={{
                                    border: '1px solid #ddd',
                                    borderRadius: '8px',
                                    padding: '20px',
                                    backgroundColor: '#f9f9f9',
                                    maxHeight: '70vh',
                                    overflow: 'auto'
                                }}
                                dangerouslySetInnerHTML={{ __html: currentPreviewData.body }}
                            />
                        </>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowPreviewModal(false)}>
                        Close
                    </Button>
                    {currentPreviewData && (
                        <Button 
                            variant="primary" 
                            onClick={() => {
                                const template = templateGallery.find(t => t.name === currentPreviewData.name);
                                if (template) {
                                    setShowPreviewModal(false);
                                    handleSelectTemplate(template);
                                }
                            }}
                        >
                            <i className="feather icon-check mr-1" />
                            Use This Template
                        </Button>
                    )}
                </Modal.Footer>
            </Modal>

            {/* Template Variations Modal */}
            <Modal show={showVariationsModal} onHide={() => setShowVariationsModal(false)} size="xl" centered>
                <Modal.Header closeButton>
                    <Modal.Title>
                        {selectedTemplateType && `${selectedTemplateType.charAt(0).toUpperCase() + selectedTemplateType.slice(1).replace('-', ' ')} Template Variations`}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                    <Row>
                        {currentTemplateVariations.map((variation) => {
                            let previewBody = '';
                            if (variation.templateKey) {
                                previewBody = getTemplateBody(variation.templateKey);
                            } else if (variation.body) {
                                previewBody = variation.body;
                            }
                            
                            const samplePreview = previewBody
                                .replace(/\{\{firstName\}\}/g, 'John')
                                .replace(/\{\{lastName\}\}/g, 'Doe')
                                .replace(/\{\{userName\}\}/g, 'John Doe')
                                .replace(/\{\{email\}\}/g, 'john.doe@example.com')
                                .replace(/\{\{password\}\}/g, 'TempPass123!')
                                .replace(/\{\{otp\}\}/g, '123456')
                                .replace(/\{\{eventName\}\}/g, 'Tech Conference 2024')
                                .replace(/\{\{eventDate\}\}/g, '15 Dec 2024')
                                .replace(/\{\{eventLocation\}\}/g, 'New York')
                                .replace(/\{\{title\}\}/g, 'Important Update')
                                .replace(/\{\{message\}\}/g, 'This is a sample notification message.')
                                .replace(/\{\{registrationDate\}\}/g, '10 Dec 2024')
                                .replace(/\{\{resetLink\}\}/g, '#');

                            return (
                                <Col md={6} sm={12} key={variation.id} className="mb-4">
                                    <Card 
                                        className="h-100"
                                        style={{ 
                                            cursor: 'pointer',
                                            transition: 'all 0.3s ease',
                                            border: '2px solid #e9ecef'
                                        }}
                                        onClick={() => {
                                            setShowVariationsModal(false);
                                            handleSelectTemplate(variation);
                                        }}
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
                                        <Card.Header style={{ backgroundColor: variation.preview || '#f8f9fa', padding: '15px' }}>
                                            <div className="d-flex justify-content-between align-items-center">
                                                <div>
                                                    <Card.Title style={{ fontSize: '16px', margin: 0, color: '#333' }}>
                                                        {variation.name}
                                                    </Card.Title>
                                                    <Card.Text style={{ fontSize: '12px', color: '#6c757d', margin: '5px 0 0 0' }}>
                                                        {variation.description}
                                                    </Card.Text>
                                                </div>
                                            </div>
                                        </Card.Header>
                                        <Card.Body style={{ padding: '15px', display: 'flex', flexDirection: 'column', height: '100%' }}>
                                            {previewBody ? (
                                                <div 
                                                    style={{
                                                        border: '1px solid #ddd',
                                                        borderRadius: '4px',
                                                        overflow: 'hidden',
                                                        height: '300px',
                                                        backgroundColor: '#fff',
                                                        position: 'relative',
                                                        padding: '8px'
                                                    }}
                                                >
                                                    <div 
                                                        style={{
                                                            transform: 'scale(0.4)',
                                                            transformOrigin: 'top left',
                                                            width: '250%',
                                                            height: '250%',
                                                            position: 'absolute',
                                                            top: '0',
                                                            left: '0'
                                                        }}
                                                        dangerouslySetInnerHTML={{ __html: samplePreview }}
                                                    />
                                                </div>
                                            ) : (
                                                <div 
                                                    style={{
                                                        height: '300px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        backgroundColor: variation.preview || '#f8f9fa',
                                                        borderRadius: '4px'
                                                    }}
                                                >
                                                    <i className={variation.icon} style={{ fontSize: '48px', color: '#667eea' }} />
                                                </div>
                                            )}
                                            <div className="mt-3 text-center" style={{ marginTop: '15px', flexShrink: 0 }}>
                                                <Button 
                                                    variant="primary" 
                                                    size="sm"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setShowVariationsModal(false);
                                                        handleSelectTemplate(variation);
                                                    }}
                                                >
                                                    <i className="feather icon-check mr-1" />
                                                    Use This Template
                                                </Button>
                                            </div>
                                        </Card.Body>
                                    </Card>
                                </Col>
                            );
                        })}
                    </Row>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowVariationsModal(false)}>
                        Close
                    </Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
};

export default ChooseTemplatePage;

