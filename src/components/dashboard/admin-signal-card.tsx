import { RadioTower } from "lucide-react";

export function AdminSignalCard({ status }: { status: string }) {
  return (
    <section className="admin-signal-card">
      <div className="concept-kicker flex items-center gap-2">
        <RadioTower className="size-4" />
        Admin signal
      </div>
      <strong>{status}</strong>
      <p>Operations staff can see this squad in the control room queue.</p>
    </section>
  );
}
