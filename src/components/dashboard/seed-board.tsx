import { CheckCircle2, GitBranch, Rocket, ShieldAlert, UsersRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { TournamentRegistration } from "@/db/schema";
import { publishDoubleEliminationBracket } from "@/features/brackets/actions";
import { formatRegistrationStatus } from "@/features/registration/status";

type SeedBoardItem = {
  registrationId: string;
  tournamentId: string;
  tournamentTitle: string;
  teamName: string;
  seed: number | null;
  status: TournamentRegistration["status"];
  checkedInAt: Date | null;
  members: unknown[];
};

type SeedBoardProps = {
  tournamentId: string;
  title: string;
  items: SeedBoardItem[];
  hasBracket: boolean;
  hasBlockingMatches?: boolean;
};

export function SeedBoard({ tournamentId, title, items, hasBracket, hasBlockingMatches = false }: SeedBoardProps) {
  const checkedInCount = items.filter((item) => item.checkedInAt).length;
  const canPublish = !hasBracket && !hasBlockingMatches && items.length >= 2;
  const publishLabel = hasBracket ? "Bracket published" : hasBlockingMatches ? "Match data exists" : "Publish bracket";
  const bracketStatus = hasBracket ? "Live" : hasBlockingMatches ? "Legacy" : "Draft";

  async function publishBracket(formData: FormData) {
    "use server";

    await publishDoubleEliminationBracket(formData);
  }

  return (
    <section className="seed-board tactical-reveal">
      <div className="seed-board-head">
        <div>
          <div className="arena-kicker flex items-center gap-2">
            <GitBranch className="size-4" />
            Double elimination seed board
          </div>
          <h2>{title}</h2>
        </div>

        <form action={publishBracket}>
          <input type="hidden" name="tournamentId" value={tournamentId} />
          <Button
            disabled={!canPublish}
            className="arena-button h-12 rounded-none px-6 font-black uppercase tracking-[0.16em]"
          >
            <Rocket className="size-4" />
            {publishLabel}
          </Button>
        </form>
      </div>

      <div className="seed-board-radar" aria-hidden="true">
        <span>Eligible squads</span>
        <strong>{items.length}</strong>
        <span>Checked in</span>
        <strong>{checkedInCount}</strong>
        <span>Status</span>
        <strong>{bracketStatus}</strong>
      </div>

      <div className="seed-board-grid">
        {items.length ? (
          items.map((item, index) => (
            <article key={item.registrationId} className="seed-board-row">
              <strong>#{item.seed ?? index + 1}</strong>
              <div>
                <h3>{item.teamName}</h3>
                <p>
                  <UsersRound className="size-3.5" />
                  {item.members.length} / 6 players
                </p>
                <p>
                  {item.checkedInAt ? <CheckCircle2 className="size-3.5" /> : <ShieldAlert className="size-3.5" />}
                  {item.checkedInAt ? "checked in" : formatRegistrationStatus(item.status)}
                </p>
              </div>
            </article>
          ))
        ) : (
          <article className="seed-board-empty">
            <ShieldAlert className="size-5" />
            <h3>No eligible squads</h3>
            <p>Approved and checked-in teams will appear here before the bracket is published.</p>
          </article>
        )}
      </div>
    </section>
  );
}
