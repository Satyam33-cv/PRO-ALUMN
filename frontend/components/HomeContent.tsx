"use client";

import Link from "next/link";
import Image from "next/image";
import { memo } from "react";
import { motion } from "framer-motion";
import { BackgroundPattern } from "@/components/ui/Layout/BackgroundPattern";
import { ScrollReveal } from "@/components/ui/Layout/ScrollReveal";
import {
  BriefcaseBusiness,
  GraduationCap,
  Heart,
  User,
  Calendar,
  Megaphone,
  ArrowRight,
  Clock,
  Users,
  Briefcase,
  Send,
  Sparkles,
  Target,
  TrendingUp,
  Award,
  Pin,
} from "lucide-react";
import { useAuth } from "@/lib/context/AuthContext";
import { apiClient } from "@/lib/api/client";
import { useApi } from "@/lib/hooks/useApi";
import {
  staggerContainer,
} from "@/lib/motion";
import { Card } from "@/components/ui";
import { AnnouncementBody } from "@/components/AnnouncementBody";

type QuickAction = {
  label: string;
  description: string;
  href: string;
  icon: typeof BriefcaseBusiness;
};

const quickActions: QuickAction[] = [
  {
    label: "Jobs",
    description: "Browse opportunities from your network",
    href: "/jobs",
    icon: BriefcaseBusiness,
  },
  {
    label: "Mentorship",
    description: "Connect with experienced alumni",
    href: "/mentorship",
    icon: GraduationCap,
  },
  {
    label: "Giving",
    description: "Support the next generation",
    href: "/giving",
    icon: Heart,
  },
  {
    label: "Profile",
    description: "Update your information",
    href: "/profile",
    icon: User,
  },
];

const recentActivity = [
  {
    icon: Briefcase,
    text: "Priya Raman posted a new job at Northstar Labs",
    time: "2h ago",
  },
  {
    icon: GraduationCap,
    text: "Your mentorship request was accepted by Marcus Chen",
    time: "5h ago",
  },
  {
    icon: Calendar,
    text: "142 alumni registered for Designing your first five years",
    time: "1d ago",
  },
  {
    icon: Send,
    text: "Nina Okafor endorsed you for TypeScript",
    time: "2d ago",
  },
];

const heroStats = [
  { value: "2.4k+", label: "Active Alumni", icon: Users },
  { value: "340+", label: "Companies", icon: BriefcaseBusiness },
  { value: "180+", label: "Mentors", icon: GraduationCap },
  { value: "92%", label: "Match Rate", icon: Target },
];



