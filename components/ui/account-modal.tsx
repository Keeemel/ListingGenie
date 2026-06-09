"use client";

import { useState } from "react";
import { X, CreditCard, Trash2, AlertTriangle, Loader2, LogOut, User } from "lucide-react";
import type { User as SupabaseUser } from "@supabase/supabase-js";

interface AccountModalProps {
  user: SupabaseUser;
  credits: number;
  onClose: () => void;
  onSignOut: () => void;
  onBuyCredits: () => void;
}

export function AccountModal({ user, credits, onClose, onSignOut, onBuyCredits }: AccountModalProps) {
  const [deleteStep, setDeleteStep] = useState<"idle" | "confirm" | "deleting">("idle");
  const [deleteInput, setDeleteInput] = useState("");
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function handleDeleteAccount() {
    if (deleteInput !== "DELETE") {
      setDeleteError('Type "DELETE" exactly to confirm.');
      return;
    }
    setDeleteStep("deleting");
    setDeleteError(null);
    try {
      const res = await fetch("/api/account/delete", { method: "DELETE" });
      if (!res.ok) {
        const d = (await res.json()) as { error?: string };
        throw new Error(d.error ?? "Deletion failed.");
      }
      // Session is now invalid — full sign-out + redirect
      onSignOut();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Something went wrong.");
      setDeleteStep("confirm");
    }
  }

  const initials = user.email?.[0]?.toUpperCase() ?? "?";
  const email = user.email ?? "Unknown";
  const provider = user.app_metadata?.provider ?? "email";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.82)", backdropFilter: "blur(12px)" }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm overflow-hidden rounded-2xl border border-zinc-800/80 bg-zinc-950 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Gradient top bar */}
        <div className="h-px w-full" style={{ background: "linear-gradient(90deg,#6366f1,#a855f7,#ec4899)" }} />

        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-zinc-600 transition-colors hover:bg-zinc-800 hover:text-zinc-300"
          aria-label="Close"
        >
          <X size={15} />
        </button>

        <div className="p-6">
          {/* Avatar + email */}
          <div className="mb-6 flex items-center gap-3.5">
            <div
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-lg font-black text-white"
              style={{ background: "linear-gradient(135deg,#6366f1,#a855f7)" }}
            >
              {initials}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-zinc-100">{email}</p>
              <p className="mt-0.5 flex items-center gap-1 text-xs text-zinc-600">
                <User size={10} />
                {provider === "google" ? "Google account" : "Magic link"}
              </p>
            </div>
          </div>

          {/* Credits block */}
          <div className="mb-4 rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard size={14} className="text-indigo-400" />
                <span className="text-sm font-semibold text-zinc-200">
                  {credits} optimization{credits !== 1 ? "s" : ""} left
                </span>
              </div>
              {credits === 0 && (
                <span className="rounded-full border border-red-900/40 bg-red-950/30 px-2 py-0.5 text-[10px] font-semibold text-red-400">
                  Empty
                </span>
              )}
            </div>
            {credits <= 3 && (
              <button
                type="button"
                onClick={() => { onClose(); onBuyCredits(); }}
                className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-semibold text-white transition-all hover:opacity-90"
                style={{ background: "linear-gradient(135deg,#6366f1,#a855f7)" }}
              >
                Buy more credits
              </button>
            )}
          </div>

          {/* Sign out */}
          <button
            type="button"
            onClick={onSignOut}
            className="mb-5 flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/60 py-2.5 text-sm font-medium text-zinc-400 transition-colors hover:border-zinc-700 hover:text-zinc-200"
          >
            <LogOut size={13} />
            Sign out
          </button>

          {/* Danger zone */}
          <div className="rounded-xl border border-red-950/40 bg-red-950/10 p-4">
            <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-red-500">
              <AlertTriangle size={11} />
              Danger zone
            </p>

            {deleteStep === "idle" && (
              <>
                <p className="mb-3 text-xs leading-relaxed text-zinc-600">
                  Permanently delete your account and all associated data. This cannot be undone.
                </p>
                <button
                  type="button"
                  onClick={() => setDeleteStep("confirm")}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-900/40 bg-red-950/30 py-2.5 text-xs font-semibold text-red-400 transition-colors hover:bg-red-950/50 hover:text-red-300"
                >
                  <Trash2 size={12} />
                  Delete my account
                </button>
              </>
            )}

            {(deleteStep === "confirm" || deleteStep === "deleting") && (
              <div className="space-y-3">
                <p className="text-xs text-zinc-500">
                  Type <span className="font-bold text-red-400">DELETE</span> to permanently delete your account:
                </p>
                <input
                  type="text"
                  value={deleteInput}
                  onChange={(e) => setDeleteInput(e.target.value)}
                  placeholder="DELETE"
                  disabled={deleteStep === "deleting"}
                  className="w-full rounded-xl border border-red-900/30 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-700 outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/20"
                />
                {deleteError && <p className="text-xs text-red-400">{deleteError}</p>}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => { setDeleteStep("idle"); setDeleteInput(""); setDeleteError(null); }}
                    disabled={deleteStep === "deleting"}
                    className="flex-1 rounded-xl border border-zinc-700 bg-zinc-800 py-2 text-xs font-semibold text-zinc-400 transition-colors hover:bg-zinc-700 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteAccount}
                    disabled={deleteStep === "deleting" || deleteInput !== "DELETE"}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-red-600 py-2 text-xs font-semibold text-white transition-colors hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {deleteStep === "deleting" ? (
                      <><Loader2 size={12} className="animate-spin" />Deleting…</>
                    ) : (
                      <><Trash2 size={12} />Confirm</>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
