import React, { useState } from 'react';
import { Modal, Button, Form, Alert, Spinner } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import { answerQuestion } from '../../../../store/actions/qaActions';

const AnswerQuestionModal = ({ 
    show, 
    onHide, 
    question, 
    onSubmit
}) => {
    const dispatch = useDispatch();
    const { loading, error } = useSelector(state => state.qa);
    
    const [answer, setAnswer] = useState('');
    const [localError, setLocalError] = useState('');

    // Reset form when modal opens/closes
    React.useEffect(() => {
        if (show) {
            setAnswer('');
            setLocalError('');
        }
    }, [show]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!answer.trim()) {
            setLocalError('Please enter an answer');
            return;
        }

        if (!question?.id) {
            setLocalError('Question ID is missing');
            return;
        }

        setLocalError('');

        try {
            const result = await dispatch(answerQuestion(question.id, answer.trim()));
            
            // Call the onSubmit callback with the result
            if (onSubmit) {
                onSubmit(result, question);
            }
            
            // Close modal
            onHide();
            
        } catch (err) {
            console.error('Error submitting answer:', err);
            setLocalError(err.message || 'Failed to submit answer. Please try again.');
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
            size="lg"
            centered
            backdrop={loading ? 'static' : true}
            keyboard={!loading}
        >
            <Modal.Header>
                <Modal.Title>
                    <i className="feather icon-message-square mr-2"></i>
                    Answer Question
                </Modal.Title>
            </Modal.Header>
            
            <Modal.Body>
                {question && (
                    <div className="mb-4">
                        <h6 className="text-muted mb-2">Question:</h6>
                        <div className="p-3 bg-light rounded">
                            <p className="mb-0">{question.question}</p>
                            {question.askedBy && (
                                <small className="text-muted mt-2 d-block">
                                    Asked by: {question.isAnonymous ? 'Anonymous' : question.askedBy.fullName}
                                </small>
                            )}
                        </div>
                    </div>
                )}

                <Form onSubmit={handleSubmit}>
                    <Form.Group className="mb-3">
                        <Form.Label>
                            <strong>Your Answer:</strong>
                        </Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={6}
                            value={answer}
                            onChange={(e) => setAnswer(e.target.value)}
                            placeholder="Enter your answer here..."
                            disabled={loading}
                            className={localError ? 'is-invalid' : ''}
                        />
                        {localError && (
                            <Form.Text className="text-danger">
                                {localError}
                            </Form.Text>
                        )}
                    </Form.Group>

                    {(error || localError) && (
                        <Alert variant="danger" className="mt-3">
                            <i className="feather icon-alert-circle mr-2"></i>
                            {error || localError}
                        </Alert>
                    )}
                </Form>
            </Modal.Body>
            
            <Modal.Footer>
                <Button 
                   variant="danger"
                    onClick={handleClose}
                    disabled={loading}
                >
                    Cancel
                </Button>
                <Button 
                    variant="primary" 
                    onClick={handleSubmit}
                    disabled={loading || !answer.trim()}
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
                            Submitting...
                        </>
                    ) : (
                        <>
                            <i className="feather icon-send mr-2"></i>
                            Submit Answer
                        </>
                    )}
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default AnswerQuestionModal;
