// Common form styling classes
export const formStyles = {
  form: 'form',
  fieldGroup: 'form-group',
  fieldGroupFill: 'form-group fill',
  fieldGroupError: 'form-group fill is-invalid',
  input: 'form-control',
  inputError: 'form-control is-invalid',
  textarea: 'form-control',
  textareaError: 'form-control is-invalid',
  button: 'btn btn-block btn-primary',
  buttonLoading: 'btn btn-block btn-primary',
  buttonDisabled: 'btn btn-block btn-primary',
  errorMessage: 'invalid-feedback',
  label: 'form-label',
  required: 'text-danger',
};

// Common form field configurations
export const fieldConfigs = {
  email: {
    type: 'email',
    autoComplete: 'email',
    placeholder: 'Email Address',
  },
  password: {
    type: 'password',
    autoComplete: 'current-password',
    placeholder: 'Password',
  },
  newPassword: {
    type: 'password',
    autoComplete: 'new-password',
    placeholder: 'New Password',
  },
  confirmPassword: {
    type: 'password',
    autoComplete: 'new-password',
    placeholder: 'Confirm Password',
  },
  firstName: {
    type: 'text',
    autoComplete: 'given-name',
    placeholder: 'First Name',
  },
  lastName: {
    type: 'text',
    autoComplete: 'family-name',
    placeholder: 'Last Name',
  },
  phone: {
    type: 'tel',
    autoComplete: 'tel',
    placeholder: 'Phone Number',
  },
  title: {
    type: 'text',
    placeholder: 'Title',
  },
  description: {
    type: 'textarea',
    placeholder: 'Description',
    rows: 4,
  },
  bio: {
    type: 'textarea',
    placeholder: 'Bio',
    rows: 3,
  },
  website: {
    type: 'url',
    placeholder: 'Website URL',
  },
};
