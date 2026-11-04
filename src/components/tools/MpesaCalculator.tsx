"use client";

import React, { useState, useMemo } from "react";
import {
  Banknote,
  Send,
  ArrowRight,
  Copy,
  Check,
  Share2,
  Info,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  Smartphone,
  ExternalLink,
} from "lucide-react";

// Official Kenyan Safaricom M-Pesa Tariffs (2024-2026 Schedule)
export interface TariffBand {
  min: number;
  max: number;
  sendRegistered: number;
  sendOtherNetworks: number;
  sendUnregistered: number | null;
  withdrawAgent: number | null;
  withdrawAtm: number | null;
}

export const MPESA_TARIFFS: TariffBand[] = [
  { min: 1, max: 49, sendRegistered: 0, sendOtherNetworks: 0, sendUnregistered: null, withdrawAgent: null, withdrawAtm: null },
  { min: 50, max: 100, sendRegistered: 0, sendOtherNetworks: 0, sendUnregistered: null, withdrawAgent: 11, withdrawAtm: null },
  { min: 101, max: 500, sendRegistered: 7, sendOtherNetworks: 7, sendUnregistered: 47, withdrawAgent: 29, withdrawAtm: 35 },
  { min: 501, max: 1000, sendRegistered: 13, sendOtherNetworks: 13, sendUnregistered: 70, withdrawAgent: 29, withdrawAtm: 35 },
  { min: 1001, max: 1500, sendRegistered: 23, sendOtherNetworks: 23, sendUnregistered: 86, withdrawAgent: 29, withdrawAtm: 35 },
  { min: 1501, max: 2500, sendRegistered: 33, sendOtherNetworks: 33, sendUnregistered: 117, withdrawAgent: 29, withdrawAtm: 35 },
  { min: 2501, max: 3500, sendRegistered: 53, sendOtherNetworks: 53, sendUnregistered: 171, withdrawAgent: 52, withdrawAtm: 69 },
  { min: 3501, max: 5000, sendRegistered: 57, sendOtherNetworks: 57, sendUnregistered: 211, withdrawAgent: 69, withdrawAtm: 69 },
  { min: 5001, max: 7500, sendRegistered: 78, sendOtherNetworks: 78, sendUnregistered: 268, withdrawAgent: 87, withdrawAtm: 115 },
  { min: 7501, max: 10000, sendRegistered: 90, sendOtherNetworks: 90, sendUnregistered: 301, withdrawAgent: 115, withdrawAtm: 115 },
  { min: 10001, max: 15000, sendRegistered: 100, sendOtherNetworks: 100, sendUnregistered: 367, withdrawAgent: 167, withdrawAtm: 175 },
  { min: 15001, max: 20000, sendRegistered: 105, sendOtherNetworks: 105, sendUnregistered: 393, withdrawAgent: 185, withdrawAtm: 203 },
  { min: 20001, max: 35000, sendRegistered: 108, sendOtherNetworks: 108, sendUnregistered: 412, withdrawAgent: 197, withdrawAtm: 203 },
  { min: 3501, max: 50000, sendRegistered: 108, sendOtherNetworks: 108, sendUnregistered: 455, withdrawAgent: 278, withdrawAtm: null },
  { min: 50001, max: 250000, sendRegistered: 108, sendOtherNetworks: 108, sendUnregistered: null, withdrawAgent: 309, withdrawAtm: null },
];

export function getAgentWithdrawalFee(amount: number): number | null {
  if (amount < 50 || amount > 250000) return null;
  const band = MPESA_TARIFFS.find((b) => amount >= b.min && amount <= b.max);
  return band?.withdrawAgent ?? null;
}

export function getSendMoneyFee(amount: number, target: "registered" | "other" | "unregistered" = "registered"): number | null {
  if (amount < 1 || amount > 250000) return null;
  const band = MPESA_TARIFFS.find((b) => amount >= b.min && amount <= b.max);
  if (!band) return null;
  if (target === "registered") return band.sendRegistered;
  if (target === "other") return band.sendOtherNetworks;
  return band.sendUnregistered;
}

export function getAtmWithdrawalFee(amount: number): number | null {
  if (amount < 200 || amount > 35000) return null;
  const band = MPESA_TARIFFS.find((b) => amount >= b.min && amount <= b.max);
  return band?.withdrawAtm ?? null;
}

