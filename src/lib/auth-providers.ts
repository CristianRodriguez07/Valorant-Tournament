import "server-only";

import type { Provider } from "next-auth/providers";
import Discord from "next-auth/providers/discord";
import Google from "next-auth/providers/google";

export const authProviderAvailability = {
  discord: Boolean(process.env.AUTH_DISCORD_ID && process.env.AUTH_DISCORD_SECRET),
  google: Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET),
};

export const authProviders: Provider[] = [
  ...(authProviderAvailability.discord ? [Discord] : []),
  ...(authProviderAvailability.google ? [Google] : []),
];
