/**
 * Date and Time Utility Functions
 * Provides reusable functions for formatting dates and times
 */

/**
 * Formats a date string into a readable format
 * @param {string} dateStr - Date string (e.g., "2025-07-30")
 * @param {boolean} showDay - Whether to include day name
 * @returns {string} Formatted date string
 */
export const formatDateString = (dateStr, showDay = true) => {
    if (!dateStr) return 'N/A';
    
    try {
        const dateObj = new Date(dateStr);
        
        if (isNaN(dateObj.getTime())) {
            return 'Invalid Date';
        }
        
        const day = dateObj.getDate();
        const month = dateObj.toLocaleDateString('en-US', { month: 'long' });
        const year = dateObj.getFullYear();
        const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
        
        if (showDay) {
            return `${day} ${month} ${year}, ${dayName}`;
        } else {
            return `${day} ${month} ${year}`;
        }
        
    } catch (error) {
        console.error('Date parsing error:', error);
        return dateStr;
    }
};

/**
 * Formats a time string into 12-hour format with AM/PM
 * @param {string} timeStr - Time string (e.g., "09:01:00")
 * @returns {string} Formatted time string
 */
export const formatTimeString = (timeStr) => {
    if (!timeStr) return '';
    
    try {
        let timeObj;
        
        // Handle different time formats
        if (timeStr.includes('T')) {
            // ISO format like "2025-07-30T09:01:00"
            timeObj = new Date(`2000-01-01T${timeStr.split('T')[1]}`);
        } else {
            // Simple time format like "09:01:00"
            timeObj = new Date(`2000-01-01T${timeStr}`);
        }
        
        if (isNaN(timeObj.getTime())) {
            return timeStr;
        }
        
        const hours = timeObj.getHours();
        const minutes = timeObj.getMinutes();
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours % 12 || 12;
        const displayMinutes = minutes.toString().padStart(2, '0');
        
        return `${displayHours}:${displayMinutes} ${ampm}`;
        
    } catch (error) {
        console.error('Time parsing error:', error);
        return timeStr;
    }
};

/**
 * Formats date and time for DataTable rendering
 * @param {string} dateStr - Date string
 * @param {string} timeStr - Time string
 * @returns {string} HTML string for DataTable
 */
export const formatDateTimeForTable = (dateStr, timeStr) => {
    const formattedDate = formatDateString(dateStr);
    const formattedTime = formatTimeString(timeStr);
    
    return `
        <div class="event-date-time">
            <div class="event-date" style="font-weight: 500; color: #495057;">
                ${formattedDate}
            </div>
            ${formattedTime ? `<div class="event-time-text" style="font-size: 0.9em; color: #6c757d; margin-top: 2px;">${formattedTime}</div>` : ''}
        </div>
    `;
};

/**
 * Gets relative time description (e.g., "2 days ago", "in 3 hours")
 * @param {string} dateStr - Date string
 * @returns {string} Relative time description
 */
export const getRelativeTime = (dateStr) => {
    if (!dateStr) return '';
    
    try {
        const dateObj = new Date(dateStr);
        const now = new Date();
        const diffInMs = dateObj.getTime() - now.getTime();
        const diffInDays = Math.ceil(diffInMs / (1000 * 60 * 60 * 24));
        
        if (diffInDays < 0) {
            return `${Math.abs(diffInDays)} days ago`;
        } else if (diffInDays === 0) {
            return 'Today';
        } else if (diffInDays === 1) {
            return 'Tomorrow';
        } else {
            return `in ${diffInDays} days`;
        }
        
    } catch (error) {
        console.error('Relative time calculation error:', error);
        return '';
    }
};

/**
 * Validates if a string is a valid date
 * @param {string} dateStr - Date string to validate
 * @returns {boolean} True if valid date
 */
export const isValidDate = (dateStr) => {
    if (!dateStr) return false;
    
    try {
        const dateObj = new Date(dateStr);
        return !isNaN(dateObj.getTime());
    } catch (error) {
        return false;
    }
};

/**
 * Validates if a string is a valid time
 * @param {string} timeStr - Time string to validate
 * @returns {boolean} True if valid time
 */
export const isValidTime = (timeStr) => {
    if (!timeStr) return false;
    
    try {
        let timeObj;
        if (timeStr.includes('T')) {
            timeObj = new Date(`2000-01-01T${timeStr.split('T')[1]}`);
        } else {
            timeObj = new Date(`2000-01-01T${timeStr}`);
        }
        return !isNaN(timeObj.getTime());
    } catch (error) {
        return false;
    }
}; 