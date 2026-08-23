import type { Metadata } from "next";
import { RewardsContent } from "@/components/RewardsContent";

export const metadata: Metadata = {
  title: "Rewards & Streaks | PRO ALUMN",
  description: "Track your active streaks, unlock badges, earn contribution points, and view the community leaderboard.",
};

export default function RewardsPage() {
  return <RewardsContent />;
}
