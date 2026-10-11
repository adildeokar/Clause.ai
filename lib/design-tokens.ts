/** Figma design tokens — Final App Design */
export const brand = {
  green25: "#F4F7F6",
  green50: "#E5F0EB",
  green100: "#CCE1D8",
  green400: "#66A689",
  green600: "#006A3B",
  red50: "#FFF0EE",
  red400: "#FC7F79",
  red500: "#F83446",
  red700: "#BB032A",
  yellow50: "#FDF2DC",
  yellow300: "#F6BC2F",
  yellow400: "#D79900",
  yellow500: "#B97502",
  yellow600: "#9F6402",
  gray100: "#E8E8E8",
  gray200: "#DDDDDD",
  gray300: "#BBBBBB",
  gray400: "#A6A6A6",
  gray500: "#868686",
  gray800: "#4B4B4B",
  gray900: "#282828",
  black: "#000000",
  white: "#FFFFFF",
} as const;

export type ContractStage = "Active" | "Draft" | "Expired" | "Pending";

export function mapStatusToStage(status: string): ContractStage {
  switch (status) {
    case "analyzed":
      return "Active";
    case "error":
      return "Expired";
    case "parsing":
      return "Pending";
    case "uploaded":
    default:
      return "Draft";
  }
}
