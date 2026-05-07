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
  description: "Accede a Valorant Arena para gestionar tu roster y tus brackets.",
};

const arenaStats = [
  ["Teams", "128"],
  ["Rounds", "∞"],
  ["Glory", "1"],
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
          <span>New to Ignition Cup?</span>
          <strong>Register your squad</strong>
          <ArrowRight className="size-4" />
        </Link>

        <div className="signin-concept-copy">
          <Link href="/" className="signin-concept-brand" aria-label="Volver al inicio">
            <span className="v-mark v-mark-sm" aria-hidden="true" />
          </Link>

          <div>
            <div className="signin-concept-kicker">
              <ShieldCheck className="size-5" />
              Secure access
            </div>
            <h1 className="signin-concept-title">
              Enter
              <span>the arena</span>
            </h1>
            <p>
              Log in to manage your squad, track your tournament journey, and compete for glory.
              <strong>The arena is waiting.</strong>
            </p>
          </div>

          <div className="signin-left-stats" aria-label="Tournament access stats">
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
              <div className="signin-concept-kicker">Welcome back, competitor</div>
              <h2>Sign in to your account</h2>
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
                  Continue with Google
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
                  Continue with Discord
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
            <b>Or</b>
            <span />
          </div>

          <div className="signin-email-block" aria-disabled="true">
            <div className="signin-email-heading">
              <Mail className="size-5" />
              <span>Email magic link</span>
            </div>
            <p>We&apos;ll send you a secure sign-in link to your email.</p>
            <div className="signin-email-field">
              <input type="email" placeholder="Enter your email address" disabled aria-label="Email magic link disabled" />
              <Mail className="size-5" />
            </div>
            <button type="button" disabled>
              Send magic link <ArrowRight className="size-4" />
            </button>
            <small>No password required. Magic link expires in 15 minutes.</small>
          </div>

          <div className="signin-secure-session">
            <div className="signin-secure-badge">
              <ShieldCheck className="size-7" />
            </div>
            <div>
              <div className="signin-secure-title">Secure session</div>
              <p>256-bit encryption · DDoS protected · Anti-cheat enabled</p>
              <span>Your data is protected. Your competition is fair.</span>
            </div>
          </div>
        </div>
      </section>

      <footer className="signin-page-footer">
        <span>This tournament is not affiliated with or sponsored by Riot Games, Inc.</span>
        <span>
          <a href="#privacy">Privacy Policy</a>
          <a href="#terms">Terms of Service</a>
          <a href="#support">Support</a>
        </span>
      </footer>
    </main>
  );
}
