import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Crosshair, GitBranch, LayoutDashboard, LogOut, ShieldAlert, Users } from "lucide-react";

import { auth, signOut } from "@/auth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navItems = [
  ["Overview", "/dashboard", LayoutDashboard],
  ["Roster", "/dashboard/roster", Users],
  ["Brackets", "/dashboard/brackets", GitBranch],
] as const;

export default async function DashboardLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();

  if (!session?.user) {
    redirect("/sign-in");
  }

  const visibleNavItems = session.user.role === "admin"
    ? [...navItems, ["Admin", "/dashboard/admin", ShieldAlert] as const]
    : navItems;

  return (
    <main className="dash-stage arena-stage min-h-svh p-3 md:p-5">
      <Image
        src="/media/ignition-arena-keyart.png"
        alt=""
        fill
        sizes="100vw"
        className="-z-20 object-cover opacity-[0.08]"
        aria-hidden="true"
      />
      <div className="concept-wire absolute inset-0 -z-10 opacity-70" />

      <div className="mx-auto grid min-h-[calc(100svh-2rem)] max-w-[116rem] grid-cols-1 gap-4 lg:grid-cols-[18rem_minmax(0,1fr)]">
        <aside className="dash-sidebar">
          <div>
            <Link href="/" className="dash-brand">
              <span className="v-mark v-mark-sm" aria-hidden="true" />
              <span>
                <span className="block text-2xl font-black uppercase tracking-[0.12em] text-valorant-bone">Tournament</span>
                <span className="text-xs font-black uppercase tracking-[0.2em] text-valorant-muted">Operations hub</span>
              </span>
            </Link>

            <nav className="mt-12 grid gap-5">
              {visibleNavItems.map(([label, href, Icon], index) => (
                <Link key={href} href={href} className={cn("dash-nav-item", index === 0 && "dash-nav-item-active")}>
                  <Icon className="size-6" />
                  {label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="grid gap-7">
            <div className="dash-system">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-valorant-muted">
                <span className="size-2 rounded-full bg-valorant-green" />
                System status
              </div>
              <div className="mt-3 text-sm font-black uppercase tracking-[0.14em] text-valorant-green">
                All systems nominal
              </div>
            </div>

            <div className="dash-operator">
              <span className="grid size-14 place-items-center border border-valorant-line bg-valorant-red/10">
                <Crosshair className="size-7 text-valorant-red" />
              </span>
              <span>
                <span className="block text-xs font-black uppercase tracking-[0.18em] text-valorant-muted">Operator</span>
                <span className="mt-1 block text-sm font-bold text-valorant-bone">
                  {session.user.name ?? session.user.email ?? "Codex#1337"}
                </span>
                <span className="text-xs font-black uppercase tracking-[0.16em] text-valorant-green">Online</span>
              </span>
            </div>

            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/" });
              }}
            >
              <Button variant="outline" className="concept-button concept-button-dark h-12 w-full rounded-none font-black uppercase tracking-[0.16em]">
                <LogOut className="size-4" />
                Sign out
              </Button>
            </form>
          </div>
        </aside>

        <section className="min-w-0">
          {children}
        </section>
      </div>
    </main>
  );
}
