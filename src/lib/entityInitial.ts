/** First letter/digit for empty user profile avatars. */
export function entityInitial(label: string | null | undefined): string {
  const trimmed = (label ?? "").trim();
  if (!trimmed) return "?";
  const match = trimmed.match(/[\p{L}\p{N}]/u);
  return (match?.[0] ?? "?").toUpperCase();
}
