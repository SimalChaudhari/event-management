import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Form } from 'react-bootstrap';
import publicAxiosInstance from '../../../configs/publicAxiosInstance';
import axiosInstance from '../../../configs/axiosInstance';

let Html5QrcodeLib = null;
try {
  Html5QrcodeLib = require('html5-qrcode').Html5Qrcode;
} catch (_) {}

const SCANNER_STYLES = {
  wrapper: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    background: 'linear-gradient(180deg, #0f1419 0%, #0a0d10 100%)',
    color: '#e2e8f0',
    fontFamily: '"Inter", "Segoe UI", system-ui, sans-serif',
    padding: 0,
    margin: 0,
  },
  topBar: {
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 20px',
    borderBottom: '1px solid rgba(0,0,0,0.25)',
    backgroundColor: '#0d9488',
    color: '#fff',
    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
  },
  backLink: {
    color: 'rgba(255,255,255,0.95)',
    fontSize: '14px',
    fontWeight: 500,
    textDecoration: 'none',
    cursor: 'pointer',
    padding: '8px 14px',
    borderRadius: '8px',
    border: '1px solid rgba(255,255,255,0.35)',
    background: 'rgba(255,255,255,0.12)',
    transition: 'background 0.2s, border-color 0.2s',
  },
  mainCenter: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px 16px',
    minHeight: 0,
  },
  scanZone: {
    position: 'relative',
    width: '100%',
    maxWidth: '520px',
    padding: '28px 24px',
    border: '2px solid rgba(0, 212, 170, 0.35)',
    borderRadius: '16px',
    background: 'linear-gradient(145deg, rgba(0, 212, 170, 0.06) 0%, rgba(0,0,0,0.2) 100%)',
    boxShadow: '0 0 0 1px rgba(255,255,255,0.03), 0 8px 32px rgba(0,0,0,0.3), 0 0 48px rgba(0, 212, 170, 0.06)',
  },
  scanLine: {
    position: 'absolute',
    left: '24px',
    right: '24px',
    height: '2px',
    background: 'linear-gradient(90deg, transparent, rgba(0, 212, 170, 0.75), transparent)',
    animation: 'scanMove 2.2s ease-in-out infinite',
    borderRadius: 1,
  },
  input: {
    width: '100%',
    padding: '20px 18px',
    fontSize: '1.35rem',
    letterSpacing: '0.12em',
    background: 'rgba(0,0,0,0.45)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '10px',
    color: '#e2e8f0',
    outline: 'none',
    textAlign: 'center',
    caretColor: '#14b8a6',
    fontWeight: 500,
  },
  statusBox: {
    width: '100%',
    maxWidth: '520px',
    marginTop: '20px',
    padding: '18px 22px',
    borderRadius: '12px',
    textAlign: 'center',
    fontSize: '1.05rem',
    fontWeight: 600,
    letterSpacing: '0.03em',
  },
  statusReady: {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    color: '#94a3b8',
  },
  statusProcessing: {
    background: 'rgba(251, 191, 36, 0.1)',
    border: '1px solid rgba(251, 191, 36, 0.35)',
    color: '#fbbf24',
  },
  statusSuccess: {
    background: 'rgba(34, 197, 94, 0.12)',
    border: '1px solid rgba(34, 197, 94, 0.45)',
    color: '#22c55e',
  },
  statusError: {
    background: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.35)',
    color: '#ef4444',
  },
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
  const [cameraScanActive, setCameraScanActive] = useState(false);
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

  const handleSubmit = useCallback(async (e, valueOverride) => {
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
        { eventId }
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
  }, [eventId, scanValue]);

  useEffect(() => {
    if (!cameraScanActive || !eventId || !Html5QrcodeLib) return;
    const el = document.getElementById('camera-scan-box');
    if (!el) return;
    const html5Qr = new Html5QrcodeLib('camera-scan-box');
    html5QrRef.current = html5Qr;
    const config = { fps: 8, qrbox: { width: 280, height: 280 } };
    html5Qr.start({ facingMode: 'user' }, config, (decodedText) => {
      html5Qr.stop().catch(() => {}).then(() => {
        html5QrRef.current = null;
        setCameraScanActive(false);
        handleSubmit(null, decodedText.trim());
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
  }, [cameraScanActive, eventId, handleSubmit]);

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
          <div style={{ width: 32, height: 32, border: '2px solid #334155', borderTopColor: '#00d4aa', borderRadius: '50%', margin: '0 auto', animation: 'spin 0.8s linear infinite' }} />
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
      `}</style>

      <header style={SCANNER_STYLES.topBar}>
        <div style={{ flex: '0 0 130px' }} />
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', minWidth: 0, padding: '0 12px', fontSize: '14px', fontWeight: 500, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'center' }}>
          {eventName || '—'}
        </div>
        <div style={{ flex: '0 0 130px', display: 'flex', justifyContent: 'flex-end' }}>
          <button type="button" style={SCANNER_STYLES.backLink} onClick={() => navigate(`/events/registrations/share/${shareToken}`)}>
            ← List
          </button>
        </div>
      </header>

      <main style={SCANNER_STYLES.mainCenter}>
        {!cameraScanActive && (
          <div style={SCANNER_STYLES.scanZone}>
            <div style={{ ...SCANNER_STYLES.scanLine, top: 20 }} />
            <Form onSubmit={handleSubmit}>
              <Form.Control
                ref={inputRef}
                type="text"
                placeholder=""
                value={scanValue}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                autoComplete="off"
                disabled={submitting}
                style={SCANNER_STYLES.input}
                aria-label="Participant ID"
              />
            </Form>
            <div style={{ marginTop: '14px', fontSize: '11px', color: '#64748b', letterSpacing: '0.2em', textAlign: 'center', fontWeight: 500 }}>
              SCAN ZONE
            </div>
          </div>
        )}

        {!cameraScanActive && (
          <div style={{ width: '100%', maxWidth: 520, marginTop: 16, textAlign: 'center' }}>
            <button
              type="button"
              style={{
                ...SCANNER_STYLES.backLink,
                padding: '10px 18px',
                fontSize: '14px',
                background: 'rgba(0, 212, 170, 0.12)',
                borderColor: 'rgba(0, 212, 170, 0.45)',
                color: '#5eead4',
              }}
              onClick={() => {
                setError(null);
                if (Html5QrcodeLib) {
                  setCameraScanActive(true);
                } else {
                  setError('Camera scanning not available. Run: npm install html5-qrcode');
                }
              }}
            >
              📷 Use camera to scan
            </button>
          </div>
        )}

        {cameraScanActive && (
          <div style={{ width: '100%', maxWidth: 520, marginTop: 16, position: 'relative', borderRadius: 16, overflow: 'hidden', border: '2px solid rgba(0, 212, 170, 0.35)', background: '#000', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
            <div style={{ padding: '10px 12px', background: 'rgba(0,0,0,0.6)', color: '#94a3b8', fontSize: '12px', textAlign: 'center' }}>
              Show your mobile&apos;s QR or barcode in front of the camera
            </div>
            <div id="camera-scan-box" style={{ width: '100%', minHeight: 280 }} />
            <button
              type="button"
              style={{
                position: 'absolute',
                bottom: 12,
                left: '50%',
                transform: 'translateX(-50%)',
                ...SCANNER_STYLES.backLink,
                background: 'rgba(239, 68, 68, 0.9)',
                borderColor: '#ef4444',
                color: '#fff',
              }}
              onClick={() => { setCameraScanActive(false); if (html5QrRef.current) { html5QrRef.current.stop().catch(() => {}); html5QrRef.current = null; } }}
            >
              Stop camera
            </button>
          </div>
        )}

        <div style={{ ...SCANNER_STYLES.statusBox, ...status.style }}>
          <span style={{ marginRight: '8px', opacity: 0.95 }}>{status.icon}</span>
          {status.text}
        </div>

        <div style={{ marginTop: 12, textAlign: 'center', fontSize: '12px', color: '#64748b', letterSpacing: '0.06em' }}>
          Scan barcode or QR · Auto check-in 3s after scan
        </div>
      </main>
    </div>
  );
};

export default RegistrationListCheckInScanPage;
