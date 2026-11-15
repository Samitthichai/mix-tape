import type { Metadata, Viewport } from "next";
import { dmMono, fascinate, marker } from "@/lib/fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mixtape",
  description: "Record a mixtape of YouTube and Spotify songs, decorate the cassette, and send it to someone you like.",
};

export const viewport: Viewport = {
  themeColor: "#FFF6DE",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${fascinate.variable} ${marker.variable} ${dmMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
