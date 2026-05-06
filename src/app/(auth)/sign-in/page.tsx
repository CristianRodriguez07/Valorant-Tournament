import { redirect } from "next/navigation";
import { Gamepad2 } from "lucide-react";

import { auth, signIn } from "@/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function SignInPage() {
  const session = await auth();

  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <main className="grid min-h-svh place-items-center px-6">
      <Card className="valorant-card clip-valorant w-full max-w-md overflow-hidden rounded-2xl py-0">
        <CardHeader className="border-b border-valorant-red/20 bg-black/30 p-6">
          <div className="mb-4 grid size-12 place-items-center bg-valorant-red text-white shadow-valorant-glow">
            <Gamepad2 className="size-6" />
          </div>
          <CardTitle className="text-3xl font-black uppercase tracking-[0.14em] text-white">Entrar</CardTitle>
          <CardDescription className="text-zinc-400">
            Accede con Discord o Google para gestionar tu roster.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 p-6">
          <form
            action={async () => {
              "use server";
              await signIn("discord", { redirectTo: "/dashboard" });
            }}
          >
            <Button className="valorant-glow-button h-12 w-full rounded-none font-black uppercase tracking-[0.16em]">
              Continuar con Discord
            </Button>
          </form>

          <form
            action={async () => {
              "use server";
              await signIn("google", { redirectTo: "/dashboard" });
            }}
          >
            <Button variant="outline" className="h-12 w-full rounded-none border-white/15 bg-black/30 font-black uppercase tracking-[0.16em] text-white hover:bg-white/10">
              Continuar con Google
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
