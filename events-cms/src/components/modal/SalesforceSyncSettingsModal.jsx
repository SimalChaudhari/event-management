import React, { useEffect, useState } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import axiosInstance from '../../configs/axiosInstance';
import { toast } from 'react-toastify';

// Build cron expression from simple inputs: intervalHours (1,2,6,12,24), minute (0-59), hour (0-23 for daily)
function buildCron(intervalHours, minute, hour) {
  const m = Math.max(0, Math.min(59, Number(minute) || 0));
  const h = Math.max(0, Math.min(23, Number(hour) || 0));
  if (intervalHours === 24) {
    return `${m} ${h} * * *`; // Daily at hour h, minute m
  }
  return `${m} */${intervalHours} * * *`; // Every N hours at minute m
}

// Parse stored cron back to intervalHours, minute, hour (best effort)
function parseCron(cronStr) {
  const def = { intervalHours: 6, minute: 0, hour: 2 };
  if (!cronStr || typeof cronStr !== 'string') return def;
  const parts = cronStr.trim().split(/\s+/);
  if (parts.length < 2) return def;
  const minute = Math.max(0, Math.min(59, parseInt(parts[0], 10) || 0));
  const hourPart = parts[1];
  if (hourPart === '*') {
    // Every hour
    return { intervalHours: 1, minute, hour: 2 };
  }
  const everyMatch = hourPart && hourPart.match(/^\*\/(\d+)$/);
  if (everyMatch) {
    const n = parseInt(everyMatch[1], 10);
    if (n >= 1 && n <= 24) return { intervalHours: n, minute, hour: 2 };
    return def;
  }
  const hour = Math.max(0, Math.min(23, parseInt(hourPart, 10) || 0));
  return { intervalHours: 24, minute, hour };
}

const INTERVAL_OPTIONS = [
  { value: 1, label: '1 hour' },
  { value: 2, label: '2 hours' },
  { value: 6, label: '6 hours' },
  { value: 12, label: '12 hours' },
  { value: 24, label: 'Daily' },
];

