import { CheckCheck, RotateCcw, Swords } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { Match, Team, Tournament } from "@/db/schema";
import { completeAdminMatch, resetAdminMatch } from "@/features/admin/actions";
import { formatMatchStatus } from "@/features/matchday/status";

type AdminMatchCardProps = {
  match: Match & {
    teamA?: Team | null;
    teamB?: Team | null;
    tournament?: Tournament | null;
  };
};

export function AdminMatchCard({ match }: AdminMatchCardProps) {
  const canComplete = match.status === "reported" && Boolean(match.winnerTeamId);
  const canReset = match.status === "disputed";

  return (
    <article className="admin-queue-card admin-match-card">
      <div className="admin-queue-card-head">
        <div>
          <span>{match.tournament?.title ?? "Partida de torneo"}</span>
          <h2>
            Ronda {match.round} / Partida {match.matchNumber}
          </h2>
        </div>
        <strong>{formatMatchStatus(match.status)}</strong>
      </div>

      <div className="admin-match-versus">
        <div>
          <b>{match.teamA?.name ?? "Por definir"}</b>
          <em>{match.scoreA}</em>
        </div>
        <Swords className="size-5 text-valorant-red" />
        <div>
          <b>{match.teamB?.name ?? "Por definir"}</b>
          <em>{match.scoreB}</em>
        </div>
      </div>

      <div className="admin-queue-actions">
        <form action={completeAdminMatch}>
          <input type="hidden" name="matchId" value={match.id} />
          <Button
            type="submit"
            disabled={!canComplete}
            className="arena-button h-11 rounded-none px-5 font-black uppercase tracking-[0.14em]"
          >
            <CheckCheck className="size-4" />
            Completar resultado
          </Button>
        </form>

        <form action={resetAdminMatch}>
          <input type="hidden" name="matchId" value={match.id} />
          <Button
            type="submit"
            disabled={!canReset}
            variant="outline"
            className="arena-button-outline h-11 rounded-none px-5 font-black uppercase tracking-[0.14em]"
          >
            <RotateCcw className="size-4" />
            Reiniciar sala
          </Button>
        </form>
      </div>
    </article>
  );
}
