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
    background: 'linear-gradient(180deg, #1a1d21 0%, #0f1114 100%)',
    color: '#e2e8f0',
    fontFamily: '"SF Mono", "Monaco", "Inconsolata", "Roboto Mono", monospace',
    padding: 0,
    margin: 0,
  },
  topBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px 20px',
    borderBottom: '1px solid rgba(0,0,0,0.2)',
    backgroundColor: '#0d9488',
    color: '#fff',
  },
  backLink: {
    color: 'rgba(255,255,255,0.95)',
    fontSize: '15px',
    textDecoration: 'none',
    cursor: 'pointer',
    padding: '6px 12px',
    borderRadius: '6px',
    border: '1px solid rgba(255,255,255,0.4)',
    background: 'rgba(255,255,255,0.1)',
  },
  scanZone: {
    position: 'relative',
    margin: '32px auto',
    maxWidth: '560px',
    padding: '32px 24px',
    border: '2px solid rgba(0, 212, 170, 0.4)',
    borderRadius: '12px',
    background: 'rgba(0, 212, 170, 0.04)',
    boxShadow: '0 0 40px rgba(0, 212, 170, 0.08), inset 0 0 60px rgba(0,0,0,0.2)',
  },
  scanLine: {
    position: 'absolute',
    left: '24px',
    right: '24px',
    height: '2px',
    background: 'linear-gradient(90deg, transparent, rgba(0, 212, 170, 0.8), transparent)',
    animation: 'scanMove 2s ease-in-out infinite',
    borderRadius: 1,
  },
  input: {
    width: '100%',
    padding: '22px 16px',
    fontSize: '1.5rem',
    letterSpacing: '0.15em',
    background: 'rgba(0,0,0,0.4)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '8px',
    color: '#e2e8f0',
    outline: 'none',
    textAlign: 'center',
    caretColor: '#00d4aa',
  },
  statusBox: {
    maxWidth: '560px',
    margin: '0 auto 24px',
    padding: '22px 24px',
    borderRadius: '10px',
    textAlign: 'center',
    fontSize: '1.15rem',
    fontWeight: 600,
    letterSpacing: '0.05em',
  },
  statusReady: {
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.12)',
    color: '#94a3b8',
  },
  statusProcessing: {
    background: 'rgba(251, 191, 36, 0.12)',
    border: '1px solid rgba(251, 191, 36, 0.4)',
    color: '#fbbf24',
  },
  statusSuccess: {
    background: 'rgba(34, 197, 94, 0.15)',
    border: '1px solid rgba(34, 197, 94, 0.5)',
    color: '#22c55e',
  },
  statusError: {
    background: 'rgba(239, 68, 68, 0.12)',
    border: '1px solid rgba(239, 68, 68, 0.4)',
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
  const [showMobileUrlModal, setShowMobileUrlModal] = useState(false);
  const [mobileUrlCopied, setMobileUrlCopied] = useState(false);
  const [cameraScanActive, setCameraScanActive] = useState(false);
  const inputRef = useRef(null);
  const submitTimeoutRef = useRef(null);
  const submittingRef = useRef(false);
  const html5QrRef = useRef(null);

  const mobileScannerUrl = typeof window !== 'undefined' ? window.location.href : '';

  const handleCopyMobileUrl = useCallback(() => {
    if (!mobileScannerUrl) return;
    navigator.clipboard.writeText(mobileScannerUrl).then(() => {
      setMobileUrlCopied(true);
      setTimeout(() => setMobileUrlCopied(false), 2500);
    });
  }, [mobileScannerUrl]);

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
    const config = { fps: 10, qrbox: { width: 250, height: 250 } };
    html5Qr.start({ facingMode: 'environment' }, config, (decodedText) => {
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
        <div style={{ flex: '0 0 140px', fontSize: '14px', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.9)', textTransform: 'uppercase' }}>
          Check-in scanner
        </div>
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', minWidth: 0, padding: '0 8px' }}>
          <button
            type="button"
            style={SCANNER_STYLES.backLink}
            onClick={() => navigate(`/events/registrations/share/${shareToken}`)}
          >
            ← List
          </button>
          <button
            type="button"
            style={{ ...SCANNER_STYLES.backLink }}
            onClick={() => setShowMobileUrlModal(true)}
          >
            📱 Mobile scan
          </button>
        </div>
        <div style={{ flex: '0 0 140px', fontSize: '17px', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'right' }}>
          {eventName || '—'}
        </div>
      </header>

      {showMobileUrlModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: 20,
          }}
          onClick={() => setShowMobileUrlModal(false)}
        >
          <div
            style={{
              background: '#1e293b',
              borderRadius: 12,
              padding: 24,
              maxWidth: 440,
              width: '100%',
              border: '1px solid rgba(255,255,255,0.1)',
              boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontSize: '16px', fontWeight: 600, color: '#e2e8f0', marginBottom: 8 }}>
              Scan with mobile camera
            </div>
            <p style={{ fontSize: '14px', color: '#94a3b8', marginBottom: 16 }}>
              Open this link on your phone. Use the camera to scan the participant QR/barcode — same check-in will apply.
            </p>
            <input
              type="text"
              readOnly
              value={mobileScannerUrl}
              style={{
                width: '100%',
                padding: '12px 14px',
                fontSize: '13px',
                background: 'rgba(0,0,0,0.4)',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: 8,
                color: '#e2e8f0',
                marginBottom: 16,
                boxSizing: 'border-box',
              }}
            />
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                type="button"
                style={{
                  ...SCANNER_STYLES.backLink,
                  background: 'rgba(255,255,255,0.15)',
                  color: '#fff',
                }}
                onClick={() => setShowMobileUrlModal(false)}
              >
                Close
              </button>
              <button
                type="button"
                style={{
                  ...SCANNER_STYLES.backLink,
                  background: '#0d9488',
                  borderColor: '#0d9488',
                  color: '#fff',
                }}
                onClick={handleCopyMobileUrl}
              >
                {mobileUrlCopied ? '✓ Copied!' : 'Copy URL'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ padding: '24px 16px' }}>
        <div style={SCANNER_STYLES.scanZone}>
          <div style={{ ...SCANNER_STYLES.scanLine, top: 24 }} />
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
          <div style={{ marginTop: '12px', fontSize: '11px', color: '#64748b', letterSpacing: '0.15em', textAlign: 'center' }}>
            SCAN ZONE
          </div>
        </div>

        {Html5QrcodeLib && !cameraScanActive && (
          <div style={{ width: '100%', maxWidth: 560, margin: '0 auto 20px', textAlign: 'center' }}>
            <button
              type="button"
              style={{
                ...SCANNER_STYLES.backLink,
                padding: '12px 20px',
                fontSize: '15px',
                background: 'rgba(0, 212, 170, 0.15)',
                borderColor: 'rgba(0, 212, 170, 0.5)',
                color: '#00d4aa',
              }}
              onClick={() => { setError(null); setCameraScanActive(true); }}
            >
              📷 Use camera to scan
            </button>
          </div>
        )}

        {cameraScanActive && (
          <div style={{ width: '100%', maxWidth: 560, margin: '0 auto 20px', position: 'relative', borderRadius: 12, overflow: 'hidden', border: '2px solid rgba(0, 212, 170, 0.4)', background: '#000' }}>
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
          <span style={{ marginRight: '8px', opacity: 0.9 }}>{status.icon}</span>
          {status.text}
        </div>

        <div style={{ textAlign: 'center', fontSize: '11px', color: '#475569', letterSpacing: '0.1em' }}>
          Scan barcode or QR · Auto check-in 3s after scan
        </div>
      </div>
    </div>
  );
};

export default RegistrationListCheckInScanPage;
