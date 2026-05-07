import { redirect } from "next/navigation";
import { ShieldAlert } from "lucide-react";

import { auth } from "@/auth";
import { AdminMatchCard } from "@/components/dashboard/admin-match-card";
import { AdminRegistrationCard } from "@/components/dashboard/admin-registration-card";
import { DoubleElimBracket } from "@/components/dashboard/double-elim-bracket";
import { SeedBoard } from "@/components/dashboard/seed-board";
import { getTournamentBracket } from "@/features/brackets/queries";
import { getAdminMatchQueue, getAdminRegistrationQueue, getAdminSeedBoard } from "@/features/tournaments/queries";

export default async function AdminControlRoomPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  if (session.user.role !== "admin") {
    redirect("/dashboard");
  }

  const [queue, matchQueue, seedBoard] = await Promise.all([
    getAdminRegistrationQueue(),
    getAdminMatchQueue(),
    getAdminSeedBoard(),
  ]);
  const firstTournamentId = seedBoard[0]?.tournamentId ?? queue[0]?.tournamentId;
  const tournamentItems = firstTournamentId ? seedBoard.filter((item) => item.tournamentId === firstTournamentId) : [];
  const tournamentBracket = firstTournamentId ? await getTournamentBracket(firstTournamentId) : [];
  const hasBracket = tournamentBracket.some((match) => match.bracket);
  const hasBlockingMatches = tournamentBracket.length > 0 && !hasBracket;

  return (
    <div className="admin-control-room">
      <section className="arena-panel p-6 md:p-8">
        <div className="arena-kicker flex items-center gap-2">
          <ShieldAlert className="size-4" />
          Admin control room
        </div>
        <h1 className="arena-display mt-3 text-7xl leading-none text-valorant-bone md:text-9xl">
          Queue scan
        </h1>
      </section>

      {firstTournamentId ? (
        <section className="admin-bracket-command">
          <SeedBoard
            tournamentId={firstTournamentId}
            title={tournamentItems[0]?.tournamentTitle ?? "Tournament"}
            items={tournamentItems}
            hasBracket={hasBracket}
            hasBlockingMatches={hasBlockingMatches}
          />
          <DoubleElimBracket matches={tournamentBracket} />
        </section>
      ) : null}

      <section className="admin-queue-grid">
        {queue.length ? (
          queue.map((item) => <AdminRegistrationCard key={item.registrationId} item={item} />)
        ) : (
          <article className="admin-queue-card">
            <span>Registration queue</span>
            <h2>No squads waiting</h2>
            <p>Approved, pending, and checked-in teams appear here when registrations exist.</p>
          </article>
        )}
      </section>

      <section className="arena-panel p-6 md:p-8">
        <div className="arena-kicker flex items-center gap-2">
          <ShieldAlert className="size-4" />
          Match review
        </div>
        <h2 className="arena-display mt-3 text-6xl leading-none text-valorant-bone md:text-8xl">
          Result desk
        </h2>
      </section>

      <section className="admin-queue-grid">
        {matchQueue.length ? (
          matchQueue.map((match) => <AdminMatchCard key={match.id} match={match} />)
        ) : (
          <article className="admin-queue-card">
            <span>Match review</span>
            <h2>No live reports</h2>
            <p>Reported wins and disputes appear here for final admin control.</p>
          </article>
        )}
      </section>
    </div>
  );
}
