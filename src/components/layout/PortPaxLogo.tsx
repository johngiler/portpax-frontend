/**
 * Logo PortPax: isotype + wordmark (Port gris oscuro, Pax color isotype) + slogan.
 * Color del isotype: #3478b5
 */

const ISOTYPE_COLOR = "#3478b5";

type PortPaxLogoProps = {
  showSlogan?: boolean;
  /** Clase para el slogan (ej. "hidden sm:block" para ocultar en móvil). */
  sloganClassName?: string;
  className?: string;
};

export default function PortPaxLogo({
  showSlogan = true,
  sloganClassName = "",
  className = "",
}: PortPaxLogoProps) {
  return (
    <div className={`flex items-center gap-2 sm:gap-3 ${className}`}>
      <div className="relative h-9 w-9 shrink-0 sm:h-12 sm:w-12">
        <img
          src="/logos/isotype.svg"
          alt=""
          width={48}
          height={48}
          className="h-full w-full object-contain"
        />
      </div>
      <div className="flex min-w-0 flex-col">
        <span className="truncate text-base font-bold tracking-tight sm:text-xl">
          <span className="text-zinc-700 dark:text-zinc-300">Port</span>
          <span style={{ color: ISOTYPE_COLOR }}>Pax</span>
        </span>
        {showSlogan && (
          <span
            className={`text-[11px] font-medium tracking-wide text-zinc-500 dark:text-zinc-400 ${sloganClassName}`}
          >
            Management System
          </span>
        )}
      </div>
    </div>
  );
}
