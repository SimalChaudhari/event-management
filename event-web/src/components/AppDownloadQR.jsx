import { APP_DOWNLOAD_URL } from '../config/env';

const QR_API = 'https://api.qrserver.com/v1/create-qr-code/';
const qrImageUrl = `${QR_API}?size=180x180&data=${encodeURIComponent(APP_DOWNLOAD_URL)}`;

export default function AppDownloadQR() {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 flex flex-col sm:flex-row items-center gap-4">
      <img
        src={qrImageUrl}
        alt="QR code to download Evential app"
        className="w-[180px] h-[180px] flex-shrink-0 rounded-lg border border-slate-100"
      />
      <div className="text-center sm:text-left">
        <h3 className="text-lg font-semibold text-slate-800 mb-1">Get the Evential app</h3>
        <p className="text-slate-600 text-sm mb-3">
          Scan the QR code to download the app for a better experience at events.
        </p>
        <a
          href={APP_DOWNLOAD_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90"
        >
          Download app
        </a>
      </div>
    </section>
  );
}
