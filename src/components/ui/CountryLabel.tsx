"use client";

import CountryFlag from "@/components/ui/CountryFlag";
import { countryToIso2 } from "@/lib/countryCode";

type CountryLabelProps = {
  country: string;
  className?: string;
};

export default function CountryLabel({
  country,
  className = "",
}: CountryLabelProps) {
  const iso2 = countryToIso2(country);

  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      {iso2 ? (
        <CountryFlag
          iso2={iso2}
          className="shrink-0 overflow-hidden rounded-[2px] shadow-sm ring-1 ring-black/5"
        />
      ) : null}
      <span>{country}</span>
    </span>
  );
}
