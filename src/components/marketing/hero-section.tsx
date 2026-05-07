import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CalendarDays, Crosshair, GitFork, Globe2, LogIn, Play, Trophy } from "lucide-react";

const railStats = [
  ["Equipos", "128"],
  ["Rondas", "∞"],
  ["Gloria", "1"],
] as const;

const countdown = [
  ["07", "Días"],
  ["14", "Horas"],
  ["36", "Min"],
  ["52", "Seg"],
] as const;

const protocols = [
  [Crosshair, "5v5 competitivo"],
  [GitFork, "Doble eliminación"],
  [Globe2, "Todas las regiones admitidas"],
] as const;

export function HeroSection() {
  return (
    <section className="coded-concept-hero" aria-labelledby="coded-concept-title">
      <div className="coded-concept-grid" aria-hidden="true" />
      <div className="coded-concept-lines" aria-hidden="true" />

      <header className="coded-concept-topbar">
        <Link href="/" className="coded-concept-logo" aria-label="Inicio de Ignition Cup">
          <span className="v-mark" aria-hidden="true" />
        </Link>

        <nav className="coded-concept-nav" aria-label="Navegación pública">
          <a href="#premios" className="is-active">Torneos</a>
          <a href="#leaderboard">Clasificación</a>
          <a href="#news">Noticias</a>
          <a href="#operaciones">Sistema</a>
        </nav>

        <div className="coded-concept-auth">
          <Link href="/sign-in" className="coded-concept-button coded-concept-button-dark">
            Entrar <LogIn className="size-4" />
          </Link>
          <Link href="/register" className="coded-concept-button coded-concept-button-red">
            Inscribir equipo <ArrowRight className="size-4" />
          </Link>
        </div>
      </header>

      <div className="coded-concept-copy">
        <div className="coded-concept-kicker">
          <strong>5v5</strong>
          <span>Torneo táctico de deportes electrónicos</span>
        </div>

        <h1 id="coded-concept-title" className="coded-concept-title">
          <span>Ignition</span>
          <span>Cup</span>
        </h1>

        <div className="coded-concept-legacy">
          <span aria-hidden="true" />
          <p>
            Reúne a tu equipo.
            <br />
            Demuestra tu estrategia.
            <br />
            Enciende tu legado.
          </p>
        </div>
      </div>

      <div className="coded-concept-art" aria-hidden="true">
        <Image
          src="/media/ignition-arena-keyart.png"
          alt=""
          fill
          priority
          sizes="(min-width: 1024px) 56vw, 100vw"
          className="coded-concept-art-image"
        />
        <div className="coded-concept-art-mark" />
      </div>

      <aside className="coded-concept-rail" aria-label="Estadísticas del torneo">
        {railStats.map(([label, value]) => (
          <div key={label} className="coded-concept-rail-item">
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
        <Crosshair className="coded-concept-rail-crosshair" />
      </aside>

      <div className="coded-concept-actions">
        <Link href="/register" className="coded-concept-primary">
          Inscribir equipo <ArrowRight className="size-5" />
        </Link>
        <a href="#formato" className="coded-concept-secondary">
          <Play className="size-4" /> Ver formato <ArrowRight className="size-4" />
        </a>
      </div>

      <div className="coded-concept-hud">
        <div className="coded-concept-countdown">
          <div className="coded-concept-panel-title">
            <CalendarDays className="size-5" />
            El torneo empieza en
          </div>
          <div className="coded-concept-count-grid">
            {countdown.map(([value, label]) => (
              <div key={label}>
                <strong>{value}</strong>
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="coded-concept-protocol">
          {protocols.map(([Icon, label]) => (
            <div key={label} className="coded-concept-protocol-row">
              <Icon className="size-5" />
              <span>{label}</span>
            </div>
          ))}
        </div>
      </div>

      <div id="premios" className="coded-concept-prize">
        <div>
          <div className="coded-concept-panel-title">
            <Trophy className="size-5" />
            Bolsa total de premios
          </div>
          <div className="coded-concept-prize-amount">$25,000</div>
          <div className="coded-concept-prize-strip">+ recompensas exclusivas de campeón</div>
        </div>
        <div className="coded-concept-trophy" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      </div>

      <footer className="coded-concept-footer">
        <span>Enciende el campo</span>
        <span aria-hidden="true">
          <b />
          <b />
          <b />
        </span>
      </footer>
    </section>
  );
}