export const HomeContent = memo(function HomeContent() {
  const { user } = useAuth();
  
  const { data: eventsData } = useApi("home:events", () => apiClient.events.list());
  const { data: alumniData } = useApi("home:alumni", () => apiClient.alumni.list(undefined, { filter: "role", value: "ALUMNI" }));
  const { data: announcementsData } = useApi("home:announcements", () => apiClient.announcements.list());
  const { data: topAlumniData } = useApi("home:top-alumni", () => apiClient.matching.topAlumni(), { enabled: user?.role === "student" });

  const events = eventsData || [];
  const announcements = announcementsData || [];
  
  // If user is student and we have top alumni matches, use those; otherwise use generic alumni list
  const recommendedAlumni = user?.role === "student" && topAlumniData?.alumni 
    ? topAlumniData.alumni 
    : (alumniData || []);

  if (!user) return null;
  const firstName = user.name.split(" ")[0];

  function getDaysUntilNextEvent(): { days: number; title: string } | null {
    const now = new Date();
    const futureEvents = events
      .filter((e) => e.startsAt && new Date(e.startsAt) > now)
      .sort(
        (a, b) =>
          new Date(a.startsAt!).getTime() - new Date(b.startsAt!).getTime()
      );
    if (futureEvents.length === 0) return null;
    const next = futureEvents[0];
    const diff = Math.ceil(
      (new Date(next.startsAt!).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    return { days: diff, title: next.title };
  }

  const upcomingEvent = getDaysUntilNextEvent();

  return (
    <>

      {/* Main Content Sections */}
      <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <BackgroundPattern color="blue" speed={30} className="absolute -top-20 left-0 right-0 h-40 opacity-20 pointer-events-none" />
        
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="space-y-14 relative"
        >
          {/* Quick Actions */}
          <ScrollReveal direction="up" className="mt-8">
            <div className="mb-5 flex items-baseline justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple/10 text-purple">
                  <Sparkles size={20} />
                </div>
                <h2 className="font-heading text-3xl">Quick Actions</h2>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {quickActions.map((action) => (
                <ScrollReveal key={action.label} delay={0.1} direction="up" className="min-h-[180px]">
                  <Card
                    padding="md"
                    className="flex flex-col h-full group relative overflow-hidden border-border hover:border-purple/30 hover:shadow-cardHover transition-all duration-300"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-purple/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="relative flex items-center gap-3 pb-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple/10 text-purple group-hover:bg-purple group-hover:text-canvas transition-all duration-300">
                        <action.icon size={22} />
                      </div>
                      <div>
                        <p className="font-medium text-sm text-ink">{action.label}</p>
                        <p className="text-xs text-ink/50">{action.description}</p>
                      </div>
                    </div>
                    <div className="relative mt-auto">
                      <Link
                        href={action.href}
                        className="relative inline-flex items-center gap-2 rounded-full bg-purple px-4 py-2 text-sm font-medium text-canvas transition-all duration-300 hover:bg-ink hover:shadow-[0_4px_20px_rgba(99,102,241,0.4)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple focus-visible:ring-offset-2"
                      >
                        Go to {action.label}
                        <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                      </Link>
                    </div>
                  </Card>
                </ScrollReveal>
              ))}
            </div>
          </ScrollReveal>

          {/* Recommended Alumni */}
          <ScrollReveal direction="up" className="mt-8">
            <div className="mb-5 flex items-baseline justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple/10 text-purple">
                  <Users size={20} />
                </div>
                <h2 className="font-heading text-3xl">Recommended Alumni</h2>
              </div>
              <Link
                href="/directory"
                className="text-xs font-semibold text-purple underline underline-offset-4 hover:text-ink transition-colors"
              >
                View all
                <ArrowRight size={12} className="inline ml-1" />
              </Link>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {recommendedAlumni.slice(0, 6).map((alumni) => (
                <ScrollReveal key={alumni.id} delay={0.05} direction="up">
                  <Card
                    padding="md"
                    className="flex flex-col group relative overflow-hidden border-border hover:border-purple/30 hover:shadow-cardHover transition-all duration-300"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-purple/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="relative flex items-center gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-purple/10 text-purple text-base font-semibold group-hover:bg-purple group-hover:text-canvas transition-all duration-300">
                        {alumni.avatarUrl ? (
                          <Image src={alumni.avatarUrl} alt={alumni.name} width={48} height={48} unoptimized className="h-full w-full rounded-xl object-cover" />
                        ) : alumni.initials || alumni.name.split(" ").map((n: string) => n[0]).join("")}
                      </div>
                      <div>
                        <h3 className="font-heading text-xl">{alumni.name}</h3>
                        <p className="font-mono text-[10px] uppercase tracking-wider text-ink/45">
                          Class of {alumni.batchYear || alumni.batch}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 border-t border-border pt-4">
                      <p className="text-sm font-medium">{alumni.jobTitle || alumni.role} <span className="text-ink/35">at</span> {alumni.currentCompany || alumni.company}</p>
                      <p className="mt-1 flex items-center gap-1 text-xs text-ink/50">
                        <Clock size={12} /> {alumni.location || "Remote"}
                      </p>
                    </div>
                    <Link
                      href={`/directory/${alumni.id}`}
                      className="relative mt-4 inline-flex items-center gap-1 text-xs font-semibold text-purple transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple group-hover:text-ink"
                    >
                      View profile
                      <ArrowRight size={13} className="transition-transform group-hover:translate-x-1" />
                    </Link>
                  </Card>
                </ScrollReveal>
              ))}
            </div>
          </ScrollReveal>

          {/* Recent Activity */}
          <ScrollReveal direction="up" className="mt-8">
            <div className="mb-5 flex items-baseline justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue/10 text-blue">
                  <TrendingUp size={20} />
                </div>
                <h2 className="font-heading text-3xl">Recent Activity</h2>
              </div>
              <Link
                href="/notifications"
                className="text-xs font-semibold text-purple underline underline-offset-4 hover:text-ink transition-colors"
              >
                View all
                <ArrowRight size={12} className="inline ml-1" />
              </Link>
            </div>
            <Card className="overflow-hidden border-border">
              <div className="divide-y divide-border">
                {recentActivity.map((activity) => (
                  <div
                    key={activity.text}
                    className="relative flex items-center gap-4 py-5 px-6 hover:bg-purple/5 transition-colors group"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple/10 text-purple group-hover:bg-purple group-hover:text-canvas transition-all duration-300">
                      <activity.icon size={18} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-ink">{activity.text}</p>
                      <p className="mt-1 text-xs text-ink/50">{activity.time}</p>
                    </div>
                    <ArrowRight size={16} className="text-ink/30 group-hover:text-purple group-hover:translate-x-1 transition-all duration-300" />
                  </div>
                ))}
              </div>
            </Card>
          </ScrollReveal>

          {/* Announcements */}
          <ScrollReveal direction="up" className="mt-8">
            <div className="mb-5 flex items-baseline justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple/10 text-purple">
                  <Megaphone size={20} />
                </div>
                <h2 className="font-heading text-3xl">Announcements</h2>
              </div>
              <Link
                href="/announcements"
                className="text-xs font-semibold text-purple underline underline-offset-4 hover:text-ink transition-colors"
              >
                View all
                <ArrowRight size={12} className="inline ml-1" />
              </Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {[...announcements]
                .sort((a, b) => {
                  if (Boolean(a.pinned) !== Boolean(b.pinned)) return a.pinned ? -1 : 1;
                  return 0;
                })
                .slice(0, 2)
                .map((ann) => (
                <ScrollReveal key={ann.id} delay={0.05} direction="up">
                  <Card
                    padding="md"
                    className={`group relative overflow-hidden transition-all duration-300 ${
                      ann.pinned
                        ? "border-purple/40 ring-1 ring-purple/20 bg-linear-to-br from-purple/5 to-transparent hover:border-purple hover:shadow-cardHover"
                        : "border-border hover:border-purple/30 hover:shadow-cardHover"
                    }`}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-purple/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="relative flex items-start gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-purple/10 text-purple group-hover:bg-purple group-hover:text-canvas transition-all duration-300">
                        <Megaphone size={14} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="font-heading text-lg">{ann.title}</h3>
                          {ann.pinned && (
                            <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400 shrink-0">
                              <Pin size={10} className="fill-amber-500 rotate-45" />
                              Pinned
                            </span>
                          )}
                        </div>
                        <AnnouncementBody
                          content={ann.content || ann.body}
                          truncate
                          className="mt-2 text-xs"
                        />
                        <div className="mt-3 flex items-center gap-2">
                          <span className="text-[11px] font-medium text-ink/70">
                            {ann.author?.name || ann.author}
                          </span>
                          <span className="text-[10px] text-ink/35">·</span>
                          <span className="font-mono text-[10px] text-ink/40">
                            {ann.createdAt ? new Date(ann.createdAt).toLocaleDateString() : ann.date}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Card>
                </ScrollReveal>
              ))}
            </div>
          </ScrollReveal>

          {/* Feature Highlights */}
          <ScrollReveal direction="up" className="mt-16">
            <div className="mb-5 flex items-baseline justify-center text-center">
              <div className="flex items-center gap-3 justify-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple/10 text-purple">
                  <Award size={20} />
                </div>
                <h2 className="font-heading text-3xl">Why Alumni Choose PRO ALUMN</h2>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  icon: Target,
                  title: "Smart Matching",
                  desc: "AI-powered recommendations connect you with the right alumni based on your goals, industry, and interests.",
                },
                {
                  icon: Users,
                  title: "Global Network",
                  desc: "Access 2,400+ alumni across 340+ companies worldwide — from startups to Fortune 500.",
                },
                {
                  icon: TrendingUp,
                  title: "Career Growth",
                  desc: "92% match rate for mentorship pairs. Real outcomes: promotions, career pivots, and funding raised.",
                },
              ].map((feature, index) => (
                <ScrollReveal key={feature.title} delay={0.1 + index * 0.1} direction="up">
                  <Card
                    padding="lg"
                    className="relative overflow-hidden border-border hover:border-purple/30 hover:shadow-cardHover transition-all duration-500 group"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-purple/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="relative flex flex-col items-center text-center h-full">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-purple/10 text-purple group-hover:bg-purple group-hover:text-canvas transition-all duration-300">
                        <feature.icon size={26} />
                      </div>
                      <h3 className="mt-5 font-heading text-xl font-semibold text-ink">
                        {feature.title}
                      </h3>
                      <p className="mt-3 text-sm text-ink/60 leading-relaxed">
                        {feature.desc}
                      </p>
                    </div>
                  </Card>
                </ScrollReveal>
              ))}
            </div>
          </ScrollReveal>
        </motion.div>
      </div>
    </>
  );
});