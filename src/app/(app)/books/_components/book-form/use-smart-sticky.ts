"use client";

import { useMemo } from "react";

/**
 * A hook to handle "Smart Sticky" behavior for elements that might be taller than the viewport.
 * If the element is shorter than the viewport, it sticks to the top.
 * If it's taller, it scrolls naturally until its bottom reaches the viewport bottom, then sticks there.
 * When scrolling up, it sticks to the top once its top reaches the viewport top.
 */
export function useSmartSticky(topOffset = 48, bottomOffset = 48) {
  const stickyStyle = useMemo<React.CSSProperties>(
    () => ({
      position: "sticky",
      top: `${topOffset}px`,
      bottom: `${bottomOffset}px`,
    }),
    [topOffset, bottomOffset]
  );

  return { stickyStyle };
}
