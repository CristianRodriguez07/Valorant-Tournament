import { CheckCircle2, Clock3, FileX2, Rocket, ShieldAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { TournamentRegistration } from "@/db/schema";
import { launchAdminMatch, reviewTournamentRegistration } from "@/features/admin/actions";
import { formatRegistrationStatus } from "@/features/registration/status";

type AdminRegistrationCardProps = {
  item: {
    registrationId: string;
    status: TournamentRegistration["status"];
    checkedInAt: Date | null;
    rejectionReason: string | null;
    teamName: string;
    tournamentTitle: string;
    memberCount: number;
    assignedMatchCount: number;
    createdAt: Date;
  };
};

export function AdminRegistrationCard({ item }: AdminRegistrationCardProps) {
  const statusLabel = formatRegistrationStatus(item.status);

  return (
    <article className="admin-queue-card">
      <div className="admin-queue-card-head">
        <div>
          <span>{item.tournamentTitle}</span>
          <h2>{item.teamName}</h2>
        </div>
        <strong>{statusLabel}</strong>
      </div>

      <div className="admin-queue-meta">
        <p>{item.memberCount} / 6 jugadores fijados</p>
        <small>{item.checkedInAt ? "Presencia confirmada" : "Presencia pendiente"}</small>
        <small>{item.assignedMatchCount ? "Partida creada" : "Sin partida asignada"}</small>
        {item.rejectionReason ? <small>Motivo: {item.rejectionReason}</small> : null}
      </div>

      <div className="admin-queue-actions">
        <form action={reviewTournamentRegistration}>
          <input type="hidden" name="registrationId" value={item.registrationId} />
          <input type="hidden" name="decision" value="approve" />
          <Button
            disabled={item.status === "approved" || item.status === "checked_in"}
            className="arena-button h-11 rounded-none px-5 font-black uppercase tracking-[0.14em]"
          >
            <CheckCircle2 className="size-4" />
            Aprobar
          </Button>
        </form>

        <form action={reviewTournamentRegistration}>
          <input type="hidden" name="registrationId" value={item.registrationId} />
          <input type="hidden" name="decision" value="waitlist" />
          <Button
            disabled={item.status === "waitlisted"}
            variant="outline"
            className="arena-button-outline h-11 rounded-none px-5 font-black uppercase tracking-[0.14em]"
          >
            <Clock3 className="size-4" />
            Lista de espera
          </Button>
        </form>

        <form action={launchAdminMatch}>
          <input type="hidden" name="registrationId" value={item.registrationId} />
          <Button
            disabled={
              item.assignedMatchCount > 0 ||
              (item.status !== "approved" && item.status !== "checked_in")
            }
            variant="outline"
            className="arena-button-outline h-11 rounded-none px-5 font-black uppercase tracking-[0.14em]"
          >
            <Rocket className="size-4" />
            {item.assignedMatchCount ? "Partida creada" : "Lanzar partida"}
          </Button>
        </form>
      </div>

      <form action={reviewTournamentRegistration} className="admin-reject-form">
        <input type="hidden" name="registrationId" value={item.registrationId} />
        <input type="hidden" name="decision" value="reject" />
        <label>
          <span>Motivo de rechazo</span>
          <input
            name="rejectionReason"
            required
            minLength={4}
            placeholder="Riot ID duplicado, plantilla inválida..."
            defaultValue={item.status === "rejected" ? item.rejectionReason ?? "" : ""}
          />
        </label>
        <Button
          variant="outline"
          className="arena-button-outline h-11 rounded-none px-5 font-black uppercase tracking-[0.14em]"
        >
          <FileX2 className="size-4" />
          Rechazar
        </Button>
      </form>

      <div className="admin-queue-footer">
        <ShieldAlert className="size-4" />
        Enviado el {item.createdAt.toLocaleString("es-ES")}
      </div>
    </article>
  );
}
