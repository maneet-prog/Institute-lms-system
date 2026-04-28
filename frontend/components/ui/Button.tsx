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
        "rounded-md px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50",
        {
          "bg-brand-600 text-white hover:bg-brand-700": variant === "primary",
          "border border-slate-300 bg-white hover:bg-slate-100": variant === "secondary",
          "bg-rose-600 text-white hover:bg-rose-700": variant === "danger"
        },
        className
      )}
      {...props}
    />
  );
}
