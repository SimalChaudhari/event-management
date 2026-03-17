import { APP_STORE_URL, PLAY_STORE_URL } from '../config/env';
import logo from '../assets/logo.png';

const QR_API = 'https://api.qrserver.com/v1/create-qr-code/';
const qrSize = 100;

const appleQrUrl = `${QR_API}?size=${qrSize}x${qrSize}&data=${encodeURIComponent(APP_STORE_URL)}`;
const androidQrUrl = `${QR_API}?size=${qrSize}x${qrSize}&data=${encodeURIComponent(PLAY_STORE_URL)}`;

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-slate-50/80 mt-auto flex-shrink-0 w-full overflow-x-hidden">
      <div className="w-full max-w-[1200px] mx-auto px-4 py-5 sm:px-5 sm:py-6 md:px-6 md:py-8 box-border">
        <div className="flex flex-col sm:flex-row items-center sm:items-center justify-between gap-4 sm:gap-6 md:gap-8 flex-wrap min-w-0">
          <div className="w-full sm:w-auto sm:max-w-md min-w-0 text-center sm:text-left order-1 flex flex-col items-center sm:items-start gap-3">
            <img src={logo} alt="Evential" className="h-8 w-auto object-contain sm:h-9" />
            <div>
              <h3 className="text-slate-800 font-semibold text-sm sm:text-base">Get the Evential app</h3>
              <p className="text-slate-600 text-xs sm:text-sm mt-0.5">
                Scan the QR code for your device or use the store links for a better experience at events.
              </p>
            </div>
          </div>
          <div className="flex flex-row flex-wrap items-center justify-center sm:justify-end gap-3 sm:gap-5 w-full sm:w-auto min-w-0 order-2 shrink-0">
            <a
              href={APP_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col items-center gap-1.5 sm:gap-3 p-2.5 sm:p-4 rounded-xl sm:rounded-2xl border-2 border-slate-200 bg-gradient-to-b from-slate-50 to-white shadow-sm hover:border-slate-400 hover:shadow-lg hover:from-slate-100 hover:to-slate-50 transition-all duration-200 min-w-[100px] sm:min-w-[140px] flex-1 sm:flex-initial basis-0 sm:basis-auto max-w-[180px] sm:max-w-none"
            >
              <div className="rounded-lg sm:rounded-xl overflow-hidden border border-slate-200 bg-white p-1 sm:p-1.5 shadow-inner flex-shrink-0">
                <img src={appleQrUrl} alt="QR code for App Store" className="w-14 h-14 sm:w-[88px] sm:h-[88px] rounded-md sm:rounded-lg object-contain" />
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-slate-700 group-hover:text-slate-900" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                </svg>
                <span className="text-xs sm:text-sm font-semibold text-slate-700 group-hover:text-slate-900">App Store</span>
              </div>
              <span className="text-[10px] sm:text-xs text-slate-500 hidden sm:inline">Scan or tap to download</span>
            </a>
            <a
              href={PLAY_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col items-center gap-1.5 sm:gap-3 p-2.5 sm:p-4 rounded-xl sm:rounded-2xl border-2 border-emerald-200 bg-gradient-to-b from-emerald-50/80 to-white shadow-sm hover:border-emerald-400 hover:shadow-lg hover:from-emerald-50 hover:to-white transition-all duration-200 min-w-[100px] sm:min-w-[140px] flex-1 sm:flex-initial basis-0 sm:basis-auto max-w-[180px] sm:max-w-none"
            >
              <div className="rounded-lg sm:rounded-xl overflow-hidden border border-emerald-100 bg-white p-1 sm:p-1.5 shadow-inner flex-shrink-0">
                <img src={androidQrUrl} alt="QR code for Google Play" className="w-14 h-14 sm:w-[88px] sm:h-[88px] rounded-md sm:rounded-lg object-contain" />
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" viewBox="0 0 24 24" aria-hidden>
                  <path fill="#4285F4" d="M0 0L0 12L12 12Z" />
                  <path fill="#EA4335" d="M0 12L0 24L12 12Z" />
                  <path fill="#34A853" d="M0 0L24 12L12 12Z" />
                  <path fill="#FBBC04" d="M0 24L24 12L12 12Z" />
                </svg>
                <span className="text-xs sm:text-sm font-semibold text-slate-700 group-hover:text-slate-900">Google Play</span>
              </div>
              <span className="text-[10px] sm:text-xs text-slate-500 hidden sm:inline">Scan or tap to download</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
