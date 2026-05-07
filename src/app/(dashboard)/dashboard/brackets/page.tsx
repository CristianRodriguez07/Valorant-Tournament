import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, CalendarClock, GitBranch, Swords } from "lucide-react";

import { auth } from "@/auth";
import { BracketCard } from "@/components/dashboard/bracket-card";
import { DoubleElimBracket } from "@/components/dashboard/double-elim-bracket";
import { MatchActionPanel } from "@/components/dashboard/match-action-panel";
import { PlayerHistoryPanel } from "@/components/dashboard/player-history-panel";
import { ReadyRoomPanel } from "@/components/dashboard/ready-room-panel";
import { Button } from "@/components/ui/button";
import { getNextMatchForTeam, getTournamentBracket, getUpcomingMatchesForTeam } from "@/features/brackets/queries";
import { getTeamTournamentHistory, getTeamTournamentStanding } from "@/features/profiles/queries";
import { formatRegistrationStatus } from "@/features/registration/status";
import { getCaptainMission } from "@/features/tournaments/queries";

export default async function BracketsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  const registration = await getCaptainMission(session.user.id);
  const matches = registration ? await getUpcomingMatchesForTeam(registration.teamId) : [];
  const nextMatch = registration ? await getNextMatchForTeam(registration.teamId) : null;
  const bracket = registration ? await getTournamentBracket(registration.tournamentId) : [];
  const standing = registration ? await getTeamTournamentStanding(registration.tournamentId, registration.teamId) : null;
  const history = registration ? await getTeamTournamentHistory(registration.tournamentId, registration.teamId) : [];

  return (
    <div className="space-y-5">
      <section className="arena-panel p-6 md:p-8">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="arena-kicker flex items-center gap-2">
              <GitBranch className="size-4" />
              Mando del cuadro
            </div>
            <h1 className="arena-display mt-3 text-7xl leading-none text-valorant-bone md:text-9xl">
              Canal de partidas
            </h1>
          </div>
          <Swords className="hidden size-14 text-valorant-red md:block" />
        </div>
      </section>

      {registration ? (
        <section className="grid gap-4">
          <ReadyRoomPanel
            registrationId={registration.registrationId}
            registrationStatus={registration.status}
            checkedInAt={registration.checkedInAt}
            match={nextMatch}
            compactLink={false}
          />
          <MatchActionPanel match={nextMatch} checkedInAt={registration.checkedInAt} />
          {bracket.length ? <DoubleElimBracket matches={bracket} focusTeamId={registration.teamId} /> : null}
          <PlayerHistoryPanel standing={standing} matches={history} teamId={registration.teamId} />
        </section>
      ) : null}

      <section className="grid gap-4">
        {matches.length ? (
          matches.map((match) => <BracketCard key={match.id} match={match} />)
        ) : registration ? (
          <div className="arena-panel p-6 md:p-8">
            <div className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.16em] text-valorant-ember">
              <CalendarClock className="size-4" />
              Cuadro pendiente
            </div>
            <h2 className="arena-display mt-4 text-6xl leading-none text-valorant-bone">{registration.teamName}</h2>
            <p className="mt-4 max-w-2xl text-base font-medium leading-7 text-valorant-muted">
              Tu inscripción está en estado {formatRegistrationStatus(registration.status).toLowerCase()}.
              Los enfrentamientos aparecerán aquí cuando administración publique el cuadro.
            </p>

            <div className="mt-7 grid gap-3 md:grid-cols-[1fr_0.7fr]">
              <div className="arena-panel-soft p-4">
                <div className="mb-3 text-xs font-black uppercase tracking-[0.18em] text-valorant-muted">Estructura prevista</div>
                <div className="grid grid-cols-[1fr_auto_1fr_auto_1fr] items-center gap-2 text-center">
                  <span className="bg-valorant-red/18 px-2 py-3 text-xs font-black uppercase tracking-[0.14em] text-valorant-bone">Ronda 1</span>
                  <span className="h-px bg-valorant-red" />
                  <span className="bg-valorant-red/18 px-2 py-3 text-xs font-black uppercase tracking-[0.14em] text-valorant-bone">Semifinal</span>
                  <span className="h-px bg-valorant-red" />
                  <span className="bg-valorant-red px-2 py-3 text-xs font-black uppercase tracking-[0.14em] text-valorant-bone">Final</span>
                </div>
              </div>

              <div className="arena-panel-soft p-4">
                <div className="text-xs font-black uppercase tracking-[0.18em] text-valorant-muted">Señal de administración</div>
                <div className="arena-display mt-3 text-4xl leading-none text-valorant-red">Esperando publicación</div>
              </div>
            </div>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Button asChild variant="outline" className="arena-button-outline h-12 rounded-none px-6 font-black uppercase tracking-[0.16em]">
                <Link href="/dashboard/roster">Ver plantilla <ArrowRight className="size-4" /></Link>
              </Button>
              <Button asChild variant="outline" className="arena-button-outline h-12 rounded-none px-6 font-black uppercase tracking-[0.16em]">
                <Link href="/dashboard">Volver al panel</Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="arena-panel p-6">
            <p className="font-semibold text-valorant-bone">Aún no hay enfrentamientos asignados.</p>
            <p className="mt-2 text-sm text-valorant-muted">Registra tu equipo para entrar en la cola de revisión del cuadro.</p>
            <Button asChild className="arena-button mt-5 h-12 rounded-none px-6 font-black uppercase tracking-[0.16em]">
              <Link href="/register">Inscribirme <ArrowRight className="size-4" /></Link>
            </Button>
          </div>
        )}
      </section>
    </div>
  );
}
