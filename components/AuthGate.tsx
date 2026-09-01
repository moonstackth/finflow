"use client";

import { FormEvent, useEffect, useState, createContext } from "react";
import type { ReactNode } from "react";
import { supabase } from "../lib/supabase";
import { getOrCreateHousehold, Household, HouseholdMember } from "../lib/household";
import { LogIn, Mail, Lock, Sprout, Home, UserRound, LogOut, ChevronDown } from "lucide-react";

export const HouseholdContext = createContext<{ householdId: string | null; userId: string | null }>({ householdId: null, userId: null });

export default function AuthGate({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [accountLoading, setAccountLoading] = useState(false);
  const [household, setHousehold] = useState<Household | null>(null);
  const [member, setMember] = useState<HouseholdMember | null>(null);
  const [accountOpen, setAccountOpen] = useState(false);
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadAccount(nextSession: any) {
    setSession(nextSession);
    setHousehold(null);
    setMember(null);
    setAccountOpen(false);

    if (!nextSession?.user?.id || !supabase) {
      setLoading(false);
      return;
    }

    setAccountLoading(true);
    setError("");
    try {
      const result = await getOrCreateHousehold(nextSession.user.id);
      setHousehold(result.household);
      setMember(result.member);
    } catch (e: any) {
      console.error("FinFlow household setup failed", e);
      setError(`เข้าสู่ระบบได้แล้ว แต่ยังเตรียมครอบครัวไม่สำเร็จ: ${e?.message || "ไม่ทราบสาเหตุ"}`);
    } finally {
      setAccountLoading(false);
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      setError("ยังไม่ได้ตั้งค่า Supabase Environment Variables");
      return;
    }

    supabase.auth.getSession().then(({ data }) => loadAccount(data.session));

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      void loadAccount(nextSession);
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
    const userEmail = session.user?.email || "ไม่พบอีเมล";
    const roleLabel = member?.role === "OWNER" || member?.role === "owner" ? "เจ้าของครอบครัว" : "สมาชิก";

    return (
      <div className="min-h-screen bg-paper">
        <div className="sticky top-0 z-30 border-b border-[#E4D6C7] bg-paper/95 px-4 py-2 backdrop-blur sm:px-6">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-sm font-medium text-ink">
                <Home size={15} className="shrink-0 text-sage" />
                <span className="truncate">{household?.name || "กำลังเตรียมครอบครัว..."}</span>
              </div>
              <p className="truncate text-[11px] text-muted">ข้อมูลของครอบครัวนี้จะใช้ร่วมกันในบัญชีสมาชิก</p>
            </div>

            <div className="relative shrink-0">
              <button
                onClick={() => setAccountOpen(v => !v)}
                className="flex max-w-[260px] items-center gap-2 rounded-2xl border border-[#E4D6C7] bg-white/80 px-3 py-2 text-left shadow-sm hover:bg-white"
                aria-expanded={accountOpen}
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#E8EFE3] text-sage"><UserRound size={16} /></span>
                <span className="hidden min-w-0 sm:block">
                  <b className="block max-w-[170px] truncate text-xs font-medium">{userEmail}</b>
                  <span className="block text-[10px] text-muted">{accountLoading ? "กำลังเตรียมบัญชี..." : roleLabel}</span>
                </span>
                <ChevronDown size={15} className="text-muted" />
              </button>

              {accountOpen && (
                <div className="absolute right-0 mt-2 w-[290px] rounded-2xl border border-[#E4D6C7] bg-white p-3 shadow-xl">
                  <div className="rounded-xl bg-[#FBF7EF] p-3">
                    <p className="text-[11px] uppercase tracking-wider text-muted">บัญชีที่กำลังใช้งาน</p>
                    <p className="mt-1 break-all text-sm font-medium">{userEmail}</p>
                    <div className="mt-3 flex items-center gap-2 text-xs text-muted"><Home size={14} />{household?.name || "ยังไม่ได้สร้าง Household"}</div>
                    <p className="mt-1 text-xs text-muted">บทบาท: {roleLabel}</p>
                  </div>
                  {error && <div className="mt-2 rounded-xl border border-[#E9C7BD] bg-[#FFF3EF] p-3 text-xs text-terracotta">{error}</div>}
                  <button onClick={signOut} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-[#E9C7BD] bg-[#FFF8F5] px-3 py-2 text-sm text-terracotta hover:bg-white"><LogOut size={15}/> ออกจากระบบ</button>
                </div>
              )}
            </div>
          </div>
        </div>

        {error && !accountOpen && (
          <div className="mx-auto mt-3 max-w-7xl px-4 sm:px-6">
            <div className="rounded-xl border border-[#E9C7BD] bg-[#FFF3EF] p-3 text-sm text-terracotta">{error}</div>
          </div>
        )}

        <HouseholdContext.Provider value={{ householdId: household?.id || null, userId: session.user?.id || null }}>
          {children}
        </HouseholdContext.Provider>
      </div>
    );
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

          <p className="mt-5 text-center text-xs leading-5 text-muted">บัญชีของคุณจะใช้สำหรับแยกข้อมูลการเงิน และเชื่อมกับ Household เพื่อให้ข้อมูลซิงก์ข้ามเครื่อง</p>
        </section>
      </div>
    </main>
  );
}
