import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Formik, Form, Field } from 'formik';
import { ROUTES } from '../../routes/routeConfig';
import { login } from '../../store/actions/authActions';
import PasswordInput from '../../components/PasswordInput';
import { loginSchema } from '../../validation/authSchemas';

import logo from '../../assets/logo.png';

const inputClass = 'w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary';
const inputErrorClass = 'w-full px-3 py-2.5 border border-red-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-300 focus:border-red-500';

export default function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { loading } = useSelector((s) => s.auth);
  const [apiError, setApiError] = useState('');
  const successMessage = location.state?.message;

  const handleSubmit = async (values) => {
    setApiError('');
    const result = await dispatch(login({ email: values.email, password: values.password }));
    if (result.success) {
      navigate(ROUTES.HOME);
    } else if (result.requiresVerification) {
      navigate(ROUTES.VERIFY_EMAIL, {
        state: { email: values.email, message: result.message },
      });
    } else {
      setApiError(result.payload || result.message || 'Invalid email or password.');
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="flex justify-start md:justify-center mb-6">
        <img src={logo} alt="Logo" className="object-contain" />
      </div>
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Welcome!</h1>

      <Formik
          initialValues={{ email: '', password: '' }}
          validationSchema={loginSchema}
          onSubmit={handleSubmit}
        >
          {({ errors, touched }) => (
            <Form className="space-y-4">
              {successMessage && (
                <div className="p-3 rounded-lg bg-green-50 text-green-700 text-sm">{successMessage}</div>
              )}
              {apiError && (
                <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">{apiError}</div>
              )}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                <Field
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Email Address"
                  className={touched.email && errors.email ? inputErrorClass : inputClass}
                />
                {touched.email && errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                )}
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
                        placeholder="Password"
                        error={form.touched.password && form.errors.password}
                      />
                      {form.touched.password && form.errors.password && (
                        <p className="mt-1 text-sm text-red-600">{form.errors.password}</p>
                      )}
                    </>
                  )}
                </Field>
              </div>
              <div className="text-right">
                <Link to={ROUTES.FORGOT_PASSWORD} state={{ fromAuth: true }} className="text-sm text-primary hover:underline">Forgot password?</Link>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-opacity"
              >
                {loading ? 'Signing in…' : 'Login'}
              </button>
            </Form>
          )}
        </Formik>

        <p className="mt-6 text-center text-slate-600 text-sm">
          Not a member?{' '}
          <Link to={ROUTES.REGISTER} className="text-primary font-medium hover:underline">Signup now</Link>
        </p>

        <div className="mt-8">
          <p className="text-center text-slate-500 text-sm mb-4">Or continue with</p>
          <div className="flex justify-center gap-4">
            <button type="button" className="w-11 h-11 rounded-full bg-red-500 text-white flex items-center justify-center text-lg font-bold hover:opacity-90" aria-label="Google">G</button>
            <button type="button" className="w-11 h-11 rounded-full bg-slate-900 text-white flex items-center justify-center hover:opacity-90" aria-label="Apple">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
            </button>
            <button type="button" className="w-11 h-11 rounded-full bg-[#0A66C2] text-white flex items-center justify-center text-xs font-bold hover:opacity-90" aria-label="LinkedIn">in</button>
            <button type="button" className="w-11 h-11 rounded-full bg-[#1877F2] text-white flex items-center justify-center text-lg font-bold hover:opacity-90" aria-label="Facebook">f</button>
          </div>
        </div>
    </div>
  );
}
