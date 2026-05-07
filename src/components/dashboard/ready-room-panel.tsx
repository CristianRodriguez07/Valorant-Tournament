import Link from "next/link";
import { CalendarClock, Crosshair, RadioTower, ShieldCheck, Swords } from "lucide-react";

import { Button } from "@/components/ui/button";
import { checkInCaptainTeamFromForm } from "@/features/matchday/actions";
import {
  formatMatchDate,
  getReadyRoomActionState,
  type ReadyRoomMatch,
} from "@/features/matchday/status";

type ReadyRoomPanelProps = {
  registrationId: string;
  registrationStatus: Parameters<typeof getReadyRoomActionState>[0]["registrationStatus"];
  checkedInAt?: Date | null;
  match?: ReadyRoomMatch | null;
  compactLink?: boolean;
};

export function ReadyRoomPanel({
  registrationId,
  registrationStatus,
  checkedInAt,
  match,
  compactLink = true,
}: ReadyRoomPanelProps) {
  const actionState = getReadyRoomActionState({
    registrationStatus,
    checkedInAt,
    nextMatch: match,
  });

  return (
    <section className="ready-room-panel">
      <div className="ready-room-copy">
        <div className="concept-kicker flex items-center gap-2">
          <RadioTower className="size-4" />
          Matchday ready room
        </div>
        <h2>{match ? "Lobby protocol" : "Bracket signal pending"}</h2>
        <p>{actionState.description}</p>
      </div>

      <div className="ready-room-versus">
        <div>
          <span>Alpha</span>
          <strong>{match?.teamA?.name ?? "TBA"}</strong>
        </div>
        <Swords className="size-7 text-valorant-red" />
        <div>
          <span>Omega</span>
          <strong>{match?.teamB?.name ?? "TBA"}</strong>
        </div>
      </div>

      <div className="ready-room-actions">
        <div className="ready-room-time">
          <CalendarClock className="size-4" />
          {match?.scheduledAt ? formatMatchDate(match.scheduledAt) : "Schedule awaiting admin publish"}
        </div>

        <form action={checkInCaptainTeamFromForm}>
          <input type="hidden" name="registrationId" value={registrationId} />
          <Button
            disabled={!actionState.canCheckIn}
            className="arena-button h-12 rounded-none px-6 font-black uppercase tracking-[0.16em]"
          >
            {checkedInAt ? <ShieldCheck className="size-4" /> : <Crosshair className="size-4" />}
            {actionState.label}
          </Button>
        </form>

        {compactLink ? (
          <Button
            asChild
            variant="outline"
            className="arena-button-outline h-12 rounded-none px-6 font-black uppercase tracking-[0.16em]"
          >
            <Link href="/dashboard/brackets">Open match feed</Link>
          </Button>
        ) : null}
      </div>
    </section>
  );
}
