import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Form } from 'react-bootstrap';
import publicAxiosInstance from '../../../configs/publicAxiosInstance';
import axiosInstance from '../../../configs/axiosInstance';

import physicalScanImg from '../../../assets/scan/physical.png';
import mobileScanImg from '../../../assets/scan/mobile.png';

let Html5QrcodeLib = null;
try {
  Html5QrcodeLib = require('html5-qrcode').Html5Qrcode;
} catch (_) {}

const TEAL = '#00D4AA';
const ORANGE = '#f97316';
const SCANNER_STYLES = {
  wrapper: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    background: 'linear-gradient(180deg, #e2e8f0 0%, #cbd5e1 40%, #e2e8f0 100%)',
    color: '#1e293b',
    fontFamily: '"Inter", "Segoe UI", system-ui, sans-serif',
    padding: 0,
    margin: 0,
  },
  topBar: {
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px 20px',
    borderBottom: '1px solid rgba(255,255,255,0.1)',
    background: 'linear-gradient(90deg, #0d9488 0%, #0f766e 100%)',
    color: '#ffffff',
    boxShadow: '0 2px 12px rgba(0,0,0,0.2)',
  },
  backLink: {
    color: TEAL,
    fontSize: '14px',
    fontWeight: 500,
    textDecoration: 'none',
    cursor: 'pointer',
    padding: '8px 14px',
    borderRadius: '10px',
    border: '1px solid rgba(0, 212, 170, 0.4)',
    background: 'transparent',
    transition: 'background 0.2s, border-color 0.2s, color 0.2s',
  },
  mainCenter: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-start',
    padding: '24px 16px',
    minHeight: 0,
    overflow: 'auto',
  },
  card: {
    width: '100%',
    maxWidth: '560px',
    borderRadius: '16px',
    padding: '24px',
    marginBottom: '20px',
    background: 'rgba(255, 255, 255, 0.92)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    border: '1px solid rgba(255, 255, 255, 0.6)',
    boxShadow: '0 4px 24px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.9)',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    alignItems: 'center',
    color: '#1e293b',
  },
  cardContentWidth: { maxWidth: '560px' },
  cardAccentOrange: {
    borderLeft: '8px solid ' + ORANGE,
    borderBottom: '8px solid ' + ORANGE,
  },
  cardAccentTeal: {
    borderLeft: '8px solid ' + TEAL,
    borderBottom: '8px solid ' + TEAL,
  },
  cardIcon: {
    width: 'clamp(120px, 28vw, 220px)',
    height: 'clamp(120px, 28vw, 220px)',
    minWidth: 120,
    minHeight: 120,
    maxWidth: '100%',
    objectFit: 'contain',
    flexShrink: 0,
  },
  cardBody: { flex: 1, minWidth: 0 },
  cardTitle: { fontSize: '1.1rem', fontWeight: 700, marginBottom: 14, letterSpacing: '0.02em' },
  input: {
    width: '100%',
    padding: '14px 16px',
    fontSize: '1rem',
    letterSpacing: '0.08em',
    background: 'rgba(255, 255, 255, 0.9)',
    border: '1px solid rgba(0, 212, 170, 0.5)',
    borderRadius: '10px',
    color: '#1e293b',
    outline: 'none',
    textAlign: 'center',
    caretColor: TEAL,
    fontWeight: 500,
  },
  inputPhysical: {
    borderColor: 'rgba(249, 115, 22, 0.6)',
    caretColor: ORANGE,
  },
  statusLine: { fontSize: '12px', color: '#475569', marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 },
  statusDot: { width: 6, height: 6, borderRadius: '50%', flexShrink: 0 },
  scanZoneVisual: {
    position: 'relative',
    width: '100%',
    height: 56,
    background: 'rgba(255, 255, 255, 0.7)',
    border: '2px solid rgba(0, 212, 170, 0.5)',
    borderRadius: '10px',
    marginBottom: 14,
    overflow: 'hidden',
  },
  scanLine: {
    position: 'absolute',
    left: 12,
    right: 12,
    height: '2px',
    background: 'linear-gradient(90deg, transparent, rgba(0, 212, 170, 0.9), transparent)',
    animation: 'scanMove 2.2s ease-in-out infinite',
    borderRadius: 1,
  },
  scanNowBtn: {
    width: '100%',
    padding: '12px 20px',
    fontSize: '14px',
    fontWeight: 700,
    letterSpacing: '0.06em',
    background: '#ef4444',
    color: '#ffffff',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    textTransform: 'uppercase',
    transition: 'opacity 0.2s',
  },
  alignHint: { fontSize: '12px', color: '#64748b', marginTop: 10, textAlign: 'center' },
  statusBar: {
    flexShrink: 0,
    width: '100%',
    padding: '16px 20px',
    borderRadius: '12px',
    border: '1px solid rgba(0, 212, 170, 0.5)',
    background: 'rgba(255, 255, 255, 0.92)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 'auto',
  },
  statusBox: {
    padding: '18px 22px',
    borderRadius: '12px',
    textAlign: 'center',
    fontSize: '1.05rem',
    fontWeight: 600,
    letterSpacing: '0.03em',
  },
  statusReady: { color: '#0d9488' },
  statusProcessing: { color: '#d97706' },
  statusSuccess: { color: '#059669' },
  statusError: { color: '#dc2626' },
};

