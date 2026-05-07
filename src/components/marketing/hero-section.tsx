import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CalendarDays, Crosshair, GitFork, Globe2, LogIn, Play, Trophy } from "lucide-react";

const railStats = [
  ["Teams", "128"],
  ["Rounds", "∞"],
  ["Glory", "1"],
] as const;

const countdown = [
  ["07", "Days"],
  ["14", "Hrs"],
  ["36", "Mins"],
  ["52", "Secs"],
] as const;

const protocols = [
  [Crosshair, "5v5 competitive"],
  [GitFork, "Double elimination"],
  [Globe2, "All regions eligible"],
] as const;

export function HeroSection() {
  return (
    <section className="coded-concept-hero" aria-labelledby="coded-concept-title">
      <div className="coded-concept-grid" aria-hidden="true" />
      <div className="coded-concept-lines" aria-hidden="true" />

      <header className="coded-concept-topbar">
        <Link href="/" className="coded-concept-logo" aria-label="Ignition Cup home">
          <span className="v-mark" aria-hidden="true" />
        </Link>

        <nav className="coded-concept-nav" aria-label="Marketing navigation">
          <a href="#premios" className="is-active">Tournaments</a>
          <a href="#leaderboard">Leaderboard</a>
          <a href="#news">News</a>
          <a href="#operaciones">About</a>
        </nav>

        <div className="coded-concept-auth">
          <Link href="/sign-in" className="coded-concept-button coded-concept-button-dark">
            Log in <LogIn className="size-4" />
          </Link>
          <Link href="/register" className="coded-concept-button coded-concept-button-red">
            Register squad <ArrowRight className="size-4" />
          </Link>
        </div>
      </header>

      <div className="coded-concept-copy">
        <div className="coded-concept-kicker">
          <strong>5v5</strong>
          <span>Tactical esports tournament</span>
        </div>

        <h1 id="coded-concept-title" className="coded-concept-title">
          <span>Ignition</span>
          <span>Cup</span>
        </h1>

        <div className="coded-concept-legacy">
          <span aria-hidden="true" />
          <p>
            Assemble your squad.
            <br />
            Prove your strategy.
            <br />
            Ignite your legacy.
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

      <aside className="coded-concept-rail" aria-label="Tournament stats">
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
          Register squad <ArrowRight className="size-5" />
        </Link>
        <a href="#formato" className="coded-concept-secondary">
          <Play className="size-4" /> View format <ArrowRight className="size-4" />
        </a>
      </div>

      <div className="coded-concept-hud">
        <div className="coded-concept-countdown">
          <div className="coded-concept-panel-title">
            <CalendarDays className="size-5" />
            Tournament starts in
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
            Total prize pool
          </div>
          <div className="coded-concept-prize-amount">$25,000</div>
          <div className="coded-concept-prize-strip">+ exclusive champion rewards</div>
        </div>
        <div className="coded-concept-trophy" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      </div>

      <footer className="coded-concept-footer">
        <span>Ignite the field</span>
        <span aria-hidden="true">
          <b />
          <b />
          <b />
        </span>
      </footer>
    </section>
  );
}
