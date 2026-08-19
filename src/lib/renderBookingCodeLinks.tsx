import Link from "next/link";
import { Fragment, type ReactNode } from "react";
import {
  BOOKING_DETAIL_LINK_PROPS,
  bookingDetailHref,
} from "@/types/booking";

/** PortPax operational booking_code (…-YYYYMMDD). */
export const BOOKING_CODE_IN_TEXT_RE =
  /\b([A-Z][A-Z0-9_]*(?:-[A-Z0-9_]+)+-\d{8})\b/g;

type RenderBookingCodeLinksOptions = {
  returnTo?: string | null;
  linkClassName?: string;
};

export function renderTextWithBookingCodeLinks(
  text: string,
  options: RenderBookingCodeLinksOptions = {},
): ReactNode {
  const {
    returnTo = null,
    linkClassName = "font-semibold underline underline-offset-2 hover:opacity-90",
  } = options;

  const parts: ReactNode[] = [];
  let lastIndex = 0;
  const re = new RegExp(BOOKING_CODE_IN_TEXT_RE.source, "g");
  let match: RegExpExecArray | null;

  while ((match = re.exec(text)) !== null) {
    const code = match[1];
    const start = match.index;
    if (start > lastIndex) {
      parts.push(text.slice(lastIndex, start));
    }
    parts.push(
      <Link
        key={`${code}-${start}`}
        href={bookingDetailHref({ booking_code: code }, { returnTo })}
        {...BOOKING_DETAIL_LINK_PROPS}
        className={linkClassName}
      >
        {code}
      </Link>,
    );
    lastIndex = start + match[0].length;
  }

  if (parts.length === 0) return text;
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }
  return parts.map((part, index) => <Fragment key={index}>{part}</Fragment>);
}
