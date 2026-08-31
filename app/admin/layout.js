"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { LogOut, LayoutDashboard, BarChart3, ChevronRight } from "lucide-react";
import { supabasePublic } from "@/lib/supabaseClient";
import Logo from "@/components/Logo";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/analytics", label: "Performa", icon: BarChart3 },
];

export default function AdminLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);
  const [adminEmail, setAdminEmail] = useState("");
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

  async function handleLogout() {
    await supabasePublic.auth.signOut();
    router.push("/admin/login");
  }

  if (isLoginPage) return children;
  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA]">
        <div className="w-6 h-6 border-2 border-gray-200 border-t-brand rounded-full animate-spin" />
      </div>
    );
  }

  const initial = adminEmail.charAt(0).toUpperCase();

  return (
    <div className="min-h-screen flex bg-[#FAFAFA]">
      <aside className="w-64 bg-white border-r border-gray-100 flex flex-col py-5 px-3">
        <div className="flex items-center gap-2.5 mb-9 px-2.5">
          <Logo size={36} rounded="rounded-xl" />
          <div>
            <div className="font-semibold text-sm leading-tight">Rekrutmen Dispatcher</div>
            <div className="text-[11px] text-ink-muted leading-tight">Admin Panel</div>
          </div>
        </div>

        <nav className="flex-1 space-y-0.5">
          <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-3 mb-2">
            Menu
          </div>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  active ? "text-brand bg-brand-light" : "text-ink-muted hover:bg-gray-50 hover:text-ink"
                }`}
              >
                {active && (
                  <span
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full"
                    style={{ backgroundColor: "#E6007E" }}
                  />
                )}
                <Icon size={17} strokeWidth={active ? 2.4 : 2} />
                {item.label}
                {active && <ChevronRight size={14} className="ml-auto opacity-60" />}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-gray-100 pt-3 mt-3">
          <div className="flex items-center gap-2.5 px-2.5 py-2 mb-1 rounded-lg">
            <div className="w-8 h-8 rounded-full bg-gray-100 text-ink-muted flex items-center justify-center text-xs font-semibold shrink-0">
              {initial}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium truncate">{adminEmail}</p>
              <p className="text-[11px] text-ink-muted">Administrator</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2.5 w-full text-sm text-ink-muted hover:text-red-600 hover:bg-red-50 rounded-lg px-3 py-2 transition"
          >
            <LogOut size={16} />
            Keluar
          </button>
        </div>
      </aside>
      <main className="flex-1 p-8 max-w-[1400px]">{children}</main>
    </div>
  );
}
