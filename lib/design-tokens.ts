/** Stroke and text colours for Recharts / SVG charts (the app is light-only). */
export const chartTheme = {
  gridStroke: "rgba(15,23,42,0.09)",
  tickFill: "#64748b",
  axisLabelFill: "#64748b",
  legendColor: "#64748b",
  trackStroke: "rgba(15,23,42,0.12)",
} as const;

export type ContractStage = "Analyzed" | "Not analyzed" | "Analyzing" | "Failed";

export function mapStatusToStage(status: string): ContractStage {
  switch (status) {
    case "analyzed":
      return "Analyzed";
    case "parsing":
      return "Analyzing";
    case "error":
      return "Failed";
    default:
      return "Not analyzed";
  }
}
