"use client";

import Link from "next/link";
import { ArrowLeft, Pencil, Ship, Trash2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import ConfirmDeleteButton from "@/components/buttons/ConfirmDeleteButton";
import DefaultButton from "@/components/buttons/DefaultButton";
import CountryLabel from "@/components/ui/CountryLabel";
import { useMotionSpring, useMotionTransition } from "@/lib/motionPresets";
import type { PortDetail } from "@/types/catalog";
import { formatLargestVessel, portDisplayName, portStatusLabel } from "@/types/catalog";

type PortDetailHeroProps = {
  port: PortDetail;
  onEdit: () => void;
  onDelete: () => void;
};

const LOGO_SIZE_EXPANDED = 72;
const LOGO_SIZE_STUCK = 40;

const CARD_BASE_CLASS =
  "relative overflow-hidden border border-zinc-200/80 bg-gradient-to-br from-[var(--admin-accent)]/10 via-white to-zinc-50 backdrop-blur-md dark:border-zinc-800 dark:from-[var(--admin-accent)]/20 dark:via-zinc-900 dark:to-zinc-950";

function getScrollParent(node: HTMLElement | null): HTMLElement | null {
  if (!node) return null;
  let parent = node.parentElement;
  while (parent) {
    const { overflowY, overflow } = getComputedStyle(parent);
    if (overflowY === "auto" || overflowY === "scroll" || overflow === "auto" || overflow === "scroll") {
      return parent;
    }
    parent = parent.parentElement;
  }
  return null;
}

export default function PortDetailHero({ port, onEdit, onDelete }: PortDetailHeroProps) {
  const largestVessel = formatLargestVessel(port);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [isStuck, setIsStuck] = useState(false);
  const shellTransition = useMotionSpring();
  const contentTransition = useMotionTransition(0.2);

  const logoSize = isStuck ? LOGO_SIZE_STUCK : LOGO_SIZE_EXPANDED;

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const scrollRoot = getScrollParent(sentinel);
    if (!scrollRoot) return;

    const updateStuck = () => {
      const rootTop = scrollRoot.getBoundingClientRect().top;
      const sentinelTop = sentinel.getBoundingClientRect().top;
      setIsStuck(sentinelTop < rootTop - 1);
    };

    updateStuck();
    scrollRoot.addEventListener("scroll", updateStuck, { passive: true });
    window.addEventListener("resize", updateStuck);

    return () => {
      scrollRoot.removeEventListener("scroll", updateStuck);
      window.removeEventListener("resize", updateStuck);
    };
  }, [port.id]);

  return (
    <>
      <div ref={sentinelRef} className="h-px w-full" aria-hidden />
      <motion.div
        className={[
          "sticky z-20",
          isStuck ? "-top-4 sm:-top-6 lg:-top-8" : "top-0",
        ].join(" ")}
        transition={shellTransition}
      >
        <div className={isStuck ? "-mx-4 sm:-mx-6 lg:-mx-8" : ""}>
          <motion.div
            className={[
              CARD_BASE_CLASS,
              isStuck ? "border-x-0 border-t-0 shadow-md" : "shadow-[var(--admin-card-shadow)]",
            ].join(" ")}
            animate={{ borderRadius: isStuck ? 0 : 16 }}
            transition={shellTransition}
          >
            <div
              className={[
                "flex flex-col sm:flex-row sm:items-center sm:justify-between",
                isStuck ? "gap-3 p-3 sm:px-6 sm:py-3" : "gap-6 p-6 sm:p-8",
              ].join(" ")}
            >
              <div className={isStuck ? "flex min-w-0 items-center gap-3" : "flex min-w-0 items-start gap-5"}>
                <Link
                  href="/ports"
                  className={[
                    "flex shrink-0 cursor-pointer items-center justify-center rounded-lg border border-zinc-200/80 bg-white/80 text-zinc-600 transition-colors hover:text-[var(--admin-accent)] dark:border-zinc-700 dark:bg-zinc-900/80 dark:text-zinc-300",
                    isStuck ? "h-8 w-8" : "mt-1 h-9 w-9",
                  ].join(" ")}
                  aria-label="Volver a puertos"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Link>
                <div
                  className={[
                    "flex min-w-0 items-center",
                    isStuck ? "gap-3" : "gap-4",
                  ].join(" ")}
                >
                  <motion.div
                    className="flex shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/80 bg-white shadow-sm dark:border-zinc-700 dark:bg-zinc-900"
                    animate={{ width: logoSize, height: logoSize }}
                    transition={shellTransition}
                  >
                    {port.logo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={port.logo}
                        alt=""
                        className="h-full w-full object-contain p-1.5"
                      />
                    ) : (
                      <span
                        className="font-bold text-[var(--admin-accent)]/40"
                        style={{ fontSize: isStuck ? 16 : 26 }}
                      >
                        {port.name.charAt(0)}
                      </span>
                    )}
                  </motion.div>
                  <div className="min-w-0 flex flex-col">
                    <p
                      className={[
                        "flex flex-wrap items-center gap-x-1.5 gap-y-0.5 font-semibold uppercase text-[var(--admin-accent)]",
                        isStuck ? "text-[10px] tracking-wide" : "text-xs tracking-widest",
                      ].join(" ")}
                    >
                      <CountryLabel country={port.country} />
                      {port.region ? <span>· {port.region}</span> : null}
                    </p>
                    <h1
                      className={[
                        "truncate font-bold tracking-tight text-zinc-900 dark:text-zinc-50",
                        isStuck ? "text-base" : "mt-1 text-2xl",
                      ].join(" ")}
                    >
                      {portDisplayName(port)}
                    </h1>
                    <div className={isStuck ? "mt-1 flex flex-wrap gap-1.5" : "mt-2 flex flex-wrap gap-2"}>
                      <span
                        className={[
                          "rounded-full bg-[var(--admin-accent)]/10 font-medium text-[var(--admin-accent)]",
                          isStuck ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-0.5 text-xs",
                        ].join(" ")}
                      >
                        {portStatusLabel(port.status)}
                      </span>
                      <span
                        className={[
                          "rounded-full bg-zinc-100 font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300",
                          isStuck ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-0.5 text-xs",
                        ].join(" ")}
                      >
                        {port.position_count} posiciones
                      </span>
                      {port.bollard_total > 0 && (
                        <span
                          className={[
                            "rounded-full bg-zinc-100 font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300",
                            isStuck ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-0.5 text-xs",
                          ].join(" ")}
                        >
                          {port.bollard_total} bitas
                        </span>
                      )}
                    </div>
                    <AnimatePresence initial={false}>
                      {!isStuck && (
                        <motion.p
                          key="largest-vessel"
                          initial={{ opacity: 0, height: 0, marginTop: 0 }}
                          animate={{ opacity: 1, height: "auto", marginTop: 12 }}
                          exit={{ opacity: 0, height: 0, marginTop: 0 }}
                          transition={contentTransition}
                          className="flex items-center gap-1.5 overflow-hidden text-sm text-zinc-600 dark:text-zinc-400"
                        >
                          <Ship
                            className="h-4 w-4 shrink-0 text-[var(--admin-accent)]"
                            strokeWidth={1.75}
                          />
                          <span>
                            <span className="font-medium text-zinc-700 dark:text-zinc-300">
                              Mayor barco atracado:{" "}
                            </span>
                            {largestVessel ?? "Sin registros"}
                          </span>
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
              <div className="flex shrink-0 flex-wrap gap-2 self-start sm:justify-end sm:self-center">
                <DefaultButton type="button" onClick={onEdit}>
                  <span className="inline-flex items-center gap-2">
                    <Pencil className="h-4 w-4" />
                    Editar
                  </span>
                </DefaultButton>
                <ConfirmDeleteButton
                  deleteLabel={`el puerto ${port.name}`}
                  onDelete={onDelete}
                  className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-950/40"
                  ariaLabel="Eliminar puerto"
                  title="Eliminar puerto"
                >
                  <Trash2 className="h-4 w-4" />
                  Eliminar
                </ConfirmDeleteButton>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </>
  );
}
