"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
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
    <div className="min-h-screen bg-[#F7F4EE] text-black font-sans selection:bg-[#CCFF00] selection:text-black">
      {/* Draft Warning Banner */}
      {isDraft && (
        <div className="sticky top-0 z-50 bg-[#FF5500] text-white px-4 py-2 font-mono text-xs font-black uppercase text-center flex items-center justify-center gap-2 border-b-2 border-black shadow-md">
          <Sparkles size={14} />
          <span>ADMIN PREVIEW MODE — This custom page is currently in DRAFT status and invisible to regular users.</span>
          <Link href="/admin" className="underline hover:opacity-80 ml-2">
            Edit in CMS &rarr;
          </Link>
        </div>
      )}

      <PreLoginNav />

      <main className="pt-24 pb-20 px-6 max-w-5xl mx-auto space-y-12">
        {/* Top Header / Hero */}
        <section className="text-center space-y-4 pt-8">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3.5 py-1 font-mono text-xs font-black uppercase border-2 border-black bg-[#CCFF00] text-black shadow-[2px_2px_0px_#000000]"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{page.title}</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-black uppercase tracking-tight text-black leading-[1.1]"
          >
            {page.heroTitle || page.title}
          </motion.h1>

          {page.heroSubtitle && (
            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="font-mono text-xs sm:text-sm text-neutral-700 max-w-2xl mx-auto leading-relaxed"
            >
              {page.heroSubtitle}
            </motion.p>
          )}
        </section>

        {/* Dynamic Blocks Rendering */}
        <div className="space-y-10">
          {page.blocks && page.blocks.length > 0 ? (
            page.blocks.map((block, idx) => {
              switch (block.type) {
                case "hero":
                  return (
                    <div
                      key={block.id || idx}
                      className="p-8 sm:p-12 border-4 border-black bg-[#CCFF00] text-black text-center space-y-4 shadow-[6px_6px_0px_#000000]"
                    >
                      {block.title && <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight">{block.title}</h2>}
                      {block.subtitle && <p className="font-mono text-xs sm:text-sm text-neutral-800 max-w-xl mx-auto">{block.subtitle}</p>}
                      {block.ctaText && block.ctaLink && (
                        <div className="pt-2">
                          <Link
                            href={block.ctaLink}
                            className="inline-flex items-center gap-2 px-6 py-3 border-2 border-black bg-black text-[#CCFF00] hover:bg-white hover:text-black font-mono text-xs font-black uppercase transition-all shadow-[3px_3px_0px_#000000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
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
                      className="p-6 sm:p-10 border-4 border-black bg-white shadow-[6px_6px_0px_#000000] prose prose-neutral max-w-none prose-headings:font-black prose-headings:uppercase prose-a:font-bold prose-a:underline"
                    >
                      {block.title && <h3 className="text-2xl font-black uppercase tracking-tight mb-4">{block.title}</h3>}
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
                          <h3 className="text-2xl font-black uppercase tracking-tight text-black">{block.title}</h3>
                          {block.subtitle && <p className="font-mono text-xs text-neutral-600">{block.subtitle}</p>}
                        </div>
                      )}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {(block.features || []).map((feat, fIdx) => (
                          <div
                            key={fIdx}
                            className="p-6 border-3 border-black bg-white shadow-[4px_4px_0px_#000000] space-y-3"
                          >
                            <div className="flex items-center justify-between">
                              <span className="w-8 h-8 border-2 border-black bg-[#CCFF00] text-black flex items-center justify-center font-mono font-black text-xs shadow-[1px_1px_0px_#000000]">
                                0{fIdx + 1}
                              </span>
                              {feat.tag && (
                                <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 border border-black bg-neutral-100 text-black">
                                  {feat.tag}
                                </span>
                              )}
                            </div>
                            <h4 className="font-black uppercase text-base text-black">{feat.title}</h4>
                            <p className="font-mono text-xs text-neutral-600 leading-relaxed">{feat.desc}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  );

                case "image":
                  return (
                    <div key={block.id || idx} className="space-y-2 text-center">
                      {block.imageUrl && (
                        <div className="border-4 border-black bg-white overflow-hidden shadow-[6px_6px_0px_#000000] max-h-[480px] relative">
                          <Image
                            src={block.imageUrl}
                            alt={block.title || "Showcase image"}
                            width={1200}
                            height={700}
                            unoptimized
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      {block.imageCaption && (
                        <p className="font-mono text-xs text-neutral-600 italic">{block.imageCaption}</p>
                      )}
                    </div>
                  );

                case "cta":
                  return (
                    <div
                      key={block.id || idx}
                      className="p-8 sm:p-12 border-4 border-black bg-black text-white text-center space-y-4 shadow-[6px_6px_0px_#000000]"
                    >
                      <h3 className="text-2xl sm:text-3xl font-black uppercase text-[#CCFF00] tracking-tight">{block.title || "Ready to Get Started?"}</h3>
                      <p className="font-mono text-xs sm:text-sm text-neutral-300 max-w-lg mx-auto">{block.subtitle || block.content}</p>
                      {block.ctaText && block.ctaLink && (
                        <div className="pt-2">
                          <Link
                            href={block.ctaLink}
                            className="inline-flex items-center gap-2 px-7 py-3.5 border-2 border-black bg-[#CCFF00] hover:bg-white text-black font-mono text-xs font-black uppercase shadow-[3px_3px_0px_#000000] transition-all cursor-pointer active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
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
                        <h3 className="text-2xl font-black uppercase tracking-tight text-black">{block.title || "Frequently Asked Questions"}</h3>
                        {block.subtitle && <p className="font-mono text-xs text-neutral-600">{block.subtitle}</p>}
                      </div>
                      <div className="space-y-3">
                        {(block.faqs || []).map((faq, fIdx) => {
                          const isOpen = openFaqIndices.has(fIdx);
                          return (
                            <div
                              key={fIdx}
                              className="border-2 border-black bg-white overflow-hidden shadow-[3px_3px_0px_#000000]"
                            >
                              <button
                                onClick={() => toggleFaq(fIdx)}
                                className="w-full p-4 text-left flex items-center justify-between font-mono text-xs font-bold uppercase text-black hover:bg-neutral-50 transition-colors"
                              >
                                <span>{faq.question}</span>
                                <ChevronDown
                                  size={16}
                                  className={`text-black transition-transform ${isOpen ? "rotate-180" : ""}`}
                                />
                              </button>
                              {isOpen && (
                                <div className="px-4 pb-4 font-mono text-xs text-neutral-700 border-t-2 border-black pt-3 leading-relaxed bg-neutral-50">
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
            <div className="p-12 border-4 border-black bg-white shadow-[6px_6px_0px_#000000] text-center font-mono text-xs text-neutral-500 uppercase">
              This page has no content blocks yet. Add blocks from the Admin Page Builder.
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t-2 border-black py-8 px-6 text-center font-mono text-xs text-neutral-600">
        <p>© 2026 PRO ALUMN. All rights reserved.</p>
      </footer>
    </div>
  );
}
