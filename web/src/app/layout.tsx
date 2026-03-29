import type { Metadata } from "next";
import { Noto_Sans_JP, Share_Tech_Mono } from "next/font/google";
import { StudioHeader } from "@/components/layout/StudioHeader";
import { TickerBar } from "@/components/layout/TickerBar";
import "./globals.css";

const noto = Noto_Sans_JP({
  variable: "--font-noto",
  subsets: ["latin"],
  weight: ["400", "700", "900"],
  display: "swap",
});

const shareTech = Share_Tech_Mono({
  variable: "--font-share-tech",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ウラドリ — 放送のウラ側、お届けします",
  description:
    "視聴者とAIが語る、放送のウラ側。放送情報・未放送素材・公開データをもとに、ソラジローAIがあなたの疑問に答えます。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className={`${noto.variable} ${shareTech.variable} h-full`}>
      <body
        className="min-h-full flex flex-col antialiased"
        style={{ fontFamily: "var(--font-noto), 'Hiragino Kaku Gothic ProN', sans-serif" }}
      >
        <StudioHeader />
        <main className="relative z-[1] flex-1 flex flex-col">{children}</main>
        <TickerBar />
      </body>
    </html>
  );
}
