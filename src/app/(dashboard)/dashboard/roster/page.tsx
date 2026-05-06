import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { RosterTable } from "@/components/dashboard/roster-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getRosterForTeam } from "@/features/brackets/queries";
import { getDashboardRegistrations } from "@/features/tournaments/queries";

export default async function RosterPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  const [registration] = await getDashboardRegistrations(session.user.id);
  const team = registration ? await getRosterForTeam(registration.teamId) : null;

  return (
    <Card className="valorant-card rounded-2xl py-0">
      <CardHeader className="border-b border-white/10 bg-black/30 p-6">
        <CardTitle className="text-3xl font-black uppercase tracking-[0.12em] text-white">Roster</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {team?.members?.length ? (
          <RosterTable members={team.members} />
        ) : (
          <p className="text-zinc-400">No hay roster registrado todavía.</p>
        )}
      </CardContent>
    </Card>
  );
}
