export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-surface text-primary">
      <div className="max-w-xl text-center space-y-4">
        <span className="inline-block px-3 py-1 text-xs font-semibold uppercase tracking-widest text-accent bg-accent-light rounded-full">
          Phase 0 • Scaffolding
        </span>
        <h1 className="text-4xl font-bold tracking-tight text-primary">
          Provenance
        </h1>
        <p className="text-sm text-gray-600">
          Tamper-evident credential-verification platform.
        </p>
        <div className="pt-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-accent rounded-md shadow-sm hover:bg-accent-hover transition-colors">
            Infrastructure Ready
          </div>
        </div>
      </div>
    </main>
  );
}
