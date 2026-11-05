import React from "react";
import { requireAdmin } from "@/lib/auth/rbac";
import { AdminDashboardClient } from "@/components/admin/AdminDashboardClient";

export default async function AdminDashboardPage() {
  const { user } = await requireAdmin();

  return (
    <div className="space-y-6">
      <AdminDashboardClient adminEmail={user.email || "admin@ourarchive.aid"} />
    </div>
  );
}
