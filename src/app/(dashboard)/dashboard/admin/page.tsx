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
          Sala de control de administración
        </div>
        <h1 className="arena-display mt-3 text-7xl leading-none text-valorant-bone md:text-9xl">
          Escaneo de cola
        </h1>
      </section>

      {firstTournamentId ? (
        <section className="admin-bracket-command">
          <SeedBoard
            tournamentId={firstTournamentId}
            title={tournamentItems[0]?.tournamentTitle ?? "Torneo"}
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
            <span>Cola de inscripción</span>
            <h2>No hay equipos esperando</h2>
            <p>Los equipos aprobados, pendientes y con presencia confirmada aparecerán aquí cuando existan inscripciones.</p>
          </article>
        )}
      </section>

      <section className="arena-panel p-6 md:p-8">
        <div className="arena-kicker flex items-center gap-2">
          <ShieldAlert className="size-4" />
          Revisión de partidas
        </div>
        <h2 className="arena-display mt-3 text-6xl leading-none text-valorant-bone md:text-8xl">
          Mesa de resultados
        </h2>
      </section>

      <section className="admin-queue-grid">
        {matchQueue.length ? (
          matchQueue.map((match) => <AdminMatchCard key={match.id} match={match} />)
        ) : (
          <article className="admin-queue-card">
            <span>Revisión de partidas</span>
            <h2>No hay reportes activos</h2>
            <p>Las victorias reportadas y disputas aparecerán aquí para el control final de administración.</p>
          </article>
        )}
      </section>
    </div>
  );
}
