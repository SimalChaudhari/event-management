import { useState } from 'react';


    // ExpandableDescription component for handling long descriptions
  export const ExpandableDescription = ({ text, maxLines = 2, className = "" }) => {
        const [isExpanded, setIsExpanded] = useState(false);
        
        if (!text || text === 'No description available') {
            return <span style={{ fontStyle: 'italic', color: '#6c757d' }}>{text || 'No description available'}</span>;
        }

        // Calculate if text needs truncation (approximate)
        const wordsPerLine = 10; // Average words per line
        const words = text.split(' ');
        const shouldTruncate = words.length > (maxLines * wordsPerLine);
        
        const truncatedText = shouldTruncate && !isExpanded 
            ? words.slice(0, maxLines * wordsPerLine).join(' ') + '...'
            : text;

        return (
            <div className={className}>
                <span style={{ color: '#212529', fontWeight: 'normal', fontSize: '15px' }}>
                    {truncatedText}
                </span>
                {shouldTruncate && (
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: '#007bff',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: '600',
                            marginLeft: '8px',
                            padding: '0',
                            textDecoration: 'underline'
                        }}
                        onMouseOver={(e) => e.target.style.color = '#0056b3'}
                        onMouseOut={(e) => e.target.style.color = '#007bff'}
                    >
                        {isExpanded ? 'Read Less' : 'Read More'}
                    </button>
                )}
            </div>
        );
    };