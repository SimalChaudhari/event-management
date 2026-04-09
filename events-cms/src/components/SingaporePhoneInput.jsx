import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

/**
 * Singapore Phone Input Component
 * Formats phone number as: +65-XXXX-XXXX
 * Validates Singapore mobile numbers (8 digits starting with 8 or 9)
 */
const SingaporePhoneInput = ({
    name,
    value,
    onChange,
    placeholder = '+65-XXXX-XXXX',
    required = false,
    className = 'form-control',
    disabled = false,
    label = null,
    showError = true,
    customErrorMessage = null
}) => {
    const [displayValue, setDisplayValue] = useState('');
    const [error, setError] = useState('');
    const [touched, setTouched] = useState(false);

    /**
     * Clean phone number - remove all non-digit characters
     */
    const cleanPhoneNumber = (phone) => {
        if (!phone) return '';
        return phone.replace(/\D/g, '');
    };

    /**
     * Format phone number for display: +65-XXXX-XXXX
     */
    const formatPhoneForDisplay = (phone) => {
        if (!phone) return '';
        
        const cleaned = cleanPhoneNumber(phone);
        let phoneDigits = cleaned;
        
        // Remove country code if present
        if (cleaned.startsWith('65')) {
            phoneDigits = cleaned.substring(2);
        }
        
        // Only format if we have digits
        if (phoneDigits.length === 0) return '';
        
        // Check if first digit is valid (8 or 9)
        if (phoneDigits.length >= 1 && phoneDigits.charAt(0) !== '8' && phoneDigits.charAt(0) !== '9') {
            return phone; // Don't format invalid numbers
        }
        
        // Format progressively as user types for display
        if (phoneDigits.length <= 4) {
            return `+65-${phoneDigits}`;
        } else if (phoneDigits.length <= 8) {
            return `+65-${phoneDigits.substring(0, 4)}-${phoneDigits.substring(4)}`;
        } else {
            // Limit to 8 digits
            return `+65-${phoneDigits.substring(0, 4)}-${phoneDigits.substring(4, 8)}`;
        }
    };

    /**
     * Format phone number for database storage: +6589532476
     */
    const formatPhoneForDatabase = (phone) => {
        if (!phone) return '';
        
        const cleaned = cleanPhoneNumber(phone);
        let phoneDigits = cleaned;
        
        // Remove country code if present
        if (cleaned.startsWith('65')) {
            phoneDigits = cleaned.substring(2);
        }
        
        // Validate that it's 8 digits and starts with 8 or 9
        if (phoneDigits.length === 8 && (phoneDigits.startsWith('8') || phoneDigits.startsWith('9'))) {
            return `+65${phoneDigits}`; // Database format without hyphens
        }
        
        return phone; // Return original if invalid
    };

    /**
     * Validate Singapore phone number
     */
    const validatePhone = (phone) => {
        if (!phone) {
            if (required) {
                return 'Mobile number is required';
            }
            return '';
        }
        
        const cleaned = cleanPhoneNumber(phone);
        let phoneDigits = cleaned;
        
        // Remove country code if present
        if (cleaned.startsWith('65')) {
            phoneDigits = cleaned.substring(2);
        }
        
        // Check length
        if (phoneDigits.length !== 8) {
            return customErrorMessage || 'Singapore mobile number must be 8 digits';
        }
        
        // Check if starts with 8 or 9
        const firstDigit = phoneDigits.charAt(0);
        if (firstDigit !== '8' && firstDigit !== '9') {
            return customErrorMessage || 'Singapore mobile number must start with 8 or 9';
        }
        
        return '';
    };

    /**
     * Initialize display value from prop
     */
    useEffect(() => {
        const formatted = formatPhoneForDisplay(value);
        setDisplayValue(formatted);
    }, [value]);

    /**
     * Handle input change
     */
    const handleChange = (e) => {
        const inputValue = e.target.value;
        const cleaned = cleanPhoneNumber(inputValue);
        
        // Extract only the phone digits (without country code)
        let phoneDigits = cleaned;
        if (cleaned.startsWith('65')) {
            phoneDigits = cleaned.substring(2);
        }
        
        // Only validate first digit if we're replacing the entire input or it's a new first digit
        if (phoneDigits.length >= 1 && phoneDigits.length <= 2) {
            const firstDigit = phoneDigits.charAt(0);
            if (firstDigit !== '8' && firstDigit !== '9') {
                // Don't update if first digit is invalid
                return;
            }
        }
        
        // Limit to 8 digits
        if (phoneDigits.length > 8) {
            phoneDigits = phoneDigits.substring(0, 8);
        }
        
        // Format for display
        const displayFormatted = formatPhoneForDisplay(phoneDigits);
        setDisplayValue(displayFormatted);
        
        // Format for database
        const dbFormatted = formatPhoneForDatabase(phoneDigits);
        
        // Validate
        const validationError = validatePhone(displayFormatted);
        setError(validationError);
        
        // Call parent onChange with database format value
        if (onChange) {
            const syntheticEvent = {
                target: {
                    name: name,
                    value: dbFormatted // Send database format to parent
                }
            };
            onChange(syntheticEvent);
        }
    };

    /**
     * Handle blur - mark as touched
     */
    const handleBlur = () => {
        setTouched(true);
        const validationError = validatePhone(displayValue);
        setError(validationError);
    };

    /**
     * Handle focus - clear if empty
     */
    const handleFocus = () => {
        if (!displayValue) {
            setDisplayValue('+65-');
        }
    };

    /**
     * Handle key down - prevent invalid characters and enforce Singapore mobile rules
     */
    const handleKeyDown = (e) => {
        // Allow: backspace, delete, tab, escape, enter, home, end, arrow keys
        if ([8, 9, 27, 13, 46, 35, 36, 37, 38, 39, 40].indexOf(e.keyCode) !== -1 ||
            // Allow Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
            (e.keyCode === 65 && e.ctrlKey === true) ||
            (e.keyCode === 67 && e.ctrlKey === true) ||
            (e.keyCode === 86 && e.ctrlKey === true) ||
            (e.keyCode === 88 && e.ctrlKey === true)) {
            return;
        }
        
        // Ensure that it is a number and stop the keypress
        if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
            e.preventDefault();
            return;
        }
        
        // Get current cursor position and existing value
        const currentValue = e.target.value;
        const cursorPos = e.target.selectionStart;
        const cleaned = cleanPhoneNumber(currentValue);
        let phoneDigits = cleaned;
        
        // Remove country code if present
        if (cleaned.startsWith('65')) {
            phoneDigits = cleaned.substring(2);
        }
        
        // Only block invalid first digits when we're actually at the first digit position
        if (phoneDigits.length === 0) {
            const pressedDigit = String.fromCharCode(e.keyCode >= 96 ? e.keyCode - 48 : e.keyCode);
            if (pressedDigit !== '8' && pressedDigit !== '9') {
                e.preventDefault();
                return;
            }
        }
    };

    /**
     * Handle paste - validate pasted content
     */
    const handlePaste = (e) => {
        e.preventDefault();
        const pastedText = (e.clipboardData || window.clipboardData).getData('text');
        const cleaned = cleanPhoneNumber(pastedText);
        let phoneDigits = cleaned;
        
        // Remove country code if present
        if (cleaned.startsWith('65')) {
            phoneDigits = cleaned.substring(2);
        }
        
        // Only allow if starts with 8 or 9 and is 8 digits
        if (phoneDigits.length === 8 && (phoneDigits.startsWith('8') || phoneDigits.startsWith('9'))) {
            const displayFormatted = formatPhoneForDisplay(phoneDigits);
            setDisplayValue(displayFormatted);
            
            const dbFormatted = formatPhoneForDatabase(phoneDigits);
            setError('');
            
            if (onChange) {
                const syntheticEvent = {
                    target: {
                        name: name,
                        value: dbFormatted
                    }
                };
                onChange(syntheticEvent);
            }
        }
    };

    return (
        <div className="singapore-phone-input-wrapper">
            {label && (
                <label htmlFor={name} className="floating-label">
                    {label}
                    {required && <span className="text-danger">*</span>}
                </label>
            )}
            <input
                type="tel"
                name={name}
                id={name}
                className={`${className} ${touched && error ? 'is-invalid' : ''} ${touched && !error && displayValue ? 'is-valid' : ''}`}
                value={displayValue}
                onChange={handleChange}
                onBlur={handleBlur}
                onFocus={handleFocus}
                onKeyDown={handleKeyDown}
                onPaste={handlePaste}
                placeholder={placeholder}
                required={required}
                disabled={disabled}
                autoComplete="tel"
            />
            {showError && touched && error && (
                <div className="invalid-feedback" style={{ display: 'block' }}>
                    {error}
                </div>
            )}
            {showError && touched && !error && displayValue && (
                <div className="valid-feedback" style={{ display: 'block' }}>
                    Valid Singapore mobile number
                </div>
            )}
        </div>
    );
};

SingaporePhoneInput.propTypes = {
    name: PropTypes.string.isRequired,
    value: PropTypes.string,
    onChange: PropTypes.func.isRequired,
    placeholder: PropTypes.string,
    required: PropTypes.bool,
    className: PropTypes.string,
    disabled: PropTypes.bool,
    label: PropTypes.string,
    showError: PropTypes.bool,
    customErrorMessage: PropTypes.string
};

export default SingaporePhoneInput;

