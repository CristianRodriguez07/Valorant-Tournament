import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, ShieldCheck, Users } from "lucide-react";

import { auth } from "@/auth";
import { AdminSignalCard } from "@/components/dashboard/admin-signal-card";
import { RosterTable } from "@/components/dashboard/roster-table";
import { SquadIntegrityPanel } from "@/components/dashboard/squad-integrity-panel";
import { Button } from "@/components/ui/button";
import { formatRegistrationStatus } from "@/features/registration/status";
import { getRosterForTeam } from "@/features/brackets/queries";
import { getCaptainMission } from "@/features/tournaments/queries";

export default async function RosterPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  const registration = await getCaptainMission(session.user.id);
  const team = registration ? await getRosterForTeam(registration.teamId) : null;

  return (
    <div className="space-y-5">
      <section className="arena-panel p-6 md:p-8">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="arena-kicker flex items-center gap-2">
              <Users className="size-4" />
              Cámara de plantilla
            </div>
            <h1 className="arena-display mt-3 text-7xl leading-none text-valorant-bone md:text-9xl">
              Jugadores fijados
            </h1>
          </div>
          {registration ? (
            <div className="arena-panel-soft flex items-center gap-2 px-4 py-3 text-sm font-black uppercase tracking-[0.14em] text-valorant-red">
              <ShieldCheck className="size-4" />
              {formatRegistrationStatus(registration.status)}
            </div>
          ) : null}
        </div>
      </section>

      {team?.members?.length ? (
        <>
          <section className="arena-panel-soft flex flex-col gap-3 p-5 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="text-xs font-black uppercase tracking-[0.18em] text-valorant-muted">Equipo inscrito</div>
              <div className="arena-display mt-1 text-5xl leading-none text-valorant-bone">{team.name}</div>
            </div>
            <div className="text-sm font-black uppercase tracking-[0.18em] text-valorant-green">
              {team.members.length} / 6 jugadores fijados
            </div>
          </section>
          <section className="control-room-side control-room-side-wide">
            <SquadIntegrityPanel members={team.members} />
            {registration ? <AdminSignalCard status={formatRegistrationStatus(registration.status)} /> : null}
          </section>
          <RosterTable members={team.members} />
        </>
      ) : registration ? (
        <section className="arena-panel p-6">
          <p className="font-semibold text-valorant-bone">Tu inscripción existe, pero todavía no hay jugadores asociados.</p>
          <p className="mt-2 text-sm text-valorant-muted">Vuelve al panel y revisa el estado del registro antes de abrir un nuevo formulario.</p>
          <Button asChild variant="outline" className="arena-button-outline mt-5 h-12 rounded-none px-6 font-black uppercase tracking-[0.16em]">
            <Link href="/dashboard">Volver al panel <ArrowRight className="size-4" /></Link>
          </Button>
        </section>
      ) : (
        <section className="arena-panel p-6">
          <p className="font-semibold text-valorant-bone">No hay plantilla registrada todavía.</p>
          <p className="mt-2 text-sm text-valorant-muted">Crea tu equipo para que las plazas aparezcan aquí.</p>
          <Button asChild className="arena-button mt-5 h-12 rounded-none px-6 font-black uppercase tracking-[0.16em]">
            <Link href="/register">Inscribirme <ArrowRight className="size-4" /></Link>
          </Button>
        </section>
      )}
    </div>
  );
}
