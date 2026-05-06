import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { BracketCard } from "@/components/dashboard/bracket-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getUpcomingMatchesForTeam } from "@/features/brackets/queries";
import { getDashboardRegistrations } from "@/features/tournaments/queries";

export default async function BracketsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  const [registration] = await getDashboardRegistrations(session.user.id);
  const matches = registration ? await getUpcomingMatchesForTeam(registration.teamId) : [];

  return (
    <Card className="valorant-card rounded-2xl py-0">
      <CardHeader className="border-b border-white/10 bg-black/30 p-6">
        <CardTitle className="text-3xl font-black uppercase tracking-[0.12em] text-white">Brackets</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 p-6">
        {matches.length ? (
          matches.map((match) => <BracketCard key={match.id} match={match} />)
        ) : (
          <p className="text-zinc-400">Aún no hay enfrentamientos asignados.</p>
        )}
      </CardContent>
    </Card>
  );
}
