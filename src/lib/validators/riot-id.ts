export const RIOT_ID_REGEX =
  /^(?=.{7,22}$)[A-Za-z0-9][A-Za-z0-9 _.-]{2,15}#[A-Za-z0-9]{3,5}$/;

export function normalizeRiotId(value: string): string {
  return value.trim().replace(/\s*#\s*/g, "#");
}
