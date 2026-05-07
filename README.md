# Torneo Valorant

Plataforma completa para gestionar un torneo competitivo de VALORANT con página pública, registro de equipos, panel de capitanes, sala de administración y cuadro de doble eliminación.

La app ya no es solo un arranque visual: ahora incluye flujo real de autenticación, registro, revisión de administración, generación de cuadros, reporte de resultados y seguimiento competitivo para capitanes.

## Estado actual

- Página pública estilo VALORANT/VCT para el torneo `Valorant Ignition Cup`.
- Acceso social con Auth.js y proveedores Google/Discord habilitados por variables de entorno.
- Registro por pasos de equipo con logo, Riot IDs, validaciones y bloqueo de inscripciones duplicadas activas.
- Panel de capitán con sala lista, actividad de misión, plantilla fijada, siguiente partida, acciones de resultado e historial competitivo.
- Vista de cuadro para capitanes con mapa de doble eliminación, historial del equipo y alternativa para datos antiguos.
- Sala de control de administración para revisar registros, aprobar, poner en espera o rechazar equipos, publicar cabezas de serie y resolver resultados/disputas.
- Motor de doble eliminación con cuadro superior/inferior, rutas de ganador/perdedor, clasificación y capturas de jugadores.
- Tema visual de alta calidad, oscuro primero, con rojo VALORANT, paneles angulares, arte principal local y logos reales para proveedores sociales.

## Tecnología

- Next.js App Router + React Server Components + Server Actions
- React 19, Next.js 16, Turbopack
- Tailwind CSS v4, componentes estilo shadcn, Motion
- Auth.js / NextAuth beta con Drizzle adapter
- Supabase PostgreSQL + Drizzle ORM
- React Hook Form + Zod
- Zustand para el draft local del registro
- Lucide React para iconografía

## Rutas principales

| Ruta | Descripcion |
| --- | --- |
| `/` | Página pública del torneo |
| `/sign-in` | Acceso con Google/Discord según variables disponibles |
| `/register` | Registro de equipo y plantilla |
| `/dashboard` | Centro táctico del capitán |
| `/dashboard/roster` | Plantilla del equipo |
| `/dashboard/brackets` | Sala lista, reporte de resultados y cuadro |
| `/dashboard/admin` | Sala de control de administración para operadores |

## Puesta en marcha local

```powershell
pnpm install
Copy-Item .env.example .env
pnpm db:migrate
pnpm db:seed
pnpm dev
```

Abre `http://localhost:3000`.

Si `pnpm` no está disponible, usa Corepack:

```powershell
corepack enable
corepack pnpm install
corepack pnpm dev
```

Drizzle carga variables con `dotenv/config`, así que para comandos como `pnpm db:migrate` y `pnpm db:seed` usa `.env` en la raíz del proyecto.

## Variables de entorno

Copia `.env.example` a `.env` y rellena valores reales. No subas secretos al repositorio.

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?sslmode=require"

AUTH_SECRET="reemplaza-con-un-secreto-aleatorio"
AUTH_URL="http://localhost:3000"

AUTH_DISCORD_ID=""
AUTH_DISCORD_SECRET=""

AUTH_GOOGLE_ID=""
AUTH_GOOGLE_SECRET=""

NEXT_PUBLIC_APP_URL="http://localhost:3000"

SUPABASE_URL="https://PROJECT_REF.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="reemplaza-con-clave-de-servicio"
SUPABASE_TEAM_LOGOS_BUCKET="team-logos"
```

Notas:

- `DATABASE_URL` es obligatoria para cualquier ruta del servidor.
- El cliente Postgres usa `prepare: false`, compatible con el agrupador de conexiones de Supabase.
- Los botones de Google/Discord solo deben mostrarse como útiles cuando sus credenciales estén configuradas.
- `SUPABASE_SERVICE_ROLE_KEY` se usa para operaciones del servidor con recursos como logos de equipos.

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

-- Título: `Valorant Ignition Cup`
- Slug: `valorant-ignition-cup`
- Máximo de equipos: `16`
- Bolsa de premios: `5000 USD`

El rol de administración vive en `users.role`. Para acceder a `/dashboard/admin`, inicia sesión primero y promociona tu usuario en la base de datos:

```sql
update users
set role = 'admin'
where email = 'tu-email@example.com';
```

## Flujo competitivo

1. El capitán inicia sesión con Google o Discord.
2. Registra equipo, logo y plantilla de 6 jugadores con Riot IDs.
3. Administración revisa la solicitud y la aprueba, la pone en lista de espera o la rechaza.
4. Administración publica los cabezas de serie y genera el cuadro de doble eliminación.
5. Los capitanes ven sala lista, siguiente partida, cuadro e historial competitivo.
6. Los capitanes reportan una victoria 1-0 o abren disputa.
7. Administración confirma el resultado, actualiza clasificación y avanza ganador/perdedor.

El modelo actual soporta:

- `matches.bracket`: `upper`, `lower`, `grand_final`
- `nextMatchId` / `nextMatchSlot` para ganadores
- `loserNextMatchId` / `loserNextMatchSlot` para perdedores
- `tournament_team_standings` para clasificación, victorias/derrotas y estado competitivo
- `tournament_player_snapshots` para conservar composiciones históricas del torneo

## Verificación

No hay un ejecutor único configurado todavía; las pruebas de dominio se ejecutan con `tsx`.

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

## Estructura útil

```txt
src/app/(marketing)              Página pública y registro
src/app/(auth)/sign-in           Acceso social
src/app/(dashboard)/dashboard    Panel de capitán y administración
src/components/dashboard         Paneles tácticos e interfaz de cuadros
src/features/admin               Acciones y reglas de administración
src/features/brackets            Generación y avance de doble eliminación
src/features/matchday            Presencia, reportes y disputas
src/features/profiles            Historial competitivo del equipo
src/features/registration        Registro, validaciones y estados
src/db                           Esquema, datos semilla y conexión Drizzle
public/brand                     Logos locales de proveedores
public/media                     Arte principal local del torneo
```

## Recursos y marca

El arte principal actual vive en `public/media/ignition-arena-keyart.png`. Los iconos de proveedores sociales estan en `public/brand`.

El proyecto usa una dirección visual inspirada en interfaces competitivas de VALORANT, pero evita depender de recursos oficiales de Riot. Usa solo material propio, licenciado o generado con permiso.
