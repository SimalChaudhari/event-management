import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import PageLayout from '../../components/PageLayout';
import { userService } from '../../services/userService';

const scanHero = (
  <div className="bg-gradient-to-b from-[#71C0BB] to-[#010a08] px-6 pt-8 pb-6 md:pt-10 md:pb-8">
    <div className="text-center">
      <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white drop-shadow-sm">Scan QR</h1>
      <p className="mt-2 text-white/90 text-sm md:text-base">Your personal QR code and event scanning</p>
      <div className="mt-4 mx-auto w-12 h-0.5 bg-white/50 rounded-full" aria-hidden />
    </div>
  </div>
);

export default function ScanQR() {
  const { authUser } = useSelector((s) => s.auth);
  const [qr, setQr] = useState({ qrCodeImage: null, qrCodeId: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authUser?.id) {
      setLoading(false);
      return;
    }
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

  const handleDownloadQR = () => {
    if (!qr.qrCodeImage) return;
    const link = document.createElement('a');
    link.href = qr.qrCodeImage;
    link.download = 'evential-my-qr.png';
    link.click();
  };

  return (
    <PageLayout hero={scanHero}>
      <div className="p-5 md:p-8">
        {/* Your personal QR code – shown when logged in */}
        {authUser?.id && (
          <section className="bg-slate-50 rounded-xl border border-slate-200 p-5 md:p-6 mb-6">
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
        )}

        {!authUser?.id && (
          <p className="text-slate-500 text-sm mb-6 text-center py-4">
            Sign in to view and download your personal QR code.
          </p>
        )}

        {/* Scan event/participant QR – coming soon */}
        <section className="rounded-xl border border-slate-200 bg-white shadow-sm p-5 md:p-6">
          <h2 className="text-base font-semibold text-slate-800 mb-2">Scan event or participant QR</h2>
          <p className="text-slate-600 text-sm">Scan event or participant QR codes here. Coming soon.</p>
        </section>
      </div>
    </PageLayout>
  );
}
