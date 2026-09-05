"use client";

import React from "react";
import { AdaptiveShell } from "@/components/AdaptiveShell";
import { AnnouncementsContent } from "@/components/AnnouncementsContent";

export default function AnnouncementsPage() {
  return (
    <AdaptiveShell activeRoute="announcements">
      <AnnouncementsContent />
    </AdaptiveShell>
  );
}
