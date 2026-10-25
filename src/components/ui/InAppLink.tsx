"use client";

import Link from "next/link";
import type { ComponentProps, MouseEvent } from "react";
import {
  captureAppScroll,
  livePathKey,
  markCanBack,
  useInAppLinkProps,
  useSameTabNav,
} from "@/lib/inAppNav";

type InAppLinkProps = ComponentProps<typeof Link>;

function rememberLeave(
  sameTab: boolean,
  event: MouseEvent<HTMLElement>,
): void {
  if (event.defaultPrevented) return;
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  const origin = livePathKey();
  captureAppScroll(origin);
  if (sameTab) markCanBack(origin);
}

/**
 * In-app navigation that keeps desktop `_blank` and uses the same tab on
 * compact / WebView / PWA, recording scroll + back origin for Volver.
 */
export default function InAppLink({
  href,
  onClick,
  children,
  ...rest
}: InAppLinkProps) {
  const navProps = useInAppLinkProps();
  const sameTab = useSameTabNav();

  return (
    <Link
      href={href}
      {...rest}
      {...navProps}
      onClick={(event) => {
        rememberLeave(sameTab, event);
        onClick?.(event);
      }}
    >
      {children}
    </Link>
  );
}

type InAppAnchorProps = ComponentProps<"a"> & { href: string };

/** File / PDF / external URL with the same compact vs desktop target rule. */
export function InAppAnchor({
  href,
  onClick,
  children,
  ...rest
}: InAppAnchorProps) {
  const navProps = useInAppLinkProps();
  const sameTab = useSameTabNav();

  return (
    <a
      href={href}
      {...rest}
      {...navProps}
      onClick={(event) => {
        rememberLeave(sameTab, event);
        onClick?.(event);
      }}
    >
      {children}
    </a>
  );
}
