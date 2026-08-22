"use client";

import { motion } from "framer-motion";
import { Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import { SplitText, FadeUp } from "@/components/ui/SplitText";

export function CTASection() {
  const router = useRouter();

  return (
    <section className="py-16 sm:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeUp>
          <div className="relative rounded-[28px] bg-editorial-ink p-10 sm:p-16 text-center overflow-hidden">
            {/* Background pattern */}
            <div className="absolute inset-0 bg-[linear-gradient(45deg,#00FF8408_1px,transparent_1px),linear-gradient(-45deg,#00FF8408_1px,transparent_1px)] bg-[size:20px_20px]" />
            <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full bg-editorial-green/10 blur-[120px]" />

            <div className="relative z-10">
              <SplitText
                as="h2"
                className="font-outfit text-3xl sm:text-5xl font-extrabold text-white max-w-2xl mx-auto"
                delay={0.1}
              >
                Start your journey today
              </SplitText>
              <FadeUp delay={0.4}>
                <p className="mt-4 text-lg text-white/50 max-w-lg mx-auto">
                  Join 1,200+ alumni and students building meaningful careers through verified connections.
                </p>
              </FadeUp>
              <FadeUp delay={0.6}>
                <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => router.push("/register")}
                    className="inline-flex items-center gap-2 rounded-pill bg-editorial-green px-8 py-4 text-sm font-bold text-editorial-ink shadow-[0_4px_24px_rgba(0,255,132,0.3)] hover:shadow-[0_8px_40px_rgba(0,255,132,0.4)] transition-shadow"
                  >
                    Create Free Account
                    <Zap className="size-4" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => router.push("/education")}
                    className="inline-flex items-center gap-2 rounded-pill border-2 border-white/20 px-8 py-4 text-sm font-bold text-white hover:bg-white/5 transition-colors"
                  >
                    Explore Courses
                  </motion.button>
                </div>
              </FadeUp>
            </div>
          </div>
        </FadeUp>
      </div>
    </section>
  );
}