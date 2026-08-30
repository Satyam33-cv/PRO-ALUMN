"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import { motion } from "framer-motion";
import {
  Sparkles,
  ArrowRight,
  ChevronDown,
  Layers,
  ShieldAlert,
  ArrowLeft,
} from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { PreLoginNav } from "@/components/PreLoginNav";

interface PageBlock {
  id: string;
  type: "hero" | "markdown" | "features" | "image" | "cta" | "faq";
  title?: string;
  subtitle?: string;
  content?: string;
  imageUrl?: string;
  imageCaption?: string;
  ctaText?: string;
  ctaLink?: string;
  features?: Array<{ title: string; desc: string; tag?: string }>;
  faqs?: Array<{ question: string; answer: string }>;
  settings?: {
    align?: "left" | "center";
    bgStyle?: "default" | "subtle" | "glow";
  };
}

interface SitePageData {
  id: string;
  title: string;
  slug: string;
  description?: string;
  heroTitle?: string;
  heroSubtitle?: string;
  blocks: PageBlock[];
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export default function DynamicCustomPage() {
  const params = useParams();
  const slug = params?.slug as string;

  const [page, setPage] = useState<SitePageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openFaqIndices, setOpenFaqIndices] = useState<Set<number>>(new Set([0]));

  useEffect(() => {
    if (!slug) return;
    let isMounted = true;

    async function fetchPage() {
      setLoading(true);
      setError(null);
      try {
        const res = await apiClient.pages.getBySlug(slug);
        if (isMounted) {
          if (res?.page) {
            setPage(res.page as unknown as SitePageData);
          } else {
            setError("Page not found");
          }
        }
      } catch (err: unknown) {
        if (isMounted) {
          const message = err instanceof Error ? err.message : "Page not found";
          setError(message);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchPage();
    return () => {
      isMounted = false;
    };
  }, [slug]);

  const toggleFaq = (index: number) => {
    setOpenFaqIndices((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-center items-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 dark:border-slate-700 border-t-blue-600 mb-4" />
        <p className="text-xs font-mono text-slate-500 uppercase tracking-widest">Loading page content...</p>
      </div>
    );
  }

  if (error || !page) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-center items-center px-6">
        <div className="max-w-md w-full p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 mx-auto flex items-center justify-center">
            <ShieldAlert size={24} />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight font-sans">404 - Page Not Found</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            The page <code className="font-mono text-xs bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-blue-600">/{slug}</code> does not exist or has not been published yet.
          </p>
          <div className="pt-2">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
            >
              <ArrowLeft size={14} /> Back to Homepage
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isDraft = page.status === "DRAFT";

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-blue-600 selection:text-white">
      {/* Draft Warning Banner */}
      {isDraft && (
        <div className="sticky top-0 z-50 bg-amber-500 text-slate-950 px-4 py-2 text-xs font-bold text-center flex items-center justify-center gap-2 shadow-md">
          <Sparkles size={14} />
          <span>ADMIN PREVIEW MODE — This custom page is currently in DRAFT status and invisible to regular users.</span>
          <Link href="/admin" className="underline hover:opacity-80 ml-2">
            Edit in CMS &rarr;
          </Link>
        </div>
      )}

      <PreLoginNav />

      <main className="pt-24 pb-20 px-6 max-w-5xl mx-auto space-y-16">
        {/* Top Header / Hero */}
        <section className="text-center space-y-5 pt-8 relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] rounded-full bg-blue-500/10 blur-[120px] pointer-events-none" />

          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3.5 py-1 text-xs font-semibold rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{page.title}</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-[1.15]"
          >
            {page.heroTitle || page.title}
          </motion.h1>

          {page.heroSubtitle && (
            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-base sm:text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed"
            >
              {page.heroSubtitle}
            </motion.p>
          )}
        </section>

        {/* Dynamic Blocks Rendering */}
        <div className="space-y-12">
          {page.blocks && page.blocks.length > 0 ? (
            page.blocks.map((block, idx) => {
              switch (block.type) {
                case "hero":
                  return (
                    <div
                      key={block.id || idx}
                      className="p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white text-center space-y-4 shadow-xl relative overflow-hidden"
                    >
                      {block.title && <h2 className="text-3xl font-extrabold">{block.title}</h2>}
                      {block.subtitle && <p className="text-blue-100 max-w-xl mx-auto text-sm sm:text-base">{block.subtitle}</p>}
                      {block.ctaText && block.ctaLink && (
                        <div className="pt-2">
                          <Link
                            href={block.ctaLink}
                            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-blue-700 font-bold text-xs hover:bg-blue-50 transition-all shadow-md"
                          >
                            <span>{block.ctaText}</span>
                            <ArrowRight size={14} />
                          </Link>
                        </div>
                      )}
                    </div>
                  );

                case "markdown":
                  return (
                    <div
                      key={block.id || idx}
                      className="p-6 sm:p-10 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs prose prose-slate dark:prose-invert max-w-none prose-headings:font-bold prose-a:text-blue-600"
                    >
                      {block.title && <h3 className="text-2xl font-bold mb-4">{block.title}</h3>}
                      <ReactMarkdown rehypePlugins={[rehypeRaw, rehypeSanitize]}>
                        {block.content || ""}
                      </ReactMarkdown>
                    </div>
                  );

                case "features":
                  return (
                    <div key={block.id || idx} className="space-y-6">
                      {block.title && (
                        <div className="text-center space-y-1">
                          <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{block.title}</h3>
                          {block.subtitle && <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">{block.subtitle}</p>}
                        </div>
                      )}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {(block.features || []).map((feat, fIdx) => (
                          <div
                            key={fIdx}
                            className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2 hover:border-blue-500/50 transition-all"
                          >
                            <div className="flex items-center justify-between">
                              <span className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs">
                                0{fIdx + 1}
                              </span>
                              {feat.tag && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                  {feat.tag}
                                </span>
                              )}
                            </div>
                            <h4 className="font-bold text-base text-slate-900 dark:text-slate-100">{feat.title}</h4>
                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{feat.desc}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  );

                case "image":
                  return (
                    <div key={block.id || idx} className="space-y-2 text-center">
                      {block.imageUrl && (
                        <div className="rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-lg max-h-[480px]">
                          <img
                            src={block.imageUrl}
                            alt={block.title || "Showcase image"}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      {block.imageCaption && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 italic">{block.imageCaption}</p>
                      )}
                    </div>
                  );

                case "cta":
                  return (
                    <div
                      key={block.id || idx}
                      className="p-8 sm:p-12 rounded-3xl bg-slate-900 dark:bg-slate-900 text-white text-center space-y-4 border border-blue-900/40 shadow-2xl relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
                      <h3 className="text-2xl sm:text-3xl font-extrabold relative z-10">{block.title || "Ready to Get Started?"}</h3>
                      <p className="text-sm text-slate-300 max-w-lg mx-auto relative z-10">{block.subtitle || block.content}</p>
                      {block.ctaText && block.ctaLink && (
                        <div className="pt-2 relative z-10">
                          <Link
                            href={block.ctaLink}
                            className="inline-flex items-center gap-2 px-7 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
                          >
                            <span>{block.ctaText}</span>
                            <ArrowRight size={14} />
                          </Link>
                        </div>
                      )}
                    </div>
                  );

                case "faq":
                  return (
                    <div key={block.id || idx} className="space-y-4 max-w-3xl mx-auto">
                      <div className="text-center space-y-1 mb-6">
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{block.title || "Frequently Asked Questions"}</h3>
                        {block.subtitle && <p className="text-xs text-slate-500">{block.subtitle}</p>}
                      </div>
                      <div className="space-y-3">
                        {(block.faqs || []).map((faq, fIdx) => {
                          const isOpen = openFaqIndices.has(fIdx);
                          return (
                            <div
                              key={fIdx}
                              className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs"
                            >
                              <button
                                onClick={() => toggleFaq(fIdx)}
                                className="w-full p-4 text-left flex items-center justify-between text-sm font-bold text-slate-900 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                              >
                                <span>{faq.question}</span>
                                <ChevronDown
                                  size={16}
                                  className={`text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
                                />
                              </button>
                              {isOpen && (
                                <div className="px-4 pb-4 text-xs text-slate-600 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800/80 pt-3 leading-relaxed">
                                  {faq.answer}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );

                default:
                  return null;
              }
            })
          ) : (
            <div className="p-12 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center text-slate-400 text-xs">
              This page has no content blocks yet. Add blocks from the Admin Page Builder.
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 py-8 px-6 text-center text-xs text-slate-500">
        <p>© 2026 PRO ALUMN. All rights reserved.</p>
      </footer>
    </div>
  );
}