const RegistrationListCheckInScanPage = () => {
  const { shareToken } = useParams();
  const navigate = useNavigate();
  const [eventName, setEventName] = useState('');
  const [eventId, setEventId] = useState(null);
  const [scanValue, setScanValue] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [showMobileSection, setShowMobileSection] = useState(false);
  const [showMobileCard, setShowMobileCard] = useState(false);
  const [cameraScanActive, setCameraScanActive] = useState(false);
  const [cameraFacing, setCameraFacing] = useState('user');
  const [isManualEntry, setIsManualEntry] = useState(false);
  const inputRef = useRef(null);
  const submitTimeoutRef = useRef(null);
  const submittingRef = useRef(false);
  const html5QrRef = useRef(null);

  const fetchEventInfo = useCallback(async () => {
    if (!shareToken) {
      setError('Invalid link');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await publicAxiosInstance.get(
        `/public/events/share/${shareToken}/participants`
      );
      const data = response?.data?.data;
      if (data) {
        setEventId(data.eventId ?? null);
        setEventName(data.eventName || '');
      } else {
        setError('No data received');
      }
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        'Unable to load. Link may be invalid or expired.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [shareToken]);

  useEffect(() => {
    fetchEventInfo();
  }, [fetchEventInfo]);

  useEffect(() => {
    if (!loading && eventId) inputRef.current?.focus();
  }, [loading, eventId, successMsg]);

  const handleSubmit = useCallback(async (e, valueOverride, checkInMethodOverride) => {
    e?.preventDefault();
    if (submittingRef.current) return;
    const userId = (valueOverride !== undefined ? valueOverride : scanValue || '').trim();
    if (!userId) {
      setError('Please scan or enter participant ID.');
      return;
    }
    if (!eventId) {
      setError('Event not loaded.');
      return;
    }
    const method = checkInMethodOverride ?? (isManualEntry ? 'manual' : 'physical_device');
    if (submitTimeoutRef.current) {
      clearTimeout(submitTimeoutRef.current);
      submitTimeoutRef.current = null;
    }
    submittingRef.current = true;
    setError(null);
    setSuccessMsg(null);
    setSubmitting(true);
    try {
      await axiosInstance.post(
        `/attendance/check-in-qr-code/${userId}`,
        { eventId, checkInMethod: method }
      );
      setSuccessMsg('Check-in successful.');
      setScanValue('');
      setTimeout(() => inputRef.current?.focus(), 50);
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        'Check-in failed. Please check the ID and try again.';
      setError(msg);
      setScanValue('');
      setTimeout(() => inputRef.current?.focus(), 50);
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }, [eventId, scanValue, isManualEntry]);

  useEffect(() => {
    if (!cameraScanActive || !eventId || !Html5QrcodeLib) return;
    const el = document.getElementById('camera-scan-box');
    if (!el) return;
    const html5Qr = new Html5QrcodeLib('camera-scan-box');
    html5QrRef.current = html5Qr;
    const config = { fps: 8, qrbox: { width: 280, height: 280 } };
    const facingMode = cameraFacing === 'environment' ? 'environment' : 'user';
    html5Qr.start({ facingMode }, config, (decodedText) => {
      html5Qr.stop().catch(() => {}).then(() => {
        html5QrRef.current = null;
        setCameraScanActive(false);
        handleSubmit(null, decodedText.trim(), 'mobile_camera');
      });
    }, () => {}).catch((err) => {
      setError(err?.message || 'Camera access failed');
      setCameraScanActive(false);
      html5QrRef.current = null;
    });
    return () => {
      if (html5QrRef.current) {
        html5QrRef.current.stop().catch(() => {}).then(() => { html5QrRef.current = null; });
      }
    };
  }, [cameraScanActive, cameraFacing, eventId, handleSubmit]);

  const handleInputChange = useCallback((e) => {
    const value = e.target.value;
    setScanValue(value);
    setError(null);

    if (submitTimeoutRef.current) {
      clearTimeout(submitTimeoutRef.current);
    }

    const trimmed = value.trim();
    if (trimmed.length >= 8) {
      submitTimeoutRef.current = setTimeout(() => {
        submitTimeoutRef.current = null;
        handleSubmit(null, value);
      }, 3000);
    }
  }, [handleSubmit]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit(e);
    }
  }, [handleSubmit]);

  useEffect(() => {
    return () => {
      if (submitTimeoutRef.current) clearTimeout(submitTimeoutRef.current);
    };
  }, []);

  const getStatusConfig = () => {
    if (error) return { style: SCANNER_STYLES.statusError, text: error, icon: '✕' };
    if (successMsg) return { style: SCANNER_STYLES.statusSuccess, text: successMsg, icon: '✓' };
    if (submitting) return { style: SCANNER_STYLES.statusProcessing, text: 'PROCESSING...', icon: '◐' };
    return { style: SCANNER_STYLES.statusReady, text: 'READY — Scan or enter ID (auto check-in in 3s)', icon: '◆' };
  };

  const status = getStatusConfig();

  if (loading) {
    return (
      <div style={SCANNER_STYLES.wrapper}>
        <style>{`
          @keyframes scanMove {
            0%, 100% { top: 24px; opacity: 0.6; }
            50% { top: calc(100% - 24px); opacity: 1; }
          }
          @keyframes pulse {
            0%, 100% { opacity: 0.5; }
            50% { opacity: 1; }
          }
        `}</style>
        <div style={{ padding: '80px 20px', textAlign: 'center', color: '#64748b' }}>
          <div style={{ fontSize: '14px', letterSpacing: '0.2em', marginBottom: '12px' }}>INITIALIZING</div>
          <div style={{ width: 32, height: 32, border: '2px solid #cbd5e1', borderTopColor: TEAL, borderRadius: '50%', margin: '0 auto', animation: 'spin 0.8s linear infinite' }} />
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error && !eventId) {
    return (
      <div style={SCANNER_STYLES.wrapper}>
        <div style={{ ...SCANNER_STYLES.statusBox, ...SCANNER_STYLES.statusError, margin: '40px 20px' }}>
          {error}
        </div>
      </div>
    );
  }

  return (
    <div style={SCANNER_STYLES.wrapper}>
      <style>{`
        @keyframes scanMove {
          0%, 100% { top: 24px; opacity: 0.6; }
          50% { top: calc(100% - 24px); opacity: 1; }
        }
        @keyframes cardFadeIn {
          from {
            opacity: 0;
            transform: translateY(12px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        @keyframes iconFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        @keyframes scanSweep {
          0% { top: 0; opacity: 0.9; }
          100% { top: 100%; opacity: 0.9; }
        }
        .scan-icon-wrap {
          position: relative;
          overflow: hidden;
          display: inline-flex;
        }
        .scan-line-overlay {
          position: absolute;
          left: 0;
          right: 0;
          height: 4px;
          border-radius: 2px;
          pointer-events: none;
          animation: scanSweep 2s ease-in-out infinite;
        }
        .scan-icon-wrap.scan-overlay-orange .scan-line-overlay {
          background: linear-gradient(90deg, transparent, rgba(249, 115, 22, 0.9), transparent);
        }
        .scan-icon-wrap.scan-overlay-teal .scan-line-overlay {
          background: linear-gradient(90deg, transparent, rgba(13, 148, 136, 0.9), transparent);
        }
        .scan-page-card-physical .scan-page-card-icon {
          animation: iconFloat 3s ease-in-out infinite;
        }
        .scan-page-card-mobile .scan-page-card-icon {
          animation: iconFloat 3s ease-in-out infinite;
        }
        .scan-page-card-physical {
          animation: cardFadeIn 0.45s ease-out;
          background: rgba(15, 23, 42, 0.95) !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
          border-left: 8px solid #f97316 !important;
          border-bottom: 8px solid #f97316 !important;
          color: #e2e8f0;
        }
        .scan-page-card-physical .scan-page-card-body {
          color: #e2e8f0;
        }
        .scan-page-card-physical .physical-card-input {
          background: #0f172a !important;
          border-color: rgba(249, 115, 22, 0.5) !important;
          color: #f1f5f9 !important;
        }
        .scan-page-card-physical .physical-card-status-line {
          color: #94a3b8 !important;
        }
        .scan-page-card-mobile {
          animation: cardFadeIn 0.45s ease-out;
        }
        .scan-page-card-mobile-idle {
          flex-direction: column !important;
          align-items: center !important;
        }
        .scan-page-card-mobile-idle .scan-page-card-body {
          width: 100%;
          text-align: center;
        }
        @media (max-width: 768px) {
          .scan-page-card {
            flex-direction: column !important;
            align-items: center !important;
            text-align: center;
          }
          .scan-page-card .scan-page-card-body {
            text-align: left;
            width: 100%;
          }
          .scan-page-card .scan-page-card-icon {
            margin: 0 auto;
          }
          .scan-page-card-mobile .scan-page-card-icon {
            width: clamp(160px, 48vw, 260px) !important;
            height: clamp(160px, 48vw, 260px) !important;
            min-width: 160px !important;
            min-height: 160px !important;
          }
        }
        @media (min-width: 769px) {
          .scan-page-card {
            max-width: 720px !important;
            padding: 28px 32px !important;
            gap: 24px !important;
            margin-bottom: 24px !important;
          }
          .scan-page-card:not(.scan-page-card-mobile) {
            flex-direction: column !important;
            align-items: center !important;
          }
          .scan-page-card:not(.scan-page-card-mobile) .scan-page-card-body {
            text-align: left;
            width: 100%;
          }
          .scan-page-card:not(.scan-page-card-mobile) .scan-page-card-icon {
            width: clamp(140px, 20vw, 260px) !important;
            height: clamp(140px, 20vw, 260px) !important;
            min-width: 140px !important;
            min-height: 140px !important;
            margin: 0 auto;
          }
          .scan-page-card-mobile {
            flex-direction: row !important;
            align-items: flex-start !important;
          }
          .scan-page-card-mobile.scan-page-card-mobile-idle {
            flex-direction: column !important;
            align-items: center !important;
          }
          .scan-page-card-mobile .scan-page-card-icon {
            width: clamp(180px, 28vw, 320px) !important;
            height: clamp(180px, 28vw, 320px) !important;
            min-width: 180px !important;
            min-height: 180px !important;
            margin: 0;
          }
          .scan-page-card-mobile .scan-page-card-body {
            width: 100%;
          }
          .scan-content-width {
            max-width: 720px !important;
          }
        }
      `}</style>

      <header style={SCANNER_STYLES.topBar}>
        <div style={{ padding: '8px 14px', borderRadius: 10, color: 'rgba(255,255,255,0.95)', fontSize: 14, fontWeight: 500 }}>
          {eventName || 'Event'}
        </div>
        <button
          type="button"
          style={{ ...SCANNER_STYLES.backLink, color: '#fff', borderColor: 'rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.15)' }}
          onClick={() => navigate(`/events/registrations/share/${shareToken}`)}
        >
          ← List
        </button>
      </header>

      <main style={SCANNER_STYLES.mainCenter}>
        {/* Status bar on top - READY + refresh */}
        <div style={{ ...SCANNER_STYLES.statusBar, marginBottom: 20, marginTop: 0 }}>
          <span style={{ color: status.style.color, display: 'flex', alignItems: 'center' }}>
            <span style={{ marginRight: 8 }}>{status.icon}</span>
            {status.text}
          </span>
          <button
            type="button"
            style={{ width: 36, height: 36, borderRadius: '50%', border: '1px solid rgba(13,148,136,0.5)', background: 'transparent', color: '#0d9488', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}
            onClick={() => { setError(null); setSuccessMsg(null); inputRef.current?.focus(); }}
            aria-label="Refresh"
          >
            ↻
          </button>
        </div>

        {/* Card + button: centered vertically in space between top and bottom */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: 0, width: '100%' }}>
        {!showMobileSection ? (
          <>
            {/* Physical Device Scan card - black/dark inner */}
            <div className="scan-page-card scan-page-card-physical" style={{ ...SCANNER_STYLES.card, ...SCANNER_STYLES.cardAccentOrange }}>
              <div className="scan-icon-wrap scan-overlay-orange" style={{ position: 'relative', overflow: 'hidden' }}>
                <img src={physicalScanImg} alt="" className="scan-page-card-icon" style={SCANNER_STYLES.cardIcon} />
                <div className="scan-line-overlay" style={{ position: 'absolute', left: 0, right: 0, height: 4, background: 'linear-gradient(90deg, transparent, rgba(249, 115, 22, 0.9), transparent)', borderRadius: 2, animation: 'scanSweep 2s ease-in-out infinite', pointerEvents: 'none' }} />
              </div>
              <div className="scan-page-card-body" style={SCANNER_STYLES.cardBody}>
                <div style={{ ...SCANNER_STYLES.cardTitle, color: ORANGE }}>Physical Device Scan</div>
                <Form onSubmit={handleSubmit}>
                  <Form.Control
                    ref={inputRef}
                    type="text"
                    placeholder="Waiting for handheld input..."
                    value={scanValue}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    autoComplete="off"
                    disabled={submitting}
                    className="physical-card-input"
                    style={{ ...SCANNER_STYLES.input, ...SCANNER_STYLES.inputPhysical }}
                    aria-label="Participant ID"
                  />
                  <Form.Check
                    type="checkbox"
                    id="manual-entry-check"
                    label="Manual entry (admin typed ID)"
                    checked={isManualEntry}
                    onChange={(e) => setIsManualEntry(e.target.checked)}
                    style={{ marginTop: 10, color: 'rgba(255,255,255,0.85)', fontSize: '0.85rem' }}
                  />
                </Form>
                <div className="physical-card-status-line" style={{ ...SCANNER_STYLES.statusLine }}>
                  <span style={{ ...SCANNER_STYLES.statusDot, background: ORANGE }} />
                  <span>{scanValue ? 'Ready to receive' : 'Waiting for handheld input...'}</span>
                </div>
              </div>
            </div>

            {/* Mobile Camera Scan button - card ke niche, right side */}
            <div className="scan-content-width" style={{ width: '100%', maxWidth: 560, marginBottom: 20, display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                style={{
                  padding: '10px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  background: 'rgba(0, 212, 170, 0.12)',
                  border: '1px solid rgba(13, 148, 136, 0.6)',
                  borderRadius: 10,
                  color: '#0d9488',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'background 0.2s, border-color 0.2s',
                }}
                onClick={() => setShowMobileSection(true)}
              >
                <img src={mobileScanImg} alt="" style={{ width: 28, height: 28, objectFit: 'contain' }} />
                <span>Mobile Camera Scan</span>
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Mobile Camera: scan UI - icon left, field/scan zone right */}
            <div className={`scan-page-card scan-page-card-mobile${!cameraScanActive ? ' scan-page-card-mobile-idle' : ''}`} style={{ ...SCANNER_STYLES.card, ...SCANNER_STYLES.cardAccentTeal }}>
                {!cameraScanActive && (
                  <div className="scan-icon-wrap scan-overlay-teal" style={{ position: 'relative', overflow: 'hidden' }}>
                    <img src={mobileScanImg} alt="" className="scan-page-card-icon" style={SCANNER_STYLES.cardIcon} />
                    <div className="scan-line-overlay" style={{ position: 'absolute', left: 0, right: 0, height: 4, background: 'linear-gradient(90deg, transparent, rgba(13, 148, 136, 0.9), transparent)', borderRadius: 2, animation: 'scanSweep 2s ease-in-out infinite', pointerEvents: 'none' }} />
                  </div>
                )}
                <div className="scan-page-card-body" style={SCANNER_STYLES.cardBody}>
                  {!cameraScanActive ? (
                    <>
                      <button
                        type="button"
                        style={{ ...SCANNER_STYLES.scanNowBtn, marginTop: 12 }}
                        onClick={() => {
                          setError(null);
                          if (Html5QrcodeLib) setCameraScanActive(true);
                          else setError('Camera scanning not available. Run: npm install html5-qrcode');
                        }}
                      >
                        Scan now
                      </button>
                      <div style={SCANNER_STYLES.alignHint}>Align code within frame</div>
                    </>
                  ) : (
                    <div style={{ width: '100%', maxWidth: '100%', position: 'relative', borderRadius: 12, overflow: 'hidden', border: '2px solid rgba(0, 212, 170, 0.5)', background: '#0a0a0a' }}>
                      <div style={{ padding: '8px 12px', background: '#1a1a1a', color: '#94a3b8', fontSize: '12px', textAlign: 'center' }}>
                        Show QR or barcode in front of the camera
                      </div>
                      <div id="camera-scan-box" style={{ width: '100%', minHeight: 240 }} />
                      <div style={{ display: 'flex', gap: 8, padding: 10, flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          style={{ ...SCANNER_STYLES.backLink, background: TEAL, color: '#fff', border: 'none' }}
                          onClick={() => {
                            if (html5QrRef.current) {
                              html5QrRef.current.stop().catch(() => {}).then(() => { html5QrRef.current = null; setCameraFacing((p) => (p === 'user' ? 'environment' : 'user')); });
                            } else setCameraFacing((p) => (p === 'user' ? 'environment' : 'user'));
                          }}
                        >
                          {cameraFacing === 'user' ? '🔄 Back camera' : '🔄 Front camera'}
                        </button>
                        <button
                          type="button"
                          style={{ ...SCANNER_STYLES.backLink, background: 'rgba(239,68,68,0.25)', borderColor: 'rgba(239,68,68,0.5)', color: '#f87171' }}
                          onClick={() => { setCameraScanActive(false); if (html5QrRef.current) { html5QrRef.current.stop().catch(() => {}); html5QrRef.current = null; } }}
                        >
                          Stop camera
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

            {/* Physical Device button - card ke niche, right side */}
            <div className="scan-content-width" style={{ width: '100%', maxWidth: 560, marginBottom: 20, marginTop: 0, display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                style={{
                  padding: '10px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  background: 'rgba(249, 115, 22, 0.12)',
                  border: '1px solid rgba(234, 88, 12, 0.6)',
                  borderRadius: 10,
                  color: '#c2410c',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'background 0.2s, border-color 0.2s',
                }}
                onClick={() => {
                  setShowMobileSection(false);
                  setShowMobileCard(false);
                  if (cameraScanActive && html5QrRef.current) {
                    html5QrRef.current.stop().catch(() => {});
                    html5QrRef.current = null;
                    setCameraScanActive(false);
                  }
                }}
              >
                <img src={physicalScanImg} alt="" style={{ width: 28, height: 28, objectFit: 'contain' }} />
                <span>Physical Device</span>
              </button>
            </div>
          </>
        )}
        </div>
      </main>
    </div>
  );
};

export default RegistrationListCheckInScanPage;
