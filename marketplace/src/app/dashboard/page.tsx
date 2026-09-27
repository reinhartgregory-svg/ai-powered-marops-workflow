import type { Metadata } from "next";
import { ClientDashboard } from "@/components/dashboard/client-dashboard";
import { FreelancerDashboard } from "@/components/dashboard/freelancer-dashboard";
import { Container } from "@/components/ui/layout";
import { requireUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const user = await requireUser("/dashboard");
  return (
    <Container className="py-10 sm:py-12">
      {user.role === "client" ? <ClientDashboard user={user} /> : <FreelancerDashboard user={user} />}
    </Container>
  );
}
