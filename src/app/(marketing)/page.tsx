import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Crosshair,
  ExternalLink,
  GitBranch,
  Lock,
  Radio,
  ShieldCheck,
  Swords,
  Users,
} from "lucide-react";

import { HeroSection } from "@/components/marketing/hero-section";

const flow = [
  ["01", "Squad lock", "Capitán, logo y seis Riot IDs entran a revisión.", Users],
  ["02", "Admin review", "Duplicados, cupos y región se validan antes del kickoff.", ShieldCheck],
  ["03", "Bracket drop", "El bracket aparece en el hub cuando el torneo se publica.", GitBranch],
] as const;

const modules = [
  ["Registration status", "Pending review", "Tu equipo está en cola de validación."],
  ["Lock-in countdown", "02 : 18 : 47 : 59", "Deadline: 24 May 2026 - 18:00"],
  ["Bracket status", "Bracket pending", "Se generará cuando todos los equipos estén bloqueados."],
] as const;

const roster = [
  ["01", "Duelist", "Kraken"],
  ["02", "Initiator", "Rift"],
  ["03", "Sentinel", "Wraith"],
  ["04", "Controller", "Spectre"],
  ["05", "Duelist", "Nova"],
  ["06", "Support", "Aegis"],
] as const;

const feed = [
  ["12:45", "Rift", "updated ability loadout"],
  ["12:42", "Spectre", "locked in"],
  ["12:41", "Kraken", "updated player card"],
] as const;

const leaderboard = [
  ["01", "Redline Protocol", "Qualified", "24", "+7"],
  ["02", "Spike Theory", "In review", "21", "+4"],
  ["03", "Midnight Vandal", "Locked", "19", "+2"],
  ["04", "A Site Angels", "Pending", "16", "-1"],
] as const;

const intel = [
  ["Patch window", "Registration review closes before bracket seeding goes live.", "24 May", "Admin"],
  ["Map pool", "Bind, Haven and Split are locked for the first wave.", "Pool A", "Rules"],
  ["Broadcast feed", "Captains will receive match-room links after final approval.", "Live soon", "Ops"],
] as const;

