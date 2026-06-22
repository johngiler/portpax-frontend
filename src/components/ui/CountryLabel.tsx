"use client";

import { ReactCountryFlag } from "react-country-flag";
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
        <ReactCountryFlag
          countryCode={iso2}
          svg
          aria-hidden
          className="shrink-0 overflow-hidden rounded-[2px] shadow-sm ring-1 ring-black/5"
          style={{ width: "1.15em", height: "0.85em" }}
        />
      ) : null}
      <span>{country}</span>
    </span>
  );
}
