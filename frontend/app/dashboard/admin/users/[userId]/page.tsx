"use client";

import { useParams } from "next/navigation";

import { UserDetailsView } from "@/components/users/UserDetailsView";

export default function AdminUserDetailsPage() {
  const params = useParams<{ userId: string }>();
  const userId = params.userId;

  return <UserDetailsView userId={userId} />;
}
