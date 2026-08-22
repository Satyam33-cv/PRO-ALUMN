import type { Metadata, Viewport } from "next";
import { Outfit, Plus_Jakarta_Sans, JetBrains_Mono, Inter } from "next/font/google";
import { AuthProvider } from "@/lib/context/AuthContext";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ScrollProgress } from "@/components/ui/Layout/ScrollProgress";
import { AnimatePage } from "@/lib/motion";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800"],
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://proalumn.io"),
  title: {
    default: "PRO ALUMN | AI-Powered Alumni Network",
    template: "%s | PRO ALUMN",
  },
  description: "AI-powered alumni career network. 384-dimensional matching connects you with verified alumni for referrals, mentorship, and career growth.",
  keywords: ["alumni", "networking", "mentorship", "career", "referrals", "AI matching"],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://proalumn.io",
    siteName: "PRO ALUMN",
    title: "PRO ALUMN | AI-Powered Alumni Network",
    description: "AI-powered alumni career network with 384-dimensional matching.",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "PRO ALUMN" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "PRO ALUMN | AI-Powered Alumni Network",
    description: "AI-powered alumni career network with 384-dimensional matching.",
    images: ["/og-image.png"],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F8FAFC" },
    { media: "(prefers-color-scheme: dark)", color: "#090D16" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable} ${jakarta.variable} ${jetbrains.variable}`} suppressHydrationWarning>
      <body className="font-sans antialiased">
        <ThemeProvider>
          <AuthProvider>
            <ScrollProgress color="blue" height={3} />
            <AnimatePage>{children}</AnimatePage>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}