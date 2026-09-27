"use client";

import { ChevronDown, LogOut, Menu, X } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Avatar } from "@/components/ui/avatar";
import { buttonClasses } from "@/components/ui/button";
import { ROLE_LABELS } from "@/lib/constants";
import { logoutAction } from "@/server/actions/auth";
import type { SessionUser } from "@/server/services/users";
import { NavLink } from "./nav-link";

type MenuUser = Pick<SessionUser, "id" | "name" | "email" | "role">;

/**
 * Disclosure state that closes on Escape (returning focus to the toggle button)
 * or on a click outside the container.
 */
function useDisclosure() {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const close = useCallback((returnFocus = false) => {
    setOpen(false);
    if (returnFocus) buttonRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") close(true);
    }
    function onPointer(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) close();
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [open, close]);

  return {
    open,
    toggle: () => setOpen((value) => !value),
    close: () => close(),
    containerRef,
    buttonRef,
  };
}

function LogoutButton({ className }: { className?: string }) {
  return (
    <form action={logoutAction}>
      <button type="submit" className={className}>
        <LogOut aria-hidden="true" className="size-4" />
        Log out
      </button>
    </form>
  );
}

function roleLinks(user: MenuUser): { href: string; label: string }[] {
  return user.role === "client"
    ? [
        { href: "/dashboard", label: "Dashboard" },
        { href: "/projects/new", label: "Post a project" },
      ]
    : [
        { href: "/dashboard", label: "Dashboard" },
        { href: "/dashboard/profile", label: "Edit profile" },
      ];
}

export function UserMenu({ user }: { user: MenuUser }) {
  const { open, toggle, close, containerRef, buttonRef } = useDisclosure();
  const menuId = useId();

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={toggle}
        className="flex items-center gap-2 rounded-full py-1 pr-2 pl-1 text-sm font-medium text-slate-700 hover:bg-slate-100"
      >
        <Avatar name={user.name} seed={user.id} size="sm" />
        <span className="max-w-32 truncate">{user.name}</span>
        <ChevronDown aria-hidden="true" className="size-4 text-slate-500" />
        <span className="sr-only">account menu</span>
      </button>
      {open && (
        <div
          id={menuId}
          className="absolute right-0 z-50 mt-2 w-64 animate-fade-in rounded-xl bg-white p-2 shadow-lg ring-1 ring-slate-200"
        >
          <div className="border-b border-slate-100 px-3 pt-1 pb-3">
            <p className="truncate text-sm font-medium text-slate-900">{user.name}</p>
            <p className="truncate text-xs text-slate-500">{user.email}</p>
            <p className="mt-1 text-xs font-medium text-brand-700">
              {ROLE_LABELS[user.role]} account
            </p>
          </div>
          <ul className="py-1">
            {roleLinks(user).map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={close}
                  className="block rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="border-t border-slate-100 pt-1">
            <LogoutButton className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100" />
          </div>
        </div>
      )}
    </div>
  );
}

export function MobileMenu({
  user,
  primaryLinks,
}: {
  user: MenuUser | null;
  primaryLinks: { href: string; label: string; exclude?: string[] }[];
}) {
  const { open, toggle, close, containerRef, buttonRef } = useDisclosure();
  const panelId = useId();

  let links: ReactNode;
  if (user) {
    links = roleLinks(user).map((link) => (
      <NavLink key={link.href} href={link.href} exact onNavigate={close} className="block">
        {link.label}
      </NavLink>
    ));
  }

  return (
    <div ref={containerRef} className="md:hidden">
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={toggle}
        className="rounded-lg p-2 text-slate-700 hover:bg-slate-100"
      >
        {open ? <X aria-hidden="true" className="size-6" /> : <Menu aria-hidden="true" className="size-6" />}
        <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
      </button>
      {open && (
        <div
          id={panelId}
          className="absolute inset-x-0 top-16 z-50 animate-fade-in border-b border-slate-200 bg-white px-4 pt-2 pb-4 shadow-lg"
        >
          <nav aria-label="Mobile" className="flex flex-col gap-1">
            {primaryLinks.map((link) => (
              <NavLink key={link.href} href={link.href} exclude={link.exclude} onNavigate={close} className="block">
                {link.label}
              </NavLink>
            ))}
            {links}
          </nav>
          <div className="mt-3 border-t border-slate-100 pt-3">
            {user ? (
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  <Avatar name={user.name} seed={user.id} size="sm" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{user.name}</p>
                    <p className="text-xs text-slate-500">{ROLE_LABELS[user.role]}</p>
                  </div>
                </div>
                <LogoutButton className={buttonClasses({ variant: "secondary", size: "sm" })} />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <Link href="/login" onClick={close} className={buttonClasses({ variant: "secondary" })}>
                  Log in
                </Link>
                <Link href="/signup" onClick={close} className={buttonClasses()}>
                  Sign up
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
