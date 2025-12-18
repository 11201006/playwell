export default function Footer({appVersion = "1.0.0" }) {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-10 bg-white/70 backdrop-blur-md border-t border-gray-200">
      <div className="max-w-5xl mx-auto py-6 px-4 flex flex-col items-center gap-2">
        
        {/* Menu Navigasi */}
        <div className="flex gap-6 text-sm text-gray-600">
          <a href="/about" className="hover:text-gray-800">About</a>
          <a href="/privacy" className="hover:text-gray-800">Privacy</a>
          <a href="/terms" className="hover:text-gray-800">Terms</a>
          <a href="/contact" className="hover:text-gray-800">Contact</a>
        </div>

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
