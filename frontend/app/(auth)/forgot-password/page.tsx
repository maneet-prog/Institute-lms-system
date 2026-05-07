import Link from "next/link";

import { ForgotPasswordForm } from "@/components/forms/ForgotPasswordForm";
import { Card } from "@/components/ui/Card";

export default function ForgotPasswordPage() {
  return (
    <section className="max-w-md">
      <Card>
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-700">Password Help</p>
        <h1 className="mb-2 mt-2 text-2xl font-semibold text-[#A93A30]">Reset your TecOnline access</h1>
        <p className="mb-4 text-sm text-slate-600">
          Enter the same email and mobile number used during registration. If the account exists, a temporary password is emailed to you.
        </p>
        <ForgotPasswordForm />
        <p className="mt-4 text-sm text-slate-600">
          Remembered it?{" "}
          <Link href="/login" className="text-brand-700 hover:underline">
            Back to login
          </Link>
        </p>
      </Card>
    </section>
  );
}
