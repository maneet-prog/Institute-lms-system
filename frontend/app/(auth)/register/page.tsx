import Link from "next/link";

import { RegisterForm } from "@/components/forms/RegisterForm";
import { Card } from "@/components/ui/Card";

export default function RegisterPage() {
  return (
    <section className="max-w-2xl">
      <Card>
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-700">New Student Access</p>
        <h1 className="mb-2 mt-2 text-2xl font-semibold text-[#A93A30]">Join TecOnline Campus</h1>
        <p className="mb-4 text-sm text-slate-600">
          Register with your chosen course path, verify both OTPs, and then wait for admin approval.
        </p>
        <RegisterForm />
        <p className="mt-4 text-sm text-slate-600">
          Already have an account?{" "}
          <Link href="/login" className="text-brand-700 hover:underline">
            Sign in
          </Link>
        </p>
      </Card>
    </section>
  );
}
