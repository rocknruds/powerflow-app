import type { Metadata } from "next";
import localFont from "next/font/local";
import { Playfair_Display } from "next/font/google";
import "./globals.css";

const funnelSans = localFont({
  src: [
    {
      path: "../../fonts/Funnel_Sans/FunnelSans-VariableFont_wght.ttf",
      style: "normal",
    },
    {
      path: "../../fonts/Funnel_Sans/FunnelSans-Italic-VariableFont_wght.ttf",
      style: "italic",
    },
  ],
  variable: "--font-funnel",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif",
  weight: ["500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "World Analysis",
    template: "%s · World Analysis",
  },
  description: "Geopolitical briefings with map-driven analysis.",
  applicationName: "World Analysis",
  metadataBase: new URL("http://localhost:3000"),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${funnelSans.variable} ${playfair.variable}`}>
      <body className="font-sans antialiased bg-neutral-100 text-neutral-600">
        {children}
      </body>
    </html>
  );
}