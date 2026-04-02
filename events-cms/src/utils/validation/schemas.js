import * as Yup from 'yup';

// Common validation patterns and regex
export const validationPatterns = {
  emailRegex: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
  phoneRegex: /^[\+]?[1-9][\d]{0,15}$/,
  passwordRegex: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
  otpRegex: /^\d{6}$/,
};

// Common validation messages
export const validationMessages = {
  required: 'This field is required',
  email: 'Please enter a valid email address (e.g., user@gmail.com)',
  password: 'Password must be at least 8 characters',
  passwordStrong: 'Password must contain uppercase, lowercase, number, and special character (e.g., User@1234)',
  phone: 'Please enter a valid phone number',
  url: 'Please enter a valid URL',
  otp: 'Please enter a valid 6-digit OTP',
  passwordMatch: 'Passwords do not match',
  minLength: (min) => `Must be at least ${min} characters`,
  maxLength: (max) => `Must be less than ${max} characters`,
  minValue: (min) => `Must be at least ${min}`,
  maxValue: (max) => `Cannot exceed ${max}`,
};

// Sign In Validation Schema
export const signInSchema = Yup.object().shape({
  email: Yup.string()
    .email(validationMessages.email)
    .matches(validationPatterns.emailRegex, validationMessages.email)
    .required(validationMessages.required),
  password: Yup.string()
    .min(8, validationMessages.password)
    .matches(validationPatterns.passwordRegex, validationMessages.passwordStrong)
    .required(validationMessages.required),
});

// Forgot Password Validation Schema
export const forgotPasswordSchema = Yup.object().shape({
  email: Yup.string()
    .email(validationMessages.email)
    .matches(validationPatterns.emailRegex, validationMessages.email)
    .required(validationMessages.required),
});

// Reset Password Validation Schema
export const resetPasswordSchema = Yup.object().shape({
  otp: Yup.string()
    .matches(validationPatterns.otpRegex, validationMessages.otp)
    .required(validationMessages.required),
  newPassword: Yup.string()
    .min(8, validationMessages.password)
    .matches(validationPatterns.passwordRegex, validationMessages.passwordStrong)
    .required(validationMessages.required),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('newPassword')], validationMessages.passwordMatch)
    .required(validationMessages.required),
});

// Change Password Validation Schema
export const changePasswordSchema = Yup.object().shape({
  currentPassword: Yup.string()
    .required(validationMessages.required),
  newPassword: Yup.string()
    .min(8, validationMessages.password)
    .matches(validationPatterns.passwordRegex, validationMessages.passwordStrong)
    .required(validationMessages.required),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('newPassword')], validationMessages.passwordMatch)
    .required(validationMessages.required),
});
