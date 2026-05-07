import { Crown, GitBranch, ShieldAlert, Skull, Swords, Trophy } from "lucide-react";

import type { Match, Team } from "@/db/schema";
import { formatMatchStatus } from "@/features/matchday/status";

type BracketMatch = Match & {
  teamA?: Team | null;
  teamB?: Team | null;
  winner?: Team | null;
};

type BracketLaneId = NonNullable<Match["bracket"]>;

const lanes: Array<{
  id: BracketLaneId;
  label: string;
  callout: string;
}> = [
  { id: "upper", label: "Cuadro superior", callout: "sin derrotas" },
  { id: "lower", label: "Cuadro inferior", callout: "ruta de supervivencia" },
  { id: "grand_final", label: "Gran final", callout: "cierre del título" },
  { id: "grand_final_reset", label: "Final de reinicio", callout: "reinicio del cuadro" },
];

export function DoubleElimBracket({
  matches,
  focusTeamId,
}: {
  matches: BracketMatch[];
  focusTeamId?: string;
}) {
  const bracketedMatches = matches.filter((match): match is BracketMatch & { bracket: BracketLaneId } => Boolean(match.bracket));
  const hasLegacyOnly = matches.length > 0 && bracketedMatches.length === 0;
  const completedCount = bracketedMatches.filter((match) => match.status === "completed").length;
  const readyCount = bracketedMatches.filter((match) => match.status === "ready" || match.status === "reported").length;

  return (
    <section className="double-bracket tactical-reveal">
      <div className="double-bracket-title">
        <div>
          <div className="arena-kicker flex items-center gap-2">
            <GitBranch className="size-4" />
            Topología competitiva
          </div>
          <h2>Mapa de doble eliminación</h2>
        </div>
        <div className="double-bracket-stats" aria-label="Estado del cuadro">
          <span>{bracketedMatches.length} partidas</span>
          <span>{readyCount} armadas</span>
          <span>{completedCount} resueltas</span>
        </div>
      </div>

      {bracketedMatches.length ? (
        lanes.map((lane) => {
          const laneMatches = bracketedMatches.filter((match) => match.bracket === lane.id);
          if (!laneMatches.length) {
            return null;
          }

          return (
            <div key={lane.id} className={`double-bracket-lane double-bracket-${lane.id}`}>
              <div className="double-bracket-lane-label">
                <span>{lane.label}</span>
                <strong>{lane.callout}</strong>
              </div>
              <div className="double-bracket-scroll">
                {laneMatches.map((match) => {
                  const focused = focusTeamId && (match.teamAId === focusTeamId || match.teamBId === focusTeamId);
                  return (
                    <article key={match.id} className={focused ? "double-match double-match-focus" : "double-match"}>
                      <div className="double-match-meta">
                        <span>
                          R{match.bracketRound ?? match.round} / M{match.bracketMatchNumber ?? match.matchNumber}
                        </span>
                        <strong>{formatMatchStatus(match.status)}</strong>
                      </div>
                      <TeamScore
                        name={match.teamA?.name}
                        score={match.scoreA}
                        winner={match.winnerTeamId === match.teamAId}
                      />
                      <TeamScore
                        name={match.teamB?.name}
                        score={match.scoreB}
                        winner={match.winnerTeamId === match.teamBId}
                      />
                      <div className="double-match-footer">
                        {match.winnerTeamId ? <Crown className="size-4" /> : <Swords className="size-4" />}
                        <span>{match.winner?.name ?? "Esperando resultado"}</span>
                        {match.status === "completed" && !match.winnerTeamId ? <Skull className="size-4" /> : null}
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          );
        })
      ) : (
        <article className="double-bracket-empty">
          <ShieldAlert className="size-5" />
          <h3>{hasLegacyOnly ? "Datos de partidas antiguos" : "Cuadro sin publicar"}</h3>
          <p>
            {hasLegacyOnly
              ? "Las partidas existentes se crearon antes de la topología de doble eliminación. Límpialas o termínalas antes de publicar el cuadro completo."
              : "Asigna al menos dos equipos y publica para generar cuadro superior, inferior, gran final y final de reinicio."}
          </p>
        </article>
      )}
    </section>
  );
}

function TeamScore({ name, score, winner }: { name?: string | null; score: number; winner: boolean }) {
  return (
    <div className={winner ? "double-match-team double-match-team-winner" : "double-match-team"}>
      <span>{name ?? "Esperando equipos"}</span>
      <b>{winner ? <Trophy className="size-4" /> : null}{score}</b>
    </div>
  );
}
