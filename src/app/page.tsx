export default function HomePage() {
  return (
    <div className="py-8">
      <div className="text-center max-w-2xl mx-auto space-y-4">
        <h1 className="text-3xl font-bold text-gray-900">
          Emergency Fanfiction Access Portal
        </h1>
        <p className="text-sm text-gray-600 leading-relaxed">
          Welcome to OurArchive. During scheduled or unscheduled Archive of Our Own downtime,
          this platform serves as an ephemeral index and distraction-free, read-only reader for
          fanworks shared via author-approved Google Drive links.
        </p>

        <div className="mt-8 p-4 bg-gray-50 border border-gray-200 rounded text-left text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-gray-700">Infrastructure Status (Module 0):</span>
            <a
              href="/api/health"
              className="text-ao3-red hover:underline font-mono text-[11px]"
              target="_blank"
              rel="noopener noreferrer"
            >
              /api/health &rarr;
            </a>
          </div>
          <ul className="list-disc pl-5 text-gray-600 space-y-1">
            <li>Edge Middleware: Active (Anti-bot rate limits enforced)</li>
            <li>Zero-Download Streaming Proxy: Ready</li>
            <li>Supabase BaaS Layer: Initialized & Verified</li>
            <li>Operational Telemetry: Active</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
