import Link from "next/link";

import { ResetPasswordForm } from "@/components/forms/ResetPasswordForm";
import { Card } from "@/components/ui/Card";

export default function ResetPasswordPage() {
  return (
    <section className="max-w-md">
      <Card>
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-700">Password Reset</p>
        <h1 className="mb-2 mt-2 text-2xl font-semibold text-[#A93A30]">Choose a new password</h1>
        <p className="mb-4 text-sm text-slate-600">
          Set a new password for your TecOnline account using the secure link from your email.
        </p>
        <ResetPasswordForm />
        <p className="mt-4 text-sm text-slate-600">
          Back to{" "}
          <Link href="/login" className="text-brand-700 hover:underline">
            login
          </Link>
        </p>
      </Card>
    </section>
  );
}
