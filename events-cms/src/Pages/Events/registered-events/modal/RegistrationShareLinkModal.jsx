import React from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import { toast } from 'react-toastify';

const RegistrationShareLinkModal = ({ show, onHide, shareUrl, accessCode }) => {
    const handleCopy = () => {
        if (shareUrl) {
            navigator.clipboard.writeText(shareUrl);
            toast.success('Link copied to clipboard!');
        }
    };

    const handleCopyCode = () => {
        if (accessCode) {
            navigator.clipboard.writeText(accessCode);
            toast.success('Access code copied!');
        }
    };

    const handleOpenLink = () => {
        if (shareUrl) {
            window.open(shareUrl, '_blank');
        }
    };

    return (
        <Modal show={show} onHide={onHide} centered size="lg">
            <Modal.Header style={{ backgroundColor: '#4680ff', color: 'white', position: 'relative' }}>
                <Modal.Title>Registration List Share Link</Modal.Title>
                <button
                    type="button"
                    onClick={onHide}
                    style={{
                        position: 'absolute',
                        top: '15px',
                        right: '15px',
                        width: '30px',
                        height: '30px',
                        backgroundColor: 'transparent',
                        border: 'none',
                        fontSize: '18px',
                        color: 'white',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '50%',
                        transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                        e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
                    }}
                    onMouseLeave={(e) => {
                        e.target.style.backgroundColor = 'transparent';
                    }}
                >
                    <i className="feather icon-x" style={{ fontSize: '16px' }}></i>
                </button>
            </Modal.Header>
            <Modal.Body>
                <Form.Group className="mb-3">
                    <Form.Label>Share Link URL</Form.Label>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                        <Form.Control
                            type="text"
                            value={shareUrl || ''}
                            readOnly
                            className="bg-light"
                            style={{ flex: 1 }}
                        />
                        <Button variant="primary" onClick={handleCopy} style={{ whiteSpace: 'nowrap' }}>
                            <i className="feather icon-copy mr-1"></i> Copy
                        </Button>
                    </div>
                    <Form.Text className="text-muted">
                        Share this link with the recipient. They will need the access code below to open the page.
                    </Form.Text>
                </Form.Group>
                {accessCode && (
                    <Form.Group className="mb-3">
                        <Form.Label>Access code (share with recipient)</Form.Label>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                            <Form.Control
                                type="text"
                                value={accessCode}
                                readOnly
                                className="bg-light font-monospace"
                                style={{ flex: 1, letterSpacing: '0.2em', textTransform: 'uppercase' }}
                            />
                            <Button variant="outline-primary" onClick={handleCopyCode} style={{ whiteSpace: 'nowrap' }}>
                                <i className="feather icon-copy mr-1"></i> Copy code
                            </Button>
                        </div>
                        <Form.Text className="text-muted">
                            Recipient must enter this code once to access the registration list and check-in pages. It is saved in their browser.
                        </Form.Text>
                    </Form.Group>
                )}
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onHide}>Close</Button>
                <Button variant="primary" onClick={handleOpenLink}>
                    <i className="feather icon-external-link mr-1"></i> Open Link
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default RegistrationShareLinkModal;
