const PORT_PALETTE = [
  "#3478b5",
  "#0d9488",
  "#d97706",
  "#7c3aed",
  "#e11d48",
  "#059669",
  "#2563eb",
  "#9333ea",
];

export function portAccentColor(portId: number): string {
  return PORT_PALETTE[portId % PORT_PALETTE.length];
}

export function occupancyHeatClass(count: number, inRange: boolean): string {
  if (!inRange) {
    return "border-zinc-100/50 bg-zinc-50/30 opacity-40 dark:border-zinc-800/30 dark:bg-zinc-900/20";
  }
  if (count === 0) {
    return "border-zinc-200/70 bg-white/70 hover:border-[var(--admin-accent)]/25 dark:border-zinc-800 dark:bg-zinc-900/50";
  }
  if (count === 1) {
    return "border-[var(--admin-accent)]/20 bg-[var(--admin-accent)]/10 hover:border-[var(--admin-accent)]/35";
  }
  if (count === 2) {
    return "border-[var(--admin-accent)]/30 bg-[var(--admin-accent)]/20 hover:border-[var(--admin-accent)]/45";
  }
  return "border-[var(--admin-accent)]/45 bg-[var(--admin-accent)]/35 shadow-sm shadow-[var(--admin-accent)]/10 hover:border-[var(--admin-accent)]/55";
}
