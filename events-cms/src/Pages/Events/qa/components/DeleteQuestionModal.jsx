import React, { useState } from 'react';
import { Modal, Button, Alert, Spinner } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import { deleteQuestion } from '../../../../store/actions/qaActions';

const DeleteQuestionModal = ({ 
    show, 
    onHide, 
    question, 
    onSubmit
}) => {
    const dispatch = useDispatch();
    const { loading, error } = useSelector(state => state.qa);
    
    const [localError, setLocalError] = useState('');

    // Reset form when modal opens/closes
    React.useEffect(() => {
        if (show) {
            setLocalError('');
        }
    }, [show]);

    const handleDelete = async () => {
        if (!question?.id) {
            setLocalError('Question ID is missing');
            return;
        }

        setLocalError('');

        try {
            const result = await dispatch(deleteQuestion(question.id));
            
            // Call the onSubmit callback with the result
            if (onSubmit) {
                onSubmit(result, question);
            }
            
            // Close modal
            onHide();
            
        } catch (err) {
            console.error('Error deleting question:', err);
            setLocalError(err.message || 'Failed to delete question. Please try again.');
        }
    };

    const handleClose = () => {
        if (!loading) {
            onHide();
        }
    };

    return (
        <Modal 
            show={show} 
            onHide={handleClose}
            size="md"
            centered
            backdrop={loading ? 'static' : true}
            keyboard={!loading}
        >
            <Modal.Header style={{ backgroundColor: '#4680ff', color: 'white' }}>
                <Modal.Title>
                    <i className="feather icon-trash-2 mr-2"></i>
                    Delete Question
                </Modal.Title>
            </Modal.Header>
            
            <Modal.Body>
                {question && (
                    <div className="mb-4">
                        <Alert variant="warning">
                            <i className="feather icon-alert-triangle mr-2"></i>
                            <strong>Warning!</strong> This action cannot be undone.
                        </Alert>
                        
                        <h6 className="text-muted mb-2">Question to be deleted:</h6>
                        <div className="p-3 bg-light rounded">
                            <p className="mb-0">{question.question}</p>
                            {question.askedBy && (
                                <small className="text-muted mt-2 d-block">
                                    Asked by: {question.isAnonymous ? 'Anonymous' : question.askedBy.fullName}
                                </small>
                            )}
                            <small className="text-muted d-block">
                                Date: {new Date(question.createdAt).toLocaleDateString()}
                            </small>
                        </div>
                    </div>
                )}

                <p className="text-muted">
                    Are you sure you want to delete this question? This action will permanently remove the question and cannot be undone.
                </p>

                {(error || localError) && (
                    <Alert variant="danger" className="mt-3">
                        <i className="feather icon-alert-circle mr-2"></i>
                        {error || localError}
                    </Alert>
                )}
            </Modal.Body>
            
            <Modal.Footer>
                <Button 
                    variant="secondary"
                    onClick={handleClose}
                    disabled={loading}
                >
                    Cancel
                </Button>
                <Button 
                    variant="danger" 
                    onClick={handleDelete}
                    disabled={loading}
                >
                    {loading ? (
                        <>
                            <Spinner 
                                as="span" 
                                animation="border" 
                                size="sm" 
                                role="status" 
                                aria-hidden="true" 
                                className="mr-2"
                            />
                            Deleting...
                        </>
                    ) : (
                        <>
                            <i className="feather icon-trash-2 mr-2"></i>
                            Delete
                        </>
                    )}
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default DeleteQuestionModal;
