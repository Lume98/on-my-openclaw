import { AntdRegistry } from "@ant-design/nextjs-registry";
import type { Metadata } from "next";
import { Bebas_Neue, Noto_Sans_SC, Roboto_Mono } from "next/font/google";
import { OpenclawProviders } from "@/components/openclaw/providers/openclaw-providers";
import "./globals.css";

const displayFont = Bebas_Neue({
  variable: "--font-display",
  weight: "400",
  subsets: ["latin"],
});

const bodyFont = Noto_Sans_SC({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

const monoFont = Roboto_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "OpenClaw Control UI",
  description: "OpenClaw 控制面板 Next.js 迁移版",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className={`${displayFont.variable} ${bodyFont.variable} ${monoFont.variable}`}>
        <AntdRegistry>
          <OpenclawProviders>{children}</OpenclawProviders>
        </AntdRegistry>
      </body>
    </html>
  );
}
