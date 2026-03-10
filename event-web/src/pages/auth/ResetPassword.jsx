import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Formik, Form, Field } from 'formik';
import { ROUTES } from '../../routes/routeConfig';
import { resetPassword } from '../../store/actions/authActions';
import PasswordInput from '../../components/PasswordInput';
import { resetPasswordSchema } from '../../validation/authSchemas';

const inputClass = 'w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary';
const inputErrorClass = 'w-full px-3 py-2.5 border border-red-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-300 focus:border-red-500';

export default function ResetPassword() {
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [apiError, setApiError] = useState('');
  const emailFromQuery = searchParams.get('email') || '';

  const handleSubmit = async (values) => {
    const result = await dispatch(resetPassword({
      email: values.email,
      otp: values.otp,
      newPassword: values.newPassword,
    }));
    if (result?.success) {
      navigate(ROUTES.LOGIN);
    } else {
      setApiError(result?.message || 'Reset failed.');
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Reset Password</h1>

      <Formik
            initialValues={{
              email: emailFromQuery,
              otp: '',
              newPassword: '',
              confirmPassword: '',
            }}
            validationSchema={resetPasswordSchema}
            onSubmit={handleSubmit}
            enableReinitialize
          >
            {({ errors, touched }) => (
              <Form className="space-y-4">
                {apiError && (
                  <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">{apiError}</div>
                )}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                  <Field
                    id="email"
                    name="email"
                    type="email"
                    placeholder="name@email.com"
                    className={touched.email && errors.email ? inputErrorClass : inputClass}
                  />
                  {touched.email && errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                </div>

                <div>
                  <label htmlFor="otp" className="block text-sm font-medium text-slate-700 mb-1">OTP (6 digits)</label>
                  <Field name="otp">
                    {({ field, form }) => (
                      <input
                        {...field}
                        id="otp"
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        placeholder="000000"
                        onChange={(e) => form.setFieldValue('otp', e.target.value.replace(/\D/g, '').slice(0, 6))}
                        className={touched.otp && errors.otp ? inputErrorClass : inputClass}
                      />
                    )}
                  </Field>
                  {touched.otp && errors.otp && <p className="mt-1 text-sm text-red-600">{errors.otp}</p>}
                </div>

                <div>
                  <h2 className="text-sm font-medium text-slate-700 mb-2">Reset Password</h2>
                  <label htmlFor="newPassword" className="block text-xs text-slate-500 mb-1">Create a password</label>
                  <Field name="newPassword">
                    {({ field, form }) => (
                      <>
                        <PasswordInput
                          id="newPassword"
                          value={field.value}
                          onChange={(e) => form.setFieldValue('newPassword', e.target.value)}
                          onBlur={field.onBlur}
                          placeholder="Create a password"
                          error={form.touched.newPassword && form.errors.newPassword}
                        />
                        {form.touched.newPassword && form.errors.newPassword && (
                          <p className="mt-1 text-sm text-red-600">{form.errors.newPassword}</p>
                        )}
                      </>
                    )}
                  </Field>
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-xs text-slate-500 mb-1">Confirm password</label>
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
                        {form.touched.confirmPassword && form.errors.confirmPassword && (
                          <p className="mt-1 text-sm text-red-600">{form.errors.confirmPassword}</p>
                        )}
                      </>
                    )}
                  </Field>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-opacity"
                >
                  Update and Back to Login
                </button>
              </Form>
            )}
          </Formik>

      <p className="mt-4 text-center">
        <Link to={ROUTES.LOGIN} className="text-sm text-primary hover:underline">← Back to log in</Link>
      </p>
    </div>
  );
}
