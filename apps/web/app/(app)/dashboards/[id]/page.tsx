import DashboardClient from "./DashboardClient";

export default async function DashboardPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return <DashboardClient dashboardId={resolvedParams.id} />;
}
