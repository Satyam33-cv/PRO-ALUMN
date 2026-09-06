"use client";

import { RoleShell } from "@/components/RoleShell";
import { Coins, ArrowDownLeft, ArrowUpRight, Clock, CheckCircle2, ShieldCheck, Sparkles } from "lucide-react";

export interface WalletTransaction {
  id: string;
  type: string;
  amount: number;
  description?: string | null;
  reason?: string | null;
  createdAt: string | Date;
}

export interface UserWallet {
  id?: string;
  balance: number;
  transactions?: WalletTransaction[];
}

export function WalletContent({ wallet }: { wallet: UserWallet | null }) {
  const transactions = wallet?.transactions || [];

  return (
    <RoleShell>
      <div className="max-w-5xl mx-auto space-y-8 font-sans pb-16 px-4 sm:px-6">
        {/* Header Strip */}
        <div className="border-b-2 border-black pb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] uppercase tracking-wider bg-black text-[#CCFF00] px-2.5 py-0.5 font-bold">
                FINANCIAL LEDGER // ESCROW
              </span>
              <span className="font-mono text-[10px] text-neutral-500 uppercase font-bold">
                PROOF-OF-PARTICIPATION
              </span>
            </div>
            <h1 className="mt-1 font-headline text-3xl sm:text-4xl font-extrabold uppercase tracking-tight text-black dark:text-white">
              Wallet &amp; Point Ledger
            </h1>
            <p className="mt-1 font-mono text-xs text-neutral-600 dark:text-neutral-400">
              Cryptographic credit accounting for referrals, mentorship, and profile verifications.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-[#CCFF00] border-2 border-black text-black font-mono text-xs font-bold shadow-[2px_2px_0px_#000000]">
              ESCROW STATUS: ACTIVE
            </span>
          </div>
        </div>

        {/* Hero Neo-Brutalist Balance Card */}
        <div className="bg-[#F7F4EE] dark:bg-[#12151b] border-4 border-black shadow-[6px_6px_0px_#000000] p-6 sm:p-8 relative overflow-hidden">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="h-16 w-16 bg-[#CCFF00] border-2 border-black shadow-[3px_3px_0px_#000000] flex items-center justify-center shrink-0">
                <Coins size={32} className="text-black" />
              </div>
              <div>
                <p className="font-mono text-[11px] text-neutral-600 dark:text-neutral-400 uppercase font-bold tracking-wider">
                  CURRENT AVAILABLE BALANCE
                </p>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-5xl sm:text-6xl font-black font-mono tracking-tight text-black dark:text-white">
                    {wallet?.balance || 0}
                  </span>
                  <span className="font-mono text-xl text-[#FF5500] font-bold">
                    ALUMN-CR
                  </span>
                </div>
              </div>
            </div>

            {/* Credit Allocation Explainer */}
            <div className="bg-white dark:bg-[#181a20] border-2 border-black p-4 shadow-[3px_3px_0px_#000000] space-y-2 max-w-md font-mono text-xs">
              <div className="flex items-start gap-2">
                <ShieldCheck size={16} className="text-[#00E676] shrink-0 mt-0.5" />
                <p className="text-neutral-700 dark:text-neutral-300">
                  <strong className="text-black dark:text-white">+50 pts</strong> credited on campus admin credential verification.
                </p>
              </div>
              <div className="flex items-start gap-2">
                <Sparkles size={16} className="text-[#FF5500] shrink-0 mt-0.5" />
                <p className="text-neutral-700 dark:text-neutral-300">
                  <strong className="text-black dark:text-white">+100 pts</strong> awarded when an alumni referral candidate gets hired!
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Ledger Transaction History */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-headline text-lg sm:text-xl font-bold uppercase tracking-tight flex items-center gap-2 text-black dark:text-white">
              <Clock size={18} className="text-[#FF5500]" />
              Immutable Transaction Ledger
            </h2>
            <span className="font-mono text-xs text-neutral-500 font-bold">
              {transactions.length} RECORD{transactions.length === 1 ? "" : "S"}
            </span>
          </div>

          {transactions.length === 0 ? (
            <div className="bg-white dark:bg-[#181a20] border-2 border-black shadow-[4px_4px_0px_#000000] p-10 text-center space-y-2">
              <Coins size={36} className="mx-auto text-neutral-400 mb-2" />
              <h3 className="font-headline font-bold text-base uppercase text-black dark:text-white">
                No Transactions Logged Yet
              </h3>
              <p className="font-mono text-xs text-neutral-500 max-w-sm mx-auto">
                Complete your profile or refer students to trigger automated cryptographic point disbursements.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="bg-white dark:bg-[#181a20] border-2 border-black shadow-[3px_3px_0px_#000000] p-4 flex items-center justify-between gap-4 transition-all hover:translate-x-1"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div
                      className={`h-10 w-10 shrink-0 border-2 border-black flex items-center justify-center font-bold ${
                        tx.amount > 0
                          ? "bg-[#00E676] text-black shadow-[2px_2px_0px_#000000]"
                          : "bg-[#FF5500] text-white shadow-[2px_2px_0px_#000000]"
                      }`}
                    >
                      {tx.amount > 0 ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-headline text-sm font-bold uppercase tracking-tight text-black dark:text-white truncate">
                        {tx.description || tx.reason || (tx.amount > 0 ? "Credits Disbursed" : "Credits Debited")}
                      </h4>
                      <p className="font-mono text-[11px] text-neutral-500">
                        {new Date(tx.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>

                  <div
                    className={`font-mono font-bold text-base sm:text-lg px-3 py-1 border-2 border-black shrink-0 ${
                      tx.amount > 0
                        ? "bg-[#CCFF00] text-black shadow-[2px_2px_0px_#000000]"
                        : "bg-[#FF5500] text-white shadow-[2px_2px_0px_#000000]"
                    }`}
                  >
                    {tx.amount > 0 ? "+" : ""}{tx.amount} CR
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </RoleShell>
  );
}
