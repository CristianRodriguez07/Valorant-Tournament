# Valorant Tournament

Plataforma full-stack para gestionar un torneo competitivo de VALORANT con landing, registro de equipos, panel de capitanes, sala de administracion y bracket double elimination.

La app ya no es solo un starter visual: ahora incluye flujo real de autenticacion, registro, revision admin, generacion de brackets, reporte de resultados y seguimiento competitivo para capitanes.

## Estado actual

- Landing publica estilo VALORANT/VCT para el torneo `Valorant Ignition Cup`.
- Login social con Auth.js y proveedores Google/Discord habilitados por variables de entorno.
- Registro multi-step de equipo con logo, Riot IDs, validaciones y bloqueo de inscripciones duplicadas activas.
- Dashboard de capitan con ready room, mission feed, roster locked, siguiente partido, acciones de resultado e historial competitivo.
- Vista de bracket para capitanes con mapa double elimination, historial del equipo y fallback para datos legacy.
- Admin control room para revisar registros, aprobar/waitlist/rechazar equipos, publicar seed board y resolver resultados/disputas.
- Motor de double elimination con upper/lower bracket, rutas de ganador/perdedor, standings y snapshots de jugadores.
- Tema visual premium dark-first con rojo VALORANT, paneles angulares, key art local y logos reales para proveedores sociales.

## Stack

- Next.js App Router + React Server Components + Server Actions
- React 19, Next.js 16, Turbopack
- Tailwind CSS v4, shadcn-style components, Motion
- Auth.js / NextAuth beta con Drizzle adapter
- Supabase PostgreSQL + Drizzle ORM
- React Hook Form + Zod
- Zustand para el draft local del registro
- Lucide React para iconografia

## Rutas principales

| Ruta | Descripcion |
| --- | --- |
| `/` | Landing publica del torneo |
| `/sign-in` | Login con Google/Discord segun envs disponibles |
| `/register` | Registro de equipo y roster |
| `/dashboard` | Centro tactico del capitan |
| `/dashboard/roster` | Roster del equipo |
| `/dashboard/brackets` | Ready room, reporte de resultados y bracket |
| `/dashboard/admin` | Admin control room para operadores |

## Puesta en marcha local

```powershell
pnpm install
Copy-Item .env.example .env
pnpm db:migrate
pnpm db:seed
pnpm dev
```

Abre `http://localhost:3000`.

Si `pnpm` no esta disponible, usa Corepack:

```powershell
corepack enable
corepack pnpm install
corepack pnpm dev
```

Drizzle carga variables con `dotenv/config`, asi que para comandos como `pnpm db:migrate` y `pnpm db:seed` usa `.env` en la raiz del proyecto.

## Variables de entorno

Copia `.env.example` a `.env` y rellena valores reales. No subas secretos al repositorio.

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?sslmode=require"

AUTH_SECRET="replace-with-a-random-secret"
AUTH_URL="http://localhost:3000"

AUTH_DISCORD_ID=""
AUTH_DISCORD_SECRET=""

AUTH_GOOGLE_ID=""
AUTH_GOOGLE_SECRET=""

NEXT_PUBLIC_APP_URL="http://localhost:3000"

SUPABASE_URL="https://PROJECT_REF.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="replace-with-service-role-key"
SUPABASE_TEAM_LOGOS_BUCKET="team-logos"
```

Notas:

- `DATABASE_URL` es obligatoria para cualquier ruta server-side.
- El cliente Postgres usa `prepare: false`, compatible con Supabase Pooler.
- Los botones de Google/Discord solo deben mostrarse como utiles cuando sus credenciales esten configuradas.
- `SUPABASE_SERVICE_ROLE_KEY` se usa para operaciones server-side de assets como logos de equipos.

## Base de datos

Scripts disponibles:

```powershell
pnpm db:generate
pnpm db:migrate
pnpm db:push
pnpm db:studio
pnpm db:seed
```

El seed crea el torneo base:

- Titulo: `Valorant Ignition Cup`
- Slug: `valorant-ignition-cup`
- Max teams: `16`
- Prize pool: `5000 USD`

El rol admin vive en `users.role`. Para acceder a `/dashboard/admin`, inicia sesion primero y promociona tu usuario en la base de datos:

```sql
update users
set role = 'admin'
where email = 'tu-email@example.com';
```

## Flujo competitivo

1. El capitan inicia sesion con Google o Discord.
2. Registra equipo, logo y roster de 6 jugadores con Riot IDs.
3. Admin revisa la solicitud y la aprueba, pone en waitlist o rechaza.
4. Admin publica el seed board y genera bracket double elimination.
5. Capitanes ven ready room, siguiente match, bracket e historial competitivo.
6. Capitanes reportan una victoria 1-0 o abren disputa.
7. Admin confirma el resultado, actualiza standings y avanza ganador/perdedor.

El modelo actual soporta:

- `matches.bracket`: `upper`, `lower`, `grand_final`
- `nextMatchId` / `nextMatchSlot` para ganadores
- `loserNextMatchId` / `loserNextMatchSlot` para perdedores
- `tournament_team_standings` para ranking, wins/losses y estado competitivo
- `tournament_player_snapshots` para conservar composiciones historicas del torneo

## Verificacion

No hay un runner unico configurado todavia; las pruebas de dominio se ejecutan con `tsx`.

```powershell
pnpm lint
pnpm typecheck
pnpm build

pnpm exec tsx src/features/brackets/double-elimination.test.ts
pnpm exec tsx src/features/brackets/advancement.test.ts
pnpm exec tsx src/features/admin/match-launch.test.ts
pnpm exec tsx src/features/admin/match-review.test.ts
pnpm exec tsx src/features/admin/registration-review.test.ts
pnpm exec tsx src/features/matchday/results.test.ts
```

## Estructura util

```txt
src/app/(marketing)              Landing y registro publico
src/app/(auth)/sign-in           Login social
src/app/(dashboard)/dashboard    Dashboard capitan/admin
src/components/dashboard         Paneles tacticos y bracket UI
src/features/admin               Acciones y reglas admin
src/features/brackets            Generacion y avance double elimination
src/features/matchday            Check-in, reporting y disputes
src/features/profiles            Historial competitivo del equipo
src/features/registration        Registro, validaciones y estados
src/db                           Schema, seed y conexion Drizzle
public/brand                     Logos locales de proveedores
public/media                     Key art local del torneo
```

## Assets y marca

El key art actual vive en `public/media/ignition-arena-keyart.png`. Los iconos de proveedores sociales estan en `public/brand`.

El proyecto usa una direccion visual inspirada en interfaces competitivas de VALORANT, pero evita depender de assets oficiales de Riot. Usa solo material propio, licenciado o generado con permiso.