export default function HomePage() {
  return (
    <main className="concept-page">
      <HeroSection />

      <section id="formato" className="concept-lower-section">
        <div className="concept-section-frame">
          <div className="concept-section-header">
            <div>
              <div className="concept-kicker flex items-center gap-3">
                <Crosshair className="size-4" />
                Competitive flow
              </div>
              <h2>Lock the roster. Drop the bracket.</h2>
            </div>
            <p>
              El flujo debe sentirse como un protocolo de partida: pocas pantallas, lectura rápida y estados visibles
              en formato broadcast.
            </p>
          </div>

          <div className="concept-flow-board">
            {flow.map(([step, title, text, Icon]) => (
              <article key={step} className="concept-flow-card">
                <span className="concept-flow-number">{step}</span>
                <Icon className="size-7 text-valorant-bone" />
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
            <div className="concept-flow-line" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
          </div>
        </div>
      </section>

      <section id="leaderboard" className="concept-lower-section concept-leaderboard-section">
        <div className="concept-leaderboard-shell">
          <div className="concept-leaderboard-copy">
            <div className="concept-kicker flex items-center gap-3">
              <Swords className="size-4" />
              Live leaderboard
            </div>
            <h2>Top squads under pressure.</h2>
            <p>
              El ranking baja la estética del hero a un panel competitivo: números grandes, estado claro y lectura
              rápida de quién entra al bracket.
            </p>
            <div className="concept-leaderboard-signal">
              <span />
              Syncing standings every 30 seconds
            </div>
          </div>

          <div className="concept-rank-board">
            <div className="concept-rank-head">
              <span>Rank</span>
              <span>Squad</span>
              <span>Status</span>
              <span>Pts</span>
              <span>Form</span>
            </div>
            {leaderboard.map(([rank, squad, status, points, form]) => (
              <article key={squad} className="concept-rank-row">
                <strong>{rank}</strong>
                <h3>{squad}</h3>
                <span>{status}</span>
                <b>{points}</b>
                <em>{form}</em>
              </article>
            ))}
          </div>

          <aside className="concept-rank-side">
            <div className="concept-kicker flex items-center gap-2">
              <Radio className="size-4" />
              Broadcast note
            </div>
            <h3>Qualification lock</h3>
            <p>Top 16 advance after admin review. Ties break by round differential and head-to-head result.</p>
            <Link href="/register">
              Join the board <ArrowRight className="size-4" />
            </Link>
          </aside>
        </div>
      </section>

      <section id="operaciones" className="concept-lower-section concept-ops-section">
        <div className="concept-dashboard-shell">
          <aside className="concept-dashboard-rail">
            <div className="concept-rail-title">Tournament</div>
            <nav>
              <span className="is-active"><Crosshair className="size-5" /> Overview</span>
              <span><Users className="size-5" /> Roster</span>
              <span><Swords className="size-5" /> Brackets</span>
            </nav>
            <div className="concept-rail-status">
              <span className="size-2 rounded-full bg-valorant-green" />
              All systems nominal
            </div>
          </aside>

          <div className="concept-dashboard-main">
            <header className="concept-dashboard-head">
              <div>
                <div className="concept-kicker">Tactical overview</div>
                <h2>Codex Test Squad</h2>
                <div className="concept-dashboard-meta">
                  <span><Lock className="size-4" /> 6 / 6 players locked</span>
                  <span>Team ID: #CTS-2026</span>
                </div>
              </div>
              <Link href="/dashboard" className="concept-dashboard-open">
                Open dashboard <ExternalLink className="size-4" />
              </Link>
            </header>

            <div className="concept-dashboard-modules">
              {modules.map(([label, value, text], index) => (
                <article key={label} className="concept-status-module">
                  <div className="concept-kicker flex items-center gap-2">
                    {index === 0 ? <ShieldCheck className="size-4" /> : index === 1 ? <Lock className="size-4" /> : <GitBranch className="size-4" />}
                    {label}
                  </div>
                  <h3>{value}</h3>
                  <p>{text}</p>
                  {index === 0 ? <div className="concept-stripe-progress" /> : null}
                </article>
              ))}
            </div>

            <div className="concept-roster-heading">
              <div className="concept-kicker">Roster (6/6)</div>
              <span><Lock className="size-4 text-valorant-red" /> All players locked</span>
            </div>

            <div className="concept-roster-preview">
              {roster.map(([slot, role, name], index) => (
                <article key={slot} className="concept-agent-preview">
                  <div className="concept-agent-image" style={{ backgroundPosition: `${14 + index * 13}% 46%` }} />
                  <div className="concept-agent-slot">{slot}</div>
                  <div className="concept-agent-role">{role}</div>
                  <h3>{name}</h3>
                  <span>Locked <Lock className="size-3" /></span>
                </article>
              ))}
            </div>

            <footer className="concept-activity-feed">
              <div className="concept-kicker">Activity feed</div>
              <div>
                {feed.map(([time, actor, text]) => (
                  <span key={`${time}-${actor}`}>
                    <strong>{time}</strong> <b>{actor}</b> {text}
                  </span>
                ))}
                <span className="concept-feed-secure"><CheckCircle2 className="size-4" /> Secure feed</span>
              </div>
            </footer>
          </div>
        </div>
      </section>

      <section id="news" className="concept-lower-section concept-news-section">
        <div className="concept-section-frame">
          <div className="concept-section-header">
            <div>
              <div className="concept-kicker flex items-center gap-3">
                <Radio className="size-4" />
                Field intel
              </div>
              <h2>Signals from tournament control.</h2>
            </div>
            <p>
              La foto original tenía energía de panel operativo; esta zona convierte las noticias en tarjetas de
              misión, no en blog genérico.
            </p>
          </div>

          <div className="concept-intel-grid">
            {intel.map(([title, text, meta, type], index) => (
              <article key={title} className="concept-intel-card">
                <div className="concept-intel-image" style={{ backgroundPosition: `${28 + index * 18}% 44%` }} />
                <div className="concept-intel-meta">
                  <span>{type}</span>
                  <b>{meta}</b>
                </div>
                <h3>{title}</h3>
                <p>{text}</p>
                <a href="#operaciones">
                  Read signal <ArrowRight className="size-4" />
                </a>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="concept-footer-note">
        <p>Esta competición no está afiliada ni patrocinada por Riot Games, Inc. ni por VALORANT Esports.</p>
        <Link href="/register">Lock roster <ArrowRight className="size-4" /></Link>
      </section>
    </main>
  );
}
