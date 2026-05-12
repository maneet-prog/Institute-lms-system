"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import { useResetPassword } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { getApiErrorMessage } from "@/utils/apiError";

export function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const resetPassword = useResetPassword();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const errorMessage = resetPassword.error
    ? getApiErrorMessage(resetPassword.error, "Unable to reset password.")
    : null;
  const validationMessage = useMemo(() => {
    if (!token) return "This reset link is missing a token.";
    if (password.length < 8) return "Password must be at least 8 characters.";
    if (password !== confirmPassword) return "Passwords do not match.";
    return null;
  }, [confirmPassword, password, token]);

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (validationMessage) {
      return;
    }
    resetPassword.mutate({ token, password });
  };

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <Input label="New Password" type="password" required value={password} onChange={(event) => setPassword(event.target.value)} />
      <Input
        label="Confirm Password"
        type="password"
        required
        value={confirmPassword}
        onChange={(event) => setConfirmPassword(event.target.value)}
      />
      {validationMessage ? <p className="text-sm text-amber-700">{validationMessage}</p> : null}
      <Button type="submit" className="w-full" disabled={resetPassword.isPending || Boolean(validationMessage)}>
        {resetPassword.isPending ? "Resetting..." : "Set New Password"}
      </Button>
      {resetPassword.isSuccess ? (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <p>{resetPassword.data.message}</p>
          <p className="mt-2">
            <Link href="/login" className="font-medium text-emerald-900 underline">
              Return to login
            </Link>
          </p>
        </div>
      ) : null}
      {errorMessage ? <p className="text-sm text-rose-600">{errorMessage}</p> : null}
    </form>
  );
}
