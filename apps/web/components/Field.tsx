"use client";

import { ChevronDown } from "lucide-react";
import type { Option } from "@nexora/shared";

interface Base { label: string; error?: string; hint?: string; id: string }

export function Input({ label, error, hint, id, suffix, ...rest }: Base & React.InputHTMLAttributes<HTMLInputElement> & { suffix?: string }) {
  return (
    <div>
      <label htmlFor={id} className="field-label">{label}</label>
      <div className="relative">
        <input id={id} aria-invalid={Boolean(error)} className={`field ${suffix ? "pr-32" : ""}`} {...rest} />
        {suffix && (
          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm font-medium text-mist">{suffix}</span>
        )}
      </div>
      {error ? <p className="mt-1 text-xs text-danger">{error}</p> : hint ? <p className="mt-1 text-xs text-mist">{hint}</p> : null}
    </div>
  );
}

export function Select({ label, error, id, options, placeholder, ...rest }: Base & React.SelectHTMLAttributes<HTMLSelectElement> & { options: Option[]; placeholder?: string }) {
  return (
    <div>
      <label htmlFor={id} className="field-label">{label}</label>
      <div className="relative">
        <select id={id} aria-invalid={Boolean(error)} className="field appearance-none pr-10" {...rest}>
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-mist" />
      </div>
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  );
}

export function RadioGroup({ label, error, name, options, value, onChange }: {
  label: string; error?: string; name: string; options: Option[]; value: string; onChange: (v: string) => void;
}) {
  return (
    <fieldset>
      <legend className="field-label">{label}</legend>
      <div className="grid gap-2 sm:grid-cols-2">
        {options.map((o) => {
          const active = value === o.id;
          return (
            <label
              key={o.id}
              className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3.5 py-2.5 text-sm transition-colors ${
                active ? "border-primary bg-primary-soft/60 text-ink" : "border-line bg-white text-slate hover:border-primary-light"
              }`}
            >
              <input type="radio" name={name} value={o.id} checked={active} onChange={() => onChange(o.id)} className="sr-only" />
              <span className={`flex size-4 items-center justify-center rounded-full border-2 ${active ? "border-primary" : "border-mist"}`}>
                {active && <span className="size-2 rounded-full bg-primary" />}
              </span>
              {o.label}
            </label>
          );
        })}
      </div>
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </fieldset>
  );
}

export function Spinner({ className = "size-4" }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
