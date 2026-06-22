"use client";

import { countryToIso2, iso2ToFlagEmoji } from "@/lib/countryCode";

type CountryLabelProps = {
  country: string;
  className?: string;
};

export default function CountryLabel({
  country,
  className = "",
}: CountryLabelProps) {
  const iso2 = countryToIso2(country);
  const flag = iso2 ? iso2ToFlagEmoji(iso2) : "";

  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      {flag ? (
        <span className="shrink-0 text-[1.1em] leading-none" aria-hidden>
          {flag}
        </span>
      ) : null}
      <span>{country}</span>
    </span>
  );
}
