import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, ShieldCheck, Trophy } from "lucide-react";

import { auth } from "@/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getDashboardRegistrations } from "@/features/tournaments/queries";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  const registrations = await getDashboardRegistrations(session.user.id);
  const activeRegistration = registrations[0];

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <Badge className="mb-3 border border-valorant-red/30 bg-valorant-red/10 text-valorant-red">
            <ShieldCheck className="size-3.5" />
            Player Dashboard
          </Badge>
          <h1 className="text-4xl font-black uppercase tracking-[0.12em] text-white md:text-6xl">Panel privado</h1>
          <p className="mt-3 max-w-2xl text-zinc-400">Estado de inscripción, roster y próximos enfrentamientos.</p>
        </div>

        <Button asChild className="valorant-glow-button rounded-none font-black uppercase tracking-[0.16em]">
          <Link href="/register">Nuevo registro <ArrowRight className="size-4" /></Link>
        </Button>
      </section>

      {activeRegistration ? (
        <Card className="valorant-card clip-valorant overflow-hidden rounded-2xl py-0">
          <CardHeader className="border-b border-white/10 bg-black/30 p-6">
            <CardTitle className="flex items-center gap-3 text-2xl font-black uppercase tracking-[0.12em] text-white">
              <Trophy className="size-6 text-valorant-red" />
              {activeRegistration.teamName}
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 p-6 md:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-black/30 p-4">
              <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">Estado</div>
              <div className="mt-2 text-2xl font-black text-valorant-red">{activeRegistration.status}</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/30 p-4">
              <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">Registro</div>
              <div className="mt-2 text-2xl font-black text-white">{activeRegistration.createdAt.toLocaleDateString("es-ES")}</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/30 p-4">
              <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">Acciones</div>
              <div className="mt-3 flex gap-2">
                <Button asChild variant="outline" className="rounded-none border-white/15 bg-black/30 text-white hover:bg-white/10">
                  <Link href="/dashboard/roster">Roster</Link>
                </Button>
                <Button asChild variant="outline" className="rounded-none border-white/15 bg-black/30 text-white hover:bg-white/10">
                  <Link href="/dashboard/brackets">Brackets</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="valorant-card rounded-2xl py-0">
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-black uppercase tracking-[0.12em] text-white">Aún no tienes equipo registrado</h2>
            <p className="mx-auto mt-3 max-w-xl text-zinc-400">Crea tu squad, sube el logo y registra los Riot IDs para entrar en revisión.</p>
            <Button asChild className="valorant-glow-button mt-6 rounded-none font-black uppercase tracking-[0.16em]">
              <Link href="/register">Inscribirme ahora</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
