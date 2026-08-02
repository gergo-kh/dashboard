import {
  BarChart3,
  FileText,
  Home,
  PackageSearch,
  Settings,
  Sparkles
} from "lucide-react";

export const portalNavigationItems = [
  {
    label: "Marketing áttekintés",
    href: "/",
    icon: Home,
    isActive: true,
    isDisabled: false
  },
  {
    label: "Teljesítmény",
    href: "/performance",
    icon: BarChart3,
    isActive: false,
    isDisabled: true
  },
  {
    label: "Merchant Center",
    href: "/merchant-center",
    icon: PackageSearch,
    isActive: false,
    isDisabled: true
  },
  {
    label: "Optimalizálások",
    href: "/optimizations",
    icon: Sparkles,
    isActive: false,
    isDisabled: true
  },
  {
    label: "Riportok",
    href: "/reports",
    icon: FileText,
    isActive: false,
    isDisabled: true
  },
  {
    label: "Beállítások",
    href: "/settings",
    icon: Settings,
    isActive: false,
    isDisabled: true
  }
] as const;

export function getNavigationLabels() {
  return portalNavigationItems.map((item) => item.label);
}
