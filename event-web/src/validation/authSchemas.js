import * as Yup from 'yup';

export const loginSchema = Yup.object().shape({
  email: Yup.string().email('Enter a valid email address').required('Email is required'),
  password: Yup.string().required('Password is required'),
});

export const signupSchema = Yup.object().shape({
  firstName: Yup.string().min(2, 'At least 2 characters').required('First name is required'),
  lastName: Yup.string().min(2, 'At least 2 characters').required('Last name is required'),
  mobile: Yup.string(),
  email: Yup.string().email('Enter a valid email address').required('Email is required'),
  password: Yup.string()
    .min(8, 'Password must be at least 8 characters')
    .required('Password is required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password')], 'Passwords must match')
    .required('Confirm password is required'),
  agreeTerms: Yup.boolean().oneOf([true], 'You must accept the terms and privacy policy'),
});

export const forgotPasswordSchema = Yup.object().shape({
  email: Yup.string().email('Enter a valid email address').required('Email is required'),
});

export const resetPasswordSchema = Yup.object().shape({
  email: Yup.string().email('Enter a valid email address').required('Email is required'),
  otp: Yup.string()
    .length(6, 'OTP must be 6 digits')
    .matches(/^[0-9]+$/, 'OTP must be digits only')
    .required('OTP is required'),
  newPassword: Yup.string()
    .min(8, 'Password must be at least 8 characters')
    .required('New password is required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('newPassword')], 'Passwords must match')
    .required('Confirm password is required'),
});

export const profileUpdateSchema = Yup.object().shape({
  firstName: Yup.string().min(1, 'First name is required').required('First name is required'),
  lastName: Yup.string().min(1, 'Last name is required').required('Last name is required'),
  email: Yup.string().email('Enter a valid email address').required('Email is required'),
  mobile: Yup.string(),
  salutation: Yup.string(),
  company: Yup.string(),
  industry: Yup.string(),
  designation: Yup.string(),
  linkedinProfile: Yup.string().test('url-or-empty', 'Enter a valid URL', (v) => !v || /^https?:\/\/.+/.test(v)),
  address: Yup.string(),
  street: Yup.string(),
  city: Yup.string(),
  state: Yup.string(),
  postalCode: Yup.string(),
  country: Yup.string(),
  apartment: Yup.string(),
  landmark: Yup.string(),
  addressLabel: Yup.string(),
  deliveryInstructions: Yup.string(),
});
