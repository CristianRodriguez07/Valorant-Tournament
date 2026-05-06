# Valorant Arena Starter

Starter Full-Stack para una landing + registro de torneo de E-Sports estilo **Valorant Gaming Premium**.

## Valorant Tournament — Starter

Plantilla de aplicación Next.js para gestionar torneos de Valorant.

Resumen
- Proyecto con Next.js + Drizzle ORM + Supabase (configuración inicial).

Requisitos
- Node.js 18+ (recomendado 20)
- pnpm

Instalación
1. Copia `.env.example` a `.env.local` y completa las variables sensibles.
2. Instala dependencias:

```bash
pnpm install
```

Ejecución en desarrollo

```bash
pnpm dev
```

Build y producción

```bash
pnpm build
pnpm start
```

Notas de seguridad
- No subas archivos con credenciales. Esta plantilla ya incluye `.env*.local` en `.gitignore`.

Contribuciones
- Abre un PR desde una rama descriptiva. Revisa las issues antes de comenzar.


- Next.js App Router + React Server Components + Server Actions
- Tailwind CSS v4, shadcn-style UI, Motion
- React Hook Form + Zod
- Auth.js con Discord/Google
- Supabase PostgreSQL + Drizzle ORM
- Zustand para draft local del formulario multi-step

## Puesta en marcha rápida

Primero entra en la carpeta del proyecto:

```bash
cd valorant-arena-starter
```

```bash
corepack pnpm install
cp .env.example .env.local
# Rellena DATABASE_URL, Auth.js providers y Supabase keys
corepack pnpm db:generate
corepack pnpm db:migrate
corepack pnpm db:seed
corepack pnpm dev
```

Si `pnpm` no aparece como comando o `corepack enable` da error de permisos, usa `corepack pnpm ...` como en los ejemplos anteriores.

Abre `http://localhost:3000`.

## Variables de entorno

Usa Supabase Pooler con `prepare: false`, ya configurado en `src/db/index.ts`.

Si `DATABASE_URL` no está definido en `.env.local`, rutas como `/register` fallarán con `DATABASE_URL is required`.

```bash
DATABASE_URL="postgresql://postgres.<project-ref>:<password>@aws-...pooler.supabase.com:6543/postgres"
AUTH_SECRET="..."
AUTH_URL="http://localhost:3000"
AUTH_DISCORD_ID=""
AUTH_DISCORD_SECRET=""
AUTH_GOOGLE_ID=""
AUTH_GOOGLE_SECRET=""
NEXT_PUBLIC_APP_URL="http://localhost:3000"
SUPABASE_URL=""
SUPABASE_SERVICE_ROLE_KEY=""
SUPABASE_TEAM_LOGOS_BUCKET="team-logos"
```

## Assets

Coloca tu video/arte propio o licenciado en:

```txt
public/media/hero-loop.mp4
```

Evita redistribuir assets oficiales de Riot si no tienes permiso. Este starter usa estética, paleta y lenguaje visual inspirado, no assets propietarios.

## Notas de Auth/Riot ID

El Riot ID (`Player#LAN`) se trata como identificador de juego vinculado al usuario autenticado, no como autenticación real. El starter trae Discord/Google para login y validación de Riot ID en el flujo de roster.