// "Tuma na ya kutoa" fixed-point calculation
export function calculateSendWithWithdrawal(desiredNetCash: number) {
  if (desiredNetCash < 50 || desiredNetCash > 249691) {
    return null;
  }

  // Iterate to find exact send amount S such that S - withdrawFee(S) == desiredNetCash
  let sendAmount = desiredNetCash;
  for (let iter = 0; iter < 4; iter++) {
    const wFee = getAgentWithdrawalFee(sendAmount);
    if (wFee === null) break;
    const net = sendAmount - wFee;
    if (net === desiredNetCash) break;
    sendAmount = desiredNetCash + wFee;
  }

  const finalWithdrawalFee = getAgentWithdrawalFee(sendAmount);
  if (finalWithdrawalFee === null) return null;

  const transferFee = getSendMoneyFee(sendAmount, "registered") ?? 0;
  const totalSenderCost = sendAmount + transferFee;

  return {
    desiredCash: desiredNetCash,
    sendAmount,
    withdrawalFee: finalWithdrawalFee,
    transferFee,
    totalSenderCost,
    actualNetCash: sendAmount - finalWithdrawalFee,
  };
}

const PRESET_AMOUNTS = [100, 500, 1000, 2000, 3000, 5000, 10000, 20000, 50000];

export default function MpesaCalculator() {
  const [amountStr, setAmountStr] = useState<string>("3000");
  const [calculatorMode, setCalculatorMode] = useState<"tuma_na_kutoa" | "standard">("tuma_na_kutoa");
  const [copied, setCopied] = useState(false);
  const [showTable, setShowTable] = useState(false);

  const amount = useMemo(() => {
    const cleaned = amountStr.replace(/[^0-9]/g, "");
    return cleaned ? parseInt(cleaned, 10) : 0;
  }, [amountStr]);

  // Calculations
  const tumaResult = useMemo(() => {
    if (amount < 50 || amount > 249000) return null;
    return calculateSendWithWithdrawal(amount);
  }, [amount]);

  const standardResult = useMemo(() => {
    if (amount < 1 || amount > 250000) return null;
    return {
      amount,
      sendRegistered: getSendMoneyFee(amount, "registered"),
      sendOther: getSendMoneyFee(amount, "other"),
      sendUnregistered: getSendMoneyFee(amount, "unregistered"),
      withdrawAgent: getAgentWithdrawalFee(amount),
      withdrawAtm: getAtmWithdrawalFee(amount),
    };
  }, [amount]);

  const formatKes = (num: number | null | undefined) => {
    if (num === null || num === undefined) return "—";
    return `KES ${num.toLocaleString()}`;
  };

  const getShareableText = () => {
    if (calculatorMode === "tuma_na_kutoa" && tumaResult) {
      return `M-Pesa Calculation for KES ${tumaResult.desiredCash.toLocaleString()} Cash:
• Please Send: KES ${tumaResult.sendAmount.toLocaleString()} (Includes KES ${tumaResult.withdrawalFee} Agent Withdrawal Fee)
• Sender Transfer Fee: KES ${tumaResult.transferFee}
• Total sender deduction: KES ${tumaResult.totalSenderCost.toLocaleString()}
• Calculated on CodeVanta Hub: https://www.codevanta.online/tools`;
    } else if (standardResult) {
      return `M-Pesa Charges for KES ${amount.toLocaleString()}:
• Send to Registered: ${formatKes(standardResult.sendRegistered)}
• Withdraw from Agent: ${formatKes(standardResult.withdrawAgent)}
• Withdraw from ATM: ${formatKes(standardResult.withdrawAtm)}
• Calculated on CodeVanta Hub: https://www.codevanta.online/tools`;
    }
    return "";
  };

  const handleCopy = () => {
    const text = getShareableText();
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsAppShare = () => {
    const text = getShareableText();
    if (!text) return;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, "_blank");
  };

  return (
    <div className="space-y-8">
      {/* Mode Switcher */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-2 bg-black/40 rounded-2xl border border-white/[0.08]">
        <div className="grid grid-cols-2 gap-2 w-full sm:w-auto">
          <button
            onClick={() => setCalculatorMode("tuma_na_kutoa")}
            className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              calculatorMode === "tuma_na_kutoa"
                ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-950/50"
                : "text-hub-text-secondary hover:text-white hover:bg-white/[0.04]"
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Tuma na ya Kutoa</span>
            <span className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] bg-emerald-900/80 rounded border border-emerald-400/40">
              Popular
            </span>
          </button>
          <button
            onClick={() => setCalculatorMode("standard")}
            className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              calculatorMode === "standard"
                ? "bg-gradient-to-r from-amber-400 to-yellow-500 text-black shadow-lg shadow-amber-950/50"
                : "text-hub-text-secondary hover:text-white hover:bg-white/[0.04]"
            }`}
          >
            <Banknote className="w-4 h-4" />
            <span>Standard Tariffs</span>
          </button>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-hub-text-muted px-2 font-mono">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Updated Safaricom 2024–2026 Rates</span>
        </div>
      </div>

      {/* Main Interactive Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Input Form */}
        <div className="lg:col-span-5 glass-panel rounded-3xl p-6 sm:p-7 space-y-6">
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-hub-gold font-bold mb-2">
              {calculatorMode === "tuma_na_kutoa"
                ? "Desired Cash in Recipient's Hand (KES)"
                : "Transaction Amount (KES)"}
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-hub-gold font-mono font-bold text-lg">
                KES
              </span>
              <input
                type="text"
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                placeholder="e.g. 3000"
                className="w-full pl-16 pr-4 py-3.5 bg-black/60 border border-white/10 rounded-2xl text-xl font-mono font-black text-white focus:outline-none focus:border-hub-gold focus:ring-1 focus:ring-hub-gold transition-all"
              />
            </div>
            <p className="text-[11px] text-hub-text-muted mt-2">
              {calculatorMode === "tuma_na_kutoa"
                ? "How much cash do you want the recipient to walk away with after visiting an agent?"
                : "Enter amount to check send, agent withdrawal, and ATM charges."}
            </p>
          </div>

          {/* Quick Amount Chips */}
          <div>
            <label className="block text-[11px] font-mono text-hub-text-secondary uppercase mb-2">
              Quick Presets
            </label>
            <div className="flex flex-wrap gap-2">
              {PRESET_AMOUNTS.map((preset) => (
                <button
                  key={preset}
                  onClick={() => setAmountStr(preset.toString())}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono font-semibold transition-all ${
                    amount === preset
                      ? "bg-hub-gold text-black shadow-md"
                      : "bg-white/[0.05] hover:bg-white/[0.1] text-hub-text-secondary hover:text-white border border-white/[0.08]"
                  }`}
                >
                  {preset.toLocaleString()}
                </button>
              ))}
            </div>
          </div>

          {/* Key M-Pesa Rules Info Box */}
          <div className="bg-emerald-950/30 border border-emerald-500/20 rounded-2xl p-4 text-xs space-y-2 text-slate-300">
            <div className="flex items-center gap-2 font-bold text-emerald-400 font-mono">
              <Info className="w-4 h-4 shrink-0" />
              <span>Official Limits &amp; Notes</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-[11px] text-hub-text-secondary">
              <li>Max single transaction: <strong className="text-white">KES 250,000</strong></li>
              <li>Daily account transfer limit: <strong className="text-white">KES 500,000</strong></li>
              <li>Max M-Pesa account balance: <strong className="text-white">KES 500,000</strong></li>
              <li>Transfers KES 1 – 100 to M-Pesa users are <strong className="text-emerald-400">FREE</strong>.</li>
            </ul>
          </div>
        </div>

        {/* Right: Results Display */}
        <div className="lg:col-span-7 space-y-6">
          {calculatorMode === "tuma_na_kutoa" ? (
            /* Tuma na ya Kutoa Mode Card */
            tumaResult ? (
              <div className="glass-panel rounded-3xl p-6 sm:p-8 space-y-6 border-emerald-500/30 relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

                {/* Main Hero Stat */}
                <div className="bg-gradient-to-br from-emerald-950/80 via-black/80 to-emerald-950/40 border border-emerald-500/40 rounded-2xl p-6 text-center space-y-2">
                  <span className="text-xs font-mono uppercase tracking-widest text-emerald-300 font-bold">
                    Amount You Must Send
                  </span>
                  <div className="text-4xl sm:text-5xl font-black font-mono text-emerald-400">
                    KES {tumaResult.sendAmount.toLocaleString()}
                  </div>
                  <p className="text-xs text-slate-300">
                    When recipient withdraws at an M-Pesa Agent, they get{" "}
                    <strong className="text-white">KES {tumaResult.actualNetCash.toLocaleString()}</strong> pure cash.
                  </p>
                </div>

                {/* Calculation Breakdown Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-black/50 border border-white/[0.08] rounded-xl p-4 space-y-1">
                    <span className="text-[11px] font-mono text-hub-text-muted uppercase">Net Cash Desired</span>
                    <p className="text-lg font-bold font-mono text-white">
                      KES {tumaResult.desiredCash.toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-black/50 border border-emerald-500/20 rounded-xl p-4 space-y-1">
                    <span className="text-[11px] font-mono text-emerald-400 uppercase">Agent Withdraw Fee</span>
                    <p className="text-lg font-bold font-mono text-emerald-300">
                      + KES {tumaResult.withdrawalFee.toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-black/50 border border-white/[0.08] rounded-xl p-4 space-y-1">
                    <span className="text-[11px] font-mono text-hub-text-muted uppercase">Sender Transfer Fee</span>
                    <p className="text-lg font-bold font-mono text-amber-300">
                      + KES {tumaResult.transferFee.toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Total Sender Deduction Banner */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.04] border border-white/[0.08]">
                  <div>
                    <h4 className="text-xs font-mono uppercase text-hub-text-secondary">Total Deducted from Sender</h4>
                    <p className="text-[11px] text-hub-text-muted">Send Amount + Transfer Fee</p>
                  </div>
                  <div className="text-xl sm:text-2xl font-black font-mono text-white">
                    KES {tumaResult.totalSenderCost.toLocaleString()}
                  </div>
                </div>

                {/* Action Buttons: WhatsApp Share & Copy */}
                <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                  <button
                    onClick={handleWhatsAppShare}
                    className="w-full sm:flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-lg"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>Share on WhatsApp</span>
                  </button>
                  <button
                    onClick={handleCopy}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 py-3 px-5 rounded-xl bg-white/[0.08] hover:bg-white/[0.15] text-white font-mono text-xs font-bold transition-all border border-white/10"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    <span>{copied ? "Copied!" : "Copy Breakdown"}</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="glass-panel rounded-3xl p-12 text-center text-hub-text-secondary space-y-3">
                <Banknote className="w-12 h-12 text-hub-gold/40 mx-auto" />
                <h3 className="text-lg font-bold text-white">Enter a valid amount</h3>
                <p className="text-xs text-hub-text-muted max-w-sm mx-auto">
                  Please enter an amount between KES 50 and KES 249,000 to calculate the exact withdrawal and transfer charges.
                </p>
              </div>
            )
          ) : (
            /* Standard Mode Display */
            standardResult ? (
              <div className="glass-panel rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
                <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
                  <div>
                    <h3 className="text-xl font-black text-white">
                      Charges for <span className="text-hub-gold font-mono">KES {amount.toLocaleString()}</span>
                    </h3>
                    <p className="text-xs text-hub-text-secondary mt-0.5">
                      Full fee breakdown across all transaction types
                    </p>
                  </div>
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.08] hover:bg-white/15 text-xs text-white transition-all"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? "Copied" : "Copy"}</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Send Registered */}
                  <div className="bg-black/40 border border-white/[0.08] rounded-2xl p-4 space-y-1">
                    <span className="text-[11px] font-mono text-hub-text-muted uppercase">Send to Registered M-Pesa</span>
                    <div className="text-2xl font-black font-mono text-emerald-400">
                      {formatKes(standardResult.sendRegistered)}
                    </div>
                    <p className="text-[10px] text-hub-text-muted">Safaricom to Safaricom user</p>
                  </div>

                  {/* Withdraw Agent */}
                  <div className="bg-black/40 border border-white/[0.08] rounded-2xl p-4 space-y-1">
                    <span className="text-[11px] font-mono text-hub-text-muted uppercase">Withdraw from Agent</span>
                    <div className="text-2xl font-black font-mono text-amber-400">
                      {formatKes(standardResult.withdrawAgent)}
                    </div>
                    <p className="text-[10px] text-hub-text-muted">Standard agent float withdrawal</p>
                  </div>

                  {/* Send Other Networks */}
                  <div className="bg-black/40 border border-white/[0.08] rounded-2xl p-4 space-y-1">
                    <span className="text-[11px] font-mono text-hub-text-muted uppercase">Send to Other Networks</span>
                    <div className="text-2xl font-black font-mono text-blue-400">
                      {formatKes(standardResult.sendOther)}
                    </div>
                    <p className="text-[10px] text-hub-text-muted">Airtel Money or Telkom</p>
                  </div>

                  {/* ATM Withdrawal */}
                  <div className="bg-black/40 border border-white/[0.08] rounded-2xl p-4 space-y-1">
                    <span className="text-[11px] font-mono text-hub-text-muted uppercase">ATM Withdrawal</span>
                    <div className="text-2xl font-black font-mono text-purple-400">
                      {formatKes(standardResult.withdrawAtm)}
                    </div>
                    <p className="text-[10px] text-hub-text-muted">Participating ATM partners</p>
                  </div>

                  {/* Send Unregistered */}
                  <div className="sm:col-span-2 bg-black/40 border border-white/[0.08] rounded-2xl p-4 space-y-1">
                    <span className="text-[11px] font-mono text-hub-text-muted uppercase">Send to Unregistered User</span>
                    <div className="text-2xl font-black font-mono text-rose-400">
                      {formatKes(standardResult.sendUnregistered)}
                    </div>
                    <p className="text-[10px] text-hub-text-muted">
                      Recipient redeems via one-time SMS voucher (Max KES 50,000)
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="glass-panel rounded-3xl p-12 text-center text-hub-text-secondary space-y-3">
                <Banknote className="w-12 h-12 text-hub-gold/40 mx-auto" />
                <h3 className="text-lg font-bold text-white">Enter an amount</h3>
                <p className="text-xs text-hub-text-muted max-w-sm mx-auto">
                  Enter an amount up to KES 250,000 to view the official fee schedule.
                </p>
              </div>
            )
          )}
        </div>
      </div>

      {/* Expandable Official Tariff Reference Table */}
      <div className="glass-panel rounded-3xl overflow-hidden shadow-xl border border-white/[0.08]">
        <button
          onClick={() => setShowTable(!showTable)}
          className="w-full flex items-center justify-between p-5 sm:p-6 text-left hover:bg-white/[0.02] transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-hub-gold">
              <Banknote className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">
                View Full 2024–2026 M-Pesa Tariffs Rate Sheet
              </h4>
              <p className="text-xs text-hub-text-muted">
                Official table with all 15 transaction tier brackets
              </p>
            </div>
          </div>
          <div className="p-2 rounded-xl bg-white/[0.05] text-hub-text-secondary">
            {showTable ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </button>

        {showTable && (
          <div className="p-5 sm:p-6 border-t border-white/[0.08] overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-white/10 text-hub-gold text-[11px] uppercase tracking-wider">
                  <th className="py-3 px-3">Range (KES)</th>
                  <th className="py-3 px-3">Send Registered</th>
                  <th className="py-3 px-3">Withdraw Agent</th>
                  <th className="py-3 px-3">Other Networks</th>
                  <th className="py-3 px-3">Unregistered</th>
                  <th className="py-3 px-3">ATM</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05] text-slate-300">
                {MPESA_TARIFFS.map((t, idx) => (
                  <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-2.5 px-3 text-white font-bold">
                      {t.min.toLocaleString()} – {t.max.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-emerald-400 font-bold">
                      {t.sendRegistered === 0 ? "FREE" : `KES ${t.sendRegistered}`}
                    </td>
                    <td className="py-2.5 px-3 text-amber-300">
                      {t.withdrawAgent !== null ? `KES ${t.withdrawAgent}` : "—"}
                    </td>
                    <td className="py-2.5 px-3 text-blue-300">
                      {t.sendOtherNetworks === 0 ? "FREE" : `KES ${t.sendOtherNetworks}`}
                    </td>
                    <td className="py-2.5 px-3 text-rose-300">
                      {t.sendUnregistered !== null ? `KES ${t.sendUnregistered}` : "—"}
                    </td>
                    <td className="py-2.5 px-3 text-purple-300">
                      {t.withdrawAtm !== null ? `KES ${t.withdrawAtm}` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

