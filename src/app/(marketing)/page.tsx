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
  ["01", "Cierre de equipo", "Capitán, logo y seis Riot IDs entran a revisión.", Users],
  ["02", "Revisión de administración", "Duplicados, cupos y región se validan antes del inicio.", ShieldCheck],
  ["03", "Publicación del cuadro", "El cuadro aparece en el centro cuando el torneo se publica.", GitBranch],
] as const;

const modules = [
  ["Estado de inscripción", "Pendiente de revisión", "Tu equipo está en cola de validación."],
  ["Cuenta atrás de cierre", "02 : 18 : 47 : 59", "Límite: 24 de mayo de 2026 - 18:00"],
  ["Estado del cuadro", "Cuadro pendiente", "Se generará cuando todos los equipos estén bloqueados."],
] as const;

const roster = [
  ["01", "Duelista", "Kraken"],
  ["02", "Iniciador", "Rift"],
  ["03", "Centinela", "Wraith"],
  ["04", "Controlador", "Spectre"],
  ["05", "Duelista", "Nova"],
  ["06", "Apoyo", "Aegis"],
] as const;

const feed = [
  ["12:45", "Rift", "actualizó habilidades"],
  ["12:42", "Spectre", "quedó fijado"],
  ["12:41", "Kraken", "actualizó tarjeta de jugador"],
] as const;

const leaderboard = [
  ["01", "Protocolo Rojo", "Clasificado", "24", "+7"],
  ["02", "Teoría Spike", "En revisión", "21", "+4"],
  ["03", "Vandal Medianoche", "Fijado", "19", "+2"],
  ["04", "Ángeles de A", "Pendiente", "16", "-1"],
] as const;

const intel = [
  ["Ventana de parche", "La revisión de inscripciones cierra antes de publicar los cabezas de serie.", "24 mayo", "Administración"],
  ["Mapas disponibles", "Bind, Haven y Split quedan fijados para la primera oleada.", "Grupo A", "Reglas"],
  ["Canal de emisión", "Los capitanes recibirán enlaces de sala tras la aprobación final.", "Pronto en directo", "Operaciones"],
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
                Flujo competitivo
              </div>
              <h2>Cierra la plantilla. Publica el cuadro.</h2>
            </div>
            <p>
              El flujo debe sentirse como un protocolo de partida: pocas pantallas, lectura rápida y estados visibles
              en formato de retransmisión.
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
              Clasificación en directo
            </div>
            <h2>Los mejores equipos bajo presión.</h2>
            <p>
              La clasificación baja la estética principal a un panel competitivo: números grandes, estado claro y lectura
              rápida de quién entra al cuadro.
            </p>
            <div className="concept-leaderboard-signal">
              <span />
              Clasificación sincronizada cada 30 segundos
            </div>
          </div>

          <div className="concept-rank-board">
            <div className="concept-rank-head">
              <span>Rango</span>
              <span>Equipo</span>
              <span>Estado</span>
              <span>Pts</span>
              <span>Forma</span>
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
              Nota de emisión
            </div>
            <h3>Cierre de clasificación</h3>
            <p>Los 16 mejores avanzan tras revisión de administración. Los empates se rompen por diferencia de rondas y resultado directo.</p>
            <Link href="/register">
              Entrar en la clasificación <ArrowRight className="size-4" />
            </Link>
          </aside>
        </div>
      </section>

      <section id="operaciones" className="concept-lower-section concept-ops-section">
        <div className="concept-dashboard-shell">
          <aside className="concept-dashboard-rail">
            <div className="concept-rail-title">Torneo</div>
            <nav>
              <span className="is-active"><Crosshair className="size-5" /> Resumen</span>
              <span><Users className="size-5" /> Plantilla</span>
              <span><Swords className="size-5" /> Cuadros</span>
            </nav>
            <div className="concept-rail-status">
              <span className="size-2 rounded-full bg-valorant-green" />
              Sistemas nominales
            </div>
          </aside>

          <div className="concept-dashboard-main">
            <header className="concept-dashboard-head">
              <div>
                <div className="concept-kicker">Resumen táctico</div>
                <h2>Equipo de Prueba Codex</h2>
                <div className="concept-dashboard-meta">
                  <span><Lock className="size-4" /> 6 / 6 jugadores fijados</span>
                  <span>ID de equipo: #CTS-2026</span>
                </div>
              </div>
              <Link href="/dashboard" className="concept-dashboard-open">
                Abrir panel <ExternalLink className="size-4" />
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
              <div className="concept-kicker">Plantilla (6/6)</div>
              <span><Lock className="size-4 text-valorant-red" /> Todos los jugadores fijados</span>
            </div>

            <div className="concept-roster-preview">
              {roster.map(([slot, role, name], index) => (
                <article key={slot} className="concept-agent-preview">
                  <div className="concept-agent-image" style={{ backgroundPosition: `${14 + index * 13}% 46%` }} />
                  <div className="concept-agent-slot">{slot}</div>
                  <div className="concept-agent-role">{role}</div>
                  <h3>{name}</h3>
                  <span>Fijado <Lock className="size-3" /></span>
                </article>
              ))}
            </div>

            <footer className="concept-activity-feed">
              <div className="concept-kicker">Actividad</div>
              <div>
                {feed.map(([time, actor, text]) => (
                  <span key={`${time}-${actor}`}>
                    <strong>{time}</strong> <b>{actor}</b> {text}
                  </span>
                ))}
                <span className="concept-feed-secure"><CheckCircle2 className="size-4" /> Canal seguro</span>
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
                Información de campo
              </div>
              <h2>Señales del control del torneo.</h2>
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
                  Leer señal <ArrowRight className="size-4" />
                </a>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="concept-footer-note">
        <p>Esta competición no está afiliada ni patrocinada por Riot Games, Inc. ni por la escena competitiva oficial de VALORANT.</p>
        <Link href="/register">Cerrar plantilla <ArrowRight className="size-4" /></Link>
      </section>
    </main>
  );
}
