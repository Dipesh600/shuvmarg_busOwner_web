import FleetSeatWorkstation from "@/components/dashboard/fleet-workstation/FleetSeatWorkstation";

export default async function FleetWorkstationPage({ params }: { params: Promise<{ fleetId: string }> }) {
  const { fleetId } = await params;
  return <FleetSeatWorkstation fleetId={fleetId} />;
}
