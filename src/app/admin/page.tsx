import { requireAdminUser } from "@/lib/admin";
import AdminDashboardClient from "./AdminDashboardClient";

export const metadata = {
  title: "Panel de Administración | StakeControl",
  description: "Gestión de usuarios, suscripciones y control de la plataforma StakeControl",
};

export default async function AdminPage() {
  const adminUser = await requireAdminUser();

  return (
    <AdminDashboardClient
      adminName={adminUser.name || adminUser.email}
      adminEmail={adminUser.email}
    />
  );
}
