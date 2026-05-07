import { PropsWithChildren } from "react";
import clsx from "clsx";

export function Card({ children, className }: PropsWithChildren<{ className?: string }>) {
  return <div className={clsx("brand-card rounded-[1.75rem] border border-white/70 p-5 shadow-xl shadow-slate-200/40", className)}>{children}</div>;
}
