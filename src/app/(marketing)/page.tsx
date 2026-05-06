import { HeroSection } from "@/components/marketing/hero-section";

export default function HomePage() {
  return (
    <main>
      <HeroSection />

      <section id="formato" className="mx-auto max-w-7xl px-6 py-20 md:px-10">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            ["01", "Registro", "Equipo, logo y 5 titulares + 1 suplente."],
            ["02", "Validación", "Admins revisan roster, Riot IDs y cupos."],
            ["03", "Bracket", "Dashboard privado con próximos enfrentamientos."],
          ].map(([step, title, text]) => (
            <article key={step} className="valorant-card clip-valorant p-6">
              <div className="text-sm font-black text-valorant-red">{step}</div>
              <h2 className="mt-3 text-2xl font-black uppercase tracking-[0.12em] text-white">{title}</h2>
              <p className="mt-3 text-zinc-400">{text}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
