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

/** Dark Aceternity-style backdrop: grid, glow blobs, centered content. */
export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-background">
      <div className="grid-pattern pointer-events-none absolute inset-0" />
      <div className="pointer-events-none absolute -top-32 left-1/2 h-[26rem] w-[36rem] -translate-x-1/2 rounded-full bg-primary/25 blur-[130px]" />
      <div className="pointer-events-none absolute -bottom-24 -right-16 h-72 w-72 rounded-full bg-cyan-500/10 blur-[100px]" />
      <div className="relative z-10 flex min-h-screen w-full items-center justify-center p-4 py-10">
        {children}
      </div>
    </div>
  );
}

export function BrandHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-6 text-center">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/20 text-2xl ring-1 ring-primary/40">
        🛰️
      </div>
      <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
    </div>
  );
}

const TEST_ACCOUNTS = [
  { user: 'manager', pass: 'Manager123!', role: 'STOCK_MANAGER' },
  { user: 'tech1', pass: 'Tech123!', role: 'TECHNICIAN' },
  { user: 'tech2', pass: 'Tech123!', role: 'TECHNICIAN' },
];

export function TestAccountsPanel() {
  return (
    <div className="rounded-lg border border-border bg-secondary/40 p-3">
      <p className="mb-2 text-xs font-semibold tracking-wide text-foreground/80 uppercase">
        Test accounts
      </p>
      <ul className="space-y-1.5">
        {TEST_ACCOUNTS.map((a) => (
          <li
            key={a.user}
            className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground"
          >
            <code className="rounded bg-background/70 px-1.5 py-0.5 font-mono text-foreground">
              {a.user} / {a.pass}
            </code>
            <span className="rounded bg-primary/15 px-1.5 py-0.5 font-medium text-primary">
              {a.role}
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-xs text-muted-foreground">
        The OTP is emailed by the backend to each account&apos;s address.
      </p>
    </div>
  );
}
