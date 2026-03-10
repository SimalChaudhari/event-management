import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Formik, Form, Field } from 'formik';
import { ROUTES } from '../../routes/routeConfig';
import { forgotPassword } from '../../store/actions/authActions';
import { forgotPasswordSchema } from '../../validation/authSchemas';

const inputClass = 'w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary';
const inputErrorClass = 'w-full px-3 py-2.5 border border-red-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-300 focus:border-red-500';

export default function ForgotPassword() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [apiError, setApiError] = useState('');
  const [submittedEmail, setSubmittedEmail] = useState('');

  const handleSubmit = async (values) => {
    setApiError('');
    setLoading(true);
    const result = await dispatch(forgotPassword(values.email));
    setLoading(false);
    if (result?.success) {
      setSubmittedEmail(values.email);
      setShowSuccessModal(true);
    } else {
      setApiError(result?.message || 'Request failed.');
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <h1 className="text-2xl font-bold text-slate-800 mb-2">Forgot Password</h1>
      <p className="text-slate-600 text-sm mb-6">Enter your email and we&apos;ll send an OTP to reset your password.</p>

      <Formik
          initialValues={{ email: '' }}
          validationSchema={forgotPasswordSchema}
          onSubmit={handleSubmit}
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
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-opacity"
              >
                {loading ? 'Sending…' : 'Send'}
              </button>
            </Form>
          )}
        </Formik>

      <p className="mt-6 text-center">
        <Link to={ROUTES.LOGIN} className="text-sm text-primary hover:underline">← Back to log in</Link>
      </p>

      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" aria-modal="true" role="dialog">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 text-center">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-slate-800 mb-2">OTP Sent</h2>
            <p className="text-slate-600 text-sm mb-6">
              We&apos;ve sent an OTP to your email. Enter it on the next page along with your new password.
            </p>
            <Link
              to={`${ROUTES.RESET_PASSWORD}${submittedEmail ? `?email=${encodeURIComponent(submittedEmail)}` : ''}`}
              className="block w-full py-3 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 mb-2"
              onClick={() => setShowSuccessModal(false)}
            >
              Enter OTP & Reset Password
            </Link>
            <button
              type="button"
              onClick={() => navigate(ROUTES.LOGIN)}
              className="w-full py-2 text-sm text-slate-600 hover:text-slate-800"
            >
              Back to Log in
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
