"use client";

import { FormEvent, useState } from "react";

import { useForgotPassword } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { getApiErrorMessage } from "@/utils/apiError";

export function ForgotPasswordForm() {
  const forgotPassword = useForgotPassword();
  const [email, setEmail] = useState("");
  const [mobNo, setMobNo] = useState("");

  const errorMessage = forgotPassword.error
    ? getApiErrorMessage(forgotPassword.error, "Unable to process this request.")
    : null;

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    forgotPassword.mutate({ email, mob_no: mobNo });
  };

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <Input label="Email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
      <Input label="Mobile Number" required value={mobNo} onChange={(event) => setMobNo(event.target.value)} />
      <Button type="submit" className="w-full" disabled={forgotPassword.isPending}>
        {forgotPassword.isPending ? "Sending..." : "Send Temporary Password"}
      </Button>
      {forgotPassword.isSuccess ? (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <p>{forgotPassword.data.message}</p>
          {forgotPassword.data.delivery?.temporary_password ? (
            <p className="mt-2 text-xs text-emerald-700">
              Dev preview temporary password: {forgotPassword.data.delivery.temporary_password}
            </p>
          ) : null}
        </div>
      ) : null}
      {errorMessage ? <p className="text-sm text-rose-600">{errorMessage}</p> : null}
    </form>
  );
}