const SalesforceSyncSettingsModal = ({ show, onHide, onSaved }) => {
  const [enabled, setEnabled] = useState(false);
  const [intervalHours, setIntervalHours] = useState(6);
  const [minute, setMinute] = useState(0);
  const [hour, setHour] = useState(2);
  const [loading, setLoading] = useState(false);
  const [loadingSettings, setLoadingSettings] = useState(false);

  useEffect(() => {
    if (show) {
      setLoadingSettings(true);
      axiosInstance
        .get('/salesforce/sync/settings')
        .then((res) => {
          if (res.data?.data) {
            setEnabled(res.data.data.enabled);
            const parsed = parseCron(res.data.data.cronSchedule);
            setIntervalHours(parsed.intervalHours);
            setMinute(parsed.minute);
            setHour(parsed.hour);
          }
        })
        .catch(() => toast.error('Failed to load sync settings'))
        .finally(() => setLoadingSettings(false));
    }
  }, [show]);

  const handleSave = () => {
    const cronSchedule = buildCron(intervalHours, minute, hour);
    setLoading(true);
    axiosInstance
      .put('/salesforce/sync/settings', { enabled, cronSchedule })
      .then(() => {
        toast.success('Sync settings saved.');
        onSaved?.();
        onHide();
      })
      .catch((err) => toast.error(err.response?.data?.message || 'Failed to save settings'))
      .finally(() => setLoading(false));
  };

  const summary =
    intervalHours === 24
      ? `Runs daily at ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
      : `Runs every ${intervalHours} hour(s) at minute ${minute}`;

  return (
    <Modal
      show={show}
      onHide={onHide}
      centered
      // fullscreen="sm-down"
      // size="lg"
      contentClassName="border-0 shadow-lg"
      style={{ borderRadius: '12px', overflow: 'hidden' }}
    >
      <Modal.Header
        className="border-0 py-3 px-3 px-sm-4 d-flex align-items-center justify-content-between"
        style={{
          background: 'linear-gradient(135deg, #0d6efd 0%, #0a58ca 100%)',
          color: '#fff',
        }}
      >
        <Modal.Title className="mb-0 d-flex align-items-center flex-grow-1 pe-2 text-break" style={{ fontSize: 'clamp(0.95rem, 2.5vw, 1.15rem)', fontWeight: 600 }}>
            Salesforce sync – schedule
        </Modal.Title>
        <button
          type="button"
          onClick={onHide}
          aria-label="Close"
          className="btn btn-link p-0 m-0 ms-2"
          style={{
            color: '#fff',
            fontSize: '1.5rem',
            lineHeight: 1,
            textDecoration: 'none',
            opacity: 0.9,
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.opacity = '1';
            e.currentTarget.style.color = '#fff';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.opacity = '0.9';
            e.currentTarget.style.color = '#fff';
          }}
        >
          &times;
        </button>
      </Modal.Header>
      <Modal.Body className="px-3 px-sm-4 py-3 py-sm-4" style={{ backgroundColor: '#fafbfc' }}>
        <>
            <div
              className="p-3 mb-4 rounded-3"
              style={{ backgroundColor: '#fff', border: '1px solid #e9ecef', borderRadius: '8px' }}
            >
              <Form.Group className="mb-0">
                <Form.Check
                  type="switch"
                  id="sync-cron-enabled"
                  label={<span style={{ fontWeight: 500 }}>Enable automatic sync</span>}
                  checked={enabled}
                  onChange={(e) => setEnabled(e.target.checked)}
                />
              </Form.Group>
            </div>

            <div
              className="p-3 mb-4 rounded-3"
              style={{ backgroundColor: '#fff', border: '1px solid #e9ecef', borderRadius: '8px' }}
            >
              <Form.Group className="mb-0">
                <div className="d-flex flex-wrap align-items-center" style={{ gap: '1rem 1.25rem' }}>
                  <div className="d-flex align-items-center" style={{ gap: '0.5rem' }}>
                    <span className="fw-medium text-secondary" style={{ whiteSpace: 'nowrap' }}>Every</span>
                    <Form.Select
                      value={intervalHours}
                      onChange={(e) => setIntervalHours(Number(e.target.value))}
                      className="border-secondary"
                      style={{ borderRadius: '8px', minWidth: '80px', maxWidth: '100%' }}
                    >
                      {INTERVAL_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </Form.Select>
                  </div>
                  <div className="d-flex align-items-center" style={{ gap: '0.5rem' }}>
                    <span className="fw-medium text-secondary" style={{ whiteSpace: 'nowrap' }}>Min</span>
                    <Form.Select
                      value={minute}
                      onChange={(e) => setMinute(Number(e.target.value))}
                      className="border-secondary"
                      style={{ borderRadius: '8px', minWidth: '56px', maxWidth: '100%' }}
                    >
                      {Array.from({ length: 60 }, (_, i) => (
                        <option key={i} value={i}>
                          {i}
                        </option>
                      ))}
                    </Form.Select>
                  </div>
                  {intervalHours === 24 && (
                    <div className="d-flex align-items-center" style={{ gap: '0.5rem' }}>
                      <span className="fw-medium text-secondary" style={{ whiteSpace: 'nowrap' }}>Hour</span>
                      <Form.Select
                        value={hour}
                        onChange={(e) => setHour(Number(e.target.value))}
                        className="border-secondary"
                        style={{ borderRadius: '8px', minWidth: '70px', maxWidth: '100%' }}
                      >
                        {Array.from({ length: 24 }, (_, i) => (
                          <option key={i} value={i}>
                            {String(i).padStart(2, '0')}:00
                          </option>
                        ))}
                      </Form.Select>
                    </div>
                  )}
                </div>
              </Form.Group>
            </div>

            {enabled && (
              <div
                className="p-2 rounded small mb-0"
                style={{ backgroundColor: '#e7f1ff', color: '#0a58ca', border: '1px solid #b6d4fe' }}
              >
                ✓ {summary}
              </div>
            )}
        </>
      </Modal.Body>
      <Modal.Footer className="border-top px-4 py-3" style={{ backgroundColor: '#fff' }}>
        <Button variant="outline-secondary" onClick={onHide} disabled={loading} style={{ borderRadius: '8px' }}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleSave} disabled={loading || loadingSettings} style={{ borderRadius: '8px', minWidth: '90px' }}>
          {loading ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
              Saving...
            </>
          ) : (
            'Save'
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default SalesforceSyncSettingsModal;
