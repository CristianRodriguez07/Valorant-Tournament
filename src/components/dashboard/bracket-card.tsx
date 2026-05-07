import { CalendarClock, Swords } from "lucide-react";

import type { Match, Team } from "@/db/schema";
import { formatMatchStatus } from "@/features/matchday/status";

type BracketCardProps = {
  match: Match & {
    teamA?: Team | null;
    teamB?: Team | null;
  };
};

export function BracketCard({ match }: BracketCardProps) {
  return (
    <article className="arena-panel p-5">
      <div className="mb-5 flex items-center justify-between gap-4 text-xs font-black uppercase tracking-[0.18em] text-valorant-muted">
        <span>Ronda {match.round} · Partida {match.matchNumber}</span>
        <span className="text-valorant-red">{formatMatchStatus(match.status)}</span>
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 text-center">
        <div className="arena-panel-soft px-3 py-5">
          <div className="arena-display text-3xl leading-none text-valorant-bone">{match.teamA?.name ?? "Por definir"}</div>
          <div className="mt-2 text-2xl font-black text-valorant-red">{match.scoreA}</div>
          <div className="mt-2 text-xs font-black uppercase tracking-[0.18em] text-valorant-muted">Alpha</div>
        </div>
        <Swords className="size-6 text-valorant-red" />
        <div className="arena-panel-soft px-3 py-5">
          <div className="arena-display text-3xl leading-none text-valorant-bone">{match.teamB?.name ?? "Por definir"}</div>
          <div className="mt-2 text-2xl font-black text-valorant-red">{match.scoreB}</div>
          <div className="mt-2 text-xs font-black uppercase tracking-[0.18em] text-valorant-muted">Omega</div>
        </div>
      </div>

      <div className="mt-5 flex items-center gap-2 text-sm font-semibold text-valorant-muted">
        <CalendarClock className="size-4 text-valorant-ember" />
        {match.scheduledAt ? match.scheduledAt.toLocaleString("es-ES") : "Fecha por confirmar"}
      </div>
    </article>
  );
}
