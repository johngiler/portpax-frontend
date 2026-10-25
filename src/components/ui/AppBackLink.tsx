"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ComponentProps, MouseEvent } from "react";
import { consumeHistoryBack, useSameTabNav } from "@/lib/inAppNav";

type AppBackLinkProps = Omit<ComponentProps<typeof Link>, "href"> & {
  href: string;
};

/**
 * Volver: same-tab WebView uses history.back() when we arrived from that
 * origin; otherwise (or desktop new-tab) goes to `href` (returnTo + filters).
 */
export default function AppBackLink({
  href,
  onClick,
  children,
  ...rest
}: AppBackLinkProps) {
  const router = useRouter();
  const sameTab = useSameTabNav();

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    onClick?.(event);
    if (event.defaultPrevented) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }
    if (!sameTab) return;
    if (!consumeHistoryBack(href)) return;
    event.preventDefault();
    router.back();
  }

  return (
    <Link href={href} {...rest} onClick={handleClick}>
      {children}
    </Link>
  );
}
