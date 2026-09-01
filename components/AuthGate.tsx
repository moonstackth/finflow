"use client";

import { FormEvent, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { supabase } from "../lib/supabase";
import { LogIn, Mail, Lock, Sprout } from "lucide-react";

export default function AuthGate({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      setError("ยังไม่ได้ตั้งค่า Supabase Environment Variables");
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!supabase) return;
    setBusy(true);
    setMessage("");
    setError("");

    const result = mode === "login"
      ? await supabase.auth.signInWithPassword({ email: email.trim(), password })
      : await supabase.auth.signUp({ email: email.trim(), password });

    if (result.error) {
      setError(result.error.message);
    } else if (mode === "signup") {
      setMessage("สมัครสมาชิกแล้ว กรุณาตรวจอีเมลเพื่อยืนยันบัญชีก่อนเข้าสู่ระบบ");
      setMode("login");
      setPassword("");
    }
    setBusy(false);
  }

  async function signOut() {
    if (supabase) await supabase.auth.signOut();
  }

  if (loading) {
    return <div className="min-h-screen bg-paper flex items-center justify-center text-muted">กำลังตรวจสอบบัญชี...</div>;
  }

  if (session) {
    return <div className="min-h-screen bg-paper">{children}<button onClick={signOut} className="fixed bottom-3 right-3 z-40 rounded-xl border border-[#E4D6C7] bg-white/90 px-3 py-2 text-xs text-muted shadow-sm hover:bg-white">ออกจากระบบ</button></div>;
  }

  return (
    <main className="min-h-screen bg-paper px-4 py-10 text-ink">
      <div className="mx-auto max-w-md">
        <div className="mb-7 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#E8EFE3] text-sage shadow-sm"><Sprout size={28}/></div>
          <h1 className="text-3xl font-semibold">FinFlow</h1>
          <p className="mt-2 text-sm text-muted">การเงินที่คุณควบคุมได้ 🌱</p>
          <p className="mt-1 text-xs text-muted">วางแผน จ่ายจริง และค่อย ๆ ไปสู่อิสรภาพทางการเงิน</p>
        </div>

        <section className="card p-6 sm:p-7">
          <div className="mb-6 flex rounded-xl bg-[#F6F0E7] p-1">
            <button onClick={() => {setMode("login");setError("");setMessage("")}} className={`flex-1 rounded-lg px-3 py-2 text-sm ${mode === "login" ? "bg-white font-medium shadow-sm" : "text-muted"}`}>เข้าสู่ระบบ</button>
            <button onClick={() => {setMode("signup");setError("");setMessage("")}} className={`flex-1 rounded-lg px-3 py-2 text-sm ${mode === "signup" ? "bg-white font-medium shadow-sm" : "text-muted"}`}>สมัครสมาชิก</button>
          </div>

          <form onSubmit={submit} className="space-y-4">
            <label className="block">
              <span className="text-sm text-muted">อีเมล</span>
              <div className="relative mt-2"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={17}/><input className="input pl-10" type="email" required autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com"/></div>
            </label>
            <label className="block">
              <span className="text-sm text-muted">รหัสผ่าน</span>
              <div className="relative mt-2"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={17}/><input className="input pl-10" type="password" required minLength={6} autoComplete={mode === "login" ? "current-password" : "new-password"} value={password} onChange={e=>setPassword(e.target.value)} placeholder="อย่างน้อย 6 ตัวอักษร"/></div>
            </label>

            {error && <div className="rounded-xl border border-[#E9C7BD] bg-[#FFF3EF] p-3 text-sm text-terracotta">{error}</div>}
            {message && <div className="rounded-xl border border-[#D4E2CE] bg-[#F1F7EE] p-3 text-sm text-sage">{message}</div>}

            <button disabled={busy} className="btn-primary flex w-full items-center justify-center gap-2 disabled:opacity-50" type="submit"><LogIn size={17}/>{busy ? "กำลังดำเนินการ..." : mode === "login" ? "เข้าสู่ระบบ" : "สร้างบัญชี"}</button>
          </form>

          <p className="mt-5 text-center text-xs leading-5 text-muted">บัญชีของคุณจะใช้สำหรับแยกข้อมูลการเงิน และขั้นต่อไปเราจะผูกบัญชีเข้ากับ Household เพื่อให้ข้อมูลซิงก์ข้ามเครื่อง</p>
        </section>
      </div>
    </main>
  );
}
