"use client";

import { buildFlagIconUrl } from "@/lib/countryFlag";

type CountryFlagProps = {
  iso2: string;
  className?: string;
  style?: React.CSSProperties;
};

export default function CountryFlag({ iso2, className = "", style }: CountryFlagProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={buildFlagIconUrl(iso2)}
      alt=""
      aria-hidden
      className={className}
      style={{
        display: "inline-block",
        width: "1.15em",
        height: "0.85em",
        verticalAlign: "middle",
        ...style,
      }}
    />
  );
}
