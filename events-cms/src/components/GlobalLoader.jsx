import React from 'react';
import { useSelector } from 'react-redux';

const GlobalLoader = () => {
    const { loading } = useSelector((state) => state);
    const { global } = loading;

    if (!global) {
        return null;
    }

    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: 9999,
                backdropFilter: 'blur(2px)'
            }}
        >
            <div
                style={{
                    backgroundColor: 'white',
                    borderRadius: '10px',
                    padding: '30px',
                    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    minWidth: '200px'
                }}
            >
                <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}></div>
                <div style={{ marginTop: '15px', fontSize: '16px', fontWeight: '500', color: '#333' }}>Loading...</div>
                <div style={{ marginTop: '5px', fontSize: '12px', color: '#666' }}>Please wait while we process your request</div>
            </div>
        </div>
    );
};

export default GlobalLoader;
