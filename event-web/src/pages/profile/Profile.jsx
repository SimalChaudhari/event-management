import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { updateProfile } from "../../store/actions/authActions";
import { profileUpdateSchema } from "../../validation/authSchemas";
import { INDUSTRY_OPTIONS } from "../../constants/industryOptions";
import { API_URL } from "../../config/env";

function getInitials(firstName, lastName, email) {
  if (firstName && lastName)
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  if (firstName) return firstName.slice(0, 2).toUpperCase();
  if (email) return email.slice(0, 2).toUpperCase();
  return "?";
}

function getProfilePictureUrl(user, cacheBust = true) {
  const raw = user?.profilePicture || user?.profileImage;
  if (!raw) return null;
  if (
    typeof raw === "string" &&
    (raw.startsWith("http://") || raw.startsWith("https://"))
  ) {
    return cacheBust && user?.updatedAt
      ? `${raw}${raw.includes("?") ? "&" : "?"}t=${new Date(user.updatedAt).getTime()}`
      : raw;
  }
  const base = API_URL || "";
  const path = raw.replace(/^\//, "");
  const url = base ? `${base}/${path}` : `/${path}`;
  if (cacheBust && user?.updatedAt) {
    return `${url}${url.includes("?") ? "&" : "?"}t=${new Date(user.updatedAt).getTime()}`;
  }
  return url;
}

function getFormFromUser(user) {
  if (!user) {
    return {
      firstName: "",
      lastName: "",
      email: "",
      mobile: "",
      salutation: "",
      company: "",
      industry: "",
      designation: "",
      linkedinProfile: "",
      address: "",
      street: "",
      city: "",
      state: "",
      postalCode: "",
      country: "",
      apartment: "",
      landmark: "",
      addressLabel: "",
      deliveryInstructions: "",
    };
  }
  return {
    firstName: user.firstName ?? "",
    lastName: user.lastName ?? "",
    email: user.email ?? "",
    mobile: user.mobile ?? user.mobileNumber ?? user.phone ?? "",
    salutation: user.salutation ?? "",
    company: user.company ?? "",
    industry: user.industry ?? "",
    designation: user.designation ?? "",
    linkedinProfile: user.linkedinProfile ?? "",
    address: user.address ?? user.street ?? "",
    street: user.street ?? user.address ?? "",
    city: user.city ?? "",
    state: user.state ?? "",
    postalCode: user.postalCode ?? "",
    country: user.country ?? "",
    apartment: user.apartment ?? "",
    landmark: user.landmark ?? "",
    addressLabel: user.addressLabel ?? user.addresses?.[0]?.label ?? "",
    deliveryInstructions: user.deliveryInstructions ?? "",
  };
}

const emptyForm = getFormFromUser(null);

function getFullName(user) {
  if (!user) return "";
  const parts = [user.salutation, user.firstName, user.lastName].filter(
    Boolean,
  );
  return parts.join(" ").trim() || "—";
}

/** Event-Overview style: label: value with muted label, aligned in two-column layout */
function OverviewRow({ label, value, link }) {
  const v = value ?? "—";
  return (
    <div className="flex items-baseline justify-between gap-3 py-2 border-b border-primary/10 last:border-b-0">
      <span className="text-sm text-primary shrink-0 font-medium">
        {label}:
      </span>
      <span className="text-sm text-slate-800 text-right break-words min-w-0">
        {link ? (
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline font-medium"
          >
            {v}
          </a>
        ) : (
          <span className={v === "—" ? "text-primary/60" : "font-medium"}>
            {v}
          </span>
        )}
      </span>
    </div>
  );
}

const IconInfo = () => (
  <svg
    className="w-5 h-5 text-primary shrink-0"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    aria-hidden
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

const IconUser = () => (
  <svg
    className="w-5 h-5 text-blue-500 shrink-0"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    aria-hidden
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
    />
  </svg>
);
const IconBriefcase = () => (
  <svg
    className="w-5 h-5 text-amber-500 shrink-0"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    aria-hidden
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
    />
  </svg>
);
const IconMapPin = () => (
  <svg
    className="w-5 h-5 text-emerald-600 shrink-0"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    aria-hidden
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
    />
  </svg>
);

function Field({
  id,
  label,
  name,
  type = "text",
  form,
  formErrors,
  onChange,
  placeholder,
  required,
  className = "",
}) {
  return (
    <div className={className}>
      <label
        htmlFor={id}
        className="block text-sm font-medium text-primary mb-0.5"
      >
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input
        id={id}
        type={type}
        name={name}
        value={form[name] ?? ""}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full px-2.5 py-1.5 text-sm border border-primary/30 rounded-md focus:ring-2 focus:ring-primary focus:border-primary bg-white"
      />
      {formErrors[name] && (
        <p className="mt-0.5 text-xs text-red-600">{formErrors[name]}</p>
      )}
    </div>
  );
}

export default function Profile() {
  const dispatch = useDispatch();
  const { authUser } = useSelector((s) => s.auth);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [formErrors, setFormErrors] = useState({});
  const [submitLoading, setSubmitLoading] = useState(false);
  const [profilePictureFile, setProfilePictureFile] = useState(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);

  useEffect(() => {
    if (authUser && !isEditing) {
      setForm(getFormFromUser(authUser));
      setFormErrors({});
    }
  }, [authUser, isEditing]);

  useEffect(() => {
    return () => {
      if (profilePicturePreview) URL.revokeObjectURL(profilePicturePreview);
    };
  }, [profilePicturePreview]);

  useEffect(() => {
    if (!showImageModal) return;
    const handleEscape = (e) => {
      if (e.key === "Escape") setShowImageModal(false);
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [showImageModal]);

  const handleEdit = () => {
    setForm(getFormFromUser(authUser));
    setFormErrors({});
    setProfilePictureFile(null);
    setProfilePicturePreview(null);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormErrors({});
    if (profilePicturePreview) URL.revokeObjectURL(profilePicturePreview);
    setProfilePictureFile(null);
    setProfilePicturePreview(null);
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
      err.inner?.forEach((e) => {
        if (e.path) next[e.path] = e.message;
      });
      setFormErrors(next);
      return;
    }
    setSubmitLoading(true);
    const payload = { ...form };
    if (!payload.street && payload.address) payload.street = payload.address;
    const result = await dispatch(updateProfile(payload, profilePictureFile || undefined));
    setSubmitLoading(false);
    if (result?.success) {
      setIsEditing(false);
      if (profilePicturePreview) URL.revokeObjectURL(profilePicturePreview);
      setProfilePictureFile(null);
      setProfilePicturePreview(null);
    }
  };

  return (
    <div className="p-4 md:p-6">
      <section className="rounded-lg border border-primary/20 bg-white shadow-sm overflow-hidden mb-4">
        <div className="px-4 py-3 border-b border-primary/20 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <IconInfo />
            <div>
              <h2 className="text-base font-semibold text-slate-800">
                Profile information
              </h2>
              <p className="text-primary/90 text-sm mt-0.5">
                Your account and contact details
              </p>
            </div>
          </div>
          {!isEditing ? (
            <button
              type="button"
              onClick={handleEdit}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary bg-primary/10 border border-primary/30 rounded-md hover:bg-primary/20 transition-colors"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                />
              </svg>
              Edit profile
            </button>
          ) : null}
        </div>
        {!isEditing ? (
          <div className="p-4 space-y-5">
            {/* Basic information – Event Overview style */}
            <div>
              <div className="flex items-center gap-2 pb-2 border-b border-primary/20">
                <IconUser />
                <h3 className="text-base font-semibold text-slate-800">
                  Basic information
                </h3>
              </div>
              <div className="pt-3 flex flex-col sm:flex-row gap-4">
                <div className="shrink-0">
                  <div
                    role={getProfilePictureUrl(authUser) ? "button" : undefined}
                    tabIndex={getProfilePictureUrl(authUser) ? 0 : undefined}
                    onClick={() =>
                      getProfilePictureUrl(authUser) &&
                      setShowImageModal(true)
                    }
                    onKeyDown={(e) =>
                      getProfilePictureUrl(authUser) &&
                      (e.key === "Enter" || e.key === " ") &&
                      setShowImageModal(true)
                    }
                    className={`w-20 h-20 rounded-full bg-primary/15 border-2 border-primary/30 overflow-hidden flex items-center justify-center text-xl font-semibold text-primary ${getProfilePictureUrl(authUser) ? "cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2" : ""}`}
                  >
                    {getProfilePictureUrl(authUser) ? (
                      <img
                        key={`avatar-${authUser?.profilePicture || authUser?.profileImage || ""}-${authUser?.updatedAt || ""}`}
                        src={getProfilePictureUrl(authUser)}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      getInitials(
                        authUser?.firstName,
                        authUser?.lastName,
                        authUser?.email
                      )
                    )}
                  </div>
                </div>
                <div className="flex-1 min-w-0 space-y-0">
                  <OverviewRow label="Full name" value={getFullName(authUser)} />
                  <OverviewRow
                    label="Email"
                    value={authUser?.email}
                    link={authUser?.email ? `mailto:${authUser.email}` : null}
                  />
                  <OverviewRow
                    label="Mobile"
                    value={
                      authUser?.mobile ??
                      authUser?.mobileNumber ??
                      authUser?.phone
                    }
                    link={authUser?.mobile ? `tel:${authUser.mobile}` : null}
                  />
                </div>
              </div>
            </div>
            {/* Work & Social */}
            <div>
              <div className="flex items-center gap-2 pb-2 border-b border-primary/20">
                <IconBriefcase />
                <h3 className="text-base font-semibold text-slate-800">
                  Work & Social
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-0 pt-3">
                <div className="space-y-0">
                  <OverviewRow label="Company" value={authUser?.company} />
                  <OverviewRow label="Industry" value={authUser?.industry} />
                  <OverviewRow
                    label="Designation"
                    value={authUser?.designation}
                  />
                </div>
                <div className="space-y-0">
                  <OverviewRow
                    label="LinkedIn profile"
                    value={authUser?.linkedinProfile}
                    link={authUser?.linkedinProfile || null}
                  />
                </div>
              </div>
            </div>
            {/* Address – Event Overview style */}
            <div>
              <div className="flex items-center gap-2 pb-2 border-b border-primary/20">
                <IconMapPin />
                <h3 className="text-base font-semibold text-slate-800">
                  Address
                </h3>
              </div>
              {authUser?.formattedAddress ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-0 pt-3">
                  <div className="space-y-0">
                    <OverviewRow
                      label="Full address"
                      value={authUser.formattedAddress}
                    />
                    <OverviewRow
                      label="Street"
                      value={authUser?.street ?? authUser?.address}
                    />
                    <OverviewRow
                      label="Apartment"
                      value={authUser?.apartment}
                    />
                    <OverviewRow label="Landmark" value={authUser?.landmark} />
                    <OverviewRow label="City" value={authUser?.city} />
                  </div>
                  <div className="space-y-0">
                    <OverviewRow label="State" value={authUser?.state} />
                    <OverviewRow
                      label="Postal code"
                      value={authUser?.postalCode}
                    />
                    <OverviewRow label="Country" value={authUser?.country} />
                    <OverviewRow label="Label" value={authUser?.addressLabel} />
                    <OverviewRow
                      label="Delivery instructions"
                      value={authUser?.deliveryInstructions}
                    />
                  </div>
                </div>
              ) : (
                <p className="text-primary/80 text-sm py-3">
                  No address saved.
                </p>
              )}
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-primary/20">
                <IconUser />
                <h3 className="text-sm font-semibold text-primary uppercase tracking-wider">
                  Basic information
                </h3>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="shrink-0 flex flex-col items-start gap-2">
                  <div className="w-20 h-20 rounded-full bg-primary/15 border-2 border-primary/30 overflow-hidden flex items-center justify-center text-xl font-semibold text-primary">
                    {profilePicturePreview ? (
                      <img
                        src={profilePicturePreview}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : getProfilePictureUrl(authUser) ? (
                      <img
                        key={`edit-avatar-${authUser?.profilePicture || authUser?.profileImage || ""}-${authUser?.updatedAt || ""}`}
                        src={getProfilePictureUrl(authUser)}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      getInitials(form.firstName, form.lastName, form.email)
                    )}
                  </div>
                  <label className="text-sm font-medium text-primary cursor-pointer">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 border border-primary/30 rounded-md hover:bg-primary/10 transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Change photo
                      <input
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/gif"
                        className="sr-only"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setProfilePictureFile(file);
                            setProfilePicturePreview(URL.createObjectURL(file));
                          }
                        }}
                      />
                    </span>
                  </label>
                </div>
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field
                  id="salutation"
                  label="Salutation"
                  name="salutation"
                  form={form}
                  formErrors={formErrors}
                  onChange={handleChange}
                  placeholder="e.g. Mr, Mrs, Miss"
                />
                <Field
                  id="firstName"
                  label="First name"
                  name="firstName"
                  form={form}
                  formErrors={formErrors}
                  onChange={handleChange}
                  required
                />
                <Field
                  id="lastName"
                  label="Last name"
                  name="lastName"
                  form={form}
                  formErrors={formErrors}
                  onChange={handleChange}
                  required
                />
                <Field
                  id="email"
                  label="Email"
                  name="email"
                  type="email"
                  form={form}
                  formErrors={formErrors}
                  onChange={handleChange}
                  required
                />
                <Field
                  id="mobile"
                  label="Mobile"
                  name="mobile"
                  form={form}
                  formErrors={formErrors}
                  onChange={handleChange}
                  className="sm:col-span-2"
                />
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-primary/20">
                <IconBriefcase />
                <h3 className="text-sm font-semibold text-primary uppercase tracking-wider">
                  Work & Social
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field
                  id="company"
                  label="Company"
                  name="company"
                  form={form}
                  formErrors={formErrors}
                  onChange={handleChange}
                />
                <div>
                  <label
                    htmlFor="profile-industry"
                    className="block text-sm font-medium text-primary mb-0.5"
                  >
                    Industry
                  </label>
                  <select
                    id="profile-industry"
                    name="industry"
                    value={form.industry}
                    onChange={handleChange}
                    className="w-full px-3 py-1.5 text-sm border border-primary/30 rounded-md focus:ring-2 focus:ring-primary focus:border-primary bg-white"
                  >
                    <option value="">Select industry</option>
                    {INDUSTRY_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  {formErrors.industry && (
                    <p className="mt-0.5 text-xs text-red-600">
                      {formErrors.industry}
                    </p>
                  )}
                </div>
                <Field
                  id="designation"
                  label="Designation"
                  name="designation"
                  form={form}
                  formErrors={formErrors}
                  onChange={handleChange}
                />
                <Field
                  id="linkedinProfile"
                  label="LinkedIn profile URL"
                  name="linkedinProfile"
                  type="url"
                  form={form}
                  formErrors={formErrors}
                  onChange={handleChange}
                  placeholder="https://linkedin.com/in/..."
                  className="sm:col-span-2"
                />
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-primary/20">
                <IconMapPin />
                <h3 className="text-sm font-semibold text-primary uppercase tracking-wider">
                  Address
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field
                  id="address"
                  label="Street address"
                  name="address"
                  form={form}
                  formErrors={formErrors}
                  onChange={handleChange}
                  className="sm:col-span-2"
                />
                <Field
                  id="apartment"
                  label="Apartment / Unit"
                  name="apartment"
                  form={form}
                  formErrors={formErrors}
                  onChange={handleChange}
                />
                <Field
                  id="landmark"
                  label="Landmark"
                  name="landmark"
                  form={form}
                  formErrors={formErrors}
                  onChange={handleChange}
                />
                <Field
                  id="city"
                  label="City"
                  name="city"
                  form={form}
                  formErrors={formErrors}
                  onChange={handleChange}
                />
                <Field
                  id="state"
                  label="State / Province"
                  name="state"
                  form={form}
                  formErrors={formErrors}
                  onChange={handleChange}
                />
                <Field
                  id="postalCode"
                  label="Postal code"
                  name="postalCode"
                  form={form}
                  formErrors={formErrors}
                  onChange={handleChange}
                />
                <Field
                  id="country"
                  label="Country"
                  name="country"
                  form={form}
                  formErrors={formErrors}
                  onChange={handleChange}
                />
                <Field
                  id="addressLabel"
                  label="Address label"
                  name="addressLabel"
                  form={form}
                  formErrors={formErrors}
                  onChange={handleChange}
                  placeholder="e.g. Home, Office"
                />
                <Field
                  id="deliveryInstructions"
                  label="Delivery instructions"
                  name="deliveryInstructions"
                  form={form}
                  formErrors={formErrors}
                  onChange={handleChange}
                  className="sm:col-span-2"
                />
              </div>
            </div>
            <div className="flex gap-2 pt-3 border-t border-primary/20">
              <button
                type="submit"
                disabled={submitLoading}
                className="px-3 py-1.5 text-sm font-medium text-white bg-primary rounded-md hover:opacity-90 disabled:opacity-60 transition-opacity"
              >
                {submitLoading ? "Saving…" : "Save changes"}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                disabled={submitLoading}
                className="px-3 py-1.5 text-sm font-medium text-primary bg-primary/10 border border-primary/30 rounded-md hover:bg-primary/20 disabled:opacity-60 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </section>

      {/* Profile image modal – same style as admin panel */}
      {showImageModal && getProfilePictureUrl(authUser) && (
        <div
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/95 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Profile picture"
          onClick={() => setShowImageModal(false)}
        >
          <button
            type="button"
            onClick={() => setShowImageModal(false)}
            className="absolute top-5 right-5 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/70 text-white hover:bg-black/90 focus:outline-none focus:ring-2 focus:ring-white"
            aria-label="Close"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div
            className="relative flex max-h-full max-w-full items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={getProfilePictureUrl(authUser)}
              alt="Profile"
              className="max-h-[90vh] w-auto max-w-full object-contain rounded-lg"
            />
          </div>
        </div>
      )}
    </div>
  );
}
