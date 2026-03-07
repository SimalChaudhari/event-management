import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { userService } from '../../services/userService';
import PageLayout from '../../components/PageLayout';
import AppDownloadQR from '../../components/AppDownloadQR';
import { updateProfile } from '../../store/actions/authActions';
import { profileUpdateSchema } from '../../validation/authSchemas';
import { INDUSTRY_OPTIONS } from '../../constants/industryOptions';
import { API_URL } from '../../config/env';

function getInitials(firstName, lastName, email) {
  if (firstName && lastName) return `${firstName[0]}${lastName[0]}`.toUpperCase();
  if (firstName) return firstName.slice(0, 2).toUpperCase();
  if (email) return email.slice(0, 2).toUpperCase();
  return '?';
}

function getProfilePictureUrl(user) {
  const raw = user?.profilePicture || user?.profileImage;
  if (!raw) return null;
  if (typeof raw === 'string' && (raw.startsWith('http://') || raw.startsWith('https://'))) return raw;
  return `${API_URL}/${raw.replace(/^\//, '')}`;
}

function getFormFromUser(user) {
  if (!user) {
    return {
      firstName: '', lastName: '', email: '', mobile: '',
      salutation: '', company: '', industry: '', designation: '', linkedinProfile: '',
      address: '', street: '', city: '', state: '', postalCode: '', country: '',
      apartment: '', landmark: '', addressLabel: '', deliveryInstructions: '',
    };
  }
  return {
    firstName: user.firstName ?? '',
    lastName: user.lastName ?? '',
    email: user.email ?? '',
    mobile: user.mobile ?? user.mobileNumber ?? user.phone ?? '',
    salutation: user.salutation ?? '',
    company: user.company ?? '',
    industry: user.industry ?? '',
    designation: user.designation ?? '',
    linkedinProfile: user.linkedinProfile ?? '',
    address: user.address ?? user.street ?? '',
    street: user.street ?? user.address ?? '',
    city: user.city ?? '',
    state: user.state ?? '',
    postalCode: user.postalCode ?? '',
    country: user.country ?? '',
    apartment: user.apartment ?? '',
    landmark: user.landmark ?? '',
    addressLabel: user.addressLabel ?? user.addresses?.[0]?.label ?? '',
    deliveryInstructions: user.deliveryInstructions ?? '',
  };
}

const emptyForm = getFormFromUser(null);

function Row({ label, value, link }) {
  const v = value ?? '—';
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
      <dt className="text-sm text-slate-500 font-medium">{label}</dt>
      <dd className="text-slate-900 font-medium sm:text-right">
        {link ? (
          <a href={link} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors truncate block">
            {v}
          </a>
        ) : (
          <span className={v === '—' ? 'text-slate-400' : ''}>{v}</span>
        )}
      </dd>
    </div>
  );
}

function Field({ id, label, name, type = 'text', form, formErrors, onChange, placeholder, required, className = '' }) {
  return (
    <div className={className}>
      <label htmlFor={id} className="block text-sm font-medium text-slate-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input
        id={id}
        type={type}
        name={name}
        value={form[name] ?? ''}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
      />
      {formErrors[name] && <p className="mt-1 text-sm text-red-600">{formErrors[name]}</p>}
    </div>
  );
}

