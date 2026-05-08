"use client";

import { ButtonHTMLAttributes, ReactNode } from "react";
import clsx from "clsx";

import { Button } from "@/components/ui/Button";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: ReactNode;
  label: string;
  variant?: "primary" | "secondary" | "danger";
}

export function IconButton({ className, icon, label, variant = "secondary", ...props }: Props) {
  return (
    <Button
      type="button"
      variant={variant}
      aria-label={label}
      title={label}
      className={clsx("flex h-10 w-10 items-center justify-center rounded-2xl px-0 py-0", className)}
      {...props}
    >
      <span aria-hidden="true">{icon}</span>
      <span className="sr-only">{label}</span>
    </Button>
  );
}
