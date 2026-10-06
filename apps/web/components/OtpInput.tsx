"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";

interface Props {
  value: string;
  onChange: (v: string) => void;
  onComplete?: (v: string) => void;
  length?: number;
  error?: boolean;
  disabled?: boolean;
}

export function OtpInput({ value, onChange, onComplete, length = 6, error, disabled }: Props) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = Array.from({ length }, (_, i) => value[i] ?? "");

  useEffect(() => { refs.current[0]?.focus(); }, []);

  const setAt = (i: number, ch: string) => {
    const next = digits.slice();
    next[i] = ch;
    const joined = next.join("");
    onChange(joined);
    if (ch && i < length - 1) refs.current[i + 1]?.focus();
    if (joined.length === length && !next.includes("")) onComplete?.(joined);
  };

  return (
    <motion.div
      animate={error ? { x: [0, -8, 8, -6, 6, 0] } : { x: 0 }}
      transition={{ duration: 0.4 }}
      className="flex justify-center gap-2 sm:gap-3"
    >
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          inputMode="numeric"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          pattern="[0-9]*"
          maxLength={1}
          disabled={disabled}
          value={d}
          aria-label={`Digit ${i + 1}`}
          onChange={(e) => {
            const v = e.target.value.replace(/\D/g, "");
            if (v.length > 1) {
              // paste handling
              const chars = v.slice(0, length).split("");
              const next = digits.slice();
              chars.forEach((c, j) => { if (i + j < length) next[i + j] = c; });
              const joined = next.join("");
              onChange(joined);
              refs.current[Math.min(i + chars.length, length - 1)]?.focus();
              if (!next.includes("") && joined.length === length) onComplete?.(joined);
              return;
            }
            setAt(i, v);
          }}
          onKeyDown={(e) => {
            if (e.key === "Backspace" && !digits[i] && i > 0) {
              refs.current[i - 1]?.focus();
              setAt(i - 1, "");
            }
            if (e.key === "ArrowLeft" && i > 0) refs.current[i - 1]?.focus();
            if (e.key === "ArrowRight" && i < length - 1) refs.current[i + 1]?.focus();
          }}
          onFocus={(e) => e.target.select()}
          className={`size-12 rounded-xl border bg-white text-center text-xl font-bold text-ink outline-none transition-[box-shadow,border-color] sm:size-14 sm:text-2xl ${
            error ? "border-danger" : d ? "border-primary" : "border-line"
          } focus:border-primary focus:shadow-glow disabled:opacity-60`}
        />
      ))}
    </motion.div>
  );
}
