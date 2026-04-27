"use client";

import { useTheme } from "next-themes";

/** Recharts / SVG strokes that must differ between light and dark surfaces */
export function useChartTheme() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme !== "light";

  return {
    isDark,
    gridStroke: isDark ? "rgba(255,255,255,0.06)" : "rgba(15,23,42,0.09)",
    tickFill: isDark ? "#a3a3a3" : "#64748b",
    axisLabelFill: isDark ? "#737373" : "#64748b",
    legendColor: isDark ? "#a3a3a3" : "#64748b",
    cursorFill: isDark ? "rgba(255,255,255,0.04)" : "rgba(15,23,42,0.06)",
    trackStroke: isDark ? "rgba(255,255,255,0.08)" : "rgba(15,23,42,0.12)",
  };
}
