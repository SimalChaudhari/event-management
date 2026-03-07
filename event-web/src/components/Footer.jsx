import { APP_DOWNLOAD_URL } from '../config/env';

const QR_API = 'https://api.qrserver.com/v1/create-qr-code/';
const qrImageUrl = `${QR_API}?size=120x120&data=${encodeURIComponent(APP_DOWNLOAD_URL)}`;

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-slate-50/80 mt-auto">
      <div className="max-w-app mx-auto md:max-w-[1200px] px-4 py-6 md:px-6 md:py-8">
        <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <img
              src={qrImageUrl}
              alt="QR code to download Evential app"
              className="w-[120px] h-[120px] flex-shrink-0 rounded-lg border border-slate-200 bg-white"
            />
            <div className="text-center sm:text-left">
              <h3 className="text-base font-semibold text-slate-800 mb-0.5">Get the Evential app</h3>
              <p className="text-slate-600 text-sm mb-2">
                Scan the QR code to download the app for a better experience at events.
              </p>
              <a
                href={APP_DOWNLOAD_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-3 py-1.5 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90"
              >
                Download app
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
