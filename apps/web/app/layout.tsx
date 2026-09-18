import type { Metadata, Viewport } from "next";
import { Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import LayoutContent from "../components/LayoutContent";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#08090C",
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://provenance-web-two.vercel.app"),
  title: {
    default: "Provenance | Cryptographic Credential Protocol",
    template: "%s | Provenance",
  },
  description:
    "Mathematical certainty for institutional credentials. Tamper-evident, per-issuer append-only hash chains and zero-leakage verification.",
  keywords: [
    "credential verification",
    "tamper-evident",
    "cryptographic proofs",
    "hash chain",
    "merkle tree",
    "academic ledger",
  ],
  authors: [{ name: "Provenance Trust Network" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Provenance",
    title: "Provenance | Cryptographic Credential Protocol",
    description:
      "Mathematical certainty for institutional credentials. Tamper-evident, per-issuer append-only hash chains.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Provenance | Cryptographic Credential Protocol",
    description:
      "Mathematical certainty for institutional credentials. Tamper-evident, per-issuer append-only hash chains.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${jetbrainsMono.variable}`}>
      <body className="bg-obsidian text-slate-100 antialiased min-h-screen flex flex-col font-sans selection:bg-phosphor selection:text-obsidian">
        <AuthProvider>
          <Navbar />
          <LayoutContent>{children}</LayoutContent>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
