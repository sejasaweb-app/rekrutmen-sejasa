"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { LogOut, LayoutDashboard, BarChart3, Settings, ChevronRight, Menu, X } from "lucide-react";
import { supabasePublic } from "@/lib/supabaseClient";
import Logo from "@/components/Logo";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/analytics", label: "Performa", icon: BarChart3 },
  { href: "/admin/settings", label: "Pengaturan", icon: Settings },
];

// Dashboard tetap kelihatan aktif waktu admin lagi buka detail pelamar.
function isActive(href, pathname) {
  if (href === "/admin") return pathname === "/admin" || pathname.startsWith("/admin/applicants");
  return pathname.startsWith(href);
}

// Isi sidebar — dipakai bareng oleh sidebar desktop dan drawer di HP.
function SidebarContent({ pathname, adminEmail, onLogout, onClose }) {
  const initial = adminEmail.charAt(0).toUpperCase();

  return (
    <div className="flex h-full flex-col py-5 px-3">
      <div className="flex items-center gap-2.5 mb-8 px-2.5">
        <Logo size={36} rounded="rounded-xl" />
        <div className="min-w-0 flex-1">
          <div className="font-display font-bold text-[15px] leading-tight tracking-tight">
            Sejasa Home Team
          </div>
          <div className="text-[11px] text-ink-muted leading-tight mt-0.5">Admin Panel</div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            aria-label="Tutup menu"
            className="p-1.5 rounded-full text-ink-muted hover:bg-gray-100 hover:text-ink transition"
          >
            <X size={18} />
          </button>
        )}
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto">
        <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-3 mb-2">
          Menu
        </div>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href, pathname);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={`relative flex items-center gap-2.5 rounded-control px-3 py-2.5 text-sm font-medium transition ${
                active ? "text-brand bg-brand/[0.07]" : "text-ink-muted hover:bg-gray-50 hover:text-ink"
              }`}
            >
              {active && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-brand" />
              )}
              <Icon size={17} strokeWidth={active ? 2.4 : 2} />
              {item.label}
              {active && <ChevronRight size={14} className="ml-auto opacity-60" />}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-gray-100 pt-3 mt-3">
        <div className="flex items-center gap-2.5 px-2.5 py-2 mb-1 rounded-control bg-gray-50/60">
          <div className="w-8 h-8 rounded-full bg-white ring-1 ring-gray-200 text-ink-muted flex items-center justify-center text-xs font-semibold shrink-0">
            {initial}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium truncate">{adminEmail}</p>
            <p className="text-[11px] text-ink-muted">Administrator</p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="flex items-center gap-2.5 w-full text-sm text-ink-muted hover:text-red-600 hover:bg-red-50 rounded-control px-3 py-2 transition"
        >
          <LogOut size={16} />
          Keluar
        </button>
      </div>
    </div>
  );
}

export default function AdminLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);
  const [adminEmail, setAdminEmail] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const isLoginPage = pathname === "/admin/login";

  useEffect(() => {
    if (isLoginPage) {
      setChecking(false);
      return;
    }
    supabasePublic.auth.getSession().then(({ data }) => {
      if (!data.session) {
        router.replace("/admin/login");
      } else {
        setAdminEmail(data.session.user.email);
        setChecking(false);
      }
    });
  }, [isLoginPage, router]);

  // Pindah halaman -> tutup drawer menu di HP
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  // Drawer kebuka: kunci scroll halaman di belakangnya, Esc buat nutup
  useEffect(() => {
    if (!drawerOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(e) {
      if (e.key === "Escape") setDrawerOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [drawerOpen]);

  async function handleLogout() {
    await supabasePublic.auth.signOut();
    router.push("/admin/login");
  }

  if (isLoginPage) return children;
  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-6 h-6 border-2 border-gray-200 border-t-brand rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 lg:flex">
      {/* Desktop: sidebar nempel di sisi kiri, tombol Keluar selalu kelihatan */}
      <aside className="hidden lg:block w-64 shrink-0 sticky top-0 h-screen bg-white border-r border-gray-100">
        <SidebarContent pathname={pathname} adminEmail={adminEmail} onLogout={handleLogout} />
      </aside>

      {/* HP/tablet: top bar + menu hamburger */}
      <header className="lg:hidden sticky top-0 z-40 flex items-center gap-3 bg-white/95 backdrop-blur border-b border-gray-100 px-4 py-3">
        <button
          onClick={() => setDrawerOpen(true)}
          aria-label="Buka menu"
          className="p-2 -ml-2 rounded-full text-ink hover:bg-gray-100 transition"
        >
          <Menu size={20} />
        </button>
        <Logo size={28} rounded="rounded-lg" />
        <span className="font-display font-bold text-[15px] tracking-tight">Sejasa Home Team</span>
      </header>

      <div
        className={`fixed inset-0 z-50 lg:hidden transition-[visibility] duration-200 ${
          drawerOpen ? "visible" : "invisible"
        }`}
        aria-hidden={!drawerOpen}
      >
        <div
          className={`absolute inset-0 bg-black/40 transition-opacity duration-200 ${
            drawerOpen ? "opacity-100" : "opacity-0"
          }`}
          onClick={() => setDrawerOpen(false)}
        />
        <aside
          className={`absolute inset-y-0 left-0 w-72 max-w-[85vw] bg-white shadow-2xl transition-transform duration-200 ease-out ${
            drawerOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <SidebarContent
            pathname={pathname}
            adminEmail={adminEmail}
            onLogout={handleLogout}
            onClose={() => setDrawerOpen(false)}
          />
        </aside>
      </div>

      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 max-w-[1400px]">{children}</main>
    </div>
  );
}
