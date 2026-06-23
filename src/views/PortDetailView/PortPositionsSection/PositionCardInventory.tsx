import {
  formatPositionBollardAllocationLabel,
  formatPositionFenderAllocationLabel,
} from "@/lib/inventoryLabels";
import type { PortBollard, PortFender, Position } from "@/types/catalog";

type PositionCardInventoryProps = {
  position: Pick<
    Position,
    "bollard_allocations" | "fender_allocations" | "bollard_count" | "fender_count"
  >;
  bollards: PortBollard[];
  fenders: PortFender[];
};

function InventoryBlock({ label, lines, total }: { label: string; lines: string[]; total: number | null }) {
  if (lines.length === 0 && total == null) return null;

  return (
    <div>
      <p className="text-zinc-400">{label}</p>
      {lines.length > 0 ? (
        <ul className="mt-0.5 space-y-0.5 font-medium text-zinc-800 dark:text-zinc-100">
          {lines.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      ) : (
        <p className="mt-0.5 font-medium text-zinc-800 dark:text-zinc-100">{total}</p>
      )}
    </div>
  );
}

export default function PositionCardInventory({
  position,
  bollards,
  fenders,
}: PositionCardInventoryProps) {
  const bollardLines = position.bollard_allocations
    .map((allocation) => {
      const item = bollards.find((bollard) => bollard.id === allocation.port_bollard);
      if (!item) return null;
      return formatPositionBollardAllocationLabel(item, allocation.quantity);
    })
    .filter((line): line is string => line != null);

  const fenderLines = position.fender_allocations
    .map((allocation) => {
      const item = fenders.find((fender) => fender.id === allocation.port_fender);
      if (!item) return null;
      return formatPositionFenderAllocationLabel(item, allocation.quantity);
    })
    .filter((line): line is string => line != null);

  const hasBollards = bollardLines.length > 0 || position.bollard_count != null;
  const hasFenders = fenderLines.length > 0 || position.fender_count != null;

  if (!hasBollards && !hasFenders) return null;

  return (
    <div className="mt-2 space-y-2 text-xs">
      <InventoryBlock label="Bitas" lines={bollardLines} total={position.bollard_count} />
      <InventoryBlock label="Defensas" lines={fenderLines} total={position.fender_count} />
    </div>
  );
}
