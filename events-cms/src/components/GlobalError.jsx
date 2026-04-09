import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Alert, Button } from 'react-bootstrap';

const GlobalError = () => {
    const { error } = useSelector(state => state);
    const { global } = error;
    const dispatch = useDispatch();

    const clearError = () => {
        // Clear all errors by dispatching null to each error type
        const errorTypes = [
            'USER_ERROR', 'AUTH_ERROR', 'EVENT_ERROR', 'ORDER_ERROR', 
            'SPEAKER_ERROR', 'EXHIBITOR_ERROR', 'BANNER_ERROR', 
            'GALLERY_ERROR', 'CATEGORY_ERROR', 'SETTINGS_ERROR', 'WITHDRAW_ERROR'
        ];
        
        errorTypes.forEach(type => {
            dispatch({
                type,
                payload: null
            });
        });
    };

    if (!global) {
        return null;
    }

    return (
        <div
            style={{
                position: 'fixed',
                top: '20px',
                right: '20px',
                zIndex: 10000,
                maxWidth: '400px',
                minWidth: '300px'
            }}
        >
            <Alert 
                variant="danger" 
                onClose={clearError}
                dismissible
                show={true}
            >
                <Alert.Heading>
                    <i className="fas fa-exclamation-triangle me-2"></i>
                    Error
                </Alert.Heading>
                <p className="mb-0">
                    {global}
                </p>
                <hr />
                <div className="d-flex justify-content-end">
                    <Button 
                        variant="outline-danger" 
                        size="sm"
                        onClick={clearError}
                    >
                        Dismiss
                    </Button>
                </div>
            </Alert>
        </div>
    );
};

export default GlobalError; 