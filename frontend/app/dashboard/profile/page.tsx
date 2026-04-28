"use client";

import { useState } from "react";

import { useUpdateProfileMutation } from "@/hooks/useLmsQueries";
import { useAuthStore } from "@/store/auth";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

export default function ProfilePage() {
  const userEmail = useAuthStore((state) => state.userEmail) ?? "";
  const updateProfile = useUpdateProfileMutation();
  const [email, setEmail] = useState(userEmail);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  return (
    <div className="space-y-6">
      <Card>
        <h1 className="text-2xl font-semibold">Profile</h1>
        <p className="mt-2 text-sm text-slate-600">Update your login email and password here.</p>
      </Card>
      <Card>
        <div className="grid gap-4 md:max-w-xl">
          <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Input
            label="Current Password"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
          <Input
            label="New Password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <div>
            <Button
              onClick={() =>
                updateProfile.mutate({
                  email,
                  current_password: currentPassword,
                  new_password: newPassword || undefined
                })
              }
              disabled={updateProfile.isPending}
            >
              {updateProfile.isPending ? "Saving..." : "Save Profile"}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
