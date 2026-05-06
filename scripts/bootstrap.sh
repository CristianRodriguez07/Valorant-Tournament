#!/usr/bin/env bash
set -euo pipefail

if ! command -v pnpm >/dev/null 2>&1; then
  echo "pnpm no está instalado. Instálalo con: corepack enable && corepack prepare pnpm@latest --activate"
  exit 1
fi

pnpm install

if [ ! -f .env.local ]; then
  cp .env.example .env.local
  echo "Se creó .env.local. Rellena las variables antes de migrar la DB."
fi

echo "Listo. Siguientes pasos:"
echo "1) Edita .env.local"
echo "2) pnpm db:generate && pnpm db:migrate && pnpm db:seed"
echo "3) pnpm dev"
