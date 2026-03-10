import { useState, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { ROUTES } from '../../routes/routeConfig';
import { verifyEmail } from '../../store/actions/authActions';

const CODE_LENGTH = 4;

export default function VerifyEmail() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { loading } = useSelector((s) => s.auth);
  const email = location.state?.email || new URLSearchParams(location.search).get('email') || '';
  const messageFromLogin = location.state?.message || '';
  const [code, setCode] = useState(['', '', '', '']);
  const [apiError, setApiError] = useState('');
  const inputRefs = useRef([]);

  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const next = [...code];
    next[index] = value.slice(-1);
    setCode(next);
    setApiError('');
    if (value && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, CODE_LENGTH);
    if (!pasted) return;
    const next = [...code];
    pasted.split('').forEach((char, i) => { next[i] = char; });
    setCode(next);
    setApiError('');
    const nextFocus = Math.min(pasted.length, CODE_LENGTH - 1);
    inputRefs.current[nextFocus]?.focus();
  };

  const fullCode = code.join('');
  const canSubmit = fullCode.length === CODE_LENGTH && email;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setApiError('');
    const result = await dispatch(verifyEmail({ email, code: fullCode }));
    if (result?.success) {
      navigate(ROUTES.HOME);
    } else {
      setApiError(result?.payload || result?.message || 'Invalid verification code.');
    }
  };

  if (!email) {
    return (
      <div className="w-full max-w-md mx-auto text-center py-8">
        <p className="text-slate-600 mb-4">No email found. Please register first.</p>
        <Link to={ROUTES.REGISTER} className="text-primary font-medium hover:underline">Go to Sign up</Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <Link
        to={ROUTES.LOGIN}
        className="inline-flex items-center text-slate-600 hover:text-slate-800 mb-6"
        aria-label="Back"
      >
        <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back
      </Link>

      <h1 className="text-2xl font-bold text-slate-800 mb-2">Verification Code</h1>
          {messageFromLogin && (
            <p className="text-slate-600 text-sm mb-4 p-3 rounded-lg bg-slate-100">{messageFromLogin}</p>
          )}
          <p className="text-slate-600 text-sm mb-8">We have sent the verification code to your email address</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {apiError && (
              <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">{apiError}</div>
            )}
            <div className="flex justify-center gap-3">
              {code.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={handlePaste}
                  className="w-14 h-14 text-center text-xl font-semibold border border-slate-300 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                  aria-label={`Digit ${index + 1}`}
                />
              ))}
            </div>
            <button
              type="submit"
              disabled={!canSubmit || loading}
              className="w-full py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-primary text-white hover:bg-primary/90 disabled:bg-slate-300 disabled:text-white"
            >
              {loading ? 'Verifying…' : 'Continue'}
            </button>
          </form>

          <p className="mt-6 text-center text-slate-600 text-sm">
            Didn&apos;t receive the code?{' '}
            <button type="button" className="text-primary font-medium hover:underline">
              Resend
            </button>
          </p>
    </div>
  );
}
