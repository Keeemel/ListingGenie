"use client";

import { useState } from "react";
import { X, Mail, CheckCircle2, Loader2, Wand2, BarChart3, Brain, ArrowRight } from "lucide-react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

interface AuthModalProps {
  onClose: () => void;
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 256 262" xmlns="http://www.w3.org/2000/svg">
      <path fill="#4285f4" d="M255.878 133.451c0-10.734-.871-18.567-2.756-26.69H130.55v48.448h71.947c-1.45 12.04-9.283 30.172-26.69 42.356l-.244 1.622 38.755 30.023 2.685.268c24.659-22.774 38.875-56.282 38.875-96.027" />
      <path fill="#34a853" d="M130.55 261.1c35.248 0 64.839-11.605 86.453-31.622l-41.196-31.913c-11.024 7.688-25.82 13.055-45.257 13.055-34.523 0-63.824-22.773-74.269-54.25l-1.531.13-40.298 31.187-.527 1.465C35.393 231.798 79.49 261.1 130.55 261.1" />
      <path fill="#fbbc05" d="M56.281 156.37c-2.756-8.123-4.351-16.827-4.351-25.82 0-8.994 1.595-17.697 4.206-25.82l-.073-1.73L15.26 71.312l-1.335.635C5.077 89.644 0 109.517 0 130.55s5.077 40.905 13.925 58.602z" />
      <path fill="#eb4335" d="M130.55 50.479c24.514 0 41.05 10.589 50.479 19.438l36.844-35.974C195.245 12.91 165.798 0 130.55 0 79.49 0 35.393 29.301 13.925 71.947l42.211 32.783c10.59-31.477 39.891-54.251 74.414-54.251" />
    </svg>
  );
}

export function AuthModal({ onClose }: AuthModalProps) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGoogleSignIn() {
    setGoogleLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const { error: err } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: typeof window !== "undefined"
            ? `${window.location.origin}/auth/callback`
            : "/auth/callback",
        },
      });
      if (err) { setError(err.message); setGoogleLoading(false); }
      // if no error, browser redirects — no need to reset loading
    } catch {
      setError("Google sign-in failed. Try again.");
      setGoogleLoading(false);
    }
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error: err } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: typeof window !== "undefined"
          ? `${window.location.origin}/auth/callback`
          : "/auth/callback",
      },
    });
    if (err) { setError(err.message); setLoading(false); }
    else { setSent(true); setLoading(false); }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.82)", backdropFilter: "blur(12px)" }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md overflow-hidden rounded-3xl border border-zinc-800/80 shadow-2xl"
        style={{
          background: "linear-gradient(145deg, rgba(255,255,255,0.06) 0%, rgba(18,18,18,0.98) 100%)",
          backdropFilter: "blur(20px)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Gradient top line */}
        <div className="h-px w-full" style={{ background: "linear-gradient(90deg,#6366f1,#a855f7,#ec4899)" }} />

        {/* Close */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-zinc-600 transition-colors hover:bg-zinc-800/80 hover:text-zinc-300"
          aria-label="Close"
        >
          <X size={15} />
        </button>

        {!sent ? (
          <div className="p-8">
            {/* Branding */}
            <div className="mb-6 flex flex-col items-center text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl"
                style={{ background: "linear-gradient(135deg,#6366f120,#a855f720)", border: "1px solid #6366f130" }}>
                <Image src="/logo.svg" width={28} height={28} alt="ListingGenie" unoptimized />
              </div>
              <h2 className="text-xl font-black text-white">Unlock AI optimization</h2>
              <p className="mt-1 text-sm text-zinc-500">
                Sign in to get <span className="font-semibold text-zinc-300">3 free rewrites</span> — no credit card needed
              </p>
            </div>

            {/* Google CTA — primary */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={googleLoading}
              className="flex w-full items-center justify-center gap-3 rounded-2xl border border-zinc-700/60 bg-zinc-900 py-3.5 text-sm font-semibold text-zinc-100 transition-all hover:border-zinc-500 hover:bg-zinc-800 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {googleLoading ? (
                <Loader2 size={16} className="animate-spin text-zinc-400" />
              ) : (
                <GoogleIcon />
              )}
              {googleLoading ? "Redirecting to Google…" : "Continue with Google"}
            </button>

            {/* Divider */}
            <div className="my-5 flex items-center gap-3">
              <div className="h-px flex-1 bg-zinc-800" />
              <span className="text-[11px] font-medium text-zinc-600">or continue with email</span>
              <div className="h-px flex-1 bg-zinc-800" />
            </div>

            {/* Magic link form */}
            <form onSubmit={handleMagicLink} className="space-y-3">
              <div className="relative">
                <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-600" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  autoComplete="email"
                  className="w-full rounded-xl border border-zinc-700/80 bg-zinc-900/80 py-3 pl-10 pr-4 text-sm text-zinc-100 placeholder-zinc-600 outline-none transition-all focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
              {error && <p className="text-xs text-red-400">{error}</p>}
              <button
                type="submit"
                disabled={loading || !email.trim()}
                className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                style={{ background: "linear-gradient(135deg,#6366f1,#a855f7)" }}
              >
                {loading ? (
                  <><Loader2 size={14} className="animate-spin" />Sending…</>
                ) : (
                  <>Send magic link<ArrowRight size={14} /></>
                )}
              </button>
            </form>

            {/* Benefits */}
            <div className="mt-6 space-y-2">
              {[
                { Icon: Brain, color: "#818cf8", text: "AI trained on e-commerce conversion patterns" },
                { Icon: BarChart3, color: "#34d399", text: "Platform-specific rewrites — Amazon, Etsy, eBay…" },
                { Icon: Wand2, color: "#a855f7", text: "3 free optimizations on every account" },
              ].map(({ Icon, color, text }) => (
                <div key={text} className="flex items-center gap-2.5">
                  <Icon size={12} style={{ color }} className="shrink-0" />
                  <p className="text-xs text-zinc-600">{text}</p>
                </div>
              ))}
            </div>

            <p className="mt-5 text-center text-[11px] text-zinc-700">
              No password. No spam. Cancel any time.
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-5 p-8 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full"
              style={{ background: "linear-gradient(135deg,#052e16,#14532d)", border: "1px solid #166534" }}>
              <CheckCircle2 size={24} className="text-emerald-400" />
            </div>
            <div>
              <h2 className="text-base font-black text-zinc-100">Check your inbox</h2>
              <p className="mt-2 text-sm leading-relaxed text-zinc-500">
                Magic link sent to{" "}
                <span className="font-semibold text-zinc-300">{email}</span>.
                <br />Click it — you&apos;ll land back here, signed in.
              </p>
            </div>
            <button type="button" onClick={onClose}
              className="rounded-full border border-zinc-700 bg-zinc-800/80 px-6 py-2.5 text-sm font-semibold text-zinc-200 transition-colors hover:bg-zinc-700">
              Got it
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
