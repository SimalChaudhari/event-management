import React from 'react';
import { Modal, Button, Form, Spinner } from 'react-bootstrap';

const EditQuestionModal = ({
  show,
  onHide,
  question,
  editQuestionText,
  setEditQuestionText,
  editQuestionStatus,
  setEditQuestionStatus,
  onSubmit,
  onDelete,
  submitting
}) => {
  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header style={{ borderBottom: '1px solid #e0e0e0', padding: '20px', position: 'relative' }}>
        <Modal.Title style={{ color: '#333', fontWeight: '600', fontSize: '18px' }}>
          <i className="feather icon-edit mr-2" style={{ color: '#71C0BB' }}></i>
          Edit Question
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
            <div className="mb-3">
              <h6 style={{ color: '#333', fontWeight: '600', marginBottom: '8px' }}>Question Text:</h6>
              <Form.Control
                as="textarea"
                rows={4}
                value={editQuestionText}
                onChange={(e) => setEditQuestionText(e.target.value)}
                placeholder="Enter question text..."
                style={{
                  border: '1px solid #e0e0e0',
                  borderRadius: '6px',
                  fontSize: '14px',
                  lineHeight: '1.5',
                  padding: '12px',
                  backgroundColor: '#fff',
                  color: '#333',
                  boxShadow: 'none',
                  resize: 'vertical'
                }}
              />
              <small className="text-muted" style={{ fontSize: '12px', color: '#666' }}>
                Character count: {editQuestionText.length}
              </small>
            </div>
            
            <div className="mb-3">
              <h6 style={{ color: '#333', fontWeight: '600', marginBottom: '8px' }}>Question Status:</h6>
              <Form.Select
                value={editQuestionStatus}
                onChange={(e) => setEditQuestionStatus(e.target.value)}
                style={{
                  border: '1px solid #e0e0e0',
                  borderRadius: '6px',
                  fontSize: '14px',
                  padding: '8px 12px',
                  backgroundColor: '#fff',
                  color: '#333',
                  minWidth: '200px',
                  boxShadow: 'none'
                }}
              >
                <option value="not_answered">Not Answered</option>
                <option value="approval">Approval</option>
                <option value="answered">Answered</option>
              </Form.Select>
              <small className="text-muted" style={{ fontSize: '12px', color: '#666', display: 'block', marginTop: '4px' }}>
                Change the status of this question
              </small>
            </div>

            <div className="mb-3">
              <h6 style={{ color: '#333', fontWeight: '600', marginBottom: '8px' }}>Votes:</h6>
              <div 
                style={{ 
                  backgroundColor: '#f8f9fa', 
                  padding: '12px', 
                  borderRadius: '6px',
                  border: '1px solid #e0e0e0',
                  color: '#666',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <i className="feather icon-thumbs-up mr-2" style={{ color: '#71C0BB' }}></i>
                  <span>{question.likesCount || 0} votes</span>
                </div>
                <small className="text-muted" style={{ fontSize: '12px' }}>
                  (Cannot be changed)
                </small>
              </div>
            </div>
          </div>
        )}
      </Modal.Body>
      <Modal.Footer style={{ borderTop: '1px solid #e0e0e0', padding: '20px', justifyContent: 'space-between' }}>
        <Button 
          variant="secondary" 
          onClick={onHide}
          disabled={submitting}
          style={{ 
            borderRadius: '6px',
            padding: '8px 16px',
            fontSize: '14px',
            fontWeight: '500'
          }}
        >
          Cancel
        </Button>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Button 
            variant="danger" 
            onClick={() => onDelete(question?.id)}
            disabled={submitting}
            style={{ 
              borderRadius: '6px',
              padding: '8px 16px',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            <i className="feather icon-trash-2 mr-2"></i>
            Delete Question
          </Button>
          <Button 
            variant="primary" 
            onClick={onSubmit}
            disabled={submitting || !editQuestionText.trim()}
            style={{ 
              backgroundColor: '#71C0BB', 
              borderColor: '#71C0BB',
              borderRadius: '6px',
              padding: '8px 16px',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            {submitting ? (
              <>
                <Spinner size="sm" className="mr-2" />
                Saving...
              </>
            ) : (
              <>
                <i className="feather icon-save mr-2"></i>
                Save Changes
              </>
            )}
          </Button>
        </div>
      </Modal.Footer>
    </Modal>
  );
};

export default EditQuestionModal;

