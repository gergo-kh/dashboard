"use client";

import { Menu, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { signOutAction } from "@/app/(portal)/actions";
import { portalNavigationItems } from "@/components/portal/navigation";
import type { PortalShellViewModel } from "@/types/overview";

type PortalMobileNavProps = Readonly<{
  shell: PortalShellViewModel;
}>;

export function PortalMobileNav({ shell }: PortalMobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const drawer = drawerRef.current;
    const focusable = drawer?.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    const first = focusable?.[0];
    const last = focusable?.[focusable.length - 1];

    first?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
        triggerRef.current?.focus();
        return;
      }

      if (event.key !== "Tab" || !first || !last) {
        return;
      }

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      }

      if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  return (
    <>
      <header className="kh-mobile-topbar">
        <button
          aria-expanded={isOpen}
          aria-label="Mobil menü megnyitása"
          className="kh-icon-button"
          onClick={() => setIsOpen(true)}
          ref={triggerRef}
          type="button"
        >
          <Menu aria-hidden="true" size={21} />
        </button>
        <div>
          <strong>KonverzióHuszár</strong>
          <span>{shell.selectedProjectName}</span>
        </div>
      </header>

      {isOpen ? (
        <div className="kh-drawer-overlay" role="presentation">
          <div
            aria-label="Mobil navigáció"
            aria-modal="true"
            className="kh-mobile-drawer"
            ref={drawerRef}
            role="dialog"
          >
            <div className="kh-drawer-header">
              <strong>Menü</strong>
              <button
                aria-label="Mobil menü bezárása"
                className="kh-icon-button"
                onClick={() => setIsOpen(false)}
                type="button"
              >
                <X aria-hidden="true" size={21} />
              </button>
            </div>

            <nav className="kh-mobile-nav-list" aria-label="Mobil portál menü">
              {portalNavigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    aria-current={item.isActive ? "page" : undefined}
                    aria-disabled={item.isDisabled ? "true" : undefined}
                    className={item.isActive ? "is-active" : ""}
                    key={item.label}
                    title={item.isDisabled ? `${item.label} oldal hamarosan elérhető` : item.label}
                    type="button"
                  >
                    <Icon aria-hidden="true" size={18} />
                    {item.label}
                  </button>
                );
              })}
            </nav>

            <div className="kh-drawer-context">
              <span>Ügyfél</span>
              <strong>{shell.selectedClientName}</strong>
              <span>Projekt</span>
              <strong>{shell.selectedProjectName}</strong>
              <span>PPC manager</span>
              <strong>{shell.ppcManagerName} · Aktív</strong>
            </div>

            <form action={signOutAction}>
              <button className="kh-sidebar-logout" type="submit">
                Kijelentkezés
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
