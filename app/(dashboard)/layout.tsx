import { DashboardShell } from "@/components/vin-music/dashboard-shell";

export default function VinVibeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardShell>{children}</DashboardShell>;
}
