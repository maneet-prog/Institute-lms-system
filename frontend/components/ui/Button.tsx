"use client";

import { ButtonHTMLAttributes } from "react";
import clsx from "clsx";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger";
}

export function Button({ className, variant = "primary", ...props }: Props) {
  return (
    <button
      className={clsx(
        "rounded-full px-4 py-2.5 text-sm font-semibold transition duration-200 disabled:cursor-not-allowed disabled:opacity-50",
        {
          "bg-[#A93A30] text-white shadow-lg shadow-[#A93A30]/15 hover:-translate-y-0.5 hover:bg-[#143556]": variant === "primary",
          "border border-slate-200 bg-white/90 text-slate-700 shadow-sm hover:border-brand-100 hover:bg-brand-50": variant === "secondary",
          "bg-rose-600 text-white shadow-lg shadow-rose-200 hover:-translate-y-0.5 hover:bg-rose-700": variant === "danger"
        },
        className
      )}
      {...props}
    />
  );
}
