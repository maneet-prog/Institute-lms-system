"use client";

import { FormEvent, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useLogin } from "@/hooks/useAuth";
import { getApiErrorMessage } from "@/utils/apiError";

export function LoginForm() {
  const login = useLogin();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const loginErrorMessage = (() => {
    if (!login.error) {
      return null;
    }
    return getApiErrorMessage(login.error, "Unable to login right now. Please try again.");
  })();

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    login.mutate({ email, password });
  };

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <Input label="Email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      <Input
        label="Password"
        type="password"
        required
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <Button type="submit" className="w-full" disabled={login.isPending}>
        {login.isPending ? "Signing in..." : "Login"}
      </Button>
      {loginErrorMessage ? <p className="text-sm text-rose-600">{loginErrorMessage}</p> : null}
    </form>
  );
}
