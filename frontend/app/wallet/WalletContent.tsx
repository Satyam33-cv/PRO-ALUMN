"use client";

import { RoleShell } from "@/components/RoleShell";
import { Card } from "@/components/ui";
import { Coins, ArrowDownLeft, ArrowUpRight, Clock, CheckCircle2 } from "lucide-react";

export function WalletContent({ wallet }: { wallet: any }) {
  const transactions = wallet?.transactions || [];

  return (
    <RoleShell>
      <div className="max-w-4xl mx-auto space-y-8 font-sans pb-16">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400 font-bold">
              WALLET LEDGER
            </span>
          </div>
          <h1 className="mt-1 font-display text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Points & Rewards
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Track your earned points from referrals, verifications, and engagement.
          </p>
        </div>

        <Card padding="lg" className="bg-gradient-to-br from-blue-600 to-indigo-600 border-none text-white shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-md">
                <Coins size={32} className="text-white" />
              </div>
              <div>
                <p className="text-blue-100 font-mono text-sm uppercase tracking-wider font-bold">Current Balance</p>
                <h2 className="text-5xl font-extrabold font-mono tracking-tight mt-1">
                  {wallet?.balance || 0} <span className="text-2xl text-blue-200">pts</span>
                </h2>
              </div>
            </div>
            
            <div className="bg-black/20 p-4 rounded-xl backdrop-blur-sm space-y-2 max-w-sm">
              <div className="flex items-start gap-2">
                <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                <p className="text-xs text-blue-100 leading-relaxed">
                  <strong>+50 pts</strong> awarded for verified profile approval.
                </p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                <p className="text-xs text-blue-100 leading-relaxed">
                  <strong>+100 pts</strong> awarded when a student you refer gets hired!
                </p>
              </div>
            </div>
          </div>
        </Card>

        <div className="space-y-4">
          <h3 className="font-heading text-xl font-bold flex items-center gap-2 text-slate-900 dark:text-slate-100">
            <Clock size={20} className="text-slate-500" />
            Transaction History
          </h3>

          {transactions.length === 0 ? (
            <Card padding="lg" className="text-center py-12 text-slate-500">
              <Coins size={32} className="mx-auto mb-3 opacity-20" />
              <p className="text-sm font-semibold">No transactions yet.</p>
              <p className="text-xs mt-1">Complete your profile or refer students to start earning points!</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {transactions.map((tx: any) => (
                <Card key={tx.id} padding="md" className="flex items-center justify-between hover:border-blue-500/30 transition-all">
                  <div className="flex items-center gap-4">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-bold ${
                      tx.type === "CREDIT" ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-600"
                    }`}>
                      {tx.type === "CREDIT" ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        {tx.description || tx.reason || (tx.type === "CREDIT" ? "Points Earned" : "Points Spent")}
                      </h4>
                      <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                        {new Date(tx.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className={`font-mono font-bold text-lg ${
                    tx.type === "CREDIT" ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                  }`}>
                    {tx.type === "CREDIT" ? "+" : "-"}{tx.amount}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </RoleShell>
  );
}
