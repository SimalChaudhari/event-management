import React from 'react';
import { Button } from 'react-bootstrap';
import { API_URL } from '../../configs/env';
import StandardComponentTemplate from '../StandardComponentTemplate';

/**
 * EventDocumentsComponent - Component to display event documents
 * @param {Array} documents - Array of event documents
 */
const EventDocumentsComponent = ({ documents }) => {
    // Check if documents are available
    if (!documents || documents.length === 0) {
        return (
            <StandardComponentTemplate 
                title={`Event Documents(${documents.length})`} 
                // icon="📁"
                borderColor="green"
            >
                <div className="text-center py-4">
                    <i className="fas fa-file-alt fa-2x text-muted mb-2"></i>
                    <p className="text-muted">No documents available.</p>
                </div>
            </StandardComponentTemplate>
        );
    }

    // Handle document view
    const handleDocumentView = (documentSrc) => {
        window.open(documentSrc, '_blank');
    };

    // Get document name
    const getDocumentName = (doc) => {
        if (typeof doc === 'string') {
            return doc.split('/').pop();
        }
        return doc.name || 'Document';
    };

    // Render individual document item
    const renderDocumentItem = (doc, index) => {
        const documentSrc = `${API_URL}/${doc?.document?.replace(/\\/g, '/')}`;
        const documentName = getDocumentName(doc);

        return (
            <div
                key={index}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '12px',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    backgroundColor: '#f8f9fa',
                    gap: '12px'
                }}
            >
                {/* Document Icon */}
                <div style={{ flexShrink: 0 }}>
                    <i
                        className="fas fa-file-pdf text-danger"
                        style={{
                            fontSize: '1.5rem'
                        }}
                    ></i>
                </div>

                {/* Document Name */}
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                        style={{
                            fontWeight: 'bold',
                            fontSize: '14px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                        }}
                    >
                        {documentName}
                    </div>
                </div>

                {/* View Button */}
                <Button
                    size="sm"
                    variant="outline-primary"
                    onClick={() => handleDocumentView(documentSrc)}
                    style={{
                        marginLeft: 'auto',
                        fontSize: '12px',
                        padding: '6px 12px',
                        borderRadius: '6px'
                    }}
                >
                    <i className="fas fa-eye" style={{ marginRight: '4px' }}></i>
                    View
                </Button>
            </div>
        );
    };

    return (
        <StandardComponentTemplate 
            title={`Event Documents(${documents.length})`} 
            // icon="📁"
            borderColor="green"
        >
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    marginTop: '15px'
                }}
            >
                {documents.map(renderDocumentItem)}
            </div>
        </StandardComponentTemplate>
    );
};

export default EventDocumentsComponent;