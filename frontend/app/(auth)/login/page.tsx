import Link from "next/link";

import { LoginForm } from "@/components/forms/LoginForm";
import { Card } from "@/components/ui/Card";

export default function LoginPage() {
  return (
    <section className="page-shell max-w-md">
      <Card>
        <h1 className="mb-2 text-2xl font-semibold">Login</h1>
        <p className="mb-4 text-sm text-slate-600">Access your LMS dashboard based on your role.</p>
        <LoginForm />
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
