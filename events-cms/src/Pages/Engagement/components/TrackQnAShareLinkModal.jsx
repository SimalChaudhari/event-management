import React from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import { toast } from 'react-toastify';

const TrackQnAShareLinkModal = ({ 
    show, 
    onHide, 
    trackShareUrl
}) => {
    const handleCopy = () => {
        if (trackShareUrl) {
            navigator.clipboard.writeText(trackShareUrl);
            toast.success('Link copied to clipboard!');
        }
    };

    const handleOpenLink = () => {
        if (trackShareUrl) {
            window.open(trackShareUrl, '_blank');
        }
    };

    return (
        <Modal 
            show={show} 
            onHide={onHide} 
            centered 
            size="lg"
        >
            <Modal.Header style={{ backgroundColor: '#71C0BB', color: 'white', position: 'relative' }}>
                <Modal.Title>Track Q&A Share Link</Modal.Title>
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
                        e.target.style.color = 'white';
                    }}
                    onMouseLeave={(e) => {
                        e.target.style.backgroundColor = 'transparent';
                        e.target.style.color = 'white';
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
                            value={trackShareUrl || ''}
                            readOnly
                            className="bg-light"
                            style={{ flex: 1 }}
                        />
                        <Button
                            onClick={handleCopy}
                            style={{
                                backgroundColor: '#71C0BB',
                                borderColor: '#71C0BB',
                                color: 'white',
                                whiteSpace: 'nowrap'
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.backgroundColor = '#5ba8a3';
                                e.target.style.borderColor = '#5ba8a3';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.backgroundColor = '#71C0BB';
                                e.target.style.borderColor = '#71C0BB';
                            }}
                        >
                            <i className="feather icon-copy mr-1"></i> Copy
                        </Button>
                    </div>
                    <Form.Text className="text-muted">
                        Share this link to allow public access to all sessions and questions in this track.
                    </Form.Text>
                </Form.Group>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onHide}>
                    Close
                </Button>
                <Button 
                    style={{ backgroundColor: '#71C0BB', borderColor: '#71C0BB', color: 'white' }}
                    onClick={handleOpenLink}
                    onMouseEnter={(e) => {
                        e.target.style.backgroundColor = '#5ba8a3';
                        e.target.style.borderColor = '#5ba8a3';
                    }}
                    onMouseLeave={(e) => {
                        e.target.style.backgroundColor = '#71C0BB';
                        e.target.style.borderColor = '#71C0BB';
                    }}
                >
                    <i className="feather icon-external-link mr-1"></i> Open Link
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default TrackQnAShareLinkModal;

