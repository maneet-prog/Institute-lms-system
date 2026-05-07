"use client";

import { PropsWithChildren } from "react";

import { Button } from "@/components/ui/Button";

interface Props extends PropsWithChildren {
  title: string;
  open: boolean;
  onClose: () => void;
}

export function Modal({ title, open, onClose, children }: Props) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#A93A30]/40 p-4 backdrop-blur-sm">
      <div className="brand-card max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[1.75rem] border border-white/70 p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-[#A93A30]">{title}</h3>
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
        {children}
      </div>
    </div>
  );
}
