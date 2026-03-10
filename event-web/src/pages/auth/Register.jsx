import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Formik, Form, Field } from 'formik';
import { ROUTES } from '../../routes/routeConfig';
import { register } from '../../store/actions/authActions';
import PasswordInput from '../../components/PasswordInput';
import { signupSchema } from '../../validation/authSchemas';

const inputClass = 'w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary';
const inputErrorClass = 'w-full px-3 py-2.5 border border-red-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-300 focus:border-red-500';

export default function Register() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading } = useSelector((s) => s.auth);
  const [apiError, setApiError] = useState('');
  const [duplicateEmailError, setDuplicateEmailError] = useState(false);

  const handleSubmit = async (values) => {
    setApiError('');
    setDuplicateEmailError(false);
    const result = await dispatch(register({
      firstName: values.firstName,
      lastName: values.lastName,
      email: values.email,
      mobile: values.mobile,
      password: values.password,
    }));
    if (result.success) {
      navigate(ROUTES.VERIFY_EMAIL, { state: { email: values.email } });
    } else {
      const msg = result.payload || result.message || 'Registration failed.';
      if (/already taken|already exists|duplicate/i.test(msg)) {
        setDuplicateEmailError(true);
        setApiError(msg);
      } else {
        setApiError(msg);
      }
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <h1 className="text-2xl font-bold text-slate-800 mb-1">Sign up</h1>
      <p className="text-slate-600 text-sm mb-6">Create an account to get started</p>

      <Formik
          initialValues={{
            firstName: '',
            lastName: '',
            mobile: '',
            email: '',
            password: '',
            confirmPassword: '',
            agreeTerms: false,
          }}
          validationSchema={signupSchema}
          onSubmit={handleSubmit}
        >
          {({ errors, touched }) => (
            <Form className="space-y-4">
              {apiError && !duplicateEmailError && (
                <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">{apiError}</div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-slate-700 mb-1">First Name</label>
                  <Field
                    id="firstName"
                    name="firstName"
                    type="text"
                    placeholder="First Name"
                    className={touched.firstName && errors.firstName ? inputErrorClass : inputClass}
                  />
                  {touched.firstName && errors.firstName && <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>}
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-slate-700 mb-1">Last Name</label>
                  <Field
                    id="lastName"
                    name="lastName"
                    type="text"
                    placeholder="Last Name"
                    className={touched.lastName && errors.lastName ? inputErrorClass : inputClass}
                  />
                  {touched.lastName && errors.lastName && <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>}
                </div>
              </div>

              <div>
                <label htmlFor="mobile" className="block text-sm font-medium text-slate-700 mb-1">Mobile Number</label>
                <Field id="mobile" name="mobile" type="tel" placeholder="+65 9000 9990" className={inputClass} />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                <Field
                  id="email"
                  name="email"
                  type="email"
                  placeholder="name@email.com"
                  className={(touched.email && errors.email) || duplicateEmailError ? inputErrorClass : inputClass}
                />
                {(touched.email && errors.email) && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                {duplicateEmailError && <p className="mt-1 text-sm text-red-600">Email address already taken. Try logging in or using another email.</p>}
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                <Field name="password">
                  {({ field, form }) => (
                    <>
                      <PasswordInput
                        id="password"
                        value={field.value}
                        onChange={(e) => form.setFieldValue('password', e.target.value)}
                        onBlur={field.onBlur}
                        placeholder="Create a password"
                        error={form.touched.password && form.errors.password}
                      />
                      {form.touched.password && form.errors.password && <p className="mt-1 text-sm text-red-600">{form.errors.password}</p>}
                    </>
                  )}
                </Field>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 mb-1">Confirm password</label>
                <Field name="confirmPassword">
                  {({ field, form }) => (
                    <>
                      <PasswordInput
                        id="confirmPassword"
                        value={field.value}
                        onChange={(e) => form.setFieldValue('confirmPassword', e.target.value)}
                        onBlur={field.onBlur}
                        placeholder="Confirm password"
                        error={form.touched.confirmPassword && form.errors.confirmPassword}
                      />
                      {form.touched.confirmPassword && form.errors.confirmPassword && <p className="mt-1 text-sm text-red-600">{form.errors.confirmPassword}</p>}
                    </>
                  )}
                </Field>
              </div>

              <Field name="agreeTerms">
                {({ field, form }) => (
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={(e) => form.setFieldValue('agreeTerms', e.target.checked)}
                      className="mt-1 w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary"
                    />
                    <span className="text-sm text-slate-600">
                      I&apos;ve read and agree with the <a href="/terms" className="text-primary hover:underline">Terms and Conditions</a> and the <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a>.
                    </span>
                  </label>
                )}
              </Field>
              {touched.agreeTerms && errors.agreeTerms && <p className="text-sm text-red-600">{errors.agreeTerms}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-opacity"
              >
                {loading ? 'Creating account…' : 'Sign Up'}
              </button>
            </Form>
          )}
        </Formik>

        <p className="mt-6 text-center text-slate-600 text-sm">
          Already have an account? <Link to={ROUTES.LOGIN} className="text-primary font-medium hover:underline">Log in</Link>
        </p>
    </div>
  );
}
