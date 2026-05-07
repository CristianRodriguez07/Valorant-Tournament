import { RadioTower } from "lucide-react";

export function AdminSignalCard({ status }: { status: string }) {
  return (
    <section className="admin-signal-card">
      <div className="concept-kicker flex items-center gap-2">
        <RadioTower className="size-4" />
        Señal de administración
      </div>
      <strong>{status}</strong>
      <p>El equipo de operaciones puede ver este equipo en la cola de la sala de control.</p>
    </section>
  );
}
