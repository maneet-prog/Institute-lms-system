import { SelectHTMLAttributes } from "react";

interface Option {
  label: string;
  value: string;
}

interface Props extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: Option[];
}

export function Select({ label, options, ...props }: Props) {
  return (
    <label className="block space-y-1">
      {label ? (
        <span className="text-sm font-medium text-slate-700">
          {label}
          {props.required ? <span className="ml-1 text-rose-600">*</span> : null}
        </span>
      ) : null}
      <select
        className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none ring-brand-500 focus:ring-2"
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
