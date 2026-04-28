"use client";

import { FormEvent, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useCreateInstituteMutation } from "@/hooks/useLmsQueries";

export function InstituteForm() {
  const createInstitute = useCreateInstituteMutation();
  const [form, setForm] = useState({
    name: "",
    email: "",
    mob_no: "",
    country: "",
    state: "",
    place: "",
    pincode: "",
    admin_first_name: "",
    admin_last_name: "",
    admin_password: ""
  });

  const update = (key: keyof typeof form, value: string) => setForm((prev) => ({ ...prev, [key]: value }));

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    createInstitute.mutate(form, {
      onSuccess: () =>
        setForm({
          name: "",
          email: "",
          mob_no: "",
          country: "",
          state: "",
          place: "",
          pincode: "",
          admin_first_name: "",
          admin_last_name: "",
          admin_password: ""
        })
    });
  };

  return (
    <form className="grid gap-3 sm:grid-cols-2" onSubmit={onSubmit}>
      <div className="sm:col-span-2">
        <h3 className="text-lg font-semibold">Create Institute</h3>
        <p className="mt-1 text-sm text-slate-600">
          The institute email and password below will also become the login credentials for the institute admin.
        </p>
      </div>
      <Input label="Institute Name" required value={form.name} onChange={(e) => update("name", e.target.value)} />
      <Input label="Email" type="email" required value={form.email} onChange={(e) => update("email", e.target.value)} />
      <Input label="Mobile" required value={form.mob_no} onChange={(e) => update("mob_no", e.target.value)} />
      <Input label="Country" required value={form.country} onChange={(e) => update("country", e.target.value)} />
      <Input label="State" required value={form.state} onChange={(e) => update("state", e.target.value)} />
      <Input label="Place" required value={form.place} onChange={(e) => update("place", e.target.value)} />
      <Input label="Pincode" required value={form.pincode} onChange={(e) => update("pincode", e.target.value)} />
      <Input
        label="Admin First Name"
        required
        value={form.admin_first_name}
        onChange={(e) => update("admin_first_name", e.target.value)}
      />
      <Input
        label="Admin Last Name"
        required
        value={form.admin_last_name}
        onChange={(e) => update("admin_last_name", e.target.value)}
      />
      <Input
        label="Admin Password"
        type="password"
        required
        value={form.admin_password}
        onChange={(e) => update("admin_password", e.target.value)}
      />
      <div className="sm:col-span-2">
        <Button type="submit" disabled={createInstitute.isPending}>
          {createInstitute.isPending ? "Creating..." : "Create Institute"}
        </Button>
      </div>
    </form>
  );
}
