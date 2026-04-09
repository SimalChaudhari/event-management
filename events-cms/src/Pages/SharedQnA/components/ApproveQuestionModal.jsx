import React from 'react';
import { Modal, Button, Spinner } from 'react-bootstrap';

const ApproveQuestionModal = ({
  show,
  onHide,
  question,
  onApprove,
  onCancel,
  approving
}) => {
  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header style={{ borderBottom: '1px solid #e0e0e0', padding: '20px', position: 'relative' }}>
        <Modal.Title style={{ color: '#333', fontWeight: '600', fontSize: '18px' }}>
          <i className="feather icon-check-circle mr-2" style={{ color: '#71C0BB' }}></i>
          Approve Question
        </Modal.Title>
        <button
          type="button"
          className="btn-close"
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
            color: '#666',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = '#f5f5f5';
            e.target.style.color = '#333';
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = 'transparent';
            e.target.style.color = '#666';
          }}
        >
          <i className="feather icon-x" style={{ fontSize: '16px' }}></i>
        </button>
      </Modal.Header>
      <Modal.Body style={{ padding: '20px' }}>
        {question && (
          <div>
            <p style={{ marginBottom: "16px", fontSize: "16px", color: '#333', fontWeight: '600' }}>
              <strong>Question:</strong>
            </p>
            <p style={{ 
              marginBottom: "20px", 
              padding: "12px",
              backgroundColor: "#f8f9fa",
              borderRadius: "6px",
              fontSize: "14px",
              fontStyle: "italic",
              color: '#333',
              border: '1px solid #e0e0e0'
            }}>
              {question.question}
            </p>
            <p style={{ fontSize: "14px", color: "#666", margin: 0 }}>
              Do you want to approve this question?
            </p>
          </div>
        )}
      </Modal.Body>
      <Modal.Footer style={{ borderTop: '1px solid #e0e0e0', padding: '20px' }}>
        <Button 
          variant="secondary" 
          onClick={onCancel} 
          disabled={approving}
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
          variant="primary" 
          onClick={onApprove} 
          disabled={approving}
          style={{ 
            backgroundColor: "#71C0BB", 
            borderColor: "#71C0BB",
            borderRadius: '6px',
            padding: '8px 16px',
            fontSize: '14px',
            fontWeight: '500'
          }}
        >
          {approving ? (
            <>
              <Spinner size="sm" className="mr-2" />
              Approving...
            </>
          ) : (
            <>
              <i className="feather icon-check mr-2"></i>
              Approve
            </>
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ApproveQuestionModal;

