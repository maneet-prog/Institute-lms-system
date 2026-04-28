import { PropsWithChildren } from "react";
import clsx from "clsx";

export function Card({ children, className }: PropsWithChildren<{ className?: string }>) {
  return <div className={clsx("rounded-xl border bg-white p-4 shadow-sm", className)}>{children}</div>;
}
