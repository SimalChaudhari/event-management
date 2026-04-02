import React from 'react';
import { Modal, Button } from 'react-bootstrap';

const DeleteConfirmationModal = ({
  show,
  onHide,
  question,
  onConfirm,
  deleting
}) => {
  return (
    <Modal show={show} onHide={onHide} size="md" centered>
      <Modal.Header style={{ borderBottom: '1px solid #e0e0e0', padding: '20px', position: 'relative' }}>
        <Modal.Title style={{ color: '#333', fontWeight: '600', fontSize: '18px' }}>
          <i className="feather icon-alert-triangle mr-2" style={{ color: '#dc3545' }}></i>
          Confirm Delete
        </Modal.Title>
        <button
          type="button"
          className="btn-close"
          onClick={onHide}
          disabled={deleting}
          style={{
            position: 'absolute',
            top: '15px',
            right: '15px',
            width: '30px',
            height: '30px',
            backgroundColor: 'transparent',
            border: 'none',
            fontSize: '18px',
            color: '#666',
            cursor: deleting ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            if (!deleting) {
              e.target.style.backgroundColor = '#f5f5f5';
              e.target.style.color = '#333';
            }
          }}
          onMouseLeave={(e) => {
            if (!deleting) {
              e.target.style.backgroundColor = 'transparent';
              e.target.style.color = '#666';
            }
          }}
        >
          <i className="feather icon-x" style={{ fontSize: '16px' }}></i>
        </button>
      </Modal.Header>
      <Modal.Body style={{ padding: '20px' }}>
        {question && (
          <div>
            <div style={{ 
              backgroundColor: '#fff3cd', 
              padding: '15px', 
              borderRadius: '8px',
              border: '1px solid #ffc107',
              marginBottom: '15px'
            }}>
              <p style={{ margin: 0, color: '#856404', fontSize: '14px', fontWeight: '500' }}>
                <i className="feather icon-info mr-2"></i>
                Are you sure you want to delete this question? This action cannot be undone.
              </p>
            </div>
            
            <div className="mb-3">
              <h6 style={{ color: '#333', fontWeight: '600', marginBottom: '8px' }}>Question:</h6>
              <div 
                style={{ 
                  backgroundColor: '#f8f9fa', 
                  padding: '15px', 
                  borderRadius: '8px',
                  border: '1px solid #e9ecef',
                  color: '#495057',
                  fontSize: '14px',
                  lineHeight: '1.5'
                }}
              >
                {question.question}
              </div>
            </div>

            {question.answer && (
              <div className="mb-3">
                <h6 style={{ color: '#333', fontWeight: '600', marginBottom: '8px' }}>Answer:</h6>
                <div 
                  style={{ 
                    backgroundColor: '#f8f9fa', 
                    padding: '15px', 
                    borderRadius: '8px',
                    border: '1px solid #e9ecef',
                    color: '#495057',
                    fontSize: '14px',
                    lineHeight: '1.5'
                  }}
                >
                  {question.answer}
                </div>
              </div>
            )}

            <div 
              style={{ 
                backgroundColor: '#f8f9fa', 
                padding: '12px', 
                borderRadius: '6px',
                border: '1px solid #e0e0e0',
                fontSize: '12px',
                color: '#666',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <i className="feather icon-thumbs-up" style={{ color: '#71C0BB' }}></i>
              <span>{question.likesCount || 0} votes</span>
            </div>
          </div>
        )}
      </Modal.Body>
      <Modal.Footer style={{ borderTop: '1px solid #e0e0e0', padding: '20px', justifyContent: 'flex-end', gap: '12px' }}>
        <Button 
          variant="secondary" 
          onClick={onHide}
          disabled={deleting}
          style={{ 
            borderRadius: '6px',
            padding: '8px 16px',
            fontSize: '14px',
            fontWeight: '500'
          }}
        >
          Cancel
        </Button>
        <Button 
          variant="danger" 
          onClick={onConfirm}
          disabled={deleting}
          style={{ 
            borderRadius: '6px',
            padding: '8px 16px',
            fontSize: '14px',
            fontWeight: '500'
          }}
        >
          {deleting ? (
            <>
              <i className="feather icon-loader mr-2" style={{ animation: 'spin 1s linear infinite' }}></i>
              Deleting...
            </>
          ) : (
            <>
              <i className="feather icon-trash-2 mr-2"></i>
              Delete Question
            </>
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default DeleteConfirmationModal;

