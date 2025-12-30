export default function Footer({appVersion = "1.0.0" }) {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-10 bg-white/70 backdrop-blur-md border-t border-gray-200">
      <div className="max-w-5xl mx-auto py-6 px-4 flex flex-col items-center gap-2">

        {/* Copyright */}
        <p className="text-sm text-gray-500">
          © {year} PlayWell — Informational use only, not a medical diagnosis.
        </p>

        {/* Versi aplikasi */}
        <p className="text-xs text-gray-400">App Version {appVersion}</p>
      </div>
    </footer>
  );
}
