"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Mail } from "lucide-react";
import { supabasePublic } from "@/lib/supabaseClient";
import Logo from "@/components/Logo";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error } = await supabasePublic.auth.signInWithPassword({ email, password });

    setLoading(false);
    if (error) {
      setError("Email atau password salah");
      return;
    }
    router.push("/admin");
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6 bg-[#FAFAFA]">
      <div className="w-full max-w-sm">
        <div className="card p-8">
          <div className="mb-5">
            <Logo size={44} />
          </div>
          <h1 className="text-xl font-bold mb-1">Admin Dispatcher Sejasa</h1>
          <p className="text-ink-muted text-sm mb-7">Masuk untuk kelola pendaftaran mitra.</p>

          <form onSubmit={handleLogin} className="space-y-3.5">
            <div className="relative">
              <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted" />
              <input
                type="email"
                placeholder="Email"
                className="input-field pl-10"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted" />
              <input
                type="password"
                placeholder="Password"
                className="input-field pl-10"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {error && (
              <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
            )}
            <button type="submit" disabled={loading} className="btn-primary w-full mt-1">
              {loading ? "Masuk..." : "Masuk"}
            </button>
          </form>
        </div>
        <p className="text-center text-xs text-ink-muted mt-5">Dispatcher Sejasa — Internal Admin Tool</p>
      </div>
    </main>
  );
}
