"use client";

import { useEffect } from "react";

const DEFAULT_MESSAGE =
  "La importación sigue en proceso. No cambies de sección, no modifiques la URL ni cierres la ventana del navegador.";

/**
 * While locked: warn on tab/window close and block in-app link navigation.
 */
export function useNavigationLock(
  locked: boolean,
  message: string = DEFAULT_MESSAGE,
): void {
  useEffect(() => {
    if (!locked) return;

    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = message;
    };

    const onDocumentClick = (event: MouseEvent) => {
      if (event.defaultPrevented) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const target = event.target;
      if (!(target instanceof Element)) return;

      const anchor = target.closest("a[href]");
      if (!(anchor instanceof HTMLAnchorElement)) return;

      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#")) return;
      if (anchor.target === "_blank" || anchor.hasAttribute("download")) return;

      event.preventDefault();
      event.stopPropagation();
      window.alert(message);
    };

    window.addEventListener("beforeunload", onBeforeUnload);
    document.addEventListener("click", onDocumentClick, true);

    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      document.removeEventListener("click", onDocumentClick, true);
    };
  }, [locked, message]);
}
