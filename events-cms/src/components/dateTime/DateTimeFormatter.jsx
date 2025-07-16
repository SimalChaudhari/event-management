import React from 'react';

const DateTimeFormatter = ({ date, time, showDay = true }) => {
    const formatDateTime = (dateStr, timeStr) => {
        if (!dateStr) return 'N/A';
        
        try {
            // Parse the date string (assuming format like "2025-07-30")
            const dateObj = new Date(dateStr);
            
            if (isNaN(dateObj.getTime())) {
                return 'Invalid Date';
            }
            
            // Format date
            const day = dateObj.getDate();
            const month = dateObj.toLocaleDateString('en-US', { month: 'long' });
            const year = dateObj.getFullYear();
            const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
            
            // Format time if provided
            let timeDisplay = '';
            if (timeStr) {
                try {
                    // Handle different time formats
                    let timeObj;
                    if (timeStr.includes('T')) {
                        // ISO format like "2025-07-30T09:01:00"
                        timeObj = new Date(`2000-01-01T${timeStr.split('T')[1]}`);
                    } else {
                        // Simple time format like "09:01:00"
                        timeObj = new Date(`2000-01-01T${timeStr}`);
                    }
                    
                    if (!isNaN(timeObj.getTime())) {
                        const hours = timeObj.getHours();
                        const minutes = timeObj.getMinutes();
                        const ampm = hours >= 12 ? 'PM' : 'AM';
                        const displayHours = hours % 12 || 12;
                        const displayMinutes = minutes.toString().padStart(2, '0');
                        timeDisplay = ` ${displayHours}:${displayMinutes} ${ampm}`;
                    }
                } catch (timeError) {
                    console.error('Time parsing error:', timeError);
                    timeDisplay = ` ${timeStr}`;
                }
            }
            
            // Return formatted string
            if (showDay) {
                return `${day} ${month} ${year}, ${dayName}${timeDisplay}`;
            } else {
                return `${day} ${month} ${year}${timeDisplay}`;
            }
            
        } catch (error) {
            console.error('Date parsing error:', error);
            return `${dateStr} ${timeStr || ''}`;
        }
    };
    
    return (
        <span>{formatDateTime(date, time)}</span>
    );
};

export default DateTimeFormatter;