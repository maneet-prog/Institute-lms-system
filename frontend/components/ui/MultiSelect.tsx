"use client";

interface Option {
  label: string;
  value: string;
}

interface Props {
  label: string;
  options: Option[];
  value: string[];
  onChange: (next: string[]) => void;
  required?: boolean;
}

export function MultiSelect({ label, options, value, onChange, required = false }: Props) {
  const toggle = (target: string) => {
    if (value.includes(target)) {
      onChange(value.filter((item) => item !== target));
      return;
    }
    onChange([...value, target]);
  };

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-slate-700">
        {label}
        {required ? <span className="ml-1 text-rose-600">*</span> : null}
      </p>
      <div className="max-h-36 space-y-1 overflow-y-auto rounded-md border p-2">
        {options.map((option) => (
          <label key={option.value} className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={value.includes(option.value)}
              onChange={() => toggle(option.value)}
            />
            {option.label}
          </label>
        ))}
      </div>
    </div>
  );
}
