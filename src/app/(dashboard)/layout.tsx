import Link from "next/link";
import { redirect } from "next/navigation";
import { Crosshair, LogOut } from "lucide-react";

import { auth, signOut } from "@/auth";
import { Button } from "@/components/ui/button";

export default async function DashboardLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();

  if (!session?.user) {
    redirect("/sign-in");
  }

  return (
    <main className="min-h-svh px-6 py-8 md:px-10">
      <header className="mx-auto mb-8 flex max-w-7xl items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <span className="grid size-10 place-items-center border border-valorant-red/40 bg-valorant-red text-white shadow-valorant-glow">
            <Crosshair className="size-5" />
          </span>
          <span className="text-xl font-black uppercase tracking-[0.22em] text-white">Arena</span>
        </Link>

        <nav className="flex items-center gap-3">
          <Link href="/dashboard" className="text-sm font-bold uppercase tracking-[0.16em] text-zinc-400 hover:text-white">
            Overview
          </Link>
          <Link href="/dashboard/roster" className="text-sm font-bold uppercase tracking-[0.16em] text-zinc-400 hover:text-white">
            Roster
          </Link>
          <Link href="/dashboard/brackets" className="text-sm font-bold uppercase tracking-[0.16em] text-zinc-400 hover:text-white">
            Brackets
          </Link>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/" });
            }}
          >
            <Button variant="ghost" size="icon" aria-label="Salir">
              <LogOut className="size-4" />
            </Button>
          </form>
        </nav>
      </header>

      <div className="mx-auto max-w-7xl">{children}</div>
    </main>
  );
}
