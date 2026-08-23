import type { Metadata } from "next";
import { NewsletterContent } from "@/components/NewsletterContent";

export const metadata: Metadata = {
  title: "Somaiya Sparsh Newsletters | PRO ALUMN",
  description: "Browse official alumni newsletter issues, university milestones, and community breakthroughs.",
};

export default function NewsletterPage() {
  return <NewsletterContent />;
}
