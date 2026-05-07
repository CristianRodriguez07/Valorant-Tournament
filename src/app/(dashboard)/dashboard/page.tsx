import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, CalendarClock, Lock, Trophy } from "lucide-react";

import { auth } from "@/auth";
import { AdminSignalCard } from "@/components/dashboard/admin-signal-card";
import { MissionFeed } from "@/components/dashboard/mission-feed";
import { PlayerHistoryPanel } from "@/components/dashboard/player-history-panel";
import { ReadyRoomPanel } from "@/components/dashboard/ready-room-panel";
import { SquadIntegrityPanel } from "@/components/dashboard/squad-integrity-panel";
import { Button } from "@/components/ui/button";
import { formatRegistrationStatus } from "@/features/registration/status";
import { getNextMatchForTeam, getRosterForTeam } from "@/features/brackets/queries";
import { buildMissionItems, formatMatchDate } from "@/features/matchday/status";
import { getTeamTournamentHistory, getTeamTournamentStanding } from "@/features/profiles/queries";
import { getCaptainMission } from "@/features/tournaments/queries";

const agentProfiles = [
  ["Duelista", "Kraken"],
  ["Iniciador", "Rift"],
  ["Centinela", "Wraith"],
  ["Controlador", "Spectre"],
  ["Duelista", "Nova"],
  ["Apoyo", "Aegis"],
] as const;

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  const activeRegistration = await getCaptainMission(session.user.id);
  const team = activeRegistration ? await getRosterForTeam(activeRegistration.teamId) : null;
  const nextMatch = activeRegistration ? await getNextMatchForTeam(activeRegistration.teamId) : null;
  const standing = activeRegistration
    ? await getTeamTournamentStanding(activeRegistration.tournamentId, activeRegistration.teamId)
    : null;
  const history = activeRegistration
    ? await getTeamTournamentHistory(activeRegistration.tournamentId, activeRegistration.teamId)
    : [];
  const members = [...(team?.members ?? [])].sort((a, b) => a.position - b.position);
  const missionItems = activeRegistration
    ? buildMissionItems({
        registrationStatus: activeRegistration.status,
        memberCount: members.length,
        checkedInAt: activeRegistration.checkedInAt,
        nextMatch,
      })
    : [];

  return (
    <div className="dash-console">
      {activeRegistration ? (
        <>
          <section className="dash-header">
            <div>
              <div className="concept-kicker">Resumen táctico</div>
              <div className="mt-4 flex flex-col gap-4 xl:flex-row xl:items-end">
                <h1 className="dash-team-title">{activeRegistration.teamName}</h1>
                <span className="dash-team-id">{formatRegistrationStatus(activeRegistration.status)}</span>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-5 text-sm font-black uppercase tracking-[0.14em] text-valorant-muted">
                <span className="flex items-center gap-2">
                  <Lock className="size-4" /> {members.length} / 6 jugadores fijados
                </span>
                <span className="flex items-center gap-2">
                  <CalendarClock className="size-4" />
                  Empieza {formatMatchDate(activeRegistration.tournamentStartsAt)}
                </span>
              </div>
            </div>
            <div className="dash-season">
              {activeRegistration.tournamentTitle} {" // "} <strong>{activeRegistration.tournamentStatus}</strong>
            </div>
          </section>

          <MissionFeed items={missionItems} />

          <section className="control-room-layout">
            <ReadyRoomPanel
              registrationId={activeRegistration.registrationId}
              registrationStatus={activeRegistration.status}
              checkedInAt={activeRegistration.checkedInAt}
              match={nextMatch}
            />
            <div className="control-room-side">
              <SquadIntegrityPanel members={members} />
              <AdminSignalCard status={formatRegistrationStatus(activeRegistration.status)} />
            </div>
          </section>

          <PlayerHistoryPanel standing={standing} matches={history} teamId={activeRegistration.teamId} />

          <section className="dash-roster-head">
            <div className="concept-kicker">Plantilla ({members.length}/6)</div>
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-valorant-bone">
              <Lock className="size-4 text-valorant-red" />
              Misión de capitán activa
            </div>
          </section>

          <section className="dash-roster-grid">
            {members.slice(0, 6).map((member, index) => {
              const [agentRole, callSign] = agentProfiles[index] ?? agentProfiles[0];

              return (
                <article key={member.id} className="dash-agent-card">
                  <div className="flex items-start justify-between">
                    <span className="dash-agent-number">{String(member.position).padStart(2, "0")}</span>
                    <span className="dash-agent-corner" />
                  </div>
                  <div className="dash-agent-portrait" style={{ backgroundPosition: `${18 + index * 13}% 48%` }} />
                  <div className="dash-agent-role">{agentRole}</div>
                  <h3>{callSign}</h3>
                  <div className="dash-agent-lock">
                    Fijado <Lock className="size-3" />
                  </div>
                  <div className="dash-agent-riot">{member.riotId}</div>
                </article>
              );
            })}
          </section>
        </>
      ) : (
        <section className="dash-empty">
          <Trophy className="size-12 text-valorant-red" />
          <h1 className="dash-team-title">No hay equipo fijado</h1>
          <p>Crea tu equipo, registra seis Riot IDs y entra en la cola de revisión del torneo.</p>
          <Button asChild className="arena-button h-12 rounded-none px-7 font-black uppercase tracking-[0.16em]">
            <Link href="/register">Inscribir equipo <ArrowRight className="size-4" /></Link>
          </Button>
        </section>
      )}
    </div>
  );
}
