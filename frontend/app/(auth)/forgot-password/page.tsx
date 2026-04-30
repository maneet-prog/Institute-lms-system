import Link from "next/link";

import { ForgotPasswordForm } from "@/components/forms/ForgotPasswordForm";
import { Card } from "@/components/ui/Card";

export default function ForgotPasswordPage() {
  return (
    <section className="page-shell max-w-md">
      <Card>
        <h1 className="mb-2 text-2xl font-semibold">Forgot Password</h1>
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
