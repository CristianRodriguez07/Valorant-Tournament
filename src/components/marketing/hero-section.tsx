import Link from "next/link";
import { ArrowRight, CalendarDays, Crosshair, Play } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PrizePoolCard } from "@/components/marketing/prize-pool-card";
import { TournamentCountdown } from "@/components/marketing/tournament-countdown";

const tournamentStartDate = new Date("2026-06-01T18:00:00+02:00");

export function HeroSection() {
  return (
    <section className="relative isolate min-h-svh overflow-hidden px-6 py-8 md:px-10">
      <video
        className="absolute inset-0 -z-20 h-full w-full object-cover opacity-30"
        src="/media/hero-loop.mp4"
        autoPlay
        muted
        loop
        playsInline
        poster="/og/tournament-card.svg"
      />
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_30%_20%,rgb(255_70_85/0.28),transparent_30rem),linear-gradient(90deg,#070707_0%,rgb(17_17_17/0.88)_42%,rgb(7_7_7/0.62)_100%)]" />
      <div className="valorant-grid absolute inset-0 -z-10 opacity-25" />

      <header className="mx-auto flex max-w-7xl items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <span className="grid size-10 place-items-center border border-valorant-red/40 bg-valorant-red text-white shadow-valorant-glow">
            <Crosshair className="size-5" />
          </span>
          <span className="text-xl font-black uppercase tracking-[0.22em] text-white">Arena</span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-bold uppercase tracking-[0.16em] text-zinc-400 md:flex">
          <a href="#premios" className="hover:text-white">Premios</a>
          <a href="#formato" className="hover:text-white">Formato</a>
          <Link href="/dashboard" className="hover:text-white">Dashboard</Link>
        </nav>
      </header>

      <div className="mx-auto grid max-w-7xl items-center gap-10 py-20 lg:grid-cols-[1.15fr_0.85fr] lg:py-28">
        <div>
          <Badge className="mb-6 border border-valorant-red/30 bg-valorant-red/10 px-3 py-1.5 text-valorant-red">
            <CalendarDays className="size-3.5" />
            Inscripciones abiertas · Cupos limitados
          </Badge>

          <h1 className="max-w-4xl text-balance text-5xl font-black uppercase leading-[0.92] tracking-[-0.04em] text-white md:text-7xl xl:text-8xl">
            Valorant <span className="text-valorant-red">Ignition</span> Cup
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-300">
            Crea tu equipo, sube tu logo, registra Riot IDs y entra al bracket. Una experiencia ultra rápida, dark mode nativo y estética competitiva premium.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild className="valorant-glow-button h-13 rounded-none px-8 font-black uppercase tracking-[0.18em]">
              <Link href="/register">
                Inscríbete ahora <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-13 rounded-none border-white/15 bg-black/30 px-8 font-black uppercase tracking-[0.18em] text-white hover:bg-white/10">
              <a href="#formato"><Play className="size-4" /> Ver formato</a>
            </Button>
          </div>

          <div className="mt-10 max-w-xl">
            <TournamentCountdown targetDate={tournamentStartDate} />
          </div>
        </div>

        <aside id="premios" className="lg:ml-auto lg:w-full lg:max-w-md">
          <PrizePoolCard />
        </aside>
      </div>
    </section>
  );
}
