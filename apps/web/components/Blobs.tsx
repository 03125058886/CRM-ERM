/** Decorative animated gradient blobs (pure CSS, GPU-composited, zero JS). */
export function Blobs({ className = "" }: { className?: string }) {
  return (
    <div aria-hidden="true" className={`pointer-events-none absolute inset-0 -z-10 overflow-hidden ${className}`}>
      <div className="absolute -left-24 -top-24 size-[28rem] rounded-full bg-primary/25 blur-3xl animate-float will-change-transform" />
      <div className="absolute -right-32 top-10 size-[30rem] rounded-full bg-accent/20 blur-3xl animate-float-slow will-change-transform" />
      <div className="absolute left-1/3 top-64 size-[22rem] rounded-full bg-mint/20 blur-3xl animate-float will-change-transform [animation-delay:-4s]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,transparent_40%,var(--color-surface)_90%)]" />
    </div>
  );
}
