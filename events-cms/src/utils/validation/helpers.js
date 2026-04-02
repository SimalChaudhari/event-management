import { toast } from 'react-toastify';

// Validation helper functions
const validationHelpers = {
  // Show validation errors
  showValidationError: (error) => {
    toast.error(error || 'Validation error occurred');
  },

  // Show validation success
  showValidationSuccess: (message) => {
    toast.success(message || 'Validation successful');
  },

  // Handle form submission errors
  handleFormError: (error, setFieldError) => {
    if (error.response && error.response.data) {
      const { data } = error.response;
      
      // Handle field-specific errors
      if (data.errors && typeof data.errors === 'object') {
        Object.keys(data.errors).forEach(field => {
          setFieldError(field, data.errors[field]);
        });
      }
      
      // Handle general error message
      if (data.message) {
        toast.error(data.message);
      }
    } else if (error.message) {
      toast.error(error.message);
    } else {
      toast.error('An unexpected error occurred');
    }
  },

  // Validate single field
  validateField: async (schema, fieldName, value) => {
    try {
      await schema.validateAt(fieldName, { [fieldName]: value });
      return null; // No error
    } catch (error) {
      return error.message;
    }
  },

  // Validate entire form
  validateForm: async (schema, values) => {
    try {
      await schema.validate(values, { abortEarly: false });
      return { isValid: true, errors: {} };
    } catch (error) {
      const errors = {};
      error.inner.forEach(err => {
        errors[err.path] = err.message;
      });
      return { isValid: false, errors };
    }
  },

  // Get field error message
  getFieldError: (touched, errors, fieldName) => {
    return touched[fieldName] && errors[fieldName] ? errors[fieldName] : '';
  },

  // Check if field has error
  hasFieldError: (touched, errors, fieldName) => {
    return touched[fieldName] && errors[fieldName];
  },

  // Get field CSS classes for styling
  getFieldClasses: (touched, errors, fieldName, baseClasses = '') => {
    const hasError = validationHelpers.hasFieldError(touched, errors, fieldName);
    return `${baseClasses} ${hasError ? 'is-invalid' : ''}`.trim();
  },

  // Format validation error for display
  formatValidationError: (error) => {
    if (typeof error === 'string') {
      return error;
    }
    if (error && error.message) {
      return error.message;
    }
    return 'Invalid input';
  },

  // Debounce validation (useful for real-time validation)
  debounceValidation: (func, delay = 300) => {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(null, args), delay);
    };
  },

  // Create custom validation function
  createCustomValidator: (validatorFn, errorMessage) => {
    return (value) => {
      if (!validatorFn(value)) {
        return errorMessage;
      }
      return null;
    };
  },

  // Validate file upload
  validateFile: (file, options = {}) => {
    const {
      maxSize = 5 * 1024 * 1024, // 5MB default
      allowedTypes = ['image/jpeg', 'image/png', 'image/gif'],
      allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif']
    } = options;

    const errors = [];

    // Check file size
    if (file.size > maxSize) {
      errors.push(`File size must be less than ${maxSize / (1024 * 1024)}MB`);
    }

    // Check file type
    if (!allowedTypes.includes(file.type)) {
      errors.push(`File type must be one of: ${allowedTypes.join(', ')}`);
    }

    // Check file extension
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
    if (!allowedExtensions.includes(fileExtension)) {
      errors.push(`File extension must be one of: ${allowedExtensions.join(', ')}`);
    }

    return errors.length > 0 ? errors : null;
  },

  // Validate multiple files
  validateFiles: (files, options = {}) => {
    const errors = [];
    const { maxFiles = 10 } = options;

    if (files.length > maxFiles) {
      errors.push(`Maximum ${maxFiles} files allowed`);
    }

    files.forEach((file, index) => {
      const fileErrors = validationHelpers.validateFile(file, options);
      if (fileErrors) {
        errors.push(`File ${index + 1}: ${fileErrors.join(', ')}`);
      }
    });

    return errors.length > 0 ? errors : null;
  },

  // Sanitize form data
  sanitizeFormData: (data) => {
    const sanitized = {};
    Object.keys(data).forEach(key => {
      if (typeof data[key] === 'string') {
        sanitized[key] = data[key].trim();
      } else {
        sanitized[key] = data[key];
      }
    });
    return sanitized;
  },

  // Reset form fields
  resetFormFields: (setFieldValue, initialValues) => {
    Object.keys(initialValues).forEach(field => {
      setFieldValue(field, initialValues[field]);
    });
  },

  // Check if form is dirty (has changes)
  isFormDirty: (values, initialValues) => {
    return JSON.stringify(values) !== JSON.stringify(initialValues);
  },

  // Get changed fields
  getChangedFields: (values, initialValues) => {
    const changedFields = {};
    Object.keys(values).forEach(key => {
      if (values[key] !== initialValues[key]) {
        changedFields[key] = values[key];
      }
    });
    return changedFields;
  },

  // Validate password strength
  validatePasswordStrength: (password) => {
    const checks = {
      length: password.length >= 8,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      number: /\d/.test(password),
      special: /[@$!%*?&]/.test(password)
    };

    const score = Object.values(checks).filter(Boolean).length;
    const strength = score < 3 ? 'weak' : score < 5 ? 'medium' : 'strong';

    return {
      score,
      strength,
      checks,
      isValid: score >= 4
    };
  },

  // Format phone number to Singapore format: +65-XXXX-XXXX
  formatPhoneNumber: (phoneNumber) => {
    if (!phoneNumber) return '';
    
    const cleaned = phoneNumber.replace(/\D/g, '');
    let phoneDigits = cleaned;
    
    // Remove country code if present
    if (cleaned.startsWith('65')) {
      phoneDigits = cleaned.substring(2);
    }
    
    // Format: +65-XXXX-XXXX
    if (phoneDigits.length === 8) {
      return `+65-${phoneDigits.substring(0, 4)}-${phoneDigits.substring(4, 8)}`;
    }
    
    return phoneNumber;
  },

  // Validate and format Singapore phone number
  validateAndFormatPhone: (phoneNumber) => {
    if (!phoneNumber) return '';
    
    const cleaned = phoneNumber.replace(/\D/g, '');
    let phoneDigits = cleaned;
    
    // Remove country code if present
    if (cleaned.startsWith('65')) {
      phoneDigits = cleaned.substring(2);
    }
    
    // Check if valid Singapore mobile (8 digits starting with 8 or 9)
    if (phoneDigits.length === 8 && (phoneDigits.startsWith('8') || phoneDigits.startsWith('9'))) {
      return validationHelpers.formatPhoneNumber(phoneNumber);
    }
    
    return phoneNumber;
  },

  // Validate Singapore phone number
  isValidSingaporePhone: (phoneNumber) => {
    if (!phoneNumber) return false;
    
    const cleaned = phoneNumber.replace(/\D/g, '');
    let phoneDigits = cleaned;
    
    // Remove country code if present
    if (cleaned.startsWith('65')) {
      phoneDigits = cleaned.substring(2);
    }
    
    // Check if 8 digits and starts with 8 or 9
    return phoneDigits.length === 8 && (phoneDigits.startsWith('8') || phoneDigits.startsWith('9'));
  }
};

export default validationHelpers;
