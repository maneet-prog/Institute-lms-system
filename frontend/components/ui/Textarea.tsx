import { TextareaHTMLAttributes } from "react";
import clsx from "clsx";

interface Props extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function Textarea({ label, error, className, ...props }: Props) {
  return (
    <label className="block space-y-1">
      {label ? (
        <span className="text-sm font-medium text-slate-700">
          {label}
          {props.required ? <span className="ml-1 text-rose-600">*</span> : null}
        </span>
      ) : null}
      <textarea
        className={clsx(
          "min-h-28 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none ring-brand-500 focus:ring-2",
          className
        )}
        {...props}
      />
      {error ? <span className="text-xs text-rose-600">{error}</span> : null}
    </label>
  );
}
