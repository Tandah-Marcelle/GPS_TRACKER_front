import type { ReactNode } from 'react';

export function LabelInputContainer({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`flex w-full flex-col gap-2 ${className ?? ''}`}>{children}</div>;
}

export function FieldError({ children }: { children?: string }) {
  if (!children) return null;
  return <p className="text-xs font-medium text-red-400">{children}</p>;
}

export function FieldHint({ children }: { children: ReactNode }) {
  return <p className="text-xs leading-relaxed text-muted-foreground">{children}</p>;
}

export function BottomGradient() {
  return (
    <>
      <span className="pointer-events-none absolute inset-x-0 -bottom-px block h-px w-full bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-0 transition duration-500 group-hover/btn:opacity-100" />
      <span className="pointer-events-none absolute inset-x-10 -bottom-px mx-auto block h-px w-1/2 bg-gradient-to-r from-transparent via-indigo-400 to-transparent opacity-0 blur-sm transition duration-500 group-hover/btn:opacity-100" />
    </>
  );
}

/**
 * Split-panel auth layout:
 * Left  → form content (passed as children)
 * Right → hero panel with flotte.png image + brand gradient
 */
export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen w-full">
      {/* ── LEFT: Form panel ───────────────────────────── */}
      <div className="relative flex w-full flex-col justify-center overflow-hidden bg-background px-8 py-12 lg:w-1/2 lg:px-16 xl:px-24">
        {/* Subtle radial glow behind the form */}
        <div className="pointer-events-none absolute -top-20 -left-20 h-80 w-80 rounded-full bg-primary/10 blur-[120px]" />
        <div className="pointer-events-none absolute -bottom-20 -right-10 h-64 w-64 rounded-full bg-cyan-500/8 blur-[100px]" />

        {/* Logo */}
        <div className="relative z-10 mb-10">
          <img src="/logo.png" alt="Camtrack logo" className="h-14 w-auto object-contain" />
        </div>

        {/* Form content */}
        <div className="relative z-10 w-full max-w-md">{children}</div>
      </div>

      {/* ── RIGHT: Hero panel ──────────────────────────── */}
      <div className="relative hidden overflow-hidden lg:flex lg:w-1/2 lg:flex-col">
        {/* Deep blue-to-teal gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0f1b36] via-[#0e2a4a] to-[#083344]" />

        {/* Decorative glow blobs */}
        <div className="pointer-events-none absolute top-1/4 right-1/4 h-96 w-96 rounded-full bg-cyan-500/15 blur-[140px]" />
        <div className="pointer-events-none absolute bottom-1/4 left-1/4 h-64 w-64 rounded-full bg-indigo-500/20 blur-[100px]" />

        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

        {/* Content */}
        <div className="relative z-10 flex flex-1 flex-col items-center justify-center p-12">
          {/* Hero image */}
          <div className="mb-10 w-full max-w-lg">
            <div className="overflow-hidden rounded-2xl shadow-2xl ring-1 ring-white/10">
              <img
                src="/flotte.png"
                alt="Vehicle fleet"
                className="h-72 w-full object-cover object-center"
                style={{ filter: 'brightness(0.92) saturate(1.1)' }}
              />
            </div>
          </div>

          {/* Brand message */}
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white">
              Manage your fleet,<br />your way.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-white/60">
              Track every GPS device from stock to installation.<br />
              Full traceability, real-time status, zero spreadsheets.
            </p>
          </div>

          {/* Feature pills */}
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {['📦 Stock tracking', '🔧 Interventions', '📊 Dashboard', '🔒 Role-based access'].map((f) => (
              <span
                key={f}
                className="rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-sm font-medium text-white/80 backdrop-blur-sm"
              >
                {f}
              </span>
            ))}
          </div>
        </div>

        {/* Bottom branding */}
        <div className="relative z-10 border-t border-white/10 p-6 text-center">
          <p className="text-sm text-white/40">
            © {new Date().getFullYear()} Camtrack · GPS Tracker Management System
          </p>
        </div>
      </div>
    </div>
  );
}

export function BrandHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-8">
      <h1 className="text-3xl font-bold tracking-tight text-foreground">{title}</h1>
      <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>
    </div>
  );
}

const TEST_ACCOUNTS = [
  { user: 'manager', pass: 'Manager123!', role: 'Manager' },
  { user: 'tech1', pass: 'Tech123!', role: 'Technician' },
  { user: 'tech2', pass: 'Tech123!', role: 'Technician' },
];

export function TestAccountsPanel() {
  return (
    <div className="rounded-xl border border-border bg-secondary/40 p-4">
      <p className="mb-3 text-xs font-semibold tracking-widest text-foreground/60 uppercase">
        Demo accounts
      </p>
      <ul className="space-y-2">
        {TEST_ACCOUNTS.map((a) => (
          <li
            key={a.user}
            className="flex flex-wrap items-center justify-between gap-x-2 text-sm"
          >
            <code className="rounded bg-background/70 px-2 py-0.5 font-mono text-foreground">
              {a.user} / {a.pass}
            </code>
            <span className="rounded-full bg-primary/15 px-2.5 py-0.5 text-xs font-medium text-primary">
              {a.role}
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-muted-foreground">
        The OTP is returned in the API response in dev mode.
      </p>
    </div>
  );
}
