import Link from "next/link";

import { LoginForm } from "@/components/forms/LoginForm";
import { Card } from "@/components/ui/Card";

export default function LoginPage() {
  return (
    <section className="max-w-md">
      <Card>
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-700">Welcome Back</p>
        <h1 className="mb-2 mt-2 text-2xl font-semibold text-[#A93A30]">Login to TecOnline Campus</h1>
        <p className="mb-4 text-sm text-slate-600">Access your dashboard, batches, resources, and exam workspaces based on your role.</p>
        <LoginForm />
        <p className="mt-4 text-sm text-slate-600">
          Forgot your password?{" "}
          <Link href="/forgot-password" className="text-brand-700 hover:underline">
            Reset with email and mobile
          </Link>
        </p>
        <p className="mt-4 text-sm text-slate-600">
          New user?{" "}
          <Link href="/register" className="text-brand-700 hover:underline">
            Create account
          </Link>
        </p>
      </Card>
    </section>
  );
}
