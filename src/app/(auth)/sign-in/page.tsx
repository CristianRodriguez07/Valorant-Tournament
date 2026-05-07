import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  Crosshair,
  Mail,
  ShieldCheck,
} from "lucide-react";

import { auth, signIn } from "@/auth";
import { Button } from "@/components/ui/button";
import { authProviderAvailability } from "@/lib/auth-providers";

export const metadata: Metadata = {
  title: "Entrar",
  description: "Accede a Valorant Arena para gestionar tu plantilla y tus cuadros.",
};

const arenaStats = [
  ["Equipos", "128"],
  ["Rondas", "∞"],
  ["Gloria", "1"],
] as const;

export default async function SignInPage() {
  const session = await auth();

  if (session?.user) {
    redirect("/dashboard");
  }

  const hasAvailableProvider =
    authProviderAvailability.discord || authProviderAvailability.google;

  return (
    <main className="signin-concept-shell">
      <Image
        src="/media/ignition-arena-keyart.png"
        alt=""
        fill
        priority
        sizes="100vw"
        className="signin-concept-backdrop"
        aria-hidden="true"
      />
      <div className="signin-concept-grid" aria-hidden="true" />
      <div className="signin-concept-scan" aria-hidden="true" />

      <section className="signin-concept-stage">
        <Link href="/register" className="signin-register-callout">
          <span>¿Nuevo en Ignition Cup?</span>
          <strong>Inscribe tu equipo</strong>
          <ArrowRight className="size-4" />
        </Link>

        <div className="signin-concept-copy">
          <Link href="/" className="signin-concept-brand" aria-label="Volver al inicio">
            <span className="v-mark v-mark-sm" aria-hidden="true" />
          </Link>

          <div>
            <div className="signin-concept-kicker">
              <ShieldCheck className="size-5" />
              Acceso seguro
            </div>
            <h1 className="signin-concept-title">
              Entra
              <span>a la arena</span>
            </h1>
            <p>
              Inicia sesión para gestionar tu equipo, seguir tu recorrido en el torneo y competir por la gloria.
              <strong>La arena está esperando.</strong>
            </p>
          </div>

          <div className="signin-left-stats" aria-label="Estadísticas de acceso al torneo">
            {arenaStats.map(([label, value]) => (
              <div key={label} className="signin-left-stat">
                <Crosshair className="size-5" />
                <span>{label}</span>
                <strong>{value}</strong>
              </div>
            ))}
          </div>
        </div>

        <div className="signin-concept-console">
          <div className="signin-console-head">
            <div>
              <div className="signin-concept-kicker">Bienvenido de nuevo, competidor</div>
              <h2>Inicia sesión en tu cuenta</h2>
            </div>
          </div>

          <div className="signin-provider-stack" aria-label="Métodos de acceso">
            {authProviderAvailability.google ? (
              <form
                action={async () => {
                  "use server";
                  await signIn("google", { redirectTo: "/dashboard" });
                }}
              >
                <Button className="signin-provider-button signin-provider-button-light">
                  <span className="signin-provider-logo signin-provider-logo-google">
                    <Image src="/brand/google-g.png" alt="" width={24} height={24} />
                  </span>
                  Continuar con Google
                  <ArrowRight className="size-4" />
                </Button>
              </form>
            ) : null}

            {authProviderAvailability.discord ? (
              <form
                action={async () => {
                  "use server";
                  await signIn("discord", { redirectTo: "/dashboard" });
                }}
              >
                <Button className="signin-provider-button signin-provider-button-red">
                  <span className="signin-provider-logo signin-provider-logo-discord">
                    <Image src="/brand/discord-symbol.svg" alt="" width={28} height={21} />
                  </span>
                  Continuar con Discord
                  <ArrowRight className="size-4" />
                </Button>
              </form>
            ) : null}

            {!hasAvailableProvider ? (
              <div className="signin-provider-empty">
                <Crosshair className="size-5" />
                Configura Discord o Google OAuth en el entorno para habilitar el acceso.
              </div>
            ) : null}
          </div>

          <div className="signin-console-divider">
            <span />
            <b>O</b>
            <span />
          </div>

          <div className="signin-email-block" aria-disabled="true">
            <div className="signin-email-heading">
              <Mail className="size-5" />
              <span>Enlace seguro por correo</span>
            </div>
            <p>Te enviaremos un enlace seguro de acceso a tu correo.</p>
            <div className="signin-email-field">
              <input type="email" placeholder="Introduce tu correo" disabled aria-label="Enlace por correo deshabilitado" />
              <Mail className="size-5" />
            </div>
            <button type="button" disabled>
              Enviar enlace <ArrowRight className="size-4" />
            </button>
            <small>Sin contraseña. El enlace caduca en 15 minutos.</small>
          </div>

          <div className="signin-secure-session">
            <div className="signin-secure-badge">
              <ShieldCheck className="size-7" />
            </div>
            <div>
              <div className="signin-secure-title">Sesión segura</div>
              <p>Cifrado de 256 bits · Protección DDoS · Antitrampas activo</p>
              <span>Tus datos están protegidos. La competición es justa.</span>
            </div>
          </div>
        </div>
      </section>

      <footer className="signin-page-footer">
        <span>Este torneo no está afiliado ni patrocinado por Riot Games, Inc.</span>
        <span>
          <a href="#privacy">Privacidad</a>
          <a href="#terms">Condiciones</a>
          <a href="#support">Soporte</a>
        </span>
      </footer>
    </main>
  );
}