export default function Profile() {
  const dispatch = useDispatch();
  const { authUser } = useSelector((s) => s.auth);
  const [qr, setQr] = useState({ qrCodeImage: null, qrCodeId: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [formErrors, setFormErrors] = useState({});
  const [submitLoading, setSubmitLoading] = useState(false);

  useEffect(() => {
    if (!authUser?.id) return;
    let cancelled = false;
    userService
      .getMyQRCode(authUser.id)
      .then(({ data }) => {
        if (!cancelled && data?.data) {
          setQr({ qrCodeImage: data.data.qrCodeImage, qrCodeId: data.data.qrCodeId });
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.response?.data?.message || 'Failed to load QR code.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [authUser?.id]);

  useEffect(() => {
    if (authUser && !isEditing) {
      setForm(getFormFromUser(authUser));
      setFormErrors({});
    }
  }, [authUser, isEditing]);

  const handleEdit = () => {
    setForm(getFormFromUser(authUser));
    setFormErrors({});
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormErrors({});
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) setFormErrors((prev) => ({ ...prev, [name]: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormErrors({});
    try {
      await profileUpdateSchema.validate(form, { abortEarly: false });
    } catch (err) {
      const next = {};
      err.inner?.forEach((e) => { if (e.path) next[e.path] = e.message; });
      setFormErrors(next);
      return;
    }
    setSubmitLoading(true);
    const payload = { ...form };
    if (!payload.street && payload.address) payload.street = payload.address;
    const result = await dispatch(updateProfile(payload));
    setSubmitLoading(false);
    if (result?.success) setIsEditing(false);
  };

  const handleDownloadQR = () => {
    if (!qr.qrCodeImage) return;
    const link = document.createElement('a');
    link.href = qr.qrCodeImage;
    link.download = 'evential-my-qr.png';
    link.click();
  };

  const fullName = [authUser?.firstName, authUser?.lastName].filter(Boolean).join(' ') || 'User';
  const initials = getInitials(authUser?.firstName, authUser?.lastName, authUser?.email);

  const profileHero = (
    <div className="bg-gradient-to-b from-[#71C0BB] to-[#010a08] px-6 pt-8 pb-6 md:pt-10 md:pb-8">
      <div className="text-center mb-6">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white drop-shadow-sm">My Profile</h1>
        <p className="mt-2 text-white/90 text-sm md:text-base">Manage your account and event details</p>
        <div className="mt-4 mx-auto w-12 h-0.5 bg-white/50 rounded-full" aria-hidden />
      </div>
      <div className="border-t border-white/30 pt-6 md:pt-6">
        <div className="flex gap-4 md:gap-5">
          <div className="w-14 h-14 md:w-20 md:h-20 rounded-full bg-white flex items-center justify-center text-lg md:text-2xl font-semibold text-[#5aa8a3] shrink-0 ring-4 ring-white/40 shadow-lg">
            {getProfilePictureUrl(authUser) ? (
              <img src={getProfilePictureUrl(authUser)} alt="" className="w-full h-full rounded-full object-cover" />
            ) : (
              initials
            )}
          </div>
          <div className="min-w-0 text-center md:text-left">
            <h2 className="text-lg md:text-2xl font-bold text-white truncate drop-shadow-sm">{fullName}</h2>
            {authUser?.email && (
              <p className="text-white/90 text-sm truncate mt-0.5">{authUser.email}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <PageLayout hero={profileHero}>
        <div className="p-5 md:p-8">
          {/* Profile information – grid of sections */}
          <section className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden mb-5 md:mb-6">
            <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/80 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-base font-semibold text-slate-800">Profile information</h2>
                <p className="text-slate-500 text-sm mt-0.5">Your account and contact details</p>
              </div>
              {!isEditing ? (
                <button
                  type="button"
                  onClick={handleEdit}
                  className="px-4 py-2 text-sm font-medium text-primary bg-primary/10 border border-primary/30 rounded-lg hover:bg-primary/20 transition-colors"
                >
                  Edit profile
                </button>
              ) : null}
            </div>
            {!isEditing ? (
              <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-5 md:gap-6">
                {/* Basic */}
                <div className="rounded-lg bg-slate-50/80 border border-slate-100 p-4">
                  <h3 className="text-sm font-semibold text-slate-700 mb-3">Basic information</h3>
                  <dl className="space-y-2">
                    <Row label="Salutation" value={authUser?.salutation} />
                    <Row label="First name" value={authUser?.firstName} />
                    <Row label="Last name" value={authUser?.lastName} />
                    <Row label="Email" value={authUser?.email} link={authUser?.email ? `mailto:${authUser.email}` : null} />
                    <Row label="Mobile" value={authUser?.mobile ?? authUser?.mobileNumber ?? authUser?.phone} link={authUser?.mobile ? `tel:${authUser.mobile}` : null} />
                  </dl>
                </div>
                {/* Work */}
                <div className="rounded-lg bg-slate-50/80 border border-slate-100 p-4">
                  <h3 className="text-sm font-semibold text-slate-700 mb-3">Work</h3>
                  <dl className="space-y-2">
                    <Row label="Company" value={authUser?.company} />
                    <Row label="Industry" value={authUser?.industry} />
                    <Row label="Designation" value={authUser?.designation} />
                  </dl>
                </div>
                {/* Social */}
                <div className="rounded-lg bg-slate-50/80 border border-slate-100 p-4">
                  <h3 className="text-sm font-semibold text-slate-700 mb-3">Social</h3>
                  <dl className="space-y-2">
                    <Row label="LinkedIn profile" value={authUser?.linkedinProfile} link={authUser?.linkedinProfile || null} />
                  </dl>
                </div>
                {/* Address */}
                <div className="rounded-lg bg-slate-50/80 border border-slate-100 p-4">
                  <h3 className="text-sm font-semibold text-slate-700 mb-3">Address</h3>
                  {authUser?.formattedAddress ? (
                    <dl className="space-y-2">
                      <Row label="Full address" value={authUser.formattedAddress} />
                      <Row label="Street" value={authUser?.street ?? authUser?.address} />
                      <Row label="Apartment" value={authUser?.apartment} />
                      <Row label="Landmark" value={authUser?.landmark} />
                      <Row label="City" value={authUser?.city} />
                      <Row label="State" value={authUser?.state} />
                      <Row label="Postal code" value={authUser?.postalCode} />
                      <Row label="Country" value={authUser?.country} />
                      <Row label="Label" value={authUser?.addressLabel} />
                      <Row label="Delivery instructions" value={authUser?.deliveryInstructions} />
                    </dl>
                  ) : (
                    <p className="text-slate-500 text-sm">No address saved.</p>
                  )}
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="p-5 space-y-6">
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-slate-700 border-b border-slate-200 pb-2">Basic information</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field id="salutation" label="Salutation" name="salutation" form={form} formErrors={formErrors} onChange={handleChange} placeholder="e.g. Mr, Mrs, Miss" />
                    <Field id="firstName" label="First name" name="firstName" form={form} formErrors={formErrors} onChange={handleChange} required />
                    <Field id="lastName" label="Last name" name="lastName" form={form} formErrors={formErrors} onChange={handleChange} required />
                    <Field id="email" label="Email" name="email" type="email" form={form} formErrors={formErrors} onChange={handleChange} required />
                    <Field id="mobile" label="Mobile" name="mobile" form={form} formErrors={formErrors} onChange={handleChange} className="sm:col-span-2" />
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-slate-700 border-b border-slate-200 pb-2">Work</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field id="company" label="Company" name="company" form={form} formErrors={formErrors} onChange={handleChange} />
                    <div>
                      <label htmlFor="profile-industry" className="block text-sm font-medium text-slate-700 mb-1">Industry</label>
                      <select
                        id="profile-industry"
                        name="industry"
                        value={form.industry}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                      >
                        <option value="">Select industry</option>
                        {INDUSTRY_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                      {formErrors.industry && <p className="mt-1 text-sm text-red-600">{formErrors.industry}</p>}
                    </div>
                    <Field id="designation" label="Designation" name="designation" form={form} formErrors={formErrors} onChange={handleChange} className="sm:col-span-2" />
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-slate-700 border-b border-slate-200 pb-2">Social</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field id="linkedinProfile" label="LinkedIn profile URL" name="linkedinProfile" type="url" form={form} formErrors={formErrors} onChange={handleChange} placeholder="https://linkedin.com/in/..." className="sm:col-span-2" />
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-slate-700 border-b border-slate-200 pb-2">Address</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field id="address" label="Street address" name="address" form={form} formErrors={formErrors} onChange={handleChange} className="sm:col-span-2" />
                    <Field id="apartment" label="Apartment / Unit" name="apartment" form={form} formErrors={formErrors} onChange={handleChange} />
                    <Field id="landmark" label="Landmark" name="landmark" form={form} formErrors={formErrors} onChange={handleChange} />
                    <Field id="city" label="City" name="city" form={form} formErrors={formErrors} onChange={handleChange} />
                    <Field id="state" label="State / Province" name="state" form={form} formErrors={formErrors} onChange={handleChange} />
                    <Field id="postalCode" label="Postal code" name="postalCode" form={form} formErrors={formErrors} onChange={handleChange} />
                    <Field id="country" label="Country" name="country" form={form} formErrors={formErrors} onChange={handleChange} />
                    <Field id="addressLabel" label="Address label" name="addressLabel" form={form} formErrors={formErrors} onChange={handleChange} placeholder="e.g. Home, Office" />
                    <Field id="deliveryInstructions" label="Delivery instructions" name="deliveryInstructions" form={form} formErrors={formErrors} onChange={handleChange} className="sm:col-span-2" />
                  </div>
                </div>
                <div className="flex gap-2 pt-2 border-t border-slate-200">
                  <button
                    type="submit"
                    disabled={submitLoading}
                    className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:opacity-90 disabled:opacity-60 transition-opacity"
                  >
                    {submitLoading ? 'Saving…' : 'Save changes'}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancel}
                    disabled={submitLoading}
                    className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 border border-slate-300 rounded-lg hover:bg-slate-200 disabled:opacity-60 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </section>

          {/* QR code – below profile grid */}
          <section className="bg-slate-50 rounded-xl border border-slate-200 p-5 md:p-6">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Your personal QR code
            </h2>
            <p className="text-slate-600 text-sm mb-4">
              Show this QR at event check-in for faster registration.
            </p>
            {loading && (
              <div className="flex items-center justify-center py-12 rounded-lg bg-slate-100 border border-slate-200">
                <span className="text-slate-500 text-sm">Loading QR code…</span>
              </div>
            )}
            {error && (
              <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                {error}
              </div>
            )}
            {qr.qrCodeImage && !loading && (
              <div className="flex flex-col items-center pt-2">
                <img
                  src={qr.qrCodeImage}
                  alt="Your QR code"
                  className="w-40 h-40 rounded-lg border border-slate-200 bg-white shadow-sm"
                />
                <button
                  type="button"
                  onClick={handleDownloadQR}
                  className="mt-4 px-5 py-2.5 text-sm font-medium text-primary bg-primary/10 border border-primary/30 rounded-lg hover:bg-primary/20 transition-colors"
                >
                  Download QR
                </button>
              </div>
            )}
          </section>

          <section className="mt-6 pt-6 border-t border-slate-200">
            <AppDownloadQR />
          </section>

          <p className="text-slate-500 text-sm mt-6 pt-4 border-t border-slate-200">
            Manage your account and event registrations. More options coming soon.
          </p>
        </div>
    </PageLayout>
  );
}
