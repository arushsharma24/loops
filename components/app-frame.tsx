"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Bookmark, CircleCheck, Globe, Home, Moon, Plus, Search, Sun } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { LoopModal } from "@/components/loop-modal";
import type { LoopDomain, LoopRecord } from "@/lib/loop-record";

const navItems = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/later", label: "Saved for Later", icon: Bookmark },
  { href: "/closed", label: "Closed", icon: CircleCheck },
];

const contextItems: Array<{ value: LoopDomain; label: string; icon: typeof Globe }> = [
  { value: "ALL", label: "All", icon: Globe },
  { value: "WORK", label: "Work", icon: Globe },
  { value: "PERSONAL", label: "Personal", icon: Globe },
];

export function AppFrame({
  children,
  user,
  initialLoops,
}: {
  children: React.ReactNode;
  user: { id: string; email: string; name: string | null };
  initialLoops: LoopRecord[];
}) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const [editLoop, setEditLoop] = useState<LoopRecord | null>(null);
  const [theme, setTheme] = useState<"light" | "dark">("light");

  const initials = useMemo(() => (user.name || user.email).slice(0, 1).toUpperCase(), [user.email, user.name]);
  const domain = (searchParams.get("domain")?.toUpperCase() as LoopDomain | null) || "ALL";

  useEffect(() => {
    const root = document.documentElement;
    const stored = window.localStorage.getItem("loops-theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const nextTheme = stored === "light" || stored === "dark" ? stored : prefersDark ? "dark" : "light";

    root.dataset.theme = nextTheme;
    setTheme(nextTheme);
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (!(event.metaKey || event.ctrlKey) || !event.shiftKey || event.key.toLowerCase() !== "o") {
        return;
      }

      const target = event.target as HTMLElement | null;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        target?.isContentEditable
      ) {
        return;
      }

      event.preventDefault();
      setEditLoop(null);
      setOpen(true);
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  function hrefWithDomain(path: string, value: LoopDomain) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "ALL") {
      params.delete("domain");
    } else {
      params.set("domain", value);
    }
    const query = params.toString();
    return query ? `${path}?${query}` : path;
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  function toggleTheme() {
    const nextTheme = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = nextTheme;
    window.localStorage.setItem("loops-theme", nextTheme);
    setTheme(nextTheme);
  }

  const topbarTitle = pathname.startsWith("/loops/")
    ? "Loop View"
    : pathname === "/home"
      ? "All Loops"
      : pathname === "/later"
        ? "Saved for Later"
        : "Closed Loops";

  return (
    <>
      <div className={`shell ${open ? "shell-blurred" : ""}`}>
        <aside className="sidebar">
          <div className="sidebar-brand">
            <div className="brand-mark brand-mark-small">∞</div>
            <div>
              <h1>Loops</h1>
            </div>
          </div>

          <nav className="sidebar-nav">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;
              return (
                <Link className={`sidebar-link ${active ? "is-active" : ""}`} href={item.href} key={item.href}>
                  <Icon size={18} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="sidebar-section">
            <p className="sidebar-label">Contexts</p>
            <div className="context-list">
              {contextItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    className={`context-chip ${domain === item.value ? "is-active" : ""}`}
                    href={hrefWithDomain(pathname, item.value)}
                    key={item.value}
                  >
                    <Icon size={18} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
            <p className="sidebar-note">Custom contexts can be added later. For now, contexts map to work and personal.</p>
          </div>

          <div className="sidebar-footer">
            <div className="account-card">
              <div className="avatar">{initials}</div>
              <div>
                <strong>{user.name || "Loops User"}</strong>
                <p>{user.email}</p>
              </div>
            </div>

            <button className="ghost-link" type="button" onClick={logout}>
              Sign out
            </button>
          </div>
        </aside>

        <div className="shell-main">
          <header className="topbar">
            <div className="topbar-title">
              <h2>{topbarTitle}</h2>
            </div>

            <div className="topbar-actions">
              <button
                className="icon-button"
                type="button"
                aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
                onClick={toggleTheme}
              >
                {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              <button className="icon-button" type="button" aria-label="Search">
                <Search size={18} />
              </button>
              <button className="primary-button" type="button" onClick={() => setOpen(true)}>
                <Plus size={18} />
                New
              </button>
            </div>
          </header>

          {children}
        </div>
      </div>

      <LoopModal
        defaultDomain={domain === "ALL" ? "WORK" : domain}
        isOpen={open || !!editLoop}
        loops={initialLoops}
        loop={editLoop}
        onClose={() => {
          setOpen(false);
          setEditLoop(null);
        }}
      />
    </>
  );
}
