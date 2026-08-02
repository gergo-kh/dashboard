export type NavigationMode = "sidebar" | "drawer";

export function getNavigationModeForWidth(width: number): NavigationMode {
  return width >= 1041 ? "sidebar" : "drawer";
}
