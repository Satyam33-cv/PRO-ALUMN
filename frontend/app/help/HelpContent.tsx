"use client";

import React, { useState, useEffect } from "react";
import { RoleShell } from "@/components/RoleShell";
import { FiLifeBuoy, FiSend, FiCheckCircle, FiAlertCircle } from "react-icons/fi";
import { HelpCircle, AlertTriangle, Lightbulb, Settings, Briefcase } from "lucide-react";

export function HelpContent({ userSession }: { userSession: any }) {
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("Account Issue");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const categories = [
    { name: "Account Issue", icon: <Settings className="w-4 h-4" /> },
    { name: "Mentorship", icon: <Briefcase className="w-4 h-4" /> },
    { name: "Bug Report", icon: <AlertTriangle className="w-4 h-4" /> },
    { name: "Feature Request", icon: <Lightbulb className="w-4 h-4" /> },
    { name: "Other", icon: <HelpCircle className="w-4 h-4" /> },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/support`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userSession.token || ""}`, // Assuming token might be passed or rely on cookies if not
        },
        body: JSON.stringify({ subject, category, message }),
      });

      if (!res.ok) {
        throw new Error("Failed to submit ticket");
      }

      setSuccess(true);
      setSubject("");
      setMessage("");
      setCategory("Account Issue");
      
      setTimeout(() => setSuccess(false), 5000);
    } catch (err: any) {
      setErrorMsg(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <RoleShell userRole={userSession.role}>
      <div className="max-w-4xl mx-auto py-12 px-6">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center p-3 bg-blue-500/10 rounded-2xl mb-4">
            <FiLifeBuoy className="w-8 h-8 text-blue-400" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4 tracking-tight">How can we help?</h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Our support team is here to assist you with any issues, feature requests, or questions about the PRO ALUMN platform.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-1 space-y-4">
            <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Support Categories</h3>
              <div className="space-y-2">
                {categories.map((cat) => (
                  <button
                    key={cat.name}
                    type="button"
                    onClick={() => setCategory(cat.name)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                      category === cat.name
                        ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                        : "text-slate-300 hover:bg-slate-700/50 border border-transparent"
                    }`}
                  >
                    {cat.icon}
                    <span className="font-medium">{cat.name}</span>
                  </button>
                ))}
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-2xl p-6">
              <h3 className="text-indigo-400 font-semibold mb-2">Did you know?</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                You can also ask our community in the Global Search or check out the Education Centre for platform tutorials!
              </p>
            </div>
          </div>

          <div className="md:col-span-2">
            <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 relative overflow-hidden">
              
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              
              <h2 className="text-2xl font-bold text-white mb-6">Submit a Ticket</h2>
              
              {success ? (
                <div className="flex flex-col items-center justify-center py-12 text-center animate-in fade-in zoom-in duration-500">
                  <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-6">
                    <FiCheckCircle className="w-10 h-10 text-green-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">Ticket Submitted!</h3>
                  <p className="text-slate-400 max-w-md">
                    We've received your request and sent a confirmation email. Our team will get back to you shortly.
                  </p>
                  <button 
                    onClick={() => setSuccess(false)}
                    className="mt-8 px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                  >
                    Submit another ticket
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
                  
                  {errorMsg && (
                    <div className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400">
                      <FiAlertCircle className="w-5 h-5 shrink-0" />
                      <p className="text-sm font-medium">{errorMsg}</p>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Subject</label>
                    <input
                      type="text"
                      required
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="Brief summary of your request"
                      className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Category</label>
                    <div className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-slate-300">
                      {category}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Message</label>
                    <textarea
                      required
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Please provide as much detail as possible..."
                      rows={6}
                      className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all resize-none"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={loading || !subject || !message}
                      className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-400 text-white font-medium rounded-xl transition-all"
                    >
                      {loading ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <FiSend className="w-4 h-4" />
                          <span>Submit Ticket</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </RoleShell>
  );
}
