import { CalendarClock, Swords } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import type { Match, Team } from "@/db/schema";

type BracketCardProps = {
  match: Match & {
    teamA?: Team | null;
    teamB?: Team | null;
  };
};

export function BracketCard({ match }: BracketCardProps) {
  return (
    <Card className="valorant-card rounded-2xl py-0">
      <CardContent className="p-5">
        <div className="mb-4 flex items-center justify-between text-xs uppercase tracking-[0.18em] text-zinc-500">
          <span>Round {match.round} · Match {match.matchNumber}</span>
          <span className="text-valorant-red">{match.status}</span>
        </div>

        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 text-center">
          <div className="rounded-xl border border-white/10 bg-black/30 p-4 font-black text-white">
            {match.teamA?.name ?? "TBD"}
          </div>
          <Swords className="size-5 text-valorant-red" />
          <div className="rounded-xl border border-white/10 bg-black/30 p-4 font-black text-white">
            {match.teamB?.name ?? "TBD"}
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2 text-sm text-zinc-400">
          <CalendarClock className="size-4 text-valorant-orange" />
          {match.scheduledAt ? match.scheduledAt.toLocaleString("es-ES") : "Fecha por confirmar"}
        </div>
      </CardContent>
    </Card>
  );
}
